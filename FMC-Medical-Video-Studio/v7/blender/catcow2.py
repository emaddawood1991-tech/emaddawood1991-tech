"""FMC Cat-Cow V2: upgraded original character (detailed head/hair/hands/clothing, 5-joint spine, breathing, blink), premium FMC studio with depth of field,
real 3D lumbar anatomy (L1-L5, sacrum, discs, canal + nerves) bone-parented inside the torso, and an X-ray (translucent torso) render pass.
python catcow2.py <cam: hero|side|close|top> <mode: normal|xray> <outdir> [frames=60] [W=540] [H=960] [spp=8] [only_frame=0]"""
import bpy, math, sys, os, json
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import spine_lib as SL
cam_name, MODE, out = sys.argv[1], sys.argv[2], sys.argv[3]
N = int(sys.argv[4]) if len(sys.argv) > 4 else 60
W = int(sys.argv[5]) if len(sys.argv) > 5 else 540
H = int(sys.argv[6]) if len(sys.argv) > 6 else 960
SPP = int(sys.argv[7]) if len(sys.argv) > 7 else 8
ONLY = int(sys.argv[8]) if len(sys.argv) > 8 else 0
LOGO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'logo', 'fmc-original-logo.png'))
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SPP; sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = W, H
sc.render.image_settings.file_format = 'PNG'; sc.render.film_transparent = False
sc.view_settings.view_transform = 'AgX'; sc.view_settings.exposure = -0.8
sc.world = bpy.data.worlds.new('w'); sc.world.use_nodes = True
bgn = sc.world.node_tree.nodes['Background']; bgn.inputs['Color'].default_value = (0.9, 0.93, 0.96, 1); bgn.inputs['Strength'].default_value = 0.10
M = SL.mat
SKIN = M((0.80, 0.57, 0.44), 0.45, name='skin'); SHIRT = M((0.05, 0.12, 0.27), 0.7, name='shirt'); PANTS = M((0.08, 0.10, 0.15), 0.75, name='pants')
HAIR = M((0.06, 0.04, 0.03), 0.4, name='hair'); WHITE = M((0.95, 0.95, 0.95), 0.25, name='white'); DARK = M((0.015, 0.015, 0.015), 0.2, name='dark')
SHOE = M((0.92, 0.93, 0.96), 0.55, name='shoe'); SHOEUP = M((0.05, 0.12, 0.27), 0.6, name='shoeup'); TURQ = M((0.31, 0.9, 0.85), 0.4, 0.9, name='turq')
IRIS = M((0.25, 0.14, 0.07), 0.2, name='iris'); LIP = M((0.62, 0.30, 0.27), 0.5, name='lip')
# X-ray material (translucent torso with a restrained turquoise rim)
def xray_mat(c, a=0.10):
    m = bpy.data.materials.new('xr'); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out_ = nt.nodes.new('ShaderNodeOutputMaterial'); mix = nt.nodes.new('ShaderNodeMixShader'); tr = nt.nodes.new('ShaderNodeBsdfTransparent')
    pr = nt.nodes.new('ShaderNodeBsdfPrincipled'); pr.inputs['Base Color'].default_value = (*c, 1); pr.inputs['Roughness'].default_value = 0.7
    fr = nt.nodes.new('ShaderNodeLayerWeight'); fr.inputs['Blend'].default_value = 0.35
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (0.31, 0.9, 0.85, 1); em.inputs['Strength'].default_value = 1.2
    add = nt.nodes.new('ShaderNodeAddShader'); mx2 = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(fr.outputs['Facing'], mx2.inputs['Fac']); nt.links.new(tr.outputs[0], mx2.inputs[1]); nt.links.new(em.outputs[0], mx2.inputs[2])   # rim glow
    mix.inputs['Fac'].default_value = a; nt.links.new(mx2.outputs[0], mix.inputs[1]); nt.links.new(pr.outputs[0], mix.inputs[2]); nt.links.new(mix.outputs[0], out_.inputs['Surface'])
    m.blend_method = 'BLEND' if hasattr(m, 'blend_method') else None
    return m
XR_SHIRT = xray_mat((0.05, 0.12, 0.27), 0.10); XR_PANTS = xray_mat((0.08, 0.10, 0.15), 0.12)
# ---------------- studio ----------------
def box(name, loc, size, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot); o = bpy.context.object; o.name = name; o.scale = (size[0] / 2, size[1] / 2, size[2] / 2); o.data.materials.append(m); return o
# floor: warm light wood planks (procedural wave stripes)
fm = bpy.data.materials.new('floor'); fm.use_nodes = True; nt = fm.node_tree; b = nt.nodes['Principled BSDF']; b.inputs['Roughness'].default_value = 0.35
wv = nt.nodes.new('ShaderNodeTexWave'); wv.wave_type = 'BANDS'; wv.bands_direction = 'X'; wv.inputs['Scale'].default_value = 6; wv.inputs['Distortion'].default_value = 1.5
ramp = nt.nodes.new('ShaderNodeValToRGB'); ramp.color_ramp.elements[0].color = (0.62, 0.48, 0.34, 1); ramp.color_ramp.elements[1].color = (0.76, 0.62, 0.46, 1)
nt.links.new(wv.outputs['Fac'], ramp.inputs['Fac']); nt.links.new(ramp.outputs['Color'], b.inputs['Base Color'])
box('Floor', (0.3, 0, -0.05), (7, 5, 0.1), fm)
wallm = M((0.96, 0.94, 0.90), 0.85, name='wall')
box('Wall', (0.3, 1.6, 1.6), (7, 0.1, 3.2), wallm); box('WallSide', (-2.3, 0, 1.6), (0.1, 5, 3.2), wallm)
box('Base', (0.3, 1.54, 0.06), (7, 0.04, 0.12), M((0.92, 0.9, 0.86), 0.6, name='base'))
box('NavyPanel', (-0.5, 1.545, 1.05), (2.4, 0.03, 0.95), M((0.05, 0.13, 0.26), 0.6, name='navy'))             # FMC navy accent
box('TurqLine', (-0.5, 1.53, 1.54), (2.4, 0.02, 0.022), SL.mat((0.31, 0.9, 0.85), 0.4, 1.0, name='tl'))      # turquoise detail
box('TurqLine2', (-0.5, 1.53, 0.58), (2.4, 0.02, 0.014), SL.mat((0.31, 0.9, 0.85), 0.4, 0.8, name='tl2'))
# treatment plinth + cushion + shelf + window + plant (background equipment, restrained)
box('PlinthBase', (1.55, 1.15, 0.30), (0.75, 0.55, 0.60), M((0.85, 0.86, 0.88), 0.5, name='plinth')); box('PlinthPad', (1.55, 1.15, 0.64), (0.78, 0.58, 0.08), M((0.14, 0.38, 0.48), 0.6, name='pad'))
box('Shelf', (2.35, 1.48, 0.95), (1.0, 0.22, 0.04), M((0.72, 0.58, 0.42), 0.5, name='shelf')); box('Pot', (2.55, 1.46, 1.08), (0.14, 0.14, 0.22), M((0.9, 0.9, 0.9), 0.5, name='pot'))
box('Leaf', (2.55, 1.46, 1.3), (0.22, 0.22, 0.24), M((0.16, 0.42, 0.26), 0.6, name='leaf'))
box('Window', (-1.55, 1.52, 1.7), (1.1, 0.02, 1.25), SL.mat((0.85, 0.93, 1.0), 0.3, 1.2, name='win'))                  # soft window glow
box('Rail', (-0.5, 1.40, 0.95), (2.0, 0.04, 0.04), M((0.8, 0.82, 0.85), 0.35, name='rail'))
bpy.ops.mesh.primitive_plane_add(location=(1.1, 1.535, 1.6), rotation=(math.pi / 2, 0, 0)); logo = bpy.context.object; logo.scale = (0.28, 0.28, 1)
lm = bpy.data.materials.new('logo'); lm.use_nodes = True; tx = lm.node_tree.nodes.new('ShaderNodeTexImage'); tx.image = bpy.data.images.load(LOGO)
bb = lm.node_tree.nodes['Principled BSDF']; lm.node_tree.links.new(tx.outputs['Color'], bb.inputs['Base Color']); lm.node_tree.links.new(tx.outputs['Alpha'], bb.inputs['Alpha']); logo.data.materials.append(lm)
matobj = box('Mat', (0.2, 0, 0.012), (1.0, 0.9, 0.024), M((0.08, 0.30, 0.38), 0.8, name='mat')); matobj.scale = (0.45, 1.0, 0.012)
matobj.scale = (1.0, 0.45, 0.012); matobj.rotation_euler = (0, 0, math.pi / 2)
def area(loc, energy, size, rot, color=(1, 1, 1)):
    bpy.ops.object.light_add(type='AREA', location=loc, rotation=rot); l = bpy.context.object; l.data.energy = energy; l.data.size = size; l.data.color = color
area((1.4, -2.6, 2.4), 380, 3.2, (math.radians(62), 0, math.radians(25)), (1, 0.96, 0.9)); area((-1.8, -2.0, 1.4), 150, 3.0, (math.radians(75), 0, math.radians(-30)), (0.85, 0.92, 1))
area((0.3, 1.2, 2.6), 240, 4.0, (math.radians(180), 0, 0), (0.7, 0.9, 1)); area((2.2, 0.9, 1.8), 120, 1.5, (math.radians(110), 0, math.radians(150)), (0.7, 1, 0.95))
# ---------------- armature ----------------
HIP = Vector((0.0, 0.0, 0.50)); SH = Vector((0.62, 0.0, 0.57)); SP = 5
bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0)); arm = bpy.context.object; arm.name = 'FMC_Rig'; arm.data.name = 'FMC_RigData'
eb = arm.data.edit_bones; eb.remove(eb[0])
def bone(name, head, tail, parent=None, connect=False):
    b = eb.new(name); b.head = Vector(head); b.tail = Vector(tail)
    if parent: b.parent = eb[parent]; b.use_connect = connect
bone('root', HIP, HIP + Vector((0, 0.001, 0.05))); bone('pelvis', HIP, HIP + Vector((0.08, 0, 0.0)), 'root'); prev = 'pelvis'
for i in range(SP):
    a = HIP + Vector((0.08, 0, 0)) + (SH - HIP - Vector((0.08, 0, 0))) * (i / SP); b2 = HIP + Vector((0.08, 0, 0)) + (SH - HIP - Vector((0.08, 0, 0))) * ((i + 1) / SP)
    bone(f'spine{i+1}', a, b2, prev, connect=(i > 0)); prev = f'spine{i+1}'
bone('chest', SH, SH + Vector((0.01, 0, 0.0)), prev, True); bone('neck', SH, SH + Vector((0.07, 0, 0.07)), 'chest'); bone('head', SH + Vector((0.07, 0, 0.07)), SH + Vector((0.07, 0, 0.07)) + Vector((0.16, 0, 0.0)), 'neck', True)
for s, y in (('L', -0.19), ('R', 0.19)):
    sh = Vector((SH.x, y, SH.z - 0.02)); el = Vector((SH.x, y, 0.31)); wr = Vector((SH.x, y, 0.045))
    bone(f'shoulder.{s}', Vector((SH.x, 0, SH.z - 0.02)), sh, 'chest'); bone(f'upper_arm.{s}', sh, el + Vector((0.004, 0, 0)), f'shoulder.{s}', True); bone(f'forearm.{s}', el + Vector((0.004, 0, 0)), wr, f'upper_arm.{s}', True)
    bone(f'hand.{s}', wr, wr + Vector((0.17, 0, 0)), f'forearm.{s}', True); hy = y * 0.55
    bone(f'thigh.{s}', Vector((0, hy, HIP.z)), Vector((0, hy, 0.075)), 'root'); bone(f'shin.{s}', Vector((0, hy, 0.075)), Vector((-0.44, hy, 0.065)), f'thigh.{s}', True)
    bone(f'foot.{s}', Vector((-0.44, hy, 0.065)), Vector((-0.58, hy, 0.04)), f'shin.{s}', True)
bpy.ops.object.mode_set(mode='OBJECT'); bpy.context.view_layer.update()
for s, y in (('L', -0.19), ('R', 0.19)):
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(SH.x, y, 0.045)); tgt = bpy.context.object; tgt.name = f'IK_hand.{s}'
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(SH.x - 0.35, y * 1.2, 0.35)); pole = bpy.context.object; pole.name = f'IKpole.{s}'
    bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='POSE')
    c = arm.pose.bones[f'forearm.{s}'].constraints.new('IK'); c.target = tgt; c.pole_target = pole; c.chain_count = 2; c.pole_angle = math.radians(-90)
    bpy.ops.object.mode_set(mode='OBJECT')
def attach(o, bone_name):
    bpy.context.view_layer.update(); o.parent = arm; o.parent_type = 'BONE'; o.parent_bone = bone_name; o.matrix_parent_inverse = Matrix.Identity(4)
    bpy.context.view_layer.update(); P = o.matrix_world @ o.matrix_basis.inverted(); o.matrix_parent_inverse = P.inverted()
def sph(loc, sc_, m, bn, seg=28, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(location=loc, rotation=rot, segments=seg, ring_count=18); o = bpy.context.object; o.scale = sc_; o.data.materials.append(m); bpy.ops.object.shade_smooth(); attach(o, bn); return o
def cap(a, b, r0, r1, m, bn):
    a, b = Vector(a), Vector(b); d = b - a
    bpy.ops.mesh.primitive_cone_add(vertices=28, radius1=r0, radius2=r1, depth=d.length, location=(a + b) / 2); o = bpy.context.object
    o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = d.to_track_quat('Z', 'Y'); o.data.materials.append(m); bpy.ops.object.shade_smooth(); attach(o, bn)
    sph(a, (r0, r0, r0), m, bn); sph(b, (r1, r1, r1), m, bn)
# ---- torso (one smooth skinned mesh)
import bmesh
def make_torso():
    me = bpy.data.meshes.new('torso'); o = bpy.data.objects.new('Torso', me); bpy.context.collection.objects.link(o)
    bm = bmesh.new(); R = 30; V = 22; rings = []
    prof = [(0.0, 0.15, 0.13), (0.16, 0.128, 0.12), (0.36, 0.122, 0.118), (0.58, 0.15, 0.142), (0.80, 0.185, 0.152), (1.0, 0.195, 0.14)]
    def interp(t):
        for k in range(len(prof) - 1):
            if prof[k][0] <= t <= prof[k + 1][0]:
                u = (t - prof[k][0]) / (prof[k + 1][0] - prof[k][0]); u = u * u * (3 - 2 * u)
                return (prof[k][1] + (prof[k + 1][1] - prof[k][1]) * u, prof[k][2] + (prof[k + 1][2] - prof[k][2]) * u)
        return prof[-1][1:]
    x0, x1 = HIP.x + 0.02, SH.x + 0.01
    for r in range(R + 1):
        t = r / R; x = x0 + (x1 - x0) * t; z = HIP.z + (SH.z - HIP.z) * t + 0.01; ry, rz = interp(t)
        rings.append([bm.verts.new((x, ry * math.cos(2 * math.pi * v / V), z + rz * math.sin(2 * math.pi * v / V))) for v in range(V)])
    for r in range(R):
        for v in range(V): bm.faces.new((rings[r][v], rings[r][(v + 1) % V], rings[r + 1][(v + 1) % V], rings[r + 1][v]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1]); bm.to_mesh(me); bm.free(); o.data.materials.append(SHIRT)
    mod = o.modifiers.new('sub', 'SUBSURF'); mod.levels = 1; mod.render_levels = 2; bpy.context.view_layer.objects.active = o; bpy.ops.object.shade_smooth(); return o
torso = make_torso(); bpy.ops.object.select_all(action='DESELECT'); torso.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
pelvis_obj = sph(HIP + Vector((0.01, 0, 0.0)), (0.12, 0.17, 0.12), PANTS, 'pelvis')
# collar + shoulder caps
bpy.ops.mesh.primitive_torus_add(location=SH + Vector((0.075, 0, 0.055)), major_radius=0.052, minor_radius=0.012, rotation=(0, math.radians(40), 0)); col = bpy.context.object; col.data.materials.append(SHIRT); bpy.ops.object.shade_smooth(); attach(col, 'neck')
for sy in (-1, 1): sph(SH + Vector((0.0, sy * 0.17, -0.02)), (0.075, 0.075, 0.075), SHIRT, 'chest')
# ---- neck + detailed head
cap(SH + Vector((0.01, 0, 0.0)), SH + Vector((0.075, 0, 0.065)), 0.050, 0.046, SKIN, 'neck')
HC = SH + Vector((0.075, 0, 0.065)) + Vector((0.105, 0, 0.0))
sph(HC, (0.106, 0.086, 0.110), SKIN, 'head', 48); sph(HC + Vector((0.030, 0, -0.058)), (0.074, 0.066, 0.058), SKIN, 'head', 40)          # skull + jaw
for sy in (-1, 1):
    sph(HC + Vector((0.055, sy * 0.050, -0.030)), (0.034, 0.030, 0.034), SKIN, 'head')                                                      # cheeks
    sph(HC + Vector((-0.005, sy * 0.090, -0.004)), (0.013, 0.009, 0.024), SKIN, 'head'); sph(HC + Vector((-0.002, sy * 0.093, -0.004)), (0.007, 0.005, 0.015), M((0.55, 0.34, 0.28), 0.5, name='ear'), 'head')   # ears
    sph(HC + Vector((0.078, sy * 0.037, 0.022)), (0.015, 0.016, 0.0135), WHITE, 'head'); sph(HC + Vector((0.090, sy * 0.037, 0.022)), (0.0075, 0.0075, 0.0075), IRIS, 'head'); sph(HC + Vector((0.094, sy * 0.037, 0.022)), (0.0038, 0.0038, 0.0038), DARK, 'head')
    sph(HC + Vector((0.080, sy * 0.037, 0.034)), (0.016, 0.017, 0.008), SKIN, 'head')                                                       # upper eyelid
    brow = sph(HC + Vector((0.080, sy * 0.036, 0.048)), (0.020, 0.0085, 0.0045), HAIR, 'head', rot=(0, 0, math.radians(sy * -8)))            # eyebrows
sph(HC + Vector((0.098, 0, -0.006)), (0.014, 0.012, 0.022), SKIN, 'head'); sph(HC + Vector((0.108, 0, -0.016)), (0.011, 0.012, 0.010), SKIN, 'head')   # nose
sph(HC + Vector((0.098, 0, -0.040)), (0.011, 0.024, 0.006), LIP, 'head'); sph(HC + Vector((0.094, 0, -0.050)), (0.010, 0.021, 0.006), LIP, 'head')   # lips
# hair: layered clumps (short, neatly styled, side-swept) - clean-shaven face
import random
random.seed(7)
sph(HC + Vector((-0.018, 0, 0.030)), (0.108, 0.090, 0.088), HAIR, 'head', 40)
for i in range(34):
    a = random.uniform(-1.3, 1.3); b = random.uniform(0.2, 1.35)
    px = -0.020 + 0.075 * math.cos(b) * math.cos(a) * 0.9; py = 0.088 * math.sin(a) * math.cos(b); pz = 0.030 + 0.092 * math.sin(b)
    sph(HC + Vector((px, py, pz)), (0.030, 0.020, 0.016), HAIR, 'head', 16, rot=(random.uniform(-0.4, 0.4), random.uniform(0.2, 0.9), random.uniform(-0.5, 0.5)))
for k in range(7):  # swept fringe over the forehead
    sph(HC + Vector((0.060 - k * 0.002, -0.052 + k * 0.016, 0.084)), (0.030, 0.014, 0.012), HAIR, 'head', 16, rot=(0, 0.5, math.radians(-22)))
for sy in (-1, 1): sph(HC + Vector((0.020, sy * 0.080, 0.030)), (0.030, 0.010, 0.036), HAIR, 'head', 16)   # sideburns (short)
# ---- arms: sleeve + stripe, forearm, detailed hand (palm + 4 fingers x3 phalanges + thumb x2)
for s, y in (('L', -0.19), ('R', 0.19)):
    sh = Vector((SH.x, y, SH.z - 0.02)); el = Vector((SH.x + 0.004, y, 0.31)); wr = Vector((SH.x, y, 0.045))
    cap(sh, el, 0.060, 0.047, SHIRT, f'upper_arm.{s}'); cap(el, wr + Vector((0, 0, 0.012)), 0.044, 0.030, SKIN, f'forearm.{s}')
    bpy.ops.mesh.primitive_torus_add(location=sh + (el - sh) * 0.62, major_radius=0.052, minor_radius=0.005); st = bpy.context.object; st.data.materials.append(TURQ); attach(st, f'upper_arm.{s}')   # FMC stripe
    sph(wr + Vector((0.065, 0, 0.0)), (0.075, 0.048, 0.017), SKIN, f'hand.{s}')
    for k in range(4):
        fy = (-0.034 + k * 0.023) * (1 if y > 0 else 1); Ls = [(0.040, 0.026, 0.020), (0.046, 0.030, 0.022), (0.043, 0.028, 0.021), (0.036, 0.023, 0.018)][k]
        x0 = 0.115; yy = fy + (k - 1.5) * 0.004
        for j, L in enumerate(Ls):
            r = 0.0105 - j * 0.0014
            cap(wr + Vector((x0, yy, 0.002)), wr + Vector((x0 + L, yy, 0.002)), r, r * 0.92, SKIN, f'hand.{s}'); x0 += L
    sgn = 1 if y > 0 else -1
    cap(wr + Vector((0.035, sgn * 0.045, 0.002)), wr + Vector((0.075, sgn * 0.075, 0.002)), 0.0125, 0.0105, SKIN, f'hand.{s}'); cap(wr + Vector((0.075, sgn * 0.075, 0.002)), wr + Vector((0.100, sgn * 0.092, 0.002)), 0.0105, 0.0095, SKIN, f'hand.{s}')
# ---- legs: trousers with cuffs, trainers
for s, y in (('L', -0.19), ('R', 0.19)):
    hy = y * 0.55
    cap((0, hy, HIP.z - 0.02), (0, hy, 0.085), 0.078, 0.060, PANTS, f'thigh.{s}'); cap((0, hy, 0.075), (-0.43, hy, 0.062), 0.058, 0.046, PANTS, f'shin.{s}')
    sph((-0.47, hy, 0.060), (0.020, 0.050, 0.050), PANTS, f'shin.{s}')
    sph((-0.52, hy, 0.052), (0.075, 0.048, 0.034), SHOEUP, f'foot.{s}'); sph((-0.52, hy, 0.074), (0.082, 0.050, 0.014), SHOE, f'foot.{s}'); sph((-0.585, hy, 0.050), (0.030, 0.045, 0.034), SHOEUP, f'foot.{s}')
# ---- real 3D lumbar anatomy inside the torso (bone-parented so it moves with the spine)
LUM_X0 = 0.07
SS = 1.3
stack, xs = SL.lumbar_stack(S=1.0)
def line_z(x): return HIP.z + (SH.z - HIP.z) * (x / (SH.x))
zoff = 0.026
for nm, root in stack.items():
    root.rotation_euler = (0, 0, 0); root.scale = (SS, SS, SS)
    if nm == 'Sacrum': root.location = (LUM_X0 + 0.012, 0, line_z(LUM_X0) + zoff)
    else:
        bx = root.location.x * SS; root.location = (LUM_X0 + 0.012 + bx, 0, line_z(LUM_X0 + bx) + zoff)
BONEOF = {'Sacrum': 'pelvis', 'L5': 'spine1', 'L4': 'spine1', 'L3': 'spine2', 'L2': 'spine2', 'L1': 'spine3', 'Nerves': 'spine2'}
for nm, root in stack.items():
    if nm.startswith('D_'):
        lv = nm.split('_')[2]; bn = BONEOF[lv]
    else: bn = BONEOF[nm]
    attach(root, bn)
    for ch in root.children_recursive: pass
SPINE_NAMES = list(stack.keys())
# ---- animation: multi-joint Cat-Cow with breathing, head follow, blink
bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='POSE'); pb = arm.pose.bones
def pitch_axis(bn):
    Mx = arm.data.bones[bn].matrix_local.to_3x3(); best = None
    for idx in (0, 2):
        d = Mx.col[idx].dot(Vector((0, 1, 0)))
        if best is None or abs(d) > abs(best[1]): best = (idx, d)
    return best[0], (1.0 if best[1] > 0 else -1.0)
AX = {b: pitch_axis(b) for b in ['pelvis', 'chest', 'neck', 'head'] + [f'spine{i+1}' for i in range(SP)] + ['shoulder.L', 'shoulder.R']}
def pitch(bn, ang):
    idx, sg = AX[bn]; e = [0.0, 0.0, 0.0]; e[idx] = -sg * ang; pb[bn].rotation_euler = tuple(e)
for b in pb: b.rotation_mode = 'XYZ'
for fr in range(1, N + 1):
    ph = (fr - 1) / N; a = math.sin(2 * math.pi * ph); cat = max(a, 0); cow = max(-a, 0)
    w = [0.9, 1.0, 1.0, 0.9, 0.7]
    for i in range(SP):
        ang = (-cat * 0.30 * w[i] + cow * 0.20 * w[i]) * (1.0 if i < 3 else -0.35 if cat > 0 else 0.6); pitch(f'spine{i+1}', ang); pb[f'spine{i+1}'].keyframe_insert('rotation_euler', frame=fr)
    pitch('pelvis', cat * 0.34 - cow * 0.24); pitch('chest', -cat * 0.05 + cow * 0.06); pitch('neck', cat * 0.35 - cow * 0.30); pitch('head', cat * 0.25 - cow * 0.20)
    for bn in ('pelvis', 'chest', 'neck', 'head'): pb[bn].keyframe_insert('rotation_euler', frame=fr)
    br = 1.0 + 0.012 * math.sin(2 * math.pi * ph * 3)                        # breathing (3 cycles per loop)
    pb['chest'].scale = (1.0, br, br); pb['chest'].keyframe_insert('scale', frame=fr)
    for s in ('L', 'R'): pitch(f'shoulder.{s}', -cat * 0.05 + cow * 0.04); pb[f'shoulder.{s}'].keyframe_insert('rotation_euler', frame=fr)
bpy.ops.object.mode_set(mode='OBJECT')
if MODE == 'xray':
    torso.data.materials[0] = XR_SHIRT; pelvis_obj.data.materials[0] = XR_PANTS
# ---------------- cameras (with subtle depth of field) ----------------
CAMS = {'hero': ((1.55, -2.35, 1.0), (0.28, 0.0, 0.34), 38), 'side': ((0.3, -2.7, 0.56), (0.3, 0.0, 0.34), 40), 'close': ((0.2, -1.3, 0.64), (0.2, 0.0, 0.52), 40), 'top': ((0.2, -0.02, 1.35), (0.2, 0.0, 0.5), 38)}
loc, tgt, lens = CAMS[cam_name]
bpy.ops.object.camera_add(location=loc); cam = bpy.context.object; cam.data.lens = lens; cam.data.sensor_width = 36; sc.camera = cam
cam.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y' if cam_name != 'top' else 'Y').to_euler()
if cam_name == 'top': cam.rotation_euler = (0, 0, math.radians(90)); cam.rotation_euler = (math.radians(0), 0, math.radians(-90))
cam.data.dof.use_dof = True; cam.data.dof.focus_distance = (Vector(tgt) - Vector(loc)).length; cam.data.dof.aperture_fstop = 5.6
os.makedirs(out, exist_ok=True)
marks = {'cam': cam_name, 'mode': MODE, 'W': W, 'H': H, 'frames': []}
frames = [ONLY] if ONLY else list(range(1, N + 1))
for fr in frames:
    sc.frame_set(fr); pts = {}
    for name in ['pelvis'] + [f'spine{i+1}' for i in range(SP)] + ['chest', 'neck', 'head', 'shoulder.R']:
        p = arm.matrix_world @ arm.pose.bones[name].head; q = world_to_camera_view(sc, cam, p); pts[name] = [round(q.x, 4), round(1 - q.y, 4)]
    for nm in ['L1', 'L2', 'L3', 'L4', 'L5', 'Sacrum']:
        p = stack[nm].matrix_world.translation; q = world_to_camera_view(sc, cam, p); pts[nm] = [round(q.x, 4), round(1 - q.y, 4)]
    marks['frames'].append(pts)
    png = os.path.join(out, f'f_{fr:04d}.png')
    if os.path.exists(png) and os.path.getsize(png) > 1000: continue
    sc.render.filepath = png; bpy.ops.render.render(write_still=True)
json.dump(marks, open(os.path.join(out, f'landmarks_{cam_name}_{MODE}.json'), 'w'))
print('RENDERED', cam_name, MODE, len(frames))
