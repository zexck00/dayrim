/* Full-body pixel character rig: every character is a small data record, drawn and animated in code. */
const C=o=>Object.assign({s:'#f0c8a0',h:'#3a2a20',hs:'short',hat:null,hc:'#333',t:'#556',t2:'#ddd',o:'shirt',b:'#39404e',f:'#20232c',m:null,w:null,cp:null},o);
const DARK='#6e4a30',TAN='#d2b486',BLK='#20222c',WHT='#eeeae0';
const SPECS={
Detective:C({hat:'fedora',hc:'#6b5540',o:'coat',t:TAN,t2:'#39404e',b:'#4a4238',w:'pistol'}),
Nurse:C({hs:'bun',h:'#6a4228',hat:'nurse',hc:WHT,t:'#6fd6d0',b:'#6fd6d0',f:WHT,w:'medkit'}),
'Beat Cop':C({s:DARK,hat:'police',hc:'#1f2f5e',t:'#2f55a0',o:'belt',t2:'#e8c95c',b:'#1f2f5e',w:'baton'}),
Reporter:C({hs:'long',h:'#6a4228',o:'coat',t:'#8a5a30',t2:'#3a3a44',b:'#3a3a44',w:'camera'}),
Doctor:C({o:'coat',t:WHT,t2:'#3a6a90',b:'#3a5a80',w:'book'}),
Boxer:C({s:'#c98a5e',hat:'hood',hc:'#d05a24',o:'open',t:'#d05a24',t2:'#c98a5e',b:WHT,f:'#a02020',w:'fist',wc:'#c8282a'}),
Priest:C({h:'#aaa',hs:'bald',o:'robe',t:'#1d1f28',t2:WHT,w:'book'}),
Mechanic:C({hs:'pony',h:'#7a5230',m:'goggles',o:'overalls',t:'#a8a48a',t2:'#6c705a',b:'#6c705a',w:'wrench'}),
SWAT:C({hat:'riot',hc:'#1b1e28',o:'vest',t:'#262c3a',t2:'#141720',b:'#262c3a',w:'shield'}),
Judge:C({hs:'long',h:'#4a3020',o:'robe',t:'#17181f',t2:WHT,w:'gavel'}),
Paramedic:C({s:'#7a4e30',hs:'pony',h:'#20150e',o:'hivis',t:'#b6e02a',t2:'#c8ccc0',b:'#1f2a38',w:'medkit'}),
Athlete:C({hat:'band',hc:WHT,o:'stripe2',t:'#1f4aa8',t2:WHT,b:'#1f4aa8',f:WHT,w:'fist',wc:'#f0c8a0'}),
Baker:C({h:'#a04a30',hs:'bun',o:'apron',t:'#b09a70',t2:WHT,b:'#5a4a38',w:'pin'}),
Boss:C({hat:'fedora',hc:'#20222c',hb:'#c8282a',h:'#a01818',hs:'long',m:'shade',o:'coat',t:'#262833',t2:'#a01818',b:'#20222c',w:'cane'}),
Brute:C({hat:'flat',hc:'#3a3e48',m:'skull',o:'vest',t:'#d8d4c8',t2:'#3a3e48',b:'#3a3e48',f:'#7a4e30',w:'tommy'}),
Sister:C({hat:'hood',hc:'#30323c',o:'robe',t:'#30323c',t2:'#e8c95c',w:'flask',wc:'#7a3ab0'}),
Shadow:C({hat:'fedora',hc:'#7a5a30',m:'void',o:'coat',t:'#8a6a3a',t2:'#20222c',b:'#20222c',w:'pistol',s:'#15161e'}),
Scribe:C({h:'#606060',m:'glasses',o:'suit',t:'#1a1b24',t2:WHT,b:'#1a1b24',cp:'#b81e28',w:'book'}),
Chemist:C({hat:'flat',hc:'#3a3e48',o:'apron',t:'#c8c4b4',t2:'#6a4a30',b:'#3a3a44',f:'#6a4a30',w:'flask',wc:'#3ac85a'}),
Driver:C({hat:'cap',hc:'#2a2c3a',m:'bandana',mc:'#a01818',o:'vest',t:'#2a2c3a',t2:'#a01818',b:'#20222c',w:'hook'}),
Soldier:C({s:'#a87850',hat:'hood',hc:'#a01818',o:'belt',t:'#20222c',t2:'#e8b82a',b:'#20222c',w:'tommy'}),
Spy:C({h:'#6a4228',m:'domino',mc:'#20222c',o:'coat',t:TAN,t2:'#20222c',b:'#3a3a44',w:'candle'}),
Prelate:C({h:'#15161e',o:'sash',t:'#1a1b24',t2:'#7a3a8a',b:'#1a1b24',w:'knife'}),
Grandmaster:C({h:'#b0b0b0',o:'robe',t:'#20182c',t2:'#d9a22a',w:'book',wc:'#e8702a'}),
Executioner:C({hat:'hood',hc:'#15161e',m:'void',s:'#15161e',o:'shirt',t:'#d8d4c8',b:'#3a3e48',f:'#7a4e30',w:'cleaver'}),
Undertaker:C({hat:'top',hc:'#20222c',s:'#b8b8a8',m:'shade',o:'coat',t:'#4a5238',t2:'#20222c',b:'#20222c',w:'shovel'}),
Whisperer:C({hat:'fedora',hc:'#5f5a2c',o:'coat',t:'#8a7a4a',t2:'#20222c',b:'#20222c',w:'orb',wc:'#a050d8'}),
Smuggler:C({h:'#4a3020',o:'coat',t:'#3f4a38',t2:'#6a4a30',b:'#2c3a5a',w:'pistol'}),
Apothecary:C({hat:'bowler',hc:'#20222c',m:'goggles',mc:'#3ac85a',o:'apron',t:'#c8c4b4',t2:'#6a4a30',b:'#3a3a44',w:'flask',wc:'#3ac85a'}),
Silencer:C({s:'#7a5a40',hat:'hood',hc:'#20222c',m:'skull',o:'coat',t:'#20222c',t2:'#15161e',b:'#15161e',w:'knife'}),
Medium:C({hs:'bob',h:'#15161e',hat:'band',hc:'#4a4a5a',o:'dress',t:'#20222c',t2:'#8a8a9a',w:'orb',wc:'#a050d8'}),
Usurer:C({h:'#b0b0b0',hs:'bald',m:'glasses',o:'suit',t:'#20222c',t2:WHT,b:'#20222c',w:'money'}),
Initiate:C({h:'#4a3020',hat:'band',hc:'#3a3e48',o:'open',t:'#20222c',t2:WHT,b:'#2c3f7a',w:'knife'}),
/* heroes from the update sheets */
Vigilante:C({hat:'hood',hc:'#20222c',m:'bandana',mc:'#15161e',o:'hoodie',t:'#2a2c36',t2:'#343744',b:'#23252f',f:'#2c2e38',w:'hook'}),
Guardian:C({hat:'helm',hc:'#30323c',o:'vest',t:'#3a3c48',t2:'#d9a22a',b:'#30323c',f:'#d9a22a',w:'shield',wc:'#d9a22a'}),
Ranger:C({hat:'hood',hc:'#2f5a30',m:'shade',cp:'#2f5a30',o:'belt',t:'#4a4e44',t2:'#6a4a2a',b:'#44483f',f:'#6a4a2a',w:'bow'}),
Inventor:C({h:'#5a3a20',m:'goggles',mc:'#3ac85a',o:'coat',t:'#6a4a2a',t2:'#7a8a70',b:'#2c3a5a',w:'blaster'}),
Firefighter:C({hat:'fire',hc:'#2a2a30',o:'hivis',t:'#3a3428',t2:'#e8d84a',b:'#3a3428',f:'#e8b82a',w:'axe'}),
'Hero Shadow':C({s:'#7a5a40',hat:'hood',hc:'#2a2420',m:'bandana',mc:'#1a1614',o:'belt',t:'#2a2420',t2:'#4a2a28',b:'#241e1a',cp:'#3a2422',w:'knife'}),
Prodigy:C({h:'#6a4228',hat:'band',hc:'#4a2a7a',o:'open',t:'#3a2448',t2:'#5a3090',b:'#2a2c3a',f:'#d8d4c8',w:'bat'}),
Sage:C({h:'#a8a8a8',m:'glasses',o:'coat',t:'#3a3a30',t2:'#7a4a20',b:'#2a2a24',w:'book',wc:'#a050d8'}),
Patriot:C({hat:'hood',hc:'#2f55c8',m:'domino',mc:'#c82a2a',o:'stripes',t:'#2f55c8',t2:WHT,b:'#2f55c8',f:'#c82a2a',w:'fist',wc:'#c8282a'}),
Phantom:C({s:'#2a6a50',hat:'hood',hc:'#2a5a48',m:'void',o:'robe',t:'#2f6a54',t2:'#6fe0a0',w:'orb',wc:'#6fe0a0'}),
Pyromancer:C({s:'#15161e',hat:'hood',hc:'#7a2a1a',m:'void',o:'robe',t:'#3a2a24',t2:'#d9702a',w:'orb',wc:'#ff8a2a'}),
Chronomancer:C({h:'#6a4228',m:'goggles',mc:'#3ac85a',o:'coat',t:'#20222c',t2:'#6a4a2a',b:'#20222c',w:'orb',wc:'#6fd6ff'}),
Beastmaster:C({s:'#c49068',h:'#5a3a20',hs:'long',o:'open',t:'#9a9080',t2:'#c49068',b:'#4a4a44',f:'#6a4a2a',w:'spear'}),
Voidwalker:C({s:'#10101c',hat:'hood',hc:'#2a2a38',m:'void',o:'robe',t:'#14142a',t2:'#6a4ad8',w:'orb',wc:'#a050d8'}),
Exorcist:C({h:'#909090',o:'robe',t:'#20222c',t2:WHT,w:'censer'}),
'Gravity Mage':C({h:'#5a3a20',cp:'#4a2a7a',o:'belt',t:'#2a2438',t2:'#7a4ad8',b:'#2a2438',f:'#6a3aa8',w:'orb',wc:'#a050d8'}),
Druid:C({hat:'antler',hc:'#3a5a28',o:'belt',t:'#3a6a2a',t2:'#6a4a2a',b:'#5a4028',f:'#5a4028',w:'herb'}),
Cyborg:C({m:'goggles',mc:'#6fd6ff',o:'vest',t:'#6a7078',t2:'#3a4048',b:'#5a6068',f:'#3a4048',w:'fist',wc:'#9aa4ae'}),
Illusionist:C({hat:'top',hc:'#20222c',o:'suit',t:'#20222c',t2:'#a01818',b:'#20222c',cp:'#a01818',w:'cards'}),
/* villains from the update sheets */
Necromancer:C({s:'#15201c',hat:'hood',hc:'#20242a',m:'void',mc:'#3ae890',o:'robe',t:'#20302a',t2:'#3a6a4a',w:'staff',wc:'#6fe0a0'}),
'Blood Reaper':C({s:'#15161e',hat:'hood',hc:'#6a1c24',m:'void',o:'vest',t:'#44464e',t2:'#7a1c28',b:'#44464e',f:'#30323a',w:'scythe'}),
'Toxin Alchemist':C({h:'#6a4228',m:'goggles',mc:'#3ac85a',o:'belt',t:'#5a6038',t2:'#6a4a2a',b:'#4a4438',f:'#6a4a2a',cp:'#6a7040',w:'flask',wc:'#3ac85a'}),
'Soul Stealer':C({s:'#15161e',hat:'hood',hc:'#4a3058',m:'void',o:'robe',t:'#4a3058',t2:'#a050d8',w:'candle'}),
'Shadow Monarch':C({s:'#b8bcc8',h:'#30323c',o:'suit',t:'#1a1b24',t2:'#a01818',b:'#1a1b24',cp:'#a01818',w:'sword',wc:'#7a3ab0'}),
Puppeteer:C({hat:'top',hc:'#30323c',hb:'#7a3a8a',o:'coat',t:'#2a2228',t2:'#7a3a8a',b:'#20222c',w:'orb',wc:'#a050d8'}),
'Void Empress':C({h:'#4a3020',hs:'long',hat:'crown',hc:'#40404e',o:'dress',t:'#2a2438',t2:'#a050d8',f:'#20222c',w:'orb',wc:'#a050d8'}),
'Plague Doctor':C({hat:'top',hc:'#2a2a30',m:'beak',o:'coat',t:'#3a3830',t2:'#20222c',b:'#2a2a24',f:'#5a4028',w:'medkit'}),
'Mad Scientist':C({h:'#d8dce0',hs:'wild',m:'goggles',mc:'#6fd6ff',o:'coat',t:WHT,t2:'#40404e',b:'#30323c',w:'blaster'}),
'Demon Knight':C({hat:'horn',hc:'#30323c',o:'vest',t:'#30323c',t2:'#d9702a',b:'#30323c',f:'#d9702a',w:'sword',wc:'#ff8a2a'}),
'Gravity Weaver':C({s:'#15161e',hat:'hood',hc:'#3a2a50',m:'void',o:'robe',t:'#3a2a50',t2:'#7a4ad8',w:'orb',wc:'#a050d8'}),
'Mecha Tyrant':C({s:'#8a8f98',hs:'bald',h:'#6a7078',m:'shade',mc:'#ff2020',o:'vest',t:'#5a5e66',t2:'#7a3a30',b:'#5a5e66',f:'#3a3e46',w:'fist',wc:'#9aa4ae'}),
'Chrono Thief':C({h:'#5a3a20',m:'bandana',mc:'#20222c',o:'belt',t:'#2a2c36',t2:'#c8a030',b:'#2a2c36',f:'#6a4a2a',w:'pistol'}),
'Swarm Queen':C({s:'#8a5a30',h:'#6a4220',hs:'bald',hat:'crown',hc:'#e8c02a',o:'stripes',t:'#8a5a30',t2:'#c8b040',b:'#6a4220',f:'#4a3018',cp:'#c8c0a0',w:'orb',wc:'#b6e02a'}),
'Ice Archmage':C({s:'#c8d8e8',hat:'hood',hc:'#5a8ac0',o:'robe',t:'#6a9ad0',t2:'#d8ecff',w:'staff',wc:'#a8e8ff'}),
'Deep Siren':C({s:'#3aa890',h:'#1a4a50',hs:'long',o:'robe',t:'#2a7a78',t2:'#c060a0',w:'trident'}),
'Ash Shaman':C({s:'#d8d0c0',hat:'horn',hc:'#3a2a24',m:'skull',o:'belt',t:'#6a3a28',t2:'#a02a20',b:'#3a3028',f:'#6a4a2a',w:'censer'}),
'Soul Forger':C({hat:'helm',hc:'#30323c',o:'vest',t:'#30323c',t2:'#e8892a',b:'#30323c',f:'#e8892a',w:'hammer'}),
'Mirror Jester':C({s:'#e8e4d8',hat:'jester',hc:'#a02a70',m:'domino',mc:'#a01818',o:'stripes',t:'#20222c',t2:'#a02a70',b:'#20222c',f:'#a02a70',w:'knife'}),
'Cyber Priest':C({s:'#10121a',hat:'hood',hc:'#22242e',m:'void',mc:'#a050d8',o:'robe',t:'#22242e',t2:'#6fe0d8',w:'medkit'}),
/* villain minions: weak ones, then the strong ones drawn larger */
Skeleton:C({s:'#e4dcc4',h:'#e4dcc4',hs:'bald',m:'skull',o:'ribs',t:'#2a2a32',t2:'#e4dcc4',b:'#d8d0b8',f:'#a8a090',w:'sword',wc:'#a8b0b8'}),
'Bone Goliath':C({s:'#e4dcc4',h:'#e4dcc4',hs:'bald',hat:'horn',hc:'#bdb59c',m:'skull',o:'ribs',t:'#30302e',t2:'#e4dcc4',b:'#d8d0b8',f:'#6a6458',w:'hammer'}),
Voidling:C({s:'#14142a',hat:'hood',hc:'#2a2048',m:'void',o:'robe',t:'#2a2048',t2:'#a050d8',w:'knife'}),
'Void Goliath':C({s:'#14142a',hs:'bald',h:'#14142a',hat:'horn',hc:'#3a2a58',m:'void',o:'vest',t:'#2a2048',t2:'#7a4ad8',b:'#20183a',f:'#a050d8',w:'fist',wc:'#a050d8'}),
'Toxin Grunt':C({s:'#5a6038',hat:'hood',hc:'#8aa83a',m:'goggles',mc:'#3ac85a',o:'hivis',t:'#6a8a2a',t2:'#d8e84a',b:'#4a5a28',f:'#2a3018',w:'flask',wc:'#8cf046'}),
'Toxin Enforcer':C({s:'#5a6038',hat:'helm',hc:'#4a5a28',o:'vest',t:'#5a7028',t2:'#b6e02a',b:'#3a4a20',f:'#b6e02a',cp:'#3a4a20',w:'cleaver'}),
/* city people */
Clerk:C({o:'suit',t:'#c8d8ea',t2:'#20305a',b:'#4a4c56'}),Busker:C({hat:'beanie',hc:'#3a3e48',hs:'long',h:'#7a5230',t:'#59603c',b:'#3a5a80'}),
Sweeper:C({s:DARK,hat:'cap',hc:'#5ab020',o:'hivis',t:'#b6e02a',t2:'#c8ccc0',b:'#2f7040'}),Mail:C({s:DARK,hat:'police',hc:'#2c3f7a',t:'#2f55a0',b:'#2f55a0'}),
Tourist:C({hat:'ranger',hc:'#c8b88a',o:'stripes',t:'#d04a30',t2:'#e8c95c',b:'#c0ac78'}),Patron:C({hs:'long',h:'#4a3020',o:'coat',t:'#b09a70',t2:'#4a7a8a',b:'#6a2a3a'}),
Gardener:C({hat:'ranger',hc:'#c8b88a',o:'overalls',t:'#c8c4b4',t2:'#3a6a9a',b:'#3a6a9a'}),Builder:C({hat:'hard',hc:'#e8c02a',hs:'bun',o:'vest',t:'#30323c',t2:'#e8892a',b:'#3a5a80'}),
Shopper:C({hs:'long',h:'#7a5230',t:'#8a2a4a',b:'#4a6a9a'}),Plumber:C({hat:'cap',hc:'#3a5a7a',t:'#3f5a78',b:'#8a7040'}),
Commuter:C({h:'#606060',o:'coat',t:TAN,t2:'#20222c',b:'#3a3a44'}),Barista:C({hs:'bun',h:'#6a4228',o:'apron',t:WHT,t2:'#30323c',b:'#30323c'}),
Elder:C({h:'#c8c8c8',hs:'bun',t:'#8a5a70',t2:'#c8b0d0',b:'#6a4a5a'}),Janitor:C({o:'overalls',t:'#c8d0d8',t2:'#3a6a9a',b:'#3a6a9a'}),
Chef:C({hat:'chef',hc:WHT,t:WHT,b:'#30323c'}),Guard:C({s:DARK,hat:'police',hc:'#1b2040',t:'#1f2a48',b:'#1b2040'}),
Carpenter:C({h:'#7a4a28',o:'stripes',t:'#a02a2a',t2:'#30323c',b:'#3a4a5a'}),Singer:C({hat:'beanie',hc:'#3a3e48',hs:'long',t:'#30323c',b:'#30323c'}),
Fisher:C({hat:'ranger',hc:'#7a7a4a',o:'vest',t:'#4a6a4a',t2:'#7a7a50',b:'#5a5a48'}),Oldman:C({hat:'flat',hc:'#5a5a38',h:'#c8c8c8',o:'coat',t:'#6a5a38',t2:'#3a3a30',b:'#4a4438'})
};
const NPC_NAMES=['Clerk','Busker','Sweeper','Mail','Tourist','Patron','Gardener','Builder','Shopper','Plumber','Commuter','Barista','Elder','Janitor','Chef','Guard','Carpenter','Singer','Fisher','Oldman'];
const RANGED_W=new Set(['pistol','tommy','blaster','camera','book','flask','orb','candle','torch','medkit','money','bow','cards','herb','censer','staff']);
function drawWeaponSprite(g,id,hx,hy,a,wc,skin){
  const P=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
  const L=(x,y,a,len,w,c)=>{g.fillStyle=c;for(let i=0;i<=len;i++)g.fillRect(Math.round(x+Math.cos(a)*i-w/2),Math.round(y+Math.sin(a)*i-w/2),w,w);return[x+Math.cos(a)*len,y+Math.sin(a)*len]};
    switch(id){

     case'baton':L(hx,hy,a,12,2,'#15161e');break;
     case'bat':L(hx,hy,a,8,2,'#b08850');{const e=[hx+Math.cos(a)*8,hy+Math.sin(a)*8];L(e[0],e[1],a,7,3,'#c8a060')}break;
     case'axe':{const e=L(hx,hy,a,13,2,'#7a5230');L(e[0],e[1],a+Math.PI/2,4,4,'#c8282a');L(e[0],e[1],a-Math.PI/2,1,3,'#d8d8d8')}break;
     case'wrench':{const e=L(hx,hy,a,10,2,'#b8c0c8');L(e[0],e[1],a+.7,3,2,'#b8c0c8');L(e[0],e[1],a-.7,3,2,'#b8c0c8')}break;
     case'pistol':L(hx,hy-1,a,6,2,'#30323c');P(hx-1,hy,2,3,'#5a4020');break;
     case'tommy':L(hx,hy,a,12,3,'#30323c');L(hx,hy,a+Math.PI,5,3,'#7a5230');P(hx+Math.cos(a)*5-1,hy+2,3,4,'#20222c');break;
     case'blaster':L(hx,hy,a,10,4,'#9aa4ae');{const e=[hx+Math.cos(a)*11,hy+Math.sin(a)*11];P(e[0]-1,e[1]-1,3,3,'#6fd6ff')}break;
     case'knife':L(hx,hy,a,8,2,'#d8e0e8');P(hx-1,hy-1,3,3,'#c8a030');break;
     case'gavel':{const e=L(hx,hy,a,8,2,'#7a5230');L(e[0],e[1],a+Math.PI/2,3,4,'#6a4220');L(e[0],e[1],a-Math.PI/2,3,4,'#6a4220')}break;
     case'book':P(hx-1,hy-3,6,7,'#6a3a20');P(hx,hy-2,4,5,'#e8e0c8');if(wc)P(hx,hy-7,4,4,wc);break;
     case'shield':P(hx-1,hy-11,7,17,'#3a4250');P(hx,hy-8,5,4,'#8fb0c8');break;
     case'flask':P(hx,hy-6,2,3,'#c8d8e8');P(hx-2,hy-3,6,6,wc||'#3ac85a');break;
     case'pin':L(hx,hy,a,7,3,'#c89860');L(hx,hy,a+Math.PI,7,3,'#c89860');break;
     case'cane':{const e=L(hx,hy,a,13,1,'#7a5230');P(e[0]-1,e[1]-1,3,3,'#e8b82a')}break;
     case'shovel':{const e=L(hx,hy,a,13,2,'#7a5230');L(e[0],e[1],a,4,5,'#8a8f98')}break;
     case'cleaver':L(hx,hy,a,3,2,'#5a4020');{const e=[hx+Math.cos(a)*3,hy+Math.sin(a)*3];L(e[0],e[1],a,7,6,'#c8d0d8')}break;
     case'fist':P(hx-2,hy-2,5,5,wc||skin);break;
     case'medkit':P(hx-3,hy,8,6,WHT);P(hx,hy+1,2,4,'#c8282a');P(hx-1,hy+2,4,2,'#c8282a');break;
     case'torch':L(hx,hy,a,6,3,'#20222c');{const e=[hx+Math.cos(a)*7,hy+Math.sin(a)*7];P(e[0]-1,e[1]-1,3,3,'#fff0a0')}break;
     case'orb':P(hx-2,hy-6,6,6,wc||'#a050d8');P(hx-1,hy-5,2,2,WHT);break;
     case'hook':{const e=L(hx,hy,a,10,2,'#8a8f98');L(e[0],e[1],a+1.4,4,2,'#8a8f98')}break;
     case'camera':P(hx-2,hy-3,7,5,'#20222c');P(hx,hy-2,3,3,'#6f8fb0');break;
     case'candle':P(hx-1,hy-5,3,6,'#f0ead0');P(hx-1,hy-8,3,3,'#ffb030');break;
     case'scythe':{const e=L(hx,hy,a,17,1,'#6a4a2a');L(hx,hy,a+Math.PI,4,1,'#6a4a2a');L(e[0],e[1],a+1.9,7,2,'#c8ccd4');L(e[0]+Math.cos(a+1.9)*7,e[1]+Math.sin(a+1.9)*7,a+2.5,4,1,'#c8ccd4')}break;
     case'sword':{L(hx,hy,a,3,2,'#c8a030');const e=[hx+Math.cos(a)*3,hy+Math.sin(a)*3];L(e[0],e[1],a,12,2,wc||'#d8e0e8');L(e[0],e[1],a+Math.PI/2,2,2,'#c8a030');L(e[0],e[1],a-Math.PI/2,2,2,'#c8a030')}break;
     case'hammer':{const e=L(hx,hy,a,12,2,'#5a4028');L(e[0],e[1],a+Math.PI/2,4,6,'#50525c');L(e[0],e[1],a-Math.PI/2,4,6,'#50525c')}break;
     case'trident':{const e=L(hx,hy,a,17,1,'#a8c0c8');L(e[0],e[1],a+.5,5,1,'#a8c0c8');L(e[0],e[1],a-.5,5,1,'#a8c0c8');L(e[0],e[1],a,5,1,'#d8e8f0')}break;
     case'staff':{L(hx,hy+5,-Math.PI/2,16,1,'#6a4a2a');P(hx-2,hy-14,5,5,wc||'#6fe0a0');P(hx-1,hy-13,2,2,WHT)}break;
     case'bow':{const c='#8a5a30';L(hx,hy-1,a-1.1,8,1,c);L(hx,hy+1,a+1.1,8,1,c);const u=[hx+Math.cos(a-1.1)*8,hy+Math.sin(a-1.1)*8],d=[hx+Math.cos(a+1.1)*8,hy+Math.sin(a+1.1)*8];L(u[0],u[1],Math.atan2(d[1]-u[1],d[0]-u[0]),Math.hypot(d[0]-u[0],d[1]-u[1]),1,'#e8e4d8');break}
     case'spear':{const e=L(hx,hy,a,16,1,'#7a5230');L(hx,hy,a+Math.PI,5,1,'#7a5230');L(e[0],e[1],a,5,3,'#c8d0d8')}break;
     case'censer':{L(hx,hy,Math.PI/2,6,1,'#c8a030');P(hx-2,hy+6,5,5,'#e8b82a');P(hx-1,hy+4,3,1,'#fff0a0')}break;
     case'herb':P(hx-2,hy-6,5,6,'#6fe05a');P(hx-1,hy-5,2,2,'#d8ffb8');break;
     case'cards':P(hx-1,hy-6,5,7,WHT);P(hx,hy-5,2,2,'#c8282a');P(hx+3,hy-5,4,7,'#eeeae0');break;
     case'money':P(hx-3,hy-1,7,7,'#9a7a4a');P(hx-1,hy-2,3,2,'#6a4a2a');break;
    }
}
function buildFrame(sp,dir,anim,f){
  const cv=document.createElement('canvas');cv.width=cv.height=48;const g=cv.getContext('2d');
  const P=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
  const L=(x,y,a,len,w,c)=>{g.fillStyle=c;for(let i=0;i<=len;i++)g.fillRect(Math.round(x+Math.cos(a)*i-w/2),Math.round(y+Math.sin(a)*i-w/2),w,w);return[x+Math.cos(a)*len,y+Math.sin(a)*len]};
  const ranged=RANGED_W.has(sp.w);
  let by=0,lean=0,lDx=0,rDx=0,lUp=0,rUp=0,aF=Math.PI/2+.08,aB=Math.PI/2-.08,tuck=false,glint=false;
  /* Walk and run are sampled from one smooth stride cycle; run has a longer stride, higher knees, a deeper bounce and a forward lean. */
  if(anim==='walk'||anim==='run'){const run=anim==='run',ph=f/WALK_N*TAU,sw=Math.cos(ph),up=Math.sin(ph),stride=run?6:4,lift=run?3:2,arm=run?.95:.55;
    by=Math.abs(up)>.5?(run?-2:-1):0;if(run&&dir===2)lean=2;
    if(dir===2){lDx=stride*sw;rDx=-stride*sw;lUp=Math.round(Math.max(0,-up)*lift);rUp=Math.round(Math.max(0,up)*lift)}else{lUp=Math.round(Math.max(0,up)*(lift+1));rUp=Math.round(Math.max(0,-up)*(lift+1))}
    aF=Math.PI/2+arm*sw;aB=Math.PI/2-arm*sw}
  else if(anim==='idle'){by=f?1:0}
  /* Attack: wind-up, swing, impact, follow-through, recover */
  else if(anim==='attack'){lean=[-2,-1,2,2,1][f];lDx=[2,3,4,3,2][f];rDx=-lDx;
    if(sp.w==='fist')aF=[2.8,2.6,-.05,.25,.9][f];else if(ranged||sp.w==='shield')aF=[.7,.5,-.05,.08,.4][f];else aF=[-2.6,-2.3,-.5,.75,1.1][f];aB=Math.PI/2+.5}
  else if(anim==='pickup'){if(f<2){by=6;aF=1.2;aB=1.9;lDx=2;rDx=-2}else{aF=-1.45;aB=Math.PI/2;glint=true}}
  else if(anim==='hit'){lean=-2;aF=-.6;aB=-2.5;lDx=2;rDx=-2}
  else if(anim==='dodge'){by=7;tuck=true;aF=.6;aB=.9}
  else if(anim==='ko'){aF=.4;aB=2.7;lDx=3;rDx=-3}
  else if(anim==='guard'){aF=-.15;aB=-.25;by=1;lDx=3;rDx=-3}
  else if(anim==='cast'){aF=-1.25;aB=-1.9;by=f?-1:0;glint=!!f}
  const hipY=27+by,headY=5+by,bx=24+lean;
  const skin=sp.s,leg=(hx,dx,up,col)=>{const fx=hx+dx,fy=41-up;const a=Math.atan2(fy-hipY,fx-hx),len=Math.hypot(fx-hx,fy-hipY);L(hx,hipY,a,len,4,col);const tw=dir===2?6:5;P(dir===2?fx-1:fx-2,fy,tw,3,sp.f)};
  const longBody=sp.o==='robe'||sp.o==='dress';
  const legs=()=>{ if(tuck){P(bx-5,hipY,10,6,sp.b);P(bx-6,hipY+5,4,2,sp.f);P(bx+2,hipY+5,4,2,sp.f);return}
    const c=sp.b||sp.t,ll=dir===2?bx:bx-3.5,rl=dir===2?bx:bx+3.5;
    if(longBody&&sp.o==='robe'){P(bx-6,hipY,13,14-by,sp.t);P(bx-5+lDx*.3,41,4,3,sp.f);P(bx+2+rDx*.3,41,4,3,sp.f);if(sp.t2&&dir!==1)P(bx-1,hipY,3,14-by,sp.t2===WHT?sp.t:sp.t2);return}
    if(dir===2){leg(rl,rDx,rUp,shade(c));leg(ll,lDx,lUp,c)}else{leg(ll,lDx,lUp,c);leg(rl,rDx,rUp,c)}
    if(sp.o==='dress'){P(bx-6,hipY,13,9,sp.t)}};
  const torso=()=>{const w=dir===2?11:13,x=bx-(dir===2?5:6),y=16+by,h=11;P(x,y,w,h,sp.t);
    const front=dir!==1,mid=bx-1;
    switch(sp.o){
     case'coat':P(x-(dir===2?0:1),y+4,w+(dir===2?0:2),h+3,sp.t);if(front){P(mid,y,3,10,sp.t2);P(mid+1,y+1,1,7,BLK)}break;
     case'hoodie':if(front){P(x+2,y+6,w-4,4,sp.t2);P(mid,y,1,4,WHT);P(mid+2,y,1,4,WHT)}break;
     case'open':if(front){P(mid-1,y,5,11,sp.t2)}break;
     case'vest':if(front){P(x+1,y+1,w-2,9,sp.t2)}else P(x+1,y+1,w-2,9,sp.t2);break;
     case'hivis':P(x,y+3,w,2,sp.t2);P(x,y+7,w,2,sp.t2);if(hipY)P(bx-5,hipY+7,11,2,sp.t2);break;
     case'belt':P(x,y+9,w,2,sp.t2===WHT?BLK:'#20222c');if(front)P(mid,y+9,2,2,sp.t2);if(front)P(mid-3,y+2,2,2,sp.t2);break;
     case'ribs':if(front){P(mid,y,2,h,sp.t2);for(let i=1;i<h-2;i+=3)P(x+1,y+i,w-2,1,sp.t2)}else P(mid,y,2,h,sp.t2);break;
     case'stripes':for(let i=0;i<h;i+=3)P(x,y+i,w,1,sp.t2);if(front)P(x+2,y,w-4,3,'#2c3f7a');break;
     case'stripe2':if(front){P(mid,y,2,11,sp.t2)}P(x,y,1,11,sp.t2);P(x+w-1,y,1,11,sp.t2);break;
     case'overalls':P(x+1,y+4,w-2,7,sp.t2);if(front){P(x+1,y,2,4,sp.t2);P(x+w-3,y,2,4,sp.t2)}else{P(x+1,y,2,4,sp.t2);P(x+w-3,y,2,4,sp.t2)}break;
     case'apron':if(front){P(x+2,y+2,w-4,9,sp.t2);P(bx-3,hipY,7,6,sp.t2)}break;
     case'suit':if(front){P(mid,y,3,6,sp.t2);P(mid+1,y+1,1,5,'#a01818')}break;
     case'sash':if(front)for(let i=0;i<9;i++)P(x+1+i,y+1+i,2,2,sp.t2);break;
     case'robe':if(front){P(mid,y,3,3,sp.t2);if(sp.t2!==WHT)P(mid,y,3,11,sp.t2)}break;
     case'dress':if(front)for(let i=0;i<4;i++)P(mid-1+(i%2?3:0),y+i*2,1,1,sp.t2);break;
     default:if(front)P(mid,y,3,2,skin);
    }
    if(sp.pack&&dir!==0)P(dir===2?x-3:x+1,y+1,dir===2?4:9,8,sp.pack)};
  const head=()=>{const hx=bx-5+(dir===2?1:0),y=headY;
    P(hx,y,11,11,skin);P(hx+3,y+11,5,1,shade(skin));
    const c=sp.h;
    if(dir===1){ if(sp.hs!=='bald')P(hx,y,11,sp.hs==='long'?13:9,c);else P(hx,y,11,4,c)}
    else{
      if(sp.hs==='bald'){P(hx,y,11,1,c);P(hx,y+1,1,5,c);P(hx+10,y+1,1,5,c)}
      else{P(hx,y,11,3,c);
        if(dir===2){P(hx,y,4,8,c);if(sp.hs==='long')P(hx-1,y+3,4,13,c);if(sp.hs==='bob')P(hx-1,y+3,4,8,c)}
        else{P(hx,y+3,2,sp.hs==='long'?10:sp.hs==='bob'?7:3,c);P(hx+9,y+3,2,sp.hs==='long'?10:sp.hs==='bob'?7:3,c)}
        if(sp.hs==='wild'){P(hx-3,y-2,17,4,c);P(hx-3,y+1,3,5,c);P(hx+11,y+1,3,5,c);P(hx+1,y-4,3,2,c);P(hx+7,y-4,3,2,c)}
        if(sp.hs==='bun')P(hx+3,y-3,5,3,c);
        if(sp.hs==='pony')P(dir===2?hx-2:hx+9,y+2,3,8,c)}
      const ex=dir===2?[hx+7]:[hx+2,hx+7],ey=y+5;
      ex.forEach(e=>{P(e,ey,2,2,'#151520')});
      if(sp.hat!=='hood'&&sp.m!=='skull'&&sp.m!=='void'&&sp.m!=='bandana')P(dir===2?hx+7:hx+4,y+8,3,1,shade(skin));
      const mc=sp.mc||'#15161e',mx=dir===2?hx+3:hx+1,mw=dir===2?8:9;
      if(sp.m==='domino'){P(mx,ey-1,mw,3,mc);ex.forEach(e=>P(e,ey,2,1,WHT))}
      if(sp.m==='shade'){P(mx,ey-1,mw,3,'#101018')}
      if(sp.m==='glasses'){ex.forEach(e=>{P(e-1,ey-1,4,1,'#c8d8e8');P(e-1,ey+2,4,1,'#c8d8e8')})}
      if(sp.m==='goggles'){P(mx,ey-2,mw,2,'#5a4020');ex.forEach(e=>P(e-1,ey-1,4,3,sp.mc||'#6fd6ff'))}
      if(sp.m==='bandana'){P(mx,y+6,mw,5,mc)}
      if(sp.m==='skull'){P(mx,y+2,mw,9,'#e4dcc4');ex.forEach(e=>P(e,ey-1,2,3,'#151520'));P(mx+2,y+9,mw-4,1,'#151520')}
      if(sp.m==='beak'){P(mx,y+2,mw,5,'#3a3830');ex.forEach(e=>P(e,ey,2,2,'#3ac85a'));P(dir===2?hx+7:hx+3,y+6,dir===2?7:5,4,'#d8ccb0');if(dir===2)P(hx+13,y+7,2,2,'#c8bca0')}
      if(sp.m==='void'){P(mx,y+2,mw,9,'#101018');ex.forEach(e=>P(e,ey,2,1,'#a050d8'))}
    }
    const hc=sp.hc,sx=dir===2?1:0;
    switch(sp.hat){
     case'fedora':P(hx-2+sx,y+1,15,2,hc);P(hx+1,y-3,9,4,hc);if(sp.hb)P(hx+1,y-1,9,1,sp.hb);break;
     case'police':P(hx,y-2,11,4,hc);P(hx+(dir===2?4:0),y+2,dir===2?9:11,1,'#101018');if(dir!==1)P(hx+4,y-1,3,2,'#e8c95c');break;
     case'nurse':P(hx+1,y-2,9,3,hc);if(dir!==1)P(hx+4,y-2,3,1,'#c8282a');break;
     case'fire':P(hx-2,y+1,15,2,hc);P(hx,y-3,11,5,hc);if(dir!==1)P(hx+4,y-3,3,3,'#e8c95c');break;
     case'riot':P(hx-1,y-1,13,9,hc);if(dir!==1)P(hx+1,y+3,9,4,'#8fb0c8');break;
     case'ranger':P(hx-3+sx,y+1,17,2,hc);P(hx+1,y-3,9,4,hc);break;
     case'bowler':P(hx-1,y+1,13,2,hc);P(hx+1,y-3,9,4,hc);break;
     case'top':P(hx-2,y+1,15,2,hc);P(hx+1,y-5,9,6,hc);P(hx+1,y-1,9,1,'#6a5a4a');break;
     case'flat':P(hx-1,y-1,13,4,hc);if(dir===2)P(hx+9,y+2,4,1,hc);break;
     case'cap':P(hx,y-1,11,4,hc);if(dir===0)P(hx+1,y+3,9,1,hc);if(dir===2)P(hx+9,y+2,5,1,hc);break;
     case'band':P(hx,y+2,11,2,hc);break;
     case'beanie':P(hx,y-2,11,5,hc);break;
     case'hard':P(hx-1,y+1,13,2,hc);P(hx+1,y-2,9,4,hc);break;
     case'chef':P(hx,y-5,11,8,hc);break;
     case'horn':P(hx-1,y-2,13,dir===1?12:6,hc);P(hx-4,y-6,3,6,'#7a4a2a');P(hx+12,y-6,3,6,'#7a4a2a');P(hx-3,y-8,2,2,'#7a4a2a');P(hx+12,y-8,2,2,'#7a4a2a');break;
     case'crown':P(hx,y-2,11,3,hc);P(hx,y-5,2,3,hc);P(hx+4,y-6,3,4,hc);P(hx+9,y-5,2,3,hc);break;
     case'jester':P(hx-1,y-1,13,4,hc);P(hx-5,y-4,6,4,hc);P(hx+10,y-4,6,4,'#20222c');P(hx-6,y-1,2,2,'#e8c02a');P(hx+15,y-1,2,2,'#e8c02a');break;
     case'helm':P(hx-1,y-2,13,12,hc);if(dir!==1){P(hx+4,y-2,3,12,'#d9a22a');P(hx+1,y+5,9,2,'#101018')}break;
     case'antler':P(hx-3,y-5,2,5,'#6a4a2a');P(hx+12,y-5,2,5,'#6a4a2a');P(hx-5,y-4,3,1,'#6a4a2a');P(hx+13,y-4,3,1,'#6a4a2a');P(hx-1,y-1,13,dir===1?13:4,hc);if(dir!==1){P(hx-1,y+3,3,9,hc);P(hx+9,y+3,3,9,hc)}break;
     case'hood':P(hx-1,y-1,13,dir===1?13:4,hc);if(dir!==1){P(hx-1,y+3,dir===2?5:3,9,hc);if(dir===0)P(hx+9,y+3,3,9,hc);else P(hx+10,y+2,2,2,hc)}break;
    }};

  const sh=dir===2?[bx+1,18+by]:[bx+8,18+by],sh2=dir===2?[bx-1,18+by]:[bx-8,18+by];
  const sleeve=sp.o==='shirt'&&(sp.t==='#d8d4c8')?sp.t:(sp.o==='open'?sp.t:(['vest','overalls'].includes(sp.o)&&sp.t)||sp.t);
  const armFar=()=>{const e=L(sh2[0],sh2[1],aB,8,4,sleeve);P(e[0]-1,e[1]-1,3,3,skin);if(sp.w==='fist')P(e[0]-2,e[1]-2,5,5,sp.wc||skin)};
  const armNear=()=>{const e=L(sh[0],sh[1],aF,9,4,sleeve);P(e[0]-1,e[1]-1,3,3,skin);if(sp.w)drawWeaponSprite(g,sp.w,e[0],e[1],aF,sp.wc,skin);if(glint){P(e[0]-3,e[1]-7,6,6,'#fff6c0');P(e[0]-1,e[1]-10,2,12,'#ffffff');P(e[0]-5,e[1]-5,10,2,'#ffffff')}};
  const cape=()=>{if(!sp.cp)return;if(dir===0)P(bx-7,17+by,15,20,sp.cp);else if(dir===2)P(bx-8,17+by,6,22,sp.cp)};
  if(dir===1){ if(sp.w&&false);armNear();armFar();legs();torso();if(sp.cp)P(bx-7,17+by,15,22,sp.cp);head() }
  else if(dir===2){cape();armFar();legs();torso();head();armNear()}
  else{cape();legs();torso();head();armFar();armNear()}
  // dark outline pass for a crisp pixel-art look
  const im=g.getImageData(0,0,48,48),d=im.data,o=new Uint8ClampedArray(d);
  for(let y=0;y<48;y++)for(let x=0;x<48;x++){const i=(y*48+x)*4;if(d[i+3])continue;
    if((x>0&&d[i-1])||(x<47&&d[i+7])||(y>0&&d[i-48*4+3])||(y<47&&d[i+48*4+3])){o[i]=13;o[i+1]=15;o[i+2]=24;o[i+3]=255}}
  for(let i=0;i<d.length;i++)d[i]=o[i];
  g.putImageData(im,0,0);
  return cv;
}
function shade(hex){if(hex.length!==7)return hex;const n=parseInt(hex.slice(1),16),f=.72,r=(n>>16)*f|0,g=((n>>8)&255)*f|0,b=(n&255)*f|0;return'#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}
/* Frame counts for the smooth cycles, and how game timers pick a frame. A stride is 4 units of walk. */
const WALK_N=8,ATTACK_N=5;
const walkFrame=w=>((Math.floor((w||0)*WALK_N/4)%WALK_N)+WALK_N)%WALK_N;
const attackFrame=q=>Math.max(0,Math.min(ATTACK_N-1,Math.floor(q*ATTACK_N)));
/* Enemies keep their own timers: a wind-up shows the first pose, the strike plays the rest. */
const ENEMY_STRIKE=.2,enemyAttackFrame=e=>e.wind>0?0:Math.min(ATTACK_N-1,1+Math.floor((1-Math.max(0,e.atkShow)/ENEMY_STRIKE)*(ATTACK_N-1)));
const FRAMES=new Map();
function frame(name,dir,anim,f,wpn){const k=name+'|'+dir+'|'+anim+'|'+f+'|'+(wpn||'');let c=FRAMES.get(k);if(!c){let sp=SPECS[name]||SPECS.Tourist;if(wpn){const rw=wpn==='fists'?'fist':wpn;sp=Object.assign({},sp,{w:rw,wc:sp.w===rw?sp.wc:undefined})}c=buildFrame(sp,dir,anim,f);FRAMES.set(k,c)}return c}
const dirOf=a=>{const c=Math.cos(a),s=Math.sin(a);return Math.abs(c)>=Math.abs(s)*.9?2:(s<0?1:0)};
const PS=1.6;
/* mo: smooth motion added while drawing, so it moves every frame instead of in pose steps.
   dx, dy: offset · rot: lean about the feet · sx, sy: squash and stretch about the feet. */
function blit(c2,name,x,y,dir,anim,f,flip,rot,alpha,wpn,size=1,mo){
  const im=frame(name,dir,anim,f,wpn);c2.save();c2.imageSmoothingEnabled=false;c2.translate(x,y);
  if(mo){c2.translate(mo.dx||0,mo.dy||0);if(mo.rot)c2.rotate(mo.rot);if(mo.sx||mo.sy)c2.scale(mo.sx||1,mo.sy||1)}
  if(size!==1)c2.scale(size,size);if(flip)c2.scale(-1,1);
  if(rot){c2.translate(0,-14*PS);c2.rotate(rot);c2.translate(0,14*PS)}
  if(alpha!==undefined)c2.globalAlpha=alpha;
  c2.drawImage(im,-24*PS,-45*PS,48*PS,48*PS);c2.restore();
}
