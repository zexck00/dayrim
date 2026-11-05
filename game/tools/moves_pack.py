#!/usr/bin/env python3
"""Trims and packs the cut movement frames into one atlas per villain, plus sprites/moves/moves.json."""
import json,sys
from pathlib import Path
import numpy as np
from PIL import Image
src=Path(sys.argv[1]);root=Path(__file__).resolve().parent.parent;O=root/'sprites'/'moves';O.mkdir(parents=True,exist_ok=True)
idx=json.load(open(src/'index.json'));vi=json.load(open(src/'void_index.json'));STATES=['idle','small','moderate','special','defeated'];meta={}
for key in ['necro','toxic','void']:
    items=[]
    for st in STATES:
        n=len(vi[st]) if key=='void' else len(idx[key][st])
        for q in range(n):
            im=Image.open(src/key/f'{st}_{q}.png').convert('RGBA');a=np.asarray(im)[:,:,3]>10;ys,xs=np.where(a)
            if not len(ys):continue
            b=(xs.min(),ys.min(),xs.max()+1,ys.max()+1);c=im.crop(b)
            if key=='void':
                f=vi[st][q];ax,ay=f['ax'],f['ay']
            else:ax,ay=idx[key]['anchor']
            items.append((st,q,c,b[0]-ax,b[1]-ay))
    if key=='void':
        # scale every state to her idle height; feet per state use the median so she does not jitter
        H0=np.median([f['h'] for f in vi['idle']]);sc={}
        for st in STATES:
            hs=sorted(f['h'] for f in vi[st]);sc[st]=float(H0/hs[len(hs)*3//4]) if st not in('defeated',) else float(H0/vi['defeated'][0]['h'])
            sc[st]=min(1.35,max(.75,sc[st]))
    else:sc={s:1. for s in STATES}
    W=2000;x=y=row=0;pos=[]
    for st,q,c,ox,oy in items:
        if x+c.width>W:x=0;y+=row+1;row=0
        pos.append((st,q,x,y,c.width,c.height,ox,oy));x+=c.width+1;row=max(row,c.height)
    at=Image.new('RGBA',(W,y+row),(0,0,0,0))
    for (st,q,c,ox,oy),(s2,q2,px,py,w,h,_,__) in zip(items,pos):at.paste(c,(px,py))
    at.save(O/f'{key}.webp',quality=76,method=6,alpha_quality=80);m={s:[] for s in STATES}
    for st,q,px,py,w,h,ox,oy in pos:m[st].append([px,py,w,h,round(float(ox),1),round(float(oy),1)])
    if key=='necro':H=168
    meta[key]={'frames':m,'scale':sc,'atlas':[W,y+row]};print(key,at.size,(O/f'{key}.webp').stat().st_size//1024,'KB',{s:len(m[s]) for s in STATES})
json.dump(meta,open(O/'moves.json','w'),separators=(',',':'));print('packed')
