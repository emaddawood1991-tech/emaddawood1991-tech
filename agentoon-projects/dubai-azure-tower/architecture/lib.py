"""Shared helpers for the Dubai Azure Tower Blender build (bpy 4.2+, written and run against 5.2).
Coordinates: metres, Z up, +Y = sea."""
import json
import math
import os
import random

import bpy
import bmesh
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
P = json.load(open(os.path.join(HERE, "tower_params.json")))
T = P["tower"]
ROOT = "DUBAI_AZURE_TOWER"


# --------------------------------------------------------------------------- scene organisation
def scene():
    return bpy.context.scene


def coll(name, parent=None):
    c = bpy.data.collections.get(name)
    if c is None:
        c = bpy.data.collections.new(name)
        (parent or scene().collection).children.link(c)
    return c


def root_coll():
    return coll(ROOT)


def sub(name):
    return coll(name, root_coll())


def reset_scene():
    """Remove everything this project created so the build is repeatable."""
    for c in list(bpy.data.collections):
        if c.name == ROOT or c.name.startswith(ROOT + "_"):
            for o in list(c.all_objects):
                bpy.data.objects.remove(o, do_unlink=True)
    for c in list(bpy.data.collections):
        if c.name == ROOT or any(c.name == n for n in ("TOWER", "SITE", "LANDSCAPE", "INTERIOR_LOBBY", "INTERIOR_APARTMENT", "INTERIOR_PENTHOUSE", "INTERIOR_OFFICE", "CAMERAS", "LIGHTS")):
            bpy.data.collections.remove(c)
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    scene().timeline_markers.clear()


# --------------------------------------------------------------------------- materials
MAT = {}


def _bsdf(m):
    return m.node_tree.nodes["Principled BSDF"]


def material(name, color=(0.8, 0.8, 0.8), rough=0.5, metal=0.0, spec=None, alpha=1.0, emit=None, emit_strength=0.0, coat=0.0, transmission=0.0, ior=None):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = _bsdf(m)
    b.inputs["Base Color"].default_value = (*color, 1.0)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Alpha"].default_value = alpha
    if spec is not None:
        b.inputs["Specular IOR Level"].default_value = spec
    if coat:
        b.inputs["Coat Weight"].default_value = coat
        b.inputs["Coat Roughness"].default_value = 0.05
    if transmission:
        b.inputs["Transmission Weight"].default_value = transmission
    if ior is not None:
        b.inputs["IOR"].default_value = ior
    if emit is not None:
        b.inputs["Emission Color"].default_value = (*emit, 1.0)
        b.inputs["Emission Strength"].default_value = emit_strength
    if alpha < 1.0:
        m.surface_render_method = "BLENDED"
    MAT[name] = m
    return m


def M(name):
    return MAT[name]


def node_group_value(mat, label, value):
    """Add a named Value node (used as an animatable control, e.g. NIGHT)."""
    n = mat.node_tree.nodes.new("ShaderNodeValue")
    n.name = label
    n.label = label
    n.outputs[0].default_value = value
    return n


# --------------------------------------------------------------------------- primitives
def link(o, c):
    c.objects.link(o)
    return o


def mesh_obj(name, bm, c, m=None, loc=(0, 0, 0), smooth=False):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    o = bpy.data.objects.new(name, me)
    o.location = loc
    if m is not None:
        o.data.materials.append(m)
    return link(o, c)


def box(name, c, m, cx, cy, zb, sx, sy, sz, rot=0.0):
    """Box with origin at bottom centre. rot is rotation about Z in radians."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= sx
        v.co.y *= sy
        v.co.z = (v.co.z + 0.5) * sz
    o = mesh_obj(name, bm, c, m, (cx, cy, zb))
    o.rotation_euler.z = rot
    return o


def cyl(name, c, m, cx, cy, zb, r, h, seg=24, r2=None, rot=0.0):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=(r if r2 is None else r2), depth=h)
    for v in bm.verts:
        v.co.z += h / 2
    o = mesh_obj(name, bm, c, m, (cx, cy, zb), smooth=seg >= 16)
    o.rotation_euler.z = rot
    return o


def ball(name, c, m, cx, cy, cz, r, sx=1.0, sy=1.0, sz=1.0, seg=16):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=max(6, seg // 2), radius=r)
    for v in bm.verts:
        v.co.x *= sx
        v.co.y *= sy
        v.co.z *= sz
    return mesh_obj(name, bm, c, m, (cx, cy, cz), smooth=True)


def instance(name, src, c, loc, rot_z=0.0, scale=1.0):
    """Linked duplicate (shares mesh data: cheap for Cycles)."""
    o = bpy.data.objects.new(name, src.data)
    o.location = loc
    o.rotation_euler.z = rot_z
    o.scale = (scale, scale, scale) if not isinstance(scale, (tuple, list)) else scale
    return link(o, c)


def hide_source(o):
    o.hide_render = True
    o.hide_viewport = True


def polygon_mesh(name, pts, c, m, z=0.0, thickness=0.2):
    """Extruded polygon (pts = [(x, y), ...]) with origin at world zero."""
    bm = bmesh.new()
    vs = [bm.verts.new((x, y, z)) for x, y in pts]
    f = bm.faces.new(vs)
    if f.normal.z < 0:
        f.normal_flip()
    res = bmesh.ops.extrude_face_region(bm, geom=[f])
    ext = [e for e in res["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=ext, vec=(0, 0, thickness))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_obj(name, bm, c, m)


# --------------------------------------------------------------------------- animation helpers
def interp(kind):
    bpy.context.preferences.edit.keyframe_new_interpolation_type = kind


def key(o, path, frame, value, index=-1):
    setattr(o, path, value)
    o.keyframe_insert(data_path=path, frame=frame, index=index)


def smoothstep(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def aim_euler(pos, target):
    """Euler XYZ for a Blender camera (looks along -Z) at pos looking at target."""
    d = Vector(target) - Vector(pos)
    return d.to_track_quat("-Z", "Y").to_euler()


# --------------------------------------------------------------------------- tower geometry (shared by every scene)
def floor_z(f):
    """Bottom height of floor f (1 = double-height lobby)."""
    return 0.0 if f <= 1 else T["lobby_height"] + (f - 2) * T["floor_height"]


def top_z():
    return floor_z(T["floors"]) + T["floor_height"]


def height_fraction(z):
    return max(0.0, min(1.0, z / top_z()))


def radius_at(z):
    return T["base_radius"] * (1.0 - T["taper"] * height_fraction(z))


def twist_at(z):
    return math.radians(T["twist_degrees"]) * height_fraction(z) ** T["twist_exponent"]


def ring_point(z, theta, offset=0.0):
    """Point on the tower skin at height z and polar angle theta (before twist), pushed out by offset."""
    h = height_fraction(z)
    lobe = 1.0 + T["lobe_amplitude"] * math.cos(T["lobe_count"] * theta) * (1.0 - 0.35 * h)
    a = theta + twist_at(z)
    r = radius_at(z) * lobe + offset
    return Vector((r * math.cos(a), r * math.sin(a), z))


def ring_normal(z, theta):
    p1 = ring_point(z, theta - 0.01)
    p2 = ring_point(z, theta + 0.01)
    t = (p2 - p1).normalized()
    n = Vector((t.y, -t.x, 0.0))
    # outward: compare with the position vector
    p = ring_point(z, theta)
    return n if n.dot(Vector((p.x, p.y, 0.0))) > 0 else -n
