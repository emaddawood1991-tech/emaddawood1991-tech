#!/usr/bin/env python3
"""Episode 23 timeline: scenes (frames) from phrase times, word frames, lip envelope from the processed narration."""
import json, numpy as np, soundfile as sf
E='../episodes/23-gta6-parents/'
t=json.load(open(E+'audio/timing.json')); ep=json.load(open(E+'episode.json')); FPS=30
total=round(ep['total']*FPS); ph=t['phrases']; scenes=[]
for i,p in enumerate(ph):
    s=0 if i==0 else round(p['start']*FPS); e=total if i==len(ph)-1 else round(ph[i+1]['start']*FPS)
    scenes.append({'id':p['id'],'start':s,'len':e-s})
CAP={
'hook':"GTA 6 is finally here. The graphics are incredible. But parents, there's something you need to know.",
'visual':"Rockstar has created an incredibly detailed world, with realistic environments, cinematic visuals, and impressive technology. On PlayStation 5 Pro, Sony says it adds ray-traced shadows and sharper image quality.",
'warning':"But impressive graphics don't mean a game is suitable for children. GTA 6 includes strong sexual content, nudity, intense violence, and explicit language.",
'themes':"It also features drug and alcohol use, mature humor, and themes involving crime. These are important details parents should know before buying it. It's rated M for Mature, 17+, by the ESRB, and PEGI 18 in Europe. Ratings vary by country, so check yours.",
'why':"Children may be attracted by the graphics and open world, without understanding the adult themes. The game also includes optional in-game purchases. That's why age ratings and parental guidance matter.",
'steps':"Before allowing your child to play, check the local age rating, review the content warnings, and use parental controls to manage access and purchases. On PlayStation, the Family app lets parents set age limits, play time, and spending limits.",
'close':"GTA 6 may be a technical masterpiece, but not every great-looking game is made for kids. Parents, stay informed. Share this with another family."}
words=[]
for p in ph:
    toks=CAP[p['id']].split(); wt=[len(w)+2 for w in toks]; cur=p['start']; span=p['end']-p['start']
    for w,x in zip(toks,wt):
        d=span*x/sum(wt); words.append({'w':w,'s':round(cur*FPS),'e':round((cur+d)*FPS)}); cur+=d
x,sr=sf.read(E+'audio/narration.wav',dtype='float32'); fps=24; n=int(len(x)/sr*fps)+1
env=np.array([np.sqrt(np.mean(x[int(i*sr/fps):int((i+1)*sr/fps)]**2)+1e-12) for i in range(n)]); env=np.convolve(env,[.25,.5,.25],'same'); env=np.clip(env/(np.percentile(env,98)+1e-9),0,1)
json.dump({'fps':FPS,'frames':total,'scenes':scenes,'words':words,'lip':{'fps':fps,'a':[round(float(v),2) for v in env]},'phrases':[{'id':p['id'],'s':round(p['start']*FPS),'e':round(p['end']*FPS)} for p in ph]},open('public/data/gta-timeline.json','w'))
print(total,scenes)
