#!/usr/bin/env python3
import json, numpy as np, soundfile as sf
E='../episodes/24-robot-meets-claude/'; t=json.load(open(E+'audio/dialog_timing.json')); FPS=30; total=round(t['total']*FPS)
def env(path):
    x,sr=sf.read(path,dtype='float32'); fps=24; n=int(len(x)/sr*fps)+1
    e=np.array([np.sqrt(np.mean(x[int(i*sr/fps):int((i+1)*sr/fps)]**2)+1e-12) for i in range(n)]); e=np.convolve(e,[.25,.5,.25],'same'); e=np.clip(e/(np.percentile(e[e>1e-4],98)+1e-9),0,1)
    return {'fps':fps,'a':[round(float(v),2) for v in e]}
out={'fps':FPS,'frames':total,'lines':[{**l,'sf':round(l['start']*FPS),'ef':round(l['end']*FPS)} for l in t['lines']],
 'words':[{**w,'s':round(w['s']*FPS),'e':round(w['e']*FPS)} for w in t['words']],'lipA':env(E+'audio/speakerA.wav'),'lipC':env(E+'audio/speakerC.wav')}
json.dump(out,open('public/data/rmc-timeline.json','w')); print(total,len(out['words']))
