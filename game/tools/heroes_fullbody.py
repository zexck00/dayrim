#!/usr/bin/env python3
"""Cuts the heroes out of ASSETS/GOODHERO.jpeg at their real proportions, extends their legs to full body,
applies the villain sheets' chunky pixels and outline, then repacks the sprite atlas. Needs Pillow, NumPy, SciPy."""
import json,sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ni
root=Path(__file__).resolve().parent.parent;S=root/'sprites';SRC=root.parent/'ASSETS'/'GOODHERO.jpeg';K=2752/2000
hx_=[(176,462),(515,802),(856,1145),(1197,1485),(1539,1825)];hy_=[(140,354),(384,566),(628,811),(873,1056)]
hx=lambda c:np.array([int(c[i:i+2],16) for i in (1,3,5)],float)
# p pants, s shoes; coat = hem hangs over the thigh; robe = floor length; lx = leg centre (share of width) when an item confuses detection
H={'Detective':dict(p='#4a4238',s='#2a2018',coat=1,hem='#c8a878'),'Nurse':dict(p='#6fd6d0',s='#eeeae0',lx=.56),'Beat Cop':dict(p='#1f2f5e',s='#15161e'),'Vigilante':dict(p='#23252f',s='#15161e'),'Reporter':dict(p='#3a3a44',s='#2a2018',coat=1,hem='#7a4e2a'),
'Firefighter':dict(p='#5d4a2a',s='#20222c',band='#e8d84a',hip=.34),'Doctor':dict(p='#3a5a80',s='#2a2018',coat=1,hem='#eeeae0'),'Boxer':dict(p='#c98a5e',s='#a02020',shorts='#eeeae0'),'Priest':dict(robe='#1d1f28',s='#15161e'),'Mechanic':dict(p='#6c705a',s='#3a2a1a'),
'SWAT':dict(p='#262c3a',s='#15161e',soft=True,lx=.42,join=1,hip=.36),'Prodigy':dict(p='#2c3a5a',s='#d8d4c8'),'Ranger':dict(p='#6a5a30',s='#3a2a1a'),'Judge':dict(robe='#17181f',s='#15161e'),'Inventor':dict(p='#3f4a5a',s='#2a2018'),
'Paramedic':dict(p='#1f2a38',s='#15161e',band='#c8ccc0',lx=.62),'Patriot':dict(p='#2c3f7a',s='#a02020'),'Athlete':dict(p='#1f4aa8',s='#eeeae0',band='#eeeae0',soft=True),'Baker':dict(p='#5a4a38',s='#2a2018',coat=1,hem='#eeeae0'),'Guardian':dict(p='#2448a8',s='#e8b82a',lx=.56)}
NAMES=list(H)
src=np.asarray(Image.open(SRC).convert('RGB')).astype(np.int32)
def cut(i,soft=False):
    xr,yr=hx_[i%5],hy_[i//5];x0,x1,y0,y1=[int(v*K) for v in (*xr,*yr)];a=src[y0:y1,x0:x1];h,w,_=a.shape
    q=(a//6)*6;u,c=np.unique(q.reshape(-1,3),axis=0,return_counts=True);o=np.argsort(-c);top=u[o[0]]+3
    pal=[u[j]+3 for j in o[:60] if np.linalg.norm(u[j]+3-top)<22]
    hs=a[2:int(h*.13),int(w*.2):int(w*.8)].reshape(-1,3);uu,cc=np.unique((hs//6)*6,axis=0,return_counts=True);pal.append(uu[np.argmax(cc)]+3)
    pal=np.array(pal);d=np.min(np.sqrt(((a[:,:,None,:]-pal[None,None,:,:])**2).sum(3).astype(float)),axis=2);bg=d<15
    hd=int(h*.17);st=a[:hd];gold=(st[:,:,0]>150)&(st[:,:,1]>120)&(st[:,:,2]<135);bg[:hd]|=ni.binary_dilation(gold,iterations=2)
    bg[:hd]|=(st.sum(2)<150)&(st[:,:,2]>st[:,:,0]+10)
    lab,n=ni.label(bg);ar=ni.sum(bg,lab,range(1,n+1));edge=(set(lab[0])|set(lab[-1])|set(lab[:,0])|set(lab[:,-1])|{j+1 for j,v in enumerate(ar) if v>h*w*.004})-{0}
    fg=~np.isin(lab,list(edge));core=ni.binary_opening(fg,iterations=2);lab,n=ni.label(core);keep=np.zeros_like(core)
    sz=ni.sum(core,lab,range(1,n+1));big=int(np.argmax(sz))+1
    for j,v in enumerate(sz):
        m=lab==j+1;px=a[m];g=((px[:,0]-px[:,2])>55).mean();dark=(px.sum(1)<170).mean();navy=((px[:,2]>px[:,0]+8)&(px.sum(1)<230)).mean()
        yy,xx=np.where(m);fill=v/max(1,(yy.max()-yy.min()+1)*(xx.max()-xx.min()+1))
        frame=fill<.3 or navy>.45 or dark>.75;star=g>.5 and v<h*w*.03
        if j+1==big or (v>h*w*.006 and not frame and not star):keep|=m
    keep=ni.binary_dilation(keep,iterations=3)&fg;keep=ni.binary_fill_holes(keep)
    # the main figure can still touch thin frame lines: strip tall narrow lines and horizontal rules at the card edge
    thin=ni.binary_opening(keep,structure=np.ones((5,5) if soft else (9,9)));keep=ni.binary_dilation(thin,iterations=5)&keep
    lab2,n2=ni.label(keep)
    if n2>1:
        s2=ni.sum(keep,lab2,range(1,n2+1));keep=np.isin(lab2,[j+1 for j,v in enumerate(s2) if v>h*w*.012])
    return a.astype(np.uint8),keep
def build(i,name,cfg):
    a,m=cut(i,cfg.get('soft',False));h,w=m.shape
    if cfg.get('join'):  # slide a held item that got separated back against the body
        L,nL=ni.label(m)
        if nL>1:
            sz=ni.sum(m,L,range(1,nL+1));o=np.argsort(-sz);main=L==o[0]+1;item=L==o[1]+1;mx=np.where(main.any(0))[0].max();ix=np.where(item.any(0))[0].min();sh=max(0,ix-mx-2)
            if sh:
                na=a.copy();nm=m&~item;yy,xx=np.where(item);na[yy,xx-sh]=a[yy,xx];nm[yy,xx-sh]=True;a,m=na,nm
    ys=np.where(m.any(1))[0];top=ys.min();bot=ys.max()
    body=h-top;ext=int(body*.52);CW=w+40;CH=body+ext+10;rgb=np.zeros((CH,CW,3),np.uint8);al=np.zeros((CH,CW),bool);ox=20
    rgb[:body,ox:ox+w]=a[top:];al[:body,ox:ox+w]=m[top:]
    b=bot-top;low=al[max(0,b-5):b+1].any(0);lab,n=ni.label(low);cx=int(ox+w*cfg['lx']) if 'lx' in cfg else int(np.median(np.where(al[int(body*.45):b])[1]))
    best=None;bd=1e9
    for j in range(1,n+1):
        r=np.where(lab==j)[0]
        if len(r)<18:continue
        dd=0 if r.min()<=cx<=r.max() else min(abs(r.min()-cx),abs(r.max()-cx))
        if dd<bd:bd=dd;best=(r.min(),r.max())
    # legs hang from the torso: centre on the body's lower half, not on whatever reaches lowest (hands, kits)
    torsoy=int(b*.72);ax=np.where(al[int(b*.5):int(b*.88)].any(0))[0];tc=int(np.median(np.where(al[int(b*.5):int(b*.88)])[1])) if 'lx' not in cfg else cx
    row=al[torsoy];lr,nr=ni.label(row);rr=lr[min(tc,len(lr)-1)];run=np.where(lr==rr)[0] if rr else np.array([tc-30,tc+30])
    mx=.5 if 'robe' in cfg else cfg.get('hip',.3);tw_=max(min(run.max()-run.min(),int(w*mx)),int(w*.24));x0,x1=tc-tw_//2,tc+tw_//2;span=x1-x0
    # first empty row under the torso: start the legs there so nothing floats
    colsl=al[:,tc-span//4:tc+span//4].any(1);yy=np.where(colsl[:b+1])[0];ys0=yy.max() if len(yy) else b;gapfill=b-ys0>6
    if gapfill:
        ext=ext+(b-ys0);b=ys0
    bm=al[max(0,b-6):b+1,x0:x1+1];band=rgb[max(0,b-6):b+1,x0:x1+1];sampled=np.median(band[bm],axis=0) if bm.any() else hx(cfg.get('p','#333333'))
    shoeh=max(8,int(body*.045));yb=b+ext;mid=(x0+x1)/2;gap=max(3,int(span*.05));sc=hx(cfg['s'])
    def put(y,xa,xb,c):
        xa,xb=int(xa),int(xb)
        if xb>xa:rgb[y,xa:xb]=np.clip(c,0,255);al[y,xa:xb]=True
    for y in range(b-2,yb):
        t=(y-b)/ext
        if 'robe' in cfg:
            c=hx(cfg['robe'])
            if y<yb-shoeh:
                wd=span/2*(1+.1*max(t,0));put(y,mid-wd,mid+wd,c);put(y,mid-wd,mid-wd+4,c+20);put(y,mid+wd-4,mid+wd,c*.7)
            else:put(y,mid-span*.32,mid-2,sc);put(y,mid+2,mid+span*.32,sc)
            continue
        tp=.92-.34*max(t,0);lw=(span/2-gap/2)*tp;inner=gap/2
        c=sampled if (not cfg.get('coat') and np.linalg.norm(sampled-hx(cfg['p']))<60) else hx(cfg['p'])
        for sd in(-1,1):
            xa,xb=(mid+inner,mid+inner+lw) if sd>0 else (mid-inner-lw,mid-inner)
            if y>=yb-shoeh:
                put(y,xa-(5 if sd<0 else 0),xb+(5 if sd>0 else 0),sc+(35 if y<yb-shoeh+3 else 0));continue
            put(y,xa,xb,c);put(y,xa,xa+max(3,lw*.22),c*1.16+5);put(y,xb-max(3,lw*.24),xb,c*.7)
            if .42<t<.47:put(y,xa,xb,c*.8)
            if 'shorts' in cfg and t<.26:put(y,xa,xb,hx(cfg['shorts']))
            if 'band' in cfg and .68<t<.76:put(y,xa,xb,hx(cfg['band']))
    if cfg.get('coat'):
        hem=int(ext*.22)
        hc=hx(cfg['hem'])
        for y in range(b-2,b+hem):put(y,x0-2,x1+3,hc);put(y,x0-2,x0+3,hc*1.1);put(y,x1-2,x1+3,hc*.72);put(y,mid-1,mid+1,hc*.55)
    ky,kx=np.where(al);rgb=rgb[ky.min():ky.max()+1,kx.min():kx.max()+1];al=al[ky.min():ky.max()+1,kx.min():kx.max()+1]
    GH=104;f=GH/rgb.shape[0];GW=max(8,round(rgb.shape[1]*f))
    rgba=np.dstack([rgb,(al*255).astype(np.uint8)]);sm=np.asarray(Image.fromarray(rgba).resize((GW,GH),Image.BOX)).copy();mk=sm[:,:,3]>120
    pal=Image.fromarray(sm[:,:,:3]).quantize(40,dither=Image.Dither.NONE).convert('RGB');out=np.zeros((GH+6,GW+4,4),np.uint8);out[1:GH+1,2:GW+2,:3]=np.asarray(pal);out[1:GH+1,2:GW+2,3]=mk*255
    M=out[:,:,3]>0;E=ni.binary_dilation(M)&~M;out[E]=(16,14,20,255)
    fx=np.where(M[-12:-5].any(0))[0];c0=(fx.min()+fx.max())/2 if len(fx) else (GW+4)/2;rw=(fx.max()-fx.min())/2+5 if len(fx) else GW/3
    for y in range(GH-1,GH+6):
        for x in range(GW+4):
            d=((x-c0)/rw)**2+((y-(GH+1))/3.2)**2
            if d<1 and out[y,x,3]==0:out[y,x]=(8,6,10,int(150*(1-d*.6)))
    return Image.fromarray(out).resize(((GW+4)*2,(GH+6)*2),Image.NEAREST)
for i,n in enumerate(NAMES):build(i,n,H[n]).save(S/'hero'/(n.lower().replace(' ','-')+'.png'))
old=json.load(open(S/'cast.json'));items=[(k,v['c'],Image.open(S/v['c']/(k.lower().replace(' ','-')+'.png')).convert('RGBA')) for k,v in old.items()]
W=2000;x=y=row=0;cast={}
for k,c,im in items:
    if x+im.width>W:x=0;y+=row+2;row=0
    cast[k]=dict(c=c,x=x,y=y,w=im.width,h=im.height);x+=im.width+2;row=max(row,im.height)
at=Image.new('RGBA',(W,y+row),(0,0,0,0))
for k,c,im in items:at.paste(im,(cast[k]['x'],cast[k]['y']))
at.save(S/'dayrim-cast.webp',quality=88,method=6);json.dump(cast,open(S/'cast.json','w'),indent=1)
sh=Image.new('RGB',(10*200,3*232),(44,50,64));vn=[k for k in cast if cast[k]['c']=='villain'][:10]
for i,n in enumerate(NAMES+vn):
    v=cast[n];c=Image.alpha_composite(Image.new('RGBA',(v['w'],v['h']),(44,50,64,255)),at.crop((v['x'],v['y'],v['x']+v['w'],v['y']+v['h']))).convert('RGB');sh.paste(c,((i%10)*200+max(0,200-v['w'])//2,(i//10)*232))
sh.save(sys.argv[1]);print('ok',at.size,(S/'dayrim-cast.webp').stat().st_size//1024,'KB')
