"""FMC cervical spine + neck muscle scenes (Blender/bpy). Simplified teaching model, NOT patient-specific (clinician review required).
python cervical.py <side|tuck|back|rot|upper> <outdir> [frames=60] [W=720] [H=960] [spp=12] [only_frame=0]
side  = fixed lateral view still (alignment overlay on real footage); tuck = chin-tuck (head retraction) loop; back = posterior view with scapular retraction loop;
rot   = C1-C2 / head rotation within a comfortable range loop; upper = slow orbit around the upper cervical spine + suboccipital muscles.
Coordinates: z = cranial, x = posterior(+)/anterior(-), y = lateral. Transparent background (RGBA PNG)."""
import bpy, bmesh, math, sys, os, json
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import spine_lib as SL

mode, out = sys.argv[1], sys.argv[2]
N = int(sys.argv[3]) if len(sys.argv) > 3 else 60
W = int(sys.argv[4]) if len(sys.argv) > 4 else 720
H = int(sys.argv[5]) if len(sys.argv) > 5 else 960
SPP = int(sys.argv[6]) if len(sys.argv) > 6 else 12
ONLY = int(sys.argv[7]) if len(sys.argv) > 7 else 0
if mode == 'side' and N == 60: N = 1

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SPP; sc.cycles.use_denoising = True
sc.cycles.transparent_max_bounces = 16; sc.cycles.max_bounces = 6
sc.render.resolution_x, sc.render.resolution_y = W, H; sc.render.film_transparent = True
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
sc.view_settings.view_transform = 'Standard'; sc.view_settings.exposure = -0.4
sc.world = bpy.data.worlds.new('w'); sc.world.use_nodes = True; bgn = sc.world.node_tree.nodes['Background']
bgn.inputs['Color'].default_value = (0.75, 0.82, 0.9, 1); bgn.inputs['Strength'].default_value = 0.35

def glass(c, a=0.25, emit=0.0, rim=0.0, name='g'):
    """Translucent anatomy material: transparent/principled mix with an optional fresnel rim so edges stay readable."""
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out_ = nt.nodes.new('ShaderNodeOutputMaterial'); mix = nt.nodes.new('ShaderNodeMixShader'); tr = nt.nodes.new('ShaderNodeBsdfTransparent')
    pr = nt.nodes.new('ShaderNodeBsdfPrincipled'); pr.inputs['Base Color'].default_value = (*c, 1); pr.inputs['Roughness'].default_value = 0.85
    if 'Specular IOR Level' in pr.inputs: pr.inputs['Specular IOR Level'].default_value = 0.08
    if emit:
        pr.inputs['Emission Color'].default_value = (*c, 1); pr.inputs['Emission Strength'].default_value = emit
    fr = nt.nodes.new('ShaderNodeFresnel'); fr.inputs['IOR'].default_value = 1.6
    add = nt.nodes.new('ShaderNodeMath'); add.operation = 'ADD'; add.inputs[0].default_value = a; nt.links.new(fr.outputs[0], add.inputs[1])
    mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = rim; nt.links.new(fr.outputs[0], mul.inputs[0])
    add2 = nt.nodes.new('ShaderNodeMath'); add2.operation = 'ADD'; add2.inputs[0].default_value = a; nt.links.new(mul.outputs[0], add2.inputs[1])
    clampn = nt.nodes.new('ShaderNodeClamp'); nt.links.new(add2.outputs[0], clampn.inputs[0])
    nt.links.new(clampn.outputs[0], mix.inputs[0]); nt.links.new(tr.outputs[0], mix.inputs[1]); nt.links.new(pr.outputs[0], mix.inputs[2]); nt.links.new(mix.outputs[0], out_.inputs[0])
    return m

BONE = SL.mat((0.88, 0.80, 0.64), 0.5, name='bone')
SKULL = glass((0.86, 0.80, 0.68), 0.10, rim=0.28, name='skull')
MUSC = glass((0.50, 0.11, 0.10), 0.88, 0.0, 0.2, name='musc')
TENS = glass((0.85, 0.20, 0.04), 0.95, 0.0, 0.1, name='tens')      # selected muscular tension area (orange)
SCAP = glass((0.86, 0.80, 0.66), 0.85, 0.0, 0.4, name='scap')

M_LIB = Matrix(((0, 0, 1, 0), (0, -1, 0, 0), (1, 0, 0, 0), (0, 0, 0, 1)))     # lib (X cranial, Y lateral, Z dorsal) -> world (z cranial, y lateral, x posterior)
def dirv(th): return Vector((math.sin(math.radians(th)), 0, math.cos(math.radians(th))))

# level: (w, d, h)
DIM = {'C2': (0.022, 0.016, 0.022), 'C3': (0.0185, 0.014, 0.014), 'C4': (0.019, 0.014, 0.014), 'C5': (0.020, 0.014, 0.014), 'C6': (0.0215, 0.0145, 0.0145), 'C7': (0.024, 0.016, 0.016),
       'T1': (0.027, 0.018, 0.018), 'T2': (0.028, 0.019, 0.019), 'T3': (0.029, 0.020, 0.020), 'T4': (0.030, 0.021, 0.021)}
ORDER_UP = ['T4', 'T3', 'T2', 'T1', 'C7', 'C6', 'C5', 'C4', 'C3', 'C2']                # bottom -> top
PITCH = {'T4': 6, 'T3': 4, 'T2': 0, 'T1': -8, 'C7': -14, 'C6': -9, 'C5': -4, 'C4': 1, 'C3': 5, 'C2': 8}
LEAN = {'side': -22}.get(mode, -8)                       # natural forward inclination of the cervical axis (deg); skull stays upright above C1
PITCH = {k: v + LEAN for k, v in PITCH.items()}
DISC = 0.0048

def mk_root(name):
    r = bpy.data.objects.new(name, None); bpy.context.collection.objects.link(r); return r

def cervical_vertebra(level, root):
    w, d, h = DIM[level]; k = w / 0.020
    SL.kidney_prism(level + '_body', w, d, h, BONE, root)
    zc = d / 2 + 0.001
    for s in (-1, 1):
        SL.cyl(level + 'ped', (0, s * w * 0.30, zc - 0.004), (0, s * w * 0.40, zc + 0.006 * k), 0.0028 * k, 0.0026 * k, BONE, root)
        SL.ell(level + 'pillar', (0, s * w * 0.56, zc + 0.008 * k), (h * 0.42, 0.0030 * k, 0.0030 * k), BONE, root)       # articular pillar (lateral mass)
        SL.cyl(level + 'lam', (-0.001, s * w * 0.50, zc + 0.008 * k), (-0.002 * k, s * w * 0.04, zc + 0.019 * k), 0.0028 * k, 0.0024 * k, BONE, root)
        SL.cyl(level + 'tp', (0.0, s * w * 0.50, zc * 0.4), (0.0, s * (w * 0.5 + 0.011 * k), zc * 0.2), 0.0030 * k, 0.0020 * k, BONE, root)
    long_ = 0.017 if level == 'C7' else (0.009 if level in ('C3', 'C4', 'C5') else 0.011)
    if level.startswith('T'): long_ = 0.020
    SL.cyl(level + 'sp', (0, 0, zc + 0.017 * k), (-long_ * 0.35, 0, zc + 0.017 * k + long_), 0.0030 * k, 0.0020 * k, BONE, root)
    if level == 'C2':
        SL.cyl('dens', (h * 0.4, 0, -0.001), (h * 0.4 + 0.015, 0, -0.001), 0.0050, 0.0040, BONE, root)
        SL.cyl('C2sp_big', (0, 0, zc + 0.014), (-0.004, 0, zc + 0.014 + 0.030), 0.0045, 0.0030, BONE, root)

def atlas(root):
    # ring around the dens: anterior arch, lateral masses, posterior arch (world-oriented, local lib convention)
    SL.ell('C1_ant', (0.0, 0, -0.010), (0.0035, 0.007, 0.0030), BONE, root)
    SL.ell('C1_post', (0.0, 0, 0.0185), (0.0035, 0.008, 0.0028), BONE, root)
    for s in (-1, 1):
        SL.ell('C1_mass', (0.0, s * 0.017, 0.004), (0.0085, 0.0070, 0.0090), BONE, root)
        SL.cyl('C1_tp', (0.0, s * 0.020, 0.004), (0.0, s * 0.034, 0.002), 0.0050, 0.0035, BONE, root)
        SL.cyl('C1_arch', (0.0, s * 0.015, 0.0185), (0.0, s * 0.002, 0.0185), 0.0030, 0.0030, BONE, root)

def ribbon(name, top, bot, m, thick=0.003):
    me = bpy.data.meshes.new(name); o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    bm = bmesh.new(); a = [bm.verts.new(p) for p in top]; b = [bm.verts.new(p) for p in bot]
    for i in range(len(a) - 1): bm.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
    bm.to_mesh(me); bm.free(); o.data.materials.append(m)
    sol = o.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = thick; sol.offset = 0
    sub = o.modifiers.new('sub', 'SUBSURF'); sub.levels = 1; sub.render_levels = 2
    bpy.context.view_layer.objects.active = o; bpy.ops.object.shade_smooth(); return o

def build(pose):
    """Rebuild the full anatomy for one pose. pose: dx per level (posterior shift, m), dth (extra pitch deg), yaw (deg about vertical), scap (medial shift m)."""
    for o in list(bpy.data.objects):
        if o.type not in ('CAMERA', 'LIGHT'): bpy.data.objects.remove(o, do_unlink=True)
    pos = Vector((0, 0, 0)); th_prev = None; prev_h = None; P = {}; WM = {}
    for lv in ORDER_UP:
        w, d, h = DIM[lv]; th = PITCH[lv]
        if prev_h is not None:
            step = prev_h / 2 + DISC + h / 2; pos = pos + dirv((th + th_prev) / 2) * step
        else:
            pos = Vector((0, 0, 0))
        P[lv] = pos.copy(); th_prev = th; prev_h = h
    shiftx = pose.get('dx', {}); dth = pose.get('dth', {}); yaw = pose.get('yaw', {})
    for lv in ORDER_UP:
        p = P[lv] + Vector((shiftx.get(lv, 0.0), 0, 0))
        m = Matrix.Translation(p) @ Matrix.Rotation(math.radians(yaw.get(lv, 0.0)), 4, 'Z') @ Matrix.Rotation(math.radians(PITCH[lv] + dth.get(lv, 0.0)), 4, 'Y') @ M_LIB
        r = mk_root(lv); r.matrix_world = m; cervical_vertebra(lv, r); WM[lv] = m
        if lv in ('C3', 'C4', 'C5', 'C6', 'C7', 'T1', 'T2', 'T3'):
            pass
    # discs (simple cream cylinders between bodies)
    names = ORDER_UP
    for i in range(len(names) - 1):
        a, b = names[i], names[i + 1]; ca, cb = WM[a].translation, WM[b].translation
        mid = (ca + cb) / 2; w = (DIM[a][0] + DIM[b][0]) / 2 * 0.95
        o = SL.ell('disc_' + a + b, mid, (w / 2, w / 2 * 0.72, DISC / 2 * 1.05), SL.mat((0.90, 0.80, 0.62), 0.5, name='disc'))
        o.rotation_euler = WM[a].to_euler()
    # atlas + skull ride on C2 (with the chin-tuck shift)
    c2m = WM['C2']; up = (c2m @ Vector((1, 0, 0, ))) - c2m.translation if False else (c2m.to_3x3() @ Vector((1, 0, 0)))
    c1pos = c2m.translation + up * (DIM['C2'][2] / 2 + 0.014) + Vector((pose.get('c1dx', 0.0), 0, 0))
    c1m = Matrix.Translation(c1pos) @ Matrix.Rotation(math.radians(pose.get('yaw_c1', 0.0)), 4, 'Z') @ Matrix.Rotation(math.radians(PITCH['C2'] + pose.get('c1th', 0.0)), 4, 'Y') @ M_LIB
    r1 = mk_root('C1'); r1.matrix_world = c1m; atlas(r1)
    sk = c1pos + Vector((-0.010 + pose.get('skx', 0.0), 0, 0.054))
    skull = SL.ell('skull', sk, (0.090, 0.072, 0.058), SKULL, None, seg=48, ring=24)
    skull.rotation_euler = (0, math.radians(pose.get('skth', 0.0)), math.radians(pose.get('yaw_sk', 0.0)))
    if mode == 'side': bpy.data.objects.remove(skull, do_unlink=True)      # the real head is in the footage
    # facial/jaw suggestion so orientation reads (very light)
    # anchor points
    def local(lv, v): return WM[lv] @ Vector(v)
    def sp_tip(lv, s=0.0):
        k = DIM[lv][0] / 0.020; zc = DIM[lv][1] / 2 + 0.001
        long_ = 0.017 if lv == 'C7' else (0.009 if lv in ('C3', 'C4', 'C5') else 0.011)
        if lv.startswith('T'): long_ = 0.020
        return local(lv, (-long_ * 0.35, s, zc + 0.017 * k + long_))
    occ = lambda s: sk + Vector((0.050, s, -0.040)) + Vector((0, 0, 0))
    mast = lambda s: sk + Vector((0.005, s * 0.055, -0.050))
    c1tp = lambda s: c1m @ Vector((0, s * 0.032, 0.002))
    mus = []
    for s in (-1, 1):
        # suboccipital group (tension = orange)
        SL.tube('rcpm%d' % s, [sp_tip('C2', 0.0), sp_tip('C2', 0.0) * 0.5 + occ(s * 0.020) * 0.5, occ(s * 0.025)], 0.0042, TENS)
        SL.tube('oci%d' % s, [sp_tip('C2', 0.0), (sp_tip('C2', 0.0) + c1tp(s)) / 2 + Vector((0.004, 0, 0.002)), c1tp(s)], 0.0040, TENS)
        SL.tube('ocs%d' % s, [c1tp(s), (c1tp(s) + occ(s * 0.050)) / 2 + Vector((0.004, 0, 0)), occ(s * 0.050)], 0.0036, TENS)
        SL.tube('rcpmi%d' % s, [local('C2', (0, 0, 0.0)) + Vector((0.020, 0, 0.012)), occ(s * 0.008)], 0.0028, TENS)
        # deep extensors / splenius
        SL.tube('semi%d' % s, [sp_tip('C7', s * 0.004), sp_tip('C5', s * 0.014), sp_tip('C3', s * 0.018), occ(s * 0.035)], 0.0075, MUSC)
        SL.tube('splen%d' % s, [sp_tip('C7', s * 0.004), sp_tip('C4', s * 0.016) + Vector((0.006, 0, 0)), mast(s)], 0.0058, MUSC)
        # upper trapezius (orange = selected tension area) as a flat band to the shoulder
        acr = Vector((P['C7'].x + 0.012 + pose.get('dx', {}).get('C7', 0), s * 0.150, P['C7'].z - 0.020))
        top = [occ(s * 0.004) + Vector((0.002, 0, 0)), (occ(s * 0.004) + acr) / 2 + Vector((0.006, 0, 0.006)), acr]
        bot = [sp_tip('C7', 0) + Vector((0.004, 0, 0)), (sp_tip('C7', 0) + acr) / 2 + Vector((0.004, 0, -0.012)), acr + Vector((0.0, 0, -0.012))]
        ribbon('trap%d' % s, top, bot, TENS if mode in ('back', 'side', 'upper', 'tuck') else MUSC, 0.004)
        if mode in ('back',):
            # middle trapezius + rhomboids down to T4, scapulae
            sm = pose.get('scap', 0.0)
            sc_c = Vector((P['T2'].x + 0.020, s * (0.098 - sm), P['T2'].z - 0.050))
            SL.ell('scapula%d' % s, sc_c, (0.0035, 0.052, 0.075), SCAP, None, seg=32, ring=16)
            SL.ell('scapspine%d' % s, sc_c + Vector((0.006, 0, 0.040)), (0.0055, 0.060, 0.007), SCAP, None, seg=24, ring=12)
            ribbon('rhomb%d' % s, [sp_tip('C7', s * 0.004) + Vector((0.004, 0, -0.010)), sp_tip('T2', s * 0.004), sp_tip('T4', s * 0.004)], [Vector((sc_c.x, s * (0.050 - sm), sc_c.z + 0.050)), Vector((sc_c.x + 0.002, s * (0.050 - sm), sc_c.z)), Vector((sc_c.x + 0.002, s * (0.050 - sm), sc_c.z - 0.045))], TENS, 0.004)
            ribbon('midtrap%d' % s, [sp_tip('T1', 0) + Vector((0.004, 0, 0)), sp_tip('T2', 0) + Vector((0.005, 0, 0)), sp_tip('T3', 0) + Vector((0.005, 0, 0))], [Vector((sc_c.x + 0.006, s * (0.100 - sm), sc_c.z + 0.052)), Vector((sc_c.x + 0.008, s * (0.098 - sm), sc_c.z + 0.030)), Vector((sc_c.x + 0.008, s * (0.090 - sm), sc_c.z + 0.008))], MUSC, 0.004)
        if mode in ('tuck', 'rot'):
            # sternocleidomastoid (mastoid -> sternal notch), anterior-lateral
            SL.tube('scm%d' % s, [mast(s), mast(s) + Vector((-0.050, s * 0.012, -0.050)), Vector((P['C7'].x - 0.055 + pose.get('dx', {}).get('C7', 0), s * 0.016, P['C7'].z - 0.020))], 0.0035, MUSC)
    return {lv: WM[lv].translation[:] for lv in WM}

def ease(t): return t * t * (3 - 2 * t)
def pose_for(i):
    t = (i - 1) / max(1, N - 1) if N > 1 else 0.0
    if mode == 'tuck':
        ph = 0.5 - 0.5 * math.cos(2 * math.pi * t); p = ph  # 0 -> 1 -> 0
        w = {'C2': 1.0, 'C3': 0.85, 'C4': 0.6, 'C5': 0.3, 'C6': 0.1}
        return {'dx': {k: 0.016 * p * v for k, v in w.items()}, 'dth': {'C2': 4 * p, 'C3': 2 * p, 'C4': -2 * p, 'C5': -3 * p, 'C6': -1.5 * p},
                'c1dx': 0.016 * p, 'c1th': -6 * p, 'skx': 0.0, 'skth': -2 * p}
    if mode == 'back':
        p = 0.5 - 0.5 * math.cos(2 * math.pi * t)
        return {'scap': 0.020 * p}
    if mode == 'rot':
        a = math.sin(2 * math.pi * t) * 45                                            # +-45 deg of head rotation (comfortable range)
        y = {'C2': a * 0.55, 'C3': a * 0.25, 'C4': a * 0.15, 'C5': a * 0.08}
        return {'yaw': y, 'yaw_c1': a * 0.8, 'yaw_sk': a}
    return {}

# camera + lights
def cam_look(loc, tgt, ortho=None, lens=70):
    cd = bpy.data.cameras.new('c'); co = bpy.data.objects.new('cam', cd); bpy.context.collection.objects.link(co); sc.camera = co
    co.location = loc; co.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    if ortho: cd.type = 'ORTHO'; cd.ortho_scale = ortho
    else: cd.lens = lens
    return co
def area(loc, energy, size, target, color=(1, 1, 1)):
    bpy.ops.object.light_add(type='AREA', location=loc); l = bpy.context.object; l.data.energy = energy; l.data.size = size; l.data.color = color
    l.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()

os.makedirs(out, exist_ok=True)
zc = 0.13
marks = {'mode': mode, 'W': W, 'H': H, 'frames': []}
frames = [ONLY] if ONLY else list(range(1, N + 1))
cam = None
for fr in frames:
    marks['frames'].append(build(pose_for(fr)))
    if cam is None or mode in ('upper',):
        if cam is not None: bpy.data.objects.remove(cam, do_unlink=True)
        if mode in ('side', 'tuck'):
            cam = cam_look((-0.03, -1.2, zc), (-0.03, 0, zc), ortho=0.36)
        elif mode == 'back':
            cam = cam_look((1.1, 0, 0.07), (0, 0, 0.07), lens=95)
        elif mode == 'rot':
            cam = cam_look((0.75, -0.55, zc + 0.22), (0.0, 0, zc - 0.005), lens=85)
        else:
            t = (fr - 1) / max(1, N - 1); ang = math.radians(-35 + 70 * (0.5 - 0.5 * math.cos(2 * math.pi * t)))
            R = 0.55; cam = cam_look((R * math.sin(ang) + 0.05, -R * math.cos(ang), 0.17 + 0.03 * math.sin(2 * math.pi * t)), (0.0, 0, 0.17), lens=85)
        for o in [o for o in bpy.data.objects if o.type == 'LIGHT']: bpy.data.objects.remove(o, do_unlink=True)
        area((0.5, -1.0, 0.45), 62, 1.2, (0, 0, zc), (1.0, 0.97, 0.92)); area((-0.6, 0.6, 0.3), 28, 1.0, (0, 0, zc), (0.8, 0.9, 1.0)); area((0.9, 0.6, 0.35), 36, 1.0, (0, 0, zc), (1, 1, 1))
    png = os.path.join(out, f'f_{fr:04d}.png')
    if os.path.exists(png) and os.path.getsize(png) > 1000: continue
    sc.render.filepath = png; bpy.ops.render.render(write_still=True)
json.dump(marks, open(os.path.join(out, f'anchors_{mode}.json'), 'w'))
print('RENDERED', mode, len(frames))
