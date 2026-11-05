#!/usr/bin/env python3
"""Lifts the Necromancer and Toxin Alchemist out of their movement videos by rebuilding the empty room and
separating what differs from it. Glow is kept translucent. Writes RGBA frames to <out>/<key>/<state>_<n>.png"""
import cv2,sys,json,numpy as np
from pathlib import Path
from PIL import Image
from scipy import ndimage as ni
root=Path(__file__).resolve().parent.parent.parent;out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
def load(f):
    c=cv2.VideoCapture(str(root/f));F=[]
    while True:
        ok,x=c.read()
        if not ok:break
        F.append(x[:,:,::-1].copy())
    return F
N=load('villian necro movement assets.mp4');X=load('villian toxic movement assets.mp4')
ref=X[8];gr=lambda a:cv2.cvtColor(a,cv2.COLOR_RGB2GRAY).astype(np.float32);win=np.ones(ref.shape[:2],np.float32);win[80:700,300:980]=0
def align(a):
    (dx,dy),r=cv2.phaseCorrelate(gr(a)*win,gr(ref)*win)
    if abs(dx)>40 or abs(dy)>40:dx=dy=0
    return cv2.warpAffine(a,np.float32([[1,0,dx],[0,1,dy]]),(a.shape[1],a.shape[0]),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE)
def rough(b,pl,thr=22):
    d=np.abs(b.astype(np.int16)-pl.astype(np.int16)).sum(2);m=ni.binary_opening(d>thr,iterations=2);l,n=ni.label(m)
    if n:
        sz=ni.sum(m,l,range(1,n+1));m=np.isin(l,[j+1 for j,v in enumerate(sz) if v>400])
    return ni.binary_dilation(ni.binary_fill_holes(ni.binary_closing(m,iterations=3)),iterations=8)
samp=[(X,list(range(0,76,4))+list(range(216,240,4))),(N,list(range(0,80,4))+list(range(216,240,4)))]
fr=[align(F[i]) for F,ids in samp for i in ids];arr=np.stack(fr);plate=np.median(arr,axis=0).astype(np.uint8)
for it in range(2):
    masks=np.stack([rough(f,plate) for f in fr]);M=np.ma.array(arr,mask=np.repeat(masks[:,:,:,None],3,axis=3));p2=np.ma.median(M,axis=0);hole=np.ma.getmaskarray(p2).any(2);plate=np.where(hole[:,:,None],plate,np.asarray(p2.filled(0))).astype(np.uint8)
    print('uncovered px',int(hole.sum()))
if hole.any():plate=cv2.inpaint(plate,hole.astype(np.uint8),5,cv2.INPAINT_TELEA)
# the doorway shows bars in some shots: keep a second plate for those
gr_frames=[align(F[i]) for F,r in[(X,range(216,240,3)),(N,range(216,240,3)),(X,range(48,60,3))] for i in r]
plateB=plate.copy();door=np.zeros(plate.shape[:2],bool);door[200:420,520:760]=True
stk=np.stack(gr_frames);bmed=np.median(stk,axis=0).astype(np.uint8);plateB[door]=bmed[door]
# the figure stands in front of the same spot in every shot, so the median still holds traces of it. Rebuild that spot:
# the arch interior is black (darkest value seen), the wall below it is painted in from both sides.
allf=np.stack(fr);arch=np.zeros(plate.shape[:2],bool);arch[205:490,535:728]=True
dark=np.percentile(allf,4,axis=0).astype(np.uint8);plate[arch]=dark[arch]
wallm=np.zeros(plate.shape[:2],np.uint8);wallm[490:625,500:770]=1;plate=cv2.inpaint(plate,wallm,9,cv2.INPAINT_TELEA)
plateB=plate.copy();door2=np.zeros(plate.shape[:2],bool);door2[205:395,535:728]=True;plateB[door2]=bmed[door2]
hole=np.zeros(plate.shape[:2],bool)
Image.fromarray(plate).save(out/'plate.png')
SEG={'necro':(N,{'idle':(0,76,12),'small':(80,110,8),'moderate':(112,150,10),'special':(150,198,14),'defeated':(206,240,8)}),
     'toxic':(X,{'idle':(0,72,12),'small':(76,112,8),'moderate':(114,148,10),'special':(150,204,14),'defeated':(212,240,8)})}
K=.42;T0=24;RANGE=70
never=ni.binary_dilation(hole,iterations=3)
flames=np.zeros(plate.shape[:2],bool);flames[365:440,385:440]=True;flames[365:440,790:845]=True
def silh(f):
    b=align(f);d=np.minimum(np.abs(b.astype(np.int16)-plate.astype(np.int16)).sum(2),np.abs(b.astype(np.int16)-plateB.astype(np.int16)).sum(2))
    m=d>16;m=ni.binary_opening(m,iterations=2);l,n=ni.label(m)
    c=l[max(0,hc_y),hc_x] if False else 0
    sz=ni.sum(m,l,range(1,n+1)) if n else [];
    if n:
        # the component overlapping the never-seen core is the character
        cz=np.zeros(m.shape,bool);cz[300:560,590:690]=True;ids=np.unique(l[cz&(l>0)]);m=np.isin(l,ids) if len(ids) else l==(int(np.argmax(sz))+1)
    return ni.binary_fill_holes(ni.binary_closing(m,iterations=5))
def matte(f,st,sil,kneel=False):
    b=align(f);dA=np.abs(b.astype(np.int16)-plate.astype(np.int16)).sum(2);dB=np.abs(b.astype(np.int16)-plateB.astype(np.int16)).sum(2);d=np.minimum(dA,dB).astype(np.float32)
    pl=np.where((dB<dA)[:,:,None],plateB,plate).astype(np.float32);a=np.clip((d-T0)/RANGE,0,1)
    sat=(b.max(2).astype(np.float32)-b.min(2));lum=b.mean(2).astype(np.float32);keepout=np.clip((sat-55)/70,0,1);keepout=np.maximum(keepout,np.clip((lum-115)/50,0,1))
    body=ni.binary_dilation(sil,iterations=3)
    # away from the body only glowing or bright things survive, so lit walls and floors disappear
    a=np.where(body,1,a*keepout)
    if st in('idle','small','defeated'):a[flames&~body]=0
    m=a>.04;m=ni.binary_opening(m,iterations=1);l,n=ni.label(m)
    if n:
        sz=ni.sum(m,l,range(1,n+1));a=np.where(np.isin(l,[j+1 for j,v in enumerate(sz) if v>70]),a,0)
    a=ni.gaussian_filter(a,.7);A=np.maximum(a[:,:,None],.03);c=np.clip((b.astype(np.float32)-(1-a[:,:,None])*pl)/A,0,255)
    c=np.where(body[:,:,None],b,c)
    return np.dstack([c,a*255]).astype(np.uint8)
index={}
for key,(F,S) in SEG.items():
    d=out/key;d.mkdir(exist_ok=True);index[key]={}
    s0,e0,_=S['idle'];core=np.mean(np.stack([silh(F[i]) for i in range(s0,e0,5)]).astype(np.float32),axis=0)>.45
    l,n=ni.label(core);core=l==(int(np.argmax(ni.sum(core,l,range(1,n+1))))+1);core=ni.binary_fill_holes(ni.binary_closing(core,iterations=6));near=ni.binary_dilation(core,iterations=70)
    for st,(s,e,n) in S.items():
        L=[]
        for q,i in enumerate(np.linspace(s,e-1,n).astype(int)):
            if st=='special':sil=core
            elif st=='defeated':
                raw=silh(F[i]);raw[:395]=False;l2,n2=ni.label(raw);sil=(l2==(int(np.argmax(ni.sum(raw,l2,range(1,n2+1))))+1)) if n2 else raw
            else:
                sil=(silh(F[i])&near)|(core if st=='idle' else False)
                if st=='moderate':sil=sil|core
            m=Image.fromarray(matte(F[i],st,sil,st=='defeated')).resize((int(1280*K),int(720*K)),Image.LANCZOS);m.save(d/f'{st}_{q}.png');L.append(int(i))
        index[key][st]=L
    ys,xs=np.where(core);index[key]['anchor']=[float(np.median(xs))*K,float(ys.max())*K];print(key,'anchor',index[key]['anchor'],flush=True)
json.dump(index,open(out/'index.json','w'));print('done')
