#!/usr/bin/env python3
"""Cuts the weak and strong minions from the minion sheets into sprites/minion. Needs Pillow, NumPy, SciPy."""
from pathlib import Path
import numpy as np,sys
from PIL import Image
from scipy import ndimage as ni
root=Path(__file__).resolve().parent.parent;D=root.parent;O=root/'sprites'/'minion';O.mkdir(exist_ok=True)
J=[('minion necromancer.jpeg','Skeleton',(42,198,425,1040),20),('minion necromancer.jpeg','Bone Goliath',(490,198,866,1040),20),
   ('minion toxic.jpeg','Toxin Grunt',(74,205,446,1020),20),('minion toxic.jpeg','Toxin Enforcer',(464,205,852,1020),20),
   ('minion void.jpeg','Voidling',(32,312,404,1100),13),('minion void.jpeg','Void Goliath',(462,312,826,1100),13)]
sheet=Image.new('RGB',(6*260,420),(190,190,190))
for i,(f,n,b,tol) in enumerate(J):
    a=np.asarray(Image.open(D/f).convert('RGB').crop(b)).astype(np.int32);h,w,_=a.shape
    # card panel colour: most common shades. Ground shadows are darker versions of it, so they key out too.
    q=(a//6)*6;u,c=np.unique(q.reshape(-1,3),axis=0,return_counts=True);top=u[np.argmax(c)]+3
    d=np.sqrt(((a-top)**2).sum(2).astype(float));r=a/np.maximum(top,1);ratio=r.std(2)
    bg=(d<tol)|((ratio<.07)&(a.sum(2)<top.sum()*1.12))
    lab,nl=ni.label(bg);edge=(set(lab[0])|set(lab[-1])|set(lab[:,0])|set(lab[:,-1]))-{0};fg=~np.isin(lab,list(edge));ar=ni.sum(bg,lab,range(1,nl+1));fg&=~np.isin(lab,[j+1 for j,v in enumerate(ar) if v>h*w*.002])
    fg=ni.binary_opening(fg,iterations=1);lab,nl=ni.label(fg);sz=ni.sum(fg,lab,range(1,nl+1));big=int(np.argmax(sz));keep=lab==big+1
    # keep glowing parts such as flames and portals that float free of the body
    sat=a.max(2)-a.min(2)
    for j,v in enumerate(sz):
        m=lab==j+1
        if j!=big and v>h*w*.0012 and sat[m].mean()>70:keep|=m
    keep=ni.binary_fill_holes(keep)
    if n=='Toxin Enforcer':
        sp=np.zeros_like(keep);sp[15:135,245:350]=True;keep&=~(sp&(a.sum(2)<150))
    ys,xs=np.where(keep);al=(ni.gaussian_filter(keep.astype(float),.7)*255).astype(np.uint8)
    im=Image.fromarray(np.dstack([a.astype(np.uint8),al])).crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1));k=min(1,300/im.height);im=im.resize((round(im.width*k),round(im.height*k)),Image.LANCZOS);im.save(O/(n.lower().replace(' ','-')+'.png'))
    t=Image.new('RGBA',im.size,(190,190,190,255));t.alpha_composite(im);sheet.paste(t.convert('RGB').resize((min(258,t.width),min(410,t.height))),(i*260,5))
if len(sys.argv)>1:sheet.save(sys.argv[1])
print('minions cut')
