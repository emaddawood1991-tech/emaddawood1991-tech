"""Dubai Azure Tower: procedural 50-floor twisting tower (skin, fins, slabs, balconies, crown, spire).
One lofted glass skin + a few combined meshes keep the render cost low. All dimensions come from tower_params.json."""
import math

import bmesh
import bpy
from mathutils import Vector

from lib import *  # noqa: F401,F403

M_PTS = T["ring_points"]
FIN_STEP = M_PTS // T["fin_count"]


def ring_levels():
    """z values of every floor boundary from ground to the roof."""
    zs = [0.0, T["lobby_height"]]
    for f in range(2, T["floors"] + 1):
        zs.append(floor_z(f) + T["floor_height"])
    return zs


def crown_point(s, theta, offset=0.0):
    """Crown ring point: s in 0..1 above the roof; keeps twisting and narrows to the spire base."""
    top = top_z()
    base = ring_point(top, theta)
    k = 1.0 - 0.46 * s ** 1.4
    a = math.atan2(base.y, base.x) + math.radians(18) * s
    r = math.hypot(base.x, base.y) * k + offset
    return Vector((r * math.cos(a), r * math.sin(a), top + T["crown_height"] * s))


def theta_i(i):
    return 2 * math.pi * i / M_PTS


def loft(name, c, m, pts_rings, closed=True, uv=None, flip=False):
    """pts_rings: list of rings (each a list of Vectors) -> quad strip mesh. uv=(vscale) adds a UV layer (u around, v up)."""
    bm = bmesh.new()
    rings = [[bm.verts.new(p) for p in ring] for ring in pts_rings]
    n = len(rings[0])
    uvl = bm.loops.layers.uv.new("UVMap") if uv else None
    for k in range(len(rings) - 1):
        for i in range(n if closed else n - 1):
            j = (i + 1) % n
            vs = [rings[k][i], rings[k][j], rings[k + 1][j], rings[k + 1][i]]
            if flip:
                vs.reverse()
            try:
                f = bm.faces.new(vs)
            except ValueError:
                continue
            if uvl:
                u0, u1 = i / n, (i + 1) / n
                v0, v1 = pts_rings[k][0].z / uv, pts_rings[k + 1][0].z / uv
                coords = [(u0, v0), (u1, v0), (u1, v1), (u0, v1)]
                if flip:
                    coords.reverse()
                for loop, uvc in zip(f.loops, coords):
                    loop[uvl].uv = uvc
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_obj(name, bm, c, m, smooth=False)


def build_materials():
    glass = material("TowerGlass", P["palette"]["glass"], rough=0.03, metal=0.45, spec=0.9)
    night = node_group_value(glass, "NIGHT", 0.0)
    nt, ln = glass.node_tree.nodes, glass.node_tree.links
    b = nt["Principled BSDF"]
    # window-cell emission mask: lit windows glow warm at night
    tc = nt.new("ShaderNodeTexCoord")
    sep = nt.new("ShaderNodeSeparateXYZ")
    ln.new(tc.outputs["UV"], sep.inputs[0])
    cells = []
    for axis, n in ((0, 72.0), (1, float(T["floors"] + 1))):
        mul = nt.new("ShaderNodeMath")
        mul.operation = "MULTIPLY"
        mul.inputs[1].default_value = n
        ln.new(sep.outputs[axis], mul.inputs[0])
        cells.append(mul)
    fl = []
    fr = []
    for mul in cells:
        f1 = nt.new("ShaderNodeMath")
        f1.operation = "FLOOR"
        ln.new(mul.outputs[0], f1.inputs[0])
        fl.append(f1)
        f2 = nt.new("ShaderNodeMath")
        f2.operation = "FRACT"
        ln.new(mul.outputs[0], f2.inputs[0])
        fr.append(f2)
    comb = nt.new("ShaderNodeCombineXYZ")
    ln.new(fl[0].outputs[0], comb.inputs[0])
    ln.new(fl[1].outputs[0], comb.inputs[1])
    wn = nt.new("ShaderNodeTexWhiteNoise")
    wn.noise_dimensions = "3D"
    ln.new(comb.outputs[0], wn.inputs["Vector"])
    lit = nt.new("ShaderNodeMath")
    lit.operation = "GREATER_THAN"
    lit.inputs[1].default_value = 0.32
    ln.new(wn.outputs["Value"], lit.inputs[0])

    def band(src, lo, hi):
        a_ = nt.new("ShaderNodeMath")
        a_.operation = "GREATER_THAN"
        a_.inputs[1].default_value = lo
        ln.new(src.outputs[0], a_.inputs[0])
        b_ = nt.new("ShaderNodeMath")
        b_.operation = "LESS_THAN"
        b_.inputs[1].default_value = hi
        ln.new(src.outputs[0], b_.inputs[0])
        m_ = nt.new("ShaderNodeMath")
        m_.operation = "MULTIPLY"
        ln.new(a_.outputs[0], m_.inputs[0])
        ln.new(b_.outputs[0], m_.inputs[1])
        return m_

    bu = band(fr[0], 0.08, 0.92)
    bv = band(fr[1], 0.14, 0.82)
    m1 = nt.new("ShaderNodeMath")
    m1.operation = "MULTIPLY"
    ln.new(bu.outputs[0], m1.inputs[0])
    ln.new(bv.outputs[0], m1.inputs[1])
    m2 = nt.new("ShaderNodeMath")
    m2.operation = "MULTIPLY"
    ln.new(m1.outputs[0], m2.inputs[0])
    ln.new(lit.outputs[0], m2.inputs[1])
    m3 = nt.new("ShaderNodeMath")
    m3.operation = "MULTIPLY"
    m3.inputs[1].default_value = 7.0
    ln.new(m2.outputs[0], m3.inputs[0])
    m4 = nt.new("ShaderNodeMath")
    m4.operation = "MULTIPLY"
    ln.new(m3.outputs[0], m4.inputs[0])
    ln.new(night.outputs[0], m4.inputs[1])
    ln.new(m4.outputs[0], b.inputs["Emission Strength"])
    b.inputs["Emission Color"].default_value = (*P["palette"]["warm_light"], 1.0)

    glass_clear = material("LobbyGlass", (0.75, 0.88, 0.95), rough=0.02, alpha=0.18, spec=1.0)
    material("Bronze", P["palette"]["bronze"], rough=0.26, metal=1.0)
    material("BronzeDark", (0.32, 0.22, 0.13), rough=0.35, metal=1.0)
    material("Stone", P["palette"]["stone"], rough=0.55)
    material("StoneLight", (0.9, 0.88, 0.82), rough=0.45)
    material("BalconyGlass", (0.8, 0.92, 1.0), rough=0.02, alpha=0.22, spec=1.0)
    crown = material("CrownGlow", P["palette"]["crown_light"], rough=0.1, metal=0.4, emit=P["palette"]["crown_light"], emit_strength=1.0)
    cn = node_group_value(crown, "NIGHT", 0.0)
    cnt, cln = crown.node_tree.nodes, crown.node_tree.links
    cb = cnt["Principled BSDF"]
    mulc = cnt.new("ShaderNodeMath")
    mulc.operation = "MULTIPLY_ADD"
    mulc.inputs[1].default_value = 14.0
    mulc.inputs[2].default_value = 1.2
    cln.new(cn.outputs[0], mulc.inputs[0])
    cln.new(mulc.outputs[0], cb.inputs["Emission Strength"])
    return glass, crown


def skin_rings(zs, offset=0.0):
    return [[ring_point(z, theta_i(i), offset) for i in range(M_PTS)] for z in zs]


def build_skin(c):
    zs = ring_levels()
    lobby = loft("Tower_Lobby_Glass", c, M("LobbyGlass"), skin_rings(zs[:2]), uv=None)
    skin = loft("Tower_Skin", c, M("TowerGlass"), skin_rings(zs[1:]), uv=top_z())
    return lobby, skin


def build_slabs(c):
    bm = bmesh.new()
    zs = ring_levels()
    for k in range(1, len(zs)):
        z = zs[k]
        a = [bm.verts.new(ring_point(z, theta_i(i), 0.38)) for i in range(M_PTS)]
        b = [bm.verts.new(ring_point(z + 0.55, theta_i(i), 0.38)) for i in range(M_PTS)]
        for i in range(M_PTS):
            j = (i + 1) % M_PTS
            try:
                bm.faces.new([a[i], a[j], b[j], b[i]])
            except ValueError:
                pass
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_obj("Tower_Slab_Edges", bm, c, M("StoneLight"))


def build_fins(c):
    """Champagne-bronze vertical fins that follow the twist and taper."""
    zs = ring_levels()
    bm = bmesh.new()
    for fi in range(T["fin_count"]):
        i = fi * FIN_STEP
        rings = []
        for z in zs[1:]:
            th = theta_i(i)
            p = ring_point(z, th)
            n = ring_normal(z, th)
            t = Vector((-n.y, n.x, 0.0))
            h = height_fraction(z)
            depth = 0.55 + 0.5 * (1 - h)
            w = 0.16
            rings.append([p - t * w + n * 0.02, p + t * w + n * 0.02, p + t * w + n * depth, p - t * w + n * depth])
        vs = [[bm.verts.new(q) for q in ring] for ring in rings]
        for k in range(len(vs) - 1):
            for a, b in ((1, 2), (2, 3), (3, 0)):
                try:
                    bm.faces.new([vs[k][a], vs[k][b], vs[k + 1][b], vs[k + 1][a]])
                except ValueError:
                    pass
        try:
            bm.faces.new([vs[-1][3], vs[-1][2], vs[-1][1], vs[-1][0]])
        except ValueError:
            pass
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_obj("Tower_Fins", bm, c, M("Bronze"))


def build_balconies(c):
    """Curved balconies on the residential floors: crescent slabs at each lobe tip + a glass balustrade."""
    f0, f1 = T["balcony_floors"]
    span = math.radians(T["balcony_span_degrees"])
    segs = 12
    bm = bmesh.new()
    gl = bmesh.new()
    for f in range(f0, f1 + 1):
        z0 = floor_z(f)
        top = z0 + 0.06
        bot = z0 - 0.3
        for lobe in range(T["lobe_count"]):
            tc = 2 * math.pi * lobe / T["lobe_count"] + (0.0 if f % 2 == 0 else 0.0)
            inner_t, inner_b, outer_t, outer_b = [], [], [], []
            for s in range(segs + 1):
                u = s / segs
                th = tc - span / 2 + span * u
                ext = T["balcony_depth"] * math.sin(math.pi * u) ** 0.55
                pin = ring_point(z0, th, -0.05)
                pout = ring_point(z0, th, ext)
                inner_t.append(bm.verts.new((pin.x, pin.y, top)))
                inner_b.append(bm.verts.new((pin.x, pin.y, bot)))
                outer_t.append(bm.verts.new((pout.x, pout.y, top)))
                outer_b.append(bm.verts.new((pout.x, pout.y, bot)))
            for s in range(segs):
                for quad in (
                    [inner_t[s], outer_t[s], outer_t[s + 1], inner_t[s + 1]],
                    [inner_b[s], inner_b[s + 1], outer_b[s + 1], outer_b[s]],
                    [outer_t[s], outer_b[s], outer_b[s + 1], outer_t[s + 1]],
                ):
                    try:
                        bm.faces.new(quad)
                    except ValueError:
                        pass
                # glass balustrade just inside the slab edge
                a = ring_point(z0, tc - span / 2 + span * s / segs, T["balcony_depth"] * math.sin(math.pi * s / segs) ** 0.55 - 0.08)
                b = ring_point(z0, tc - span / 2 + span * (s + 1) / segs, T["balcony_depth"] * math.sin(math.pi * (s + 1) / segs) ** 0.55 - 0.08)
                g = [gl.verts.new((a.x, a.y, top)), gl.verts.new((b.x, b.y, top)), gl.verts.new((b.x, b.y, top + 1.15)), gl.verts.new((a.x, a.y, top + 1.15))]
                try:
                    gl.faces.new(g)
                except ValueError:
                    pass
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    slab = mesh_obj("Tower_Balconies", bm, c, M("Stone"))
    glass = mesh_obj("Tower_Balcony_Glass", gl, c, M("BalconyGlass"))
    return slab, glass


def build_crown(c):
    """Illuminated crown: glowing skin, bronze ribs, light bands and a spire."""
    S = 12
    rings = [[crown_point(s / S, theta_i(i)) for i in range(M_PTS)] for s in range(S + 1)]
    skin = loft("Tower_Crown", c, M("CrownGlow"), rings, uv=top_z() + T["crown_height"])
    bm = bmesh.new()
    for fi in range(T["fin_count"] // 2):
        i = fi * FIN_STEP * 2
        rs = []
        for s in range(S + 1):
            u = s / S
            p = crown_point(u, theta_i(i))
            n = ring_normal(top_z(), theta_i(i))
            t = Vector((-n.y, n.x, 0.0))
            rs.append([p - t * 0.14, p + t * 0.14, p + t * 0.14 + n * 0.9 * (1 - u), p - t * 0.14 + n * 0.9 * (1 - u)])
        vs = [[bm.verts.new(q) for q in r] for r in rs]
        for k in range(len(vs) - 1):
            for a, b in ((1, 2), (2, 3), (3, 0)):
                try:
                    bm.faces.new([vs[k][a], vs[k][b], vs[k + 1][b], vs[k + 1][a]])
                except ValueError:
                    pass
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ribs = mesh_obj("Tower_Crown_Ribs", bm, c, M("Bronze"))
    top = top_z() + T["crown_height"]
    spire = cyl("Tower_Spire", c, M("CrownGlow"), 0, 0, top - 2, 1.1, T["spire_height"] + 2, seg=16, r2=0.06)
    # horizontal light bands around the crown
    bands = []
    for n, s in enumerate((0.25, 0.5, 0.75)):
        r = [crown_point(s, theta_i(i), 0.25) for i in range(M_PTS)]
        r2 = [Vector((p.x, p.y, p.z + 0.5)) for p in r]
        bands.append(loft(f"Tower_Crown_Band_{n}", c, M("CrownGlow"), [r, r2]))
    return skin, ribs, spire, bands


def build_core_and_base(c):
    """Bronze base plinth ring and the entrance portal frame on the south side."""
    zs = ring_levels()
    ring = [ring_point(0.0, theta_i(i), 0.6) for i in range(M_PTS)]
    ring2 = [Vector((p.x, p.y, 0.5)) for p in ring]
    base = loft("Tower_Base_Plinth", c, M("Stone"), [ring, ring2])
    # entrance portal: two bronze posts and a lintel at the south (-Y) side
    th = 1.5 * math.pi
    p = ring_point(0.0, th, 0.25)
    for dx, name in ((-3.4, "L"), (3.4, "R")):
        box(f"Entrance_Post_{name}", c, M("Bronze"), p.x + dx, p.y, 0.0, 0.5, 0.7, 8.6)
    box("Entrance_Lintel", c, M("Bronze"), p.x, p.y, 7.9, 7.4, 0.8, 0.7)
    return base


def build_tower():
    c = sub("TOWER")
    build_materials()
    lobby, skin = build_skin(c)
    build_slabs(c)
    build_fins(c)
    build_balconies(c)
    build_crown(c)
    build_core_and_base(c)
    return c


def animate_night(frames_values):
    """Keyframe the NIGHT value nodes: [(frame, value), ...]."""
    for name in ("TowerGlass", "CrownGlow"):
        nt = bpy.data.materials[name].node_tree
        node = nt.nodes["NIGHT"]
        for f, v in frames_values:
            node.outputs[0].default_value = v
            nt.keyframe_insert(data_path='nodes["NIGHT"].outputs[0].default_value', frame=f)
    return None
