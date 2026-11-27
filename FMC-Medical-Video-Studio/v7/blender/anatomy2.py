"""FMC anatomy scenes (Blender): 'disc' = orbit around a cut-away intervertebral disc between two lumbar vertebrae (annulus lamellae, nucleus, endplates);
'flex' = L1-S1 lumbar stack through gentle flexion -> extension with restrained orange load tint on the compressed side of each disc.
python anatomy2.py <disc|flex> <outdir> [frames=60] [W=540] [H=960] [spp=10] [only_frame=0]"""
import bpy, math, sys, os, json
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import spine_lib as SL
mode, out = sys.argv[1], sys.argv[2]
N = int(sys.argv[3]) if len(sys.argv) > 3 else 60
W = int(sys.argv[4]) if len(sys.argv) > 4 else 540
H = int(sys.argv[5]) if len(sys.argv) > 5 else 960
SPP = int(sys.argv[6]) if len(sys.argv) > 6 else 10
ONLY = int(sys.argv[7]) if len(sys.argv) > 7 else 0
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SPP; sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = W, H; sc.view_settings.view_transform = 'AgX'; sc.view_settings.exposure = -0.7
sc.world = bpy.data.worlds.new('w'); sc.world.use_nodes = True; bgn = sc.world.node_tree.nodes['Background']; bgn.inputs['Color'].default_value = (0.03, 0.08, 0.15, 1); bgn.inputs['Strength'].default_value = 0.9
def area(loc, energy, size, target, color=(1, 1, 1)):
    bpy.ops.object.light_add(type='AREA', location=loc); l = bpy.context.object; l.data.energy = energy; l.data.size = size; l.data.color = color
    l.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
os.makedirs(out, exist_ok=True)
marks = {'mode': mode, 'frames': []}
if mode == 'disc':
    S = 3.2
    group = bpy.data.objects.new('G', None); bpy.context.collection.objects.link(group); group.scale = (S, S, S)
    # two vertebrae and the cut-away disc between them (L4 below, L3 above); axis +X (head)
    bone_m = SL.BONE()
    vb = SL.kidney_prism('L4_body', 0.045, 0.034, 0.016, bone_m, group); vb.location = (-0.0100, 0, 0)       # vertebral body below (endplate region)
    vt = SL.kidney_prism('L3_body', 0.045, 0.034, 0.016, bone_m, group); vt.location = (0.0100 + 0.0120 - 0.0000, 0, 0)
    d = SL.disc('D_L4_L3', group, cutaway=True); d.location = (0.006, 0, 0)
    # cutaway faces +Y; camera orbits in the Y-Z plane around the disc axis (X) inside the opening
    tgt = Vector((0.006 * S, 0, 0)); area((0.25, 0.5, 0.35), 26, 0.6, tgt); area((0.0, 0.4, -0.3), 9, 0.6, tgt, (0.7, 0.9, 1)); area((-0.3, -0.3, 0.3), 6, 0.6, tgt, (1, 0.9, 0.8))
    bpy.ops.object.camera_add(); cam = bpy.context.object; sc.camera = cam; cam.data.lens = 70; cam.data.dof.use_dof = True; cam.data.dof.aperture_fstop = 4.0
    for fr in ([ONLY] if ONLY else range(1, N + 1)):
        t = (fr - 1) / (N - 1); e = t * t * (3 - 2 * t)
        th = math.radians(-32 + 64 * e); R = 0.62 - 0.22 * e
        cam.location = Vector((tgt.x + 0.02 * math.sin(2 * math.pi * t), R * math.cos(th), R * math.sin(th)))
        cam.rotation_euler = (tgt - cam.location).to_track_quat('-Z', 'Y').to_euler(); cam.data.dof.focus_distance = (tgt - cam.location).length
        png = os.path.join(out, f'f_{fr:04d}.png')
        if os.path.exists(png) and os.path.getsize(png) > 1000: continue
        sc.render.filepath = png; bpy.ops.render.render(write_still=True)
else:
    S = 2.2
    stack, xs = SL.lumbar_stack(S=1.0)
    names = ['Sacrum', 'D_S1_L5', 'L5', 'D_L5_L4', 'L4', 'D_L4_L3', 'L3', 'D_L3_L2', 'L2', 'D_L2_L1', 'L1']
    Ld, Lv = 0.012, 0.029
    loadm = SL.LOAD()
    for nm in names:
        if nm.startswith('D_'):
            for ch in stack[nm].children_recursive:
                if ch.type == 'MESH' and 'nucleus' not in ch.name: ch.data.materials.append(loadm) if False else None
    tgt = Vector((0.095 * S, 0, 0.02 * S)); area((0.1, -0.7, 0.5), 22, 0.8, tgt); area((0.5, -0.4, -0.2), 8, 0.8, tgt, (0.7, 0.9, 1)); area((-0.2, 0.5, 0.4), 6, 0.8, tgt, (1, 0.9, 0.8))
    bpy.ops.object.camera_add(location=(0.095 * S, -0.95, 0.05)); cam = bpy.context.object; sc.camera = cam; cam.data.lens = 55
    cam.rotation_euler = (tgt - cam.location).to_track_quat('-Z', 'X').to_euler(); cam.data.dof.use_dof = True; cam.data.dof.focus_distance = (tgt - cam.location).length; cam.data.dof.aperture_fstop = 5.6
    nmat = {}
    for fr in ([ONLY] if ONLY else range(1, N + 1)):
        ph = (fr - 1) / N; a = math.sin(2 * math.pi * ph); delta = a * 0.12          # + = flexion, - = extension (radians per level)
        T = Matrix.Scale(S, 4)
        for nm in names:
            o = stack[nm]
            if nm == 'Sacrum':
                o.matrix_world = T @ Matrix.Translation((0, 0, 0)); continue
            if nm.startswith('D_'):
                o.matrix_world = T @ Matrix.Translation((Ld / 2, 0, 0)) @ Matrix.Rotation(-delta / 2 if False else delta / 2, 4, 'Y')
                # nucleus shifts slightly posteriorly in flexion, anteriorly in extension (qualitative)
                for ch in o.children:
                    if 'nucleus' in ch.name: ch.location = (0, 0, -0.0015 + 0.0016 * (a))
                T = T @ Matrix.Translation((Ld / 2, 0, 0)) @ Matrix.Rotation(delta, 4, 'Y') @ Matrix.Translation((Ld / 2, 0, 0))
            else:
                o.matrix_world = T @ Matrix.Translation((Lv / 2, 0, 0)); T = T @ Matrix.Translation((Lv, 0, 0))
        stack['Nerves'].hide_render = True; stack['Nerves'].hide_viewport = True
        for ch in stack['Nerves'].children_recursive: ch.hide_render = True
        marks['frames'].append({'delta': delta})
        png = os.path.join(out, f'f_{fr:04d}.png')
        if os.path.exists(png) and os.path.getsize(png) > 1000: continue
        sc.render.filepath = png; bpy.ops.render.render(write_still=True)
json.dump(marks, open(os.path.join(out, f'meta_{mode}.json'), 'w'))
print('RENDERED', mode)
