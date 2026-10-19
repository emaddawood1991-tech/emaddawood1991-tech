"""Extract the foot-scanning machine from the supplied FMC poster (ref-1.webp).
No redraw: pixels are copied from the poster; only the surrounding background is made transparent."""
import cv2, numpy as np
from PIL import Image
im=np.array(Image.open('ref-1.webp').convert('RGB'))
x0,y0,x1,y1=95,478,752,784
crop=im[y0:y1,x0:x1].copy(); h,w=crop.shape[:2]
L=cv2.cvtColor(crop,cv2.COLOR_RGB2GRAY); R,G,B=[crop[...,i].astype(int) for i in range(3)]
yy,xx=np.mgrid[:h,:w]
circ=((xx-(592-x0))**2+(yy-(578-y0))**2)<124**2          # the round foot-pressure photo (not part of the machine)
m=((L<150)|((R>170)&(G<100)&(B<100))).astype(np.uint8)
poly=np.zeros((h,w),np.uint8)
for pts in ([(262,152),(320,154),(396,182),(270,216),(262,216)],
            [(373,257),(494,213),(560,232),(642,261),(650,282),(540,306),(520,306),(380,262)]):
    cv2.fillPoly(poly,[np.array(pts,np.int32)],1)
bgish=((B-R)>6)&(L>200)                                  # poster background is slightly blue; mat white is neutral
# right panel: trace its black top border column by column, keep everything below it (inside the polygon)
top=np.full(w,10**6)
for x in range(500,640):
    d=np.where(L[205:300,x]<100)[0]
    if len(d): top[x]=205+d[0]
for x in range(500,640):
    if top[x]==10**6: top[x]=int(np.interp(x,[500,640],[216,262]))
poly_r=np.zeros((h,w),np.uint8)
cv2.fillPoly(poly_r,[np.array([(373,257),(494,213),(642,261),(650,282),(540,306),(520,306),(380,262)],np.int32)],1)
poly_r[(xx>=500)&(yy<top[np.clip(xx,0,w-1)]-1)]=0
poly_l=np.zeros((h,w),np.uint8); cv2.fillPoly(poly_l,[np.array([(262,152),(320,154),(396,182),(270,216),(262,216)],np.int32)],1)
m|=((poly_l.astype(bool)&~bgish)|(poly_r.astype(bool)&~(((B-R)>10)&(L>190)&(xx>560)))).astype(np.uint8)
m[circ]=0; m[:5,:]=0; m[:,:3]=0
m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(5,5)))
n,lab,st,_=cv2.connectedComponentsWithStats(m)
big=1+np.argmax(st[1:,cv2.CC_STAT_AREA]); keep=(lab==big).astype(np.uint8)
cnt,_=cv2.findContours(keep,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
filled=np.zeros_like(keep); cv2.drawContours(filled,cnt,-1,1,-1)
region=cv2.dilate(poly,np.ones((9,9),np.uint8)).astype(bool)
closed=cv2.morphologyEx(filled,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(15,15)))
filled=np.where(region,closed,filled).astype(np.uint8)
filled=cv2.erode(filled,np.ones((2,2),np.uint8))
a=cv2.GaussianBlur(filled.astype(np.float32),(0,0),0.8)
a[-5:,:]*=np.linspace(1,0.0,5)[:,None]
rgba=np.dstack([crop,(a*255).astype(np.uint8)])
ys,xs=np.where(a>0.02); out=Image.fromarray(rgba).crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
out.save('../foot-scanner-extracted.png'); print(out.size)
for name,col in (('a',(255,0,255)),('b',(20,150,185))):
    bgc=np.zeros((out.height,out.width,3),np.uint8); bgc[:]=col
    arr=np.array(out); al=arr[...,3:4]/255.
    Image.fromarray((arr[...,:3]*al+bgc*(1-al)).astype(np.uint8)).resize((out.width*2,out.height*2),Image.LANCZOS).save(f'/tmp/claude-0/mach_{name}.png')
