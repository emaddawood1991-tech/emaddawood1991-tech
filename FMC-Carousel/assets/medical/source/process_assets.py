"""Prepare the supplied FMC reference images (no content redrawn).
- badges: crop each circular illustration, recolour only its flat circle background to one common ice-blue, add circular alpha
- posture: cut the child + guide lines out of the cream grid scene and place on the same ice-blue circle
- machine photo: remove the white studio background, gentle 2x upscale + sharpen (no detail invented)"""
import cv2, numpy as np
from PIL import Image, ImageFilter
TINT=np.array([213,241,254])
S=480
def circle_geom(a,bg):
    m=(np.abs(a-bg).sum(2)<30)
    ys,xs=np.where(m); x0,x1,y0,y1=xs.min(),xs.max(),ys.min(),ys.max()
    return (x0+x1)/2,(y0+y1)/2,(x1-x0)/2
def badge(name):
    a=np.array(Image.open(f'ref-{name}.webp').convert('RGB')).astype(np.int32)
    bg=a[627,140].copy()
    cx,cy,r=circle_geom(a,bg)
    d=np.abs(a-bg).sum(2).astype(np.float32)
    w=np.clip(1-d/40,0,1)[...,None]                       # 1 on flat circle bg, fades on edges
    out=a+w*(TINT-bg)
    out=np.clip(out,0,255).astype(np.uint8)
    pad=int(r*1.02); crop=out[int(cy-pad):int(cy+pad),int(cx-pad):int(cx+pad)]
    im=Image.fromarray(crop).resize((S*2,S*2),Image.LANCZOS)
    yy,xx=np.mgrid[:S*2,:S*2]; rr=np.sqrt((xx-S)**2+(yy-S)**2)
    al=np.clip((S*0.985-rr),0,1.5)/1.5
    rgba=np.dstack([np.array(im),(al*255).astype(np.uint8)])
    Image.fromarray(rgba).resize((S,S),Image.LANCZOS).save(f'../badge-{name}.png')
for n in ('scan','gait','pressure'): badge(n)

# ---- posture: child on grid -> ice circle
a=np.array(Image.open('ref-posture.webp').convert('RGB'))
bgr=cv2.cvtColor(a,cv2.COLOR_RGB2BGR); h,w=a.shape[:2]
hsv=cv2.cvtColor(bgr,cv2.COLOR_BGR2HSV)
sat=hsv[...,1]; val=hsv[...,2]
fg=((sat>70)|(val<110)).astype(np.uint8)                 # skin/shirt/shorts/hair/red lines; grid + cream are low-saturation
fg[150:360,690:930]=0                                    # drop warning triangle
fg[1280:,:]=0                                            # floor strip / shadow
fg=cv2.morphologyEx(fg,cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
mask=np.where(fg>0,cv2.GC_PR_FGD,cv2.GC_PR_BGD).astype(np.uint8)
mask[(sat>120)|(val<90)]=cv2.GC_FGD
mask[(sat<35)&(val>200)]=cv2.GC_BGD
bg_=np.zeros((1,65));fg_=np.zeros((1,65))
cv2.grabCut(bgr,mask,None,bg_,fg_,4,cv2.GC_INIT_WITH_MASK)
m=((mask==cv2.GC_FGD)|(mask==cv2.GC_PR_FGD)).astype(np.uint8)
m[150:360,690:930]=0; m[1280:,:]=0
n,lab,st,_=cv2.connectedComponentsWithStats(m)
big=1+np.argmax(st[1:,cv2.CC_STAT_AREA]); keep=(lab==big).astype(np.uint8)
for i in range(1,n):                                     # keep the two red guide lines too
    if i!=big and st[i,cv2.CC_STAT_AREA]>400 and st[i,cv2.CC_STAT_WIDTH]>200: keep[lab==i]=1
cnt,_=cv2.findContours(keep,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE); fill=np.zeros_like(keep); cv2.drawContours(fill,cnt,-1,1,-1)
al=cv2.GaussianBlur(fill.astype(np.float32),(0,0),1.2)
ys,xs=np.where(fill>0); x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
sub=np.dstack([a[y0:y1,x0:x1],(al[y0:y1,x0:x1]*255).astype(np.uint8)])
sh,sw=sub.shape[:2]; scale=(S*2*0.80)/sh
sub_im=Image.fromarray(sub).resize((int(sw*scale),int(sh*scale)),Image.LANCZOS)
canvas=Image.new('RGBA',(S*2,S*2),(0,0,0,0)); yy,xx=np.mgrid[:S*2,:S*2]
circ=np.dstack([np.broadcast_to(TINT.astype(np.uint8),(S*2,S*2,3)),(np.clip((S*0.985-np.sqrt((xx-S)**2+(yy-S)**2)),0,1.5)/1.5*255).astype(np.uint8)])
canvas=Image.fromarray(circ,'RGBA'); canvas.alpha_composite(sub_im,((S*2-sub_im.width)//2,int(S*2*0.10)))
# clip child to circle
ca=np.array(canvas); ca[...,3]=np.minimum(ca[...,3],circ[...,3]); Image.fromarray(ca).resize((S,S),Image.LANCZOS).save('../badge-posture.png')

# ---- machine photograph
p=Image.open('ref-machine-photo.png').convert('RGB'); pa=np.array(p)
dist=(255-pa.astype(int)).max(2)
m=(dist>14).astype(np.uint8)
m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(5,5)))
n,lab,st,_=cv2.connectedComponentsWithStats(m); big=1+np.argmax(st[1:,cv2.CC_STAT_AREA]); keep=(lab==big).astype(np.uint8)
cnt,_=cv2.findContours(keep,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE); fill=np.zeros_like(keep); cv2.drawContours(fill,cnt,-1,1,-1)
fill=cv2.erode(fill,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(3,3)),iterations=1)
fill=cv2.erode(fill,np.ones((2,2),np.uint8))
up=2.4
big_rgb=cv2.resize(pa,None,fx=up,fy=up,interpolation=cv2.INTER_LANCZOS4)
al=cv2.resize(fill.astype(np.float32),None,fx=up,fy=up,interpolation=cv2.INTER_CUBIC); al=cv2.GaussianBlur(al,(0,0),1.1)
img=Image.fromarray(big_rgb).filter(ImageFilter.UnsharpMask(radius=1.6,percent=90,threshold=2))
rgba=np.dstack([np.array(img),(np.clip(al,0,1)*255).astype(np.uint8)])
ys,xs=np.where(al>0.02); Image.fromarray(rgba).crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1)).save('../machine-photo.png')
print(Image.open('../machine-photo.png').size)
