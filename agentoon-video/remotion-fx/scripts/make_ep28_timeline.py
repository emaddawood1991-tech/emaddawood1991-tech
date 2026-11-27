#!/usr/bin/env python3
"""Episode 27 timeline: dialogue lines (frames), word times, lip envelopes for robot (A) and Claude (C)."""
import json, numpy as np, soundfile as sf
E='../episodes/28-claude-prepared-50-reels/'; FPS=30
t=json.load(open(E+'audio/dialog_timing.json')); ep=json.load(open(E+'episode.json')); total=round(ep['total']*FPS)
lines=[{'id':l['id'],'who':l['who'],'scene':l['scene'],'sf':round(l['start']*FPS),'ef':round(l['end']*FPS)} for l in t['lines']]
words=[{'w':w['w'],'who':w['who'],'line':w['line'],'s':round(w['s']*FPS),'e':round(w['e']*FPS)} for w in t['words']]
def lip(path):
    x,sr=sf.read(path,dtype='float32'); fps=24; n=int(len(x)/sr*fps)+1
    env=np.array([np.sqrt(np.mean(x[int(i*sr/fps):int((i+1)*sr/fps)]**2)+1e-12) for i in range(n)]); env=np.convolve(env,[.25,.5,.25],'same'); env=np.clip(env/(np.percentile(env,98)+1e-9),0,1)
    return {'fps':fps,'a':[round(float(v),2) for v in env]}
json.dump({'fps':FPS,'frames':total,'lines':lines,'words':words,'lipA':lip(E+'audio/speakerA.wav'),'lipC':lip(E+'audio/speakerC.wav')},open('public/data/ep28-timeline.json','w'))
print(total)
