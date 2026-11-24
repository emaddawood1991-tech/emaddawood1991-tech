#!/usr/bin/env python3
"""Episode 25 timeline: scene frames from phrase times, word frames, lip envelope from the processed narration."""
import json, numpy as np, soundfile as sf
E='../episodes/25-ai-concepts-8/'
t=json.load(open(E+'audio/timing.json')); ep=json.load(open(E+'episode.json')); FPS=30
total=round(ep['total']*FPS); ph=t['phrases']; show={p['id']:p['show'] for p in ep['phrases']}
words=[]
for p in ph:
    toks=show[p['id']].split(); wt=[len(w)+2 for w in toks]; cur=p['start']; span=p['end']-p['start']
    for w,x in zip(toks,wt):
        d=span*x/sum(wt); words.append({'w':w,'line':p['id'],'s':round(cur*FPS),'e':round((cur+d)*FPS)}); cur+=d
x,sr=sf.read(E+'audio/narration.wav',dtype='float32'); fps=24; n=int(len(x)/sr*fps)+1
env=np.array([np.sqrt(np.mean(x[int(i*sr/fps):int((i+1)*sr/fps)]**2)+1e-12) for i in range(n)]); env=np.convolve(env,[.25,.5,.25],'same'); env=np.clip(env/(np.percentile(env,98)+1e-9),0,1)
lines=[{'id':p['id'],'sf':round(p['start']*FPS),'ef':round(p['end']*FPS)} for p in ph]
json.dump({'fps':FPS,'frames':total,'lines':lines,'words':words,'lip':{'fps':fps,'a':[round(float(v),2) for v in env]}},open('public/data/ac-timeline.json','w'))
print(total,lines)
