"""
A* Search Algorithm Visualizer using OpenStreetMap data in Blender 4.5
Renders with Eevee - 2D top-down view of road networks with animated pathfinding

Author: Claude
"""

import bpy
import bmesh
import requests
import json
import math
import heapq
from collections import defaultdict
from mathutils import Vector

# =============================================================================
# CONFIGURATION
# =============================================================================

class Config:
    """Central configuration for the visualizer"""

    # API Endpoints
    NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
    OVERPASS_URL = "https://overpass-api.de/api/interpreter"

    # Request settings
    USER_AGENT = "BlenderAStarVisualizer/1.0"
    REQUEST_TIMEOUT = 60

    # Mesh settings
    MESH_NAME = "RoadNetwork"
    MESH_SCALE = 0.001  # Scale down coordinates (meters to Blender units)
    ROAD_WIDTH = 0.015  # Bevel depth for road curves

    # Animation settings
    EXPLORATION_DURATION = 300  # frames for full exploration
    PATH_REVEAL_START = 320    # frame when path starts revealing
    PATH_REVEAL_DURATION = 100  # frames to trace the final path
    TOTAL_ANIMATION_FRAMES = 500

    # Colors (RGBA) - Exploration heat gradient
    COLOR_UNEXPLORED = (0.02, 0.02, 0.05, 1.0)      # Dark blue-black
    COLOR_HOT = (1.0, 0.3, 0.05, 1.0)               # Bright orange-red
    COLOR_WARM = (0.9, 0.6, 0.1, 1.0)               # Orange-yellow
    COLOR_COOL = (0.1, 0.4, 0.8, 1.0)               # Blue
    COLOR_COLD = (0.05, 0.15, 0.4, 1.0)             # Dark blue

    # Final path colors
    COLOR_PATH_CORE = (0.0, 0.9, 1.0, 1.0)          # Electric cyan
    COLOR_PATH_GLOW = (0.4, 0.95, 1.0, 1.0)         # Bright cyan-white

    # Emission strengths
    EMISSION_UNEXPLORED = 0.1
    EMISSION_EXPLORING = 8.0
    EMISSION_EXPLORED = 1.5
    EMISSION_PATH = 15.0
    EMISSION_PATH_PULSE = 25.0


# =============================================================================
# GLOBAL STATE
# =============================================================================

class VisualizerState:
    """Holds the current state of the visualizer"""

    def __init__(self):
        self.mesh_object = None  # Selection mesh for edit mode
        self.curve_object = None  # Rendered curve object
        self.graph = {}  # adjacency list: node_id -> [(neighbor_id, weight), ...]
        self.node_positions = {}  # node_id -> (x, y)
        self.vertex_to_node = {}  # vertex_index -> node_id
        self.node_to_vertex = {}  # node_id -> vertex_index
        self.node_to_curve_points = {}  # node_id -> list of curve point indices
        self.start_node = None
        self.end_node = None
        self.discovery_times = {}  # node_id -> discovery_frame
        self.final_path = []  # list of node_ids
        self.path_vertex_order = {}  # vertex_index -> order in path (0 to 1)

    def reset(self):
        self.__init__()

# Global state instance
state = VisualizerState()


# =============================================================================
# OSM DATA FETCHING
# =============================================================================

def geocode_location(query):
    """
    Use Nominatim to geocode a location query.
    Returns (lat, lon, bounding_box) or None if not found.
    """
    params = {
        "q": query,
        "format": "json",
        "limit": 1,
        "addressdetails": 1,
        "extratags": 1,
    }
    headers = {"User-Agent": Config.USER_AGENT}

    try:
        response = requests.get(
            Config.NOMINATIM_URL,
            params=params,
            headers=headers,
            timeout=Config.REQUEST_TIMEOUT
        )
        response.raise_for_status()
        data = response.json()

        if not data:
            print(f"No results found for: {query}")
            return None

        result = data[0]
        lat = float(result["lat"])
        lon = float(result["lon"])

        # Get bounding box [south, north, west, east]
        bbox = result.get("boundingbox", None)
        if bbox:
            bbox = [float(b) for b in bbox]
        else:
            # Create a default bounding box (~1km radius)
            delta = 0.01
            bbox = [lat - delta, lat + delta, lon - delta, lon + delta]

        print(f"Found: {result.get('display_name', query)}")
        print(f"Center: ({lat}, {lon})")
        print(f"Bounding box: {bbox}")

        return lat, lon, bbox

    except requests.RequestException as e:
        print(f"Geocoding error: {e}")
        return None


def fetch_road_network(bbox):
    """
    Fetch road network data from Overpass API.
    bbox: [south, north, west, east]
    Returns (nodes, ways) dictionaries.
    """
    south, north, west, east = bbox

    # Overpass QL query for road network
    query = f"""
    [out:json][timeout:60];
    (
      way["highway"]["highway"!~"footway|path|steps|pedestrian|cycleway|service"]
        ({south},{west},{north},{east});
    );
    out body;
    >;
    out skel qt;
    """

    print("Fetching road network from Overpass API...")
    print(f"Bounding box: S={south}, N={north}, W={west}, E={east}")

    try:
        response = requests.post(
            Config.OVERPASS_URL,
            data={"data": query},
            headers={"User-Agent": Config.USER_AGENT},
            timeout=Config.REQUEST_TIMEOUT
        )
        response.raise_for_status()
        data = response.json()

        nodes = {}
        ways = []

        for element in data.get("elements", []):
            if element["type"] == "node":
                nodes[element["id"]] = {
                    "lat": element["lat"],
                    "lon": element["lon"]
                }
            elif element["type"] == "way":
                ways.append({
                    "id": element["id"],
                    "nodes": element.get("nodes", []),
                    "tags": element.get("tags", {})
                })

        print(f"Fetched {len(nodes)} nodes and {len(ways)} ways")
        return nodes, ways

    except requests.RequestException as e:
        print(f"Overpass API error: {e}")
        return None, None


def latlon_to_xy(lat, lon, center_lat, center_lon):
    """
    Convert lat/lon to local XY coordinates (in meters).
    Uses equirectangular projection centered on the center point.
    """
    # Earth radius in meters
    R = 6371000

    # Convert to radians
    lat_rad = math.radians(lat)
    lon_rad = math.radians(lon)
    center_lat_rad = math.radians(center_lat)
    center_lon_rad = math.radians(center_lon)

    # Equirectangular projection
    x = R * (lon_rad - center_lon_rad) * math.cos(center_lat_rad)
    y = R * (lat_rad - center_lat_rad)

    return x, y


# =============================================================================
# MESH & CURVE CREATION
# =============================================================================

def create_road_network(nodes, ways, center_lat, center_lon):
    """
    Create the road network as curves for rendering and a mesh for selection.
    Returns (curve_object, mesh_object).
    """
    global state

    # Remove existing objects if present
    for obj_name in [Config.MESH_NAME, Config.MESH_NAME + "_Selection"]:
        if obj_name in bpy.data.objects:
            bpy.data.objects.remove(bpy.data.objects[obj_name], do_unlink=True)

    # Remove existing data
    if Config.MESH_NAME in bpy.data.curves:
        bpy.data.curves.remove(bpy.data.curves[Config.MESH_NAME])
    if Config.MESH_NAME + "_Selection" in bpy.data.meshes:
        bpy.data.meshes.remove(bpy.data.meshes[Config.MESH_NAME + "_Selection"])

    # Track which nodes are actually used in ways
    used_nodes = set()
    for way in ways:
        for node_id in way["nodes"]:
            used_nodes.add(node_id)

    # Convert node positions
    state.node_positions = {}
    for node_id in used_nodes:
        if node_id not in nodes:
            continue
        node = nodes[node_id]
        x, y = latlon_to_xy(node["lat"], node["lon"], center_lat, center_lon)
        x *= Config.MESH_SCALE
        y *= Config.MESH_SCALE
        state.node_positions[node_id] = (x, y)

    # Build graph and collect edges
    edge_set = set()
    state.graph = defaultdict(list)
    edges_to_create = []

    for way in ways:
        way_nodes = way["nodes"]
        for i in range(len(way_nodes) - 1):
            node_a = way_nodes[i]
            node_b = way_nodes[i + 1]

            if node_a not in state.node_positions or node_b not in state.node_positions:
                continue

            edge_key = tuple(sorted([node_a, node_b]))
            if edge_key in edge_set:
                continue
            edge_set.add(edge_key)

            edges_to_create.append((node_a, node_b))

            # Calculate edge weight
            pos_a = state.node_positions[node_a]
            pos_b = state.node_positions[node_b]
            weight = math.sqrt((pos_a[0] - pos_b[0])**2 + (pos_a[1] - pos_b[1])**2)

            state.graph[node_a].append((node_b, weight))
            state.graph[node_b].append((node_a, weight))

    # === CREATE CURVE OBJECT FOR RENDERING ===
    curve_data = bpy.data.curves.new(Config.MESH_NAME, type='CURVE')
    curve_data.dimensions = '3D'
    curve_data.resolution_u = 1
    curve_data.bevel_depth = Config.ROAD_WIDTH
    curve_data.bevel_resolution = 0  # Flat roads
    curve_data.use_fill_caps = True

    # Track point indices for attribute mapping
    point_index = 0
    state.node_to_curve_points = defaultdict(list)  # node_id -> list of point indices

    for node_a, node_b in edges_to_create:
        pos_a = state.node_positions[node_a]
        pos_b = state.node_positions[node_b]

        # Create a spline for each edge
        spline = curve_data.splines.new('POLY')
        spline.points.add(1)  # Start with 2 points total

        spline.points[0].co = (pos_a[0], pos_a[1], 0, 1)
        spline.points[1].co = (pos_b[0], pos_b[1], 0, 1)

        # Track which curve points correspond to which nodes
        state.node_to_curve_points[node_a].append(point_index)
        state.node_to_curve_points[node_b].append(point_index + 1)
        point_index += 2

    curve_obj = bpy.data.objects.new(Config.MESH_NAME, curve_data)
    bpy.context.collection.objects.link(curve_obj)

    # === CREATE MESH OBJECT FOR SELECTION (edit mode) ===
    mesh_data = bpy.data.meshes.new(Config.MESH_NAME + "_Selection")
    mesh_obj = bpy.data.objects.new(Config.MESH_NAME + "_Selection", mesh_data)
    bpy.context.collection.objects.link(mesh_obj)

    # Build selection mesh
    bm = bmesh.new()
    node_to_bmvert = {}

    for node_id, pos in state.node_positions.items():
        vert = bm.verts.new((pos[0], pos[1], 0))
        node_to_bmvert[node_id] = vert

    bm.verts.ensure_lookup_table()

    for node_a, node_b in edges_to_create:
        if node_a in node_to_bmvert and node_b in node_to_bmvert:
            try:
                bm.edges.new((node_to_bmvert[node_a], node_to_bmvert[node_b]))
            except ValueError:
                pass

    bm.to_mesh(mesh_data)
    bm.free()

    # Build vertex index mappings for selection mesh
    bm = bmesh.new()
    bm.from_mesh(mesh_data)
    bm.verts.ensure_lookup_table()

    for node_id, pos in state.node_positions.items():
        for v in bm.verts:
            if abs(v.co.x - pos[0]) < 0.0001 and abs(v.co.y - pos[1]) < 0.0001:
                state.vertex_to_node[v.index] = node_id
                state.node_to_vertex[node_id] = v.index
                break

    bm.free()

    # Hide selection mesh from render but keep it for edit mode selection
    mesh_obj.hide_render = True
    mesh_obj.display_type = 'WIRE'

    # Store references
    state.mesh_object = mesh_obj  # For vertex selection
    state.curve_object = curve_obj  # For rendering

    print(f"Created curve with {len(edges_to_create)} road segments")
    print(f"Created selection mesh with {len(mesh_data.vertices)} vertices")

    return curve_obj, mesh_obj


def setup_curve_attributes(curve_obj):
    """
    Set up custom attributes on the curve for animation.
    Curves in Blender 4.x support attributes on POINT domain.
    """
    curve_data = curve_obj.data

    # Remove existing attributes
    for attr_name in ["discovery_time", "on_path", "path_order"]:
        if attr_name in curve_data.attributes:
            curve_data.attributes.remove(curve_data.attributes[attr_name])

    # Count total points
    total_points = sum(len(spline.points) for spline in curve_data.splines)

    # Create attributes on POINT domain
    curve_data.attributes.new(name="discovery_time", type='FLOAT', domain='POINT')
    curve_data.attributes.new(name="on_path", type='FLOAT', domain='POINT')
    curve_data.attributes.new(name="path_order", type='FLOAT', domain='POINT')

    # Initialize with default values
    discovery_attr = curve_data.attributes["discovery_time"]
    on_path_attr = curve_data.attributes["on_path"]
    path_order_attr = curve_data.attributes["path_order"]

    for i in range(total_points):
        discovery_attr.data[i].value = -1.0
        on_path_attr.data[i].value = 0.0
        path_order_attr.data[i].value = 0.0

    print(f"Curve attributes initialized for {total_points} points")


# =============================================================================
# A* ALGORITHM
# =============================================================================

def heuristic(node_a, node_b):
    """Euclidean distance heuristic for A*"""
    pos_a = state.node_positions.get(node_a)
    pos_b = state.node_positions.get(node_b)

    if not pos_a or not pos_b:
        return float('inf')

    return math.sqrt((pos_a[0] - pos_b[0])**2 + (pos_a[1] - pos_b[1])**2)


def astar_search(start_node, end_node):
    """
    Perform A* search from start to end.
    Records discovery times for animation.
    Returns (path, discovery_order) or (None, discovery_order) if no path.
    """
    global state

    if start_node not in state.graph or end_node not in state.graph:
        print("Start or end node not in graph!")
        return None, []

    # Priority queue: (f_score, counter, node)
    counter = 0
    open_set = [(0, counter, start_node)]

    came_from = {}
    g_score = {start_node: 0}
    f_score = {start_node: heuristic(start_node, end_node)}

    open_set_hash = {start_node}
    discovery_order = []  # List of (node, order) for animation timing
    discovered = set()

    while open_set:
        current = heapq.heappop(open_set)[2]
        open_set_hash.discard(current)

        # Record discovery
        if current not in discovered:
            discovered.add(current)
            discovery_order.append(current)

        if current == end_node:
            # Reconstruct path
            path = [current]
            while current in came_from:
                current = came_from[current]
                path.append(current)
            path.reverse()

            print(f"Path found! Length: {len(path)} nodes")
            return path, discovery_order

        for neighbor, weight in state.graph[current]:
            tentative_g = g_score[current] + weight

            if neighbor not in g_score or tentative_g < g_score[neighbor]:
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                f_score[neighbor] = tentative_g + heuristic(neighbor, end_node)

                if neighbor not in open_set_hash:
                    counter += 1
                    heapq.heappush(open_set, (f_score[neighbor], counter, neighbor))
                    open_set_hash.add(neighbor)

    print("No path found!")
    return None, discovery_order


def apply_discovery_times(discovery_order):
    """
    Apply discovery times to curve point attributes based on A* exploration order.
    Maps discovery order to frame numbers for smooth animation.
    """
    global state

    if not state.curve_object:
        return

    curve_data = state.curve_object.data
    discovery_attr = curve_data.attributes["discovery_time"]

    total_discoveries = len(discovery_order)
    if total_discoveries == 0:
        return

    # Map each discovery to a frame number
    for i, node_id in enumerate(discovery_order):
        # Calculate frame based on discovery order
        progress = i / max(total_discoveries - 1, 1)
        frame = int(progress * Config.EXPLORATION_DURATION)

        # Add some organic variation
        variation = math.sin(i * 0.5) * 3 + math.cos(i * 0.3) * 2
        frame = max(0, frame + int(variation))

        state.discovery_times[node_id] = frame

        # Apply to all curve points for this node
        if node_id in state.node_to_curve_points:
            for point_idx in state.node_to_curve_points[node_id]:
                if point_idx < len(discovery_attr.data):
                    discovery_attr.data[point_idx].value = float(frame)

    curve_data.update_tag()
    print(f"Applied discovery times for {total_discoveries} nodes")


def apply_path_attributes(path):
    """
    Apply path attributes for final path animation on curves.
    """
    global state

    if not state.curve_object or not path:
        return

    curve_data = state.curve_object.data
    on_path_attr = curve_data.attributes["on_path"]
    path_order_attr = curve_data.attributes["path_order"]

    state.final_path = path
    total_path_nodes = len(path)

    for i, node_id in enumerate(path):
        # Path order (0 at start, 1 at end)
        order = i / max(total_path_nodes - 1, 1)

        # Apply to all curve points for this node
        if node_id in state.node_to_curve_points:
            for point_idx in state.node_to_curve_points[node_id]:
                if point_idx < len(on_path_attr.data):
                    on_path_attr.data[point_idx].value = 1.0
                    path_order_attr.data[point_idx].value = order

    curve_data.update_tag()
    print(f"Applied path attributes for {total_path_nodes} path nodes")


# =============================================================================
# SHADER SETUP
# =============================================================================

def create_animated_material():
    """
    Create the emission material with attribute-driven animation.
    Uses shader nodes to read vertex attributes and compute colors.
    """
    mat_name = "AStarVisualizerMaterial"

    # Remove existing material
    if mat_name in bpy.data.materials:
        bpy.data.materials.remove(bpy.data.materials[mat_name])

    # Create new material
    mat = bpy.data.materials.new(name=mat_name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    # Clear default nodes
    nodes.clear()

    # Create nodes
    # Output
    output = nodes.new('ShaderNodeOutputMaterial')
    output.location = (1200, 0)

    # Mix shader for combining exploration and path
    mix_final = nodes.new('ShaderNodeMixShader')
    mix_final.location = (1000, 0)

    # === EXPLORATION SHADER ===

    # Attribute: discovery_time
    attr_discovery = nodes.new('ShaderNodeAttribute')
    attr_discovery.attribute_name = "discovery_time"
    attr_discovery.attribute_type = 'GEOMETRY'
    attr_discovery.location = (-800, 200)

    # Value node with driver for current frame
    frame_value = nodes.new('ShaderNodeValue')
    frame_value.location = (-800, 50)
    frame_value.outputs[0].default_value = 0

    # Add driver for current frame
    driver = frame_value.outputs[0].driver_add("default_value")
    driver.driver.expression = "frame"

    # Calculate age: frame - discovery_time
    subtract_age = nodes.new('ShaderNodeMath')
    subtract_age.operation = 'SUBTRACT'
    subtract_age.location = (-600, 150)

    # Check if discovered (discovery_time >= 0)
    compare_discovered = nodes.new('ShaderNodeMath')
    compare_discovered.operation = 'COMPARE'
    compare_discovered.inputs[1].default_value = 0  # Compare to 0
    compare_discovered.inputs[2].default_value = 0.5  # Epsilon
    compare_discovered.location = (-600, 0)

    # Greater than check for discovered
    greater_than = nodes.new('ShaderNodeMath')
    greater_than.operation = 'GREATER_THAN'
    greater_than.inputs[1].default_value = -0.5
    greater_than.location = (-600, -100)

    # Normalize age for color ramp (age / duration)
    divide_normalize = nodes.new('ShaderNodeMath')
    divide_normalize.operation = 'DIVIDE'
    divide_normalize.inputs[1].default_value = Config.EXPLORATION_DURATION
    divide_normalize.location = (-400, 150)

    # Clamp normalized age
    clamp_age = nodes.new('ShaderNodeClamp')
    clamp_age.inputs['Min'].default_value = 0
    clamp_age.inputs['Max'].default_value = 1
    clamp_age.location = (-200, 150)

    # Color ramp for heat gradient
    color_ramp = nodes.new('ShaderNodeValToRGB')
    color_ramp.location = (0, 200)

    # Set up heat gradient colors
    color_ramp.color_ramp.elements[0].position = 0.0
    color_ramp.color_ramp.elements[0].color = Config.COLOR_HOT

    color_ramp.color_ramp.elements[1].position = 1.0
    color_ramp.color_ramp.elements[1].color = Config.COLOR_COLD

    # Add intermediate colors
    elem1 = color_ramp.color_ramp.elements.new(0.2)
    elem1.color = Config.COLOR_WARM

    elem2 = color_ramp.color_ramp.elements.new(0.5)
    elem2.color = Config.COLOR_COOL

    # Emission strength based on age (brighter when fresh)
    emission_ramp = nodes.new('ShaderNodeValToRGB')
    emission_ramp.location = (0, 0)
    emission_ramp.color_ramp.elements[0].position = 0.0
    emission_ramp.color_ramp.elements[0].color = (1, 1, 1, 1)  # Bright
    emission_ramp.color_ramp.elements[1].position = 1.0
    emission_ramp.color_ramp.elements[1].color = (0.2, 0.2, 0.2, 1)  # Dim

    # Multiply for emission strength
    emission_strength_mult = nodes.new('ShaderNodeMath')
    emission_strength_mult.operation = 'MULTIPLY'
    emission_strength_mult.inputs[1].default_value = Config.EMISSION_EXPLORING
    emission_strength_mult.location = (200, 0)

    # Exploration emission shader
    emission_explore = nodes.new('ShaderNodeEmission')
    emission_explore.location = (400, 150)

    # Unexplored emission shader (dark)
    emission_unexplored = nodes.new('ShaderNodeEmission')
    emission_unexplored.inputs['Color'].default_value = Config.COLOR_UNEXPLORED
    emission_unexplored.inputs['Strength'].default_value = Config.EMISSION_UNEXPLORED
    emission_unexplored.location = (400, -50)

    # Mix between unexplored and explored
    mix_explored = nodes.new('ShaderNodeMixShader')
    mix_explored.location = (600, 100)

    # === FINAL PATH SHADER ===

    # Attribute: on_path
    attr_on_path = nodes.new('ShaderNodeAttribute')
    attr_on_path.attribute_name = "on_path"
    attr_on_path.attribute_type = 'GEOMETRY'
    attr_on_path.location = (-800, -300)

    # Attribute: path_order
    attr_path_order = nodes.new('ShaderNodeAttribute')
    attr_path_order.attribute_name = "path_order"
    attr_path_order.attribute_type = 'GEOMETRY'
    attr_path_order.location = (-800, -450)

    # Calculate path reveal progress
    # (frame - PATH_REVEAL_START) / PATH_REVEAL_DURATION
    subtract_path_start = nodes.new('ShaderNodeMath')
    subtract_path_start.operation = 'SUBTRACT'
    subtract_path_start.inputs[1].default_value = Config.PATH_REVEAL_START
    subtract_path_start.location = (-600, -350)

    divide_path_progress = nodes.new('ShaderNodeMath')
    divide_path_progress.operation = 'DIVIDE'
    divide_path_progress.inputs[1].default_value = Config.PATH_REVEAL_DURATION
    divide_path_progress.location = (-400, -350)

    # Clamp path progress
    clamp_path_progress = nodes.new('ShaderNodeClamp')
    clamp_path_progress.inputs['Min'].default_value = 0
    clamp_path_progress.inputs['Max'].default_value = 1.2  # Allow overshoot for pulse
    clamp_path_progress.location = (-200, -350)

    # Compare path_order to progress (reveal sequentially)
    # Visible if path_order < progress
    subtract_path_visible = nodes.new('ShaderNodeMath')
    subtract_path_visible.operation = 'SUBTRACT'
    subtract_path_visible.location = (0, -350)

    # Smoothstep for nice falloff
    smoothstep_path = nodes.new('ShaderNodeMapRange')
    smoothstep_path.interpolation_type = 'SMOOTHERSTEP'
    smoothstep_path.inputs['From Min'].default_value = -0.1
    smoothstep_path.inputs['From Max'].default_value = 0.1
    smoothstep_path.inputs['To Min'].default_value = 0
    smoothstep_path.inputs['To Max'].default_value = 1
    smoothstep_path.location = (200, -350)

    # Pulse effect for leading edge
    pulse_calc = nodes.new('ShaderNodeMath')
    pulse_calc.operation = 'SUBTRACT'
    pulse_calc.location = (0, -500)

    pulse_abs = nodes.new('ShaderNodeMath')
    pulse_abs.operation = 'ABSOLUTE'
    pulse_abs.location = (200, -500)

    pulse_invert = nodes.new('ShaderNodeMath')
    pulse_invert.operation = 'SUBTRACT'
    pulse_invert.inputs[0].default_value = 1.0
    pulse_invert.location = (400, -500)

    pulse_power = nodes.new('ShaderNodeMath')
    pulse_power.operation = 'POWER'
    pulse_power.inputs[1].default_value = 4.0
    pulse_power.location = (600, -500)

    # Combine on_path with visibility
    multiply_path_visible = nodes.new('ShaderNodeMath')
    multiply_path_visible.operation = 'MULTIPLY'
    multiply_path_visible.location = (400, -300)

    # Path color with pulse
    path_color_mix = nodes.new('ShaderNodeMixRGB')
    path_color_mix.blend_type = 'MIX'
    path_color_mix.inputs['Color1'].default_value = Config.COLOR_PATH_CORE
    path_color_mix.inputs['Color2'].default_value = Config.COLOR_PATH_GLOW
    path_color_mix.location = (600, -200)

    # Path emission strength
    path_emission_add = nodes.new('ShaderNodeMath')
    path_emission_add.operation = 'ADD'
    path_emission_add.inputs[0].default_value = Config.EMISSION_PATH
    path_emission_add.location = (600, -350)

    path_emission_mult = nodes.new('ShaderNodeMath')
    path_emission_mult.operation = 'MULTIPLY'
    path_emission_mult.inputs[1].default_value = Config.EMISSION_PATH_PULSE - Config.EMISSION_PATH
    path_emission_mult.location = (600, -450)

    path_emission_final = nodes.new('ShaderNodeMath')
    path_emission_final.operation = 'ADD'
    path_emission_final.location = (750, -380)

    # Path emission shader
    emission_path = nodes.new('ShaderNodeEmission')
    emission_path.location = (800, -250)

    # === CONNECT NODES ===

    # Exploration shader connections
    links.new(attr_discovery.outputs['Fac'], subtract_age.inputs[1])
    links.new(frame_value.outputs[0], subtract_age.inputs[0])
    links.new(subtract_age.outputs[0], divide_normalize.inputs[0])
    links.new(divide_normalize.outputs[0], clamp_age.inputs['Value'])
    links.new(clamp_age.outputs[0], color_ramp.inputs['Fac'])
    links.new(clamp_age.outputs[0], emission_ramp.inputs['Fac'])

    links.new(attr_discovery.outputs['Fac'], greater_than.inputs[0])

    links.new(color_ramp.outputs['Color'], emission_explore.inputs['Color'])
    links.new(emission_ramp.outputs['Color'], emission_strength_mult.inputs[0])
    links.new(emission_strength_mult.outputs[0], emission_explore.inputs['Strength'])

    links.new(greater_than.outputs[0], mix_explored.inputs['Fac'])
    links.new(emission_unexplored.outputs[0], mix_explored.inputs[1])
    links.new(emission_explore.outputs[0], mix_explored.inputs[2])

    # Path shader connections
    links.new(frame_value.outputs[0], subtract_path_start.inputs[0])
    links.new(subtract_path_start.outputs[0], divide_path_progress.inputs[0])
    links.new(divide_path_progress.outputs[0], clamp_path_progress.inputs['Value'])

    links.new(clamp_path_progress.outputs[0], subtract_path_visible.inputs[0])
    links.new(attr_path_order.outputs['Fac'], subtract_path_visible.inputs[1])
    links.new(subtract_path_visible.outputs[0], smoothstep_path.inputs['Value'])

    # Pulse calculation
    links.new(clamp_path_progress.outputs[0], pulse_calc.inputs[0])
    links.new(attr_path_order.outputs['Fac'], pulse_calc.inputs[1])
    links.new(pulse_calc.outputs[0], pulse_abs.inputs[0])
    links.new(pulse_abs.outputs[0], pulse_invert.inputs[1])
    links.new(pulse_invert.outputs[0], pulse_power.inputs[0])

    links.new(attr_on_path.outputs['Fac'], multiply_path_visible.inputs[0])
    links.new(smoothstep_path.outputs[0], multiply_path_visible.inputs[1])

    links.new(pulse_power.outputs[0], path_color_mix.inputs['Fac'])
    links.new(pulse_power.outputs[0], path_emission_mult.inputs[0])
    links.new(path_emission_add.outputs[0], path_emission_final.inputs[0])
    links.new(path_emission_mult.outputs[0], path_emission_final.inputs[1])

    links.new(path_color_mix.outputs[0], emission_path.inputs['Color'])
    links.new(path_emission_final.outputs[0], emission_path.inputs['Strength'])

    # Final mix
    links.new(multiply_path_visible.outputs[0], mix_final.inputs['Fac'])
    links.new(mix_explored.outputs[0], mix_final.inputs[1])
    links.new(emission_path.outputs[0], mix_final.inputs[2])

    links.new(mix_final.outputs[0], output.inputs['Surface'])

    print("Created animated material")
    return mat


def apply_material_to_curve():
    """Apply the animated material to the road network curves."""
    if not state.curve_object:
        print("No curve object found!")
        return

    mat = create_animated_material()

    # Clear existing materials
    state.curve_object.data.materials.clear()

    # Add new material
    state.curve_object.data.materials.append(mat)

    print("Applied material to curves")


# =============================================================================
# SCENE SETUP
# =============================================================================

def setup_camera_and_render():
    """
    Set up orthographic camera for top-down view and Eevee render settings.
    """
    # Remove existing camera if named "AStarCamera"
    if "AStarCamera" in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects["AStarCamera"], do_unlink=True)

    # Create new camera
    cam_data = bpy.data.cameras.new("AStarCamera")
    cam_obj = bpy.data.objects.new("AStarCamera", cam_data)
    bpy.context.collection.objects.link(cam_obj)

    # Set as active camera
    bpy.context.scene.camera = cam_obj

    # Position camera above mesh center, looking down
    # Use curve object bounds if available, otherwise mesh
    target_obj = state.curve_object or state.mesh_object
    if target_obj and state.node_positions:
        # Calculate bounds from node positions
        positions = list(state.node_positions.values())
        if positions:
            min_x = min(p[0] for p in positions)
            max_x = max(p[0] for p in positions)
            min_y = min(p[1] for p in positions)
            max_y = max(p[1] for p in positions)

            center_x = (min_x + max_x) / 2
            center_y = (min_y + max_y) / 2

            # Camera height based on mesh size
            size = max(max_x - min_x, max_y - min_y)
            height = size * 1.2

            cam_obj.location = (center_x, center_y, height)
            cam_obj.rotation_euler = (0, 0, 0)  # Looking straight down

            # Set orthographic
            cam_data.type = 'ORTHO'
            cam_data.ortho_scale = size * 1.3
    else:
        cam_obj.location = (0, 0, 100)
        cam_obj.rotation_euler = (0, 0, 0)
        cam_data.type = 'ORTHO'
        cam_data.ortho_scale = 200

    # Eevee render settings
    bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'

    # Enable bloom for glow effect
    bpy.context.scene.eevee.use_bloom = True
    bpy.context.scene.eevee.bloom_threshold = 0.8
    bpy.context.scene.eevee.bloom_intensity = 0.5
    bpy.context.scene.eevee.bloom_radius = 6.0

    # Set dark background
    bpy.context.scene.world.use_nodes = True
    world_nodes = bpy.context.scene.world.node_tree.nodes
    bg_node = world_nodes.get("Background")
    if bg_node:
        bg_node.inputs['Color'].default_value = (0.01, 0.01, 0.02, 1.0)
        bg_node.inputs['Strength'].default_value = 1.0

    # Animation settings
    bpy.context.scene.frame_start = 0
    bpy.context.scene.frame_end = Config.TOTAL_ANIMATION_FRAMES
    bpy.context.scene.frame_current = 0

    # Resolution
    bpy.context.scene.render.resolution_x = 1920
    bpy.context.scene.render.resolution_y = 1080

    print("Camera and render settings configured")


def setup_viewport_shading():
    """Configure viewport for rendered preview."""
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            for space in area.spaces:
                if space.type == 'VIEW_3D':
                    space.shading.type = 'RENDERED'
                    # Set to top view
                    # This requires context override, so we skip for now
            break

    print("Viewport shading set to rendered")


# =============================================================================
# BLENDER OPERATORS
# =============================================================================

class ASTAR_OT_SearchLocation(bpy.types.Operator):
    """Search for a location and load its road network"""
    bl_idname = "astar.search_location"
    bl_label = "Search Location"
    bl_options = {'REGISTER', 'UNDO'}

    query: bpy.props.StringProperty(
        name="Location",
        description="City or location to search for",
        default=""
    )

    def execute(self, context):
        global state
        state.reset()

        if not self.query:
            self.report({'ERROR'}, "Please enter a location")
            return {'CANCELLED'}

        # Geocode location
        result = geocode_location(self.query)
        if not result:
            self.report({'ERROR'}, f"Could not find location: {self.query}")
            return {'CANCELLED'}

        lat, lon, bbox = result

        # Fetch road network
        nodes, ways = fetch_road_network(bbox)
        if not nodes or not ways:
            self.report({'ERROR'}, "Failed to fetch road network")
            return {'CANCELLED'}

        # Create road network (curves for rendering, mesh for selection)
        curve_obj, mesh_obj = create_road_network(nodes, ways, lat, lon)

        # Setup curve attributes for animation
        setup_curve_attributes(curve_obj)

        # Apply material to curves
        apply_material_to_curve()

        # Setup camera and render
        setup_camera_and_render()
        setup_viewport_shading()

        self.report({'INFO'}, f"Loaded road network for {self.query}")
        return {'FINISHED'}

    def invoke(self, context, event):
        return context.window_manager.invoke_props_dialog(self)


class ASTAR_OT_SetStartPoint(bpy.types.Operator):
    """Set selected vertex as start point"""
    bl_idname = "astar.set_start_point"
    bl_label = "Set Start Point"
    bl_options = {'REGISTER', 'UNDO'}

    def execute(self, context):
        global state

        if not state.mesh_object:
            self.report({'ERROR'}, "No road network loaded")
            return {'CANCELLED'}

        # Get selected vertex in edit mode
        if context.mode != 'EDIT_MESH':
            self.report({'ERROR'}, "Enter edit mode and select a vertex")
            return {'CANCELLED'}

        obj = context.active_object
        if obj != state.mesh_object:
            self.report({'ERROR'}, "Select the road network mesh")
            return {'CANCELLED'}

        bm = bmesh.from_edit_mesh(obj.data)
        selected_verts = [v for v in bm.verts if v.select]

        if len(selected_verts) != 1:
            self.report({'ERROR'}, "Select exactly one vertex")
            return {'CANCELLED'}

        vert_idx = selected_verts[0].index

        if vert_idx not in state.vertex_to_node:
            self.report({'ERROR'}, "Selected vertex is not a valid node")
            return {'CANCELLED'}

        state.start_node = state.vertex_to_node[vert_idx]
        self.report({'INFO'}, f"Start point set (node {state.start_node})")
        return {'FINISHED'}


class ASTAR_OT_SetEndPoint(bpy.types.Operator):
    """Set selected vertex as end point"""
    bl_idname = "astar.set_end_point"
    bl_label = "Set End Point"
    bl_options = {'REGISTER', 'UNDO'}

    def execute(self, context):
        global state

        if not state.mesh_object:
            self.report({'ERROR'}, "No road network loaded")
            return {'CANCELLED'}

        if context.mode != 'EDIT_MESH':
            self.report({'ERROR'}, "Enter edit mode and select a vertex")
            return {'CANCELLED'}

        obj = context.active_object
        if obj != state.mesh_object:
            self.report({'ERROR'}, "Select the road network mesh")
            return {'CANCELLED'}

        bm = bmesh.from_edit_mesh(obj.data)
        selected_verts = [v for v in bm.verts if v.select]

        if len(selected_verts) != 1:
            self.report({'ERROR'}, "Select exactly one vertex")
            return {'CANCELLED'}

        vert_idx = selected_verts[0].index

        if vert_idx not in state.vertex_to_node:
            self.report({'ERROR'}, "Selected vertex is not a valid node")
            return {'CANCELLED'}

        state.end_node = state.vertex_to_node[vert_idx]
        self.report({'INFO'}, f"End point set (node {state.end_node})")
        return {'FINISHED'}


class ASTAR_OT_RunSearch(bpy.types.Operator):
    """Run A* search algorithm"""
    bl_idname = "astar.run_search"
    bl_label = "Run A* Search"
    bl_options = {'REGISTER', 'UNDO'}

    def execute(self, context):
        global state

        if not state.curve_object:
            self.report({'ERROR'}, "No road network loaded")
            return {'CANCELLED'}

        if state.start_node is None or state.end_node is None:
            self.report({'ERROR'}, "Set both start and end points first")
            return {'CANCELLED'}

        # Make sure we're in object mode
        if context.mode == 'EDIT_MESH':
            bpy.ops.object.mode_set(mode='OBJECT')

        # Reset curve attributes
        setup_curve_attributes(state.curve_object)

        # Run A* search
        path, discovery_order = astar_search(state.start_node, state.end_node)

        # Apply discovery times for exploration animation
        apply_discovery_times(discovery_order)

        # Apply path attributes if path was found
        if path:
            apply_path_attributes(path)
            self.report({'INFO'}, f"Path found with {len(path)} nodes. Play animation!")
        else:
            self.report({'WARNING'}, "No path found. Exploration animation ready.")

        # Reset to frame 0
        bpy.context.scene.frame_set(0)

        return {'FINISHED'}


class ASTAR_OT_ResetAnimation(bpy.types.Operator):
    """Reset animation to start"""
    bl_idname = "astar.reset_animation"
    bl_label = "Reset Animation"

    def execute(self, context):
        bpy.context.scene.frame_set(0)
        return {'FINISHED'}


# =============================================================================
# UI PANEL
# =============================================================================

class ASTAR_PT_MainPanel(bpy.types.Panel):
    """A* Pathfinding Visualizer Panel"""
    bl_label = "A* Pathfinding"
    bl_idname = "ASTAR_PT_main_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = 'A* Viz'

    def draw(self, context):
        layout = self.layout

        # Location search
        box = layout.box()
        box.label(text="Location", icon='WORLD')
        box.operator("astar.search_location", text="Search Location", icon='VIEWZOOM')

        # Start/End points
        box = layout.box()
        box.label(text="Pathfinding Points", icon='EMPTY_AXIS')

        row = box.row()
        row.operator("astar.set_start_point", text="Set Start", icon='PLAY')
        row.operator("astar.set_end_point", text="Set End", icon='PAUSE')

        # Status display
        if state.start_node is not None:
            box.label(text=f"Start: Node {state.start_node}", icon='CHECKMARK')
        else:
            box.label(text="Start: Not set", icon='X')

        if state.end_node is not None:
            box.label(text=f"End: Node {state.end_node}", icon='CHECKMARK')
        else:
            box.label(text="End: Not set", icon='X')

        # Run search
        box = layout.box()
        box.label(text="Animation", icon='RENDER_ANIMATION')
        box.operator("astar.run_search", text="Run A* Search", icon='TRACKING')
        box.operator("astar.reset_animation", text="Reset to Start", icon='REW')

        # Info
        if state.curve_object:
            box = layout.box()
            box.label(text="Network Info", icon='INFO')
            curve_data = state.curve_object.data
            num_splines = len(curve_data.splines)
            num_points = sum(len(s.points) for s in curve_data.splines)
            box.label(text=f"Road segments: {num_splines}")
            box.label(text=f"Intersections: {len(state.node_positions)}")

            if state.final_path:
                box.label(text=f"Path length: {len(state.final_path)} nodes")


# =============================================================================
# REGISTRATION
# =============================================================================

classes = (
    ASTAR_OT_SearchLocation,
    ASTAR_OT_SetStartPoint,
    ASTAR_OT_SetEndPoint,
    ASTAR_OT_RunSearch,
    ASTAR_OT_ResetAnimation,
    ASTAR_PT_MainPanel,
)


def register():
    for cls in classes:
        bpy.utils.register_class(cls)
    print("A* Visualizer registered")


def unregister():
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)
    print("A* Visualizer unregistered")


# =============================================================================
# MAIN EXECUTION
# =============================================================================

if __name__ == "__main__":
    # Register the addon
    register()

    print("\n" + "="*60)
    print("A* OSM Visualizer loaded!")
    print("="*60)
    print("\nUsage:")
    print("1. Open the 'A* Viz' panel in the 3D View sidebar (N key)")
    print("2. Click 'Search Location' and enter a city name")
    print("3. Select 'RoadNetwork_Selection' object (wireframe mesh)")
    print("4. Enter Edit Mode (Tab), select a vertex for start point")
    print("5. Click 'Set Start' in the panel")
    print("6. Select another vertex for end point")
    print("7. Click 'Set End' in the panel")
    print("8. Exit Edit Mode (Tab)")
    print("9. Click 'Run A* Search'")
    print("10. Press Space to play the animation")
    print("="*60 + "\n")
