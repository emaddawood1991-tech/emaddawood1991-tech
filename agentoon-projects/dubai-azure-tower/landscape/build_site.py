"""Site, coastline, podium and landscape for the Dubai Azure Tower (conceptual Jumeirah-style coast)."""
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Vector

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "architecture"))
from lib import *  # noqa: E402,F401,F403

S_ = P["site"]
COAST_Y = S_["coastline_y"]
random.seed(2026)


def coast(x):
    return COAST_Y + 24 * math.sin(x / 190.0) + 11 * math.sin(x / 61.0 + 1.0)


# ---------------------------------------------------------------- world, sun, sea
def build_world():
    w = scene().world or bpy.data.worlds.new("World")
    scene().world = w
    w.use_nodes = True
    nt, ln = w.node_tree.nodes, w.node_tree.links
    for n in list(nt):
        nt.remove(n)
    sky = nt.new("ShaderNodeTexSky")
    sky.sky_type = "MULTIPLE_SCATTERING"
    sky.sun_elevation = math.radians(8.0)
    sky.sun_rotation = math.radians(150.0)
    sky.air_density = 1.1
    sky.aerosol_density = 1.6
    sky.sun_disc = False
    sky.sun_intensity = 1.0
    bg = nt.new("ShaderNodeBackground")
    bg.inputs["Strength"].default_value = 0.12
    out = nt.new("ShaderNodeOutputWorld")
    ln.new(sky.outputs[0], bg.inputs["Color"])
    ln.new(bg.outputs[0], out.inputs["Surface"])
    sky.name = "SKY"
    bg.name = "BG"
    return w


def sun_direction(elev_deg, az_deg):
    """Unit vector from the scene toward the sun (az clockwise from +Y north)."""
    e, a = math.radians(elev_deg), math.radians(az_deg)
    return Vector((math.cos(e) * math.sin(a), math.cos(e) * math.cos(a), math.sin(e)))


def build_sun(elev=8.0, az=300.0):
    c = sub("LIGHTS")
    ld = bpy.data.lights.new("SUN_key", "SUN")
    ld.energy = 3.2
    ld.angle = math.radians(0.8)
    ld.color = (1.0, 0.82, 0.62)
    so = bpy.data.objects.new("SUN_key", ld)
    link(so, c)
    so.rotation_euler = (-sun_direction(elev, az)).to_track_quat("-Z", "Y").to_euler()
    return so


def build_sea(c):
    m = material("Sea", (0.01, 0.17, 0.27), rough=0.07, spec=0.8)
    nt, ln = m.node_tree.nodes, m.node_tree.links
    b = nt["Principled BSDF"]
    tc = nt.new("ShaderNodeTexCoord")
    mp = nt.new("ShaderNodeMapping")
    mp.name = "SEA_MAP"
    mp.inputs["Scale"].default_value = (0.06, 0.06, 0.2)
    wv = nt.new("ShaderNodeTexNoise")
    wv.inputs["Scale"].default_value = 1.0
    wv.inputs["Detail"].default_value = 6.0
    bump = nt.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.25
    bump.inputs["Distance"].default_value = 0.6
    ln.new(tc.outputs["Object"], mp.inputs["Vector"])
    ln.new(mp.outputs[0], wv.inputs["Vector"])
    ln.new(wv.outputs["Fac"], bump.inputs["Height"])
    ln.new(bump.outputs[0], b.inputs["Normal"])
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=4, y_segments=4, size=90000)
    for v in bm.verts:
        v.co.z = -0.7
    mesh_obj("Sea", bm, c, m)
    # drifting ripples: move the noise through time
    interp("LINEAR")
    for f, v in ((1, 0.0), (3600, 140.0)):
        mp.inputs["Location"].default_value = (v, v * 0.6, 0.0)
        m.node_tree.keyframe_insert(data_path=f'nodes["{mp.name}"].inputs[1].default_value', frame=f)


def build_land(c):
    sand = material("Sand", (0.72, 0.58, 0.40), rough=0.95)
    nt, ln = sand.node_tree.nodes, sand.node_tree.links
    noise = nt.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 0.02
    mix = nt.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.inputs[6].default_value = (0.74, 0.60, 0.42, 1)
    mix.inputs[7].default_value = (0.55, 0.43, 0.30, 1)
    ln.new(noise.outputs["Fac"], mix.inputs[0])
    ln.new(mix.outputs[2], nt["Principled BSDF"].inputs["Base Color"])
    bm = bmesh.new()
    xs = [-3000 + 40 * i for i in range(151)]
    top = [bm.verts.new((x, coast(x), 0.0)) for x in xs]
    bot = [bm.verts.new((x, -3000, 0.0)) for x in xs]
    for i in range(len(xs) - 1):
        bm.faces.new([bot[i], bot[i + 1], top[i + 1], top[i]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        if f.normal.z < 0:
            f.normal_flip()
    mesh_obj("Land", bm, c, sand)
    # wet sand / shoreline strip
    wet = material("WetSand", (0.46, 0.38, 0.28), rough=0.35)
    bm = bmesh.new()
    xs2 = [-3000 + 25 * i for i in range(241)]
    a = [bm.verts.new((x, coast(x) - 22, 0.03)) for x in xs2]
    b = [bm.verts.new((x, coast(x) + 2, 0.03)) for x in xs2]
    for i in range(len(xs2) - 1):
        bm.faces.new([a[i], a[i + 1], b[i + 1], b[i]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        if f.normal.z < 0:
            f.normal_flip()
    mesh_obj("Shoreline", bm, c, wet)


# ---------------------------------------------------------------- roads
def build_roads(c):
    asph = material("Asphalt", (0.045, 0.045, 0.05), rough=0.8)
    paint = material("RoadPaint", (0.9, 0.9, 0.85), rough=0.6)
    side = material("Sidewalk", (0.66, 0.62, 0.56), rough=0.8)
    for name, y, width in (("Road_Inland", -110.0, 26.0), ("Highway_Coastal", 205.0, 34.0)):
        box(name, c, asph, 0, y, 0.04, 4200, width, 0.1)
        box(name + "_Walk_S", c, side, 0, y - width / 2 - 4, 0.05, 4200, 7, 0.14)
        box(name + "_Walk_N", c, side, 0, y + width / 2 + 4, 0.05, 4200, 7, 0.14)
        dash = box(name + "_Dash", c, paint, 0, y, 0.1, 3.0, 0.25, 0.03)
        hide_source(dash)
        for i in range(-60, 61):
            instance(f"{name}_Dash_{i}", dash, c, (i * 22.0, y, 0.1))
    # avenue from the inland road to the arrival plaza and canopy
    box("Avenue", c, asph, 0, -75, 0.04, 12, 100, 0.1)
    box("Avenue_Walk_L", c, side, -9.5, -75, 0.05, 7, 100, 0.14)
    box("Avenue_Walk_R", c, side, 9.5, -75, 0.05, 7, 100, 0.14)
    box("Plaza", c, M("Stone"), 0, -42, 0.02, 120, 60, 0.32)
    box("DropOff_Lane", c, asph, 0, -41, 0.34, 22, 34, 0.04)


# ---------------------------------------------------------------- podium (stepped terraces, open to the south)
def superellipse_r(phi, a, b, n=5.0):
    return 1.0 / ((abs(math.cos(phi) / a) ** n + abs(math.sin(phi) / b) ** n) ** (1.0 / n))


def terrace(name, c, m, half, z0, z1, phi0, phi1, inner=31.0, n=64):
    bm = bmesh.new()
    outer = []
    ins = []
    for i in range(n + 1):
        phi = math.radians(phi0 + (phi1 - phi0) * i / n)
        r = superellipse_r(phi, half[0], half[1])
        outer.append(bm.verts.new((r * math.cos(phi), r * math.sin(phi), z0)))
        ins.append(bm.verts.new((inner * math.cos(phi), inner * math.sin(phi), z0)))
    faces = [bm.faces.new([ins[i], outer[i], outer[i + 1], ins[i + 1]]) for i in range(n)]
    for f in faces:
        if f.normal.z < 0:
            f.normal_flip()
    res = bmesh.ops.extrude_face_region(bm, geom=faces)
    verts = [e for e in res["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=verts, vec=(0, 0, z1 - z0))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_obj(name, bm, c, m)


def build_podium(c):
    stone = material("Travertine", (0.84, 0.77, 0.65), rough=0.55)
    planter = material("PlanterStone", (0.62, 0.55, 0.45), rough=0.7)
    t1, t2 = S_["podium_levels"][1], S_["podium_levels"][2]
    terrace("Podium_Terrace_1", c, stone, t1["half"], 0.0, t1["z"], -28, 208)
    terrace("Podium_Terrace_2", c, stone, t2["half"], t1["z"], t2["z"], -8, 188)
    # stair-like retaining planters on the terrace edges
    for i in range(14):
        phi = math.radians(-20 + i * 16.5)
        r = superellipse_r(phi, 62, 48)
        box(f"Planter_T1_{i}", c, planter, r * math.cos(phi), r * math.sin(phi), t1["z"], 6.5, 3.0, 0.9, rot=phi + math.pi / 2)


# ---------------------------------------------------------------- vegetation, furniture, vehicles (instanced)
def palm_variant(name, c, height, lean, seed):
    rnd = random.Random(seed)
    trunk = material("PalmTrunk", (0.30, 0.20, 0.12), rough=0.9)
    leaf = material("PalmLeaf", (0.07, 0.30, 0.07), rough=0.55)
    bm = bmesh.new()
    seg = 10
    rings = []
    for k in range(seg + 1):
        u = k / seg
        cx = lean * u * u * height * 0.18
        r = 0.28 * (1 - 0.5 * u) + 0.07
        rings.append([bm.verts.new((cx + r * math.cos(a), r * math.sin(a), u * height)) for a in [2 * math.pi * i / 8 for i in range(8)]])
    for k in range(seg):
        for i in range(8):
            f = bm.faces.new([rings[k][i], rings[k][(i + 1) % 8], rings[k + 1][(i + 1) % 8], rings[k + 1][i]])
            f.material_index = 0
    top = Vector((lean * height * 0.18, 0, height))
    for n in range(16):
        ang = 2 * math.pi * n / 16 + rnd.uniform(-0.15, 0.15)
        L = rnd.uniform(3.6, 4.6)
        d = Vector((math.cos(ang), math.sin(ang), 0))
        side = Vector((-d.y, d.x, 0))
        pts = []
        for s in range(9):
            t = s / 8
            p = top + d * (t * L) + Vector((0, 0, 0.7 * math.sin(t * 2.2) - 1.7 * t * t))
            w = 0.5 * math.sin(math.pi * (0.1 + 0.9 * t)) * (1 - 0.3 * t)
            pts.append((bm.verts.new(p - side * w), bm.verts.new(p + side * w)))
        for s in range(8):
            f = bm.faces.new([pts[s][0], pts[s][1], pts[s + 1][1], pts[s + 1][0]])
            f.material_index = 1
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = mesh_obj(name, bm, c, trunk)
    o.data.materials.append(leaf)
    for p in o.data.polygons:
        p.use_smooth = True
    hide_source(o)
    return o


def shrub_variants(c):
    m = material("Shrub", (0.10, 0.32, 0.10), rough=0.8)
    s = ball("Shrub_Src", c, m, 0, 0, 0.45, 0.9, sz=0.55, seg=12)
    hide_source(s)
    m2 = material("Agave", (0.28, 0.45, 0.22), rough=0.5)
    bm = bmesh.new()
    for k in range(14):
        a = 2 * math.pi * k / 14
        tip = Vector((math.cos(a) * 1.2, math.sin(a) * 1.2, 0.9))
        base = Vector((0, 0, 0.1))
        side = Vector((-math.sin(a), math.cos(a), 0)) * 0.12
        bm.faces.new([bm.verts.new(base - side), bm.verts.new(base + side), bm.verts.new(tip)])
    ag = mesh_obj("Agave_Src", bm, c, m2)
    hide_source(ag)
    return s, ag


def pergola_module(c):
    wood = material("PergolaWood", (0.36, 0.25, 0.15), rough=0.55)
    bm = bmesh.new()

    def add_box(cx, cy, z0, sx, sy, sz):
        b = bmesh.new()
        bmesh.ops.create_cube(b, size=1.0)
        for v in b.verts:
            v.co.x = v.co.x * sx + cx
            v.co.y = v.co.y * sy + cy
            v.co.z = (v.co.z + 0.5) * sz + z0
        me = bpy.data.meshes.new("t")
        b.to_mesh(me)
        b.free()
        bm.from_mesh(me)
        bpy.data.meshes.remove(me)

    for sx in (-2.2, 2.2):
        for sy in (-1.8, 1.8):
            add_box(sx, sy, 0, 0.3, 0.3, 3.0)
    for i in range(10):
        add_box(0, -1.9 + i * 0.42, 3.0, 5.0, 0.12, 0.2)
    add_box(-2.2, 0, 3.0, 0.25, 4.3, 0.3)
    add_box(2.2, 0, 3.0, 0.25, 4.3, 0.3)
    o = mesh_obj("Pergola_Src", bm, c, wood)
    hide_source(o)
    return o


def seating_module(c):
    wood = material("TeakFurn", (0.45, 0.30, 0.17), rough=0.6)
    cush = material("Cushion", (0.9, 0.86, 0.78), rough=0.9)
    um = material("UmbrellaCloth", (0.95, 0.93, 0.88), rough=0.8)
    bm = bmesh.new()

    def add(o_):
        me = o_.data
        bm.from_mesh(me)
        bpy.data.objects.remove(o_, do_unlink=True)

    tmp = c
    add(cyl("t1", tmp, wood, 0, 0, 0.75, 0.8, 0.06, seg=20))
    add(cyl("t2", tmp, wood, 0, 0, 0, 0.07, 0.75, seg=8))
    for k in range(4):
        a = k * math.pi / 2 + 0.4
        add(box("ch", tmp, cush, 1.25 * math.cos(a), 1.25 * math.sin(a), 0, 0.5, 0.5, 0.5, rot=a))
    add(cyl("pole", tmp, wood, 0, 0, 0, 0.04, 2.6, seg=8))
    add(cyl("top", tmp, um, 0, 0, 2.5, 1.9, 0.35, seg=14, r2=0.05))
    o = mesh_obj("Seating_Src", bm, c, wood)
    o.data.materials.append(cush)
    o.data.materials.append(um)
    hide_source(o)
    return o


def car_variant(name, c, color, seed=0):
    body = material(f"CarPaint_{name}", color, rough=0.18, metal=0.6, coat=1.0)
    glass = material("CarGlass", (0.02, 0.03, 0.04), rough=0.05)
    tire = material("Tire", (0.02, 0.02, 0.02), rough=0.8)
    lamp = material("CarLamp", (1, 0.95, 0.85), rough=0.1, emit=(1, 0.9, 0.7), emit_strength=0.0)
    bm = bmesh.new()

    def add(o_, idx):
        me = o_.data
        base = len(bm.faces)
        bm.from_mesh(me)
        bm.faces.ensure_lookup_table()
        for f in list(bm.faces)[base:]:
            f.material_index = idx
        bpy.data.objects.remove(o_, do_unlink=True)

    add(box("b", c, body, 0, 0, 0.38, 1.95, 4.9, 0.62), 0)
    cab = box("c", c, body, 0, -0.25, 1.0, 1.7, 2.6, 0.55)
    for v in cab.data.vertices:
        if v.co.z > 0.3:
            v.co.x *= 0.82
            v.co.y *= 0.7
    add(cab, 0)
    glass_o = box("g", c, glass, 0, -0.25, 1.02, 1.72, 2.4, 0.5)
    for v in glass_o.data.vertices:
        if v.co.z > 0.3:
            v.co.x *= 0.8
            v.co.y *= 0.68
    add(glass_o, 1)
    for wx, wy in ((-0.95, 1.5), (0.95, 1.5), (-0.95, -1.5), (0.95, -1.5)):
        w = cyl("w", c, tire, wx, wy, 0.0, 0.38, 0.28, seg=16)
        w.rotation_euler = (0, math.pi / 2, 0)
        w.location = (wx, wy, 0.38)
        # bake the rotation into the mesh before merging
        w.data.transform(w.matrix_basis)
        w.matrix_basis = w.matrix_basis.Identity(4)
        add(w, 2)
    for lx in (-0.7, 0.7):
        add(box("l", c, lamp, lx, 2.43, 0.62, 0.45, 0.06, 0.12), 3)
    o = mesh_obj(name, bm, c, body)
    o.data.materials.append(glass)
    o.data.materials.append(tire)
    o.data.materials.append(lamp)
    for p in o.data.polygons:
        p.use_smooth = False
    hide_source(o)
    return o


def build_landscape():
    c = sub("LANDSCAPE")
    palms = [palm_variant(f"Palm_Src_{i}", c, h, ln, 10 + i) for i, (h, ln) in enumerate(((8.5, 0.5), (11.0, -0.4), (13.5, 0.7), (9.8, 0.0)))]
    shrub, agave = shrub_variants(c)
    pergola = pergola_module(c)
    seating = seating_module(c)
    cars = [car_variant("Black", c, (0.01, 0.01, 0.012)), car_variant("White", c, (0.85, 0.85, 0.82)), car_variant("Champagne", c, (0.62, 0.5, 0.34))]

    def pal(i, x, y, z=0.0, s=1.0):
        instance(f"Palm_{i}", random.choice(palms), c, (x, y, z), random.uniform(0, 6.28), s * random.uniform(0.9, 1.15))

    n = 0
    # avenue palms
    for y in range(-104, -30, 9):
        for x in (-14.5, 14.5):
            pal(n, x, y)
            n += 1
    # plaza edge and side lawns
    for x in range(-70, 71, 12):
        if abs(x) > 16:
            pal(n, x, -66 + random.uniform(-2, 2))
            n += 1
    for x in range(-50, 51, 10):
        pal(n, x, -16 + random.uniform(-1.5, 1.5), 0.0, 1.0)
        n += 1
    # terrace planting (z levels)
    for i in range(34):
        phi = math.radians(-18 + i * 7.2)
        r = superellipse_r(phi, 58, 45) * random.uniform(0.82, 0.97)
        pal(n, r * math.cos(phi), r * math.sin(phi), 5.5)
        n += 1
    for i in range(22):
        phi = math.radians(-2 + i * 9)
        r = superellipse_r(phi, 44, 35) * random.uniform(0.85, 0.97)
        pal(n, r * math.cos(phi), r * math.sin(phi), 11.0, 0.9)
        n += 1
    # shrubs and agave along terraces and plaza
    k = 0
    for i in range(240):
        phi = random.uniform(math.radians(-25), math.radians(205))
        t = random.choice((1, 2, 3))
        half, z = ((62, 48), 5.5) if t == 1 else (((46, 36), 11.0) if t == 2 else ((72, 56), 0.0))
        r = superellipse_r(phi, *half) * random.uniform(0.55 if t != 3 else 0.9, 0.97)
        if math.hypot(r * math.cos(phi), r * math.sin(phi)) < 33:
            continue
        instance(f"Shrub_{k}", random.choice((shrub, shrub, agave)), c, (r * math.cos(phi), r * math.sin(phi), z), random.uniform(0, 6.28), random.uniform(0.8, 1.6))
        k += 1
    # shaded walkways: pergola rows east and west of the plaza
    for side in (-1, 1):
        for i in range(8):
            instance(f"Pergola_{side}_{i}", pergola, c, (side * (44 + i * 5.2), -58, 0.32), math.pi / 2 if False else 0.0)
    # outdoor seating on the terrace
    for i in range(9):
        phi = math.radians(10 + i * 20)
        r = superellipse_r(phi, 54, 42) * 0.78
        instance(f"Seating_{i}", seating, c, (r * math.cos(phi), r * math.sin(phi), 5.5), random.uniform(0, 6.28))
    # parked luxury cars in the arrival zone
    for i, (x, y, rot, v) in enumerate(((-34, -52, 0, 1), (-39, -52, 0.05, 2), (36, -50, math.pi, 0), (42, -50, math.pi - 0.06, 1), (-8.5, -38, math.pi / 2 + 0.05, 0))):
        instance(f"ParkedCar_{i}", cars[v], c, (x, y, 0.36), rot)
    return c, cars


def build_water_and_canopy(c):
    water = material("PoolWater", (0.03, 0.55, 0.62), rough=0.03, spec=1.0, emit=(0.02, 0.5, 0.6), emit_strength=0.15)
    wn = node_group_value(water, "NIGHT", 0.0)
    nt, ln = water.node_tree.nodes, water.node_tree.links
    mul = nt.new("ShaderNodeMath")
    mul.operation = "MULTIPLY_ADD"
    mul.inputs[1].default_value = 3.5
    mul.inputs[2].default_value = 0.15
    ln.new(wn.outputs[0], mul.inputs[0])
    ln.new(mul.outputs[0], nt["Principled BSDF"].inputs["Emission Strength"])
    tile = material("PoolTile", (0.55, 0.82, 0.86), rough=0.3)
    cop = material("Coping", (0.92, 0.9, 0.85), rough=0.5)
    # infinity pool on terrace 1 (open to the sea on the north side), plus a second pool on terrace 2
    for nm, cx, cy, z, w, d in (("Pool_Podium", 0.0, 41.0, 5.5, 40.0, 8.0), ("Pool_Upper", 0.0, 34.6, 11.0, 18.0, 3.6)):
        box(nm + "_Basin", c, tile, cx, cy, z - 0.02, w, d, 0.03)
        box(nm + "_W", c, cop, cx - w / 2 - 0.3, cy, z, 0.6, d + 0.6, 0.35)
        box(nm + "_E", c, cop, cx + w / 2 + 0.3, cy, z, 0.6, d + 0.6, 0.35)
        box(nm + "_S", c, cop, cx, cy - d / 2 - 0.3, z, w, 0.6, 0.35)
        box(nm + "_Water", c, water, cx, cy, z + 0.18, w, d, 0.02)
        box(nm + "_Edge", c, M("BalconyGlass"), cx, cy + d / 2, z, w, 0.06, 0.9)
    # reflecting basins either side of the arrival avenue
    for sx in (-1, 1):
        box(f"Basin_{sx}", c, cop, sx * 24, -62, 0.33, 7.4, 44, 0.3)
        box(f"Basin_Water_{sx}", c, water, sx * 24, -62, 0.56, 6.6, 43.2, 0.02)
        for i in range(5):
            jet = cyl(f"Jet_{sx}_{i}", c, material("Spray", (1, 1, 1), rough=0.2, alpha=0.5), sx * 24, -80 + i * 9.5, 0.58, 0.07, 2.4, seg=8, r2=0.02)
    # porte-cochere canopy with recessed warm lights
    bronze = M("Bronze")
    lamp = material("CanopyLight", P["palette"]["warm_light"], rough=0.3, emit=P["palette"]["warm_light"], emit_strength=3.0)
    box("Canopy_Slab", c, bronze, 0, -39, 8.2, 38, 28, 0.7)
    box("Canopy_Edge", c, M("StoneLight"), 0, -53.2, 8.0, 38.4, 0.6, 1.1)
    for x in (-16, -8, 0, 8, 16):
        box(f"Canopy_Light_{x}", c, lamp, x, -44, 8.15, 1.2, 14, 0.05)
    for x, y in ((-17, -51), (17, -51), (-17, -28), (17, -28)):
        cyl(f"Canopy_Col_{x}_{y}", c, bronze, x, y, 0.32, 0.45, 7.9, seg=16)
    # entrance steps and doors glow
    box("Entrance_Step", c, M("Stone"), 0, -27.5, 0.0, 11, 4.0, 0.2)


# ---------------------------------------------------------------- distant landmark and skyline
def build_burj(c):
    wh = material("BurjSail", (0.93, 0.93, 0.9), rough=0.45)
    nt = wh.node_tree.nodes
    bx, by = S_["burj_al_arab_xy"]
    island = material("IslandStone", (0.6, 0.55, 0.47), rough=0.8)
    cyl("BurjIsland", c, island, bx, by, -0.6, 150, 1.4, seg=48)
    mast = material("BurjMast", (0.85, 0.85, 0.83), rough=0.4)
    # triangular mast section lofted up to 300 m with a slim spire
    rings = []
    H = 300.0
    for k in range(21):
        u = k / 20
        r = 20 * (1 - 0.55 * u)
        rings.append([Vector((bx + r * math.cos(a), by + r * math.sin(a) * 0.9, u * H)) for a in [2 * math.pi * i / 3 + math.pi / 6 for i in range(3)] for _ in (0,)])
    # smoothed triangular lobes: 24 points per ring
    rings = []
    for k in range(21):
        u = k / 20
        r = 21 * (1 - 0.5 * u)
        ring = []
        for i in range(24):
            a = 2 * math.pi * i / 24
            rr = r * (1 + 0.28 * math.cos(3 * a))
            ring.append(Vector((bx + rr * math.cos(a), by + rr * math.sin(a), u * H)))
        rings.append(ring)
    from build_tower import loft
    loft("Burj_Mast", c, mast, rings)
    cyl("Burj_Spire", c, mast, bx, by, H - 1, 1.6, 40, seg=10, r2=0.1)
    # the sail: a curved white membrane bulging toward the open sea
    bm = bmesh.new()
    N, Mm = 24, 12
    grid = []
    for i in range(N + 1):
        u = i / N
        row = []
        for j in range(Mm + 1):
            v = j / Mm
            x = bx - 20 - 98 * v * (1 - 0.82 * u ** 1.4)
            y = by + 14 * math.sin(math.pi * v) * (1 - 0.7 * u)
            z = 8 + u * 255 * (1 - 0.18 * v)
            row.append(bm.verts.new((x, y, z)))
        grid.append(row)
    for i in range(N):
        for j in range(Mm):
            bm.faces.new([grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh_obj("Burj_Sail", bm, c, wh)
    # causeway to the shore
    sx = bx + 150
    box("Burj_Causeway", c, M("Asphalt"), (bx + sx) / 2 + 60, (by + coast(bx + 200)) / 2, -0.3, 320, 14, 0.6, rot=0.0)


def build_skyline(c):
    rnd = random.Random(77)
    mats = [material(f"SkyB{i}", col, rough=0.35, metal=0.5) for i, col in enumerate(((0.58, 0.64, 0.7), (0.78, 0.74, 0.66), (0.4, 0.5, 0.58), (0.86, 0.86, 0.84)))]
    srcs = []
    for i, m in enumerate(mats):
        b = box(f"SkySrc_{i}", c, m, 0, 0, 0, 1, 1, 1)
        hide_source(b)
        srcs.append(b)
    villa_m = material("VillaWall", (0.88, 0.82, 0.72), rough=0.8)
    vb = box("VillaSrc", c, villa_m, 0, 0, 0, 1, 1, 1)
    hide_source(vb)
    for k in range(260):
        x = rnd.uniform(-2400, 2400)
        y = rnd.uniform(-1300, 180)
        if math.hypot(x, y) < 210 or abs(y + 110) < 24 or abs(y - 205) < 28:
            continue
        # taller blocks toward the south-east (inland city centre)
        tall = rnd.random() < 0.14 and y < -200
        h = rnd.uniform(70, 260) if tall else rnd.uniform(6, 26)
        w = rnd.uniform(18, 44) if tall else rnd.uniform(14, 38)
        o = instance(f"Sky_{k}", rnd.choice(srcs) if tall else vb, c, (x, y, 0.0), rnd.uniform(0, 3.14), (w, w * rnd.uniform(0.8, 1.2), h))
    # a few lit beachfront blocks north of the highway
    for k in range(30):
        x = rnd.uniform(-1800, 1800)
        if abs(x) < 160:
            continue
        instance(f"Beach_{k}", vb, c, (x, rnd.uniform(235, 285), 0.0), 0.0, (rnd.uniform(24, 60), rnd.uniform(16, 30), rnd.uniform(6, 14)))


def build_site():
    c = sub("SITE")
    build_world()
    build_sun()
    build_sea(c)
    build_land(c)
    build_roads(c)
    build_podium(c)
    lc, cars = build_landscape()
    build_water_and_canopy(c)
    build_burj(c)
    build_skyline(c)
    return c


def animate_sky(keys):
    """keys: [(frame, elevation_deg, azimuth_deg, sun_strength, world_strength)]."""
    w = scene().world
    sky = w.node_tree.nodes["SKY"]
    bg = w.node_tree.nodes["BG"]
    sun = bpy.data.objects["SUN_key"]
    interp("BEZIER")
    for f, el, az, ss, ws in keys:
        sky.sun_elevation = math.radians(el)
        sky.sun_rotation = math.radians(az)
        bg.inputs["Strength"].default_value = ws
        w.node_tree.keyframe_insert(data_path='nodes["SKY"].sun_elevation', frame=f)
        w.node_tree.keyframe_insert(data_path='nodes["SKY"].sun_rotation', frame=f)
        w.node_tree.keyframe_insert(data_path='nodes["BG"].inputs[1].default_value', frame=f)
        sun.rotation_euler = (-sun_direction(el, az)).to_track_quat("-Z", "Y").to_euler()
        sun.data.energy = ss
        sun.keyframe_insert(data_path="rotation_euler", frame=f)
        sun.data.keyframe_insert(data_path="energy", frame=f)
