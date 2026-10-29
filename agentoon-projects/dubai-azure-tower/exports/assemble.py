#!/usr/bin/env python3
"""Assemble rendered frames into the 120 s / 3,600-frame / 30 fps film.
python assemble.py <frames_dir> <out.mp4> <width> <height> [--stride 3] [--tag "ANIMATIC"] [--crf 16]
frames_dir holds fNNNN.png named by timeline frame. Frames rendered at stride N are motion-interpolated to 30 fps.
Per scene: interpolate -> short dip transitions -> concat -> title cards -> original score mixed in."""
import argparse, json, os, subprocess, sys, tempfile, glob
HERE = os.path.dirname(os.path.abspath(__file__))
P = json.load(open(os.path.join(HERE, "..", "architecture", "tower_params.json")))
ap = argparse.ArgumentParser()
ap.add_argument("frames"); ap.add_argument("out"); ap.add_argument("w", type=int); ap.add_argument("h", type=int)
ap.add_argument("--stride", type=int, default=3); ap.add_argument("--tag", default="")
ap.add_argument("--crf", default="16"); ap.add_argument("--audio", default=os.path.join(HERE, "..", "audio", "azure_score.wav"))
ap.add_argument("--interp", default="mci")
a = ap.parse_args()
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
FONT2 = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
TF = P["timeline_frames"]
tmp = tempfile.mkdtemp(prefix="azure_")
segs = []

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print(r.stderr[-1500:]); sys.exit(1)

for name, (s0, s1) in TF.items():
    n_out = s1 - s0 + 1
    src = [os.path.join(a.frames, "f%04d.png" % f) for f in range(s0, s1 + 1, a.stride)]
    missing = [p for p in src if not os.path.exists(p)]
    if missing:
        print(f"{name}: {len(missing)} frames missing, e.g. {missing[0]}"); sys.exit(2)
    d = os.path.join(tmp, name); os.makedirs(d)
    for i, p in enumerate(src):
        os.symlink(os.path.abspath(p), os.path.join(d, "s%04d.png" % i))
    seg = os.path.join(tmp, name + ".mp4")
    fade = 8
    vf = []
    if a.stride > 1:
        vf.append(f"minterpolate=fps=30:mi_mode={a.interp}:mc_mode=aobmc:vsbmc=1" if a.interp != "dup" else "fps=30")
    vf.append(f"scale={a.w}:{a.h}:flags=lanczos,setsar=1,format=yuv420p")
    vf.append(f"trim=end_frame={n_out},setpts=PTS-STARTPTS")
    vf.append(f"fade=t=in:st=0:d={fade/30}:color=black,fade=t=out:st={(n_out-fade)/30}:d={fade/30}:color=black")
    run(["ffmpeg", "-loglevel", "error", "-y", "-framerate", str(30 // a.stride), "-i", os.path.join(d, "s%04d.png"),
         "-vf", ",".join(vf), "-r", "30", "-frames:v", str(n_out), "-c:v", "libx264", "-crf", "12", "-preset", "veryfast", "-pix_fmt", "yuv420p", seg])
    segs.append(seg)
    print(name, n_out, "frames ok", flush=True)

lst = os.path.join(tmp, "list.txt")
open(lst, "w").write("".join(f"file '{s}'\n" for s in segs))
joined = os.path.join(tmp, "joined.mp4")
run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", joined])

# overlays: concept status (first 6 s + persistent small footer), title card in the final scene
sc = a.h / 1080.0
big, mid, small = int(86 * sc), int(30 * sc), int(18 * sc)
title_in, title_out = 114.0, 119.2
def alpha(t0, t1, f=1.0):
    return f"if(lt(t,{t0}),0,if(lt(t,{t0+f}),(t-{t0})/{f},if(lt(t,{t1-f}),1,if(lt(t,{t1}),({t1}-t)/{f},0))))"
dt = []
dt.append(f"drawtext=fontfile={FONT2}:text='FICTIONAL ARCHITECTURAL CONCEPT  -  NOT APPROVED  -  NOT BUILT  -  NOT FOR SALE':fontsize={small}:fontcolor=white@0.78:x=(w-text_w)/2:y=h-{int(36*sc)}:shadowcolor=black@0.6:shadowx=1:shadowy=1:alpha='{alpha(0.5, 119.8, 1.2)}'")
dt.append(f"drawtext=fontfile={FONT}:text='DUBAI AZURE TOWER':fontsize={big}:fontcolor=0xF2E3C6:x=(w-text_w)/2:y=(h*0.42)-text_h/2:shadowcolor=black@0.55:shadowx=2:shadowy=2:alpha='{alpha(title_in, title_out, 1.4)}'")
dt.append(f"drawtext=fontfile={FONT2}:text='A Conceptual Architectural Vision':fontsize={mid}:fontcolor=white@0.92:x=(w-text_w)/2:y=(h*0.42)+{int(70*sc)}:shadowcolor=black@0.5:shadowx=1:shadowy=1:alpha='{alpha(title_in+0.8, title_out, 1.4)}'")
if a.tag:
    dt.append(f"drawtext=fontfile={FONT2}:text='{a.tag}':fontsize={small}:fontcolor=yellow@0.85:x=24:y=20")
run(["ffmpeg", "-loglevel", "error", "-y", "-i", joined, "-i", a.audio, "-vf", ",".join(dt),
     "-c:v", "libx264", "-crf", a.crf, "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
     "-c:a", "aac", "-b:a", "256k", "-t", "120", a.out])
print("wrote", a.out)
