#!/usr/bin/env python3
"""Blender (bpy) integration: extrudes a REAL logo SVG into a 3D mesh, lights it, spins it and renders a transparent PNG sequence for Remotion.
Usage: python3 render_logo_turntable.py <logo.svg> <out_dir> [frames=60] [size=720]
Remotion plays the sequence with <BlenderSequence dir="blender/out/..." frames={60} /> (src/fx/blender.tsx)."""
import sys, os, math
import bpy
svg, out = sys.argv[1], sys.argv[2]; N = int(sys.argv[3]) if len(sys.argv) > 3 else 60; S = int(sys.argv[4]) if len(sys.argv) > 4 else 720
os.makedirs(out, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_curve.svg(filepath=svg)
objs = [o for o in bpy.context.scene.objects if o.type == "CURVE"]
for o in objs:
    o.data.extrude = 0.02; o.data.bevel_depth = 0.002; o.data.resolution_u = 12
# NOTE: stroke-only SVG parts are not imported by Blender: use logos made of filled shapes (e.g. appflowy.svg).
# join, center, scale to ~2 units
bpy.ops.object.select_all(action="DESELECT")
for o in objs: o.select_set(True)
bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join()
logo = bpy.context.active_object; bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS"); logo.location = (0, 0, 0)
d = max(logo.dimensions.x, logo.dimensions.y) or 1; logo.scale = (1.9 / d,) * 3
# keep the SVG's own fill colours (Blender creates one material per fill); give them a glossy finish
for m in logo.data.materials:
    if m and m.use_nodes:
        n = m.node_tree.nodes.get("Principled BSDF")
        if n: n.inputs["Roughness"].default_value = 0.25; n.inputs["Metallic"].default_value = 0.15
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); bpy.context.scene.collection.objects.link(cam); cam.location = (0, -7, 0); cam.rotation_euler = (math.pi / 2, 0, 0); bpy.context.scene.camera = cam
for name, loc, energy, col in (("key", (3, -4, 4), 2600, (1, 1, 1)), ("rim", (-4, 3, 2), 1800, (0.78, 0.94, 0.19)), ("fill", (0, -3, -3), 900, (0.2, 0.9, 1.0))):
    l = bpy.data.lights.new(name, "POINT"); l.energy = energy; l.color = col; o = bpy.data.objects.new(name, l); o.location = loc; bpy.context.scene.collection.objects.link(o)
sc = bpy.context.scene; sc.render.engine = "CYCLES"; sc.cycles.samples = 24; sc.cycles.device = "CPU"; sc.render.resolution_x = sc.render.resolution_y = S; sc.render.film_transparent = True; sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_mode = "RGBA"
for i in range(N):
    logo.rotation_euler = (math.radians(70), 0, math.radians(360 * i / N)); sc.render.filepath = os.path.join(out, f"f{i:04d}.png"); bpy.ops.render.render(write_still=True)
print("rendered", N, "frames to", out)
