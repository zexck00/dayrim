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
/* Falcon EX (key Patriot): winged helm, glowing V visor, red falcon chest, red cape and scarf, wind gauntlets */
Patriot:C({hat:'falcon',hc:'#2f6ad8',m:'falcon',mc:'#6fe8ff',o:'falcon',t:'#2f55c8',t2:'#d82a2a',b:'#2f55c8',f:'#d82a2a',cp:'#b81e2a',w:'wind',wc:'#6fe8ff'}),
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
/* Frames are 64 px: full chibi bodies, about 2.5 heads tall, so faces have room for brows and details. */
const FS=64;
/* Long weapons are held upright between attacks, so the chibi silhouette reads clearly. */
const UPRIGHT_W=new Set(['sword','axe','bat','spear','trident','scythe','hammer','shovel','baton','knife','cleaver','gavel','wrench','pin','firestaff']);
/* Chunky, oversized weapons with a highlight edge. a: the arm's angle. atk: a strike frame. */
function drawWeaponSprite(g,id,hx,hy,a,wc,skin,atk){
 const P=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
 const L=(x,y,a,len,w,c)=>{g.fillStyle=c;for(let i=0;i<=len;i++)g.fillRect(Math.round(x+Math.cos(a)*i-w/2),Math.round(y+Math.sin(a)*i-w/2),w,w);return[x+Math.cos(a)*len,y+Math.sin(a)*len]};
 const H=(x,y,a,len,w,c,hi)=>{const e=L(x,y,a,len,w,c);if(hi&&w>1){const o=(w-1)/2;L(x+Math.cos(a-Math.PI/2)*o,y+Math.sin(a-Math.PI/2)*o,a,len,1,hi)}return e};
 const C=(cx,cy,r,c)=>{g.fillStyle=c;for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)if(x*x+y*y<=r*r+r*.6)g.fillRect(Math.round(cx+x),Math.round(cy+y),1,1)};
 const at=(p,d,ang)=>[p[0]+Math.cos(ang)*d,p[1]+Math.sin(ang)*d];
 if(UPRIGHT_W.has(id)&&!atk)a=a-2.75;
 const pa=a+Math.PI/2;
 switch(id){
  case'baton':H(hx,hy,a,17,3,'#15161e','#3a3e48');L(hx,hy,a+Math.PI,3,3,'#15161e');break;
  case'bat':{const e=H(hx,hy,a,9,3,'#b08850','#d0a870');H(e[0],e[1],a,11,5,'#c8a060','#ecd09a');L(hx,hy,a,3,4,'#30323c')}break;
  case'axe':{const e=H(hx,hy,a,19,3,'#7a5230','#9a7248'),b=at(e,-3,a);L(b[0],b[1],pa,6,7,'#c8282a');const s=at(b,7,pa);L(s[0]-Math.cos(a)*4,s[1]-Math.sin(a)*4,a,8,2,'#eef0f2');L(b[0],b[1],pa+Math.PI,2,4,'#8a1818')}break;
  case'wrench':{const e=H(hx,hy,a,14,3,'#b8c0c8','#e0e6ec');L(e[0],e[1],a+.7,4,3,'#b8c0c8');L(e[0],e[1],a-.7,4,3,'#b8c0c8')}break;
  case'pistol':{const b=at([hx,hy],1,pa+Math.PI);H(b[0],b[1],a,11,4,'#3a3e48','#6a7080');C(hx+Math.cos(a)*3,hy+Math.sin(a)*3,3,'#4a4e58');P(hx+Math.cos(a)*3,hy+Math.sin(a)*3,1,1,'#14141c');const gp=at([hx,hy],3,pa);L(hx,hy,pa,5,4,'#6a4426');P(gp[0],gp[1],1,2,'#8a5a36')}break;
  case'tommy':{H(hx,hy,a,17,4,'#30323c','#55586a');L(hx,hy,a+Math.PI,7,4,'#7a5230');C(hx+Math.cos(a)*6+Math.cos(pa)*4,hy+Math.sin(a)*6+Math.sin(pa)*4,3,'#20222c')}break;
  case'blaster':{const e=H(hx,hy,a,13,6,'#9aa4ae','#d8e0e8');for(let i=3;i<12;i+=3){const p=at([hx,hy],i,a);P(p[0]-1,p[1]-1,2,2,'#e8c02a')}const m=at(e,2,a);C(m[0],m[1],2,'#6fd6ff');P(m[0],m[1],1,1,'#ffffff')}break;
  case'knife':{L(hx,hy,a+Math.PI,3,3,'#3a2a20');L(hx,hy,pa,3,2,'#c8a030');L(hx,hy,pa+Math.PI,3,2,'#c8a030');H(hx,hy,a,12,3,'#d8e0e8','#ffffff')}break;
  case'gavel':{const e=H(hx,hy,a,12,3,'#7a5230','#9a7248');L(e[0],e[1],pa,4,6,'#6a4220');L(e[0],e[1],pa+Math.PI,4,6,'#6a4220')}break;
  case'book':P(hx-2,hy-5,10,11,'#6a3a20');P(hx-1,hy-4,8,9,'#8a4a28');P(hx+6,hy-4,1,9,'#e8e0c8');P(hx+2,hy-2,2,5,'#e8c040');P(hx+1,hy-1,4,2,'#e8c040');if(wc){C(hx+3,hy-10,2,wc);P(hx+3,hy-11,1,1,'#ffffff')}break;
  case'shield':{for(let i=0;i<24;i++){const w=Math.round(16*(1-Math.pow(i/24,1.7)));if(w<1)continue;P(hx-w/2-1,hy-10+i,w+2,1,wc||'#8fb0c8');if(w>3)P(hx-w/2+1,hy-10+i,w-2,1,wc?'#5a4028':'#3a4250')}P(hx-1,hy-8,2,18,wc||'#8fb0c8');P(hx-5,hy-3,10,2,wc||'#8fb0c8')}break;
  case'flask':{C(hx+1,hy+2,5,'#2a4a2a');C(hx+1,hy+2,4,wc||'#3ac85a');P(hx-1,hy+3,5,3,'#b8ffa0');P(hx-1,hy-6,4,4,'#d8e8e0');P(hx-1,hy-8,4,2,'#8a6a40');P(hx-2,hy-1,2,2,'#f0fff0');P(hx+1,hy-10,1,2,'#4a3a28');P(hx+1,hy-12,2,2,'#ffb030')}break;
  case'pin':H(hx,hy,a,9,4,'#c89860','#e8c090');L(hx,hy,a+Math.PI,9,4,'#c89860');break;
  case'cane':{const e=H(hx,hy,a,18,2,'#7a5230');C(e[0],e[1],2,'#e8b82a')}break;
  case'shovel':{const e=H(hx,hy,a,17,3,'#7a5230','#9a7248');H(e[0],e[1],a,6,7,'#8a8f98','#c8ccd4')}break;
  case'cleaver':{L(hx,hy,a,4,3,'#5a4020');const e=at([hx,hy],4,a);H(e[0],e[1],a,10,8,'#c8d0d8','#ffffff')}break;
  case'wind':P(hx-4,hy-4,9,9,'#2f55c8');P(hx-3,hy-3,7,7,'#d82a2a');P(hx-2,hy-2,5,5,wc||'#6fe8ff');P(hx-1,hy-1,2,2,'#ffffff');if(atk){P(hx+5,hy-1,4,1,'#c8f4ff');P(hx+4,hy-4,3,1,'#c8f4ff');P(hx+4,hy+3,3,1,'#c8f4ff')}break;
  case'fist':P(hx-3,hy-3,7,7,wc||skin);P(hx-3,hy-3,7,1,'rgba(255,255,255,.35)');break;
  case'medkit':P(hx-5,hy,12,9,WHT);P(hx-5,hy+7,12,2,'#c8c4b8');P(hx,hy+1,2,7,'#c8282a');P(hx-2,hy+3,6,3,'#c8282a');P(hx-1,hy-2,4,2,'#30323c');break;
  case'torch':{H(hx,hy,a,9,4,'#20222c','#4a4e58');const e=at([hx,hy],10,a);C(e[0],e[1],2,'#fff0a0')}break;
  case'orb':C(hx+1,hy-6,5,wc||'#a050d8');C(hx,hy-7,2,'rgba(255,255,255,.55)');P(hx-1,hy-9,2,2,'#ffffff');break;
  case'hook':{const e=H(hx,hy,a,13,2,'#8a8f98','#c8ccd4');[a+1.6,a-1.6,a].forEach(b=>{const p=L(e[0],e[1],b,4,2,'#8a8f98');L(p[0],p[1],b+(b>a?-1.2:b<a?1.2:0),2,2,'#8a8f98')});C(hx-2,hy+4,3,'#6a5a40');C(hx-2,hy+4,1,'#2a2420')}break;
  case'camera':P(hx-3,hy-4,11,8,'#20222c');C(hx+3,hy,3,'#4a6a8a');P(hx+2,hy-1,2,2,'#c8e0f0');P(hx+5,hy-6,3,2,'#e8e8e8');break;
  case'candle':P(hx-1,hy-8,4,9,'#f0ead0');P(hx-1,hy-8,1,9,'#ffffff');C(hx+1,hy-11,2,'#ffb030');P(hx+1,hy-12,1,2,'#fff4c0');break;
  case'scythe':{const e=H(hx,hy,a,24,2,'#3a2a24');L(hx,hy,a+Math.PI,5,2,'#3a2a24');let p=e,b=a+1.7;for(let i=0;i<12;i++){L(p[0],p[1],b,1,3,wc||'#c8ccd4');p=at(p,1.5,b);b+=.07}L(e[0],e[1],a+1.7,10,1,'#e8463f')}break;
  case'sword':{L(hx,hy,a+Math.PI,3,3,'#3a2a20');L(hx,hy,pa,4,3,'#c8a030');L(hx,hy,pa+Math.PI,4,3,'#c8a030');const dark=wc&&wc!=='#d8e0e8';const e=H(hx,hy,a,18,4,dark?'#2a2a34':'#d8e0e8',dark?wc:'#ffffff');if(dark)L(hx+Math.cos(pa)*1.5,hy+Math.sin(pa)*1.5,a,18,1,wc);L(e[0],e[1],a,2,2,dark?wc:'#d8e0e8')}break;
  case'glowsword':{L(hx,hy,a+Math.PI,3,3,'#5a3a20');L(hx,hy,pa,4,3,'#d9a22a');L(hx,hy,pa+Math.PI,4,3,'#d9a22a');H(hx,hy,a,19,4,'#ffe9a0','#ffffff')}break;
  case'hammer':{const e=H(hx,hy,a,16,3,'#5a4028','#7a5a3a');L(e[0],e[1],pa,5,8,'#50525c');L(e[0],e[1],pa+Math.PI,5,8,'#50525c');P(e[0]-1,e[1]-1,3,3,wc||'#e8892a')}break;
  case'trident':{const e=H(hx,hy,a,22,2,'#a8c0c8','#e0f0f4');L(e[0],e[1],a+.5,6,2,'#a8c0c8');L(e[0],e[1],a-.5,6,2,'#a8c0c8');L(e[0],e[1],a,7,2,'#d8e8f0')}break;
  case'staff':case'skullstaff':case'firestaff':{for(let i=0;i<28;i++)P(hx-1+Math.round(Math.sin(i*.6)*.6),hy+8-i,3,1,i%7===0?'#4a2e18':'#6a4a2a');const ty=hy-23;
   if(id==='skullstaff'){C(hx+1,ty,4,'#e4dcc4');P(hx-2,ty+2,7,3,'#d0c8b0');P(hx-1,ty-1,2,2,'#14141c');P(hx+2,ty-1,2,2,'#14141c');P(hx-1,ty-1,1,1,wc||'#6ff0a0');P(hx+3,ty-1,1,1,wc||'#6ff0a0');C(hx+1,ty-7,2,wc||'#6ff0a0');P(hx+1,ty-10,1,3,'#e0ffe8')}
   else if(id==='firestaff'){C(hx+1,ty,3,'#3a2a24');C(hx+1,ty-4,3,'#ff6a20');C(hx+1,ty-5,2,'#ffc040');P(hx+1,ty-8,1,2,'#fff0a0')}
   else{C(hx+1,ty,4,wc||'#6fe0a0');C(hx,ty-1,2,'rgba(255,255,255,.5)');P(hx-1,ty-2,2,2,'#ffffff');if(wc==='#a8e8ff'){P(hx,ty-9,3,6,'#d8f4ff');P(hx+1,ty-11,1,2,'#ffffff')}}}break;
  case'bow':{const c='#7a5634';for(let i=-14;i<=14;i++){const k=Math.cos(i/14*1.45),d=1+Math.round(5*k);const p=[hx+Math.cos(a)*d+Math.cos(pa)*i,hy+Math.sin(a)*d+Math.sin(pa)*i];P(p[0]-1,p[1]-1,3,2,c)}const u=at([hx,hy],14,pa),dn=at([hx,hy],-14,pa);L(u[0],u[1],Math.atan2(dn[1]-u[1],dn[0]-u[0]),Math.hypot(dn[0]-u[0],dn[1]-u[1]),1,'#e8e0cc');P(hx-1,hy-2,3,4,'#3a2a1a');if(atk){const t=at([hx,hy],-4,a);L(t[0],t[1],a,18,1,'#c8b890');const tip=at(t,18,a);P(tip[0]-1,tip[1]-1,3,3,'#a8b0b8')}}break;
  case'spear':{const e=H(hx,hy,a,22,2,'#7a5230','#9a7248');L(hx,hy,a+Math.PI,5,2,'#7a5230');H(e[0],e[1],a,7,4,'#c8d0d8','#ffffff')}break;
  case'censer':{L(hx,hy,Math.PI/2,7,1,'#c8a030');P(hx-3,hy+7,7,7,'#e8b82a');P(hx-2,hy+8,5,1,'#fff0a0');P(hx-1,hy+10,3,3,'#ff8a2a');P(hx-3,hy+14,7,1,'#a87a1a')}break;
  case'herb':C(hx,hy-6,4,'#3aa83a');C(hx,hy-7,3,'#6fe05a');P(hx-1,hy-9,2,2,'#d8ffb8');P(hx+3,hy-11,2,3,'#9cf07a');break;
  case'cards':[-5,0,5].forEach((o,i)=>{P(hx-3+o,hy-9+Math.abs(o)*.3,6,9,'#20222c');P(hx-2+o,hy-8+Math.abs(o)*.3,4,7,WHT);P(hx-1+o,hy-6+Math.abs(o)*.3,2,2,i===1?'#c8282a':'#20222c')});break;
  case'money':C(hx+1,hy+3,5,'#9a7a4a');P(hx-1,hy-3,5,2,'#6a4a2a');P(hx,hy+1,2,5,'#e8c040');P(hx-1,hy+2,4,1,'#e8c040');P(hx-1,hy+4,4,1,'#e8c040');break;
  /* visual-only weapons from the character cards */
  case'watch':L(hx,hy,Math.PI/2,4,1,'#e8c040');C(hx,hy+8,5,'#e8c040');C(hx,hy+8,4,'#f8f0d8');P(hx,hy+5,1,4,'#20222c');P(hx,hy+8,3,1,'#20222c');break;
  case'hourglass':P(hx-4,hy-10,9,2,'#c8a030');P(hx-4,hy+2,9,2,'#c8a030');for(let i=0;i<10;i++){const w=1+Math.abs(5-i)*1.4|0;P(hx-w/2,hy-8+i,w,1,'rgba(220,240,255,.85)')}P(hx-1,hy-3,1,4,'#f0c040');P(hx-2,hy,3,1,'#f0c040');break;
  case'blackhole':C(hx+1,hy-7,6,wc||'#a050d8');C(hx+1,hy-7,4,'#7a2ac0');C(hx+1,hy-7,3,'#08060e');P(hx-4,hy-8,2,1,'#e0c0ff');break;
  case'fire':C(hx+1,hy-5,4,'#d8402a');C(hx+1,hy-7,3,'#ff8a2a');C(hx+1,hy-8,2,'#ffd040');P(hx,hy-12,2,3,'#ffd040');P(hx+1,hy-14,1,2,'#fff4c0');break;
  case'holo':P(hx-1,hy-12,12,9,'rgba(111,224,216,.35)');P(hx-1,hy-12,12,1,'#6fe0d8');P(hx-1,hy-4,12,1,'#6fe0d8');P(hx-1,hy-12,1,9,'#6fe0d8');P(hx+10,hy-12,1,9,'#6fe0d8');[0,1,2].forEach(i=>P(hx+1,hy-10+i*2,6-i*2,1,'#b8fff8'));break;
  case'lantern':L(hx,hy,Math.PI/2,4,1,'#3a3a44');P(hx-3,hy+4,7,2,'#3a3a44');P(hx-3,hy+6,7,8,'#2a2430');P(hx-2,hy+7,5,6,'#d080ff');P(hx-1,hy+8,3,3,'#f4d8ff');P(hx-3,hy+14,7,2,'#3a3a44');break;
  case'strings':P(hx-7,hy-4,15,2,'#5a3a20');P(hx,hy-8,2,9,'#5a3a20');[-6,0,6].forEach(o=>L(hx+o+1,hy-2,Math.PI/2,16,1,'rgba(200,140,255,.8)'));break;
 }
}
/* Face and head design per character, studied from the select-menu cards.
   hair: style · ec: iris · br: brow slant (positive is angry, negative is worried) · bc: brow colour
   mo: mouth · fx: extras (stubble, beard, mustache, blush, ears, fur, quiver, collar, wings, star, paint, scar) */
const FACES={
 Detective:{hair:'short',ec:'#4a6a8a',br:.22,mo:'smirk',fx:['stubble','hatshade']},
 Vigilante:{ec:'#d8e0e8',br:.45,mo:'none'},
 Guardian:{},
 Ranger:{hair:'fringe',ec:'#5a7a3a',br:.35,mo:'flat'},
 Inventor:{hair:'messy',h:'#5a3a20',ec:'#3ac85a',br:.25,mo:'grin'},
 Firefighter:{hair:'short',h:'#3a2a20',ec:'#5a4a3a',br:.32,mo:'flat',fx:['stubble']},
 'Hero Shadow':{ec:'#c8a888',br:.45,mo:'none'},
 Prodigy:{hair:'spiky',h:'#6a4228',ec:'#6a4a2a',br:.3,mo:'smirk'},
 Sage:{hair:'slick',h:'#a8a8a8',ec:'#4a5a6a',br:.25,bc:'#7a7a7a',mo:'flat',fx:['mustache']},
 Patriot:{br:.4,bc:'#d82a2a'},
 Phantom:{},
 Pyromancer:{},
 Chronomancer:{hair:'slick',h:'#6a4228',ec:'#3ac85a',br:.15,mo:'flat'},
 Beastmaster:{hair:'long',h:'#5a3a20',ec:'#6a4a2a',br:.32,mo:'flat',fx:['beard','fur']},
 Voidwalker:{fx:['stars']},
 Exorcist:{hair:'slick',h:'#909090',ec:'#5a6a7a',br:.38,bc:'#5a5a5a',mo:'frown',fx:['beard']},
 'Gravity Mage':{hair:'messy',h:'#5a3a20',ec:'#8a5ae8',br:.12,mo:'smirk'},
 Druid:{ec:'#7ae05a',br:.1,mo:'flat'},
 Cyborg:{hair:'short',h:'#5a3a20',br:.3,mo:'flat'},
 Illusionist:{hair:'short',h:'#4a3020',ec:'#4a7ac8',br:-.15,mo:'grin',fx:['mustache']},
 Necromancer:{},
 'Blood Reaper':{},
 'Toxin Alchemist':{hair:'quiff',h:'#6a4228',br:.5,bc:'#4a2e1a'},
 'Soul Stealer':{},
 'Shadow Monarch':{hair:'widow',h:'#4a4c56',ec:'#d02030',br:.6,bc:'#22222c',mo:'fang',fx:['ears','eyeshade','collar']},
 Puppeteer:{hair:'short',h:'#2a2228',ec:'#a050d8',br:.45,mo:'grin'},
 'Void Empress':{hair:'long',h:'#4a3020',ec:'#a050d8',br:.2,mo:'smile',fx:['lashes']},
 'Plague Doctor':{},
 'Mad Scientist':{hair:'wild',h:'#d8dce0',br:.5,bc:'#a8acb0',mo:'grin'},
 'Demon Knight':{},
 'Gravity Weaver':{},
 'Mecha Tyrant':{ec:'#ff2020',br:.4,mo:'grit'},
 'Chrono Thief':{hair:'messy',h:'#5a3a20',br:.3},
 'Swarm Queen':{fx:['wings']},
 'Ice Archmage':{ec:'#a8e8ff',br:.3,bc:'#e8f4ff',fx:['beard']},
 'Deep Siren':{hair:'fins',h:'#c060a0',ec:'#6fe080',br:.45,mo:'fang'},
 'Ash Shaman':{hair:'long',h:'#2a2420'},
 'Soul Forger':{},
 'Mirror Jester':{ec:'#e02030',br:.55,mo:'grin',fx:['paint']},
 'Cyber Priest':{}
};
/* Visual changes so each sprite matches its card. The rules still use each character's own weapon. */
const CARD_LOOK={
 Guardian:{off:'glowsword',wc:'#d9a22a'},Ranger:{m:null},Phantom:{mc:'#6ff0b0'},Pyromancer:{mc:'#ffc040'},Voidwalker:{mc:'#b070ff'},'Gravity Weaver':{mc:'#b070ff'},'Blood Reaper':{mc:'#ff3030'},Inventor:{m:'goggles'},Chronomancer:{wv:'watch'},'Gravity Mage':{wv:'blackhole'},Voidwalker:{wv:'blackhole'},
 Pyromancer:{wv:'fire'},Druid:{hat:'antler',hc:'#3a5a28'},Cyborg:{m:'visor',mc:'#6fd6ff'},
 Vigilante:{m:'domino',mc:'#15161e',fx2:'bandana'},'Hero Shadow':{m:'bandana',mc:'#1a1614'},Firefighter:{hat:'fire',hc:'#22222a'},
 Illusionist:{hb:'#a01818'},Necromancer:{wv:'skullstaff'},'Toxin Alchemist':{m:'gasmask'},'Plague Doctor':{wv:'flask',wc:'#3ac85a'},
 Puppeteer:{wv:'strings'},'Soul Stealer':{wv:'lantern',mc:'#d080ff'},'Chrono Thief':{m:'goggles',mc:'#3ac85a',fx2:'bandana',wv:'hourglass'},
 'Cyber Priest':{wv:'holo',m:'cyber',mc:'#6fe0d8'},'Ash Shaman':{hat:'horns',wv:'firestaff'},'Void Empress':{wv:'blackhole',hat:'spikecrown',hc:'#3a3448'},
 'Mecha Tyrant':{m:'robot',hs:'bald'},'Swarm Queen':{m:'bug',hat:'crown',hc:'#e8c02a'},'Mirror Jester':{s:'#f0ece4',m:null},'Demon Knight':{hat:'hornhelm'},
 'Soul Forger':{hat:'helm'},'Deep Siren':{o:'robe',t:'#2a8a80',t2:'#c060a0'},'Ice Archmage':{s:'#d8e4f0'}
};
/* Apply the card looks and faces to the specs above */
for(const n in FACES)Object.assign(SPECS[n],FACES[n]);
for(const n in CARD_LOOK)Object.assign(SPECS[n],CARD_LOOK[n]);
/* Body type. Female characters (from their cards) get a slimmer build, a rounder face with bigger lashed eyes, a hip-swaying walk
   and lighter attacks; everyone else gets the broad male build, square jaw, heavy brows, wider stride and harder swings. */
const FEMALE=['Ranger','Druid','Void Empress','Swarm Queen','Deep Siren','Nurse','Reporter','Shopper','Barista','Elder','Singer','Patron','Medium','Sister','Baker','Mechanic','Paramedic','Apothecary'];
for(const n of FEMALE)if(SPECS[n])SPECS[n].sx='f';
function roundBox(P,x,y,w,h,r,c){for(let i=0;i<h;i++){const d=i<r?r-i:i>=h-r?i-(h-r)+1:0,cut=d?Math.round(r-Math.sqrt(Math.max(0,r*r-(r-d)*(r-d)))):0;P(x+cut,y+i,w-cut*2,1,c)}}
function tint(hex,f){if(!hex||hex[0]!=='#'||hex.length!==7)return hex;const n=parseInt(hex.slice(1),16),k=v=>Math.max(0,Math.min(255,f>1?v+(255-v)*(f-1):v*f))|0;return'#'+((1<<24)+(k(n>>16)<<16)+(k((n>>8)&255)<<8)+k(n&255)).toString(16).slice(1)}
/* The head: skin, hair, face, mask, then hat or hood. cx: head centre, hy: top of the head. */
function drawHead(g,P,E,sp,dir,cx,hy,blink){
 const F=sp.sx==='f',sd=dir===2,back=dir===1,s=sp.s,hc=sp.h,hw=F?24:26,hx=cx-hw/2+(sd?1:0),hh=23,fc=sd?cx+4:cx,ey=hy+14;
 const style=sp.hair||(F&&!sp.hs?'long':sp.hs==='bald'?'bald':sp.hs==='long'?'long':sp.hs==='bun'?'bun':sp.hs==='pony'?'pony':sp.hs==='bob'?'bob':sp.hs==='wild'?'wild':'fringe');
 const hood=sp.hat==='hood'||sp.hat==='antler',helm=sp.hat==='helm'||sp.hat==='hornhelm'||sp.hat==='riot',fx=sp.fx||[];
 if(fx.includes('collar')&&!back){const r='#15161e';if(sd){P(hx-3,hy+8,5,17,r);P(hx-1,hy+10,2,15,'#a01828')}else{P(hx-6,hy+7,6,19,r);P(hx+hw,hy+7,6,19,r);P(hx-4,hy+9,3,17,'#a01828');P(hx+hw+1,hy+9,3,17,'#a01828');P(hx-7,hy+5,3,3,r);P(hx+hw+4,hy+5,3,3,r)}}
 if(style==='long'&&!hood&&!helm){if(back)P(hx-1,hy+4,hw+2,26,hc);else if(sd)P(hx-1,hy+5,9,24,hc);else{P(hx-3,hy+6,6,24,hc);P(hx+hw-3,hy+6,6,24,hc)}}
 /* female: round face and soft chin; male: squarer head with a broad jaw */
 roundBox(P,hx,hy,hw,hh,F?8:5,s);if(!F&&!back){P(hx+3,hy+hh-3,hw-6,2,s);P(hx+6,hy+hh-1,hw-12,1,tint(s,.78))}
 if(!sd&&!back)P(fc,hy+17,1,1,tint(s,.82));
 /* hair */
 const bangs=()=>{for(let i=0;i<4;i++)P(hx+3+i*5,hy+5,4,2+(i%2),hc)};
 if(back){if(style!=='bald')roundBox(P,hx-1,hy-1,hw+2,style==='long'?hh+1:hh-3,6,hc)}
 else if(style!=='bald'){const sides=(n)=>{if(sd)P(hx,hy+4,9,n,hc);else{P(hx-1,hy+4,3,n,hc);P(hx+hw-2,hy+4,3,n,hc)}};
  roundBox(P,hx-1,hy-1,hw+2,8,5,hc);
  if(style==='fringe'||style==='short'||style==='long'||style==='bun'||style==='pony'||style==='bob'){sides(style==='short'?7:style==='bob'?14:10);if(style!=='short')bangs();else P(hx+3,hy+6,hw-8,1,hc)}
  if(style==='bun')E(cx,hy-3,4,3,hc);if(style==='pony')P(sd?hx-3:hx+hw-1,hy+4,4,12,hc);
  if(style==='slick'||style==='widow'){sides(8);P(hx+4,hy,12,1,tint(hc,1.35));P(hx+2,hy+2,6,1,tint(hc,1.35));if(style==='widow'){P(fc-3,hy+6,6,2,hc);P(fc-1,hy+8,2,1,hc)}}
  if(style==='messy'||style==='quiff'||style==='spiky'){sides(8);const sp2=style==='spiky'?[[-12,-3,5,4],[-6,-6,5,6],[0,-7,5,7],[6,-5,5,5],[10,-2,4,4]]:style==='quiff'?[[-11,-3,5,4],[-5,-7,6,7],[2,-5,6,5],[7,-3,5,4]]:[[-10,-3,5,4],[-3,-5,6,5],[4,-4,5,4]];sp2.forEach(([a,b,w,h])=>P(cx+a,hy+b,w,h,hc));P(cx-4,hy-5,2,2,tint(hc,1.3));if(style!=='quiff')bangs()}
  if(style==='wild'){E(cx,hy-1,16,6,hc);E(hx-4,hy+8,5,7,hc);if(!sd)E(hx+hw+3,hy+8,5,7,hc);P(cx-8,hy-5,4,3,hc);P(cx+4,hy-6,4,4,hc);P(cx-1,hy-7,3,3,hc)}
  if(style==='fins'){sides(10);P(hx-5,hy+6,5,3,hc);P(hx-7,hy+3,4,3,hc);if(!sd){P(hx+hw,hy+6,5,3,hc);P(hx+hw+3,hy+3,4,3,hc)}P(cx-1,hy-6,3,6,hc);P(cx-4,hy-4,2,4,hc);P(cx+3,hy-4,2,4,hc)}}
 /* face */
 const covered=sp.m==='falcon'||sp.m==='void'||sp.m==='hero'||sp.m==='robot'||sp.m==='bug'||sp.m==='cyber'||helm||sp.m==='beak'||sp.m==='skull';
 const br=sp.br||0,bc=sp.bc||tint(hc,.7),ec=sp.ec||'#3a3a48';
 const eyesX=sd?[cx+5]:[cx-7,cx+4];
 if(!back&&!covered){
  if(fx.includes('hatshade'))P(hx+1,hy+8,hw-2,3,tint(s,.85));
  if(fx.includes('eyeshade'))eyesX.forEach(x=>P(x-2,ey+4,7,1,tint(s,.82)));
  if(sp.m!=='goggles'&&sp.m!=='gasmask'&&sp.m!=='visor'&&sp.m!=='shade')eyesX.forEach(x=>{if(blink){P(x-1,ey,5,1,'#14141c');return}
   if(F){P(x-1,ey-4,5,8,'#14141c');P(x,ey-3,3,6,ec);P(x+1,ey,2,2,tint(ec,1.4));P(x,ey-3,1,2,'#ffffff');if(!sd)P(x+2,ey+1,1,1,'#ffffff');P(x-2,ey-4,1,1,'#14141c');P(x+4,ey-4,1,1,'#14141c');P(x-2,ey-5,1,1,'#14141c');P(x+4,ey-5,1,1,'#14141c')}
   else{P(x-1,ey-2,5,6,'#14141c');P(x,ey-1,3,4,ec);P(x+1,ey+1,2,1,tint(ec,1.4));P(x,ey-1,1,1,'#ffffff')}
   if(fx.includes('lashes')){P(x-2,ey-3,1,1,'#14141c');P(x+4,ey-3,1,1,'#14141c')}});
  if(F&&!sd&&!fx.includes('blush')&&sp.s!=='#15201c'){P(cx-10,ey+5,3,1,'#f0a0a8');P(cx+7,ey+5,3,1,'#f0a0a8')}
  /* male: thick, straight-set brows; female: thin, arched */
  const brow=F?(x,inR)=>{for(let i=0;i<6;i++){const k=inR?i:5-i;P(x+i,ey-7+Math.round(br*k)-(i===2||i===3?1:0),1,1,bc)}}:(x,inR)=>{for(let i=0;i<7;i++){const k=inR?i:6-i;P(x+i-1,ey-6+Math.round(br*k),1,2,bc)}};
  if(sp.m!=='visor')if(sd)brow(cx+3,false);else{brow(cx-9,true);brow(cx+3,false)}
  const my=hy+20,mx=sd?cx+6:cx,mo=sp.mo||'flat',lip=F?'#c25a66':tint(s,.55);
  if(sp.m!=='gasmask'&&sp.m!=='bandana'&&fx2(sp)!=='bandana'){
   if(mo==='smile'){P(mx-2,my,4,1,sp.ec==='#a050d8'?'#8a2a6a':lip);P(mx-3,my-1,1,1,lip);P(mx+2,my-1,1,1,lip)}
   else if(mo==='smirk'){P(mx-2,my,4,1,lip);P(mx+2,my-1,1,1,lip)}
   else if(mo==='grin'){P(mx-4,my-1,8,3,'#3a1a1a');P(mx-3,my-1,6,1,'#ffffff');P(mx-4,my-2,1,1,lip);P(mx+3,my-2,1,1,lip)}
   else if(mo==='grit'){P(mx-3,my-1,6,2,'#ffffff');P(mx-3,my+1,6,1,'#3a1a1a');P(mx-1,my-1,1,2,'#c8c8c8');P(mx+1,my-1,1,2,'#c8c8c8')}
   else if(mo==='fang'){P(mx-3,my,6,1,'#5a2a34');P(mx+1,my+1,1,1,'#ffffff');P(mx-2,my+1,1,1,'#ffffff')}
   else if(mo==='frown'){P(mx-2,my,4,1,lip);P(mx-3,my+1,1,1,lip);P(mx+2,my+1,1,1,lip)}
   else if(mo!=='none')P(mx-2,my,4,1,lip)}
  if(fx.includes('stubble'))[[-8,18],[-6,20],[-3,21],[3,21],[6,20],[8,18],[-9,16],[9,16],[0,22]].forEach(([a,b])=>{if(!sd||a>-2)P(cx+a+(sd?3:0),hy+b,1,1,tint(s,.74))});
  if(fx.includes('mustache')){P(mx-4,hy+18,8,2,bc);P(mx-5,hy+19,2,1,bc);P(mx+3,hy+19,2,1,bc)}
  if(fx.includes('beard')){const bd=sp.bc&&sp.bc!=='#5a5a5a'&&sp.bc!=='#7a7a7a'?sp.bc:hc;if(sd)roundBox(P,cx,hy+16,12,11,4,bd);else{roundBox(P,hx+2,hy+16,hw-4,12,5,bd);P(cx-3,hy+19,6,1,'#3a2420');P(hx+1,hy+12,3,6,bd);P(hx+hw-4,hy+12,3,6,bd)}if(sp.hat!=='hood')P(cx-4,hy+18,8,1,bd)}
  if(fx.includes('paint')&&!sd){P(cx-8,ey+4,2,3,'#c82030');P(cx+6,ey+4,2,3,'#c82030');P(cx-7,ey-6,2,2,'#20222c');P(cx+5,ey-6,2,2,'#20222c')}
  if(fx.includes('ears')){P(hx-2,hy+11,2,4,s);P(hx-3,hy+10,1,2,s);if(!sd){P(hx+hw,hy+11,2,4,s);P(hx+hw+2,hy+10,1,2,s)}}}
 /* masks */
 const mc=sp.mc||'#15161e';
 if(!back){
  if(sp.m==='domino'){P(hx+1,ey-3,hw-2,6,mc);eyesX.forEach(x=>{P(x,ey-1,3,2,'#f0f0f0');P(x+1,ey-1,1,2,'#14141c')})}
  if(sp.m==='shade'){P(hx+2,ey-2,hw-4,4,'#101018');P(hx+3,ey-2,6,1,'#5a5a70');if(sp.mc)eyesX.forEach(x=>P(x,ey-1,3,2,sp.mc))}
  if(sp.m==='glasses')eyesX.forEach(x=>{P(x-2,ey-4,7,1,'#c8d8e8');P(x-2,ey+4,7,1,'#c8d8e8');P(x-2,ey-4,1,9,'#c8d8e8');P(x+4,ey-4,1,9,'#c8d8e8')});
  if(sp.m==='goggles'||sp.m==='gasmask'){P(hx,ey-2,hw,2,'#4a3a28');eyesX.forEach(x=>{E(x+1,ey,4,4,'#3a3e3a');E(x+1,ey,3,3,sp.mc||'#6fd6ff');P(x-1,ey-2,1,2,'#f0fff0')})}
  if(sp.m==='gasmask'){roundBox(P,fc-8,hy+16,sd?13:16,7,3,'#5a5e58');P(fc-3,hy+18,7,7,'#3a3e3a');P(fc-2,hy+19,5,1,'#6a6e68');P(fc-2,hy+21,5,1,'#6a6e68');P(fc-3,hy+24,7,1,sp.mc||'#3ac85a')}
  if(sp.m==='bandana'||fx2(sp)==='bandana')P(hx+1,hy+16,hw-2,8,sp.m==='bandana'?mc:'#15161e');
  if(sp.m==='visor'){P(hx+1,ey-3,hw-2,5,'#20242c');P(hx+2,ey-2,hw-4,3,mc);P(hx+3,ey-2,8,1,'#e0fcff');P(hx-2,ey-2,3,7,'#40444c')}
  if(sp.m==='skull'){roundBox(P,hx+2,hy+3,hw-4,hh-2,5,'#e4dcc4');eyesX.forEach(x=>{P(x-1,ey-2,5,5,'#14141c');P(x+1,ey,2,1,sp.mc&&sp.mc!=='#15161e'?sp.mc:'#e02020')});P(fc-1,ey+5,2,2,'#14141c');P(fc-5,hy+20,10,1,'#14141c');for(let i=-4;i<5;i+=2)P(fc+i,hy+19,1,3,'#14141c');if(!sd)P(fc-6,hy+5,2,6,'#c02020')}
  if(sp.m==='beak'){roundBox(P,hx+1,hy+5,hw-2,hh-5,5,'#3a3830');eyesX.forEach(x=>{E(x+1,ey-1,2,2,'#3ac85a');P(x,ey-2,1,1,'#e0ffe0')});if(sd){for(let i=0;i<12;i++)P(cx+6+i,hy+16+Math.round(i*.5),Math.max(1,6-i/2|0),3,'#d8ccb0')}else{for(let i=0;i<10;i++){const w=Math.max(1,8-i*0.8|0);P(cx-w/2,hy+15+i,w,1,'#d8ccb0')}P(cx-1,hy+16,1,6,'#b8ac90')}}
  if(sp.m==='void'){roundBox(P,hx+3+(sd?4:0),hy+7,hw-6-(sd?6:0),15,5,'#06070a');const gc=mc==='#15161e'?'#e02020':mc;eyesX.forEach((x,i)=>{const L=!sd&&i===0;for(let k=0;k<5;k++)P(x-1+k,ey-1+Math.round((L?k:4-k)*.35),1,2,gc);P(x+(L?2:-1),ey-2,2,1,tint(gc,1.4))});if(fx.includes('stars'))[[-6,19],[5,18],[-2,10],[7,11]].forEach(([a,b])=>P(fc+a,hy+b,1,1,'#c8b0ff'))}
  if(sp.m==='hero'){roundBox(P,hx,hy,hw,hh,6,mc);eyesX.forEach((x,i)=>{E(x+1,ey,4,3,'#c82a2a');P(x-1,ey-1,5,3,'#f8f8f8');P(x+(i?0:2),ey,2,1,'#14141c')});if(!sd){P(cx-1,hy+3,3,5,'#ffffff');P(cx-3,hy+5,7,1,'#ffffff');P(cx-2,hy+7,1,1,'#ffffff');P(cx+2,hy+7,1,1,'#ffffff')}P(hx+2,hy+15,hw-4,8,sp.s);const my=hy+19,mx=sd?cx+6:cx;P(mx-3,my,6,2,'#ffffff');P(mx-3,my+2,6,1,'#3a1a1a')}
  if(sp.m==='robot'){roundBox(P,hx,hy,hw,hh,7,'#7a8088');P(hx+3,hy+2,10,2,'#a8b0b8');eyesX.forEach(x=>{P(x-1,ey-1,5,3,'#20222a');P(x,ey,3,1,mc==='#15161e'?'#ff2020':mc)});P(fc-6,hy+18,12,4,'#4a5058');for(let i=-5;i<6;i+=2)P(fc+i,hy+18,1,4,'#2a2e34');P(hx+1,hy+10,2,8,'#5a6068')}
  if(sp.m==='bug'){roundBox(P,hx,hy,hw,hh,7,'#8a5a30');eyesX.forEach(x=>{E(x+1,ey-1,5,6,'#2a6a2a');E(x+1,ey-2,3,4,'#6fe060');P(x-1,ey-4,2,2,'#e0ffd0')});P(fc-4,hy+20,3,4,'#5a3a18');P(fc+1,hy+20,3,4,'#5a3a18');P(cx-6,hy-8,1,8,'#3a2410');P(cx+5,hy-8,1,8,'#3a2410');P(cx-8,hy-8,3,2,'#3a2410');P(cx+5,hy-8,3,2,'#3a2410')}
  if(sp.m==='cyber'){roundBox(P,hx+3+(sd?4:0),hy+7,hw-6-(sd?6:0),15,5,'#06070a');P(hx+5,ey-1,hw-10,2,mc);eyesX.forEach(x=>P(x,ey-1,3,2,'#e0fffc'));P(fc-1,hy+18,2,2,mc)}}
 /* hats and hoods */
 const c=sp.hc,o=sd?3:0;
 switch(sp.hat){
  case'fedora':P(hx-4+o,hy+7,34,3,c);P(hx-4+o,hy+9,34,1,tint(c,.72));P(hx+2+o,hy,22,7,c);P(hx+4+o,hy-3,18,3,tint(c,1.12));P(cx-2+o,hy-3,4,1,tint(c,.8));P(hx+2+o,hy+4,22,2,sp.hb||'#2a2018');break;
  case'police':P(hx-1,hy-3,hw+2,7,c);P(hx+(sd?6:0),hy+4,sd?20:hw,2,'#101018');if(!back)P(cx-2,hy-1,4,3,'#e8c95c');break;
  case'nurse':P(hx+2,hy-3,hw-4,5,c);if(!back){P(cx-1,hy-3,2,4,'#c8282a');P(cx-2,hy-2,4,2,'#c8282a')}break;
  case'fire':E(cx+(sd?2:0),hy+4,16,4,c);roundBox(P,hx+1,hy-4,hw-2,10,5,c);P(hx+3,hy-3,8,1,tint(c,1.5));if(!back){P(cx-3,hy-3,6,6,'#c8282a');P(cx-2,hy-2,4,4,'#e8c95c')}P(hx-2,hy+6,hw+4,1,'#e8d84a');break;
  case'riot':roundBox(P,hx-1,hy-2,hw+2,18,6,c);if(!back){P(hx+2,ey-4,hw-4,8,'#8fb0c8');P(hx+3,ey-4,8,1,'#d0e4f0')}break;
  case'ranger':P(hx-5+o,hy+5,36,3,c);P(hx+3+o,hy-3,20,8,c);P(hx+3+o,hy+2,20,1,tint(c,.7));break;
  case'bowler':P(hx-2,hy+5,hw+4,3,c);E(cx,hy+2,10,6,c);break;
  case'top':P(hx-4+o,hy+5,34,3,c);P(hx+3+o,hy-7,20,13,c);P(hx+3+o,hy+1,20,3,sp.hb||'#6a5a4a');P(hx+5+o,hy-6,3,7,tint(c,1.4));break;
  case'flat':P(hx-1,hy-2,hw+2,7,c);if(sd)P(hx+hw-2,hy+3,6,2,c);break;
  case'cap':roundBox(P,hx,hy-2,hw,8,4,c);if(dir===0)P(hx+2,hy+5,hw-4,2,tint(c,.75));if(sd)P(hx+hw-3,hy+4,8,2,c);break;
  case'band':P(hx,hy+4,hw,3,c);if(!back)P(hx+hw-1,hy+5,4,6,c);break;
  case'beanie':roundBox(P,hx-1,hy-4,hw+2,11,5,c);P(hx-1,hy+4,hw+2,2,tint(c,.75));break;
  case'hard':P(hx-3,hy+4,hw+6,3,c);roundBox(P,hx+1,hy-4,hw-2,10,5,c);break;
  case'chef':P(hx+1,hy-7,hw-2,10,c);E(cx,hy-8,11,4,c);break;
  case'horn':case'hornhelm':roundBox(P,hx-1,hy-2,hw+2,back?24:22,7,c);if(!back){P(hx+2,ey-2,hw-4,3,'#0a0a10');P(cx-1,ey-2,2,9,'#0a0a10');eyesX.forEach(x=>P(x,ey-1,3,1,sp.t2||'#ff8a2a'))}for(const s2 of[-1,1]){if(sd&&s2<0)continue;const bx2=s2<0?hx-3:hx+hw-1;P(bx2,hy+2,4,5,'#7a4a2a');P(bx2+s2*3,hy-1,4,4,'#8a5a32');P(bx2+s2*5,hy-4,3,4,'#a87a4a');P(bx2+s2*6,hy-7,3,4,'#c89a6a');P(bx2+s2*6,hy-8,2,2,'#e8c8a0')}break;
  case'horns':for(const s2 of[-1,1]){if(sd&&s2<0)continue;const bx2=s2<0?hx-1:hx+hw-2;P(bx2,hy+2,3,4,'#3a2a24');P(bx2+s2*3,hy-2,3,5,'#3a2a24');P(bx2+s2*4,hy-6,2,5,'#5a4a40');P(bx2+s2*3,hy-8,2,3,'#7a6a5a')}break;
  case'crown':P(hx+4,hy-2,hw-8,3,c);P(hx+4,hy-6,3,4,c);P(cx-2,hy-8,4,6,c);P(hx+hw-7,hy-6,3,4,c);P(cx-1,hy-6,2,2,'#c82a2a');break;
  case'spikecrown':P(hx+2,hy-2,hw-4,4,c);[-10,-5,0,5,10].forEach((a,i)=>P(cx+a-1,hy-(i===2?8:i%2?6:4),3,(i===2?8:i%2?6:4),c));if(!back){P(cx-1,hy-1,3,3,'#a050d8');P(cx,hy,1,1,'#f0d8ff')}break;
  case'jester':roundBox(P,hx-1,hy-3,hw+2,10,4,c);if(!back){P(hx+1,hy+5,hw-2,2,'#20222c')}P(hx-7,hy-7,8,5,c);P(hx-9,hy-3,4,4,c);P(hx+hw-1,hy-7,8,5,'#20222c');P(hx+hw+5,hy-3,4,4,'#20222c');E(hx-8,hy+2,2,2,'#e8c02a');E(hx+hw+7,hy+2,2,2,'#e8c02a');E(cx,hy-5,2,2,'#e8c02a');break;
  case'helm':{const tr=sp.t2||'#d9a22a';roundBox(P,hx-1,hy-2,hw+2,25,7,c);P(hx+3,hy,8,3,tint(c,1.35));if(back)break;P(cx-1+(sd?3:0),hy-4,3,16,tr);P(hx+3+(sd?4:0),ey-1,sd?14:hw-6,3,'#0a0a10');P(cx-1+(sd?5:0),ey-1,3,8,'#0a0a10');if(!sd){for(let i=0;i<9;i++){P(hx+2+i,hy+8+Math.round(i*.3),1,2,tr);P(hx+hw-3-i,hy+8+Math.round(i*.3),1,2,tr)}P(cx-7,ey,3,1,'#ffe08a');P(cx+4,ey,3,1,'#ffe08a')}else P(cx+6,ey,3,1,'#ffe08a');P(hx,hy+16,2,6,tr);if(!sd)P(hx+hw-2,hy+16,2,6,tr)}break;
  case'falcon':{const tr=sp.t2||'#d82a2a',mc2=sp.mc||'#6fe8ff',wing=(s2)=>{for(let k=0;k<4;k++){const wx=s2<0?hx-3-k*2:hx+hw+k*2,top=hy+5-k*4;P(wx,top,3,13-k*2,k%2?'#e8f0ff':'#3f7ad8');P(wx,top,3,2,'#9fe0ff')}};
   if(!sd||true)wing(1);if(!sd)wing(-1);
   roundBox(P,hx-1,hy-2,hw+2,25,7,c);P(hx+3,hy,8,3,tint(c,1.35));P(cx-2+(sd?3:0),hy-3,4,11,tr);P(cx-1+(sd?3:0),hy-3,2,4,'#ffffff');
   if(back)break;
   P(hx+2+(sd?6:0),ey-4,sd?16:hw-4,9,'#0e1626');
   for(let i=0;i<9;i++){if(!sd)P(hx+3+i,ey-2+Math.round(i*.45),2,2,mc2);P(hx+hw-5-i,ey-2+Math.round(i*.45),2,2,mc2)}
   for(let i=0;i<8;i++){if(!sd)P(hx+2+i,ey-6+Math.round(i*.4),1,2,tr);P(hx+hw-3-i,ey-6+Math.round(i*.4),1,2,tr)}
   P(hx+4+(sd?6:0),hy+18,sd?12:hw-8,4,'#d8e0ec');P(cx-1+(sd?4:0),hy+18,2,4,'#a8b4c8');
   if(!sd)P(hx-1,ey-1,3,3,mc2);P(hx+hw-2,ey-1,3,3,mc2)}break;
  case'hood':case'antler':{if(sp.hat==='antler')for(const s2 of[-1,1]){if(sd&&s2<0)continue;const ax=s2<0?hx+3:hx+hw-4;P(ax,hy-8,2,8,'#6a4a2a');P(ax+s2*2,hy-8,2,4,'#6a4a2a');P(ax-s2*3,hy-7,3,2,'#6a4a2a');P(ax+s2*4,hy-5,3,2,'#6a4a2a')}
   if(back){roundBox(P,hx-2,hy-4,hw+4,hh+5,8,c);P(cx-3,hy-7,6,4,c);break}
   roundBox(P,hx-2,hy-4,hw+4,12,7,c);P(cx-3+o,hy-7,6,4,c);P(hx-2,hy+4,5,20,c);if(!sd)P(hx+hw-3,hy+4,5,20,c);else P(hx-2,hy+4,9,20,c);if(sp.m!=='void'&&sp.m!=='cyber')P(hx+3,hy+7,hw-6,3,tint(c,.55));P(hx,hy-3,10,2,tint(c,1.3));if(sp.m==='cyber'){P(hx-2,hy+4,1,20,sp.mc);P(hx+hw+1,hy+4,1,20,sp.mc);P(hx+2,hy-4,hw-4,1,sp.mc)}
   /* long hair spilling out of the hood for female characters */
   if(F&&sp.m!=='void'&&sp.m!=='cyber'){const h2=sp.h||'#3a2a20';P(hx+2,hy+8,3,17,h2);if(!sd)P(hx+hw-5,hy+8,3,17,h2);P(hx+2,hy+24,2,2,tint(h2,1.3));if(!sd)P(hx+hw-4,hy+24,2,2,tint(h2,1.3))}}break;
 }
}
const fx2=sp=>sp.fx2||null;
function buildFrame(sp,dir,anim,f){
 const cv=document.createElement('canvas');cv.width=cv.height=FS;const g=cv.getContext('2d');
 const P=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
 const L=(x,y,a,len,w,c)=>{g.fillStyle=c;for(let i=0;i<=len;i++)g.fillRect(Math.round(x+Math.cos(a)*i-w/2),Math.round(y+Math.sin(a)*i-w/2),w,w);return[x+Math.cos(a)*len,y+Math.sin(a)*len]};
 const E=(cx,cy,rx,ry,c)=>{g.fillStyle=c;for(let y=-ry;y<=ry;y++)for(let x=-rx;x<=rx;x++)if((x*x)/(rx*rx)+(y*y)/(ry*ry)<=1)g.fillRect(Math.round(cx+x),Math.round(cy+y),1,1)};
 const ranged=RANGED_W.has(sp.w),fx=sp.fx||[],F=sp.sx==='f',lw=F?4:6;
 let by=0,lean=0,lDx=0,rDx=0,lUp=0,rUp=0,aF=Math.PI/2+.08,aB=Math.PI/2-.08,tuck=false,glint=false,atk=false,blink=false;
 /* Walk and run are sampled from one smooth stride cycle; run has a longer stride, higher knees, a deeper bounce and a forward lean. */
 if(anim==='walk'||anim==='run'){const run=anim==='run',ph=f/WALK_N*TAU,sw=Math.cos(ph),up=Math.sin(ph),stride=(run?7:5)+(F?-1:1),lift=run?4:2,arm=(run?.95:.55)*(F?.75:1.15);
  /* male: heavier bounce; female: lighter step and a side-to-side hip sway */
  by=Math.abs(up)>.5?(run?-2:F?-1:-2):0;if(run&&dir===2)lean=3;if(F&&dir!==2)lean=Math.round(Math.sin(ph)*1.5);
  if(dir===2){lDx=stride*sw;rDx=-stride*sw;lUp=Math.round(Math.max(0,-up)*lift);rUp=Math.round(Math.max(0,up)*lift)}else{lUp=Math.round(Math.max(0,up)*(lift+1));rUp=Math.round(Math.max(0,-up)*(lift+1))}
  aF=Math.PI/2+arm*sw;aB=Math.PI/2-arm*sw}
 else if(anim==='idle'){by=f?1:0}
 /* Attack: wind-up, swing, impact, follow-through, recover */
 /* male swings lean in harder and plant wider; female attacks are quicker and lighter on the feet */
 else if(anim==='attack'){lean=F?[-1,0,2,2,1][f]:[-3,-2,4,4,1][f];lDx=F?[1,2,3,2,1][f]:[3,5,6,5,3][f];rDx=-lDx;atk=f>=1&&f<=3;
  if(sp.w==='fist')aF=[2.8,2.6,-.05,.25,.9][f];else if(ranged||sp.w==='shield')aF=[.7,.5,-.05,.08,.4][f];else aF=[-2.6,-2.3,-.5,.75,1.1][f];aB=Math.PI/2+.5}
 else if(anim==='pickup'){if(f<2){by=8;aF=1.2;aB=1.9;lDx=2;rDx=-2}else{aF=-1.45;aB=Math.PI/2;glint=true}}
 else if(anim==='hit'){lean=-3;aF=-.6;aB=-2.5;lDx=2;rDx=-2;blink=true}
 else if(anim==='dodge'){by=9;tuck=true;aF=.6;aB=.9}
 else if(anim==='ko'){aF=.4;aB=2.7;lDx=4;rDx=-4;blink=true}
 else if(anim==='guard'){aF=-.15;aB=-.25;by=1;lDx=4;rDx=-4}
 else if(anim==='cast'){aF=-1.25;aB=-1.9;by=f?-1:0;glint=!!f}
 /* Charge: hands cupped at the hip, leaning back. Beam: both arms thrust toward the target. */
 else if(anim==='charge'){by=1;lean=-2;lDx=3;rDx=-3;if(dir===2){aF=2.3;aB=2.45}else if(dir===0){aF=2.25;aB=.9}else{aF=-2.25;aB=-.9}}
 else if(anim==='beam'){lean=2;by=f?0:-1;lDx=4;rDx=-4;if(dir===2){aF=-.05;aB=.08}else if(dir===0){aF=1.85;aB=1.3}else{aF=-1.85;aB=-1.3}}
 /* Head 8..31, torso 31..44, short legs 44..56, boots 56..60: about 44% head, with room above for hats and horns */
 const bx=32+lean,ty=31+by,hip=44+by,hy=8+by,skin=sp.s;
 const leg=(hx,dx,up,col)=>{const fx2=hx+dx,fy=56-up;for(let y=hip;y<=fy;y++){const k=(y-hip)/Math.max(1,fy-hip);P(hx+(fx2-hx)*k-lw/2,y,lw,1,col)}const bw=(dir===2?8:6)+(F?-1:1);P(dir===2?fx2-2:fx2-bw/2,fy,bw,4,sp.f)};
 const longBody=sp.o==='robe'||sp.o==='dress';
 const legs=()=>{if(tuck){P(bx-7,hip,14,8,sp.b||sp.t);P(bx-8,hip+7,6,3,sp.f);P(bx+2,hip+7,6,3,sp.f);return}
  const c=sp.b||sp.t,gap=F?3:5,ll=dir===2?bx:bx-gap,rl=dir===2?bx:bx+gap;
  if(sp.o==='robe'){for(let y=hip;y<59;y++){const w=16+Math.round((y-hip)*.35);P(bx-w/2,y,w,1,sp.t)}if(sp.t2&&dir!==1)P(bx-1,hip,3,20,sp.t2===WHT?sp.t:sp.t2);P(bx-7+lDx*.3,58,6,3,sp.f);P(bx+1+rDx*.3,58,6,3,sp.f);return}
  if(dir===2){leg(rl,rDx,rUp,tint(c,.72));leg(ll,lDx,lUp,c)}else{leg(ll,lDx,lUp,c);leg(rl,rDx,rUp,c)}
  if(F&&sp.o!=='dress'&&dir!==2)P(bx-8,hip-1,16,4,c);
  if(sp.o==='dress'){for(let y=hip;y<hip+13;y++){const w=16+Math.round((y-hip)*.7);P(bx-w/2,y,w,1,sp.t)}}};
 /* male: broad shoulders and chest; female: narrower shoulders and a waist */
 const torso=()=>{const w=dir===2?(F?12:15):(F?15:20),x=bx-Math.floor(w/2),y=ty,h=13;if(F){P(x,y,w,8,sp.t);P(x+1,y+8,w-2,h-8,sp.t)}else P(x,y,w,h,sp.t);
  const front=dir!==1,mid=bx-1;
  switch(sp.o){
   case'coat':P(x-(dir===2?0:1),y+5,w+(dir===2?0:2),h+4,sp.t);if(front&&dir!==2){P(mid-1,y,4,h+4,sp.t2);P(mid,y,2,4,'#e8e4d8');P(mid,y+2,2,6,'#7a2a24');P(x+2,y,3,8,tint(sp.t,.82));P(x+w-5,y,3,8,tint(sp.t,.82))}break;
   case'hoodie':if(front){P(x+3,y+7,w-6,5,sp.t2);P(mid,y,1,5,WHT);P(mid+2,y,1,5,WHT)}break;
   case'open':if(front)P(mid-2,y,6,h,sp.t2);break;
   case'vest':P(x+1,y+1,w-2,11,sp.t2);if(front&&sp.t2==='#d9a22a'){P(x+2,y+2,w-4,9,tint(sp.t,1.15));P(mid,y+3,3,6,sp.t2);P(mid-2,y+5,7,1,sp.t2)}break;
   case'hivis':P(x,y+3,w,2,sp.t2);P(x,y+8,w,2,sp.t2);P(bx-6,hip+8,12,2,sp.t2);break;
   case'belt':P(x,y+11,w,2,sp.t2===WHT?BLK:'#20222c');if(front){P(mid,y+11,3,2,sp.t2);P(mid-4,y+2,2,2,sp.t2)}break;
   case'ribs':if(front){P(mid,y,2,h,sp.t2);for(let i=1;i<h-2;i+=3)P(x+2,y+i,w-4,1,sp.t2)}else P(mid,y,2,h,sp.t2);break;
   case'stripes':for(let i=0;i<h;i+=3)P(x,y+i,w,1,sp.t2);if(front)P(x+3,y,w-6,4,'#2c3f7a');break;
   case'stripe2':if(front)P(mid,y,2,h,sp.t2);P(x,y,1,h,sp.t2);P(x+w-1,y,1,h,sp.t2);break;
   case'overalls':P(x+1,y+5,w-2,8,sp.t2);P(x+2,y,2,5,sp.t2);P(x+w-4,y,2,5,sp.t2);break;
   case'apron':if(front){P(x+3,y+2,w-6,11,sp.t2);P(bx-4,hip,9,7,sp.t2)}break;
   case'suit':if(front){P(mid-1,y,4,8,'#e8e4d8');P(mid,y+1,2,7,sp.t2==='#a01818'||sp.t2==='#7a3a8a'?sp.t2:'#a01818');P(mid-3,y+8,8,4,tint(sp.t,1.25))}break;
   case'sash':if(front)for(let i=0;i<12;i++)P(x+2+i,y+1+i,2,2,sp.t2);break;
   case'falcon':P(x,y,w,h,sp.t);if(front){P(x+2,y+1,w-4,9,sp.t2);for(let i=0;i<5;i++){P(mid-4+i,y+2+i,2,1,'#f0f4ff');P(mid+3-i,y+2+i,2,1,'#f0f4ff')}P(mid-4,y-1,10,3,sp.t2)}P(x,y+11,w,2,'#e8ecf4');P(x-3,y-1,6,5,'#e8ecf4');P(x+w-3,y-1,6,5,'#e8ecf4');P(x-2,y,4,1,'#ffffff');break;
   case'robe':if(front){P(mid,y,3,4,sp.t2);if(sp.t2!==WHT)P(mid,y,3,h,sp.t2);P(x,y+h-2,w,2,tint(sp.t,.8))}break;
   case'dress':if(front)for(let i=0;i<5;i++)P(mid-2+(i%2?4:0),y+i*2,2,1,sp.t2);P(x+3,y,w-6,3,sp.t2);break;
   default:if(front)P(mid,y,3,2,skin);
  }
  if(fx.includes('fur')){P(x-3,y-1,w+6,4,'#b8b4a8');P(x-2,y+2,4,2,'#d8d4c8');P(x+w-2,y+2,4,2,'#d8d4c8')}
  if(sp.pack&&dir!==0)P(dir===2?x-4:x+1,y+1,dir===2?5:12,10,sp.pack)};
 const sw2=F?8:11,sh=dir===2?[bx+1,ty+2]:[bx+sw2,ty+2],sh2=dir===2?[bx-2,ty+2]:[bx-sw2,ty+2],aw=F?4:6;
 const sleeve=sp.t,hand=skin==='#15161e'||skin==='#10101c'||skin==='#14142a'||skin==='#10121a'||skin==='#15201c'?'#c8d0c8':skin;
 const armFar=()=>{const e=L(sh2[0],sh2[1],aB,10,aw,tint(sleeve,dir===2?.8:1));P(e[0]-2,e[1]-1,4,4,hand);if(sp.w==='fist')P(e[0]-3,e[1]-2,7,7,sp.wc||hand);if(sp.off)drawWeaponSprite(g,sp.off,e[0],e[1],aB,sp.wc,hand,atk);else if(sp.w==='bow'&&!atk&&dir!==2)drawWeaponSprite(g,'bow',e[0],e[1],dir===1?0:Math.PI,sp.wc,hand,false)};
 const armNear=()=>{const e=L(sh[0],sh[1],aF,11,aw,sleeve);P(e[0]-2,e[1]-1,4,4,hand);const wv=sp.wv||sp.w;if(wv&&!(wv==='bow'&&!atk&&dir!==2))drawWeaponSprite(g,wv,e[0],e[1],aF,sp.wc,hand,atk);if(glint){P(e[0]-4,e[1]-9,8,8,'#fff6c0');P(e[0]-1,e[1]-13,2,16,'#ffffff');P(e[0]-7,e[1]-6,14,2,'#ffffff')}};
 const cape=()=>{if(!sp.cp)return;if(dir===0){P(bx-11,ty+1,22,24,sp.cp);P(bx-11,ty+23,4,3,sp.cp);P(bx+7,ty+23,4,3,sp.cp)}else if(dir===2)P(bx-11,ty+1,7,25,sp.cp)};
 const wings=()=>{if(!fx.includes('wings'))return;const wc='rgba(220,230,240,.75)';for(const s of dir===2?[-1]:[-1,1]){for(let i=0;i<14;i++){const w=Math.round(9*Math.sin(i/14*Math.PI));P(s<0?bx-8-i:bx+8+i-1,ty-6+i*.4,1,w+4,wc)}}};
 const quiver=()=>{if(sp.w!=='bow')return;if(dir===0||dir===1){P(bx+5,ty-9,6,17,'#6a4a2a');P(bx+5,ty-9,6,2,'#4a3018');[0,2,4].forEach(i=>{P(bx+5+i,ty-13,1,4,'#8a6a40');P(bx+4+i,ty-15,3,3,'#e8e4d8')})}else{P(bx-9,ty-6,5,15,'#6a4a2a');[0,2].forEach(i=>P(bx-9+i,ty-10,3,3,'#e8e4d8'))}};
 const head=()=>drawHead(g,P,E,sp,dir,bx+(dir===2?1:0),hy,blink);
 if(dir===1){quiver();armNear();armFar();legs();torso();if(sp.cp)P(bx-11,ty+1,22,25,sp.cp);head();wings()}
 else if(dir===2){wings();cape();quiver();armFar();legs();torso();head();armNear()}
 else{wings();quiver();cape();legs();torso();head();armFar();armNear()}
 /* outline, then a light top edge and a dark bottom edge on every shape: three tones per colour */
 const im=g.getImageData(0,0,FS,FS),d=im.data,o=new Uint8ClampedArray(d),S=FS*4;
 for(let y=0;y<FS;y++)for(let x=0;x<FS;x++){const i=(y*FS+x)*4;
  if(d[i+3]>200){if(y>0&&d[i-S+3]<40){for(let k=0;k<3;k++)o[i+k]=Math.min(255,d[i+k]*1.14+14)}else if(y<FS-1&&d[i+S+3]<40){for(let k=0;k<3;k++)o[i+k]=d[i+k]*.76}continue}
  if(d[i+3])continue;
  if((x>0&&d[i-1]>200)||(x<FS-1&&d[i+7]>200)||(y>0&&d[i-S+3]>200)||(y<FS-1&&d[i+S+3]>200)){o[i]=12;o[i+1]=13;o[i+2]=20;o[i+3]=255}}
 d.set(o);g.putImageData(im,0,0);
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
/* A solid red copy of a frame, for the stagger flash */
const RED=new WeakMap();
function redFrame(im){let r=RED.get(im);if(!r){r=document.createElement('canvas');r.width=im.width;r.height=im.height;const g=r.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='source-atop';g.fillStyle='rgba(255,46,46,.85)';g.fillRect(0,0,r.width,r.height);RED.set(im,r)}return r}
function frame(name,dir,anim,f,wpn){const k=name+'|'+dir+'|'+anim+'|'+f+'|'+(wpn||'');let c=FRAMES.get(k);if(!c){let sp=SPECS[name]||SPECS.Tourist;if(wpn){const rw=wpn==='fists'?'fist':wpn;sp=Object.assign({},sp,{w:rw,wc:sp.w===rw?sp.wc:undefined})}c=buildFrame(sp,dir,anim,f);FRAMES.set(k,c)}return c}
const dirOf=a=>{const c=Math.cos(a),s=Math.sin(a);return Math.abs(c)>=Math.abs(s)*.9?2:(s<0?1:0)};
/* 64 px frames drawn 1.2x keep the same on-screen size as the old 48 px frames drawn 1.6x */
const PS=1.2;
/* mo: smooth motion added while drawing, so it moves every frame instead of in pose steps.
   dx, dy: offset · rot: lean about the feet · sx, sy: squash and stretch about the feet. */
function blit(c2,name,x,y,dir,anim,f,flip,rot,alpha,wpn,size=1,mo){
  let im=frame(name,dir,anim,f,wpn);if(mo&&mo.red)im=redFrame(im);c2.save();c2.imageSmoothingEnabled=false;c2.translate(x,y);
  if(mo){c2.translate(mo.dx||0,mo.dy||0);if(mo.rot)c2.rotate(mo.rot);if(mo.sx||mo.sy)c2.scale(mo.sx||1,mo.sy||1)}
  if(size!==1)c2.scale(size,size);if(flip)c2.scale(-1,1);
  if(rot){c2.translate(0,-19*PS);c2.rotate(rot);c2.translate(0,19*PS)}
  if(alpha!==undefined)c2.globalAlpha=alpha;
  c2.drawImage(im,-32*PS,-61*PS,FS*PS,FS*PS);c2.restore();
}
