#!/usr/bin/env python3
"""Crops the 20 hero and 20 villain cards straight from the update sheets and repacks the sprite atlas. Needs Pillow."""
import json,sys
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parent.parent;S=root/'sprites';D=root.parent;K=2752/2000
SH=[('hero update 1.jpeg','hero-cards',['Detective','Vigilante','Guardian','Ranger','Inventor','Firefighter','Hero Shadow','Prodigy','Sage','Patriot']),
    ('hero update 2.jpeg','hero-cards',['Phantom','Pyromancer','Chronomancer','Beastmaster','Voidwalker','Exorcist','Gravity Mage','Druid','Cyborg','Illusionist']),
    ('ASSETS/villian update 1.jpeg','villain-cards',['Necromancer','Blood Reaper','Toxin Alchemist','Soul Stealer','Shadow Monarch','Puppeteer','Void Empress','Plague Doctor','Mad Scientist','Demon Knight']),
    ('ASSETS/villian update 2.jpeg','villain-cards',['Gravity Weaver','Mecha Tyrant','Chrono Thief','Swarm Queen','Ice Archmage','Deep Siren','Ash Shaman','Soul Forger','Mirror Jester','Cyber Priest'])]
X=[(72,380),(462,770),(851,1159),(1240,1548),(1630,1938)];Y=[(106,516),(616,1026)]
fn=lambda n:n.lower().replace(' ','-')+'.png'
old=json.load(open(S/'cast.json'));items=[(k,v['c']) for k,v in old.items() if v['c']=='monster']+[(n,'minion') for n in ['Skeleton','Bone Goliath','Toxin Grunt','Toxin Enforcer','Voidling','Void Goliath']];cards=[]
for f,folder,names in SH:
    (S/folder).mkdir(exist_ok=True);im=Image.open(D/f).convert('RGB')
    for i,n in enumerate(names):
        x,y=X[i%5],Y[i//5];c=im.crop((int(x[0]*K),int(y[0]*K),int(x[1]*K),int(y[1]*K)));c=c.resize((222,int(222*c.height/c.width)),Image.LANCZOS);c.save(S/folder/fn(n));cards.append((n,folder))
all_=cards+items;W=2000;x=y=row=0;cast={};ims={}
for k,c in all_:
    im=Image.open(S/c/fn(k)).convert('RGBA');ims[k]=im
    if x+im.width>W:x=0;y+=row+2;row=0
    cast[k]=dict(c=c,x=x,y=y,w=im.width,h=im.height);x+=im.width+2;row=max(row,im.height)
at=Image.new('RGBA',(W,y+row),(0,0,0,0))
for k,im in ims.items():at.paste(im,(cast[k]['x'],cast[k]['y']))
at.save(S/'dayrim-cast.webp',quality=86,method=6);json.dump(cast,open(S/'cast.json','w'),indent=1)
print('ok',len(cast),at.size,(S/'dayrim-cast.webp').stat().st_size//1024,'KB')
