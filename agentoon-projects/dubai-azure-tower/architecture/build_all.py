"""Build tower + site into the current bpy scene. Usage: python build_all.py [out.blend]"""
import os, sys, time
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "landscape"))
import bpy
import lib
import build_tower, build_site

def main(out=None):
    t = time.time()
    lib.reset_scene()
    build_tower.build_tower()
    build_site.build_site()
    print("built in %.1fs, objects=%d" % (time.time() - t, len(bpy.data.objects)))
    if out:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(out))

if __name__ == "__main__":
    main(sys.argv[-1] if sys.argv[-1].endswith(".blend") else None)
