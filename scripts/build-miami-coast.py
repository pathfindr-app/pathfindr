"""Offline coastline polygonization. Requires Shapely 2.x only when regenerating.
Input: pinned OSM coastline ways, land-left / water-right orientation.
Output is checked in; normal npm build has no Python or network dependency.
"""
import json
from pathlib import Path
from shapely.geometry import LineString, Point, box, mapping
from shapely.ops import polygonize, unary_union

root = Path(__file__).resolve().parent.parent
raw = json.loads((root / 'data/cities/miami-coastline-source.json').read_text())
assert not raw.get('remark')
bounds = box(-80.210, 25.755, -80.175, 25.797)
lines, segments = [], []
for way in raw['elements']:
    coords = [(p['lon'], p['lat']) for p in way.get('geometry', [])]
    if len(coords) < 2:
        continue
    clipped = LineString(coords).intersection(bounds)
    if not clipped.is_empty:
        lines.append(clipped)
    for a, b in zip(coords, coords[1:]):
        if a != b:
            segments.append((LineString([a, b]), a, b))

faces = list(polygonize(unary_union([bounds.boundary, *lines])))
water = []
for face in faces:
    p = face.representative_point()
    _, a, b = min(segments, key=lambda s: s[0].distance(p))
    cross = (b[0]-a[0])*(p.y-a[1])-(b[1]-a[1])*(p.x-a[0])
    if cross < 0:
        water.append(face)
result = unary_union(water)
assert result.is_valid and not result.is_empty
assert result.contains(Point(-80.181, 25.773)), 'Biscayne Bay must be water'
assert not result.contains(Point(-80.1865, 25.775)), 'Bayfront Park must remain land'
assert not result.contains(Point(-80.19, 25.766)), 'Brickell must remain land'
output = {'type':'Feature', 'properties':{'source':'OpenStreetMap coastline', 'attribution':'© OpenStreetMap contributors · ODbL 1.0', 'sourceTimestamp':raw.get('osm3s',{}).get('timestamp_osm_base')}, 'geometry':mapping(result)}
(root / 'data/cities/miami-coastal-water.json').write_text(json.dumps(output, separators=(',',':'))+'\n')
print(f'Coastal water: {len(water)} water faces / {len(faces)} total faces; valid geometry')
