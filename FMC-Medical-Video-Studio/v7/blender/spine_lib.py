"""FMC lumbar spine library (Blender/bpy): vertebrae L1-L5 with body, pedicles, laminae, spinous + transverse + articular processes,
spinal canal with cauda-equina-style nerve bundle and exiting nerve roots, intervertebral discs (annulus lamellae + nucleus), sacrum.
Simplified teaching model with medically plausible proportions (units: metres; adult lumbar body ~4.5 cm wide, ~3 cm tall, disc ~1 cm).
Not patient-specific; needs clinician review. Coordinate convention: cranio-caudal axis = +X (towards head), dorsal = +Z, lateral = Y."""
import bpy, bmesh, math
from mathutils import Vector, Matrix

def mat(c, rough=0.5, emit=0.0, alpha=1.0, name='m'):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*c, 1); b.inputs['Roughness'].default_value = rough
    if 'Subsurface Weight' in b.inputs: b.inputs['Subsurface Weight'].default_value = 0.08
    if emit:
        b.inputs['Emission Color'].default_value = (*c, 1); b.inputs['Emission Strength'].default_value = emit
    if alpha < 1: b.inputs['Alpha'].default_value = alpha
    return m
BONE = lambda: mat((0.93, 0.89, 0.78), 0.55, name='bone')            # ivory
ANN1 = lambda: mat((0.90, 0.80, 0.62), 0.5, name='ann_a')           # layered cream
ANN2 = lambda: mat((0.72, 0.52, 0.32), 0.5, name='ann_b')           # beige
NUC = lambda: mat((0.25, 0.58, 0.95), 0.2, 0.7, name='nuc')       # subtle blue
NERVE = lambda: mat((1.0, 0.70, 0.08), 0.4, 0.6, name='nerve')    # warm yellow
LOAD = lambda: mat((0.95, 0.52, 0.15), 0.45, 0.5, name='load')      # restrained orange

def _link(o, parent):
    if parent is not None: o.parent = parent
    return o

def ell(name, loc, scale, m, parent=None, rot=(0, 0, 0), seg=24, ring=16):
    bpy.ops.mesh.primitive_uv_sphere_add(location=loc, rotation=rot, segments=seg, ring_count=ring); o = bpy.context.object
    o.name = name; o.scale = scale; o.data.materials.append(m); bpy.ops.object.shade_smooth(); return _link(o, parent)

def cyl(name, a, b, r0, r1, m, parent=None, verts=20):
    a, b = Vector(a), Vector(b); d = b - a
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r0, radius2=r1, depth=d.length, location=(a + b) / 2); o = bpy.context.object
    o.name = name; o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = d.to_track_quat('Z', 'Y'); o.data.materials.append(m); bpy.ops.object.shade_smooth()
    return _link(o, parent)

def tube(name, pts, r, m, parent=None):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = r; cu.bevel_resolution = 5; cu.resolution_u = 12
    sp = cu.splines.new('BEZIER'); sp.bezier_points.add(len(pts) - 1)
    for p, bp in zip(pts, sp.bezier_points): bp.co = p; bp.handle_left_type = bp.handle_right_type = 'AUTO'
    o = bpy.data.objects.new(name, cu); bpy.context.collection.objects.link(o); o.data.materials.append(m); return _link(o, parent)

def kidney_prism(name, w, d, h, m, parent=None, notch=0.18, n=28):
    """Vertebral body: kidney-shaped (posterior concavity) elliptical prism. Centered at origin, height along +X, width along Y, depth along Z (anterior = -Z)."""
    me = bpy.data.meshes.new(name); o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    bm = bmesh.new(); rings = []
    for lv, x in enumerate((-h / 2, -h * 0.42, h * 0.42, h / 2)):
        rr = 0.93 if lv in (0, 3) else 1.0                 # rounded endplate edges
        ring = []
        for i in range(n):
            a = 2 * math.pi * i / n
            y = math.cos(a) * w / 2 * rr; z = math.sin(a) * d / 2 * rr
            if z > 0: z -= notch * d * max(0.0, math.cos(a * 1.0)) ** 2 * 0.0 + notch * d * (1 - abs(math.sin(a))) * 0.9 * (math.sin(a) > 0)   # posterior concavity
            ring.append(bm.verts.new((x, y, z)))
        rings.append(ring)
    for r in range(3):
        for i in range(n): bm.faces.new((rings[r][i], rings[r][(i + 1) % n], rings[r + 1][(i + 1) % n], rings[r + 1][i]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1]); bm.to_mesh(me); bm.free()
    o.data.materials.append(m); mod = o.modifiers.new('s', 'SUBSURF'); mod.levels = 1; mod.render_levels = 2
    bpy.context.view_layer.objects.active = o; bpy.ops.object.shade_smooth(); return _link(o, parent)

def vertebra(level, parent=None, S=1.0):
    """One lumbar vertebra at its local origin (centre of the body). L1..L5 sizes grow slightly downwards."""
    k = {'L1': 0.92, 'L2': 0.96, 'L3': 1.0, 'L4': 1.05, 'L5': 1.1}.get(level, 1.0) * S
    bone = BONE(); w, d, h = 0.045 * k, 0.034 * k, 0.029 * k
    root = bpy.data.objects.new(f'{level}', None); bpy.context.collection.objects.link(root); _link(root, parent)
    kidney_prism(f'{level}_body', w, d, h, bone, root)
    zc = d / 2 + 0.002                                                                  # posterior edge of the body
    for s in (-1, 1):
        cyl(f'{level}_pedicle{s}', (0, s * w * 0.30, zc - 0.006), (-0.002 * k, s * w * 0.32, zc + 0.017 * k), 0.0065 * k, 0.0060 * k, bone, root)   # pedicles
        cyl(f'{level}_lamina{s}', (-0.002 * k, s * w * 0.32, zc + 0.016 * k), (-0.001 * k, s * w * 0.06, zc + 0.032 * k), 0.0070 * k, 0.0062 * k, bone, root)  # laminae
        cyl(f'{level}_transverse{s}', (0.002 * k, s * w * 0.34, zc + 0.014 * k), (0.002 * k, s * (w * 0.5 + 0.034 * k), zc + 0.008 * k), 0.0048 * k, 0.0034 * k, bone, root)  # transverse processes
        ell(f'{level}_sap{s}', (h * 0.42, s * w * 0.22, zc + 0.030 * k), (0.0055 * k, 0.0042 * k, 0.0075 * k), bone, root)      # superior articular process
        ell(f'{level}_iap{s}', (-h * 0.42, s * w * 0.17, zc + 0.034 * k), (0.0055 * k, 0.0042 * k, 0.0075 * k), bone, root)     # inferior articular process
    cyl(f'{level}_spinous', (0, 0, zc + 0.030 * k), (-0.014 * k, 0, zc + 0.050 * k), 0.0072 * k, 0.0042 * k, bone, root)       # spinous process (posterior, slightly caudal)
    return root

def disc(name, parent=None, S=1.0, cutaway=False, w=0.049, d=0.037, h=0.012, load_side=0.0):
    """Intervertebral disc centred at origin: annulus fibrosus lamellae (alternating cream/beige shells) + nucleus pulposus (blue, slightly posterior).
    cutaway=True removes a 100-degree wedge so the layers and the nucleus are visible."""
    root = bpy.data.objects.new(name, None); bpy.context.collection.objects.link(root); _link(root, parent)
    a1, a2 = ANN1(), ANN2()
    n = 9
    for i in range(n):
        f = 1 - i * 0.085
        bm = bmesh.new(); V = 56; z0 = None
        sweep = (2 * math.pi - math.radians(100)) if cutaway else 2 * math.pi
        start = math.radians(50) if cutaway else 0.0
        steps = V if cutaway else V
        rings = []
        for xi, x in enumerate((-h / 2, h / 2)):
            ring = []
            for j in range(steps + (1 if cutaway else 0)):
                ang = start + sweep * j / steps
                y = math.cos(ang) * w / 2 * f; z = math.sin(ang) * d / 2 * f
                if z > 0: z -= 0.18 * d * f * (1 - abs(math.sin(ang)))
                ring.append(bm.verts.new((x * (1 + 0.04 * math.sin(i)), y, z)))
            rings.append(ring)
        cnt = len(rings[0])
        for j in range(cnt - (1 if cutaway else 0)):
            jn = (j + 1) % cnt
            bm.faces.new((rings[0][j], rings[0][jn], rings[1][jn], rings[1][j]))
        if cutaway:    # close the wedge faces so shells look solid
            bm.faces.new((rings[0][0], rings[1][0], rings[1][0], rings[0][0])) if False else None
        me = bpy.data.meshes.new(f'{name}_ann{i}'); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(f'{name}_ann{i}', me); bpy.context.collection.objects.link(o)
        o.data.materials.append(a1 if i % 2 == 0 else a2); mod = o.modifiers.new('sol', 'SOLIDIFY'); mod.thickness = 0.0009; mod.offset = 0
        bpy.context.view_layer.objects.active = o; bpy.ops.object.shade_smooth(); _link(o, root)
    # solid core for the outer annulus bulk (closed disc) so it reads as a solid when not cut away
    if not cutaway:
        core = ell(f'{name}_core', (0, 0, 0), (h / 2, w / 2 * 0.98, d / 2 * 0.98), a1, root, seg=40)
    nuc = ell(f'{name}_nucleus', (0, 0, -0.0015), (h * 0.46, w * 0.25, d * 0.27), NUC(), root, seg=36)
    if cutaway: nuc.location = (0, 0, -0.0015)
    return root

def sacrum(parent=None, S=1.0):
    root = bpy.data.objects.new('Sacrum', None); bpy.context.collection.objects.link(root); _link(root, parent)
    bone = BONE()
    # wedge-shaped sacral body (S1 base broad -> apex narrow), tilted; centred at the S1 superior endplate origin
    for i, (x, wy, dz) in enumerate([(-0.012, 0.050, 0.036), (-0.036, 0.044, 0.034), (-0.060, 0.036, 0.030), (-0.082, 0.028, 0.026), (-0.100, 0.020, 0.022)]):
        ell(f'S{i+1}', (x, 0, -0.008 * i), (0.016, wy / 2, dz / 2), bone, root)
    for s in (-1, 1):
        ell(f'ala{s}', (-0.010, s * 0.050, 0.0), (0.014, 0.028, 0.012), bone, root)      # sacral ala
        cyl(f'sacral_crest{s}', (-0.014, s * 0.014, 0.020), (-0.090, s * 0.010, 0.012), 0.008, 0.006, bone, root)
    cyl('median_crest', (-0.010, 0, 0.026), (-0.095, 0, 0.016), 0.008, 0.005, bone, root)
    return root

def nerves(levels_x, parent=None):
    """Spinal cord/cauda equina bundle in the canal + exiting nerve roots (warm yellow)."""
    root = bpy.data.objects.new('Nerves', None); bpy.context.collection.objects.link(root); _link(root, parent)
    nm = NERVE()
    zc = 0.017 + 0.012
    x0, x1 = levels_x[0], levels_x[-1]
    tube('thecal_sac', [(x1 + 0.02, 0, zc), ((x0 + x1) / 2, 0, zc + 0.001), (x0 - 0.06, 0, zc)], 0.012, mat((0.97, 0.86, 0.55), 0.5, 0.15, name='sac'), root)
    for i, x in enumerate(levels_x):
        for s in (-1, 1):
            tube(f'root{i}{s}', [(x - 0.004, s * 0.006, zc), (x - 0.010, s * 0.020, zc - 0.002), (x - 0.016, s * 0.038, zc - 0.010)], 0.0021, nm, root)
    return root

def lumbar_stack(parent=None, S=1.0, cutaway_disc=None, nerves_on=True):
    """L1-L5 + discs + sacrum along +X (head direction). Returns dict of roots by name and the x-positions of vertebral centres."""
    levels = ['L5', 'L4', 'L3', 'L2', 'L1']
    pitch = 0.029 + 0.012
    x = 0.0
    out = {}
    out['Sacrum'] = sacrum(parent, S)
    out['Sacrum'].location = (0.0, 0, 0)
    x = 0.012 / 2 + 0.0 + 0.0                  # S1 superior endplate at x=0
    xs = []
    prev_disc_x = 0.0
    for i, lv in enumerate(levels):
        dx = (0.012 if i >= 0 else 0) + 0.029 / 2
        dname = f'D_{"S1" if i == 0 else levels[i-1]}_{lv}'
        d = disc(dname, parent, S, cutaway=(cutaway_disc == dname)); d.location = (prev_disc_x + 0.012 / 2, 0, 0.0); out[dname] = d
        v = vertebra(lv, parent, S); v.location = (prev_disc_x + 0.012 + 0.029 / 2, 0, 0.0); out[lv] = v
        xs.append(v.location.x); prev_disc_x = prev_disc_x + 0.012 + 0.029
    if nerves_on: out['Nerves'] = nerves(xs, parent)
    return out, xs
