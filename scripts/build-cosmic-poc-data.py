#!/usr/bin/env python3
"""
Build a browser-friendly cosmic POC dataset from:
- HYG v4.1 star catalog
- d3-celestial constellation lines
"""

import csv
import datetime as dt
import json
import math
import base64
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "cosmic" / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

HYG_PATH = Path("/tmp/hygdata_v41.csv")
CONST_PATH = Path("/tmp/constellations.lines.json")
OUT_PATH = DATA_DIR / "cosmic-poc-data.json"

HYG_URL = "https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv"
CONST_URL = "https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.lines.json"

MAG_LIMIT = 7.0
GRAPH_K = 6
MAX_NEIGHBOR_DEG = 8.0
CELL_DEG = 4.0
CONST_MATCH_MAX_DEG = 1.6
MILKY_MAG_LIMIT = 12.0
MILKY_MAP_W = 720
MILKY_MAP_H = 360
MILKY_SMOOTH_SIGMA_DEG = 1.2


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def normalize_ra(ra_deg: float) -> float:
    ra = ra_deg % 360.0
    return ra if ra >= 0 else ra + 360.0


def angular_distance_deg(ra1, dec1, ra2, dec2):
    """Great-circle distance (degrees)."""
    r1 = math.radians(ra1)
    d1 = math.radians(dec1)
    r2 = math.radians(ra2)
    d2 = math.radians(dec2)

    cos_sep = (
        math.sin(d1) * math.sin(d2)
        + math.cos(d1) * math.cos(d2) * math.cos(r1 - r2)
    )
    cos_sep = clamp(cos_sep, -1.0, 1.0)
    return math.degrees(math.acos(cos_sep))


def load_stars(path: Path):
    stars = []

    with path.open("r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                ra_hours = float(row["ra"])
                dec = float(row["dec"])
                mag = float(row["mag"])
            except (ValueError, KeyError, TypeError):
                continue

            if mag > MAG_LIMIT:
                continue
            if not (0.0 <= ra_hours <= 24.0 and -90.0 <= dec <= 90.0):
                continue
            if row.get("proper", "").strip().lower() == "sol":
                continue

            ra = normalize_ra(ra_hours * 15.0)
            ci_raw = row.get("ci", "")
            try:
                ci = float(ci_raw)
            except (ValueError, TypeError):
                ci = None

            dist_raw = row.get("dist", "")
            try:
                dist_pc = float(dist_raw)
                if dist_pc <= 0:
                    dist_pc = None
            except (ValueError, TypeError):
                dist_pc = None

            spect = (row.get("spect", "") or "").strip()[:12]

            name = row.get("proper", "").strip()
            con = row.get("con", "").strip()
            hip = row.get("hip", "").strip()
            bf = row.get("bf", "").strip()

            display_name = name
            if not display_name and bf and mag <= 2.8:
                display_name = bf

            stars.append(
                {
                    "ra": round(ra, 6),
                    "dec": round(dec, 6),
                    "mag": round(mag, 3),
                    "ci": round(ci, 3) if ci is not None else None,
                    "name": display_name,
                    "con": con,
                    "dist_pc": round(dist_pc, 4) if dist_pc is not None else None,
                    "spect": spect,
                    "hip": int(hip) if hip.isdigit() else None,
                }
            )

    # Keep deterministic ordering: brightest first, then RA/Dec.
    stars.sort(key=lambda s: (s["mag"], s["ra"], s["dec"]))
    return stars


def load_density_stars(path: Path, mag_limit: float):
    stars = []

    with path.open("r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                ra_hours = float(row["ra"])
                dec = float(row["dec"])
                mag = float(row["mag"])
            except (ValueError, KeyError, TypeError):
                continue

            if mag > mag_limit:
                continue
            if not (0.0 <= ra_hours <= 24.0 and -90.0 <= dec <= 90.0):
                continue

            ra = normalize_ra(ra_hours * 15.0)
            stars.append((ra, dec, mag))

    return stars


def gaussian_kernel_1d(sigma_px: float):
    sigma = max(0.45, sigma_px)
    radius = max(1, int(math.ceil(sigma * 3.0)))
    vals = []
    total = 0.0
    for i in range(-radius, radius + 1):
        w = math.exp(-0.5 * (i / sigma) * (i / sigma))
        vals.append(w)
        total += w
    return [v / total for v in vals], radius


def blur_wrap_x(data, width, height, kernel, radius):
    out = [0.0] * (width * height)
    for y in range(height):
        row = y * width
        for x in range(width):
            acc = 0.0
            for k in range(-radius, radius + 1):
                xx = (x + k) % width
                acc += data[row + xx] * kernel[k + radius]
            out[row + x] = acc
    return out


def blur_clamp_y(data, width, height, kernel, radius):
    out = [0.0] * (width * height)
    for y in range(height):
        for x in range(width):
            acc = 0.0
            for k in range(-radius, radius + 1):
                yy = y + k
                if yy < 0:
                    yy = 0
                elif yy >= height:
                    yy = height - 1
                acc += data[yy * width + x] * kernel[k + radius]
            out[y * width + x] = acc
    return out


def percentile(sorted_vals, p):
    if not sorted_vals:
        return 0.0
    p = clamp(p, 0.0, 100.0)
    idx = int(round((p / 100.0) * (len(sorted_vals) - 1)))
    return sorted_vals[idx]


def build_milky_way_density(path: Path):
    stars = load_density_stars(path, MILKY_MAG_LIMIT)
    w = MILKY_MAP_W
    h = MILKY_MAP_H
    grid = [0.0] * (w * h)

    for ra, dec, mag in stars:
        x = int((ra / 360.0) * w) % w
        y = int(((dec + 90.0) / 180.0) * h)
        if y < 0:
            y = 0
        elif y >= h:
            y = h - 1

        m = clamp(mag, -1.5, MILKY_MAG_LIMIT)
        flux = 10 ** (-0.4 * (m - 6.0))
        # Compress dynamic range so dense faint regions dominate over a handful of bright stars.
        weight = 0.18 + (flux ** 0.28)
        grid[y * w + x] += weight

    sigma_px = (MILKY_SMOOTH_SIGMA_DEG / 360.0) * w
    kernel, radius = gaussian_kernel_1d(sigma_px)
    smooth = blur_wrap_x(grid, w, h, kernel, radius)
    smooth = blur_clamp_y(smooth, w, h, kernel, radius)

    sorted_vals = sorted(smooth)
    lo = percentile(sorted_vals, 35.0)
    hi = percentile(sorted_vals, 99.7)
    if hi <= lo:
        hi = lo + 1e-9

    out = bytearray(w * h)
    for i, v in enumerate(smooth):
        t = (v - lo) / (hi - lo)
        t = clamp(t, 0.0, 1.0)
        t = t ** 0.78
        out[i] = int(round(t * 255.0))

    encoded = base64.b64encode(bytes(out)).decode("ascii")
    return {
        "width": w,
        "height": h,
        "encoding": "base64-u8",
        "data": encoded,
        "source_mag_limit": MILKY_MAG_LIMIT,
    }


def build_grid(stars, cell_deg):
    ra_cells = int(math.ceil(360.0 / cell_deg))
    dec_cells = int(math.ceil(180.0 / cell_deg))

    grid = {}
    for i, s in enumerate(stars):
        cx = int(s["ra"] // cell_deg) % ra_cells
        cy = int((s["dec"] + 90.0) // cell_deg)
        cy = max(0, min(dec_cells - 1, cy))
        grid.setdefault((cx, cy), []).append(i)

    return grid, ra_cells, dec_cells


def nearby_indices(grid, ra_cells, dec_cells, cell_deg, ra, dec, rings=2):
    cx = int(ra // cell_deg) % ra_cells
    cy = int((dec + 90.0) // cell_deg)
    cy = max(0, min(dec_cells - 1, cy))

    out = []
    for dy in range(-rings, rings + 1):
        ny = cy + dy
        if ny < 0 or ny >= dec_cells:
            continue
        for dx in range(-rings, rings + 1):
            nx = (cx + dx) % ra_cells
            out.extend(grid.get((nx, ny), ()))
    return out


def add_edge(edge_map, a, b, dist, edge_type):
    if a == b:
        return
    if a > b:
        a, b = b, a
    key = (a, b)
    existing = edge_map.get(key)
    if existing is None:
        edge_map[key] = [dist, edge_type]
        return

    # Keep shortest weight and merge type bitmask.
    existing[0] = min(existing[0], dist)
    existing[1] = existing[1] | edge_type


def build_local_edges(stars, grid, ra_cells, dec_cells):
    edge_map = {}

    for i, s in enumerate(stars):
        candidates = nearby_indices(
            grid,
            ra_cells,
            dec_cells,
            CELL_DEG,
            s["ra"],
            s["dec"],
            rings=2,
        )

        dists = []
        for j in candidates:
            if j == i:
                continue
            t = stars[j]
            dist = angular_distance_deg(s["ra"], s["dec"], t["ra"], t["dec"])
            if dist <= MAX_NEIGHBOR_DEG:
                dists.append((dist, j))

        dists.sort(key=lambda item: item[0])
        for dist, j in dists[:GRAPH_K]:
            add_edge(edge_map, i, j, round(dist, 4), 1)

    return edge_map


def ra_from_lon(lon):
    return normalize_ra(lon if lon >= 0 else lon + 360.0)


def load_constellation_segments(path: Path):
    data = json.loads(path.read_text(encoding="utf-8"))
    features = data.get("features", [])

    segments = []
    for feat in features:
        cid = feat.get("id", "?")
        rank = feat.get("properties", {}).get("rank", "")
        geometry = feat.get("geometry", {})
        coords = geometry.get("coordinates", [])
        if geometry.get("type") != "MultiLineString":
            continue

        for line in coords:
            for idx in range(len(line) - 1):
                lon1, dec1 = line[idx]
                lon2, dec2 = line[idx + 1]
                segments.append(
                    {
                        "cid": cid,
                        "rank": int(rank) if str(rank).isdigit() else None,
                        "ra1": round(ra_from_lon(float(lon1)), 5),
                        "dec1": round(float(dec1), 5),
                        "ra2": round(ra_from_lon(float(lon2)), 5),
                        "dec2": round(float(dec2), 5),
                    }
                )

    return segments


def find_nearest_star_idx(stars, grid, ra_cells, dec_cells, ra, dec):
    best_idx = None
    best_dist = float("inf")

    for rings in (1, 2, 3):
        candidates = nearby_indices(grid, ra_cells, dec_cells, CELL_DEG, ra, dec, rings=rings)
        if not candidates:
            continue

        for idx in candidates:
            s = stars[idx]
            dist = angular_distance_deg(ra, dec, s["ra"], s["dec"])
            if dist < best_dist:
                best_dist = dist
                best_idx = idx

        if best_idx is not None and best_dist <= CONST_MATCH_MAX_DEG:
            break

    return best_idx, best_dist


def add_constellation_edges(stars, grid, ra_cells, dec_cells, segments, edge_map):
    mapped = 0
    for seg in segments:
        a_idx, a_dist = find_nearest_star_idx(
            stars,
            grid,
            ra_cells,
            dec_cells,
            seg["ra1"],
            seg["dec1"],
        )
        b_idx, b_dist = find_nearest_star_idx(
            stars,
            grid,
            ra_cells,
            dec_cells,
            seg["ra2"],
            seg["dec2"],
        )

        if a_idx is None or b_idx is None:
            continue
        if a_dist > CONST_MATCH_MAX_DEG or b_dist > CONST_MATCH_MAX_DEG:
            continue

        sa = stars[a_idx]
        sb = stars[b_idx]
        dist = angular_distance_deg(sa["ra"], sa["dec"], sb["ra"], sb["dec"])
        add_edge(edge_map, a_idx, b_idx, round(dist, 4), 2)
        mapped += 1

    return mapped


def largest_component(node_count, edge_map):
    adj = [[] for _ in range(node_count)]
    for (a, b), (_, _) in edge_map.items():
        adj[a].append(b)
        adj[b].append(a)

    visited = [False] * node_count
    best = []

    for i in range(node_count):
        if visited[i]:
            continue
        stack = [i]
        comp = []
        visited[i] = True
        while stack:
            cur = stack.pop()
            comp.append(cur)
            for nxt in adj[cur]:
                if not visited[nxt]:
                    visited[nxt] = True
                    stack.append(nxt)
        if len(comp) > len(best):
            best = comp

    return set(best)


def remap_to_component(stars, edge_map, keep_set):
    old_to_new = {}
    new_stars = []
    for old_idx, star in enumerate(stars):
        if old_idx in keep_set:
            old_to_new[old_idx] = len(new_stars)
            new_stars.append(star)

    new_edges = []
    for (a, b), (dist, edge_type) in edge_map.items():
        if a not in keep_set or b not in keep_set:
            continue
        na = old_to_new[a]
        nb = old_to_new[b]
        new_edges.append([na, nb, dist, edge_type])

    new_edges.sort(key=lambda e: (e[0], e[1]))
    return new_stars, new_edges


def make_output(stars, edges, segments, milky_map):
    # Reduce payload size with compact array structures.
    stars_out = [
        [
            s["ra"],
            s["dec"],
            s["mag"],
            s["ci"],
            s["name"],
            s["con"],
            s["dist_pc"],
            s["spect"],
        ]
        for s in stars
    ]

    # Convert type bitmask -> tiny integer for client-side styling.
    # 1=local, 2=constellation, 3=both.
    edges_out = edges

    # Keep raw constellation segments for faithful drawing.
    segments_out = [
        [seg["ra1"], seg["dec1"], seg["ra2"], seg["dec2"], seg["cid"]]
        for seg in segments
    ]

    bright_candidates = [i for i, s in enumerate(stars) if s["mag"] <= 4.5]
    named_candidates = [i for i, s in enumerate(stars) if s["name"]]

    return {
        "meta": {
            "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
            "sources": {
                "stars": "HYG Database v4.1 (astronexus/HYG-Database)",
                "constellations": "d3-celestial constellations.lines.json",
            },
            "filters": {
                "mag_limit": MAG_LIMIT,
                "graph_k": GRAPH_K,
                "max_neighbor_deg": MAX_NEIGHBOR_DEG,
                "constellation_match_max_deg": CONST_MATCH_MAX_DEG,
                "milky_map_mag_limit": MILKY_MAG_LIMIT,
            },
            "counts": {
                "stars": len(stars_out),
                "edges": len(edges_out),
                "constellation_segments": len(segments_out),
                "bright_candidates": len(bright_candidates),
                "named_candidates": len(named_candidates),
            },
            "star_schema": ["ra_deg", "dec_deg", "mag", "ci", "name", "constellation", "distance_pc", "spectral"],
            "edge_schema": ["from_idx", "to_idx", "distance_deg", "type"],
            "segment_schema": ["ra1_deg", "dec1_deg", "ra2_deg", "dec2_deg", "constellation_id"],
            "milky_way_density_schema": ["width", "height", "encoding", "data", "source_mag_limit"],
        },
        "stars": stars_out,
        "edges": edges_out,
        "constellation_segments": segments_out,
        "bright_candidates": bright_candidates,
        "named_candidates": named_candidates,
        "milky_way_density": milky_map,
    }


def main():
    if not HYG_PATH.exists():
        print(f"Downloading HYG catalog to {HYG_PATH} ...")
        urllib.request.urlretrieve(HYG_URL, HYG_PATH)
    if not CONST_PATH.exists():
        print(f"Downloading constellation lines to {CONST_PATH} ...")
        urllib.request.urlretrieve(CONST_URL, CONST_PATH)

    print("Loading stars...")
    stars = load_stars(HYG_PATH)
    print(f"Loaded {len(stars)} stars (mag <= {MAG_LIMIT}).")

    print("Building spatial index...")
    grid, ra_cells, dec_cells = build_grid(stars, CELL_DEG)

    print("Building local graph edges...")
    edge_map = build_local_edges(stars, grid, ra_cells, dec_cells)
    print(f"Local edges: {len(edge_map)}")

    print("Loading constellation segments...")
    segments = load_constellation_segments(CONST_PATH)
    print(f"Constellation segments: {len(segments)}")

    print("Mapping constellation segments to nearest stars...")
    mapped = add_constellation_edges(stars, grid, ra_cells, dec_cells, segments, edge_map)
    print(f"Mapped constellation edges: {mapped}")
    print(f"Combined edge count: {len(edge_map)}")

    print("Building Milky Way density map from full catalog...")
    milky_map = build_milky_way_density(HYG_PATH)
    print(
        f"Milky Way density map: {milky_map['width']}x{milky_map['height']} "
        f"(mag <= {milky_map['source_mag_limit']})"
    )

    print("Keeping largest connected component...")
    keep = largest_component(len(stars), edge_map)
    print(f"Largest component size: {len(keep)} / {len(stars)}")

    stars2, edges2 = remap_to_component(stars, edge_map, keep)
    out = make_output(stars2, edges2, segments, milky_map)

    OUT_PATH.write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {OUT_PATH} ({OUT_PATH.stat().st_size / (1024 * 1024):.2f} MiB)")


if __name__ == "__main__":
    main()
