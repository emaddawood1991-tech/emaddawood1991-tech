"""FMC Cat-Cow: original stylised 3D man (armature-rigged), FMC rehab studio, 3 cameras. Run with the bpy venv:
python catcow.py <cam: hero|side|close> <outdir> [frames=90] [W=540] [H=960] [spp=24] [only_frame=0]
Writes PNG frames + landmarks_<cam>.json (2D projected spine/joint landmarks per frame for the Remotion overlays)."""
import bpy, math, sys, os, json
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view
cam_name, out = sys.argv[1], sys.argv[2]
N = int(sys.argv[3]) if len(sys.argv) > 3 else 90
W = int(sys.argv[4]) if len(sys.argv) > 4 else 540
H = int(sys.argv[5]) if len(sys.argv) > 5 else 960
SPP = int(sys.argv[6]) if len(sys.argv) > 6 else 24
ONLY = int(sys.argv[7]) if len(sys.argv) > 7 else 0
LOGO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'logo', 'fmc-original-logo.png'))
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SPP; sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = W, H
sc.render.image_settings.file_format = 'PNG'; sc.render.film_transparent = False
sc.view_settings.view_transform = 'AgX'; sc.view_settings.exposure = -1.0
sc.world = bpy.data.worlds.new('w'); sc.world.use_nodes = True
bg = sc.world.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (0.9, 0.93, 0.96, 1); bg.inputs['Strength'].default_value = 0.12
def mat(c, rough=0.55, emit=0.0, metal=0.0):
    m = bpy.data.materials.new('m'); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*c, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*c, 1); b.inputs['Emission Strength'].default_value = emit
    return m
SKIN = mat((0.80, 0.58, 0.45), 0.5); SHIRT = mat((0.06, 0.15, 0.30), 0.7); PANTS = mat((0.09, 0.11, 0.16), 0.75)
HAIR = mat((0.07, 0.05, 0.04), 0.45); WHITE = mat((0.95, 0.95, 0.95), 0.3); DARK = mat((0.02, 0.02, 0.02), 0.3)
SHOE = mat((0.9, 0.92, 0.95), 0.6); TURQ = mat((0.31, 0.9, 0.85), 0.4, 0.8)
# ---------------- room ----------------
def box(name, loc, size, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot); o = bpy.context.object; o.name = name; o.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    o.data.materials.append(m); return o
floor = box('Floor', (0.3, 0, -0.05), (7, 5, 0.1), mat((0.78, 0.66, 0.5), 0.35))           # warm light wood
wall = box('Wall', (0.3, 1.6, 1.6), (7, 0.1, 3.2), mat((0.96, 0.94, 0.9), 0.85))            # warm white
side = box('WallSide', (-2.3, 0, 1.6), (0.1, 5, 3.2), mat((0.96, 0.94, 0.9), 0.85))
box('Base', (0.3, 1.54, 0.06), (7, 0.04, 0.12), mat((0.92, 0.9, 0.86), 0.6))
box('BluePanel', (-0.8, 1.545, 1.25), (3.6, 0.03, 1.9), mat((0.55, 0.72, 0.86), 0.7))       # soft medical-blue accent panel
box('TurqLine', (-0.8, 1.53, 2.28), (3.6, 0.02, 0.025), TURQ)                                # subtle turquoise detail
box('Shelf', (1.9, 1.5, 0.55), (1.2, 0.2, 0.05), mat((0.7, 0.55, 0.4), 0.5))
box('Plant', (2.35, 1.48, 0.7), (0.12, 0.12, 0.22), mat((0.2, 0.45, 0.3), 0.6))
bpy.ops.mesh.primitive_plane_add(location=(1.7, 1.535, 1.55), rotation=(math.pi / 2, 0, 0)); logo = bpy.context.object; logo.scale = (0.45, 0.45, 1)
lm = bpy.data.materials.new('logo'); lm.use_nodes = True; t = lm.node_tree.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(LOGO)
b = lm.node_tree.nodes['Principled BSDF']; lm.node_tree.links.new(t.outputs['Color'], b.inputs['Base Color']); lm.node_tree.links.new(t.outputs['Alpha'], b.inputs['Alpha']); lm.blend_method = 'BLEND' if hasattr(lm, 'blend_method') else None
logo.data.materials.append(lm)
mat_obj = box('Mat', (0.2, 0, 0.012), (0.9, 2.0, 0.024), mat((0.1, 0.32, 0.4), 0.8), rot=(0, 0, math.pi / 2))   # premium teal-navy mat (long along X)
mat_obj.scale = (1.0, 0.45, 0.012)
# ---------------- lights ----------------
def area(loc, energy, size, rot, color=(1, 1, 1)):
    bpy.ops.object.light_add(type='AREA', location=loc, rotation=rot); l = bpy.context.object; l.data.energy = energy; l.data.size = size; l.data.color = color; return l
area((1.4, -2.6, 2.4), 420, 3.2, (math.radians(62), 0, math.radians(25)), (1, 0.96, 0.9))     # soft key
area((-1.8, -2.0, 1.4), 160, 3.0, (math.radians(75), 0, math.radians(-30)), (0.85, 0.92, 1))  # gentle fill
area((0.3, 1.2, 2.6), 260, 4.0, (math.radians(180), 0, 0), (0.7, 0.9, 1))                     # indirect wall wash
area((2.2, 0.9, 1.8), 120, 1.5, (math.radians(110), 0, math.radians(150)), (0.7, 1, 0.95))   # rim (turquoise-tinted)
# ---------------- skeleton / armature ----------------
HIP = Vector((0.0, 0.0, 0.50)); SH = Vector((0.62, 0.0, 0.57))
bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0)); arm = bpy.context.object; arm.name = 'FMC_Rig'; arm.data.name = 'FMC_RigData'
eb = arm.data.edit_bones; eb.remove(eb[0])
def bone(name, head, tail, parent=None, connect=False):
    b = eb.new(name); b.head = Vector(head); b.tail = Vector(tail)
    if parent: b.parent = eb[parent]; b.use_connect = connect
    return b
bone('root', HIP, HIP + Vector((0, 0.001, 0.05)))
bone('pelvis', HIP, HIP + Vector((0.08, 0, 0.0)), 'root')
SP = 5; prev = 'pelvis'; sp_pts = []
for i in range(SP):
    a = HIP + Vector((0.08, 0, 0)) + (SH - HIP - Vector((0.08, 0, 0))) * (i / SP); b2 = HIP + Vector((0.08, 0, 0)) + (SH - HIP - Vector((0.08, 0, 0))) * ((i + 1) / SP)
    bone(f'spine{i+1}', a, b2, prev, connect=(i > 0)); prev = f'spine{i+1}'
bone('chest', SH, SH + Vector((0.01, 0, 0.0)), prev, True)
bone('neck', SH, SH + Vector((0.07, 0, 0.07)), 'chest'); bone('head', SH + Vector((0.07, 0, 0.07)), SH + Vector((0.07, 0, 0.07)) + Vector((0.16, 0, 0.0)), 'neck', True)
for s, y in (('L', -0.19), ('R', 0.19)):
    sh = Vector((SH.x, y, SH.z - 0.02)); el = Vector((SH.x, y * 1.0, 0.31)); wr = Vector((SH.x, y, 0.045))
    bone(f'shoulder.{s}', Vector((SH.x, 0, SH.z - 0.02)), sh, 'chest')
    bone(f'upper_arm.{s}', sh, el + Vector((0.004, 0, 0)), f'shoulder.{s}', True); bone(f'forearm.{s}', el + Vector((0.004, 0, 0)), wr, f'upper_arm.{s}', True)
    bone(f'hand.{s}', wr, wr + Vector((0.17, 0, -0.0)), f'forearm.{s}', True)
    hy = y * 0.55
    bone(f'thigh.{s}', Vector((0, hy, HIP.z)), Vector((0, hy, 0.075)), 'root'); bone(f'shin.{s}', Vector((0, hy, 0.075)), Vector((-0.44, hy, 0.065)), f'thigh.{s}', True)
    bone(f'foot.{s}', Vector((-0.44, hy, 0.065)), Vector((-0.58, hy, 0.04)), f'shin.{s}', True)
bpy.ops.object.mode_set(mode='OBJECT')
bpy.context.view_layer.update()
# IK targets for hands (hands stay planted on the mat)
for s, y in (('L', -0.19), ('R', 0.19)):
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(SH.x, y, 0.045)); tgt = bpy.context.object; tgt.name = f'IK_hand.{s}'
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(SH.x - 0.35, y * 1.2, 0.35)); pole = bpy.context.object; pole.name = f'IKpole.{s}'
    bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='POSE')
    pb = arm.pose.bones[f'forearm.{s}']; c = pb.constraints.new('IK'); c.target = tgt; c.pole_target = pole; c.chain_count = 2; c.pole_angle = math.radians(-90)
    bpy.ops.object.mode_set(mode='OBJECT')
# ---------------- body parts (bone-parented rigid segments) ----------------
def attach(o, bone_name):
    bpy.context.view_layer.update()
    o.parent = arm; o.parent_type = 'BONE'; o.parent_bone = bone_name; o.matrix_parent_inverse = Matrix.Identity(4)
    bpy.context.view_layer.update(); P = o.matrix_world @ o.matrix_basis.inverted(); o.matrix_parent_inverse = P.inverted()
def sph(loc, sc_, m, bone_name, seg=32):
    bpy.ops.mesh.primitive_uv_sphere_add(location=loc, segments=seg, ring_count=20); o = bpy.context.object; o.scale = sc_; o.data.materials.append(m); bpy.ops.object.shade_smooth(); attach(o, bone_name); return o
def cap(a, b, r0, r1, m, bone_name):
    a, b = Vector(a), Vector(b); d = b - a
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=r0, radius2=r1, depth=d.length, location=(a + b) / 2); o = bpy.context.object
    o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = d.to_track_quat('Z', 'Y'); o.data.materials.append(m); bpy.ops.object.shade_smooth(); attach(o, bone_name)
    sph(a, (r0, r0, r0), m, bone_name); sph(b, (r1, r1, r1), m, bone_name); return o
# torso: ONE smooth shirt mesh (elliptical rings along the spine) skinned to the armature with automatic weights
import bmesh
def make_torso():
    me = bpy.data.meshes.new('torso'); o = bpy.data.objects.new('Torso', me); bpy.context.collection.objects.link(o)
    bm = bmesh.new(); R = 26; V = 20; rings = []
    prof = [(0.0, 0.15, 0.13), (0.18, 0.125, 0.118), (0.38, 0.12, 0.118), (0.6, 0.15, 0.142), (0.82, 0.18, 0.15), (1.0, 0.19, 0.14)]
    def interp(t):
        for k in range(len(prof) - 1):
            if prof[k][0] <= t <= prof[k + 1][0]:
                u = (t - prof[k][0]) / (prof[k + 1][0] - prof[k][0]); u = u * u * (3 - 2 * u)
                return (prof[k][1] + (prof[k + 1][1] - prof[k][1]) * u, prof[k][2] + (prof[k + 1][2] - prof[k][2]) * u)
        return prof[-1][1:]
    x0, x1 = HIP.x + 0.02, SH.x + 0.01
    for r in range(R + 1):
        t = r / R; x = x0 + (x1 - x0) * t; z = HIP.z + (SH.z - HIP.z) * t + 0.01; ry, rz = interp(t)
        ring = [bm.verts.new((x, ry * math.cos(2 * math.pi * v / V), z + rz * math.sin(2 * math.pi * v / V))) for v in range(V)]
        rings.append(ring)
    for r in range(R):
        for v in range(V):
            bm.faces.new((rings[r][v], rings[r][(v + 1) % V], rings[r + 1][(v + 1) % V], rings[r + 1][v]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
    bm.to_mesh(me); bm.free(); o.data.materials.append(SHIRT)
    mod = o.modifiers.new('sub', 'SUBSURF'); mod.levels = 1; mod.render_levels = 2
    bpy.context.view_layer.objects.active = o; bpy.ops.object.shade_smooth()
    return o
torso = make_torso()
bpy.ops.object.select_all(action='DESELECT'); torso.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
sph(HIP + Vector((0.01, 0, 0.0)), (0.12, 0.17, 0.12), PANTS, 'pelvis')                    # pelvis (trousers)
# neck + head (clean-shaven, short styled hair, ears, eyes, brows, nose, mouth)
cap(SH + Vector((0.01, 0, 0.0)), SH + Vector((0.075, 0, 0.065)), 0.048, 0.044, SKIN, 'neck')
HC = SH + Vector((0.075, 0, 0.065)) + Vector((0.1, 0, 0.0))
sph(HC, (0.105, 0.085, 0.105), SKIN, 'head', 48)                                           # skull / face
sph(HC + Vector((-0.012, 0, 0.032)), (0.104, 0.088, 0.088), HAIR, 'head', 48)             # short hair cap
sph(HC + Vector((0.035, 0, 0.075)), (0.07, 0.07, 0.03), HAIR, 'head', 32)                  # styled top
for sy in (-1, 1):
    sph(HC + Vector((0.075, sy * 0.036, 0.018)), (0.014, 0.012, 0.014), WHITE, 'head'); sph(HC + Vector((0.087, sy * 0.036, 0.018)), (0.007, 0.007, 0.007), DARK, 'head')
    sph(HC + Vector((0.07, sy * 0.037, 0.047)), (0.018, 0.007, 0.004), HAIR, 'head')       # eyebrows
    sph(HC + Vector((-0.01, sy * 0.088, 0.0)), (0.014, 0.01, 0.022), SKIN, 'head')         # ears
sph(HC + Vector((0.095, 0, -0.012)), (0.014, 0.012, 0.016), SKIN, 'head')                  # nose
sph(HC + Vector((0.085, 0, -0.05)), (0.012, 0.028, 0.006), mat((0.55, 0.28, 0.25), 0.5), 'head')  # mouth
# arms: sleeve (shirt) on upper arm, skin forearm, hand (palm + 5 fingers + thumb)
for s, y in (('L', -0.19), ('R', 0.19)):
    sh = Vector((SH.x, y, SH.z - 0.02)); el = Vector((SH.x + 0.004, y, 0.31)); wr = Vector((SH.x, y, 0.045))
    cap(sh, el, 0.058, 0.046, SHIRT, f'upper_arm.{s}'); cap(el, wr + Vector((0, 0, 0.012)), 0.043, 0.032, SKIN, f'forearm.{s}')
    sph(wr + Vector((0.07, 0, 0.0)), (0.085, 0.05, 0.018), SKIN, f'hand.{s}')
    for k in range(4):
        fy = y + (-0.036 + k * 0.024); L = [0.075, 0.09, 0.085, 0.07][k]
        cap(wr + Vector((0.12, fy - y, 0.0)), wr + Vector((0.12 + L, fy - y, 0.0)), 0.0105, 0.009, SKIN, f'hand.{s}')
    cap(wr + Vector((0.04, (0.05 if y > 0 else -0.05), 0.0)), wr + Vector((0.11, (0.085 if y > 0 else -0.085), 0.0)), 0.012, 0.01, SKIN, f'hand.{s}')
# legs: trousers thigh/shin, shoe
for s, y in (('L', -0.19), ('R', 0.19)):
    hy = y * 0.55
    cap((0, hy, HIP.z - 0.02), (0, hy, 0.085), 0.075, 0.058, PANTS, f'thigh.{s}'); cap((0, hy, 0.075), (-0.44, hy, 0.062), 0.056, 0.045, PANTS, f'shin.{s}')
    sph((-0.5, hy, 0.05), (0.095, 0.05, 0.036), SHOE, f'foot.{s}')
# ---------------- Cat-Cow animation (multi-joint spine) ----------------
bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='POSE')
pb = arm.pose.bones
for b in pb: b.rotation_mode = 'XYZ'
def phase(fr):  # 0..1 loop, starts neutral -> cat -> neutral -> cow -> neutral
    return (fr - 1) / N
def ampl(ph):   # +1 cat (arch up) ... -1 cow (sag/extension)
    return math.sin(2 * math.pi * ph)
for fr in range(1, N + 1):
    a = ampl(phase(fr)); cat = max(a, 0); cow = max(-a, 0)
    # spine pitch (rotation about Y): negative lifts the far end up (arch); distribute by segment
    w = [0.9, 1.0, 1.0, 0.9, 0.7]
    for i in range(SP):
        ang = (-cat * 0.30 * w[i] + cow * 0.20 * w[i]) * (1.0 if i < 3 else -0.35 if cat > 0 else 0.6)
        pb[f'spine{i+1}'].rotation_euler = (0, ang, 0)
    pb['pelvis'].rotation_euler = (0, cat * 0.34 - cow * 0.24, 0)                                   # posterior / anterior pelvic tilt
    pb['chest'].rotation_euler = (0, -cat * 0.05 + cow * 0.06, 0)
    pb['neck'].rotation_euler = (0, cat * 0.35 - cow * 0.30, 0); pb['head'].rotation_euler = (0, cat * 0.25 - cow * 0.20, 0)   # head follows: down in cat, up in cow
    for b in ('pelvis', 'chest', 'neck', 'head') + tuple(f'spine{i+1}' for i in range(SP)):
        pb[b].keyframe_insert('rotation_euler', frame=fr)
    for s in ('L', 'R'):
        pb[f'shoulder.{s}'].location = (0, 0, 0)
        pb[f'shoulder.{s}'].rotation_euler = (0, -cat * 0.05 + cow * 0.04, 0); pb[f'shoulder.{s}'].keyframe_insert('rotation_euler', frame=fr)
bpy.ops.object.mode_set(mode='OBJECT')
# ---------------- cameras ----------------
CAMS = {'hero': ((1.55, -2.35, 1.0), (0.28, 0.0, 0.34), 38), 'side': ((0.3, -2.7, 0.56), (0.3, 0.0, 0.34), 40), 'close': ((0.3, -1.25, 0.62), (0.28, 0.0, 0.42), 38)}
loc, tgt, lens = CAMS[cam_name]
bpy.ops.object.camera_add(location=loc); cam = bpy.context.object; cam.data.lens = lens; cam.data.sensor_width = 36; sc.camera = cam
cam.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
# landmarks (2D) per frame for overlays
os.makedirs(out, exist_ok=True)
marks = {'cam': cam_name, 'W': W, 'H': H, 'frames': []}
frames = [ONLY] if ONLY else list(range(1, N + 1))
sc.render.filepath = os.path.join(out, 'f_')
for fr in frames:
    sc.frame_set(fr)
    pts = {}
    for name in ['pelvis'] + [f'spine{i+1}' for i in range(SP)] + ['chest', 'neck', 'head', 'shoulder.R', 'thigh.R', 'upper_arm.R']:
        p = arm.matrix_world @ arm.pose.bones[name].head; q = world_to_camera_view(sc, cam, p); pts[name] = [round(q.x, 4), round(1 - q.y, 4)]
    p = arm.matrix_world @ arm.pose.bones['spine5'].tail; q = world_to_camera_view(sc, cam, p); pts['spine5_tail'] = [round(q.x, 4), round(1 - q.y, 4)]
    marks['frames'].append(pts)
    sc.render.filepath = os.path.join(out, f'f_{fr:04d}.png'); bpy.ops.render.render(write_still=True)
json.dump(marks, open(os.path.join(out, f'landmarks_{cam_name}.json'), 'w'))
print('RENDERED', cam_name, len(frames))
