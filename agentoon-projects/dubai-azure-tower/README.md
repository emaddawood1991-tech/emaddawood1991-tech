# Dubai Azure Tower (fictional concept)
Procedural Blender production. See `reports/PRODUCTION_REPORT.md` for status and `renders/RENDER_ON_PC.md` for the final 4K render.
Rebuild: `python architecture/build_all.py out.blend` (needs `pip install bpy` or Blender).
Preview frame: `python cameras/still.py scene.blend out.png X Y Z TX TY TZ [lens] [width] [samples] [night]`.
Animatic assembly: `python exports/assemble.py <frames> <out.mp4> 1280 720 --tag "ANIMATIC"`.
