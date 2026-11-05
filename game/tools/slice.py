import json,sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ni
SRC=Path(__file__).resolve().parent.parent.parent/'ASSETS'; OUT=Path(sys.argv[1]); S=2752/2000
H=['Detective','Nurse','Beat Cop','Vigilante','Reporter','Firefighter','Doctor','Boxer','Priest','Mechanic','SWAT','Prodigy','Ranger','Judge','Inventor','Paramedic','Patriot','Athlete','Baker','Guardian']
V1=['Boss','Brute','Sister','Shadow','Scribe','Chemist','Driver','Soldier','Spy','Prelate']
V2=['Grandmaster','Executioner','Undertaker','Whisperer','Smuggler','Apothecary','Silencer','Medium','Usurer','Initiate']
jobs=[]
hx=[(176,462),(515,802),(856,1145),(1197,1485),(1539,1825)]; hy=[(140,354),(384,566),(628,811),(873,1056)]
for i,n in enumerate(H):
    x,y=hx[i%5],hy[i//5]; jobs.append(('hero',n,'GOODHERO.jpeg',x,y,True))
bx=[(86,368),(477,756),(866,1144),(1254,1534),(1642,1924)]; by=[(168,506),(678,1018)]
for i,n in enumerate(V1):
    jobs.append(('villain',n,'BADHERO1.jpeg',bx[i%5],by[i//5],False))
by2=[(170,504),(680,1012)]
for i,n in enumerate(V2):
    jobs.append(('villain',n,'BADHERO2.jpeg',bx[i%5],by2[i//5],False))
mon={'Crystal Scurrier':((1205,1500),(640,992)),'Gloom Eye':((96,402),(140,470)),'Banshee Phantasm':((100,424),(625,988)),'Chitin Horror':((432,820),(150,500)),'Spore Brute':((1585,1948),(92,500)),'Flesh Amalgam':((1212,1545),(145,495)),'Rusted Ghoul':((826,1168),(595,990)),'Cyber Dread':((468,812),(610,985)),'Void Weaver':((848,1152),(128,498)),'Nameless King':((1458,2000),(565,995))}
for n,(x,y) in mon.items(): jobs.append(('monster',n,'MONSTERS.jpeg',x,y,False))
nx=[(130,444),(488,802),(847,1161),(1205,1520),(1565,1879)]
for i,(n,yy) in enumerate([('Clerk',(236,590)),('Busker',(236,590)),('Sanitation Worker',(252,590)),('Mail Carrier',(236,590)),('Tourist',(236,590)),('Cafe Patron',(698,1052)),('Gardener',(698,1052)),('Construction Worker',(712,1052)),('Shopper',(698,1052)),('Plumber',(698,1052))]):
    jobs.append(('npc',n,'NPC.jpeg',nx[i%5],yy,False))
hx2=hx
for n,c,r in [('Commuter',0,0),('Barista',1,0),('Elder Lady',2,0),('Janitor',3,0),('Chef',0,2),('Guard',3,2),('Carpenter',0,3),('Street Singer',1,3),('Fisherman',2,3),('Elder Gentleman',4,3)]:
    jobs.append(('npc',n,'NPC2.jpeg',hx2[c],hy[r],True))
cache={}
def cut(cat,name,f,xr,yr,hero):
    im=cache.setdefault(f,np.asarray(Image.open(SRC/f).convert('RGB')).astype(np.int32))
    x0,x1,y0,y1=[int(v*S) for v in (*xr,*yr)]
    a=im[y0:y1,x0:x1]; h,w,_=a.shape
    if cat=='monster':
        import cv2
        A=a.astype(np.uint8)[:,:,::-1].copy()
        m=np.full((h,w),cv2.GC_PR_FGD,np.uint8); e=max(4,int(min(h,w)*.012))
        m[:e]=m[-e:]=cv2.GC_BGD; m[:,:e]=cv2.GC_BGD; m[:,-e:]=cv2.GC_BGD
        lum=a.max(2); m[(lum<46)&(m!=cv2.GC_BGD)]=cv2.GC_PR_BGD
        yy,xx=np.mgrid[:h,:w]
        if name=='Spore Brute':
            m[(lum<30)&(m!=cv2.GC_BGD)]=cv2.GC_BGD
            m[((xx-(1700-1585)*S)/(110*S))**2+((yy-(370-92)*S)/(120*S))**2<1]=cv2.GC_FGD
        if name=='Chitin Horror':
            m[:int(200*S),:int(24*S)]=cv2.GC_BGD; m[:int(150*S),int(344*S):int(370*S)]=cv2.GC_BGD
        if name=='Nameless King':
            m[lum<24]=cv2.GC_BGD
            cx,cy=(1730-1458)*S,(830-565)*S
            m[((xx-cx)/(190*S))**2+((yy-cy)/(190*S))**2<1]=cv2.GC_FGD
            m[(xx>(1680-1458)*S)&(xx<(1785-1458)*S)&(yy>(575-565)*S)&(yy<(660-565)*S)]=cv2.GC_FGD
        cv2.grabCut(A,m,None,np.zeros((1,65)),np.zeros((1,65)),6,cv2.GC_INIT_WITH_MASK)
        fg=(m==cv2.GC_FGD)|(m==cv2.GC_PR_FGD)
        fg=ni.binary_opening(fg,iterations=2)
        lab,n=ni.label(fg); sz=ni.sum(fg,lab,range(1,n+1))
        keep=lab==(1+int(np.argmax(sz)))
        for i,v in enumerate(sz):
            if v>h*w*.004: keep|=lab==i+1
        keep=ni.binary_fill_holes(keep)
        ys,xs=np.where(keep); by0,by1,bx0,bx1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
        alpha=ni.binary_erosion(keep,iterations=1)*255
        return Image.fromarray(np.dstack([a.astype(np.uint8),alpha.astype(np.uint8)])[by0:by1,bx0:bx1])
    # flat card fill = most common colour; gather its near shades, plus the header strip on hero cards
    q=(a//6)*6; u,c=np.unique(q.reshape(-1,3),axis=0,return_counts=True); o=np.argsort(-c); top=u[o[0]]+3
    shades=[u[i]+3 for i in o[:60] if np.linalg.norm(u[i]+3-top)<(34 if cat=='monster' else 22)]
    if hero:
        bs=a[int(h*.9):,int(w*.1):int(w*.9)].reshape(-1,3);uu,cc=np.unique((bs//6)*6,axis=0,return_counts=True)
        hs=a[2:int(h*.13),int(w*.2):int(w*.8)].reshape(-1,3);uu,cc=np.unique((hs//6)*6,axis=0,return_counts=True);shades.append(uu[np.argmax(cc)]+3)
    pal=np.array(shades)
    d=np.min(np.sqrt(((a[:,:,None,:]-pal[None,None,:,:])**2).sum(3).astype(float)),axis=2)
    bgish=d<(17 if cat=='monster' else 15)
    if cat=='villain': bgish=ni.binary_closing(bgish,iterations=1)
    if hero:
        hd=int(h*.17); strip=a[:hd]; gold=(strip[:,:,0]>150)&(strip[:,:,1]>120)&(strip[:,:,2]<135)
        bgish[:hd]|=ni.binary_dilation(gold,iterations=2)
        navy=(strip.sum(2)<150)&(strip[:,:,2]>strip[:,:,0]+10)
        bgish[:hd]|=navy
    lab,nl=ni.label(bgish); areas=ni.sum(bgish,lab,range(1,nl+1))
    big={i+1 for i,v in enumerate(areas) if v>h*w*.004} if hero else {int(np.argmax(areas))+1}
    border=(set(lab[0])|set(lab[-1])|set(lab[:,0])|set(lab[:,-1])|big)-{0}
    bg=np.isin(lab,list(border))
    fg=~bg
    core=ni.binary_opening(fg,iterations=3)
    lab,n=ni.label(core)
    if n==0: return None
    sz=ni.sum(core,lab,range(1,n+1)); keep=lab==(1+int(np.argmax(sz)))
    if f=='BADHERO1.jpeg':
        for i,v in enumerate(sz):
            if v>h*w*.003: keep|=lab==i+1
    keep=ni.binary_dilation(keep,iterations=4)&fg
    keep=ni.binary_fill_holes(keep) if cat!='monster' else keep
    ys,xs=np.where(keep); by0,by1,bx0,bx1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
    alpha=(ni.binary_erosion(keep,iterations=1)*255).astype(np.uint8)
    rgba=np.dstack([a.astype(np.uint8),alpha])[by0:by1,bx0:bx1]
    return Image.fromarray(rgba)
sheet=[];TH=190
for cat,n,f,x,y,hr in jobs:
    if cat=='npc': continue
    t=cut(cat,n,f,x,y,hr)
    if t is None: print('FAILED',n); continue
    h={'monster':260,'npc':110}.get(cat,TH)
    sc=min(1,h/t.height); t2=t.resize((max(1,round(t.width*sc)),max(1,round(t.height*sc))),Image.LANCZOS)
    sheet.append((cat,n,t2))
# atlas
W=2000;x=y=0;row=0;pos={};
for cat,n,t in sheet:
    if x+t.width>W: x=0;y+=row+2;row=0
    pos[n]=(cat,x,y,t.width,t.height);x+=t.width+2;row=max(row,t.height)
Hh=y+row
at=Image.new('RGBA',(W,Hh),(0,0,0,0))
for cat,n,t in sheet:
    _,px,py,_,_=pos[n];at.paste(t,(px,py))
at.save(OUT/'dayrim-cast.webp',quality=84,method=6)
bg=Image.new('RGBA',at.size,(60,120,80,255));bg.alpha_composite(at);bg.convert('RGB').save(OUT/'check.png')
json.dump({k:{'c':v[0],'x':v[1],'y':v[2],'w':v[3],'h':v[4]} for k,v in pos.items()},open(OUT/'cast.json','w'))
print(len(pos),'sprites',at.size,(OUT/'dayrim-cast.webp').stat().st_size//1024,'KB')
