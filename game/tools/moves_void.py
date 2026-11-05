#!/usr/bin/env python3
"""Lifts the Void Empress from her movement video using an AI silhouette plus glow keying. Her camera moves, so
each frame gets its own feet position and a scale that matches her idle height. Needs rembg (isnet-anime)."""
import cv2,sys,json,numpy as np
import onnxruntime as ort
from pathlib import Path
from PIL import Image
from scipy import ndimage as ni
root=Path(__file__).resolve().parent.parent.parent;out=Path(sys.argv[1]);d=out/'void';d.mkdir(parents=True,exist_ok=True)
_o=ort.SessionOptions();_o.intra_op_num_threads=4;_o.inter_op_num_threads=1
sess=ort.InferenceSession(sys.argv[2],_o,providers=['CPUExecutionProvider'])
def run_mask(arr):
    h,w=arr.shape[:2];im=np.asarray(Image.fromarray(arr).resize((1024,1024),Image.LANCZOS)).astype(np.float32);im=im/max(im.max(),1e-6)-np.array([.485,.456,.406],np.float32)
    r=sess.run(None,{sess.get_inputs()[0].name:im.transpose(2,0,1)[None]})[0][0,0];r=(r-r.min())/max(r.max()-r.min(),1e-6)
    return np.asarray(Image.fromarray((r*255).astype(np.uint8)).resize((w,h),Image.BILINEAR))
c=cv2.VideoCapture(str(root/'villian void movement assets.mp4'));F=[]
while True:
    ok,x=c.read()
    if not ok:break
    F.append(x[:,:,::-1].copy())
K=.42;S={'idle':(0,70,12),'small':(72,104,8),'moderate':(112,143,10),'special':(144,190,14),'defeated':(192,231,8)}
bright=lambda a:(255*(a/255.)**.45).astype(np.uint8)
def body(f):
    x0,x1=300,980;crop=f[0:720,x0:x1];m=run_mask(bright(crop))>110
    sat=(crop.max(2).astype(int)-crop.min(2));lum=crop.mean(2)
    # floor tiles sneak into the mask: low-colour pixels outside the torso column are dropped row by row
    m=ni.binary_opening(m,iterations=2);l,n=ni.label(m)
    if not n:return np.zeros(f.shape[:2],bool)
    sz=ni.sum(m,l,range(1,n+1));big=l==(int(np.argmax(sz))+1);out_=np.zeros(f.shape[:2],bool);out_[0:720,x0:x1]=ni.binary_fill_holes(big);return out_
res={};scales={}
ref=None
for st,(s,e,n) in S.items():
    res[st]=[]
    for q,i in enumerate(np.linspace(s,e-1,n).astype(int)):
        f=F[i];b=body(f);sat=(f.max(2).astype(np.float32)-f.min(2));lum=f.mean(2).astype(np.float32)
        glow=np.clip((sat-70)/60,0,1)*np.clip((lum-40)/40,0,1)
        # a dome or sphere can swallow the figure mask: trust the glow and a head-and-shoulders region instead
        ys,xs=np.where(b);ok=len(ys)>1500
        ax=float(np.median(xs)) if ok else 640.;ay=float(ys.max()) if ok else 640.;top=float(ys.min()) if ok else 200.
        a=np.maximum(b*1.,glow);bl=ni.gaussian_filter(a,.7);rgba=np.dstack([f,(bl*255).astype(np.uint8)])
        Image.fromarray(rgba).resize((int(1280*K),int(720*K)),Image.LANCZOS).save(d/f'{st}_{q}.png');res[st].append({'f':int(i),'ax':ax*K,'ay':ay*K,'h':(ay-top)*K});print(st,i,round(ax),round(ay),round(ay-top),flush=True)
json.dump(res,open(out/'void_index.json','w'));print('done')
