/* Dayrim: city action RPG. Rules, world and rendering. Atlas data is injected by tools/build.py */
const TAU=Math.PI*2,T=40,PXB=15,PYB=13,MW=78,MH=55;
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rnd=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);
const irnd=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const idx=(x,y)=>y*MW+x;
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas=$('c'),ctx=canvas.getContext('2d');
const ATLAS=new Image();ATLAS.src=ATLAS_URL;
document.documentElement.style.setProperty('--atlas','url("'+ATLAS_URL+'")');
const artStyle=(n,bw,bh)=>{const a=CAST[n],k=Math.min(bw/a.w,bh/a.h);return 'width:'+Math.round(a.w*k)+'px;height:'+Math.round(a.h*k)+'px;background-size:'+AW*k+'px '+AH*k+'px;background-position:'+(-a.x*k)+'px '+(-a.y*k)+'px'};

/* ---------- Data ---------- */
const ARCH={
  bruiser:{n:'Bruiser',d:'35% more life and extra armor, but slower.',f:s=>{s.maxHp*=1.35;s.armor+=6;s.speed*=.92},e:{hp:1.7,sp:60,dmg:1.3,r:15,range:22,atk:1.3}},
  striker:{n:'Striker',d:'20% more damage from every attack.',f:s=>{s.dmg*=1.2},e:{hp:1,sp:86,dmg:1,r:13,range:20,atk:.95}},
  shooter:{n:'Marksman',d:'Attacks 15% faster, and spells cost less mana.',f:s=>{s.cdMul*=.85;s.spellCost=11},e:{hp:.72,sp:64,dmg:.8,r:13,range:20,atk:1.7}},
  medic:{n:'Medic',d:'Heals 2 life per hit and starts with 3 extra potions.',f:s=>{s.leech+=2},potions:3,e:{hp:.9,sp:66,dmg:.7,r:13,range:20,atk:1.8}},
  scout:{n:'Scout',d:'15% faster, and the dodge recharges 30% quicker.',f:s=>{s.speed*=1.15;s.dashCd*=.7},e:{hp:.8,sp:112,dmg:.85,r:13,range:18,atk:.85}}
};
const ROSTER={hero:{Detective:'shooter',Vigilante:'scout',Guardian:'bruiser',Ranger:'scout',Inventor:'shooter',Firefighter:'bruiser','Hero Shadow':'striker',Prodigy:'striker',Sage:'shooter',Patriot:'striker',Phantom:'scout',Pyromancer:'shooter',Chronomancer:'shooter',Beastmaster:'striker',Voidwalker:'shooter',Exorcist:'medic','Gravity Mage':'shooter',Druid:'medic',Cyborg:'bruiser',Illusionist:'scout'},
villain:{Necromancer:'shooter','Blood Reaper':'bruiser','Toxin Alchemist':'medic','Soul Stealer':'scout','Shadow Monarch':'striker',Puppeteer:'shooter','Void Empress':'shooter','Plague Doctor':'medic','Mad Scientist':'shooter','Demon Knight':'bruiser','Gravity Weaver':'shooter','Mecha Tyrant':'bruiser','Chrono Thief':'scout','Swarm Queen':'scout','Ice Archmage':'shooter','Deep Siren':'striker','Ash Shaman':'medic','Soul Forger':'bruiser','Mirror Jester':'scout','Cyber Priest':'medic'}};
/* The action methods. Each character's stats (1 to 5) set how strong each method is for them. */
const METHODS={unarmed:{n:'Unarmed',st:'pow'},melee:{n:'Weapon melee',st:'pow'},shoot:{n:'Shoot',st:'aim'},spell:{n:'Spell',st:'mag'},shield:{n:'Shield',st:'grd'},heal:{n:'Heal',st:'hea'}};
const STAT_NAMES={pow:'Melee',aim:'Shooting',mag:'Magic',grd:'Shield',hea:'Healing'};
const STAT_MUL=[.6,.8,1,1.2,1.4];
const mkS=(pow,aim,mag,grd,hea)=>({pow,aim,mag,grd,hea});
const label=n=>n==='Hero Shadow'?'Shadow':n;
const STATS={Necromancer:mkS(1,1,5,2,4),'Blood Reaper':mkS(5,1,2,3,2),'Toxin Alchemist':mkS(2,3,4,1,4),'Soul Stealer':mkS(2,1,5,1,3),'Shadow Monarch':mkS(5,2,3,2,2),Puppeteer:mkS(1,2,5,2,2),'Void Empress':mkS(1,1,5,3,2),'Plague Doctor':mkS(2,1,3,2,5),'Mad Scientist':mkS(1,5,3,1,2),'Demon Knight':mkS(5,1,2,5,1),'Gravity Weaver':mkS(1,1,5,3,2),'Mecha Tyrant':mkS(5,4,1,5,1),'Chrono Thief':mkS(3,5,2,1,2),'Swarm Queen':mkS(3,2,5,1,3),'Ice Archmage':mkS(1,1,5,3,3),'Deep Siren':mkS(4,1,4,2,3),'Ash Shaman':mkS(2,1,4,2,5),'Soul Forger':mkS(5,1,2,4,2),'Mirror Jester':mkS(4,3,3,1,2),'Cyber Priest':mkS(1,3,4,2,5),
Guardian:mkS(3,1,1,5,2),Ranger:mkS(3,5,1,1,3),'Hero Shadow':mkS(5,2,2,1,1),Sage:mkS(1,1,5,2,4),Phantom:mkS(2,1,5,1,3),Pyromancer:mkS(1,1,5,1,2),Chronomancer:mkS(2,2,5,2,3),Beastmaster:mkS(5,2,1,2,3),Voidwalker:mkS(1,1,5,2,2),Exorcist:mkS(2,1,4,2,5),'Gravity Mage':mkS(1,1,5,3,2),Druid:mkS(2,1,4,2,5),Cyborg:mkS(5,4,1,4,1),Illusionist:mkS(2,3,5,1,2),Detective:mkS(3,5,1,2,2),Nurse:mkS(1,1,2,2,5),'Beat Cop':mkS(4,3,1,4,1),Vigilante:mkS(4,2,1,2,2),Reporter:mkS(2,3,2,2,2),Firefighter:mkS(5,1,1,4,2),Doctor:mkS(1,2,3,1,5),Boxer:mkS(5,1,1,3,1),Priest:mkS(1,1,5,2,4),Mechanic:mkS(4,2,2,3,1),SWAT:mkS(3,3,1,5,1),Prodigy:mkS(4,2,2,2,2),Ranger:mkS(3,3,1,2,3),Judge:mkS(4,1,3,3,1),Inventor:mkS(2,5,3,2,1),Paramedic:mkS(2,1,2,2,5),Patriot:mkS(5,2,1,4,2),Athlete:mkS(5,1,1,2,3),Baker:mkS(4,1,1,3,3),
Boss:mkS(2,4,4,2,1),Brute:mkS(4,5,1,3,1),Sister:mkS(1,1,4,2,5),Shadow:mkS(2,5,3,1,1),Scribe:mkS(1,1,5,1,3),Chemist:mkS(1,2,4,1,5),Driver:mkS(4,3,1,2,1),Soldier:mkS(3,5,1,3,1),Spy:mkS(3,3,3,2,1),Prelate:mkS(5,1,3,2,1),Grandmaster:mkS(1,1,5,2,3),Executioner:mkS(5,1,1,4,1),Undertaker:mkS(4,1,3,3,2),Whisperer:mkS(1,2,5,2,2),Smuggler:mkS(3,5,1,2,1),Apothecary:mkS(1,2,3,1,5),Silencer:mkS(5,1,2,1,1),Medium:mkS(1,1,5,1,4),Usurer:mkS(3,2,2,2,4),Initiate:mkS(4,1,2,2,2)};
/* Weapons. Power never changes, whichever enemy or stage it came from. 25 power means +100% damage. */
const WEAPONS={
 fists:{n:'Fists',m:'unarmed',p:0,cd:.26,reach:50},knife:{n:'Knife',m:'melee',p:6,cd:.28,reach:54},cane:{n:'Cane',m:'melee',p:7,cd:.34,reach:64},baton:{n:'Baton',m:'melee',p:8,cd:.34,reach:64},pin:{n:'Rolling Pin',m:'melee',p:9,cd:.38,reach:62},wrench:{n:'Wrench',m:'melee',p:10,cd:.38,reach:62},hook:{n:'Crowbar',m:'melee',p:10,cd:.38,reach:64},torch:{n:'Flashlight',m:'melee',p:6,cd:.32,reach:60},money:{n:'Money Bag',m:'melee',p:11,cd:.44,reach:58},gavel:{n:'Gavel',m:'melee',p:12,cd:.44,reach:62},bat:{n:'Baseball Bat',m:'melee',p:13,cd:.44,reach:72},shovel:{n:'Shovel',m:'melee',p:15,cd:.5,reach:76},cleaver:{n:'Cleaver',m:'melee',p:17,cd:.5,reach:62},axe:{n:'Fire Axe',m:'melee',p:20,cd:.58,reach:76},
 pistol:{n:'Pistol',m:'shoot',p:6,cd:.34},camera:{n:'Flash Camera',m:'shoot',p:4,cd:.3},tommy:{n:'Tommy Gun',m:'shoot',p:3,cd:.22},blaster:{n:'Blaster',m:'shoot',p:16,cd:.6},
 candle:{n:'Cursed Candle',m:'spell',p:6,cd:.42,cost:4},book:{n:'Spell Book',m:'spell',p:10,cd:.5,cost:6},flask:{n:'Potion Flask',m:'spell',p:12,cd:.55,cost:7},orb:{n:'Magic Orb',m:'spell',p:15,cd:.6,cost:9},
 sword:{n:'Dark Blade',m:'melee',p:16,cd:.46,reach:72},scythe:{n:'Reaper Scythe',m:'melee',p:19,cd:.54,reach:84},hammer:{n:'Forge Hammer',m:'melee',p:22,cd:.62,reach:70},trident:{n:'Trident',m:'melee',p:15,cd:.48,reach:86},staff:{n:'Magic Staff',m:'spell',p:13,cd:.56,cost:8},
 bow:{n:'Longbow',m:'shoot',p:9,cd:.42},spear:{n:'Spear',m:'melee',p:14,cd:.46,reach:84},cards:{n:'Trick Cards',m:'spell',p:8,cd:.46,cost:5},
 shield:{n:'Knight Shield',m:'shield',p:5,cd:.46,reach:56},medkit:{n:'Medkit',m:'heal',p:3,cd:.4,reach:56},censer:{n:'Holy Censer',m:'heal',p:5,cd:.44,reach:60},herb:{n:'Living Herb',m:'heal',p:4,cd:.4,reach:56}
};
const weaponOf=name=>{const w=SPECS[name].w;return w&&w!=='fist'?w:'fists'};
const archKey=n=>ROSTER.hero[n]||ROSTER.villain[n],archOf=n=>ARCH[archKey(n)],factionOf=n=>ROSTER.hero[n]?'hero':'villain';
/* Threat: an enemy walks at the player who has earned its attention, not only the nearest one.
   Scores are percent of the enemy's own life, so they mean the same thing at every level and stage. */
const THREAT={decay:4,prox:25,heal:.6,switch:1.15,backline:1.5,range:900,healRange:420,cap:400};
function threatAdd(e,pid,amt){if(!e||e.dead||!(amt>0))return;const th=e.th||(e.th={});th[pid]=Math.min(THREAT.cap,(th[pid]||0)+amt)}
function threatDecay(e,dt){if(!e.th)return;for(const k in e.th){const v=e.th[k]-THREAT.decay*dt;if(v<=0)delete e.th[k];else e.th[k]=v}}
function threatScore(e,q){const d=dist(e,q);if(d>THREAT.range)return -1;let s=((e.th&&e.th[q.id||0])||0)+THREAT.prox*(1-d/THREAT.range);if(e.role==='rusher'&&['shooter','medic'].includes(archKey(q.char)))s*=THREAT.backline;return s}
/* The player the boss resents most, taunt included: used by attacks that hunt a target rather than the nearest body. */
function topThreatPlayer(e){if(e.tauntT>0){const t=G.players.find(q=>(q.id||0)===e.tauntId&&!(q.deadT>0)&&!(q.respawnT>0));if(t)return t}
  let best=null,bs=-1;for(const q of alivePlayers()){const s=threatScore(e,q);if(s>bs){bs=s;best=q}}return best||nearestPlayer(e)}
/* Taunt overrides everything. A switch needs a clear win, so enemies do not flip-flop. Bosses keep to the nearest player until the boss framework defines their targeting. */
function threatTarget(e){
  if(e.tauntT>0){const t=G.players.find(q=>(q.id||0)===e.tauntId&&!(q.deadT>0)&&!(q.respawnT>0));if(t)return t}
  if(e.kind==='boss'&&(e.kit||G.stage)!==6)return nearestPlayer(e);
  let best=null,bs=-2;for(const q of alivePlayers()){const s=threatScore(e,q);if(s>bs){bs=s;best=q}}
  if(!best)return nearestPlayer(e);
  const cur=G.players.find(q=>(q.id||0)===(e.targetId||0)&&!(q.deadT>0)&&!(q.respawnT>0));
  if(cur&&cur!==best&&bs<threatScore(e,cur)*THREAT.switch)return cur;
  return best;
}
/* Healing counts as attention. Active heals only; passive regeneration is not tracked. */
function threatHeal(p,amount){if(!(amount>0))return;for(const e of G.enemies)if(!e.dead&&dist(e,p)<THREAT.healRange)threatAdd(e,p.id||0,THREAT.heal*100*amount/Math.max(1,p.s.maxHp))}
/* Auras are passive, shared with nearby allies, and do not stack with the same effect. */
const AURA_RADIUS=220,AURA_TYPES={bruiser:{n:'Bulwark',d:'8% less damage taken',col:'#70caff'},shooter:{n:'Focus',d:'8% more damage',col:'#ffd166'},striker:{n:'Precision',d:'4% critical chance',col:'#ff7b72'},scout:{n:'Haste',d:'8% movement speed',col:'#b9a4ff'},medic:{n:'Renewal',d:'0.6% life per second',col:'#80e5aa'}};
const auraOf=p=>AURA_TYPES[archKey(p.char)],auraHas=(p,k)=>!(p.deadT>0||p.respawnT>0)&&G.players.some(q=>!(q.deadT>0||q.respawnT>0)&&archKey(q.char)===k&&dist(p,q)<=AURA_RADIUS);
const UPGRADE_COSTS=[80,180,300,450,650],MAX_WEAPON_TIER=UPGRADE_COSTS.length;
const upgradeLevel=(p,id)=>Math.max(0,Math.min(MAX_WEAPON_TIER,Number.isInteger((p.weaponUpgrades||{})[id])?p.weaponUpgrades[id]:0)),upgradeCost=n=>UPGRADE_COSTS[n]||0;
function upgradeWeapon(id){const p=G.p,kit=kitOf(p);if(typeof id!=='string'||!p.nearSafe)return false;if(kit?id!=='signature':(!Object.prototype.hasOwnProperty.call(WEAPONS,id)||!p.weapons.includes(id)))return false;const n=upgradeLevel(p,id),cost=upgradeCost(n);if(!cost||p.gold<cost)return false;p.gold-=cost;p.weaponUpgrades=p.weaponUpgrades||{};p.weaponUpgrades[id]=n+1;if(!G.swarm)achievementCheck(p);dirty();writeSave();return true}
/* Unlocks are personal; the catalog is shared by the browser and server. */
const ACHIEVEMENTS=[
 {id:'story1',group:'Story',n:'First light',d:'Clear a story stage at or beyond stage 1.',key:'beaten',goal:1},
 {id:'story3',group:'Story',n:'Into the fen',d:'Clear a story stage at or beyond stage 3.',key:'beaten',goal:3},
 {id:'story5',group:'Story',n:'Through the marsh',d:'Clear a story stage at or beyond stage 5.',key:'beaten',goal:5},
 {id:'story7',group:'Story',n:'Rust survivor',d:'Clear a story stage at or beyond stage 7.',key:'beaten',goal:7},
 {id:'story10',group:'Story',n:'After the night',d:'Clear stage 10.',key:'beaten',goal:10},
 {id:'kills10',group:'Combat',n:'First patrol',d:'Defeat 10 enemies in a story run.',key:'kills',goal:10},
 {id:'kills50',group:'Combat',n:'Street fighter',d:'Defeat 50 enemies in a story run.',key:'kills',goal:50},
 {id:'kills250',group:'Combat',n:'City defender',d:'Defeat 250 enemies in a story run.',key:'kills',goal:250},
 {id:'kills1000',group:'Combat',n:'Legend of the streets',d:'Defeat 1,000 enemies in a story run.',key:'kills',goal:1000},
 {id:'combo20',group:'Combat',n:'On a roll',d:'Defeat 20 enemies in one combo in a story run.',key:'bestCombo',goal:20},
 {id:'ultimate',group:'Combat',n:'Unleashed',d:'Use an ultimate.',key:'event',goal:1},
 {id:'reaction',group:'Combat',n:'Chain reaction',d:'Trigger an elemental reaction or resonance.',key:'event',goal:1},
 {id:'interrupt',group:'Combat',n:'Not so fast',d:'Interrupt an enemy with an upgraded shield.',key:'event',goal:1},
 {id:'level10',group:'Progression',n:'Finding your feet',d:'Reach level 10 in a story run.',key:'lvl',goal:10},
 {id:'level25',group:'Progression',n:'Seasoned',d:'Reach level 25 in a story run.',key:'lvl',goal:25},
 {id:'weapon2',group:'Progression',n:'Getting sharper',d:'Upgrade a weapon or signature to tier 2 in a story run.',key:'weapon',goal:2},
 {id:'weapon5',group:'Progression',n:'Fully armed',d:'Upgrade a weapon or signature to tier 5 in a story run.',key:'weapon',goal:5},
 {id:'boon',group:'Progression',n:'A little help',d:'Choose a checkpoint boon.',key:'event',goal:1},
 {id:'revive',group:'Teamwork',n:'Back on your feet',d:'Revive another player. Multiplayer.',key:'revive',goal:1},
 {id:'partyBoss',group:'Teamwork',n:'Together we stand',d:'Clear a story boss with a party. Multiplayer.',key:'partyBoss',goal:1},
 {id:'teamAbility',group:'Teamwork',n:'Know your role',d:'Use your team ability.',key:'event',goal:1},
 {id:'link',group:'Teamwork',n:'In sync',d:'Link ultimates with another player. Multiplayer.',key:'event',goal:1},
 {id:'teamReaction',group:'Teamwork',n:'Better together',d:'Trigger a reaction with another player. Multiplayer.',key:'event',goal:1},
 {id:'healAlly',group:'Teamwork',n:'Healing hands',d:'Heal an ally with an upgraded healing weapon. Multiplayer.',key:'event',goal:1},
 {id:'freeWeb',group:'Teamwork',n:'Cut loose',d:'Free another player from a web. Multiplayer.',key:'event',goal:1},
 {id:'egg',group:'Encounters',n:'Pest control',d:'Destroy an egg sac before it hatches.',key:'event',goal:1},
 {id:'pillar',group:'Encounters',n:'Pillar breaker',d:'Break a boss arena pillar.',key:'event',goal:1},
 {id:'scrap',group:'Encounters',n:'Scrap collector',d:'Help destroy a disabled Scrap Golem.',key:'event',goal:1},
 {id:'wave1',group:'The Swarm',n:'First wave',d:'Clear wave 1 in the Swarm.',key:'swarmBest',goal:1},
 {id:'wave5',group:'The Swarm',n:'Holding the line',d:'Clear wave 5 in the Swarm.',key:'swarmBest',goal:5},
 {id:'wave10',group:'The Swarm',n:'Against the tide',d:'Clear wave 10 in the Swarm.',key:'swarmBest',goal:10},
 {id:'wave20',group:'The Swarm',n:'Unbreakable',d:'Clear wave 20 in the Swarm.',key:'swarmBest',goal:20},
 {id:'wave30',group:'The Swarm',n:'Still standing',d:'Clear wave 30 in the Swarm.',key:'swarmBest',goal:30}
];
function achievementNotice(p,id){} // Browser and server supply their own presentation.
function achievementValue(p,a){if((p.achievements||{})[a.id])return a.goal;if(a.key==='weapon')return Math.max(0,...Object.keys(p.weaponUpgrades||{}).map(id=>upgradeLevel(p,id)));if(a.key==='event'||a.key==='revive'||a.key==='partyBoss')return 0;return Math.max(0,Number(p[a.key])||0)}
function achievementStore(p){if(G.mp||G.demo)return;try{let all=JSON.parse(localStorage.getItem('dayrim-achievements')||'{}');if(!all||typeof all!=='object'||Array.isArray(all))all={};all[p.char]=p.achievements;localStorage.setItem('dayrim-achievements',JSON.stringify(all))}catch(e){}}
function achievementUnlock(p,id,notify=true){if(G.demo||!ACHIEVEMENTS.some(a=>a.id===id)||p.achievements[id])return false;p.achievements[id]=true;if(notify)achievementNotice(p,id);achievementStore(p);return true}
function achievementCheck(p,notify=true){for(const a of ACHIEVEMENTS)if((!notify||!G.swarm||a.key==='swarmBest')&&achievementValue(p,a)>=a.goal)achievementUnlock(p,a.id,notify)}
function achievementInit(p,solo=false){const saved=p.achievements&&typeof p.achievements==='object'&&!Array.isArray(p.achievements)?p.achievements:{};let local={};if(solo)try{local=JSON.parse(localStorage.getItem('dayrim-achievements')||'{}')[p.char]||{};p.swarmBest=Math.max(p.swarmBest||0,JSON.parse(localStorage.getItem('dayrim-swarm-best')||'{}')[p.char]||0)}catch(e){}if(!local||typeof local!=='object'||Array.isArray(local))local={};p.achievements={};for(const a of ACHIEVEMENTS)if(saved[a.id]===true||local[a.id]===true)p.achievements[a.id]=true;achievementCheck(p,false);if(solo)achievementStore(p)}
const STAGES=[
 {n:'Sunrise Hollow',h:6,boss:'Crystal Scurrier',ah:96,r:30,biome:0},
 {n:'Noonshade Thicket',h:11,boss:'Gloom Eye',ah:100,r:30,biome:1,thicket:9},
 {islands:8,n:'Duskwater Fen',h:17,boss:'Banshee Phantasm',ah:124,r:30,biome:2},
 {n:'Webbed Barrow',h:21,boss:'Chitin Horror',ah:112,r:38,biome:3},
 {n:'Sporefall Marsh',h:5,boss:'Spore Brute',ah:130,r:40,biome:2},
 {n:'Ruined Vale',h:10,boss:'Flesh Amalgam',ah:136,r:38,biome:1},
 {n:'Rustleaf Woods',h:18,boss:'Rusted Ghoul',ah:140,r:36,biome:4},
 {n:'Midnight Warrens',h:23,boss:'Cyber Dread',ah:136,r:38,biome:3},
 {n:'Blightmoor',h:2,boss:'Void Weaver',ah:150,r:36,biome:5},
 {n:'The Last Night',h:0,boss:'Nameless King',label:'???',ah:176,r:46,biome:5}
];
const BIOMES=[{g:['#4f8a3f','#5a9a48','#47803a'],d:'#8a7650',w:['#3a3a34','#4a4a42','#22251f'],leaf:['#2f7a3f','#3f9048','#2a6a3a'],wa:['#3d7486','#4a879a','#a8dce4'],flower:['#f0e070','#f08ab0','#e8f0f0']},
 {g:['#5d8f3c','#68a044','#537f36'],d:'#94805a',w:['#4a4438','#5c5546','#2a261f'],leaf:['#3f8a38','#56a040','#2f7030'],wa:['#3f7f8e','#4f93a2','#b4e4e8'],flower:['#f8d048','#ff8a50','#f0f0d0']},
 {g:['#3e6a48','#477850','#355c40'],d:'#5f5a40',w:['#2f3a36','#3e4a44','#1a2220'],leaf:['#2a5f48','#3a7a58','#20503c'],wa:['#2f5a52','#3a6a60','#88b8a8'],flower:['#a0e0d0','#d0a0e8','#e8e8a0']},
 {g:['#3c5238','#465e40','#334830'],d:'#58503c',w:['#2c2c34','#3a3a44','#18181e'],leaf:['#284c34','#346040','#1f3e2a'],wa:['#2c4450','#36525e','#7aa0a8'],flower:['#b0a0d8','#d8d8e8','#90c0c0']},
 {g:['#7a7038','#8a7f42','#6a6030'],d:'#7a5e3c',w:['#4a3c30','#5c4c3c','#2a211a'],leaf:['#a8682a','#c88a30','#8a4a24'],wa:['#3c5e66','#4a6e74','#a8c8c0'],flower:['#f0a040','#e05a30','#f0e090']},
 {g:['#3a3648','#443f54','#30293c'],d:'#4c4050',w:['#26222f','#352f40','#14111a'],leaf:['#3a2f5a','#4c3a70','#2c2448'],wa:['#3a3460','#463f72','#9a8ad8'],flower:['#c080ff','#70e0c0','#ff70a0']}];
const SLOTS=['armor','clothes','tool'];
const BASES={armor:['Kevlar Vest','Riot Plate','Leather Guard','Steel Plate','Ceramic Vest'],clothes:['Trench Coat','Hoodie','Tracksuit','Work Jacket','Black Suit','Running Shoes'],tool:['Flashlight','Wrench Set','Police Radio','Lockpicks','Tool Belt','Field Kit']};
const PRE=['Rusted','Blessed','Night-Worn','Scarred','Cursed','Polished','Back-Alley','Midnight','Reinforced','Custom'];
const SUF=['of the Alley','of Last Call','of the Precinct','of the Ninth Ward','of Black Rain','of the Underpass','of Neon Row','of Dawn Patrol'];
const AFF={dmg:{l:'damage',v:i=>1+i*.8,w:3,f:v=>'+'+v.toFixed(0)},hp:{l:'life',v:i=>6+i*4,w:.55,f:v=>'+'+v.toFixed(0)},armor:{l:'armor',v:i=>2+i*1.3,w:2,f:v=>'+'+v.toFixed(0)},crit:{l:'crit',v:i=>.012+Math.min(.04,i*.003),w:120,f:v=>'+'+(v*100).toFixed(1)+'%'},speed:{l:'speed',v:i=>3+Math.min(10,i*.6),w:1.1,f:v=>'+'+v.toFixed(0)},leech:{l:'life per hit',v:i=>.3+i*.1,w:9,f:v=>'+'+v.toFixed(1)},regen:{l:'mana/sec',v:i=>.5+i*.12,w:6,f:v=>'+'+v.toFixed(1)},mana:{l:'mana',v:i=>5+i*2.2,w:.5,f:v=>'+'+v.toFixed(0)}};
const RAR=[{n:'Common',c:'#d9d4c2'},{n:'Uncommon',c:'#7cc7f2'},{n:'Rare',c:'#e8c95c'},{n:'Legendary',c:'#ff8f6b'}];
const SKILLS=[
 {id:'power',n:'Melee Training',d:'+8% melee, shield and healing-weapon damage per rank',max:15},
 {id:'aim',n:'Marksmanship',d:'+8% ranged-weapon damage per rank',max:15},
 {id:'spell',n:'Spellcraft',d:'+10% spell and signature-move damage per rank',max:15},
 {id:'guard',n:'Shield Drill',d:'+12% armor while shielding',max:10},
 {id:'mend',n:'First Aid',d:'+10% self-healing from E and healing weapons per rank',max:10},
 {id:'tough',n:'Toughness',d:'+6% maximum life',max:15},
 {id:'foot',n:'Footwork',d:'+2% move speed',max:10},
 {id:'focus',n:'Focus',d:'+1 mana per second',max:10},
 {id:'crit',n:'Precision',d:'+1.5% critical chance',max:10},
 {id:'leech',n:'Second Wind',d:'+0.5 life per hit',max:10}
];
const GYM=[{id:'str',n:'Strength drills',d:'+2 base damage'},{id:'end',n:'Endurance run',d:'+15 maximum life'},{id:'agi',n:'Agility course',d:'+2 move speed'}];
const SHOP=[{id:'potions',n:'Potion',d:'Heals 45% of your life',base:18},{id:'fast',n:'Fast Pill',d:'40% faster for 20 seconds',base:30},{id:'magic',n:'Magic Pill',d:'50% more damage for 20 seconds',base:40}];
const QUIPS=['Stay safe out there!','Is it always like this?','Did you see that?!','Thank goodness you are here.','Traffic is awful today.','Coffee? No time?','Nice boots.','I saw something by the plaza.'];
const stageScale=s=>Math.pow(1.38,s-1),recLevel=s=>s*3,quota=s=>Math.ceil((8+(s-1)*4)*partyScale().quota);
/* Enemy health is set in hits, not in a number that runs away from the player: a weak minion
   takes REC_HITS hits from a player at the stage's recommended level, at every stage. The unit
   keeps the old "55 per stage" slot so every archetype keeps the ratio it was tuned with. */
const REC_HITS=2.2;
/* Later tiers add measured power without growing swings into a full circle. */
const MELEE_UP=[1,1.2,1.5,1.7,1.9,2.1],MELEE_REACH_STEP=12,MELEE_ARC_STEP=.25;
const meleeReach=(w,n)=>w.reach+Math.min(n,3)*MELEE_REACH_STEP,meleeArc=n=>1.1+Math.min(n,2)*MELEE_ARC_STEP;
const PIERCING_WEAPONS=new Set(['pistol','bow']);
const GUN_UP=[{angles:[0],damage:1},{angles:[-.18,0,.18],damage:.4},{angles:[-.36,-.18,0,.18,.36],damage:.3},{angles:[-.36,-.18,0,.18,.36],damage:.34},{angles:[-.36,-.18,0,.18,.36],damage:.38},{angles:[-.36,-.18,0,.18,.36],damage:.42}];
const SPELL_UP=[{angles:[0],damage:1,blast:44},{angles:[-.18,0,.18],damage:.45,blast:56},{angles:[-.36,0,.36],damage:.45,blast:68},{angles:[-.36,0,.36],damage:.5,blast:72},{angles:[-.36,0,.36],damage:.55,blast:76},{angles:[-.36,0,.36],damage:.6,blast:80}];
const recDamage=s=>11+2.6*recLevel(s);
const mobUnit=s=>recDamage(s)*REC_HITS/.6;
/* Enemy damage is set in hits to down a player at the recommended level, like enemy life is set in hits to kill. The old curve left 20 or more weak hits on early stages. Later stages keep the old curve where it is already harsher. Life and armor follow recalc. */
const WEAK_HITS_TO_DOWN=[10,8,7];
const mobHit=s=>{const L=recLevel(s),hp=95+L*18,ar=L*1.6,hits=WEAK_HITS_TO_DOWN[Math.min(s,WEAK_HITS_TO_DOWN.length)-1];return Math.max(11*Math.pow(1.36,s-1),hp/((1-ar/(ar+60))*.7*hits))};
const bossHp=s=>3600*Math.pow(1.47,s-1),bossDmg=s=>36*Math.pow(1.33,s-1);
const xpNeed=l=>Math.round(34*Math.pow(1.17,l-1));

/* How each monster moves. step: leg lift, legV: where legs begin (0 top, 1 bottom), rate: step speed, bob: body bounce,
   float: hover height, wave/waveK: cloth ripple, radial: outer-edge writhing, arms: arm raise, jerk: robotic stepped timing */
const BOSS_STYLE={
 skitter:{step:5,legV:.42,rate:2.4,bob:1.5,arms:5,jitter:1.1},
 tentacle:{float:7,radial:7,rate:1,arms:0},
 ghost:{float:6,wave:8,waveK:7,arms:10,rate:1},
 heavy:{step:9,legV:.62,rate:1,bob:3.5,arms:15,sway:.035},
 knight:{step:7,legV:.6,rate:1.15,bob:2.2,arms:17,sway:.02},
 mech:{step:6,legV:.55,rate:1.5,bob:2,arms:11,jerk:.09},
 king:{float:3,wave:6,waveK:5,radial:3,arms:13,rate:1}
};
const STYLE_OF={Skeleton:'knight','Bone Goliath':'heavy',Voidling:'skitter','Void Goliath':'heavy','Toxin Grunt':'knight','Toxin Enforcer':'heavy','Crystal Scurrier':'skitter','Gloom Eye':'tentacle','Banshee Phantasm':'ghost','Chitin Horror':'skitter','Spore Brute':'heavy','Flesh Amalgam':'heavy','Rusted Ghoul':'knight','Cyber Dread':'mech','Void Weaver':'ghost','Nameless King':'king'};
const BOSS_RATE=e=>BOSS_STYLE[STYLE_OF[e.art]].rate*.75;
/* ---------- State ---------- */
let G,W=800,H=500,dpr=1,zoom=1,touchMode=false,chosen='Detective',selTab='hero',menuTab='skills',confirmNew=false,swarmPick=false;
const keys=new Set(),mouse={x:0,y:0,left:false,right:false},joy={on:false,id:null,ox:0,oy:0,dx:0,dy:0},touchHold={slash:false};
const mini=document.createElement('canvas');mini.width=MW;mini.height=MH;const mctx=mini.getContext('2d');
try{const c=localStorage.getItem('dayrim-char');if(c&&archKey(c)){chosen=c;selTab=factionOf(c)}}catch(e){}
function readSave(){try{const r=JSON.parse(localStorage.getItem('dayrim-save')||'null');return r&&archKey(r.char)?r:null}catch(e){return null}}
/* Starting a Swarm run builds a character and enters a stage, which would normally save. Hold saves until the run is marked. */
let saveHold=false;
function writeSave(){if(!G||G.demo||G.mp||G.swarm||saveHold)return;const p=G.p;try{localStorage.setItem('dayrim-save',JSON.stringify({char:p.char,lvl:p.lvl,xp:p.xp,gold:p.gold,potions:p.potions,fast:p.fast,magic:p.magic,gear:p.gear,bag:p.bag,weapons:p.weapons,weapon:p.weapon,skills:p.skills,train:p.train,sp:p.sp,kills:p.kills,rage:p.rage,bestCombo:p.bestCombo,stage:G.stage,runBoons:p.runBoons,weaponUpgrades:p.weaponUpgrades,achievements:p.achievements,secondWind:!!p.secondWind,maxStage:p.maxStage,beaten:p.beaten}))}catch(e){}}
function clearSave(){try{localStorage.removeItem('dayrim-save')}catch(e){}}

/* ---------- Audio ---------- */
let ac=null,muted=false;
const SFX={slash:[240,90,.07,'sawtooth'],hit:[150,70,.06,'square'],bolt:[540,170,.18,'sine'],loot:[660,1020,.16,'triangle'],hurt:[120,55,.16,'sawtooth'],level:[440,920,.35,'triangle'],dash:[280,720,.1,'sine'],pull:[90,300,.3,'sine'],boom:[110,40,.3,'square'],shot:[900,300,.06,'square']};
function sfx(n){if(muted||!ac)return;if(typeof playAsset==='function'&&playAsset(n))return;try{const [a,b,d,t]=SFX[n],o=ac.createOscillator(),g=ac.createGain(),now=ac.currentTime;o.type=t;o.frequency.setValueAtTime(a,now);o.frequency.exponentialRampToValueAtTime(b,now+d);g.gain.setValueAtTime(.04,now);g.gain.exponentialRampToValueAtTime(.001,now+d);o.connect(g).connect(ac.destination);o.start(now);o.stop(now+d)}catch(e){}}
function audioOn(){if(ac){if(ac.state==='suspended')ac.resume();return}try{ac=new (window.AudioContext||window.webkitAudioContext)();loadVoices();if(typeof loadSounds==='function')loadSounds()}catch(e){}}

/* ---------- Items ---------- */
function makeItem(slot,ilvl,rar,owner){
  const base=pick(BASES[slot]),aff={},j=()=>rnd(.85,1.15);
  if(slot==='armor'){aff.hp=(8+ilvl*7)*j();aff.armor=(2+ilvl*2)*j()}
  if(slot==='clothes'){aff.hp=(4+ilvl*3.5)*j();aff.speed=(2+ilvl*.5)*j()}
  if(slot==='tool'){aff.mana=(6+ilvl*2.5)*j();aff.crit=(.01+ilvl*.002)*j()}
  Object.keys(AFF).sort(()=>Math.random()-.5).slice(0,rar).forEach(k=>{aff[k]=(aff[k]||0)+AFF[k].v(ilvl)*rnd(.75,1.25)});
  let name=base;if(rar===0)name='Worn '+base;if(rar===1)name=pick(PRE)+' '+base;if(rar>=2)name=pick(PRE)+' '+base+' '+pick(SUF);
  if(owner)name=owner+"'s "+(rar===0?base:rar===1?name:pick(PRE)+' '+base);
  return{slot,rar,name,aff,ilvl,score:Object.entries(aff).reduce((s,[k,v])=>s+v*AFF[k].w,0)};
}
const rollRarity=b=>{const r=Math.random()-b;return r<.006?3:r<.04?2:r<.22?1:0};
const itemInfo=it=>Object.entries(it.aff).map(([k,v])=>AFF[k].f(v)+' '+AFF[k].l).join(', ');
const salvage=it=>Math.max(2,Math.round(it.score*.25*(it.rar+1)));

/* ---------- City generation ---------- */
/* Procedural wilderness: cellular-automata cliffs, carved clearings joined by winding trails, then scattered vegetation. */
function genCity(){
  const N=MW*MH,map=new Uint8Array(N),ground=new Uint8Array(N),deco=new Uint8Array(N),bld=new Uint8Array(N),props=[],lamps=[];
  for(let i=0;i<N;i++){map[i]=Math.random()<.43?1:0;deco[i]=Math.random()*255}
  const border=(x,y)=>x<2||y<2||x>=MW-2||y>=MH-2;
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++)if(border(x,y))map[idx(x,y)]=1;
  for(let it=0;it<4;it++){const n=map.slice();for(let y=1;y<MH-1;y++)for(let x=1;x<MW-1;x++){let c=0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)c+=map[idx(x+a,y+b)];n[idx(x,y)]=(c>=5||border(x,y))?1:0}map.set(n)}
  const open=(x,y,g)=>{if(x>1&&y>1&&x<MW-2&&y<MH-2){map[idx(x,y)]=0;if(g!==undefined)ground[idx(x,y)]=g}};
  const blob=(cx,cy,rx,ry,g)=>{for(let y=cy-ry-2;y<=cy+ry+2;y++)for(let x=cx-rx-2;x<=cx+rx+2;x++){const d=((x-cx)/rx)**2+((y-cy)/ry)**2+rnd(-.12,.12);if(d<1)open(x,y,g)}};
  const trail=(ax,ay,bx,by)=>{let x=ax,y=ay,s=0;while((Math.abs(x-bx)>1||Math.abs(y-by)>1)&&s++<500){if(Math.random()<.7){if(Math.abs(x-bx)>Math.abs(y-by))x+=Math.sign(bx-x);else y+=Math.sign(by-y)}else{x+=irnd(-1,1);y+=irnd(-1,1)}x=clamp(x,3,MW-4);y=clamp(y,3,MH-4);for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if(Math.abs(a)+Math.abs(b)<2||Math.random()<.5)open(x+a,y+b,1)}};
  const s={x:irnd(8,11),y:irnd(9,MH-10)},e={x:irnd(MW-12,MW-9),y:irnd(9,MH-10)},nodes=[s];const mids=irnd(4,6);
  for(let i=0;i<mids;i++)nodes.push({x:Math.round(s.x+(e.x-s.x)*(i+1)/(mids+1)+rnd(-4,4)),y:irnd(7,MH-8)});nodes.push(e);
  nodes.forEach((n,i)=>{const start=i===0,last=i===nodes.length-1;blob(n.x,n.y,start||last?8:irnd(4,7),start||last?6:irnd(3,5),start||last?2:undefined);if(i)trail(nodes[i-1].x,nodes[i-1].y,n.x,n.y)});
  for(let i=0;i<4;i++){const a=pick(nodes),bx=clamp(a.x+irnd(-14,14),6,MW-7),by=clamp(a.y+irnd(-12,12),6,MH-7);blob(bx,by,irnd(3,5),irnd(2,4));trail(a.x,a.y,bx,by)}
  // keep only ground that can be walked to from the start
  const seen=new Uint8Array(N),q=[idx(s.x,s.y)];seen[q[0]]=1;for(let h=0;h<q.length;h++){const c=q[h];for(const n of[c-1,c+1,c-MW,c+MW])if(n>=0&&n<N&&!map[n]&&!seen[n]){seen[n]=1;q.push(n)}}
  for(let i=0;i<N;i++)if(!seen[i])map[i]=1;
  // shallow ponds you can wade through; where the path crosses one, it becomes a wooden bridge
  const pond=(cx,cy,rx,ry)=>{for(let y=cy-ry-1;y<=cy+ry+1;y++)for(let x=cx-rx-1;x<=cx+rx+1;x++){if(x<2||y<2||x>=MW-2||y>=MH-2)continue;const i=idx(x,y),d=((x-cx)/rx)**2+((y-cy)/ry)**2+rnd(-.15,.15);if(d<1&&!map[i]&&ground[i]!==2)ground[i]=ground[i]===1?4:3}};
  {const mids=nodes.slice(1,-1);if(mids.length){const n=pick(mids);pond(n.x,n.y,irnd(2,4),irnd(2,3))}
   for(let k=irnd(1,3);k>0;k--){for(let t=0;t<30;t++){const x=irnd(4,MW-5),y=irnd(4,MH-5);if(!map[idx(x,y)]&&Math.hypot(x-s.x,y-s.y)>10&&Math.hypot(x-e.x,y-e.y)>10){pond(x,y,irnd(2,4),irnd(1,3));break}}}}
  const biome=BIOMES[STAGES[((G&&G.stage)||1)-1].biome];
  const put=(t,x,y,v)=>props.push({t,x:(x+rnd(.1,.9))*T,y:(y+rnd(.1,.9))*T,v});
  for(let y=1;y<MH-1;y++)for(let x=1;x<MW-1;x++){const i=idx(x,y),d=deco[i],nearWall=map[idx(x-1,y)]||map[idx(x+1,y)]||map[idx(x,y-1)]||map[idx(x,y+1)];
    if(map[i]){if(map[idx(x,y+1)]===1&&d<34)put('tree',x,y,d%3);continue}
    if(ground[i])continue;
    if(nearWall&&d<54)put(d%3?'shrub':'tree',x,y,d%3);
    else if(d<26)put('shrub',x,y,d%3);else if(d<58)put('grass',x,y,d%3);else if(d<70)put('fern',x,y,d%3);else if(d<78)put('flower',x,y,d%3);else if(d<82)put('mush',x,y,d%3);else if(d<86)put('rock',x,y,d%3)}
  // ruins and braziers in the two main clearings, torches along the way
  [s,e].forEach(n=>{for(let a=0;a<6;a++){const an=a/6*TAU,px=n.x+Math.cos(an)*6.5,py=n.y+Math.sin(an)*4.5;if(!map[idx(Math.round(px),Math.round(py))]){const l={t:a%2?'ruin':'lamp',x:(px+.5)*T,y:(py+.5)*T,v:a%3};props.push(l);if(!(a%2))lamps.push(l)}}});
  nodes.slice(1,-1).forEach(n=>{if(!map[idx(n.x,n.y)]){const l={t:'lamp',x:(n.x+.5)*T,y:(n.y+.5)*T};props.push(l);lamps.push(l)}});
  /* Stage rule: patches of tall thicket on plain ground. Seeded like the rest of the map, so client and server agree. */
  const thicket=new Uint8Array(N),cover=[];
  for(let k=STAGES[((G&&G.stage)||1)-1].thicket||0;k>0;k--){let c=null;for(let t=0;t<30&&!c;t++){const x=irnd(5,MW-6),y=irnd(4,MH-5);if(!map[idx(x,y)]&&!ground[idx(x,y)]&&Math.hypot(x-s.x,y-s.y)>10&&Math.hypot(x-e.x,y-e.y)>8)c={x,y}}if(!c)continue;
    const rx=irnd(3,5),ry=irnd(2,4);for(let y=Math.max(2,c.y-ry-1);y<=Math.min(MH-3,c.y+ry+1);y++)for(let x=Math.max(2,c.x-rx-1);x<=Math.min(MW-3,c.x+rx+1);x++){const i=idx(x,y);if(map[i]||ground[i]||thicket[i]||((x-c.x)/rx)**2+((y-c.y)/ry)**2+rnd(-.2,.2)>=1)continue;thicket[i]=1;cover.push(i);for(let b=0;b<3;b++)put('thicket',x,y,b)}}
  /* Stage rule (C-24): dry islands that stay above the rising water. */
  const isle=new Uint8Array(N);
  for(let k=STAGES[((G&&G.stage)||1)-1].islands||0;k>0;k--){let c=null;for(let t=0;t<30&&!c;t++){const x=irnd(5,MW-6),y=irnd(4,MH-5);if(!map[idx(x,y)]&&!ground[idx(x,y)])c={x,y}}if(!c)continue;
    const rx=irnd(2,3),ry=irnd(1,2);for(let y=Math.max(2,c.y-ry);y<=Math.min(MH-3,c.y+ry);y++)for(let x=Math.max(2,c.x-rx);x<=Math.min(MW-3,c.x+rx);x++){const i=idx(x,y);if(!map[i]&&!ground[i]&&((x-c.x)/rx)**2+((y-c.y)/ry)**2<=1.1)isle[i]=1}}
  const openList=[];for(let i=0;i<N;i++)if(!map[i])openList.push(i);
  mctx.fillStyle='#14181c';mctx.fillRect(0,0,MW,MH);
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const i=idx(x,y);if(map[i])continue;mctx.fillStyle=thicket[i]?biome.leaf[0]:ground[i]===1?biome.d:ground[i]===2?'#a89a7c':ground[i]===3?biome.wa[1]:ground[i]===4?'#7a5a38':biome.g[0];mctx.fillRect(x,y,1,1)}
  return{map,ground,deco,bld,props,lamps,thicket,cover,isle:STAGES[((G&&G.stage)||1)-1].islands?isle:null,cars:[],open:openList,biome,start:{x:s.x-6,y:s.y-5},boss:{x:e.x-6,y:e.y-5},flow:new Int16Array(N),queue:new Int32Array(N)};
}
const wall=(tx,ty)=>tx<0||ty<0||tx>=MW||ty>=MH||G.w.map[idx(tx,ty)]===1;
function blocked(x,y,r){const a=r*.8;return wall((x-a)/T|0,(y-a)/T|0)||wall((x+a)/T|0,(y-a)/T|0)||wall((x-a)/T|0,(y+a)/T|0)||wall((x+a)/T|0,(y+a)/T|0)}
function move(e,dx,dy){let hit=false;if(!blocked(e.x+dx,e.y,e.r))e.x+=dx;else hit=true;if(!blocked(e.x,e.y+dy,e.r))e.y+=dy;else hit=true;return hit}
function los(a,b){const d=dist(a,b),n=Math.ceil(d/18);for(let i=1;i<n;i++){const t=i/n;if(wall((a.x+(b.x-a.x)*t)/T|0,(a.y+(b.y-a.y)*t)/T|0))return false}return true}
function updateFlow(){
  const {flow,queue,map}=G.w;flow.fill(-1);let h=0,t=0;for(const q of alivePlayers()){const s=idx(clamp(q.x/T|0,0,MW-1),clamp(q.y/T|0,0,MH-1));if(flow[s]<0){flow[s]=0;queue[t++]=s}}
  while(h<t){const c=queue[h++],x=c%MW,y=c/MW|0,d=flow[c];
    if(x>0){const n=c-1;if(flow[n]<0&&!map[n]){flow[n]=d+1;queue[t++]=n}}
    if(x<MW-1){const n=c+1;if(flow[n]<0&&!map[n]){flow[n]=d+1;queue[t++]=n}}
    if(y>0){const n=c-MW;if(flow[n]<0&&!map[n]){flow[n]=d+1;queue[t++]=n}}
    if(y<MH-1){const n=c+MW;if(flow[n]<0&&!map[n]){flow[n]=d+1;queue[t++]=n}}}
}
function flowAngle(e){const tx=e.x/T|0,ty=e.y/T|0;let b=Infinity,ba=null;
  [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{const nx=tx+dx,ny=ty+dy;if(wall(nx,ny))return;const f=G.w.flow[idx(nx,ny)];if(f>=0&&f<b){b=f;ba=Math.atan2((ny+.5)*T-e.y,(nx+.5)*T-e.x)}});return ba}

/* Day and night: 0 is full daylight, 1 is deep night */
function nightness(h){h=(h%24+24)%24;if(h>=8&&h<17)return 0;if(h>=17&&h<20)return(h-17)/3;if(h>=20||h<5)return 1;return 1-(h-5)/3}
function tintOf(h,n){h=(h%24+24)%24;const warm=(h>=5&&h<8)||(h>=16&&h<20);return warm&&n<.75?{c:[235,120,60],a:.16+.12*Math.sin(n*Math.PI)}:{c:[14,18,52],a:n*.62}}
const clock=h=>{h=(h%24+24)%24;const hh=h|0,m=(h-hh)*60|0;return String(hh).padStart(2,'0')+':'+String(m-(m%5)).padStart(2,'0')};

/* ---------- Stage flow ---------- */
function freshPlayer(name){return{char:name,id:1,x:0,y:0,r:13,hp:100,mana:50,lvl:1,xp:0,gold:20,potions:3+(archOf(name).potions||0),fast:1,magic:1,gear:{armor:null,clothes:null,tool:null},bag:[],weapons:weaponOf(name)==='fists'?['fists']:['fists',weaponOf(name)],weapon:weaponOf(name),weaponUpgrades:{},achievements:{},weaponHealCd:0,runBoons:{wide:0,opening:0},boonPending:false,teamCd:0,breakReady:0,tauntGuard:0,mendT:0,mendRate:0,stats:STATS[name],skills:{},train:{str:0,end:0,agi:0},sp:0,maxStage:1,beaten:0,kills:0,rage:0,bestCombo:0,combo:0,comboT:0,comboPop:0,comboTier:null,ult:null,nearSafe:false,killerT:0,deadT:0,respawnT:0,downCount:0,lastDown:-100,secondWind:false,reviveHold:0,reviveTarget:0,reviveProgress:0,cd:{slash:0,bolt:0,pull:0,dash:0,potion:0},face:0,inv:0,dashT:0,dashX:0,dashY:0,swing:0,swingA:0,walk:0,moving:false,atkT:0,pickT:0,hitT:0,castT:0,guard:false,fastT:0,magicT:0,s:{}}}
function recalc(){
  const p=G.p,sk=id=>p.skills[id]||0,s={dmg:11+p.lvl*2.6+p.train.str*2,maxHp:95+p.lvl*18+p.train.end*15,maxMana:60+p.lvl*4,armor:p.lvl*1.6,crit:.05,speed:165+p.train.agi*2,leech:0,regen:3,blast:64,dashCd:2.4,mana:0,hp:0,spellCost:16,cdMul:1-.012*(p.lvl-1)-.03*p.train.agi,guardMul:1,mendMul:1};
  Object.values(p.gear).forEach(it=>{if(!it)return;for(const k in it.aff)s[k]=(s[k]||0)+it.aff[k]});
  s.maxHp+=s.hp;s.maxMana+=s.mana;archOf(p.char).f(s);
  s.maxHp*=1+sk('tough')*.06;s.speed=Math.min(290,s.speed*(1+sk('foot')*.02));s.regen+=sk('focus');s.crit+=sk('crit')*.015;s.leech+=sk('leech')*.5;s.guardMul+=sk('guard')*.12;s.mendMul+=sk('mend')*.1;
  /* Haste: levels and Agility shorten every ability cooldown, but never past 60% of the base timer. Character quirks apply first, so the floor holds for them too. */
  s.cdMul=Math.max(.6,Math.min(1,s.cdMul));
  p.s=s;p.hp=Math.min(p.hp,s.maxHp);p.mana=Math.min(p.mana,s.maxMana);dirty();
}
function baseState(demo){return{mode:'title',demo,mp:false,players:[],t:0,hour:6,p:null,enemies:[],npcs:[],shots:[],loot:[],fx:[],texts:[],log:[],shake:0,flowT:0,banner:null,boss:null,spawnT:0,killsStage:0,stage:1,w:null,quipT:3,props:[],chain:{n:0,t:0,tier:null},link:null}}
/* Same seed gives the same map, so the server only has to send a number to draw the whole stage */
function genCitySeeded(seed){const real=Math.random;let a=seed|0;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};try{return genCity()}finally{Math.random=real}}
function placeInStage(n){const w=G.w;G.safe={x:(w.start.x+6)*T,y:(w.start.y+5)*T};G.gate={x:(w.boss.x+6)*T,y:(w.boss.y+5)*T,open:G.killsStage>=quota(n)}}
/* ---------- Stage objectives (C-18) ----------
   A stage is a short list of steps, run in order. Each step counts up to its `need`; when the last
   step is done the boss gate opens and that becomes the checkpoint. Stages that have no steps yet
   fall back to the kill quota, so every stage still finishes. */
const STAGE_STEPS={
  1:[{kind:'kill',label:'Defeat the villains'},{kind:'revive',n:1,label:'Revive the wounded scout'}],
  2:[{kind:'kill',label:'Defeat the villains'},{kind:'hold',n:3,t:5,guard:true,mark:'Beacon',label:'Light the three beacons'}],
  3:[{kind:'kill',label:'Defeat the villains'},{kind:'escort',t:60,label:'Escort the lantern boat'}],
  4:[{kind:'kill',label:'Defeat the villains'},{kind:'eggs',n:4,label:'Cut the four egg clusters'}],
  5:[{kind:'kill',label:'Defeat the villains'},{kind:'carry',n:3,label:'Carry the canisters to the vents'}],
  6:[{kind:'kill',label:'Defeat the villains'},{kind:'hold',n:2,t:3,simul:true,plate:true,mark:'Plate',label:'Hold both pressure plates'}],
  7:[{kind:'kill',label:'Defeat the villains'},{kind:'generator',n:1,label:'Carry fuel to the generator'}],
  8:[{kind:'kill',label:'Defeat the villains'},{kind:'carry',n:2,label:'Carry the lanterns to the exit'}],
  9:[{kind:'kill',label:'Defeat the villains'},{kind:'hold',n:3,t:4,simul:true,label:'Hold the three shrines'}],
  10:[{kind:'kill',n:24,label:'Survive the trials'}]
};
/* Steps keep their own parameters. hold/carry/escort spawn their props when the step starts. */
function objectiveSteps(n){
  const s=STAGE_STEPS[n];
  if(s)return s.map(x=>Object.assign({have:0},x,{need:x.kind==='kill'?(x.n||quota(n)):(x.n||1),label:x.label||''}));
  return[{kind:'kill',need:quota(n),have:0,label:'Defeat '+foeWord()}];
}
function startObjective(){const steps=objectiveSteps(G.stage);G.obj={i:0,done:false,steps};if(steps[0].kind==='kill')steps[0].have=G.killsStage;onStepStart(steps[0])}
function onStepStart(st){if(!st)return;st.have=0;
  if(st.kind==='revive'&&!G.npcs.some(c=>c.wounded))spawnScout();
  else if(st.kind==='hold')spawnZones(st.need,st.plate);
  else if(st.kind==='carry')spawnCarries(st.need);
  else if(st.kind==='generator')spawnGenerator();
  else if(st.kind==='escort')spawnEscort();
  else if(st.kind==='eggs')spawnEggs(st.need);
  if(st.label)G.banner={t:3,a:st.label,b:st.kind==='eggs'?'Attack the eggs before they hatch':st.kind==='revive'?'Hold F or Revive beside the scout':st.kind==='carry'?'Carriers cannot attack':st.kind==='generator'?'Carry fuel, then hold F / Revive':st.kind==='escort'?'Stay close to keep it moving':st.plate?'Hold both. Alone, hold each for 8s.':st.guard?'Hits on the lighter set a beacon back':'Boss gate opens when this is done'}}
function openGate(){if(!G.gate||G.gate.open)return;G.gate.open=true;G.banner={t:3,a:'Boss gate open',b:'Choose a checkpoint boon in Skills'};sfx('level');addLog('The boss gate is open.');offerBoons()}
/* Hold, carry and escort steps all spawn props: one synced list, one renderer, one set of rules. */
let propSeq=1;
function addProp(kind,x,y,r,extra){const p=Object.assign({id:propSeq++,kind,x,y,r,t:0,by:0,done:false},extra||{});G.props.push(p);return p}
function propSpot(minD,maxD){return randomOpen(minD,maxD)||{x:G.safe.x+rnd(-160,160),y:G.safe.y+rnd(-60,150)}}
const playersNear=(o,r)=>G.players.some(q=>!(q.deadT>0)&&!(q.respawnT>0)&&dist(q,o)<=r);
/* Zones must be far enough apart that holding one never holds two. */
function spawnZones(n,plate){const zs=[],SEP=320;for(let i=0;i<n;i++){let o=null;for(let t=0;t<60;t++){const c=propSpot(360,1100);if(zs.every(z=>Math.hypot(z.x-c.x,z.y-c.y)>=SEP)){o=c;break}}if(!o)o=propSpot(360,1100);zs.push(addProp(plate?'plate':'zone',o.x,o.y,40))}G.obj.zones=zs}
/* Canisters never start inside the drop zone, or they would be delivered the moment they are picked up. */
function spawnCarries(n){const ds=[];for(let i=0;i<(G.stage===5?n:1);i++){let d=propSpot(600,1300);for(let t=0;t<60&&ds.some(q=>dist(q,d)<180);t++)d=propSpot(600,1300);ds.push(addProp(G.stage===5?'vent':'drop',d.x,d.y,46))}const items=[];for(let i=0;i<n;i++){let o=propSpot(300,800);for(let t=0;t<60&&ds.some(d=>dist(o,d)<140);t++)o=propSpot(300,800);items.push(addProp('canister',o.x,o.y,11,{startX:o.x,startY:o.y}))}G.obj.drop=ds[0];G.obj.vents=G.stage===5?ds:null;G.obj.items=items}
function spawnGenerator(){const d=propSpot(600,1300);let f=propSpot(300,800);for(let t=0;t<60&&dist(f,d)<160;t++)f=propSpot(300,800);G.obj.drop=addProp('generator',d.x,d.y,46);G.obj.items=[addProp('canister',f.x,f.y,11,{startX:f.x,startY:f.y})]}
function generatorStep(st,dt){const o=G.obj,g=o.drop,c=o.items&&o.items[0];if(!g||!c)return;releaseCarries();if(!c.done){st.label='Carry fuel to the generator';return}g.by=1;st.label='Hold F / Revive to repair';if(!st.alarm){st.alarm=true;beaconAlarm(g);G.banner={t:3,a:'Repair the generator',b:'Hold F / Revive nearby; defend the repairer'}}const repair=G.players.some(p=>!(p.deadT>0||p.respawnT>0)&&dist(p,g)<70&&(G.mp?p.reviveHold>0:(keys.has('KeyF')||touchHold.revive))&&!G.players.some(q=>q!==p&&q.deadT>0&&dist(q,p)<120));if(repair)g.t=Math.min(RUST.repair,(g.t||0)+dt);if(g.t>=RUST.repair){g.done=true;st.have=1;st.met=true}}
const WEBBED={eggHatch:25,webTime:5,webberCap:2,webberCd:4};
function spawnEggs(n){const eggs=[];for(let i=0;i<n;i++){let o=propSpot(360,1100);for(let t=0;t<60&&eggs.some(e=>dist(e,o)<180);t++)o=propSpot(360,1100);eggs.push(addProp('egg',o.x,o.y,18,{t:WEBBED.eggHatch}))}G.obj.eggs=eggs}
function eggHit(e){if(e.kind!=='egg'||e.done)return false;e.done=true;achievementUnlock(G.p,'egg');text(e.x,e.y-55,'EGGS CUT','#e6e6c8',true);burst(e.x,e.y-15,'#e6e6c8',8);return true}
function eggTick(dt){for(const e of (G.obj.eggs||[])){if(e.done)continue;e.t-=dt;if(e.t<=0){e.t=WEBBED.eggHatch;const m=spawnMob(0,{x:e.x,y:e.y},false);if(m)m.aware=true;text(e.x,e.y-55,'HATCHED','#ffb080',true)}}}
function spawnWebber(){const e=spawnMob(500,null,false);if(!e)return null;e.role='webber';e.method='shoot';e.a=Object.assign({},e.a,{melee:false,atk:WEBBED.webberCd});e.aware=true;return e}
const webberDue=()=>G.stage===4&&G.enemies.filter(e=>!e.dead&&e.role==='webber').length<Math.round(WEBBED.webberCap*partyCrowd())&&spawnWebber();
function clearWeb(q,actor){if(!(q.webT>0))return;q.webT=0;if(actor&&actor!==q)achievementUnlock(actor,'freeWeb');text(q.x,q.y-70,'FREED','#e6e6c8',true)}
function webAlly(p,shape){for(const q of G.players)if(q!==p&&q.webT>0&&shape(q))clearWeb(q,p)}
function spawnEscort(){const e=addProp('escort',G.safe.x+90,G.safe.y+70,16);e.tx=G.gate.x;e.ty=G.gate.y;G.obj.escort=e}
/* A hold step either lights each zone in turn, or needs them all held at once. */
/* A hold step either lights each zone in turn, or needs them all held at once.
   A party too small to split falls back to the timed version from the design: one
   zone at a time, held longer, and it stays down once it is lit. */
/* Where the current objective actually is. One list for every step kind, so the HUD can point at it. */
function objTargets(){const o=G.obj,out=[];if(!o||o.done)return out;if(o.tg)return o.tg.map(t=>({x:t[0],y:t[1],label:t[2]}));const st=o.steps&&o.steps[o.i];if(!st)return out;
  if(st.kind==='revive'){for(const c of G.npcs)if(c.wounded&&!c.dead)out.push({x:c.x,y:c.y,label:'Scout'})}
  else if(st.kind==='hold'){for(const z of (o.zones||[]))if(!z.done)out.push({x:z.x,y:z.y,label:st.mark||'Zone'})}
  else if(st.kind==='generator'){const c=(o.items||[])[0];if(c&&!c.done&&!c.by)out.push({x:c.x,y:c.y,label:'Fuel'});else if(o.drop)out.push({x:o.drop.x,y:o.drop.y,label:'Generator'})}
  else if(st.kind==='carry'){const held=G.players.some(q=>q.carry&&!q.carry.done);
    if(held&&o.vents){for(const v of o.vents)if(!v.done)out.push({x:v.x,y:v.y,label:'Vent'})}
    else if(held&&o.drop)out.push({x:o.drop.x,y:o.drop.y,label:'Drop'});
    else for(const c of (o.items||[]))if(!c.done&&!c.by)out.push({x:c.x,y:c.y,label:'Canister'})}
  else if(st.kind==='eggs'){for(const e of o.eggs||[])if(!e.done)out.push({x:e.x,y:e.y,label:'Eggs'})}
  else if(st.kind==='escort'&&o.escort)out.push({x:o.escort.x,y:o.escort.y,label:'Boat'});
  return out}
const HOLD_ALONE_T=8;
/* How long the zone on screen needs to be held right now, for the ring on the ground. */
const zoneNeed=()=>{const o=G.obj;if(!o)return 2.5;if(o.holdNeed)return o.holdNeed;const st=o.steps[o.i];return (st&&(st.split?st.t:(st.aloneT||st.t)))||2.5};
/* Starting a beacon draws one wave at whoever is lighting it, once per beacon. */
const BEACON_WAVE=2,BEACON_KNOCK=1;
function beaconAlarm(z){for(let i=Math.round(BEACON_WAVE*partyCrowd());i>0;i--){const a=rnd(TAU),o={x:z.x+Math.cos(a)*220,y:z.y+Math.sin(a)*220},at=blocked(o.x,o.y,12)?{x:z.x,y:z.y}:o,e=spawnMob(0,at,false);if(e)e.aware=true}G.banner={t:2.4,a:'Protect the lighter',b:'Enemies are coming to the beacon'}}
/* A hit on someone lighting a beacon sets that beacon back. Rules only: an online client has no step list. */
function beaconHit(p){const o=G.obj,st=o&&!o.done&&o.steps[o.i];if(st&&st.kind==='generator'&&o.drop&&o.drop.by&&dist(p,o.drop)<70&&(G.mp?p.reviveHold>0:(keys.has('KeyF')||touchHold.revive)))o.drop.t=Math.max(0,(o.drop.t||0)-1);if(!st||!st.guard)return;for(const z of o.zones||[])if(!z.done&&z.t>0&&dist(p,z)<=60)z.t=Math.max(0,z.t-BEACON_KNOCK)}
function holdStep(st,dt){
  const zs=G.obj.zones||[];
  /* A zone lit alone stays lit, so someone joining mid-step cannot undo it: the step finishes one zone at a time. */
  if(zs.some(z=>z.done))st.alone=true;
  const split=st.simul&&!st.alone&&partySize()>=st.need;
  st.split=!!split;
  if(split){const held=zs.filter(z=>playersNear(z,60)).length;st.holdT=held>=st.need?(st.holdT||0)+dt:0;st.met=st.holdT>=st.t;st.have=held;
    for(const z of zs){z.t=st.met?st.t:st.holdT;if(st.met)z.done=true}}
  else{const need=st.simul?HOLD_ALONE_T:st.t;
    st.aloneT=need;
    for(const z of zs){if(!z.done&&playersNear(z,60)){if(st.guard&&!z.alarm){z.alarm=true;beaconAlarm(z)}z.t=Math.min(need,(z.t||0)+dt)}if((z.t||0)>=need)z.done=true}
    st.have=zs.filter(z=>z.done).length;st.met=st.have>=st.need}}
/* The escort only moves while somebody stays close. */
function escortStep(st,dt){const e=G.obj.escort;if(!e)return;if(playersNear(e,220)){const dx=e.tx-e.x,dy=e.ty-e.y,d=Math.hypot(dx,dy)||1;if(d>30){e.x+=dx/d*Math.min(54*dt,d);e.y+=dy/d*Math.min(54*dt,d);e.t+=dt}else e.done=true}st.have=e.done?1:0}
/* Anything dropped by a player who left, or a stale carrier id, is released. */
function releaseCarries(){for(const c of (G.obj&&G.obj.items)||[])if(c.by&&!G.players.some(q=>(q.id||0)===c.by&&q.carry===c&&!(q.deadT>0||q.respawnT>0)))c.by=0}
/* A wipe sends the party back to the last finished step: finished steps stay, the current one starts over. */
function resetStepState(){const o=G.obj;if(!o||o.done)return;const st=o.steps[o.i];if(!st)return;if(st.kind==='hold'){(o.zones||[]).forEach(z=>{z.t=0;z.done=false;z.alarm=false});st.holdT=0;st.have=0;st.met=false;st.alone=false}
  else if(st.kind==='carry'||st.kind==='generator'){if(st.kind==='generator'&&o.drop){o.drop.by=0;o.drop.t=0;o.drop.done=false;st.alarm=false;st.met=false;st.label='Carry fuel to the generator'}(o.items||[]).forEach(c=>{c.done=false;c.by=0;c.x=c.startX;c.y=c.startY});(o.vents||[]).forEach(v=>v.done=false);st.have=0;G.players.forEach(p=>p.carry=null)}
  else if(st.kind==='eggs'){for(const e of o.eggs||[]){e.done=false;e.t=WEBBED.eggHatch}st.have=0}
  else if(st.kind==='escort'&&o.escort){o.escort.x=G.safe.x+90;o.escort.y=G.safe.y+70;o.escort.done=false;o.escort.t=0;st.have=0}}
function objStep(dt){const o=G.obj;if(!o||o.done)return;const st=o.steps[o.i];if(!st)return;
  if(st.kind==='kill')st.have=G.killsStage;
  else if(st.kind==='revive'&&st.have<st.need&&!G.npcs.some(c=>c.wounded&&!c.dead))spawnScout();
  else if(st.kind==='hold')holdStep(st,dt||0);
  else if(st.kind==='generator')generatorStep(st,dt||0);
  else if(st.kind==='carry'){releaseCarries();st.have=(o.items||[]).filter(c=>c.done).length}
  else if(st.kind==='escort')escortStep(st,dt||0);
  else if(st.kind==='eggs'){eggTick(dt||0);st.have=(o.eggs||[]).filter(e=>e.done).length}
  /* A step is done when its own rule says so. Hold steps need the timer, not just bodies on the plates. */
  if(!(st.met!==undefined?st.met:st.have>=st.need))return;o.i++;const next=o.steps[o.i];if(!next){o.done=true;openGate()}else onStepStart(next)}
/* The wounded scout the Stage 1 objective asks for. Revived only by a player holding F beside them. */
function spawnScout(){const o=randomOpen(320,900)||randomOpen(0,2200)||{x:G.safe.x+140,y:G.safe.y+40};const hp=40*stageScale(G.stage),c={name:'Scout',x:o.x,y:o.y,r:9,dx:0,dy:1,t:0,walk:0,quip:null,qt:0,sp:0,hp,maxHp:hp,scare:0,kx:0,ky:0,flash:0,wounded:true,reviveT:0,art:'Tourist'};G.npcs.push(c);G.banner={t:3.2,a:'A scout is down',b:'Find the scout and hold F or Revive nearby'};return c}
function enterStage(n,keepKills){
  const kept=keepKills?G.killsStage:0;
  G.stage=n;G.seed=Math.random()*2147483647|0;G.w=genCitySeeded(G.seed);G.enemies=[];G.shots=[];G.loot=[];G.fx=[];G.texts=[];G.npcs=[];G.props=[];G.boss=null;G.arena=null;G.flesh=null;G.tide=0;G.tideT=0;G.valeT=VALE.first;G.chain={n:0,t:0,tier:null};G.link=null;G.killsStage=kept;G.spawnT=0;G.clearPending=0;G.hopeMax=G.mp?Math.max(3,partyScale().hope):0;G.hopeSpent=0;G.hope=G.hopeMax;
  const st=STAGES[n-1];G.hour=st.h;placeInStage(n);
  G.players.forEach((q,i)=>{q.x=G.safe.x+60-i*30;q.y=G.safe.y+30;q.combo=0;q.comboT=0;q.comboTier=null;q.ult=null;q.mv=null;q.killerT=0;q.boonPending=false;q.weaponHealCd=0;q.teamCd=0;q.breakReady=0;q.tauntGuard=0;q.mendT=0;q.deadT=0;q.respawnT=0;q.reviveHold=0;q.reviveTarget=0;q.reviveProgress=0;q.carry=null;clearEncounterStatus(q);if(!keepKills){q.secondWind=false;q.downCount=0;q.lastDown=-100}});
  G.cam={x:G.p.x,y:G.p.y};
  for(let i=0;i<12;i++)spawnNpc();
  G.villT=60;G.decals=[];G.hazards=[];
  const start=Math.round((8+n)*partyCrowd());for(let i=0;i<start;i++)useMobs()?spawnMob(380):spawnRival(380,null,null,n===1&&i===2?'Exorcist':null);
  startObjective();
  G.banner={t:3.4,a:'Stage '+n+': '+st.n,b:n===7?'Rust weakens armor at night. Find shelter.':n===6?'Watch for collapsing floor. Flank Shieldbearers.':n===5?'Spores raise toxin. Clean up at the safehouse or active vents.':(G.obj.steps[0]&&G.obj.steps[0].label)||('Defeat '+quota(n)+' '+foeWord())};
  updateFlow();dirty();writeSave();
}
/* Prototype party scaling; tune after party and human playtests. */
const PARTY_SCALE=[{difficulty:1,minion:1,count:1,quota:1,hope:0},{difficulty:2,minion:1.6,count:1.3,quota:1.4,hope:4},{difficulty:4,minion:2.2,count:1.6,quota:1.8,hope:5},{difficulty:8,minion:2.8,count:1.9,quota:2.2,hope:6}];
const partySize=()=>Math.max(1,Math.min(4,G.players.length)),partyScale=()=>PARTY_SCALE[partySize()-1],partyCrowd=()=>partyScale().count;
function enemyScale(e){const s=partyScale();return e.mob?s.minion:s.difficulty}
function partyToughen(e){const k=enemyScale(e);e.hp*=k;e.maxHp*=k;if(!e.mob)e.dmg*=partyScale().difficulty;e.partyLife=k;e.partyDamage=e.mob?1:partyScale().difficulty;return e}
function offerBoons(){for(const p of G.players){const b=p.runBoons||{};if((b.wide||0)<3||(b.opening||0)<3)p.boonPending=true}addLog('Checkpoint choice ready: open Skills.')};
function rescaleParty(){if(G.mp){const max=Math.max(3,partyScale().hope);G.hopeMax=max;G.hope=Math.max(0,max-(G.hopeSpent||0))}for(const e of G.enemies){if(e.dead)continue;const life=enemyScale(e),damage=e.mob?1:partyScale().difficulty;e.hp*=life/(e.partyLife||1);e.maxHp*=life/(e.partyLife||1);e.dmg*=damage/(e.partyDamage||1);e.partyLife=life;e.partyDamage=damage}if(G.gate&&!G.gate.open&&G.obj&&G.obj.done)openGate();}
const alivePlayers=()=>{const a=G.players.filter(q=>!(q.deadT>0)&&!(q.respawnT>0));return a.length?a:G.players};
function rusherTarget(e){if(e.role!=='rusher'||!e.aware)return null;const a=G.players.filter(q=>!q.deadT&&!q.respawnT&&dist(q,e)<600&&['shooter','medic'].includes(archKey(q.char)));return a.sort((a,b)=>dist(a,e)-dist(b,e))[0]||null}
function nearestPlayer(o){let b=null,bd=Infinity;for(const q of alivePlayers()){const d=dist(q,o);if(d<bd){bd=d;b=q}}return b}
const ownerOf=s=>G.players.find(q=>q.id===s.pid)||G.players[0];
function shareXp(x){const me=G.p;for(const q of G.players){G.p=q;gainXp(x)}G.p=me}
function playerDown(p,wind=false){if(p.carry&&p.carry.kind==='canister'){p.carry.by=0;p.carry=null}p.windDown=wind;p.downCount=G.t-p.lastDown<=60?p.downCount+1:0;p.lastDown=G.t;p.deadT=wind?3:Math.max(8,20-p.downCount*5);p.respawnT=0;p.ult=null;p.mv=null;p.guard=false;p.combo=0;p.comboT=0;p.comboTier=null;p.dashT=0;p.reviveHold=0;p.reviveTarget=0;p.reviveProgress=0;p.breakReady=0;p.tauntGuard=0;p.mendT=0;p.moving=false;bleed(p.x,p.y-20,rnd(-1,1),rnd(-1,1),wind?8:16);burst(p.x,p.y-20,'#f0805c',wind?10:24,200);addLog(wind?'Second Wind: getting up in 3 seconds.':'You are down. An ally can revive you.')}
function revive(p){p.deadT=0;p.respawnT=0;p.hp=p.s.maxHp*.35;p.inv=1.5;p.moving=false;burst(p.x,p.y-20,'#6fdca0',18,120)}
function respawn(p){p.deadT=0;p.respawnT=0;p.x=G.safe.x+60;p.y=G.safe.y+30;if(G.boss&&G.arena){const a=Math.atan2(G.safe.y-G.arena.y,G.safe.x-G.arena.x);p.x=G.arena.x+Math.cos(a)*(G.arena.r-45);p.y=G.arena.y+Math.sin(a)*(G.arena.r-45)}p.hp=p.s.maxHp;p.mana=p.s.maxMana;p.inv=2;p.fastT=p.magicT=0}
function restartCheckpoint(){if(G.swarm){endSwarm();return}const gate=G.gate.open;G.enemies=[];G.shots=[];G.hazards=[];G.fx=[];G.boss=null;G.arena=null;G.flesh=null;clearLanterns();clearBossEggs();clearSporeBoss();clearGhoul();clearVale();clearScrap();for(const q of G.players)clearEncounterStatus(q);G.clearPending=0;G.spawnT=3;G.villT=60;G.hopeSpent=0;G.hope=G.hopeMax;if(!gate)G.killsStage=0;for(const [i,p] of G.players.entries()){p.deadT=0;p.respawnT=0;p.windDown=false;p.hp=p.s.maxHp;p.mana=p.s.maxMana;p.inv=3;p.dashT=0;p.ult=null;p.mv=null;p.guard=false;p.reviveHold=0;p.reviveTarget=0;p.reviveProgress=0;p.downCount=0;p.lastDown=-100;p.fastT=0;p.magicT=0;p.x=gate?G.gate.x+(i-1.5)*28:G.safe.x+60-i*30;p.y=gate?G.gate.y+100:G.safe.y+30}resetStepState();G.banner={t:4,a:'Party wiped',b:gate?'Retry from the boss gate':'Retry from the latest objective checkpoint'};writeSave()}
function bleedOut(p){p.deadT=0;p.respawnT=8;p.gold=Math.floor(p.gold*.8);p.moving=false;const wipe=G.mp&&!G.clearPending&&G.hope<=0&&!G.players.some(q=>q!==p&&q.deadT<=0&&q.respawnT<=0);if(G.mp&&G.hope>0){G.hopeSpent++;G.hope--;}addLog('You bled out and lost 20% of your gold.');if(wipe)restartCheckpoint();writeSave()}
/* Hold to revive. A downed ally comes first; with none in reach, the same key picks a wounded NPC back up. */
function updateRevive(p,dt){
  const holding=G.mp?p.reviveHold>0:(keys.has('KeyF')||touchHold.revive);p.reviveHold=Math.max(0,p.reviveHold-dt);
  const range=archKey(p.char)==='medic'?120:60;
  if(!holding){p.reviveTarget=0;p.reviveProgress=0;return}
  let q=G.players.find(x=>x.id===p.reviveTarget&&x!==p&&x.deadT>0&&dist(p,x)<=range);
  if(!q)q=G.players.filter(x=>x!==p&&x.deadT>0&&dist(p,x)<=range).sort((a,b)=>dist(p,a)-dist(p,b))[0];
  if(q){if(p.reviveTarget!==q.id)p.reviveProgress=0;p.reviveTarget=q.id;p.reviveProgress+=dt/(archKey(p.char)==='medic'?1.5:3);if(p.reviveProgress>=1){revive(q);achievementUnlock(p,'revive');threatHeal(p,q.s.maxHp*.35);p.reviveTarget=0;p.reviveProgress=0}return}
  p.reviveTarget=0;
  const c=G.npcs.find(x=>x.wounded&&!x.dead&&dist(p,x)<=Math.max(range,80));
  if(!c){p.reviveProgress=0;return}
  p.reviveProgress=Math.min(1,p.reviveProgress+dt/2.4);c.reviveT=p.reviveProgress;
  if(p.reviveProgress>=1){c.wounded=false;c.hp=c.maxHp;c.sp=rnd(34,56);text(c.x,c.y-42,'Saved','#6fdca0',true);burst(c.x,c.y-20,'#6fdca0',14,120);const st=G.obj&&G.obj.steps[G.obj.i];if(st&&st.kind==='revive')st.have++}
}
function applyInput(p){}
const foeWord=()=>factionOf(G.p.char)==='hero'?'villains':'heroes';
function newRun(name){
  G=baseState(false);G.p=freshPlayer(name);G.players=[G.p];achievementInit(G.p,true);recalc();enterStage(1);G.p.hp=G.p.s.maxHp;G.p.mana=G.p.s.maxMana;
}
function loadRun(sv){
  G=baseState(false);G.p=Object.assign(freshPlayer(sv.char),sv);G.players=[G.p];achievementInit(G.p,true);{const p=G.p;delete p.gear.weapon;p.bag=p.bag.filter(i=>i.slot!=='weapon');if(!p.weapons.includes('fists'))p.weapons.unshift('fists');if(!p.weapons.includes(p.weapon))p.weapon='fists'}recalc();enterStage(sv.stage);G.p.secondWind=!!sv.secondWind;G.p.hp=G.p.s.maxHp;G.p.mana=G.p.s.maxMana;writeSave();
}
function demoScene(){
  G=baseState(true);G.p=freshPlayer(chosen);G.players=[G.p];recalc();enterStage(1);G.p.hp=G.p.s.maxHp;G.p.mana=G.p.s.maxMana;G.hour=11;G.banner=null;
}
function addLog(html){G.log.unshift(html);G.log.length=Math.min(G.log.length,6);dirty()}
let isDirty=true;function dirty(){isDirty=true}

function randomOpen(minD,maxD){for(let i=0;i<40;i++){const c=pick(G.w.open),x=(c%MW+.5)*T,y=((c/MW|0)+.5)*T;let d=Infinity;for(const q of G.players)d=Math.min(d,Math.hypot(x-q.x,y-q.y));if(d>=minD&&d<=maxD&&dist({x,y},G.safe)>240)return{x,y}}return null}
const ENEMY_VILLAINS=['Necromancer','Void Empress','Toxin Alchemist'];
const MINIONS={Necromancer:[{n:'Skeleton',ah:62},{n:'Bone Goliath',ah:104}],'Void Empress':[{n:'Voidling',ah:60},{n:'Void Goliath',ah:108}],'Toxin Alchemist':[{n:'Toxin Grunt',ah:60},{n:'Toxin Enforcer',ah:102}]};
const useMobs=()=>factionOf(G.p.char)==='hero';
/* Section 11: one job per enemy, picked from how the character fights. */
const METHOD_ROLE={heal:'healer',shield:'guard',spell:'caster',shoot:'shooter'};
/* Weak and strong minions of the three villains */
function spawnMob(minD=500,at=null,forceStrong=null){
  const o=at||randomOpen(minD,1500);if(!o)return null;
  const s=G.stage,strong=forceStrong===null?Math.random()<.14+s*.018:forceStrong,own=pick(ENEMY_VILLAINS),m=MINIONS[own][strong?1:0],night=nightness(G.hour)>.5?1.15:1;
  const a={melee:true,range:strong?30:18,atk:strong?1.5:1.05,r:strong?20:12};
  const e={role:strong?'brute':'rusher',kind:'rival',mob:strong?'strong':'weak',owner:own,name:m.n,art:m.n,ah:m.ah,a,method:'melee',healT:9,castT:0,guarding:false,x:o.x,y:o.y,r:a.r,hp:mobUnit(s)*(strong?3.2:.6),maxHp:mobUnit(s)*(strong?3.2:.6),dmg:mobHit(s)*(strong?1.7:.7)*night,sp:(strong?60:92)*(1+s*.012),xp:9*Math.pow(1.22,s-1)*(strong?2.4:.65),gold:rnd(2,6)*Math.pow(1.22,s-1)*(strong?2.5:.6),elite:false,cd:rnd(.4,1),wind:0,ang:rnd(TAU),aware:false,flash:0,kx:0,ky:0,ph:rnd(TAU),walk:rnd(9),atkShow:0,wander:0,wa:rnd(TAU),fs:1};
  if(!strong&&G.stage===1&&G.enemies.filter(x=>x.role==='healer').length===0&&G.enemies.length>=2){e.role='healer';e.method='heal';e.a.melee=false;e.a.atk=1.8;e.healT=2}
  partyToughen(e);G.enemies.push(e);return e;
}
/* Every minute two villains walk in. They come from the far side of the player, not on top of them. */
function spawnVillainPair(){for(let i=0;i<2;i++){const e=spawnRival(620,false,null,pick(ENEMY_VILLAINS));if(e){e.hp*=2.6;e.maxHp=e.hp;e.xp*=4;e.gold*=3;e.dmg*=1.25;e.vill=true}}G.banner={t:2.6,a:'Two villains arrive',b:'Their minions came first. Now they want you.'};sfx('boom');G.npcs.forEach(c=>say(c,'villain',.25))}
function spawnRival(minD=500,elite=null,at=null,force=null){
  const o=at||randomOpen(minD,1500);if(!o)return null;
  const fac=factionOf(G.p.char)==='hero'?'villain':'hero',name=force||(useMobs()?pick(ENEMY_VILLAINS):pick(Object.keys(ROSTER[fac]))),s=G.stage,sc=stageScale(s),w=weaponOf(name),method=WEAPONS[w].m,a=Object.assign({},ARCH[ROSTER[fac][name]].e);
  a.melee=method!=='shoot'&&method!=='spell';
  if(a.melee)a.atk=Math.min(a.atk,1.3);else a.atk=method==='spell'?2.1:1.7;
  if(method==='unarmed'){a.atk*=.75;a.dmg*=.85}
  const el=elite===null?Math.random()<.06+s*.008:elite,m=el?2.5:1;
  const night=nightness(G.hour)>.5?1.15:1;
  const e={role:METHOD_ROLE[method]||(a.melee?'rusher':'shooter'),kind:'rival',name,a,w,method,healT:rnd(1,3),castT:0,guarding:false,x:o.x,y:o.y,r:a.r*(el?1.1:1),hp:mobUnit(s)*a.hp*m,maxHp:mobUnit(s)*a.hp*m,dmg:mobHit(s)*a.dmg*(el?1.3:1)*night,sp:a.sp*(1+s*.012),xp:9*Math.pow(1.22,s-1)*(el?3:1),gold:rnd(2,6)*Math.pow(1.22,s-1)*(el?3:1),elite:el,cd:rnd(.4,1),wind:0,ang:rnd(TAU),aware:false,flash:0,kx:0,ky:0,ph:rnd(TAU),walk:rnd(9),atkShow:0,wander:0,wa:rnd(TAU)};
  partyToughen(e);G.enemies.push(e);return e;
}
function spawnNpc(){const o=randomOpen(0,5000);if(!o)return;const hp=26*stageScale(G.stage);G.npcs.push({name:pick(NPC_NAMES),x:o.x,y:o.y,r:9,dx:0,dy:1,t:0,walk:rnd(9),quip:null,qt:0,sp:rnd(34,56),hp,maxHp:hp,scare:0,kx:0,ky:0,flash:0})}
/* ---------- Boss framework (C-17) ----------
   Every boss shares a guard bar, a stagger, an enrage clock, phase changes and a telegraph on every big
   attack. The numbers live here so one balance pass moves all ten bosses. */
const BOSS_GUARD_MAX=100,BOSS_STAGGER=5,BOSS_TELEGRAPH=.6,BOSS_ENRAGE_BASE=240,BOSS_ENRAGE_STEP=30,BOSS_ENRAGE_RATE=.66,BOSS_STAGGER_DMG=1.5;
const BOSS_PHASES={1:[.5],2:[.6,.25],3:[.5],4:[.6,.3],5:[.6,.3],6:[.66],7:[.5,.2]};
const BOSS_GUARD_GAIN={break:34,reaction:22,special:10,eye:30};
function bossGuard(e,amt){if(!e||e.kind!=='boss'||e.staggerT>0)return;e.guard=Math.min(e.guardMax||BOSS_GUARD_MAX,(e.guard||0)+amt);if(e.guard>=(e.guardMax||BOSS_GUARD_MAX)){e.guard=0;e.staggerT=BOSS_STAGGER;e.tel=null;e.act='walk';e.actT=BOSS_STAGGER;text(e.x,e.y-e.ah*.8,'STAGGERED','#ffd860',true);shake(8);sfx('boom');addLog('The boss is staggered.')}}
function bossTelegraph(e,kind,r,dur){e.tel={k:kind,r,r2:r,dur:Math.max(BOSS_TELEGRAPH,dur)};e.actT=e.tel.dur;return e.tel}
function bossPhaseCheck(e){if(e.kind!=='boss')return;if(e.fleshSplit){fleshAfterDamage(e);return}const th=BOSS_PHASES[e.kit||G.stage]||[];const frac=e.hp/e.maxHp;while((e.phase||0)<th.length&&frac<=th[e.phase]){e.phase=(e.phase||0)+1;G.shots=G.shots.filter(s=>s.from!=='e');const fx=BOSS_PHASE_FX[e.kit||G.stage];if(fx)fx(e);e.breatherT=2;e.act='walk';e.actT=2;e.tel=null;G.banner=(e.kit||G.stage)===7?(e.phase===1?{t:3,a:'Rust Field',b:'Shock it with the charged coil'}:{t:3,a:'Last Stand',b:'Watch the faster combo'}):(e.kit||G.stage)===6&&e.phase===1?{t:3,a:'Keep them apart',b:'Separate the bodies or they heal'}:{t:2.4,a:'Phase '+(e.phase+1),b:'It changes its attack'};shake(6);sfx('boom');burst(e.x,e.y-30,'#ffd8a0',40,240)}}
function bossEnrage(e,dt){if(e.enrageT===undefined)e.enrageT=BOSS_ENRAGE_BASE+BOSS_ENRAGE_STEP*G.stage;e.enrageT-=dt;if(e.enrageT<=0&&!e.enraged){e.enraged=true;e.cd*=.7;G.banner={t:3,a:'Enraged',b:'Its attacks come faster'};sfx('level');addLog('The boss is enraged.')}}
const bossCd=e=>e.enraged?BOSS_ENRAGE_RATE:1;
/* ---------- Stage 1: Crystal Scurrier ----------
   Skitter Rush and Shard Spray at full life; at half life it burrows, erupts under whoever holds the most
   threat, and raises two crystal pillars. While a pillar stands the boss heals, so the pillars are the
   clock: party play breaks one by hitting it within two seconds of each other, solo play by landing one
   charged move on it. */
const PILLAR_REGEN=.01,PILLAR_WINDOW=2,PILLAR_HP_FRAC=.02;
function pillarsUp(){return (G.props||[]).filter(c=>c.kind==='pillar'&&!c.done).length}
function spawnPillars(n){let made=0;for(let i=0;i<220&&made<n;i++){const c=pick(G.w.open),x=(c%MW+.5)*T,y=((c/MW|0)+.5)*T;
    if(G.props.some(q=>q.kind==='pillar'&&Math.hypot(q.x-x,q.y-y)<140))continue;
    if(G.boss&&Math.hypot(G.boss.x-x,G.boss.y-y)>300)continue;
    addProp('pillar',x,y,26);made++}
  while(made<n){const a=rnd(TAU),o=G.boss||G.p;addProp('pillar',o.x+Math.cos(a)*170,o.y+Math.sin(a)*170,26);made++}
  G.banner={t:2.6,a:'Crystal pillars',b:G.players.length===1?'A charged move breaks one':'Hit one together, within 2s'}}
function breakPillar(c){if(!c||c.done)return false;c.done=true;G.fx.push({k:'ring',x:c.x,y:c.y,r:10,to:90,t:.35,m:.35,c:'#bff0ff'});burst(c.x,c.y,'#bff0ff',26,210);shake(4);sfx('boom');text(c.x,c.y-44,'Pillar broken','#8fd6ff',true);return true}
/* A pillar only breaks on timing, never on raw damage. */
function pillarHit(c,p,charged){if(!c||c.done)return false;
  if(G.players.length===1){if(!charged){text(c.x,c.y-44,'Charged move','#8fd6ff',true);return false}const done=breakPillar(c);if(done)achievementUnlock(p,'pillar');return done}
  c.hits=(c.hits||[]).filter(h=>G.t-h.t<=PILLAR_WINDOW&&h.id!==(p.id||0));
  c.hits.push({id:p.id||0,t:G.t});
  if(c.hits.length>=2){const done=breakPillar(c);if(done)for(const h of c.hits){const q=G.players.find(q=>(q.id||0)===h.id);if(q)achievementUnlock(q,'pillar')}return done}
  text(c.x,c.y-44,'Now together','#8fd6ff',true);return false}
function bossPillarRegen(e,dt){const up=pillarsUp();if(up){e.hp=Math.min(e.maxHp,e.hp+e.maxHp*PILLAR_REGEN*up*dt);if(Math.random()<dt*2)G.fx.push({k:'ring',x:e.x,y:e.y-20,r:6,to:30,t:.3,m:.3,c:'#8fd6ff'})}}
function startBurrow(e){e.act='burrow';e.actT=1.1;e.buried=true;e.tel=null;e.moving=false;sfx('dash');burst(e.x,e.y,'#8a8478',20,150)}
function startSpray(e){e.act='spray';bossTelegraph(e,'cone',200,.65);e.ang=Math.atan2((G.p.y-e.y),(G.p.x-e.x))}
/* Shared helpers for boss attacks that hit several players. */
function bossHurtWhere(test,dmg){const me=G.p;for(const q of G.players){if(q.deadT>0||q.respawnT>0||!test(q))continue;G.p=q;hurtPlayer(dmg)}G.p=me}
const angGap=(a,b)=>Math.abs(((a-b+Math.PI)%TAU+TAU)%TAU-Math.PI);
function inBeam(e,q,a,len,w){const dx=q.x-e.x,dy=q.y-e.y,al=dx*Math.cos(a)+dy*Math.sin(a),pe=Math.abs(-dx*Math.sin(a)+dy*Math.cos(a));return al>0&&al<len&&pe<w+q.r}
/* ---------- Stage 2: Gloom Eye (C-23) ----------
   Gaze Beam sweeps, Tentacle Slam marks three circles, Blinding Pulse shrinks vision at 60%, and at 25% the beam
   sweeps back. Look Away: the gaze locks on one player, who must face away or be stunned; then its back eye opens
   for 5 s and only hits from behind it land a big guard hit. Solo: dodging through the beam also opens the eye. */
const GLOOM={beamLen:400,beamW:24,beamSweep:1.8,beamT:1.6,slamR:62,gazeT:2.2,stun:1.6,eyeT:5,blindT:5,behind:1.9};
function pickGloom(e){const r=Math.random(),ph=e.phase||0;
  if(ph>=1&&r<.16){e.act='pulse';bossTelegraph(e,'circle',190,.7);return}
  if(r<.42){const a=Math.atan2(G.p.y-e.y,G.p.x-e.x);e.beamDir=Math.random()<.5?1:-1;e.beamA=a-e.beamDir*GLOOM.beamSweep/2;e.beamTwice=false;e.act='beamAim';bossTelegraph(e,'beam',GLOOM.beamLen,.8);return}
  if(r<.66){const live=G.players.filter(q=>!(q.deadT>0||q.respawnT>0)),spots=live.slice(0,3).map(q=>({x:q.x,y:q.y}));while(spots.length<3){const a=rnd(TAU),o=spots[0]||G.p;spots.push({x:o.x+Math.cos(a)*rnd(80,160),y:o.y+Math.sin(a)*rnd(80,160)})}e.act='slam3';bossTelegraph(e,'spots',GLOOM.slamR,.85).spots=spots;return}
  if(r<.86){const t=topThreatPlayer(e)||G.p;e.gazeId=t.id||1;e.act='gaze';bossTelegraph(e,'gaze',0,GLOOM.gazeT);G.banner={t:2,a:'Look away',b:'Face away from its gaze'};return}
  e.act='call';e.actT=.5}
const eyeBehind=(e,p)=>angGap(Math.atan2(p.y-e.y,p.x-e.x),e.eyeA||0)>GLOOM.behind;
function openEye(e,a){e.eyeT=GLOOM.eyeT;e.eyeA=a;text(e.x,e.y-e.ah,'BACK EYE OPEN','#ffd860',true);sfx('level')}
/* ---------- Stage 3: Banshee Phantasm (C-25) ----------
   Wail sends a ring out with a gap to step through, Phase Drift makes her untouchable while she moves, and at half
   life Possess slows one player and drags them toward her. Lantern Anchor: she only takes damage inside lantern
   light. A lantern is lit while carried and for 8 s after it is set down; solo, it stays lit where it is set. */
const BANSHEE={wailSpeed:300,wailMax:470,wailGap:.45,wailBand:16,driftT:1.3,driftSp:260,possT:6,pull:40,lanternR:170,lanternLit:8};
function pickBanshee(e){const r=Math.random(),ph=e.phase||0;
  if(ph>=1&&r<.2){const t=topThreatPlayer(e)||G.p;e.possId=t.id||1;e.act='tether';bossTelegraph(e,'tether',0,.8);return}
  if(r<.5){e.wailGap=rnd(TAU);e.act='wail';bossTelegraph(e,'wail',120,.8);return}
  if(r<.75){const a=rnd(TAU),o=G.arena||e;e.driftTo={x:o.x+Math.cos(a)*rnd(120,260),y:o.y+Math.sin(a)*rnd(80,200)};e.act='drift';e.actT=BANSHEE.driftT;e.ghostT=BANSHEE.driftT;return}
  e.act='aim';bossTelegraph(e,'line',e.r+230,.7)}
const lanternLit=l=>!!(l.by||l.t>0);
const bossWarded=e=>e.kind==='boss'&&((e.ghostT||0)>0||((e.kit||G.stage)===3&&G.props.some(l=>l.kind==='lantern')&&!G.props.some(l=>l.kind==='lantern'&&lanternLit(l)&&dist(l,e)<BANSHEE.lanternR)));
function clearEncounterStatus(p){p.grabT=p.stunT=p.blindT=p.possT=p.webT=p.toxin=p.toxinTick=p.toxicLoad=p.loadMark=p.fallT=p.rust=p.fieldRust=0}
function clearLanterns(){G.props=G.props.filter(o=>o.kind!=='lantern');for(const q of G.players)if(q.carry&&q.carry.kind==='lantern')q.carry=null}
function spawnLanterns(){clearLanterns();const o=G.arena||G.boss||G.gate;for(const s of[-1,1]){let x=o.x+s*150,y=o.y+60;if(blocked(x,y,12)){x=o.x;y=o.y}addProp('lantern',x,y,12)}G.banner={t:3.2,a:'Lantern Anchor',b:G.players.length===1?'Carry a lantern to her and hold F to set it down':'Only lantern light lets you hurt her. Hold F to set one down'}}
function lanternTick(dt){for(const l of G.props){if(l.kind!=='lantern')continue;l.cool=Math.max(0,(l.cool||0)-dt);if(l.dropBy){const d=G.players.find(q=>(q.id||1)===l.dropBy);if(!d||dist(d,l)>40)l.dropBy=0}if(l.by){const c=G.players.find(q=>(q.id||1)===l.by);if(!c||c.carry!==l||c.deadT>0||c.respawnT>0){l.by=0;l.t=G.players.length===1?999:BANSHEE.lanternLit;if(c&&c.carry===l)c.carry=null}else{l.x=c.x;l.y=c.y}}else if(l.t>0&&l.t<900)l.t=Math.max(0,l.t-dt)}}
function lanternStep(p){const ls=G.props.filter(o=>o.kind==='lantern');if(!ls.length)return;
  if(!p.carry){const l=ls.find(l=>!l.by&&!(l.cool>0)&&l.dropBy!==(p.id||1)&&dist(p,l)<28);if(l){l.by=p.id||1;l.x=p.x;l.y=p.y;p.carry=l;text(p.x,p.y-70,'Hold F to set the lantern down','#ffe2a0',true)}return}
  const f=G.mp?p.reviveHold>0:(keys.has('KeyF')||touchHold.revive);
  if(p.carry.kind==='lantern'&&f&&!G.players.some(q=>q!==p&&q.deadT>0&&dist(q,p)<120)){const l=p.carry;l.by=0;l.t=G.players.length===1?999:BANSHEE.lanternLit;l.cool=1;l.dropBy=p.id||1;p.carry=null;text(p.x,p.y-70,'Lantern set','#ffe2a0',true)}}
/* Stage 4: the shell protects the front until the molt. */
const CHITIN={sacT:10,chargeT:1.6,chargeSp:480,stumble:3};
function shellBlock(e,p){return e.kind==='boss'&&(e.kit||G.stage)===4&&(e.phase||0)<2&&angGap(Math.atan2(p.y-e.y,p.x-e.x),e.ang)<Math.PI/2?.1:1}
function clearBossEggs(){G.props=G.props.filter(o=>!o.bossEgg)}
function spawnBossEggs(e){clearBossEggs();for(const a of [0,TAU/3,2*TAU/3]){let x=e.x+Math.cos(a)*120,y=e.y+Math.sin(a)*120;if(blocked(x,y,18)){x=e.x;y=e.y}addProp('egg',x,y,18,{t:CHITIN.sacT,bossEgg:true})}G.banner={t:3,a:'Egg sacs',b:'Burst the eggs before they hatch'}}
function bossEggTick(dt){for(const o of G.props){if(!o.bossEgg||o.done)continue;o.t-=dt;if(o.t<=0){o.done=true;const m=spawnMob(0,{x:o.x,y:o.y},false);if(m){m.aware=true;m.minion=true}text(o.x,o.y-55,'HATCHED','#ffb080',true)}}}
function pickChitin(e){if(Math.random()<.6){e.act='chitinAim';bossTelegraph(e,'line',e.r+230,.8)}else{e.act='webSpit';bossTelegraph(e,'line',400,.7)}}
/* Stage 5 boss: the load is separate from the marsh toxin meter. */
const SPORE_BOSS={loadRate:5,soloRate:2.5,shareRate:12,shareR:135,cleanRate:18,ventR:110,blastR:125,markEvery:18,regen:.008,cloudT:14,stormT:1.4};
function sporeSpot(a,r){const o=G.arena||G.boss,tx=o.x+Math.cos(a)*r,ty=o.y+Math.sin(a)*r;let best=null,bd=Infinity;for(const c of G.w.open){const x=(c%MW+.5)*T,y=((c/MW|0)+.5)*T,d=Math.hypot(x-tx,y-ty);if(d<bd&&Math.hypot(x-o.x,y-o.y)<350&&!blocked(x,y,18)){best={x,y};bd=d}}return best||{x:o.x,y:o.y}}
function clearSporeBoss(){G.props=G.props.filter(o=>!o.sporeBoss);for(const q of G.players){if(q.carry&&q.carry.kind==='purifier')q.carry=null;q.toxicLoad=0;q.loadMark=0}G.hazards=(G.hazards||[]).filter(h=>!h.bossSpore)}
function spawnSporeArena(){clearSporeBoss();for(const a of [0,Math.PI]){const o=sporeSpot(a,260);addProp('sporeVent',o.x,o.y,SPORE_BOSS.ventR,{sporeBoss:true})}if(G.players.length>1){const o=sporeSpot(Math.PI/2,190);addProp('purifier',o.x,o.y,12,{sporeBoss:true})}G.boss.loadCd=2}
function spawnMushrooms(e){for(const a of [0,TAU/3,2*TAU/3]){const o=sporeSpot(a+.7,210),m=spawnMob(0,o,false);if(!m)continue;m.role='mushroom';m.minion=true;m.aware=true;m.sp=0;m.hp*=2;m.maxHp*=2;m.xp=0;m.gold=0}}
function pickSpore(e){const r=Math.random();if((e.phase||0)>=2&&r<.3){e.act='toxicStorm';const t=bossTelegraph(e,'storm',(G.arena&&G.arena.r)||430,SPORE_BOSS.stormT);t.x=G.arena?G.arena.x:e.x;t.y=G.arena?G.arena.y:e.y;G.banner={t:1.3,a:'Toxic storm',b:'Stand in a clean zone'};return}if(r<.65){e.act='sporeCast';bossTelegraph(e,'spots',SPORE.cloudR,.8).spots=[{x:G.p.x,y:G.p.y}];return}e.act='sporeSlam';bossTelegraph(e,'circle',e.r+100,.9)}
function cleanSporeAt(q){return G.props.some(v=>v.kind==='sporeVent'&&dist(q,v)<v.r)}
function purifierTick(dt){for(const c of G.props){if(c.kind!=='purifier')continue;c.cool=Math.max(0,(c.cool||0)-dt);if(c.dropBy){const q=G.players.find(p=>(p.id||1)===c.dropBy);if(!q||dist(q,c)>40)c.dropBy=0}if(c.by){const q=G.players.find(p=>(p.id||1)===c.by);if(!q||q.carry!==c||q.deadT>0||q.respawnT>0){c.by=0;if(q&&q.carry===c)q.carry=null}else{c.x=q.x;c.y=q.y;const f=G.mp?q.reviveHold>0:(keys.has('KeyF')||touchHold.revive);if(f&&!G.players.some(p=>p!==q&&p.deadT>0&&dist(p,q)<120)){q.carry=null;c.by=0;c.cool=1;c.dropBy=q.id||1}}}else if(!c.cool){const q=G.players.find(p=>!p.carry&&!p.mv&&!p.ult&&!(p.deadT>0||p.respawnT>0)&&(p.id||1)!==c.dropBy&&dist(p,c)<28);if(q){q.carry=c;c.by=q.id||1;text(q.x,q.y-70,'Purifier: hold F to drop','#b8ec72',true)}}}}
function sporeBossTick(dt){const e=G.boss;if(!e||(e.kit||G.stage)!==5)return;if(G.players.length>1&&!G.props.some(c=>c.kind==='purifier')){const o=sporeSpot(Math.PI/2,190);addProp('purifier',o.x,o.y,12,{sporeBoss:true})}purifierTick(dt);const live=G.players.filter(p=>!(p.deadT>0||p.respawnT>0));if(!live.length)return;
  const shrooms=G.enemies.filter(m=>m.role==='mushroom'&&!m.dead).length;if(shrooms)e.hp=Math.min(e.maxHp,e.hp+e.maxHp*SPORE_BOSS.regen*shrooms*dt);
  e.loadCd=(e.loadCd||0)-dt;let mark=live.find(p=>(p.id||1)===e.loadId);if(!mark||e.loadCd<=0){mark=live.find(p=>!(p.toxicLoad>0))||live[0];e.loadId=mark.id||1;e.loadCd=SPORE_BOSS.markEvery;text(mark.x,mark.y-90,'TOXIC LOAD','#b8ec72',true)}
  for(const q of G.players)q.loadMark=q===mark?1:0;
  for(const q of live){for(const other of live){if(q===other||dist(q,other)>SPORE_BOSS.shareR)continue;const gap=(q.toxicLoad||0)-(other.toxicLoad||0);if(gap>0){const moved=Math.min(gap/2,SPORE_BOSS.shareRate*dt/(live.length-1||1));q.toxicLoad-=moved;other.toxicLoad=(other.toxicLoad||0)+moved}}}
  mark.toxicLoad=Math.min(100,(mark.toxicLoad||0)+(live.length===1?SPORE_BOSS.soloRate:SPORE_BOSS.loadRate)*dt);
  for(const q of live){if((q.carry&&q.carry.kind==='purifier')||(live.length===1&&cleanSporeAt(q)))q.toxicLoad=Math.max(0,(q.toxicLoad||0)-SPORE_BOSS.cleanRate*dt);if(q.toxicLoad>=100){q.toxicLoad=0;G.fx.push({k:'ring',x:q.x,y:q.y,r:10,to:SPORE_BOSS.blastR,t:.4,m:.4,c:'#b8ec72'});bossHurtWhere(p=>dist(p,q)<SPORE_BOSS.blastR,e.dmg*1.2);text(q.x,q.y-80,'LOAD BURST','#b8ec72',true)}}}
/* Stage 6: split health contributes to one encounter bar. A downed body starts a shared defeat window. */
const FLESH={split:.66,rejoin:.33,apart:300,heal:.012,partyWindow:10,soloWindow:20,soloSpeed:.65,graspRange:300,pull:140,bileR:75,bileT:7};
function splitFlesh(e){const life=e.maxHp*FLESH.split/2,one=sporeSpot(0,180),two=sporeSpot(Math.PI,180);e.x=one.x;e.y=one.y;e.hp=life;e.fleshSplit=true;e.fleshSide=1;e.fleshDown=false;e.fleshTotal=life*2;const b=Object.assign({},e,{x:two.x,y:two.y,hp:life,fleshSide:2,th:{},targetId:0,statusT:0,rotT:0,shatterT:0,slowT:0,brokenT:0,markT:0,exposedT:0,tauntT:0,staggerT:0,trail:[],tel:null,act:'walk',actT:2,breatherT:2,kx:0,ky:0});delete b.id;G.enemies.push(b);G.flesh={one:e,two:b,t:0};G.banner={t:3,a:'Keep them apart',b:'Separate the bodies or they heal'};}
function fleshRejoin(hp){const f=G.flesh;if(!f)return;const a=f.one,b=f.two;a.hp=Math.max(1,Math.min(a.maxHp*FLESH.rejoin,hp));a.phase=2;a.fleshSplit=false;a.fleshDown=false;a.fleshSide=0;a.fleshTotal=null;a.fleshTime=0;a.act='walk';a.actT=2;a.breatherT=2;a.tel=null;b.dead=true;G.flesh=null;G.shots=G.shots.filter(s=>s.from!=='e');G.banner={t:3,a:'Bodies rejoined',b:'Finish the Flesh Amalgam'};sfx('boom')}
function fleshAfterDamage(e){const f=G.flesh;if(!f)return;const a=f.one,b=f.two;a.fleshTotal=Math.max(0,a.hp)+Math.max(0,b.hp);if(!a.fleshDown&&!b.fleshDown&&a.hp>0&&b.hp>0&&a.fleshTotal<=a.maxHp*FLESH.rejoin)fleshRejoin(a.fleshTotal)}
function fleshDownBody(e){const f=G.flesh;if(!f||e.fleshDown)return;e.hp=0;e.fleshDown=true;e.act='walk';e.tel=null;e.moving=false;e.flash=0;e.rotT=0;if(f.one.fleshDown&&f.two.fleshDown){fleshRejoin(f.one.maxHp*FLESH.rejoin);return}f.t=G.players.length===1?FLESH.soloWindow:FLESH.partyWindow;f.one.fleshTime=f.t;f.one.fleshTotal=Math.max(0,f.one.hp)+Math.max(0,f.two.hp);G.banner={t:3,a:'One body is down',b:'Defeat the other within '+f.t+' seconds'};sfx('boom')}
function fleshTick(dt){const f=G.flesh;if(!f)return;const a=f.one,b=f.two;if(a.fleshDown||b.fleshDown){f.t=Math.max(0,f.t-dt);a.fleshTime=f.t;if(f.t<=0){const q=a.fleshDown?a:b;q.fleshDown=false;q.hp=q.maxHp*FLESH.rejoin;q.act='walk';q.actT=1;q.breatherT=1;text(q.x,q.y-q.ah,'REVIVED','#ff8f80',true);G.banner={t:2.5,a:'A body revived',b:'Bring them down together'}}}else if(dist(a,b)<FLESH.apart){for(const q of [a,b])q.hp=Math.min(q.maxHp*FLESH.rejoin,q.hp+q.maxHp*FLESH.heal*dt)}if(G.flesh)fleshAfterDamage(a)}
function startFleshGrasp(e){e.graspId=(topThreatPlayer(e)||G.p).id||1;e.act='fleshGrasp';bossTelegraph(e,'line',FLESH.graspRange,.85)}
function pickFlesh(e){if(Math.random()<.5)startFleshGrasp(e);else{e.act='fleshBile';bossTelegraph(e,'spots',FLESH.bileR,.9).spots=[{x:G.p.x,y:G.p.y}]}}
/* Stage 7: one player powers a coil while another lures the Ghoul. Solo the coil charges itself. */
const GHOUL={partyCharge:3,soloCharge:15,coilR:52,fieldRate:2,fieldMax:40,cleaveHalf:1.2,cleaveReach:115,hookPull:160,combo:3};
function clearGhoul(){G.props=G.props.filter(o=>o.kind!=='ghoulGen'&&o.kind!=='ghoulCoil');for(const q of G.players)q.fieldRust=0}
function spawnGhoulArena(){clearGhoul();const g=sporeSpot(Math.PI,230),c=sporeSpot(0,230);addProp('ghoulGen',g.x,g.y,36);addProp('ghoulCoil',c.x,c.y,GHOUL.coilR)}
function farthestLiving(e){let out=null,best=-1;for(const q of G.players){if(q.deadT>0||q.respawnT>0)continue;const d=dist(q,e);if(d>best){best=d;out=q}}return out}
function startGhoulHook(e){const q=farthestLiving(e);if(!q)return startGhoulCleave(e,false);e.hookId=q.id||1;e.ang=Math.atan2(q.y-e.y,q.x-e.x);e.act='ghoulHook';bossTelegraph(e,'ghoulHook',900,.9)}
function startGhoulCleave(e,chain){if(!chain)e.ghoulChain=0;e.act='ghoulCleave';bossTelegraph(e,'cone',e.r+GHOUL.cleaveReach,(e.phase||0)>=2?BOSS_TELEGRAPH:.9).half=GHOUL.cleaveHalf}
function pickGhoul(e){if(Math.random()<.5)startGhoulHook(e);else startGhoulCleave(e,false)}
function ghoulTick(dt){const e=G.boss;if(!e||(e.kit||G.stage)!==7)return;const live=G.players.filter(q=>!(q.deadT>0||q.respawnT>0)),g=G.props.find(o=>o.kind==='ghoulGen'),c=G.props.find(o=>o.kind==='ghoulCoil');if(!live.length||!g||!c)return;if(e.rustField)for(const q of live)q.fieldRust=Math.min(GHOUL.fieldMax,(q.fieldRust||0)+GHOUL.fieldRate*dt);const solo=live.length===1,power=!solo&&live.some(q=>dist(q,g)<70&&(G.mp?q.reviveHold>0:(keys.has('KeyF')||touchHold.revive))&&!G.players.some(x=>x!==q&&x.deadT>0&&dist(x,q)<120));g.by=power?1:0;c.t=Math.min(1,(c.t||0)+(solo?dt/GHOUL.soloCharge:power?dt/GHOUL.partyCharge:0));g.t=c.t;c.by=c.t>=1?1:0;if(c.by&&(solo||power)&&!(e.staggerT>0)&&dist(e,c)<c.r+e.r){const me=G.p;G.p=nearestPlayer(e)||me;bossGuard(e,(e.guardMax||BOSS_GUARD_MAX)-(e.guard||0));G.p=me;e.rustField=false;for(const q of G.players)q.fieldRust=0;c.t=g.t=0;c.by=0;G.fx.push({k:'ring',x:c.x,y:c.y,r:10,to:160,t:.5,m:.5,c:'#8fd6ff'});G.banner={t:2.6,a:'Generator Shock',b:'The Rust Field is cleared'};sfx('bolt')}}
/* Stage 2 and 3 boss acts. Returns true when it handled this frame. */
function bossActStage(e,dt,d,seen,p,n){const a=e.act;
  if(a==='ghoulHook'){const q=G.players.find(q=>(q.id||1)===e.hookId);if(q&&e.actT>.2)e.ang=Math.atan2(q.y-e.y,q.x-e.x);if(e.actT<=0){e.tel=null;if(q&&!(q.deadT>0||q.respawnT>0||q.inv>0)&&los(e,q)){const L=dist(q,e)||1,step=Math.min(GHOUL.hookPull,Math.max(0,L-e.r-q.r)),dx=(e.x-q.x)/L,dy=(e.y-q.y)/L;for(let left=step;left>0;){const n=Math.min(12,left);if(move(q,dx*n,dy*n))break;left-=n}const me=G.p;G.p=q;hurtPlayer(e.dmg);G.p=me}e.act='walk';e.actT=1.3;e.cd=1.3}return true}
  if(a==='ghoulCleave'){if(e.actT>.2)e.ang=Math.atan2(p.y-e.y,p.x-e.x);if(e.actT<=0){e.tel=null;bossHurtWhere(q=>dist(q,e)<e.r+GHOUL.cleaveReach+q.r&&angGap(Math.atan2(q.y-e.y,q.x-e.x),e.ang)<GHOUL.cleaveHalf,e.dmg*1.2);G.fx.push({k:'ring',x:e.x,y:e.y,r:10,to:e.r+GHOUL.cleaveReach,t:.3,m:.3,c:'#e5aa70'});sfx('slash');e.ghoulChain=(e.ghoulChain||0)+1;if((e.phase||0)>=2&&e.ghoulChain<GHOUL.combo)startGhoulCleave(e,true);else{e.act='walk';e.actT=1.3;e.cd=1.3}}return true}
  if(a==='fleshGrasp'){const q=G.players.find(q=>(q.id||1)===e.graspId);if(q&&e.actT>.2)e.ang=Math.atan2(q.y-e.y,q.x-e.x);if(e.actT<=0){e.tel=null;if(q&&!(q.deadT>0||q.respawnT>0||q.inv>0)&&dist(q,e)<FLESH.graspRange+q.r&&los(e,q)){const L=dist(q,e)||1,step=Math.min(FLESH.pull,Math.max(0,L-e.r-q.r));move(q,(e.x-q.x)/L*step,(e.y-q.y)/L*step);const me=G.p;G.p=q;hurtPlayer(e.dmg*.9);G.p=me}e.act='walk';e.actT=1.4;e.cd=1.4}return true}
  if(a==='fleshBile'){if(e.actT<=0){const spots=(e.tel&&e.tel.spots)||[];e.tel=null;for(const o of spots)G.hazards.push({x:o.x,y:o.y,r:FLESH.bileR,t:FLESH.bileT,dps:e.dmg*.3,from:'e',col:'125,180,75'});e.act='walk';e.actT=1.4;sfx('bolt')}return true}
  if(a==='sporeSlam'){if(e.actT<=0){e.tel=null;bossHurtWhere(q=>dist(q,e)<e.r+100+q.r,e.dmg*1.2);G.fx.push({k:'ring',x:e.x,y:e.y,r:10,to:e.r+100,t:.3,m:.3,c:'#b8ec72'});e.act='walk';e.actT=1.5;e.cd=1.5;sfx('boom')}return true}
  if(a==='sporeCast'){if(e.actT<=0){const spots=(e.tel&&e.tel.spots)||[];e.tel=null;for(const o of spots)G.hazards.push({x:o.x,y:o.y,r:SPORE.cloudR,t:SPORE_BOSS.cloudT,dps:e.dmg*.25,from:'e',col:'130,200,65',bossSpore:true});e.act='walk';e.actT=1.5;sfx('bolt')}return true}
  if(a==='toxicStorm'){if(e.actT<=0){e.tel=null;bossHurtWhere(q=>!cleanSporeAt(q),e.dmg*1.4);G.fx.push({k:'ring',x:e.x,y:e.y,r:20,to:(G.arena&&G.arena.r)||430,t:.5,m:.5,c:'#b8ec72'});e.act='walk';e.actT=2;sfx('boom')}return true}
  if(a==='chitinAim'){if(e.actT>.2)e.ang=Math.atan2(p.y-e.y,p.x-e.x);if(e.actT<=0){e.tel=null;e.act='chitinCharge';e.actT=CHITIN.chargeT;e.chargeHits=[];sfx('dash')}return true}
  if(a==='chitinCharge'){const dx=Math.cos(e.ang)*CHITIN.chargeSp*((e.phase||0)>=2?1.5:1)*dt,dy=Math.sin(e.ang)*CHITIN.chargeSp*((e.phase||0)>=2?1.5:1)*dt,x=e.x,y=e.y;move(e,dx,dy);let bx=Math.abs(e.x-x)<Math.abs(dx)*.5,by=Math.abs(e.y-y)<Math.abs(dy)*.5;if(G.arena){const ar=G.arena,ad=Math.hypot(e.x-ar.x,e.y-ar.y);if(ad>ar.r-e.r){const normal=Math.atan2(e.y-ar.y,e.x-ar.x);e.x=ar.x+Math.cos(normal)*(ar.r-e.r);e.y=ar.y+Math.sin(normal)*(ar.r-e.r);e.ang=2*normal+Math.PI-e.ang;bx=by=false}}if(bx)e.ang=Math.PI-e.ang;if(by)e.ang=-e.ang;bossHurtWhere(q=>{if(e.chargeHits.includes(q.id||1)||dist(e,q)>=e.r+q.r+4)return false;if(G.players.filter(v=>!(v.deadT>0||v.respawnT>0)).length===1&&q.dashT>0){e.act='walk';e.actT=CHITIN.stumble;e.staggerT=CHITIN.stumble;text(e.x,e.y-e.ah,'STUMBLED','#ffd860',true);return false}e.chargeHits.push(q.id||1);return true},e.dmg*((e.phase||0)>=2?1.6:1.15));if(e.actT<=0&&e.act==='chitinCharge'){e.act='walk';e.actT=rnd(1.4,2.2)}return true}
  if(a==='webSpit'){if(e.actT>.2)e.ang=Math.atan2(p.y-e.y,p.x-e.x);if(e.actT<=0){e.tel=null;const a=e.ang;G.shots.push({x:e.x,y:e.y-22,vx:Math.cos(a)*260,vy:Math.sin(a)*260,r:8,from:'e',life:3,dmg:e.dmg*.7,web:true,fx:'orb',col:'230,230,200',a});e.act='walk';e.actT=rnd(1.2,2)}return true}
  if(a==='beamAim'){if(e.actT<=0){e.tel=null;e.act='beam';e.actT=GLOOM.beamT;sfx('bolt')}return true}
  if(a==='beam'){e.beamA+=e.beamDir*GLOOM.beamSweep/GLOOM.beamT*dt;e.ang=e.beamA;bossHurtWhere(q=>inBeam(e,q,e.beamA,GLOOM.beamLen,GLOOM.beamW),e.dmg*.9);
    if(G.players.length===1&&!(e.eyeT>0)&&p.dashT>0&&inBeam(e,p,e.beamA,GLOOM.beamLen,GLOOM.beamW+30))openEye(e,Math.atan2(p.y-e.y,p.x-e.x));
    if(e.actT<=0){if((e.phase||0)>=2&&!e.beamTwice){e.beamTwice=true;e.beamDir*=-1;e.act='beamAim';bossTelegraph(e,'beam',GLOOM.beamLen,BOSS_TELEGRAPH)}else{e.act='walk';e.actT=rnd(1.2,2.2)}}return true}
  if(a==='slam3'){if(e.actT<=0){const sp=(e.tel&&e.tel.spots)||[];bossHurtWhere(q=>sp.some(s=>Math.hypot(q.x-s.x,q.y-s.y)<GLOOM.slamR+q.r),e.dmg*1.2);for(const s of sp){G.fx.push({k:'ring',x:s.x,y:s.y,r:10,to:GLOOM.slamR+10,t:.3,m:.3,c:'#c88cff'});burst(s.x,s.y,'#8a6aa8',10,170)}e.tel=null;shake(5);sfx('boom');e.act='walk';e.actT=rnd(1.2,2)}return true}
  if(a==='pulse'){if(e.actT<=0){e.tel=null;for(const q of G.players)q.blindT=GLOOM.blindT;G.fx.push({k:'ring',x:e.x,y:e.y-30,r:20,to:520,t:.5,m:.5,c:'#3a2050'});text(e.x,e.y-e.ah,'BLINDING PULSE','#c88cff',true);e.act='call';e.actT=.3}return true}
  if(a==='gaze'){const t=G.players.find(q=>(q.id||1)===e.gazeId);if(t)e.ang=Math.atan2(t.y-e.y,t.x-e.x);if(e.actT<=0){e.tel=null;e.act='walk';e.actT=rnd(1.4,2.4);if(t&&!(t.deadT>0)){if(angGap(t.face||0,Math.atan2(e.y-t.y,e.x-t.x))<Math.PI/2){t.stunT=GLOOM.stun;const me=G.p;G.p=t;hurtPlayer(e.dmg*.6);G.p=me;text(t.x,t.y-80,'STUNNED','#c88cff',true)}else openEye(e,Math.atan2(t.y-e.y,t.x-e.x))}}return true}
  if(a==='wail'){if(e.actT<=0){e.tel=null;e.act='wailGo';e.wailR=e.r;e.wailHit=[];sfx('bolt')}return true}
  if(a==='wailGo'){e.wailR+=BANSHEE.wailSpeed*dt;bossHurtWhere(q=>{const k=q.id||1;if(e.wailHit.includes(k))return false;const r=Math.hypot(q.x-e.x,q.y-e.y);if(Math.abs(r-e.wailR)>BANSHEE.wailBand+q.r||angGap(Math.atan2(q.y-e.y,q.x-e.x),e.wailGap)<BANSHEE.wailGap)return false;e.wailHit.push(k);return true},e.dmg);if(e.wailR>=BANSHEE.wailMax){e.act='walk';e.actT=rnd(1,1.8)}return true}
  if(a==='drift'){const o=e.driftTo||e,L=Math.hypot(o.x-e.x,o.y-e.y);if(L>6){e.x+=(o.x-e.x)/L*Math.min(L,BANSHEE.driftSp*dt);e.y+=(o.y-e.y)/L*Math.min(L,BANSHEE.driftSp*dt);e.moving=true}if(e.actT<=0){e.ghostT=0;e.act='walk';e.actT=rnd(.8,1.6)}return true}
  if(a==='tether'){if(e.actT<=0){e.tel=null;const t=G.players.find(q=>(q.id||1)===e.possId);if(t&&!(t.deadT>0)){t.possT=BANSHEE.possT;text(t.x,t.y-80,'POSSESSED','#c8b8ff',true)}e.act='walk';e.actT=rnd(1.2,2)}return true}
  return false}
/* Attack choice per boss; stages 1 to 3 have their own kits, the rest keep the shared one. */
function bossPick(e,n,low){const r=Math.random();
  if(n===7)return pickGhoul(e);if(n===6)return pickFlesh(e);if(n===5)return pickSpore(e);if(n===4)return pickChitin(e);if(n===2)return pickGloom(e);if(n===3)return pickBanshee(e);
  if(n===1){if((e.phase||0)>=1&&r<.22){startBurrow(e);return}
    if(r<.6){e.act='aim';bossTelegraph(e,'line',e.r+230,.62)}else startSpray(e);return}
  if(r<.42){e.act='aim';bossTelegraph(e,'line',e.r+230,Math.max(.45,.8-n*.03))}else if(r<.8){e.act='nova';bossTelegraph(e,'circle',150,.6)}else{e.act='call';e.actT=.5}}
const BOSS_PHASE_FX={1:()=>spawnPillars(2),5:e=>{if(e.phase===1)spawnMushrooms(e)},7:e=>{if(e.phase===1)e.rustField=true},6:e=>{if(e.phase===1)splitFlesh(e)},4:e=>{if(e.phase===1)spawnBossEggs(e);else {text(e.x,e.y-e.ah,'MOLTED','#ffd860',true)}}};
function summonBoss(kit,at){
  const n=G.stage,k=kit||n,st=STAGES[k-1],g=G.gate,o=at||{x:g.x,y:g.y-40};
  const e={kind:'boss',kit:k,name:st.label||st.boss,art:st.boss,ah:st.ah,x:o.x,y:o.y,r:st.r,hp:bossHp(n),maxHp:bossHp(n),dmg:bossDmg(n),sp:58+n*3,xp:xpNeed(recLevel(n)),gold:40*Math.pow(1.25,n-1),cd:1,ang:0,aware:true,flash:0,kx:0,ky:0,ph:rnd(TAU),act:'rise',actT:.95,hitCd:0,atkShow:0,wind:0,walk:0,fs:1,recover:0,recoil:0,release:0,trail:[],guard:0,guardMax:BOSS_GUARD_MAX,staggerT:0,phase:0,breatherT:0,enrageT:BOSS_ENRAGE_BASE+BOSS_ENRAGE_STEP*n,tel:null};
  partyToughen(e);G.enemies.push(e);G.boss=e;G.arena=at?null:{x:G.gate.x,y:G.gate.y-40,r:430};shake(10);sfx('boom');
  if(k===3)spawnLanterns();if(k===5)spawnSporeArena();if(k===7)spawnGhoulArena();
  const rec=recLevel(n),lv=G.p.lvl;
  G.banner={t:3.2,a:e.name,b:k===7?(G.players.length===1?'The coil charges itself. Lure the boss onto it.':'Hold F / Revive at the generator; lure it onto the coil.'):k===6?'Keep the two bodies apart.':k===5?(G.players.length===1?'Clean Toxic Load at the vents.':'Share Toxic Load or carry the purifier to clean it.'):k===4?'Crack the shell: attack its green back':lv<rec?'Recommended level '+rec+'. You are level '+lv+'. Train more if you fall.':'Final boss of stage '+n};
}

/* ---------- Combat ---------- */
const dmgMul=()=>(G.p.magicT>0?1.5:1)*(auraHas(G.p,'shooter')?1.08:1)*chainBonus().dmg;
const statMul=(p,st)=>STAT_MUL[(p.stats[st]||3)-1];
/* Damage of one attack with a weapon: level and gym base, weapon power, the character's stat, trained skill */
function weaponDamage(id){const p=G.p,W=WEAPONS[id],M=METHODS[W.m],sk=W.m==='shoot'?1+(p.skills.aim||0)*.08:W.m==='spell'?1+(p.skills.spell||0)*.1:1+(p.skills.power||0)*.08;return p.s.dmg*(1+W.p/25)*statMul(p,M.st)*sk*(W.m==='shoot'?.72:1)}
function equipWeapon(id){const p=G.p;if(!p.weapons.includes(id)||p.weapon===id)return;p.weapon=id;text(p.x,p.y-72,WEAPONS[id].n,'#f0c23c');dirty();writeSave()}
function cycleWeapon(d){const p=G.p,i=p.weapons.indexOf(p.weapon);equipWeapon(p.weapons[(i+d+p.weapons.length)%p.weapons.length])}
function wearBest(){const p=G.p;let n=0;SLOTS.forEach(sl=>{p.bag.filter(i=>i.slot===sl).forEach(it=>{const cur=p.gear[sl];if(!cur||it.score>cur.score){p.gear[sl]=it;p.bag.splice(p.bag.indexOf(it),1);if(cur)p.bag.push(cur);n++}})});if(n){recalc();addLog('Wore '+n+' better item'+(n>1?'s':'')+'.');writeSave()}}
function text(x,y,s,c,big){G.texts.push({x:x+rnd(-8,8),y,s,c,t:.8,big})}
function burst(x,y,c,n,sp=120){for(let i=0;i<n;i++){const a=rnd(TAU),v=rnd(sp*.3,sp);G.fx.push({k:'p',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:rnd(.25,.55),m:.55,c,s:rnd(1.5,3.5)})}}
function shake(v){if(!reduced)G.shake=Math.min(12,G.shake+v)}
/* Each character's element, from GAME_DESIGN section 12. Reactions need two different elements from two different players. */
const ELEMENT={Detective:'shock',Vigilante:'bleed',Guardian:'holy',Ranger:'toxin',Inventor:'shock',Firefighter:'soak','Hero Shadow':'void',Prodigy:'shock',Sage:'holy',Patriot:'holy',Phantom:'void',Pyromancer:'burn',Chronomancer:'chill',Beastmaster:'bleed',Voidwalker:'void',Exorcist:'holy','Gravity Mage':'void',Druid:'toxin',Cyborg:'shock',Illusionist:'chill',Necromancer:'void','Blood Reaper':'bleed','Toxin Alchemist':'toxin','Soul Stealer':'void','Shadow Monarch':'bleed',Puppeteer:'shock','Void Empress':'void','Plague Doctor':'toxin','Mad Scientist':'shock','Mirror Jester':'bleed','Demon Knight':'burn','Gravity Weaver':'void','Mecha Tyrant':'shock','Chrono Thief':'chill','Swarm Queen':'toxin','Ice Archmage':'chill','Deep Siren':'soak','Ash Shaman':'burn','Soul Forger':'burn','Cyber Priest':'holy'};
/* Section 5's reaction table. Order does not matter: the lookup sorts the two elements. */
const REACTIONS=[{a:'burn',b:'toxin',id:'inferno',n:'INFERNO'},{a:'burn',b:'chill',id:'shatter',n:'SHATTER'},{a:'shock',b:'soak',id:'overload',n:'OVERLOAD'},{a:'chill',b:'soak',id:'freeze',n:'FREEZE'},{a:'toxin',b:'void',id:'rot',n:'ROT'},{a:'void',b:'shock',id:'collapse',n:'COLLAPSE'},{a:'bleed',b:'holy',id:'purge',n:'PURGE'},{a:'holy',b:'void',id:'eclipse',n:'ECLIPSE'},{a:'bleed',b:'burn',id:'cauterise',n:'CAUTERISE'},{a:'bleed',b:'chill',id:'frostbite',n:'FROSTBITE'}];
const REACT_NAME={},REACT_PAIR={};
REACTIONS.forEach(r=>{REACT_NAME[r.id]=r.n;REACT_PAIR[[r.a,r.b].sort().join('+')]=r.id});
const reactionOf=(a,b)=>(a&&b)?(REACT_PAIR[[a,b].sort().join('+')]||'resonance'):'';
REACT_NAME.resonance='RESONANCE';
/* One reaction per target every REACT_CD seconds, so fast weapons cannot turn every second hit into rage and boss guard. */
const REACTION_RAGE=12,REACT_SAME=1.1,REACT_CD=2;
/* Splash damage from a reaction. Kept apart from hitEnemy so a reaction can never trigger another reaction. */
function reactHit(o,dmg,col){if(!o||o.dead||o.fleshDown||o.scrapDown||!(dmg>0)||bossWarded(o))return;o.hp-=dmg*shellBlock(o,G.p);if([6,7].includes(o.kit||G.stage)&&o.kind==='boss')bossPhaseCheck(o);o.flash=Math.max(o.flash||0,.11);o.aware=true;burst(o.x,o.y-20,col||'#ffffff',3);if(o.hp<=0)killEnemy(o)}
function reactSplash(e,dmg,r,col){for(const o of G.enemies.slice()){if(o.dead||o===e)continue;if(dist(o,e)<=r+o.r)reactHit(o,dmg,col)}}
function reactChain(e,dmg,r,n){let c=0;for(const o of G.enemies.slice()){if(o.dead||o===e||c>=n)continue;if(dist(o,e)<=r+o.r){reactHit(o,dmg,'#8fe6ff');c++}}}
/* Implemented effects. An id missing here does not fire at all, so a half-built reaction never fakes one. Each returns its damage multiplier. */
const REACT_FX={
  resonance:(e,p,b)=>{e.statusT=0;return REACT_SAME},
  /* Section 5: Overload jumps to five nearby enemies. The original stun stays. */
  overload:(e,p,b)=>{e.statusT=0;e.stunT=e.kind==='boss'?0:1;reactChain(e,b*.6,160,5);return G.players.length===1?1.15:1.3},
  /* Section 5: 200% damage, 110 units. */
  inferno:(e,p,b)=>{e.statusT=0;reactSplash(e,b,110,'#ff9a3c');G.fx.push({k:'ring',x:e.x,y:e.y,r:20,to:110,t:.35,m:.35,c:'#ff8a2c'});return 2},
  /* Section 5: 150% damage and armor removed for 4 s. Shattered targets take 25% more while it lasts. */
  shatter:(e,p,b)=>{e.statusT=0;e.shatterT=4;return 1.5},
  /* Section 5: frozen 2 s; bosses are only slowed instead. */
  freeze:(e,p,b)=>{e.statusT=0;if(e.kind==='boss')e.slowT=Math.max(e.slowT||0,2);else e.frozenT=2;return 1},
  /* Section 5: 40% of missing life over 5 s, capped hard on bosses. */
  rot:(e,p,b)=>{e.statusT=0;const missing=Math.max(0,e.maxHp-e.hp),total=Math.min(missing*.4,e.kind==='boss'?e.maxHp*.2:missing);e.rotT=5;e.rotRate=total/5;e.rotBy=p.id||0;return 1},
  /* Section 5: pulls enemies in 160 units together, then a burst. */
  collapse:(e,p,b)=>{e.statusT=0;for(const o of G.enemies){if(o.dead||o===e)continue;const d=dist(o,e);if(d>160)continue;const a=Math.atan2(e.y-o.y,e.x-o.x),step=Math.max(0,d-Math.max(24,e.r*.8));move(o,Math.cos(a)*step,Math.sin(a)*step);reactHit(o,b*.8,'#c8a4ff')}G.fx.push({k:'ring',x:e.x,y:e.y,r:20,to:160,t:.4,m:.4,c:'#b98cff'});return 1},
  /* Section 5: nearby allies heal 10%. Solo uses half strength. */
  purge:(e,p,b)=>{e.statusT=0;const share=G.players.length===1?.05:.1;for(const q of alivePlayers()){if(dist(q,e)>200)continue;const h=q.s.maxHp*share;q.hp=Math.min(q.s.maxHp,q.hp+h);text(q.x,q.y-72,'+'+Math.round(h),'#6fdca0',true)}return 1},
  /* Section 5: everyone in 200 units is stunned 1.5 s. Bosses break instead of stunning, since their guard bar does not exist yet. */
  eclipse:(e,p,b)=>{e.statusT=0;for(const o of G.enemies){if(o.dead||dist(o,e)>200)continue;if(o.kind==='boss'){o.exposedT=Math.max(o.exposedT||0,2);o.brokenT=Math.max(o.brokenT||0,2)}else o.stunT=Math.max(o.stunT||0,1.5)}G.fx.push({k:'ring',x:e.x,y:e.y,r:30,to:200,t:.5,m:.5,c:'#b0b8ff'});return 1},
  /* Bleed plus Burn: the wound burns shut, so the damage lands now instead of bleeding. */
  cauterise:(e,p,b)=>{e.statusT=0;for(const q of G.enemies)if(!q.dead&&q!==e&&dist(q,e)<90)reactHit(q,b*.5,'#ff7a3c');return 1.6},
  /* Bleed plus Chill: frostbite slows the target 40% for 3 s. */
  frostbite:(e,p,b)=>{e.statusT=0;e.slowT=Math.max(e.slowT||0,3);return 1.2}
};
/* Both players who built the reaction earn rage for it. */
function reactRage(e,p,factor=1){const other=G.players.find(q=>(q.id||0)===(e.statusBy||0))||p,me=G.p;for(const q of new Set([other,p])){if(!q)continue;G.p=q;addRage(REACTION_RAGE*factor)}G.p=me}
/* Report named reactions and the fallback for every roster pairing. */
function reactionCoverage(){const names=Object.keys(ELEMENT),miss=[],same=[];let named=0,resonance=0;for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++){const a=names[i],b=names[j],ea=ELEMENT[a],eb=ELEMENT[b],id=reactionOf(ea,eb);if(ea===eb)same.push([a,b]);if(!REACT_FX[id])miss.push([a,b]);else if(id==='resonance')resonance++;else named++}const total=names.length*(names.length-1)/2;return{total,byElement:named,byResonance:resonance,covered:total-miss.length,missing:miss,same}}

function expose(e,duration=2){if(e.dead)return;e.exposedT=Math.max(e.exposedT||0,duration);text(e.x,e.y-100,'OPEN','#ffe27a',true)}
function hitEnemy(e,base,ang,kb,heavy=false){
  if(e.dead||e.buried||e.fleshDown||e.scrapDown)return;const p=G.p;if(bossWarded(e)){if(!(e.wardT>G.t)){e.wardT=G.t+1;text(e.x,e.y-110,e.ghostT>0?'UNTOUCHABLE':'NEEDS LANTERN LIGHT','#c8b8ff',true)}return}if(e.role==='lurker'&&e.grab&&(G.players.length===1||(p.id||1)!==e.grab))lurkRelease(e,true);if(e.eyeT>0&&eyeBehind(e,p)&&!(e.eyeCd>G.t)){e.eyeCd=G.t+.4;bossGuard(e,BOSS_GUARD_GAIN.eye);base*=1.5;text(e.x,e.y-e.ah,'EYE HIT','#ffd860',true)}let justBroke=false;if(p.breakReady>0){p.breakReady=0;e.brokenT=5;e.brokenBy=p.id||0;justBroke=true;if(e.wind>0||e.healWind>0){e.wind=0;e.healWind=0;e.healT=3;e.castT=0;e.cd=1;expose(e)}text(e.x,e.y-80,'BROKEN','#ffd860',true)}else if(heavy&&e.healWind>0){e.healWind=0;e.healT=3;e.castT=0;e.cd=1;expose(e);text(e.x,e.y-80,'INTERRUPTED','#ffd860',true)}
  if(heavy&&!justBroke&&e.brokenT>0&&(G.players.length===1||(e.brokenBy||0)!==(p.id||0))){e.brokenT=0;base*=1.5;text(e.x,e.y-98,'BREAK STRIKE','#ffe27a',true)}
  if(justBroke)bossGuard(e,BOSS_GUARD_GAIN.break);
  const el=ELEMENT[p.char],prev=e.statusType,solo=G.players.length===1,rid=(el&&e.statusT>0&&prev&&G.t>=(e.reactAt||0)&&(solo||(e.statusBy||0)!==(p.id||0)))?(solo?'resonance':reactionOf(prev,el)):'';
  if(rid&&REACT_FX[rid]){achievementUnlock(p,'reaction');if(!solo)achievementUnlock(p,'teamReaction');e.reactAt=G.t+REACT_CD;const mult=REACT_FX[rid](e,p,base);base*=solo?1+(mult-1)*.5:mult;text(e.x,e.y-110,REACT_NAME[rid],'#80eaff',true);G.fx.push({k:'ring',x:e.x,y:e.y,r:8,to:72,t:.4,m:.4,c:'#80eaff'});reactRage(e,p,solo?.5:1);bossGuard(e,BOSS_GUARD_GAIN.reaction*(solo?.5:1))}
  else if(el){e.statusType=el;e.statusT=4;e.statusBy=p.id||0}
  if(e.shatterT>0)base*=1.25;if((e.staggerT||0)>0)base*=BOSS_STAGGER_DMG;
  base*=shellBlock(e,p);base*=((e.exposedT||0)>0?1.25:1)*((e.markT||0)>0?1.25:1);const crit=Math.random()<p.s.crit+(auraHas(p,'striker')?.04:0),facing=Math.abs(Math.atan2(Math.sin(ang-e.ang-Math.PI),Math.cos(ang-e.ang-Math.PI))),block=(e.guarding&&facing<1.05)?.45:1,d=base*(crit?2:1)*rnd(.9,1.1)*block;
  e.hp-=d;e.flash=.11;e.aware=true;threatAdd(e,p.id||0,100*d/Math.max(1,e.maxHp));bossPhaseCheck(e);if(e.kind==='boss')e.recoil=.16;const res=e.kind==='boss'?.15:1;e.kx+=Math.cos(ang)*kb*res;e.ky+=Math.sin(ang)*kb*res;
  G.fx.push({k:'spark',x:e.x,y:e.y-24,a:ang,t:crit?.26:.18,m:crit?.26:.18,crit:crit?1:0,c:heavy||crit?'255,220,120':'255,250,235'});
  text(e.x,e.y-(e.kind==='boss'?e.ah*.7:66),Math.round(d)+(crit?'!':''),crit?'#ffd86b':'#fff',crit);if(crit||(e.exposedT||0)>0)G.fx.push({k:'ring',x:e.x,y:e.y-20,r:6,to:e.r*1.6,t:.22,m:.22,c:crit?'#ffd86b':'#f2ecd8'});goreSpray(e,ang,d/Math.max(1,e.maxHp),crit);burst(e.x,e.y-20,'#f0805c',crit?4:1);if(crit||heavy)goreChunks(e,ang,crit?2:1);
  if(p.s.leech>0)p.hp=Math.min(p.s.maxHp,p.hp+p.s.leech);sfx('hit');if(crit)shake(2);
  if(e.hp<=0)killEnemy(e);
}
function killEnemy(e){
  if(e.fleshSplit){fleshDownBody(e);return}
  if(e.scrapGolem&&!e.scrapFinished){scrapDisable(e);return}
  if(e.grab)lurkRelease(e,false);if(e.role==='bloater')sporeCloud(e);e.dead=true;const p=G.p,boss=e.kind==='boss';p.kills++;G.fx.push({k:'ring',x:e.x,y:e.y-20,r:8,to:boss?170:58,t:.3,m:.3,c:'#fff2d0'});onKill(e);if(!G.swarm)achievementCheck(p);if(e.vill||e.elite)sfx('rivalDown');burst(e.x,e.y-20,e.elite?'#e8c95c':'#c8c8d0',boss?70:12,boss?300:150);
  const ga=(e.kx||e.ky)?Math.atan2(e.ky,e.kx):rnd(TAU);goreSpray(e,ga,.6,boss);goreChunks(e,ga,boss?26:(e.mob?6:10));gorePool(e,boss?3:1);if(e.vill)G.fx.push({k:'kitdie',key:KIT_OF[e.name],x:e.x,y:e.y,mir:G.p.x>e.x,t:6,m:6});else if(boss||e.art)G.fx.push({k:'bossdie',art:e.art,ah:e.ah,x:e.x,y:e.y,fs:e.fs||1,t:boss?1.5:.8,m:boss?1.5:.8});else G.fx.push({k:'ko',name:e.name,x:e.x,y:e.y,t:.7,m:.7});
  const night=nightness(G.hour)>.5?1.25:1;
  if(!boss&&e.kind==='rival'&&!e.minion)G.killsStage++;
  dropLoot(e,night);shareXp(e.xp*night);
  if(boss){G.flesh=null;clearBossEggs();clearSporeBoss();clearGhoul();shake(12);sfx('boom');G.boss=null;G.arena=null;clearLanterns();G.players.forEach(q=>{q.sp+=2;q.possT=0});G.enemies.forEach(o=>{if(o.minion)o.dead=true});if(!G.swarm)stageCleared()}
  dirty();
}
function dropLoot(e,night){
  const boss=e.kind==='boss',start=G.loot.length; // no equipment or weapons for now: gold, potions and pills only
  if(Math.random()<(boss?1:.7))G.loot.push({x:e.x+rnd(-16,16),y:e.y+rnd(-16,16),kind:'gold',amt:Math.round(e.gold*night),t:0});
  if(boss||Math.random()<(e.elite?.3:.1))G.loot.push({x:e.x+rnd(-16,16),y:e.y+rnd(-16,16),kind:'potions',t:0});
  if(Math.random()<(boss?.8:e.elite?.2:.05))G.loot.push({x:e.x+rnd(-16,16),y:e.y+rnd(-16,16),kind:'fast',t:0});
  if(Math.random()<(boss?.8:e.elite?.2:.05))G.loot.push({x:e.x+rnd(-16,16),y:e.y+rnd(-16,16),kind:'magic',t:0});
  for(let i=start;i<G.loot.length;i++){const l=G.loot[i];let k=0;while(blocked(l.x,l.y,6)&&k++<8){l.x+=(e.x-l.x)*.5;l.y+=(e.y-l.y)*.5}}
}
function gainXp(x){const p=G.p;p.xp+=x;let up=false;
  while(p.xp>=xpNeed(p.lvl)){p.xp-=xpNeed(p.lvl);p.lvl++;p.sp++;up=true}
  if(up){if(!G.swarm)achievementCheck(p);recalc();p.hp=p.s.maxHp;p.mana=p.s.maxMana;sfx('level');burst(p.x,p.y-20,'#e8c95c',28,220);text(p.x,p.y-74,'Level '+p.lvl,'#e8c95c',true);addLog('Level '+p.lvl+'. Skill point earned (press T).');writeSave()}}
function hurtPlayer(d){
  const p=G.p;if(G.mode!=='play'||p.respawnT>0||p.inv>0)return;if(p.deadT>0){p.deadT=Math.max(.001,p.deadT-3);p.inv=.4;return;}const ar=p.s.armor*(1-Math.min(90,(p.rust||0)+(p.fieldRust||0))/100)+(p.guard?guardArmor(p):0),red=ar/(ar+60),v=d*(1-red)*(auraHas(p,'bruiser')?.92:1)*(p.tauntGuard>0?.7:1);if(p.guard)burst(p.x+Math.cos(p.face)*18,p.y-24,'#8fd0ff',7,120);p.hp-=v;p.inv=.4;beaconHit(p);p.hitT=.18;shake(5);sfx('hurt');
  text(p.x,p.y-72,'-'+Math.round(v),'#ff6a5f');burst(p.x,p.y-20,'#f0805c',8);if(!p.guard)bleed(p.x,p.y-24,rnd(-1,1),rnd(-1,1),clamp(Math.round(v/Math.max(1,p.s.maxHp)*60),3,22));
  if(p.hp<=0){p.hp=0;if(G.players.length===1&&!p.secondWind){p.secondWind=true;playerDown(p,true);writeSave()}else if(G.mp)playerDown(p);else if(G.swarm){p.hp=0;endSwarm()}else{p.gold=Math.floor(p.gold*.8);writeSave();setMode('dead')}}
}
/* An upgraded shield cancels ordinary enemies' current wind-up, never a boss move. */
function shieldInterrupt(e){if(!e||e.dead||e.kind==='boss'||!((e.wind||0)>0||(e.healWind||0)>0))return false;achievementUnlock(G.p,'interrupt');e.wind=0;e.healWind=0;e.healT=Math.max(e.healT||0,3);e.castT=0;e.cd=Math.max(e.cd||0,1);text(e.x,e.y-98,'INTERRUPTED','#8fd0ff',true);G.fx.push({k:'shieldFx',x:e.x,y:e.y-24,a:Math.atan2(e.y-G.p.y,e.x-G.p.x),t:.28,m:.28});burst(e.x,e.y-24,'#8fd0ff',6,100);return true}
const WEAPON_HEAL_RANGE=200,WEAPON_HEAL_SHARE=.02,WEAPON_HEAL_CD=1;
/* From tier two, a healing weapon restores one nearby ally once per second. */
function weaponHealAlly(p){if((p.weaponHealCd||0)>0)return false;const q=G.players.filter(q=>q!==p&&!(q.deadT>0||q.respawnT>0)&&q.hp<q.s.maxHp&&dist(q,p)<=WEAPON_HEAL_RANGE).sort((a,b)=>a.hp/a.s.maxHp-b.hp/b.s.maxHp)[0];if(!q)return false;const h=Math.min(q.s.maxHp-q.hp,q.s.maxHp*WEAPON_HEAL_SHARE);q.hp+=h;achievementUnlock(p,'healAlly');p.weaponHealCd=WEAPON_HEAL_CD;threatHeal(p,h);G.fx.push({k:'healLink',x:p.x,y:p.y-24,x2:q.x,y2:q.y-24,t:.32,m:.32});text(q.x,q.y-72,'+'+Math.round(h),'#6fdca0',true);burst(q.x,q.y-24,'#6fdca0',8,90);return true}
function doAttack(){
  if(G.p.carry||G.p.stunT>0)return;
  if(kitOf(G.p)){doMove('small');return}
  const p=G.p,id=p.weapon,W=WEAPONS[id];if(p.cd.slash>0||p.guard)return;
  if(W.m==='spell'&&p.mana<W.cost)return;
  p.cd.slash=W.cd*cdMulOf(p);p.atkT=Math.min(.3,p.cd.slash);p.atkDur=p.atkT;const dmg=weaponDamage(id)*dmgMul(),up=upgradeLevel(p,id),fx=Math.cos(p.face),fy=Math.sin(p.face);
  if(up)G.fx.push({k:'ring',x:p.x+fx*12,y:p.y-24+fy*12,r:6,to:22+up*10,t:.24,m:.24,shape:up>=2?'diamond':'circle',c:up===1?'#ffd166':'#80eaff'});
  if(W.m==='shoot'){sfx('shot');const sty={bow:'arrow',blaster:'plasma',tommy:'tracer',camera:'flash'}[id]||'bullet',sp=sty==='arrow'?470:sty==='plasma'?430:640;for(const off of GUN_UP[up].angles){const a=p.face+off;G.shots.push({x:p.x+fx*24,y:p.y-24+fy*24,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:sty==='plasma'?7:4,from:'p',life:.8,dmg:dmg*GUN_UP[up].damage,small:true,tier:up,pierce:up>=2&&PIERCING_WEAPONS.has(id)?1:0,piercing:up>=2&&PIERCING_WEAPONS.has(id),fx:sty,col:sty==='plasma'?'111,220,255':'255,220,120',a})}muzzle(p.x+fx*30,p.y-24+fy*30,p.face,sty);return}
  if(W.m==='spell'){p.mana-=W.cost;sfx('bolt');const sty={book:'arcane',flask:'flask',candle:'ember',staff:'skull',cards:'card'}[id]||'orb';for(const off of SPELL_UP[up].angles){const a=p.face+off;G.shots.push({x:p.x+fx*20,y:p.y-24+fy*20,vx:Math.cos(a)*390,vy:Math.sin(a)*390,r:6,from:'p',life:.9,dmg:dmg*SPELL_UP[up].damage,blast:SPELL_UP[up].blast,tier:up,fx:sty,col:spellCol(p.char,sty),a})}return}
  const mdmg=dmg*MELEE_UP[up],reach=meleeReach(W,up),arc=meleeArc(up);p.swingArc=arc;p.swing=.17;p.swingA=p.face;p.swingR=reach;sfx(W.m==='unarmed'?'hit':'slash');let n=0,landed=false;
  for(const e of G.enemies.slice()){if(e.dead||e.fleshDown||e.scrapDown)continue;const d=dist(e,p);if(d>reach+e.r)continue;const a=Math.atan2(e.y-p.y,e.x-p.x);let da=Math.abs(a-p.face)%TAU;if(da>Math.PI)da=TAU-da;if(da<arc||d<e.r+p.r+4){if(!e.buried)landed=true;hitEnemy(e,mdmg,a,W.m==='shield'?300:W.m==='unarmed'?90:170);if(W.m==='shield'&&up>=2)shieldInterrupt(e);n++}}
  for(const c of G.npcs){if(c.dead)continue;const d=dist(c,p);if(d>reach+10)continue;const a=Math.atan2(c.y-p.y,c.x-p.x);let da=Math.abs(a-p.face)%TAU;if(da>Math.PI)da=TAU-da;if(da<arc)hitNpc(c,mdmg,a,true)}
  webAlly(p,q=>dist(q,p)<=reach+q.r&&angGap(Math.atan2(q.y-p.y,q.x-p.x),p.face)<arc);
  for(const c of (G.props||[])){if(!['pillar','egg','scrapPart'].includes(c.kind)||c.done)continue;const d=dist(c,p);if(d>reach+c.r)continue;const a=Math.atan2(c.y-p.y,c.x-p.x);let da=Math.abs(a-p.face)%TAU;if(da>Math.PI)da=TAU-da;if(da<arc||d<c.r+p.r+4){if(c.kind==='egg')eggHit(c);else if(c.kind==='scrapPart')scrapPartHit(c,p);else pillarHit(c,p,false);n++}}
  if(landed&&W.m==='heal'&&up>=2)weaponHealAlly(p);
  if(n&&W.m==='heal'){const h=p.s.maxHp*.01*p.stats.hea*p.s.mendMul;p.hp=Math.min(p.s.maxHp,p.hp+h);burst(p.x,p.y-24,'#6fdca0',3)}
  if(n>2)shake(1.5);
}
function doSpell(){if(G.p.carry||G.p.stunT>0)return;if(kitOf(G.p)){doMove('moderate');return}const p=G.p;if(p.guard||p.cd.bolt>0||p.mana<p.s.spellCost)return;p.mana-=p.s.spellCost;p.cd.bolt=.7*cdMulOf(p);p.castT=.3;sfx('bolt');const sk=1+(p.skills.spell||0)*.1;G.shots.push({x:p.x+Math.cos(p.face)*20,y:p.y-22+Math.sin(p.face)*20,vx:Math.cos(p.face)*410,vy:Math.sin(p.face)*410,r:7,from:'p',life:1.1,heavy:true,dmg:p.s.dmg*1.7*statMul(p,'mag')*sk*dmgMul(),fx:'comet',col:spellCol(p.char,'comet'),a:p.face})}
function explode(s){const p=G.p,R=s.blast||p.s.blast;impact(s,R);sfx('boom');shake(s.blast?.8:2);for(const c of G.npcs){if(!c.dead&&Math.hypot(c.x-s.x,c.y-22-s.y)<R)hitNpc(c,s.dmg,Math.atan2(c.y-s.y,c.x-s.x),true)}for(const e of G.enemies.slice()){if(!e.dead&&Math.hypot(e.x-s.x,e.y-22-s.y)<R+e.r)hitEnemy(e,s.dmg,Math.atan2(e.y-s.y,e.x-s.x),210,!!s.heavy)}}
const TEAM_ABILITY={bruiser:{n:'Taunt',cd:14,d:'Draw nearby enemies and reduce damage taken.'},striker:{n:'Break',cd:12,d:'Your next hit breaks a target and can interrupt a cast.'},shooter:{n:'Mark',cd:10,d:'Mark an aimed enemy so the party deals more damage.'},medic:{n:'Mend Link',cd:8,d:'Heal the lowest-life nearby ally over time.'},scout:{n:'Rescue Dash',cd:12,d:'Dash to an ally and shield you both.'}};
function chooseBoon(id){const p=G.p;if(!p.boonPending||(id!=='wide'&&id!=='opening'))return false;const b=p.runBoons||(p.runBoons={wide:0,opening:0});if((b[id]||0)>=3)return false;b[id]=(b[id]||0)+1;p.boonPending=false;achievementUnlock(p,'boon');addLog(id==='wide'?'Dodge protection increased.':'Dodge openings last longer.');writeSave();return true}
/* One target rule for both the action and the player's target preview. */
function teamTarget(p,k,aim=mouse){if(k==='shooter')return G.enemies.filter(e=>!e.dead&&!e.fleshDown&&!e.scrapDown&&dist(e,p)<450&&los(p,e)&&!concealed(e,p)).sort((a,b)=>Math.hypot(a.x-aim.x,a.y-aim.y)-Math.hypot(b.x-aim.x,b.y-aim.y))[0]||null;
  if(k==='medic')return G.players.filter(q=>!q.deadT&&!q.respawnT&&dist(q,p)<400).sort((a,b)=>a.hp/a.s.maxHp-b.hp/b.s.maxHp)[0]||null;
  if(k==='scout')return G.players.filter(q=>q!==p&&!q.respawnT&&dist(q,p)<350).sort((a,b)=>a.hp/a.s.maxHp-b.hp/b.s.maxHp)[0]||null;return null}
function doTeam(){const p=G.p;if(p.carry)return false;const k=archKey(p.char),ability=TEAM_ABILITY[k];if(!ability||p.teamCd>0||p.deadT>0||p.respawnT>0||G.mode!=='play')return false;
  if(k==='bruiser'){for(const e of G.enemies)if(!e.dead&&dist(e,p)<220){e.tauntId=p.id||0;e.tauntT=4;e.aware=true}p.tauntGuard=4;G.fx.push({k:'ring',x:p.x,y:p.y,r:20,to:220,t:.5,m:.5,c:'#80caff'})}
  else if(k==='striker'){p.breakReady=6;text(p.x,p.y-80,'BREAK READY','#ffe27a',true)}
  else if(k==='shooter'){const target=teamTarget(p,k);if(!target){addLog('No enemy in range or sight to mark.');return false}target.markT=6;target.aware=true;text(target.x,target.y-100,'MARKED','#ffd860',true)}
  else if(k==='medic'){const q=teamTarget(p,k);if(!q)return false;q.mendT=4;q.mendBy=p.id;q.mendRate=q.s.maxHp*.3/4;addLog('Mend Link: '+esc(q.pname||label(q.char))+'.');text(q.x,q.y-80,'MEND LINK','#80e5aa',true)}
  else{const q=teamTarget(p,k);if(q){addLog('Rescue Dash: '+esc(q.pname||label(q.char))+'.');const dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy)||1,steps=Math.max(1,Math.ceil(Math.max(0,d-35)/12));for(let i=0;i<steps;i++)if(move(p,dx/d*Math.min(12,Math.max(0,d-35)),dy/d*Math.min(12,Math.max(0,d-35))))break;p.inv=Math.max(p.inv,1);if(dist(p,q)<70)q.inv=Math.max(q.inv,1)}else{doDash();p.inv=Math.max(p.inv,1)}text(p.x,p.y-80,'RESCUE DASH','#b9a4ff',true)}
  p.teamCd=ability.cd*cdMulOf(p);achievementUnlock(p,'teamAbility');return true}
function doHeal(){const p=G.p;if(p.guard||p.cd.pull>0||p.mana<22||p.hp>=p.s.maxHp)return;p.mana-=22;p.cd.pull=5*cdMulOf(p);p.castT=.45;p.healFx=.8;const h=Math.min(p.s.maxHp-p.hp,p.s.maxHp*(.05+.045*p.stats.hea)*p.s.mendMul);p.hp+=h;threatHeal(p,h);text(p.x,p.y-72,'+'+Math.round(h),'#6fdca0',true);burst(p.x,p.y-24,'#6fdca0',18,120);G.fx.push({k:'ring',x:p.x,y:p.y-20,r:40,to:10,t:.4,m:.4,c:'#6fdca0'});sfx('pull')}
/* ---------- Style helpers ---------- */
function spellCol(ch,sty){const w=SPECS[ch]&&SPECS[ch].wc;if(sty==='flask')return'90,240,110';if(sty==='ember')return'255,150,60';if(sty==='card')return'255,90,200';if(w&&w[0]==='#'&&w.length===7)return parseInt(w.slice(1,3),16)+','+parseInt(w.slice(3,5),16)+','+parseInt(w.slice(5,7),16);return'190,120,255'}
function glowP(x,y,c,n=1,sp=60,t=.4,s=3){for(let i=0;i<n;i++){const a=rnd(TAU),v=rnd(sp*.2,sp);G.fx.push({k:'g',x:x+rnd(-3,3),y:y+rnd(-3,3),vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:rnd(t*.5,t),m:t,c,s:rnd(s*.5,s)})}}
function muzzle(x,y,a,sty){G.fx.push({k:'muz',x,y,a,t:.09,m:.09,big:sty==='plasma'||sty==='tracer'});glowP(x,y,'255,210,110',4,150,.18,2.5);if(sty!=='arrow')G.fx.push({k:'p',x,y,vx:-Math.cos(a)*40+rnd(-30,30),vy:-60,t:.4,m:.5,c:'#e8c070',s:2.5})}
function impact(s,R){const c=s.col||'190,120,255';G.fx.push({k:'nova',x:s.x,y:s.y,r:R||20,t:.32,m:.32,c,a:rnd(TAU)});glowP(s.x,s.y,c,R?22:8,R?260:150,.5,4);if(R)shake(.5)}
/* ---------- NPCs, gore and talk ---------- */
const TALK={
 idleDay:['Lovely day, if nothing eats you.','The berries here are safe. Mostly.','Mind the shrubs, things live in them.','Have you seen my goat?'],
 idleNight:['Keep to the torchlight.','I hear bones clicking out there.','You should not be out this late.','Something moved in the ferns.'],
 hero:['Thank the stars, a hero!','You will save us, right?','Strike them down for us!'],
 villain:['Please, I have a family!','Do not look at me. Do not look at me.','Take what you want, just go!'],
 danger:['Monsters! Run!','They are right behind me!','Help! Over here!','Get away from me!'],
 hurt:['Aagh! My arm!','Why are you doing this?!','Stop! Please!','I am bleeding!'],
 hurtEnemy:['It bit me!','Get it off! Get it off!','Somebody help!'],
 witness:['Murderer!','Oh gods, there is so much blood!','You killed them! Stay back!','Run! Run for your life!'],
 witnessEnemy:['They got poor Tam!','Do not let them take me too!','It tore them apart!'],
 boss:['The ground is shaking!','What IS that thing?!','Do not go near the gate!'],
 lowHp:['You look half dead, friend.','Drink something, you are bleeding.','Rest at the safehouse!'],
 killer:['That is the killer!','Keep your distance, butcher.','Do not hurt me, I saw nothing!'],
 gate:['The gate is open. Gods help us.','Something waits past those ruins.'],
 villainArrive:['Their masters are here!','The villains have come!']
};
function say(c,kind,chance=1){if(c.dead||Math.random()>chance)return;const k=kind==='villain'?'villainArrive':kind;if(c.qt>.6&&!['hurt','hurtEnemy','witness'].includes(k))return;c.quip=pick(TALK[k]);c.qt=2.6}
/* The wounded scout can't be hurt or knocked away until revived, so the objective can't vanish or slide out of reach */
function hitNpc(c,d,a,byPlayer){if(c.dead||c.wounded)return;c.hp-=d;c.kx=(c.kx||0)+Math.cos(a)*180;c.ky=(c.ky||0)+Math.sin(a)*180;c.scare=4;c.flash=.1;sfx('hit');bleed(c.x,c.y-26,Math.cos(a),Math.sin(a),10);if(c.hp<=0)killNpc(c,a,byPlayer);else say(c,byPlayer?'hurt':'hurtEnemy')}
/* ---------- Gore. Blood scales with the damage relative to the target's life, so a pistol pop bleeds little and an ultimate bleeds a lot. ---------- */
const GORE={hit:26,kill:64,cap:420,trailT:.4,poolMin:16,poolMax:30,mark:.34};
const GORE_KIT={necro:['#8c1820','#5e0f16','#e8dcc0'],toxic:['#3f6a2a','#26401a','#a8c070'],void:['#6a2a7a','#3e1a4a','#c090d8']};
const goreCols=e=>e.mob?GORE_KIT[e.owner==='Necromancer'?'necro':e.owner==='Toxin Alchemist'?'toxic':'void']:['#a8202c','#8c1820','#6c1018'];
/* Spray along the hit direction: more damage, more blood. Crits roughly double it. */
function goreSpray(o,ang,frac,crit){const n=clamp(Math.round(4+frac*GORE.hit*(crit?1.8:1)),4,34);bleed(o.x,o.y-Math.min(40,o.r+14),Math.cos(ang),Math.sin(ang),n)}
/* Chunks that bounce, land and leave their own marks. Once you are down they stop moving. */
function goreChunks(e,ang,n){const cols=goreCols(e);for(let i=0;i<n;i++){const an=ang+rnd(-1.8,1.8),v=rnd(70,240);G.fx.push({k:'gib',x:e.x,y:e.y-rnd(10,Math.min(60,e.r+30)),z:0,vx:Math.cos(an)*v,vy:Math.sin(an)*v*.6,vz:rnd(-280,-90),spin:rnd(-14,14),rot:0,t:rnd(.6,1),m:1,s:rnd(2,5),col:pick(cols),kind:'bit'})}}
function gorePool(e,scale=1){addDecal(e.x,e.y,e.r*scale+rnd(GORE.poolMin,GORE.poolMax),true,goreCols(e)[1]);for(let i=0;i<3;i++){const a=rnd(TAU),d=rnd(e.r*.6,e.r*2.4);addDecal(e.x+Math.cos(a)*d,e.y+Math.sin(a)*d*.6,rnd(3,9),false,goreCols(e)[0])}}
/* A badly wounded enemy drips as it moves. Throttled, so a crowd cannot flood the decal list. */
function goreTrail(e,dt){if(e.dead||!e.moving||e.hp>=e.maxHp*.35)return;e.goreT=(e.goreT||0)-dt;if(e.goreT>0)return;e.goreT=GORE.trailT;addDecal(e.x+rnd(-3,3),e.y+rnd(-3,3),rnd(2.5,5),false,goreCols(e)[0])}
function bleed(x,y,dx,dy,n){for(let i=0;i<n;i++){const a=Math.atan2(dy,dx)+rnd(-.9,.9),v=rnd(40,260);G.fx.push({k:'blood',x,y,z:0,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.5,vz:rnd(-180,-30),t:rnd(.35,.8),m:.8,s:rnd(1.5,4)})}}
function killNpc(c,a,byPlayer){
  c.dead=true;sfx('hurt');shake(2.5);bleed(c.x,c.y-26,Math.cos(a),Math.sin(a),46);bleed(c.x,c.y-34,0,-1,18);
  const sp=SPECS[c.art]||SPECS[c.name]||SPECS.Tourist;[[sp.s,7,'head'],[sp.t,8,'torso'],[sp.t,4,'arm'],[sp.t,4,'arm'],[sp.b,4,'leg'],[sp.b,4,'leg'],['#8c1820',3,'bit'],['#a8202c',3,'bit'],['#6c1018',3,'bit'],['#e8dcc0',2,'bone']].forEach(([col,s,kind])=>{const an=a+rnd(-1.7,1.7),v=rnd(70,250);G.fx.push({k:'gib',x:c.x,y:c.y-rnd(14,40),z:0,vx:Math.cos(an)*v,vy:Math.sin(an)*v*.6,vz:rnd(-300,-100),spin:rnd(-14,14),rot:0,t:rnd(.7,1.1),m:1.1,s,col,kind,hair:sp.h})});
  addDecal(c.x,c.y,rnd(20,30),true);G.fx.push({k:'corpse',name:c.name,x:c.x,y:c.y,t:9,m:9});
  G.npcs.forEach(o=>{if(o!==c&&!o.dead&&dist(o,c)<300){o.scare=7;say(o,byPlayer?'witness':'witnessEnemy',.8)}});
  if(byPlayer){G.p.killerT=45;addLog('You killed a '+esc(c.name.toLowerCase())+'. Witnesses scatter.')}
}
function addDecal(x,y,r,pool,col){const d=G.decals||(G.decals=[]);d.push({x,y,r,pool,col,seed:Math.random()*99|0});if(d.length>GORE.cap)d.shift()}
function tickHazards(dt){(G.hazards||[]).forEach(h=>{h.t-=dt;if(h.spore)return;h.tk=(h.tk||0)-dt;if(h.tk<=0){h.tk=.45;if(h.from==='e'){for(const q of G.players){G.p=q;if(dist(q,h)<h.r+q.r)hurtPlayer(h.dps)}}else{G.p=ownerOf(h);for(const e of G.enemies.slice())if(!e.dead&&dist(e,h)<h.r+e.r)hitEnemy(e,h.dps,0,0)}for(const c of G.npcs)if(!c.dead&&dist(c,h)<h.r)hitNpc(c,h.dps,rnd(TAU),h.from!=='e')}});if(G.hazards)G.hazards=G.hazards.filter(h=>h.t>0)}
/* ---------- Asset-driven villains: Necromancer, Void Empress, Toxin Alchemist ---------- */
const KIT_OF={Necromancer:'necro','Void Empress':'void','Toxin Alchemist':'toxic'};
const WS=.62; // world units per sprite pixel: makes them about 104 tall
/* face: which way the artwork attacks (-1 left, 1 right, 0 both). hits: when damage lands, as a share of the move. */
const KIT={
 necro:{col:'110,255,170',small:{dur:.85,hits:[.42],face:-1},moderate:{dur:1.15,hits:[.42,.62],face:-1},special:{dur:2.3,hits:[.42,.5,.58,.66,.74,.82,.9],face:1,sp:1}},
 void:{col:'190,110,255',small:{dur:.85,hits:[.3],face:-1},moderate:{dur:1.2,hits:[.45,.8],face:0},special:{dur:2.3,hits:[.4,.5,.6,.7,.8,.9],face:0,sp:1}},
 toxic:{col:'140,240,70',small:{dur:.85,hits:[.55],face:-1},moderate:{dur:1.15,hits:[.5],face:-1},special:{dur:2.3,hits:[.45,.6,.75,.9],face:0,sp:1}}
};
const SPECIAL_CD=60;
const kitOf=a=>KIT_OF[a.char?a.char:a.vill?a.name:null]||null;
function startMove(a,id,aimX){const key=kitOf(a);if(!key||a.mv)return false;const M=KIT[key][id];const side=(aimX>=a.x)?1:-1;a.mv={id,key,t:0,dur:M.dur,hit:0,side,mirror:M.face!==0&&side!==M.face};sfx(id==='special'?'level':id==='moderate'?'boom':'bolt');return true}
function moveDamage(a,key,id){const base=a.char?a.s.dmg*statMul(a,'mag')*(1+(a.skills.spell||0)*.1)*dmgMul():a.dmg;return base*(a.char?{small:2.3,moderate:3.2,special:1.7}:{small:1,moderate:1.65,special:.7})[id]*(a.char?MELEE_UP[upgradeLevel(a,'signature')]:1)}
function strike(a,shape,dmg,kb){
  const inShape=t=>shape(t.x-a.x,t.y-a.y,t);
  if(a.char){for(const e of G.enemies.slice())if(!e.dead&&inShape(e))hitEnemy(e,dmg,Math.atan2(e.y-a.y,e.x-a.x),kb,!!(a.mv&&a.mv.id!=='small'));
    for(const c of (G.props||[]))if(!c.done&&inShape(c)){if(c.kind==='pillar')pillarHit(c,a,!!(a.mv&&a.mv.id!=='small'));else if(c.kind==='egg')eggHit(c);else if(c.kind==='scrapPart')scrapPartHit(c,a)}webAlly(a,inShape);for(const c of G.npcs)if(!c.dead&&inShape(c))hitNpc(c,dmg,Math.atan2(c.y-a.y,c.x-a.x),true)}
  else{if(inShape(G.p))hurtPlayer(dmg);for(const c of G.npcs)if(!c.dead&&inShape(c))hitNpc(c,dmg,Math.atan2(c.y-a.y,c.x-a.x),false)}
}
function fireMove(a,mv,hitN){
  const {key,id,side}=mv,d=moveDamage(a,key,id),col=KIT[key].col,from=a.char?'p':'e',band=(y,h)=>Math.abs(y)<h;
  if(a.char&&hitN===0){const up=upgradeLevel(a,'signature');if(up)G.fx.push({k:'ring',x:a.x,y:a.y-22,r:8,to:30+up*14,t:.3,m:.3,shape:up>=2?'diamond':'circle',c:'#'+col.split(',').map(v=>(+v).toString(16).padStart(2,'0')).join('')})}
  if(key==='necro'){
    if(id==='small'){strike(a,(x,y)=>x*side>18&&x*side<112&&band(y,46),d,120);glowP(a.x+side*72,a.y-46,col,12,170,.4,3)}
    if(id==='moderate'){strike(a,(x,y)=>Math.hypot(x,y*1.2)<112&&x*side>-22,d,240);shake(2)}
    if(id==='special'){strike(a,(x,y)=>x*side>16&&x*side<390&&band(y+6,44),d,70);shake(2.2);glowP(a.x+side*rnd(60,380),a.y-40,col,5,120,.35,4)}
  }else if(key==='void'){
    if(id==='small'){const ang=a.char?a.face:Math.atan2(G.p.y-a.y,G.p.x-a.x),an=Math.cos(ang)*side>=0?ang:(side>0?0:Math.PI);G.shots.push({x:a.x+side*52,y:a.y-48,vx:Math.cos(an)*360,vy:Math.sin(an)*360,r:9,from,life:1.3,dmg:d,blast:a.char?46:undefined,small:a!==G.p,tier:a.char?upgradeLevel(a,'signature'):0,fx:'orb',col,a:an})}
    if(id==='moderate'){strike(a,(x,y)=>Math.hypot(x,y*1.2)<112,d*(hitN?1:.7),160);shake(3);glowP(a.x,a.y-16,col,14,190,.45,3.5)}
    if(id==='special'){const R=70+hitN*48;strike(a,(x,y)=>Math.hypot(x,y)<R,d,80);shake(3);G.fx.push({k:'nova',x:a.x,y:a.y-44,r:R,t:.3,m:.3,c:col,a:rnd(TAU)})}
  }else{
    if(id==='small'){G.hazards.push({x:a.x+side*78,y:a.y+2,r:46,t:2.2,dps:d*.3,from,col});strike(a,(x,y)=>Math.hypot(x-side*78,y)<58,d,90)}
    if(id==='moderate'){G.hazards.push({x:a.x+side*88,y:a.y+2,r:80,t:3.4,dps:d*.55,from,col});strike(a,(x,y)=>x*side>26&&x*side<150&&band(y,60),d,120);shake(2)}
    if(id==='special'){if(!hitN)G.hazards.push({x:a.x,y:a.y,r:215,t:4.2,dps:d*.75,from,col});strike(a,(x,y)=>Math.hypot(x,y)<215,d*.8,90);shake(2.5)}
  }
}
function updateMove(a,dt){const mv=a.mv;if(!mv)return;mv.t+=dt;const M=KIT[mv.key][mv.id];while(mv.hit<M.hits.length&&mv.t>=M.hits[mv.hit]*mv.dur){fireMove(a,mv,mv.hit);mv.hit++}if(mv.t>=mv.dur)a.mv=null}
function doMove(id){const p=G.p;if(p.carry||!kitOf(p)||p.guard||p.mv||p.stunT>0)return;if(id==='special'){if((p.specT||0)>0)return;p.specT=SPECIAL_CD*cdMulOf(p);G.banner=null}startMove(p,id,mouseAimX());if(id==='special')addLog('Special attack used. Ready again in '+Math.round(SPECIAL_CD*p.s.cdMul)+' seconds.')}
const mouseAimX=()=>{const p=G.p;return touchMode?p.x+Math.cos(p.face):mouse.x};
/* ---------- Voice-over: the browser's built-in speech, plus a synth stinger that always plays ---------- */
let VOICE=null;
function pickVoice(){if(!('speechSynthesis'in window))return null;const vs=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang));return vs.find(v=>/daniel|alex|fred|ralph|male|david|george/i.test(v.name))||vs[0]||null}
const VOICE_BUF={};let voiceSrc=null;
function loadVoices(){Object.entries(VOICE_CLIPS).forEach(([k,b64])=>{try{const bin=atob(b64),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);ac.decodeAudioData(u8.buffer,b=>{VOICE_BUF[k]=b},()=>{})}catch(e){}})}
/* Recorded lines play through the game's audio. The browser's own speech is only the backup. */
function voice(text){if(muted)return;if(typeof announceTier==='function'&&announceTier(text))return;(window.__voiceLog=window.__voiceLog||[]).push(text);const buf=VOICE_BUF[text.toLowerCase().replace(/\W+/g,'-').replace(/^-|-$/g,'')];
  if(buf&&ac){try{if(voiceSrc)voiceSrc.stop();const s=ac.createBufferSource(),g=ac.createGain();s.buffer=buf;s.playbackRate.value=.94;g.gain.value=.9;s.connect(g).connect(ac.destination);s.start();voiceSrc=s;window.__voicePlayed=(window.__voicePlayed||0)+1;return}catch(e){}}
  if(!('speechSynthesis'in window))return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);VOICE=VOICE||pickVoice();if(VOICE)u.voice=VOICE;u.pitch=.55;u.rate=.95;speechSynthesis.speak(u)}catch(e){}}
function tone(a,b,d,t,v,at=0){if(muted||!ac)return;try{const o=ac.createOscillator(),g=ac.createGain(),n=ac.currentTime+at;o.type=t;o.frequency.setValueAtTime(a,n);o.frequency.exponentialRampToValueAtTime(b,n+d);g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.001,n+d);o.connect(g).connect(ac.destination);o.start(n);o.stop(n+d)}catch(e){}}
function noiseHit(d,v){if(muted||!ac)return;try{const len=Math.floor(ac.sampleRate*d),b=ac.createBuffer(1,len,ac.sampleRate),c=b.getChannelData(0);for(let i=0;i<len;i++)c[i]=(Math.random()*2-1)*(1-i/len);const s=ac.createBufferSource(),g=ac.createGain();s.buffer=b;g.gain.value=v;s.connect(g).connect(ac.destination);s.start()}catch(e){}}
function stinger(level){const base=220*Math.pow(1.12,level);[0,.09,.18].forEach((at,i)=>tone(base*(1+i*.5),base*(1+i*.5)*1.02,.16,'square',.035,at))}
/* ---------- Kill combo ---------- */
const COMBO_WINDOW=6;
const COMBO_TIERS=[[2,'Double Kill','#ffffff'],[3,'Triple Kill','#fff0a0'],[4,'Quad Kill','#ffd860'],[5,'Killing Spree','#ffb040'],[8,'Rampage','#ff8040'],[12,'Massacre','#ff4a4a'],[16,'Unstoppable','#ff40a0'],[20,'Godlike','#c070ff'],[30,'Legendary','#70e0ff']];
const comboTier=n=>{let t=null;for(const c of COMBO_TIERS)if(n>=c[0])t=c;return t};
/* Party chain: one counter for the whole party, the same six second window and the same tier names.
   The bonuses below are the design's table; they stack with the tiers and apply to every player. */
const CHAIN_WINDOW=COMBO_WINDOW;
const CHAIN_BONUS=[[30,{cd:.8},'cooldowns 20% faster'],[20,{mana:2},'mana regen x2'],[12,{dmg:1.1},'damage +10%'],[5,{spd:1.05},'move speed +5%']];
const chainReset=()=>{G.chain={n:0,t:0,tier:null}};
function chainBonus(){const n=(G.chain&&G.chain.n)||0,b={spd:1,dmg:1,mana:1,cd:1,label:''};
  for(const c of CHAIN_BONUS)if(n>=c[0]){Object.assign(b,c[1]);if(!b.label)b.label=c[2]}
  return b}
function chainAdd(){if(!G.chain)chainReset();const c=G.chain;c.n++;c.t=CHAIN_WINDOW;
  const hit=COMBO_TIERS.findIndex(t=>t[0]===c.n);if(hit>=0){c.tier=COMBO_TIERS[hit];stinger(hit);if(!G.p.ult)voice(c.tier[1])}
  return c}
function chainTick(dt){if(!G.chain||!G.chain.n)return;G.chain.t-=dt;if(G.chain.t<=0)chainReset()}
const cdMulOf=p=>p.s.cdMul*chainBonus().cd;
const RAGE_SHARE_RANGE=500;
function rageShare(x,y,n){for(const q of G.players){if(q===G.p||q.deadT>0)continue;if(Math.hypot(q.x-x,q.y-y)<=RAGE_SHARE_RANGE)addRage(n*.35,q)}}
function onKill(e){
  const p=G.p;G.p.combo++;G.p.comboT=COMBO_WINDOW;G.p.comboPop=1;if(G.p.combo>p.bestCombo)p.bestCombo=G.p.combo;
  const hit=COMBO_TIERS.findIndex(c=>c[0]===G.p.combo);if(hit>=0){const t=COMBO_TIERS[hit];G.p.comboTier=t;stinger(hit);if(!G.p.ult)voice(t[1])}
  chainAdd();
  const base=e.kind==='boss'?60:e.vill?30:e.mob==='strong'?12:e.mob==='weak'?7:e.elite?16:8;
  const amt=base*(1+Math.min(G.p.combo,10)*.04)*(G.p.ult?.4:1);
  addRage(amt);rageShare(e.x,e.y,amt);
}
/* ---------- Rage and ultimates ---------- */
function addRage(n,p){p=p||G.p;const was=p.rage;p.rage=Math.min(100,p.rage+n);if(was<100&&p.rage>=100&&!p.ult){sfx('level');voice('Ultimate ready');text(p.x,p.y-90,'ULTIMATE READY','#ffd860',true);addLog('Rage is full. Press V for your ultimate.')}}
const ULT_HITS=[.7,1.05,1.4],ULT_LEN=1.9,ULT_RADIUS=720;
const ULT_BY_STAT={pow:['Earthshatter','255,140,50'],aim:['Bullet Storm','255,220,110'],mag:['Cataclysm','190,120,255'],grd:['Aegis Nova','120,200,255'],hea:['Judgment Light','130,255,170']};
const ULT_BY_KIT={necro:['Army of the Dead','110,255,170'],void:['Event Horizon','190,110,255'],toxic:['Plague Bloom','140,240,70']};
/* Name, color, animation family and emblem are authored for each playable character. */
const ULT_STYLE={
 Detective:['Case closed','255,207,112','rays','crosshair'],Vigilante:['Midnight justice','187,201,224','slash','hook'],Guardian:['Last bastion','255,205,94','shield','shield'],Ranger:['Rain of arrows','148,214,117','rays','arrow'],Inventor:['Overclock','100,242,209','tech','gear'],Firefighter:['Flashover','255,156,71','wave','axe'],
 'Hero Shadow':['Silent strike','181,130,153','slash','dagger'],Prodigy:['Power play','215,153,255','slash','bat'],Sage:['Arcane wisdom','211,168,255','rune','book'],Patriot:['Star spangled','255,108,105','shield','star'],Phantom:['Spectral passage','125,255,198','spiral','ghost'],Pyromancer:['Inferno','255,130,60','flame','flame'],Chronomancer:['Time fracture','112,221,255','orbit','clock'],Beastmaster:['Wild hunt','239,190,112','slash','claw'],Voidwalker:['Beyond the veil','170,137,255','spiral','portal'],Exorcist:['Sacred rite','255,229,159','rune','cross'],'Gravity Mage':['Gravity well','184,145,255','orbit','orbit'],Druid:['Wild bloom','139,238,139','bloom','leaf'],Cyborg:['System overload','105,224,255','tech','circuit'],Illusionist:['Grand illusion','255,118,193','shard','card'],
 Necromancer:['Army of the Dead','110,255,170','rune','skull'],'Blood Reaper':['Crimson harvest','255,91,109','slash','scythe'],'Toxin Alchemist':['Plague Bloom','140,240,70','bloom','flask'],'Soul Stealer':['Soul siphon','204,146,255','spiral','soul'],'Shadow Monarch':['Shadow dominion','192,108,255','slash','crown'],Puppeteer:['Cut the strings','237,147,255','rune','strings'],'Void Empress':['Event Horizon','190,110,255','orbit','crown'],'Plague Doctor':['Black remedy','169,227,117','bloom','mask'],'Mad Scientist':['Voltaic experiment','101,245,236','tech','bolt'],'Demon Knight':['Hellfire oath','255,126,66','flame','sword'],'Gravity Weaver':['Crushing orbit','199,132,255','spiral','orbit'],'Mecha Tyrant':['Iron supremacy','255,103,83','tech','target'],'Chrono Thief':['Stolen seconds','255,214,111','tech','clock'],'Swarm Queen':['Royal swarm','229,221,98','bloom','stinger'],'Ice Archmage':['Winter crown','153,225,255','shard','snow'],'Deep Siren':['Abyssal call','115,239,225','wave','trident'],'Ash Shaman':['Ashen spirits','247,143,101','flame','skull'],'Soul Forger':['Soulforge','255,163,74','rays','hammer'],'Mirror Jester':['Shattered reflection','255,125,196','shard','mirror'],'Cyber Priest':['Digital absolution','111,242,226','tech','cross']
};
function ultOf(p){const u=ULT_STYLE[p.char];if(u)return u;const k=kitOf(p);if(k)return ULT_BY_KIT[k];let b='pow';for(const s in p.stats)if(p.stats[s]>p.stats[b])b=s;return ULT_BY_STAT[b]}
function doUlt(){
  const p=G.p;if(p.carry||G.p.ult||p.rage<100||G.mode!=='play'||G.clearPending)return false;
  if(G.players.length>1)openLink(p);
  const [name,col]=ultOf(p);achievementUnlock(p,'ultimate');p.rage=0;p.guard=false;p.mv=null;G.p.ult={t:0,hit:0,name,col,seed:Math.random()*99};p.inv=ULT_LEN;
  G.fx.push({k:'ultStyle',x:p.x,y:p.y-28,t:.7,m:.7,char:p.char,phase:'charge',c:col});
  const k=kitOf(p);if(k)p.mv={id:'special',key:k,t:0,dur:KIT[k].special.dur,hit:99,side:Math.cos(p.face)>=0?1:-1,mirror:KIT[k].special.face!==0&&(Math.cos(p.face)>=0?1:-1)!==KIT[k].special.face};
  audioOn();tone(60,420,.68,'sawtooth',.06);tone(90,630,.68,'square',.025);voice(name+'!');return true;
}
function tickUlt(dt){const u=G.p.ult,p=G.p;u.t+=dt;p.inv=Math.max(p.inv,.3);if(p.mv)p.mv.t=Math.min(p.mv.dur*.98,u.t/ULT_LEN*p.mv.dur);else p.castT=.3;
  while(u.hit<ULT_HITS.length&&u.t>=ULT_HITS[u.hit]){ultHit(u,u.hit);u.hit++}
  if(u.t>=ULT_LEN){G.p.ult=null;p.mv=null}}
const bossUltDamage=(e,d)=>e.maxHp*.04/partySize();
/* One ultimate hit, with the link bonus applied once, after the boss share is worked out. */
function ultDmgFor(e,p,lb){const sk=Math.max(...Object.values(p.stats)),d=p.s.dmg*STAT_MUL[sk-1]*dmgMul()*6;
  return e&&e.kind==='boss'?bossUltDamage(e,d)*(1+lb):d*(1+lb)}
function ultHit(u,n){
  const p=G.p,sk=Math.max(...Object.values(p.stats)),lb=linkBonus(p),d=p.s.dmg*STAT_MUL[sk-1]*dmgMul()*6;
  shake(12);tone(70,28,.5,'sawtooth',.09);noiseHit(.45,.13);
  if(n===0){G.shots=G.shots.filter(s=>s.from!=='e');G.hazards=(G.hazards||[]).filter(h=>h.from!=='e')}
  G.fx.push({k:'ultStyle',x:p.x,y:p.y-30,t:.55,m:.55,char:p.char,phase:'burst',beat:n,c:u.col});
  for(const e of G.enemies.slice()){if(e.dead||e.fleshDown||e.scrapDown||dist(e,p)>ULT_RADIUS)continue;const a=Math.atan2(e.y-p.y,e.x-p.x);G.fx.push({k:'ultStyle',x:e.x,y:e.y-25,t:.4,m:.4,char:p.char,phase:'impact',c:u.col});glowP(e.x,e.y-30,u.col,8,190,.5,4);const hp=e.fleshSplit&&G.flesh?G.flesh.one.fleshTotal:e.hp;hitEnemy(e,ultDmgFor(e,p,lb),a,260);const after=e.fleshSplit&&G.flesh?G.flesh.one.fleshTotal:e.hp;if(G.link&&G.link.ids.includes(p.id)&&!e.dead&&!e.fleshDown)G.link.hits.push({e,p,base:Math.max(0,hp-after)/(1+lb),bonus:lb})}
  for(const c of (G.props||[]).slice())if(c.kind==='scrapPart'&&!c.done&&dist(c,p)<ULT_RADIUS)scrapPartHit(c,p);
  for(const c of G.npcs)if(!c.dead&&dist(c,p)<ULT_RADIUS)hitNpc(c,d,Math.atan2(c.y-p.y,c.x-p.x),true);
}
/* ---------- Linked ultimates ---------- */
const LINK_WINDOW=3;
const LINK_TIERS=[[4,1,'Full Party'],[3,.7,'Trio'],[2,.4,'Duo']];
function linkTier(n){let t=null;for(const c of LINK_TIERS)if(n>=c[0]&&(!t||c[0]>t[0]))t=c;return t}
const linkBonus=p=>{const L=G.link;return L&&L.t>0&&L.ids.indexOf(p.id)>=0?L.dmg:0};
function linkClearFire(){G.shots=G.shots.filter(s=>s.from!=='e');G.hazards=(G.hazards||[]).filter(h=>h.from!=='e')}
function linkEffect(L,t){
  /* Credit earlier hits when another player joins after they landed. */
  const me=G.p,shown=new Set();for(const h of L.hits){if(h.e.dead||h.e.fleshDown||h.e.scrapDown||h.bonus>=t[1]||bossWarded(h.e))continue;G.p=h.p;const dmg=h.base*(t[1]-h.bonus);h.bonus=t[1];h.e.hp-=dmg;if(!shown.has(h.e)){text(h.e.x,h.e.y-125,'LINK BONUS','#8fe6ff',true);shown.add(h.e)}threatAdd(h.e,h.p.id||0,100*dmg/Math.max(1,h.e.maxHp));bossPhaseCheck(h.e);if(h.e.hp<=0)killEnemy(h.e)}G.p=me;
  if(L.ids.length>=2){for(const q of G.players)if(L.ids.includes(q.id))achievementUnlock(q,'link');linkClearFire()}
  if(L.ids.length>=3)for(const q of G.players)q.inv=Math.max(q.inv,ULT_LEN);
  if(L.ids.length>=4){for(const q of G.players)if(!(q.deadT>0||q.respawnT>0))q.hp=q.s.maxHp;
    if(G.boss&&!G.boss.dead&&(G.boss.staggerT||0)<=0){if((G.boss.kit||G.stage)===7&&(G.boss.phase||0)>=2)bossGuard(G.boss,BOSS_GUARD_GAIN.special);else{G.boss.staggerT=BOSS_STAGGER;G.boss.guard=0}}}
  for(const q of G.players)if(L.ids.indexOf(q.id)>=0)text(q.x,q.y-118,t[2].toUpperCase()+' LINK · +'+Math.round(t[1]*100)+'%','#8fe6ff',true);
  voice(t[2]+' link');
}
function openLink(p){
  const L=G.link;
  if(L&&L.t>0){
    if(L.ids.indexOf(p.id)>=0)return;
    L.ids.push(p.id);L.t=LINK_WINDOW;
    const t=linkTier(L.ids.length);
    if(t&&t[1]>L.dmg){L.dmg=t[1];L.name=t[2];linkEffect(L,t)}
    return
  }
  G.link={t:LINK_WINDOW,ids:[p.id],dmg:0,name:'',hits:[]};
  for(const q of G.players)if(q.id!==p.id)text(q.x,q.y-118,'LINK NOW!','#8fe6ff',true);
}
function tickLink(dt){const L=G.link;if(!L)return;L.t-=dt;if(L.t<=0)G.link=null}
const gymCost=r=>Math.round(40*Math.pow(1.3,r));
const shopCost=s=>Math.round(s.base*(1+(G.stage-1)*.35));
const guardArmor=p=>(8+p.stats.grd*10+p.lvl*1.4)*(p.weapon==='shield'?1.6:1)*p.s.guardMul;
function moveVec(){let x=0,y=0;if(keys.has('KeyA')||keys.has('ArrowLeft'))x--;if(keys.has('KeyD')||keys.has('ArrowRight'))x++;if(keys.has('KeyW')||keys.has('ArrowUp'))y--;if(keys.has('KeyS')||keys.has('ArrowDown'))y++;if(joy.on){x=joy.dx;y=joy.dy}const m=Math.hypot(x,y);if(m>1){x/=m;y/=m}return{x,y}}
function doDash(){const p=G.p;if(p.cd.dash>0||p.stunT>0||p.grabT>0||p.webT>0)return;const v=moveVec(),a=(v.x||v.y)?Math.atan2(v.y,v.x):p.face;p.cd.dash=p.s.dashCd*cdMulOf(p);p.dashT=.26;p.dashX=Math.cos(a);p.dashY=Math.sin(a);p.inv=Math.max(p.inv,.32+Math.min(3,(p.runBoons||{}).wide||0)*.12);sfx('dash')}
function usePotion(){const p=G.p;if(p.cd.potion>0||p.potions<=0||p.hp>=p.s.maxHp)return;p.potions--;p.cd.potion=1;p.pickT=.4;p.healFx=.8;const h=Math.min(p.s.maxHp-p.hp,p.s.maxHp*.45);p.hp+=h;threatHeal(p,h);text(p.x,p.y-72,'+'+Math.round(h),'#86dccb',true);burst(p.x,p.y-20,'#86dccb',16);sfx('pull');dirty()}
function useFast(){const p=G.p;if(p.fast<=0||p.fastT>0)return;p.fast--;p.fastT=20;p.pickT=.4;p.pillT=.8;p.pillC='111,180,255';text(p.x,p.y-72,'Fast Pill','#6fb4ff',true);sfx('loot');dirty()}
function useMagic(){const p=G.p;if(p.magic<=0||p.magicT>0)return;p.magic--;p.magicT=20;p.pickT=.4;p.pillT=.8;p.pillC='200,140,255';text(p.x,p.y-72,'Magic Pill','#c88cff',true);sfx('loot');dirty()}
function pickup(l){
  const p=G.p;p.pickT=.45;
  if(l.kind==='gold'){p.gold+=l.amt;text(l.x,l.y-10,'+'+l.amt+' gold','#e8c95c');sfx('loot');dirty();return}
  if(l.kind==='weapon'){const W=WEAPONS[l.w];if(p.weapons.includes(l.w)){const g=1+G.stage;p.gold+=g;text(l.x,l.y-10,'+'+g+' gold','#e8c95c');sfx('loot');dirty();return}p.weapons.push(l.w);text(l.x,l.y-14,'New weapon: '+W.n,'#f0c23c',true);addLog('New weapon: <b>'+esc(W.n)+'</b>. Press Tab to change.');sfx('level');dirty();writeSave();return}
  if(l.kind!=='item'){const nm={potions:'Potion',fast:'Fast Pill',magic:'Magic Pill'}[l.kind];p[l.kind]=Math.min(9,p[l.kind]+1);text(l.x,l.y-10,nm,'#86dccb');sfx('loot');dirty();return}
  const it=l.item,cur=p.gear[it.slot];sfx('loot');
  if(!cur){p.gear[it.slot]=it;recalc();addLog('<span class="r'+it.rar+'">'+esc(it.name)+'</span> worn.')}else{stash(it);addLog('<span class="r'+it.rar+'">'+esc(it.name)+'</span> added to bag.')}
  text(l.x,l.y-14,it.name,RAR[it.rar].c);dirty();
}
function stash(it){const p=G.p;p.bag.unshift(it);if(p.bag.length>12){const w=p.bag.reduce((a,b)=>b.score<a.score?b:a);p.bag.splice(p.bag.indexOf(w),1);const g=salvage(w);p.gold+=g;addLog('Bag full. Sold '+esc(w.name)+' for '+g+' gold.')}}
function stageCleared(){const n=G.stage;for(const p of G.players){if(n>=p.maxStage)p.maxStage=Math.min(10,n+1);p.beaten=Math.max(p.beaten,n);if(G.mp&&G.players.length>1)achievementUnlock(p,'partyBoss');achievementCheck(p)}G.clearPending=1.6;writeSave()}

/* ---------- Update ---------- */
function nearestEnemy(){let b=null,bd=380;for(const e of G.enemies){if(e.dead||e.fleshDown||e.scrapDown||concealed(e,G.p))continue;const d=dist(e,G.p);if(d<bd&&los(e,G.p)){bd=d;b=e}}for(const c of G.props||[]){if((c.kind||c.k)!=='scrapPart'||c.done||c.d)continue;const d=dist(c,G.p);if(d<bd&&los(c,G.p)){bd=d;b=c}}return b}
function updatePlayer(p,dt){
  G.p=p;applyInput(p);if(p.respawnT>0){p.respawnT-=dt;p.moving=false;if(p.respawnT<=0)respawn(p);return}if(p.deadT>0){p.inv=Math.max(0,p.inv-dt);p.deadT-=dt;if(p.deadT<=0){if(p.windDown){p.windDown=false;revive(p)}else bleedOut(p);return}const v=moveVec();move(p,v.x*p.s.speed*.25*dt,v.y*p.s.speed*.25*dt);p.moving=!!(v.x||v.y);if(p.moving){p.walk+=dt*5;p.moveA=Math.atan2(v.y,v.x)}return}
  updateRevive(p,dt);
  p.weaponHealCd=Math.max(0,(p.weaponHealCd||0)-dt);p.teamCd=Math.max(0,(p.teamCd||0)-dt);p.breakReady=Math.max(0,(p.breakReady||0)-dt);p.tauntGuard=Math.max(0,(p.tauntGuard||0)-dt);if(p.mendT>0){const t=Math.min(dt,p.mendT);p.mendT-=t;const h=Math.min(p.s.maxHp-p.hp,p.mendRate*t),healer=G.players.find(q=>q.id===p.mendBy);p.hp+=h;if(healer)threatHeal(healer,h)}
  for(const k in p.cd)p.cd[k]=Math.max(0,p.cd[k]-dt);
  p.inv=Math.max(0,p.inv-dt);p.swing=Math.max(0,p.swing-dt);p.atkT=Math.max(0,p.atkT-dt);p.pickT=Math.max(0,p.pickT-dt);p.hitT=Math.max(0,p.hitT-dt);p.castT=Math.max(0,p.castT-dt);p.guard=(mouse.right||touchHold.guard)&&p.dashT<=0;
  if(p.fastT>0)p.fastT-=dt;if(p.magicT>0)p.magicT-=dt;
  p.mana=Math.min(p.s.maxMana,p.mana+p.s.regen*dt*chainBonus().mana);if(auraHas(p,'medic'))p.hp=Math.min(p.s.maxHp,p.hp+p.s.maxHp*.006*dt);
  p.specT=Math.max(0,(p.specT||0)-dt);p.healFx=Math.max(0,(p.healFx||0)-dt);p.pillT=Math.max(0,(p.pillT||0)-dt);updateMove(p,dt);const v=moveVec(),drag=archKey(p.char)==='scout'&&p.reviveTarget?G.players.find(q=>q.id===p.reviveTarget&&q.deadT>0):null,ox=p.x,oy=p.y,sp=envSpeed(p)*p.s.speed*(auraHas(p,'scout')?1.08:1)*(drag?.5:1)*(p.fastT>0?1.4:1)*(p.guard?.55:1)*(p.mv?.3:1)*chainBonus().spd;p.moving=!!(v.x||v.y);
  if(p.dashT>0&&!(p.webT>0)){p.dashT-=dt;move(p,p.dashX*520*dt,p.dashY*520*dt)}
  else{move(p,v.x*sp*dt,v.y*sp*dt);if(p.moving){p.walk+=dt*11;p.moveA=Math.atan2(v.y,v.x)}}
  if(drag)move(drag,p.x-ox,p.y-oy);
  /* Arena doors: a living boss keeps the party inside. */
  if(G.arena&&G.boss){const ad=Math.hypot(p.x-G.arena.x,p.y-G.arena.y);if(ad>G.arena.r){const aa=Math.atan2(p.y-G.arena.y,p.x-G.arena.x);p.x=G.arena.x+Math.cos(aa)*G.arena.r;p.y=G.arena.y+Math.sin(aa)*G.arena.r}}
  if(touchMode){const n=nearestEnemy();if(n)p.face=Math.atan2(n.y-p.y,n.x-p.x);else if(p.moving)p.face=Math.atan2(v.y,v.x)}else p.face=Math.atan2(mouse.y-(p.y-22),mouse.x-p.x);
  if(mouse.left||touchHold.slash)doAttack();
  tagOwned(p);
  /* Carry steps: walk over an item to lift it, walk into the drop zone to deliver it. */
  if(G.obj){const st=G.obj.steps[G.obj.i];
    if(st&&(st.kind==='carry'||st.kind==='generator')){const items=G.obj.items||[];
      if(!p.carry&&!p.mv&&!p.ult){const c=items.find(c=>!c.done&&!c.by&&dist(p,c)<28);if(c){c.by=p.id||0;p.carry=c;text(p.x,p.y-70,'Carrying','#8fd6ff',true)}}
      if(p.carry){p.carry.x=p.x;p.carry.y=p.y;const d=G.obj.vents?G.obj.vents.find(v=>!v.done&&dist(p,v)<v.r):G.obj.drop&&dist(p,G.obj.drop)<G.obj.drop.r?G.obj.drop:null;if(d){if(G.obj.vents)d.done=true;p.carry.done=true;p.carry.by=0;p.carry=null;text(p.x,p.y-70,'Delivered','#8fd6ff',true);sfx('loot')}}
      if(p.carry&&p.carry.done)p.carry=null}}
  p.nearSafe=dist(p,G.safe)<70;
  if(p.nearSafe&&!(G.swarm&&G.swarm.breakT<=0))p.hp=Math.min(p.s.maxHp,p.hp+p.s.maxHp*.08*dt);
}
/* Shots and hazards remember who made them, so kills and leech go to the right player */
function tagOwned(p){for(const s of G.shots)if(s.from==='p'&&s.pid===undefined)s.pid=p.id;for(const h of (G.hazards||[]))if(h.from!=='e'&&h.pid===undefined)h.pid=p.id}
function update(dt){
  const real=dt;let slow=1;
  chainTick(real);tickLink(real);
  for(const p of G.players){G.p=p;if(p.ult){tickUlt(real);tagOwned(p);if(!G.mp&&p.ult)slow=p.ult.t<ULT_HITS[0]?.06:.45}else if(p.combo){p.comboT-=real;if(p.comboT<=0){p.combo=0;p.comboTier=null}}p.comboPop=Math.max(0,p.comboPop-real*4)}
  dt*=slow;bossEggTick(dt);G.t+=dt;G.hour=(G.hour+dt/20)%24;objStep(dt);
  for(const p of G.players)updatePlayer(p,dt);
  valeTick(dt);G.p=G.players[0];
  G.flowT-=dt;if(G.flowT<=0){G.flowT=.25;updateFlow()}
  // keep the streets populated: more rivals at night, more citizens by day
  const n=nightness(G.hour);G.spawnT-=dt;
  if(G.swarm)swarmTick(dt);else if(G.spawnT<=0){G.spawnT=1.4;const target=Math.round((9+G.stage+Math.round(n*5))*partyCrowd()),count=G.enemies.filter(e=>e.kind==='rival').length;if(count<target&&!G.clearPending&&!stalkerDue()&&!lurkerDue()&&!webberDue()&&!bloaterDue()&&!shieldbearerDue()&&!scrapGolemDue())useMobs()?spawnMob(520):spawnRival(520);
    const wantN=Math.round(14*(1-n)+3);if(G.npcs.length<wantN)spawnNpc();else if(G.npcs.length>wantN)G.npcs.splice(G.npcs.findIndex(c=>!c.wounded&&dist(c,nearestPlayer(c))>500)>>>0,1)}
  if(useMobs()&&!G.clearPending&&!G.swarm){G.villT-=dt;if(G.villT<=0){G.villT=60;spawnVillainPair()}}
  updateNpcs(dt);tickHazards(dt);G.p=G.players[0];
  for(const c of G.w.cars){if(c.v){c.y+=c.s*dt;if(c.y<-60)c.y=MH*T+60;if(c.y>MH*T+60)c.y=-60}else{c.x+=c.s*dt;if(c.x<-60)c.x=MW*T+60;if(c.x>MW*T+60)c.x=-60}}
  tideTick(dt);lanternTick(dt);sporeBossTick(dt);scrapTick(dt);for(const q of G.players){playerStatus(q,dt);toxinStep(q,dt);rustStep(q,dt)}ghoulTick(dt)
  for(const q of G.players){if(q.lx!==undefined&&dt>0){q.vx=(q.x-q.lx)/dt;q.vy=(q.y-q.ly)/dt}q.lx=q.x;q.ly=q.y}
  for(const e of G.enemies){G.p=threatTarget(e);e.targetId=G.p?(G.p.id||0):0;const a0=e.ang;updateEnemy(e,dt);if(e.method==='shield'&&!e.dead)e.ang=turnTo(a0||0,e.ang||0,AI.guardTurn*dt);goreTrail(e,dt)}
  for(let i=0;i<G.enemies.length;i++){const a=G.enemies[i];if(a.dead||a.fleshDown||a.scrapDown||!a.aware)continue;for(let j=i+1;j<G.enemies.length;j++){const b=G.enemies[j];if(b.dead||b.fleshDown||b.scrapDown)continue;const dx=b.x-a.x,dy=b.y-a.y,m=a.r+b.r,d2=dx*dx+dy*dy;if(d2<m*m&&d2>.01){const d=Math.sqrt(d2),o=(m-d)*.5,ox=dx/d*o,oy=dy/d*o;if(a.kind!=='boss')move(a,-ox,-oy);if(b.kind!=='boss')move(b,ox,oy)}}}
  G.enemies=G.enemies.filter(e=>!e.dead);
  for(const s of G.shots){s.life-=dt;const nx=s.x+s.vx*dt,ny=s.y+s.vy*dt;if(s.from==='p')G.p=ownerOf(s);
    if(wall(nx/T|0,(ny+22)/T|0)){s.life=0;if(s.from==='p'&&!s.small)explode(s);else impact(s);continue}
    s.x=nx;s.y=ny;trail(s,dt);
    if(s.from==='e'||s.from==='p'){for(const c of G.npcs){if(!c.dead&&!c.wounded&&Math.hypot(c.x-s.x,c.y-22-s.y)<c.r+s.r+3){s.life=0;if(s.from==='p'&&!s.small)explode(s);else{impact(s);hitNpc(c,s.dmg,Math.atan2(s.vy,s.vx),s.from==='p')}break}}if(s.life<=0)continue}
    if(s.from==='p'){let propHit=false;for(const c of G.props||[])if((c.kind==='egg'||c.kind==='scrapPart')&&!c.done&&Math.hypot(c.x-s.x,c.y-22-s.y)<c.r+s.r+4){if(c.kind==='egg')eggHit(c);else scrapPartHit(c,G.p);s.life=0;propHit=true;break}if(propHit)continue;for(const q of G.players)if(q!==G.p&&q.webT>0&&Math.hypot(q.x-s.x,q.y-22-s.y)<q.r+s.r+4){clearWeb(q,G.p);s.life=0;propHit=true;break}if(propHit)continue;for(const e of G.enemies){if(!e.dead&&!e.fleshDown&&!e.scrapDown&&!(s.hitTargets&&s.hitTargets.includes(e))&&Math.hypot(e.x-s.x,e.y-22-s.y)<e.r+s.r+4){if(s.small){impact(s);hitEnemy(e,s.dmg,Math.atan2(s.vy,s.vx),90);if(s.pierce>0){G.fx.push({k:'pierceFx',x:s.x,y:s.y,a:Math.atan2(s.vy,s.vx),t:.22,m:.22});(s.hitTargets||(s.hitTargets=[])).push(e);s.pierce--}else s.life=0}else{s.life=0;explode(s)}break}}}
    else for(const q of G.players){if(!(q.respawnT>0)&&Math.hypot(q.x-s.x,q.y-22-s.y)<q.r+s.r+2){s.life=0;G.p=q;if(s.web&&!(q.inv>0||q.deadT>0)){q.webT=WEBBED.webTime;q.dashT=0;G.banner={t:2.5,a:'Webbed',b:G.players.length>1?'An ally can attack the web to free you':'The web breaks after 5 seconds'};text(q.x,q.y-70,'WEBBED','#e6e6c8',true)}hurtPlayer(s.dmg);impact(s);break}}}
  G.shots=G.shots.filter(s=>s.life>0);G.enemies=G.enemies.filter(e=>!e.dead);
  G.loot=G.loot.filter(l=>{l.t+=dt;const p=nearestPlayer(l);G.p=p;const d=dist(l,p),mag=(l.kind==='item'||(l.kind==='weapon'&&!p.weapons.includes(l.w)))?0:96;if(mag&&d<mag){const a=Math.atan2(p.y-l.y,p.x-l.x);l.x+=Math.cos(a)*300*dt;l.y+=Math.sin(a)*300*dt}if(d<(l.kind==='item'||l.kind==='weapon'?30:18)){pickup(l);return false}return true});
  for(const q of alivePlayers()){if(G.gate.open&&!G.boss&&!G.clearPending&&!(q.deadT>0||q.respawnT>0)&&dist(q,G.gate)<46){G.p=q;summonBoss()}}
  if(G.clearPending){G.clearPending-=dt;if(G.clearPending<=0){G.clearPending=0;if(G.mode==='play')setMode('clear')}}
  fleshTick(dt);G.p=G.players[0];tickFx(dt);
  if(G.banner){G.banner.t-=dt;if(G.banner.t<=0)G.banner=null}
}
function fearedPlayer(c){let found=null,bd=170;for(const p of alivePlayers()){const d=dist(p,c);if((p.killerT||0)>0&&d<bd){found=p;bd=d}}return found}
function updateNpcs(dt){const boss=!!G.boss;G.quipT-=dt;for(const p of G.players)p.killerT=Math.max(0,(p.killerT||0)-dt);
  for(const c of G.npcs){if(c.dead)continue;const p=nearestPlayer(c);G.p=p;if(c.wounded){c.moving=false;continue}c.t-=dt;c.qt=Math.max(0,c.qt-dt);c.scare=Math.max(0,c.scare-dt);c.flash=Math.max(0,c.flash-dt);
    if(c.kx||c.ky){move(c,c.kx*dt,c.ky*dt);const de=Math.pow(.01,dt);c.kx*=de;c.ky*=de}
    let threat=null,td=230;for(const e of G.enemies){if(e.dead)continue;const d=dist(e,c);if(d<td){td=d;threat=e}}
    if(!threat)threat=fearedPlayer(c);
    if(threat||c.scare>0){const from=threat||p,a=Math.atan2(c.y-from.y,c.x-from.x)+Math.sin(G.t*3+c.walk)*.5,sp=c.sp*2.4;const hit=move(c,Math.cos(a)*sp*dt,Math.sin(a)*sp*dt);c.dx=Math.cos(a);c.dy=Math.sin(a);c.walk+=dt*14;if(hit){c.kx+=rnd(-90,90);c.ky+=rnd(-90,90)}if(threat&&threat!==p&&Math.random()<.008)say(c,'danger');continue}
    if(c.t<=0){c.t=rnd(2,6);const a=pick([[1,0],[-1,0],[0,1],[0,-1],[0,0]]);c.dx=a[0];c.dy=a[1]}
    if(c.dx||c.dy){const before=[c.x,c.y];const hit=move(c,c.dx*c.sp*dt,c.dy*c.sp*dt);c.walk+=dt*8;if(hit&&before[0]===c.x&&before[1]===c.y)c.t=0}
    if(G.quipT<=0&&dist(c,p)<120&&c.qt<=0){const hero=factionOf(p.char)==='hero',n=nightness(G.hour);const kind=(p.killerT||0)>0?'killer':boss?'boss':p.hp<p.s.maxHp*.35?'lowHp':G.gate.open&&Math.random()<.3?'gate':Math.random()<.4?(hero?'hero':'villain'):(n>.5?'idleNight':'idleDay');say(c,kind);G.quipT=rnd(4,8)}
  }
  G.npcs=G.npcs.filter(c=>!c.dead);
}
function trail(s,dt){const c=s.col||'255,200,120',f=s.fx;s.tr=(s.tr||0)-dt;s.spin=(s.spin||0)+dt*(f==='card'?22:6);if(s.tr>0)return;s.tr=f==='comet'?.012:.03;
  if(f==='comet'){glowP(s.x,s.y,c,2,50,.5,5);glowP(s.x,s.y,'255,255,255',1,20,.2,2)}else if(f==='orb'||f==='arcane'||f==='skull')glowP(s.x,s.y,c,1,40,.45,4);else if(f==='ember'){glowP(s.x,s.y,'255,140,50',2,60,.5,4)}else if(f==='flask')glowP(s.x,s.y,c,1,30,.5,3.5);else if(f==='plasma')glowP(s.x,s.y,c,1,30,.25,3);else if(f==='card')glowP(s.x,s.y,c,1,50,.35,2.5)}
function tickFx(dt){for(const f of G.fx){f.t-=dt;if(f.k==='p'){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.92;f.vy*=.92}}G.fx=G.fx.filter(f=>f.t>0);
  for(const f of G.fx){if(f.k==='g'){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.93;f.vy*=.93}else if(f.k==='blood'||f.k==='gib'){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vz+=760*dt;f.z+=f.vz*dt;if(f.spin)f.rot+=f.spin*dt;if(f.z>=0&&f.vz>0){if(f.k==='blood'){if(Math.random()<GORE.mark)addDecal(f.x,f.y,f.s*rnd(.9,2.2),false);f.t=0}else{addDecal(f.x,f.y,f.s*.8,false);f.vz*=-.32;f.vx*=.5;f.vy*=.5;f.spin*=.5;f.z=0}}}}
  for(const x of G.texts){x.t-=dt;x.y-=34*dt}G.texts=G.texts.filter(x=>x.t>0);G.shake*=Math.pow(.002,dt);
  const c=G.cam,p=G.p;c.x+=(p.x-c.x)*Math.min(1,dt*8);c.y+=(p.y-30-c.y)*Math.min(1,dt*8)}
function steer(e,dt,sp,seen){const a=seen?Math.atan2(G.p.y-e.y,G.p.x-e.x):flowAngle(e);if(a===null||a===undefined)return;const sp2=sp*(e.slowT>0?.6:1);e.ang=a;move(e,Math.cos(a)*sp2*dt,Math.sin(a)*sp2*dt);e.walk=(e.walk||0)+dt*(sp2/18);e.moving=true}
/* Enemy behaviour, all tuned here. Every attack still shows a wind-up: tracking stops before the hit, so a late dodge always works. */
const AI={tokens:2,engage:210,ring:125,tokenHold:3,leash:1400,forget:8,alert:260,commit:.35,turn:4.5,lunge:1.5,rusherWind:[.32,.5],bruteWind:[.7,1],comboWind:.3,combo:{rusher:.35,brute:.5,stalker:.35},delay:.24,delayChance:.6,punishR:280,punishCd:5,rush:1.5,rushT:.9,lead:.75,leadMax:140,keep:170,healerKeep:300,strafe:.55,guardTurn:2.2,camp:170,hideAfter:6,bossChain:.3,bossChainLow:.6,bossPunishCd:5};
const turnTo=(a,b,m)=>{const d=((b-a+Math.PI)%TAU+TAU)%TAU-Math.PI;return a+clamp(d,-m,m)};
/* Only a few enemies press one player at once. The rest circle and take over when a slot frees up. */
function aiToken(e,p){const id=p.id||1;if(e.tok===id&&e.tokT>G.t)return true;if(e.cd>.3)return false;if(G.enemies.filter(o=>o!==e&&!o.dead&&o.tok===id&&o.tokT>G.t).length>=AI.tokens)return false;e.tok=id;e.tokT=G.t+AI.tokenHold;return true}
function aiOrbit(e,p,dt){if(e.slotA===undefined)e.slotA=rnd(TAU);e.slotA+=dt*.35*(e.ph>Math.PI?1:-1);const R=AI.ring+(e.role==='brute'?30:0),dx=p.x+Math.cos(e.slotA)*R-e.x,dy=p.y+Math.sin(e.slotA)*R-e.y,L=Math.hypot(dx,dy);e.ang=Math.atan2(p.y-e.y,p.x-e.x);if(L<8)return;if(move(e,dx/L*e.sp*.85*dt,dy/L*e.sp*.85*dt))e.slotA+=1;e.walk+=dt*6;e.moving=true}
function aiStartAttack(e,p){const w=e.role==='brute'?AI.bruteWind:AI.rusherWind,c=AI.combo[e.role]||0;e.wind=e.windMax=rnd(w[0],w[1]);e.delayed=false;e.comboLeft=Math.random()<c?1:0;e.ang=Math.atan2(p.y-e.y,p.x-e.x)}
/* Aim follows the player, then commits. The last part of the wind-up steps forward along the committed line. */
function aiWindUp(e,p,dt){const m=e.windMax||e.wind;if(e.wind>m*AI.commit)e.ang=turnTo(e.ang,Math.atan2(p.y-e.y,p.x-e.x),AI.turn*dt);else{move(e,Math.cos(e.ang)*e.sp*AI.lunge*dt,Math.sin(e.ang)*e.sp*AI.lunge*dt);e.moving=true}}
function aiAfterSwing(e,p){if(e.comboLeft>0&&dist(e,p)<e.a.range+e.r+p.r+60){e.comboLeft--;e.wind=e.windMax=AI.comboWind;e.delayed=true;e.ang=Math.atan2(p.y-e.y,p.x-e.x)}else e.tok=0}
/* Healing, taking a pill or reviving someone leaves a player open, so nearby enemies rush them. */
const aiOpen=p=>p.healFx>.4||p.pillT>.4||p.reviveProgress>0;
function aiPunish(e,p,d,seen){if((e.punishCd||0)>0||d>=AI.punishR||!seen||!aiOpen(p))return;e.punishCd=AI.punishCd;e.rushT=AI.rushT;e.cd=Math.min(e.cd,.05);e.tok=p.id||1;e.tokT=G.t+2;text(e.x,e.y-88,'!','#ff8f80',true)}
const aiLead=(e,p,sp,k=AI.lead)=>{const t=dist(e,p)/sp,x=clamp((p.vx||0)*t*k,-AI.leadMax,AI.leadMax),y=clamp((p.vy||0)*t*k,-AI.leadMax,AI.leadMax);return Math.atan2(p.y+y-e.y,p.x+x-e.x)};
/* A player in the safehouse is safe, but enemies wait outside instead of forgetting them. */
function aiCamp(e,p,dt,d){e.wind=0;e.ang=Math.atan2(p.y-e.y,p.x-e.x);if(d<AI.camp){const b=e.ang+Math.PI;move(e,Math.cos(b)*e.sp*dt,Math.sin(b)*e.sp*dt);e.walk+=dt*6;e.moving=true}else if(d>AI.camp+50)steer(e,dt,e.sp,dist(e,p)<560&&los(e,p))}
/* ---------- The Swarm ----------
   Endless waves on a stage map. Wave n sends base + step * n enemies, scaled by party size, with at most `cap`
   alive at once; past that, waves get tougher instead of bigger. Every bossEvery waves a boss joins, rotating the
   three stage bosses. A wipe or a solo death ends the run and a new one starts. Nothing earned carries back to
   the story character: saves pause in single-player, and the server saves the snapshot from the run's start. */
const SWARM={base:8,step:4,cap:50,spawnEvery:.45,first:5,breakT:15,overT:8,bossEvery:5,toughFrom:6,tough:.06,hurt:.04,strongMax:.45,rivalFrom:3,specialFrom:4,bossLife:.15};
const SWARM_KEEP=['lvl','xp','gold','potions','fast','magic','gear','bag','weapons','weapon','weaponUpgrades','runBoons','skills','train','sp','kills','rage','bestCombo','maxStage','beaten'];
const swarmSnap=q=>{const o={};for(const k of SWARM_KEEP)o[k]=q[k];return JSON.parse(JSON.stringify(o))};
function startSwarm(){G.flesh=null;G.valeT=VALE.first;G.swarm={wave:0,left:0,total:0,spawned:0,spawnT:0,breakT:SWARM.first,over:false,overT:0};G.obj=null;G.gate.open=false;G.enemies=[];G.boss=null;G.arena=null;G.clearPending=0;G.props=[];G.shots=[];G.hazards=[];G.loot=[];G.fx=[];G.link=null;G.chain={n:0,t:0,tier:null};
  for(const q of G.players)q.swarmSave=swarmSnap(q);G.banner={t:3.2,a:'The Swarm',b:'Hold out for as many waves as you can'}}
function nextWave(){const S=G.swarm;S.wave++;S.spawned=0;S.spawnT=0;const boss=S.wave%SWARM.bossEvery===0;S.total=Math.round((SWARM.base+SWARM.step*S.wave)*partyCrowd()*(boss?.5:1));
  if(boss){const kit=((S.wave/SWARM.bossEvery-1)%3)+1,at=randomOpen(450,800)||randomOpen(250,1400)||{x:G.p.x+400,y:G.p.y};summonBoss(kit,at);const b=G.boss,k=1+SWARM.bossLife*(S.wave/SWARM.bossEvery-1);b.hp*=k;b.maxHp*=k}
  G.banner={t:2.6,a:'Wave '+S.wave,b:boss?(G.boss?G.boss.name:'A boss')+' joins the swarm':S.total+' enemies'}}
function swarmSpawn(){const w=G.swarm.wave,r=Math.random();let e=null;
  if(w>=SWARM.specialFrom&&r<.08)e=G.stage===7?spawnScrapGolem():G.stage===6?spawnShieldbearer():G.stage===5?spawnBloater():G.w.cover.length?spawnStalker():G.w.isle?spawnLurker():null;
  if(!e&&w>=SWARM.rivalFrom&&r<Math.min(.25,.03*w)&&!useMobs())e=spawnRival(520);
  if(!e)e=spawnMob(520,null,Math.random()<Math.min(SWARM.strongMax,.05+.025*w));
  if(!e)return false;if(e.role!=='stalker'&&e.role!=='lurker')e.aware=true;const late=Math.max(0,w-SWARM.toughFrom);e.hp*=1+SWARM.tough*late;e.maxHp*=1+SWARM.tough*late;e.dmg*=1+SWARM.hurt*late;e.swarm=true;return true}
function swarmTick(dt){const S=G.swarm;
  if(S.over){S.overT-=dt;if(S.overT<=0)restartSwarm();return}
  if(S.breakT>0){S.breakT-=dt;if(S.breakT<=0)nextWave();return}
  const alive=G.enemies.filter(e=>!e.dead&&e.kind!=='boss').length;S.spawnT-=dt;
  if(S.spawned<S.total&&alive<SWARM.cap&&S.spawnT<=0){S.spawnT=SWARM.spawnEvery;if(swarmSpawn())S.spawned++}
  S.left=S.total-S.spawned+alive+(G.boss?1:0);if(S.spawned>=S.total&&!alive&&!G.boss)waveCleared()}
function waveCleared(){const S=G.swarm;S.breakT=SWARM.breakT;if(G.mp){G.hopeSpent=0;G.hope=G.hopeMax}
  for(const q of G.players){q.swarmBest=Math.max(q.swarmBest||0,S.wave);achievementCheck(q);if(q.deadT>0){const me=G.p;G.p=q;revive(q);G.p=me}if(q.respawnT>0){q.respawnT=0;respawn(q)}if(q.s)q.hp=Math.min(q.s.maxHp,q.hp+q.s.maxHp*.3);q.potions=Math.max(q.potions||0,Math.min(5,(q.potions||0)+1))}
  if(!G.mp)try{const b=JSON.parse(localStorage.getItem('dayrim-swarm-best')||'{}');b[G.p.char]=Math.max(b[G.p.char]||0,S.wave);localStorage.setItem('dayrim-swarm-best',JSON.stringify(b))}catch(e){}
  G.banner={t:3,a:'Wave '+S.wave+' cleared',b:'Next wave in '+SWARM.breakT+'s. The safehouse shop is open'};sfx('level')}
function endSwarm(){const S=G.swarm;if(!S||S.over)return;S.over=true;S.overT=SWARM.overT;G.enemies=[];G.boss=null;G.flesh=null;G.shots=[];G.hazards=[];G.arena=null;clearLanterns();clearGhoul();clearScrap();
  const best=Math.max(0,...G.players.map(q=>q.swarmBest||0));G.banner={t:SWARM.overT,a:'The swarm wins',b:'You held out to wave '+S.wave+(best?'. Best: wave '+best:'')+'. A new run starts soon'};addLog('The swarm reached wave '+S.wave+'.')}
function restartSwarm(){for(const q of G.players){if(q.swarmSave)Object.assign(q,JSON.parse(JSON.stringify(q.swarmSave)));q.carry=null;q.secondWind=false;q.windDown=false;clearEncounterStatus(q);for(const k of ['deadT','respawnT','downCount','fastT','magicT','dashT','combo','comboT','comboPop','weaponHealCd','teamCd','breakReady','tauntGuard','mendT','reviveHold','reviveTarget','reviveProgress','killerT','specT','healFx','pillT','swing','atkT','pickT','hitT','castT'])q[k]=0;for(const k in q.cd)q.cd[k]=0;q.lastDown=-100;q.ult=q.mv=q.comboTier=null;q.guard=q.moving=false;q.inv=2;q.x=G.safe.x+60-G.players.indexOf(q)*30;q.y=G.safe.y+30;const me=G.p;G.p=q;recalc();q.hp=q.s.maxHp;q.mana=q.s.maxMana;G.p=me}
  if(G.mp){G.hopeSpent=0;G.hope=G.hopeMax}startSwarm()}
function startSwarmRun(char,stage){const sv=readSave();saveHold=true;try{if(sv&&sv.char===char)loadRun(sv);else newRun(char);enterStage(stage);startSwarm()}finally{saveHold=false}setMode('play')}
/* Stage 7: rust weakens armor at night; disabled golems rebuild until their parts are destroyed. */
const RUST={gain:1.5,clean:4,max:50,repair:8,rebuild:10,golemCap:2};
function rustStep(p,dt){if(G.stage!==7||p.deadT>0||p.respawnT>0)return;const night=G.hour>=20||G.hour<5,safe=dist(p,G.safe)<70&&!(G.swarm&&G.swarm.breakT<=0);p.rust=clamp((p.rust||0)+(night&&!safe?RUST.gain:-RUST.clean)*dt,0,RUST.max)}
function spawnScrapGolem(){const e=spawnMob(500,null,true);if(!e)return null;e.scrapGolem=true;e.role='brute';e.hp*=1.4;e.maxHp*=1.4;e.sp*=.8;e.aware=true;return e}
const scrapGolemDue=()=>G.stage===7&&G.enemies.filter(e=>!e.dead&&e.scrapGolem).length<Math.round(RUST.golemCap*partyCrowd())&&spawnScrapGolem();
function clearScrap(){G.props=G.props.filter(c=>c.kind!=='scrapPart')}
function scrapSpot(e,dx,other){let best=null,bd=Infinity;for(const i of G.w.open){const o={x:(i%MW+.5)*T,y:((i/MW|0)+.5)*T};if(blocked(o.x,o.y,14)||other&&dist(o,other)<35||G.arena&&dist(o,G.arena)>G.arena.r-14)continue;const d=Math.hypot(o.x-e.x-dx,o.y-e.y);if(d<bd){bd=d;best=o}}return best||{x:e.x,y:e.y}}
function scrapDisable(e){if(e.scrapDown)return;e.hp=0;e.scrapDown=true;e.scrapT=RUST.rebuild;e.flash=0;e.wind=0;e.rotT=0;e.moving=false;const a=scrapSpot(e,-34),b=scrapSpot(e,34,a);for(const o of[a,b])addProp('scrapPart',o.x,o.y,14,{golem:e});text(e.x,e.y-90,'BREAK THE PARTS','#ffd080',true);G.banner={t:2.5,a:'Scrap Golem down',b:G.players.length===1?'Break both parts before it rebuilds':'Two players must break its parts'};sfx('boom')}
function scrapPartHit(c,p){if(!c||c.done||!c.golem||!c.golem.scrapDown)return false;const e=c.golem,parts=G.props.filter(x=>x.kind==='scrapPart'&&x.golem===e),id=p.id||1,other=parts.find(x=>x!==c&&x.done);if(other&&other.by===id&&G.players.filter(q=>!(q.deadT>0||q.respawnT>0)).length>1){text(c.x,c.y-45,'ALLY NEEDED','#ffd080',true);return false}c.done=true;c.by=id;burst(c.x,c.y,'#d6b685',8,80);if(parts.length===2&&parts.every(x=>x.done)){for(const part of parts){const q=G.players.find(q=>(q.id||1)===part.by);if(q)achievementUnlock(q,'scrap')}G.props=G.props.filter(x=>x.golem!==e);e.scrapFinished=true;e.scrapDown=false;const me=G.p;G.p=p;killEnemy(e);G.p=me}return true}
function scrapTick(dt){for(const e of G.enemies){if(!e.scrapDown||e.dead)continue;e.scrapT-=dt;if(e.scrapT<=0){e.scrapDown=false;e.hp=e.maxHp*.5;e.cd=1;e.wind=0;G.props=G.props.filter(c=>c.golem!==e);text(e.x,e.y-90,'REBUILT','#ffd080',true)}}}
/* Stage 6: unstable floor warns before it collapses and reforms after a short time. */
const VALE={first:12,interval:11,warning:2,hole:4,radius:58,damage:2,fallCooldown:1,shieldCap:2};
function clearVale(){G.props=G.props.filter(o=>o.kind!=='collapse');G.valeT=VALE.first;for(const q of G.players)q.fallT=0}
function valeLanding(q,c){let best=null,bd=Infinity;for(const i of G.w.open){const o={x:(i%MW+.5)*T,y:((i/MW|0)+.5)*T};if(dist(o,c)<c.r+q.r+16||blocked(o.x,o.y,q.r)||G.arena&&dist(o,G.arena)>G.arena.r-q.r)continue;if(G.props.some(h=>h.kind==='collapse'&&h.by&&dist(o,h)<h.r+q.r+16))continue;const d=dist(o,q);if(d<bd){best=o;bd=d}}return best}
function valeFall(q,c){if(q.deadT>0||q.respawnT>0||q.fallT>0||q.dashT>0)return false;const o=valeLanding(q,c);if(!o)return false;const me=G.p;G.p=q;hurtPlayer(mobHit(G.stage)*VALE.damage);G.p=me;q.x=o.x;q.y=o.y;q.fallT=VALE.fallCooldown;text(q.x,q.y-80,'FLOOR COLLAPSED','#ffb080',true);return true}
function valeTick(dt){if(G.stage!==6)return;for(const q of G.players)q.fallT=Math.max(0,(q.fallT||0)-dt);G.valeT=(G.valeT===undefined?VALE.first:G.valeT)-dt;if(G.valeT<=0&&!G.clearPending){G.valeT=VALE.interval;const live=G.players.filter(q=>!(q.deadT>0||q.respawnT>0)&&dist(q,G.safe)>180);if(live.length){const q=pick(live);addProp('collapse',q.x,q.y,VALE.radius,{t:VALE.warning});text(q.x,q.y-60,'UNSTABLE FLOOR','#ffcf80',true)}}for(const c of G.props){if(c.kind!=='collapse')continue;c.t-=dt;if(!c.by&&c.t<=0){c.by=1;c.t=VALE.hole;G.fx.push({k:'ring',x:c.x,y:c.y,r:8,to:c.r,t:.35,m:.35,c:'#b59875'});sfx('boom')}if(c.by)for(const q of G.players)if(dist(q,c)<c.r+q.r)valeFall(q,c)}G.props=G.props.filter(c=>c.kind!=='collapse'||c.t>0)}
function spawnShieldbearer(){const e=spawnMob(500,null,true);if(!e)return null;e.role='guard';e.shieldbearer=true;e.method='shield';e.a.melee=true;e.sp*=.85;e.aware=true;return e}
const shieldbearerDue=()=>G.stage===6&&G.enemies.filter(e=>!e.dead&&e.shieldbearer).length<Math.round(VALE.shieldCap*partyCrowd())&&spawnShieldbearer();
/* Stage 5: spores build toxin outside the safehouse and active vents. Clouds build it faster. */
const SPORE={fill:1.25,cloudFill:8,clean:14,drain:.04,cloudT:8,cloudR:95,bloaterCap:2,fuse:1.2};
function sporeCloud(e){G.hazards.push({x:e.x,y:e.y,r:SPORE.cloudR,t:SPORE.cloudT,from:'e',col:'130,200,65',spore:true});G.fx.push({k:'ring',x:e.x,y:e.y,r:8,to:SPORE.cloudR,t:.4,m:.4,c:'#a8e668'});sfx('boom')}
function toxinStep(p,dt){if(G.stage!==5||p.deadT>0||p.respawnT>0||G.clearPending)return;const clean=dist(p,G.safe)<100&&!(G.swarm&&G.swarm.breakT<=0)||(G.props||[]).some(v=>v.kind==='vent'&&v.done&&dist(p,v)<110)||(G.boss&&(G.boss.kit||G.stage)===5&&cleanSporeAt(p));const inCloud=(G.hazards||[]).some(h=>h.spore&&h.t>0&&dist(p,h)<h.r+p.r),before=p.toxin||0;p.toxin=clamp((p.toxin||0)+(clean?-SPORE.clean:SPORE.fill+(inCloud?SPORE.cloudFill:0))*dt,0,100);if(p.toxin>=100){if(before<100)text(p.x,p.y-80,'TOXIN FULL','#b8ec72',true);p.toxinTick=(p.toxinTick||0)-dt;if(p.toxinTick<=0){p.toxinTick=1;const me=G.p;G.p=p;hurtPlayer(p.s.maxHp*SPORE.drain);G.p=me}}else p.toxinTick=0}
function spawnBloater(){const e=spawnMob(500,null,false);if(!e)return null;e.role='bloater';e.hp*=2;e.maxHp*=2;e.sp*=.8;e.aware=true;return e}
const bloaterDue=()=>G.stage===5&&G.enemies.filter(e=>!e.dead&&e.role==='bloater').length<Math.round(SPORE.bloaterCap*partyCrowd())&&spawnBloater();
function bloaterAct(e,dt,d,seen){if(e.fuseT>0){e.fuseT-=dt;e.moving=false;if(e.fuseT<=0){sporeCloud(e);e.dead=true}return true}if(seen&&d<e.r+G.p.r+55&&dist(G.p,G.safe)>110){e.fuseT=SPORE.fuse;text(e.x,e.y-90,'SPORES','#b8ec72',true);G.fx.push({k:'ring',x:e.x,y:e.y,r:8,to:SPORE.cloudR,t:SPORE.fuse,m:SPORE.fuse,c:'#a8e668'});return true}return false}
/* ---------- Stage 3: Duskwater Fen (C-24) ----------
   The water rises and falls on a cycle. Off the islands, the clearings and bridges, it slows players. Lurkers wait
   under the water, grab a player and drag them away until an ally hits the Lurker. Solo, your own hits free you. */
const TIDE={rise:12,hold:8,fall:8,low:8,slow:.45},LURKER={cap:2,grab:60,drag:55,hold:6,bite:.5};
const tideAt=t=>{const c=TIDE.rise+TIDE.hold+TIDE.fall+TIDE.low,u=t%c;return u<TIDE.rise?u/TIDE.rise:u<TIDE.rise+TIDE.hold?1:u<TIDE.rise+TIDE.hold+TIDE.fall?1-(u-TIDE.rise-TIDE.hold)/TIDE.fall:0};
function tideTick(dt){if(!G.w.isle){G.tide=0;return}const was=G.tide||0;G.tideT=(G.tideT||0)+dt;G.tide=tideAt(G.tideT);if(was===0&&G.tide>0)G.banner={t:2.4,a:'The water is rising',b:'Get to an island'}}
const dryAt=o=>{const W=G.w,i=idx(clamp(o.x/T|0,0,MW-1),clamp(o.y/T|0,0,MH-1));return !W.isle||!!W.isle[i]||W.ground[i]===2||W.ground[i]===4};
/* One speed rule for the server and for online prediction, so a slowed player does not snap back. */
const envSpeed=p=>{if(p.stunT>0||p.grabT>0||p.webT>0)return 0;let k=1;if((G.tide||0)>0&&!dryAt(p))k*=1-TIDE.slow*G.tide;if(p.possT>0)k*=.5;return k};
function playerStatus(q,dt){if(q.webT>0&&(q.deadT>0||q.respawnT>0||G.players.filter(p=>!(p.deadT>0||p.respawnT>0)).length<=1))q.webT=Math.max(0,q.webT-dt);q.stunT=Math.max(0,(q.stunT||0)-dt);q.blindT=Math.max(0,(q.blindT||0)-dt);if(q.possT>0){q.possT=Math.max(0,q.possT-dt);const b=G.boss;if(b&&!(q.deadT>0)){const a=Math.atan2(b.y-q.y,b.x-q.x);move(q,Math.cos(a)*BANSHEE.pull*dt,Math.sin(a)*BANSHEE.pull*dt)}}if(G.boss&&(G.boss.kit||G.stage)===3&&!(q.deadT>0||q.respawnT>0)){const was=G.p;G.p=q;lanternStep(q);G.p=was}}
function spawnLurker(){for(let t=0;t<60;t++){const c=pick(G.w.open),o={x:(c%MW+.5)*T,y:((c/MW|0)+.5)*T};if(dryAt(o)||dist(o,G.safe)<=240||G.players.some(q=>dist(o,q)<320))continue;const e=spawnMob(0,o,false);if(!e)return null;e.role='lurker';e.lurk=true;e.hp*=3;e.maxHp*=3;e.dmg*=1.2;e.xp*=2.5;e.gold*=2;return e}return null}
const lurkerDue=()=>G.w.isle&&G.enemies.filter(e=>!e.dead&&e.role==='lurker').length<Math.round(LURKER.cap*partyCrowd())&&spawnLurker();
function lurkRelease(e,freed){const q=G.players.find(x=>(x.id||1)===e.grab);if(q)q.grabT=0;e.grab=0;if(freed){e.stunT=1.5;expose(e,2);text(e.x,e.y-80,'FREED','#8fe6ff',true)}}
function lurkerAct(e,dt,d,seen){const p=G.p;
  if(e.grab){const q=G.players.find(x=>(x.id||1)===e.grab);if(!q||q.deadT>0||q.respawnT>0||!(q.grabT>0)){lurkRelease(e,false);return true}q.grabT-=dt;const ox=e.x,oy=e.y;move(e,Math.cos(e.dragA)*LURKER.drag*dt,Math.sin(e.dragA)*LURKER.drag*dt);move(q,e.x-ox,e.y-oy);e.moving=true;e.walk+=dt*5;e.biteT=(e.biteT||0)-dt;if(e.biteT<=0){e.biteT=LURKER.bite;const me=G.p;G.p=q;hurtPlayer(e.dmg*.45);G.p=me}if(!(q.grabT>0))lurkRelease(e,false);return true}
  if(e.lurk){if(seen&&d<LURKER.grab&&dist(p,G.safe)>110&&!(p.grabT>0)&&!(p.deadT>0)){e.grab=p.id||1;p.grabT=LURKER.hold;e.dragA=Math.atan2(e.y-p.y,e.x-p.x);e.lurk=false;e.aware=true;e.biteT=.3;text(p.x,p.y-80,'GRABBED','#ff8f80',true);if(G.players.length>1)G.banner={t:2,a:'A Lurker has '+(p.pname||'an ally'),b:'Hit the Lurker to free them'};return true}
    if(e.flash>0){e.lurk=false;e.aware=true;return false}return true}
  return false}
/* Stage rule: an enemy in the thicket stays hidden from a viewer beyond THICKET_SEE, unless it is marked, just hit or springing. */
const THICKET_SEE=120;
const inThicket=o=>!!G.w.thicket[idx(clamp(o.x/T|0,0,MW-1),clamp(o.y/T|0,0,MH-1))];
const concealed=(e,v)=>e.kind==='rival'&&!(e.markT>0)&&!(e.flash>0)&&!(e.aimT>0)&&!(e.pounceT>0)&&(inThicket(e)||(e.role==='lurker'&&e.lurk))&&dist(e,v)>THICKET_SEE;
/* Stalker: waits in cover, shows a short warning, then lunges. Dodging the lunge leaves it open. Afterwards it fights as a rusher. */
const STALKER_CAP=2,STALKER_SPRING=220,STALKER_AIM=.45,STALKER_LUNGE=.55;
function spawnStalker(){const W=G.w;for(let t=0;t<40;t++){const c=pick(W.cover),o={x:(c%MW+.5)*T,y:((c/MW|0)+.5)*T};if(dist(o,G.safe)<=240||G.players.some(q=>dist(o,q)<300))continue;const e=spawnMob(0,o,false);if(!e)return null;e.role='stalker';e.lurk=true;e.hp*=2.2;e.maxHp*=2.2;e.dmg*=1.6;e.sp*=1.15;e.xp*=2;e.gold*=2;return e}return null}
const stalkerDue=()=>G.w.cover.length&&G.enemies.filter(e=>!e.dead&&e.role==='stalker').length<Math.round(STALKER_CAP*partyCrowd())&&spawnStalker();
function stalkerAct(e,dt,d,seen){const p=G.p;
  if(e.pounceT>0){e.pounceT-=dt;move(e,Math.cos(e.ang)*e.sp*3.6*dt,Math.sin(e.ang)*e.sp*3.6*dt);e.walk+=dt*14;e.moving=true;
    if(!e.struck&&dist(e,p)<e.r+p.r+14){const was=p.hp;hurtPlayer(e.dmg*1.5);e.atkShow=.2;e.struck=p.hp<was?1:-1;e.pounceT=0}
    if(e.pounceT<=0){if(e.struck!==1)expose(e,2);e.struck=0;e.cd=1.2}return true}
  if(e.aimT>0){e.aimT-=dt;e.ang=Math.atan2(p.y-e.y,p.x-e.x);if(e.aimT<=0){e.aimT=0;e.lurk=false;e.pounceT=STALKER_LUNGE;e.aware=true}return true}
  if(!e.lurk){e.hideT=(e.hideT||0)+dt;if(e.hideAt||(e.hideT>AI.hideAfter&&d>160&&!(e.tok>0))){if(!e.hideAt){let b=null,bd=600;for(const c of G.w.cover){const o={x:(c%MW+.5)*T,y:((c/MW|0)+.5)*T},dd=dist(o,e);if(dd<bd){bd=dd;b=o}}if(!b){e.hideT=0;return false}e.hideAt=b}
      const L=dist(e,e.hideAt)||1;if(L<24||inThicket(e)){e.lurk=true;e.aware=false;e.hideT=0;e.hideAt=null;return true}e.ang=Math.atan2(e.hideAt.y-e.y,e.hideAt.x-e.x);if(move(e,(e.hideAt.x-e.x)/L*e.sp*dt,(e.hideAt.y-e.y)/L*e.sp*dt)){e.hideAt=null;e.hideT=0;return false}e.walk+=dt*7;e.moving=true;return true}return false}
  if(seen&&d<STALKER_SPRING&&dist(p,G.safe)>110){e.aimT=STALKER_AIM;text(e.x,e.y-88,'AMBUSH','#ff8f80',true);G.fx.push({k:'ring',x:e.x,y:e.y,r:10,to:60,t:STALKER_AIM,m:STALKER_AIM,c:'#ff8f80'});return true}
  if(e.flash>0){e.lurk=false;e.aware=true;return false}
  return true}
function updateEnemy(e,dt){
  if(e.dead||e.fleshDown||e.scrapDown)return;threatDecay(e,dt);const p=G.p;e.tauntT=Math.max(0,(e.tauntT||0)-dt);e.markT=Math.max(0,(e.markT||0)-dt);e.brokenT=Math.max(0,(e.brokenT||0)-dt);e.exposedT=Math.max(0,(e.exposedT||0)-dt);e.statusT=Math.max(0,(e.statusT||0)-dt);e.shatterT=Math.max(0,(e.shatterT||0)-dt);e.slowT=Math.max(0,(e.slowT||0)-dt);
  if(e.rotT>0&&!bossWarded(e)){e.rotT=Math.max(0,e.rotT-dt);const rotBy=G.players.find(x=>(x.id||0)===(e.rotBy||0)),was=G.p;if(rotBy)G.p=rotBy;e.hp-=e.rotRate*dt;if(e.kind==='boss'&&[6,7].includes(e.kit||G.stage))bossPhaseCheck(e);e.flash=Math.max(e.flash||0,.05);if(e.hp<=0){killEnemy(e);G.p=was;return}G.p=was}
  if(e.frozenT>0){e.frozenT=Math.max(0,e.frozenT-dt);e.moving=false;return}
  if(e.stunT>0){e.stunT=Math.max(0,e.stunT-dt);e.moving=false;return}e.moving=false;e.cd-=dt;e.flash=Math.max(0,e.flash-dt);e.atkShow=Math.max(0,e.atkShow-dt);e.castT=Math.max(0,(e.castT||0)-dt);
  if(e.kx||e.ky){move(e,e.kx*dt,e.ky*dt);const dec=Math.pow(.005,dt);e.kx*=dec;e.ky*=dec;if(Math.abs(e.kx)+Math.abs(e.ky)<4){e.kx=0;e.ky=0}}
  const d=dist(e,p);if(d>1400&&!e.aware)return;
  const seen=d<560&&los(e,p);
  if(!e.aware&&d<360&&seen&&dist(p,G.safe)>110)e.aware=true;
  e.lostT=seen?0:(e.lostT||0)+dt;if(e.aware&&e.kind!=='boss'&&!e.swarm&&(d>AI.leash||e.lostT>AI.forget)){e.aware=false;e.alerted=false}
  if(e.aware&&!e.alerted&&e.kind!=='boss'){e.alerted=true;for(const o of G.enemies)if(o!==e&&!o.dead&&!o.lurk&&dist(o,e)<AI.alert)o.aware=true}
  if(e.kind==='boss')return updateBoss(e,dt,d,seen);
  if(e.role==='mushroom')return;
  if(e.role==='stalker'&&stalkerAct(e,dt,d,seen))return;
  if(e.role==='lurker'&&lurkerAct(e,dt,d,seen))return;
  if(e.role==='bloater'&&bloaterAct(e,dt,d,seen))return;
  if(!e.aware){let tg=null,bd=170;for(const c of G.npcs){const dd=dist(c,e);if(!c.dead&&!c.wounded&&dd<bd){bd=dd;tg=c}}if(tg){e.ang=Math.atan2(tg.y-e.y,tg.x-e.x);if(bd>e.r+14){move(e,Math.cos(e.ang)*e.sp*.8*dt,Math.sin(e.ang)*e.sp*.8*dt);e.walk+=dt*7;e.moving=true}else if(e.cd<=0){e.cd=1.1;e.atkShow=.2;hitNpc(tg,e.dmg*1.4,e.ang,false)}return}e.wander-=dt;if(e.wander<=0){e.wander=rnd(1.5,4);e.wa=rnd(TAU);e.still=Math.random()<.35}if(!e.still){const h=move(e,Math.cos(e.wa)*e.sp*.4*dt,Math.sin(e.wa)*e.sp*.4*dt);e.ang=e.wa;e.walk+=dt*6;e.moving=true;if(h)e.wander=0}return}
  const a=e.a;
  e.rushT=Math.max(0,(e.rushT||0)-dt);e.punishCd=Math.max(0,(e.punishCd||0)-dt);
  /* In the Swarm the safehouse only shelters the party between waves. */
  if(dist(p,G.safe)<70&&!(G.swarm&&G.swarm.breakT<=0))return aiCamp(e,p,dt,d);
  aiPunish(e,p,d,seen);
  if(e.vill){e.spT=(e.spT===undefined?rnd(8,20):e.spT)-dt;e.smT=(e.smT||0)-dt;e.mdT=(e.mdT||0)-dt;updateMove(e,dt);e.ang=Math.atan2(p.y-e.y,p.x-e.x);if(e.mv)return;const key=KIT_OF[e.name],rng=key==='void'?300:key==='toxic'?150:112,dx=Math.abs(p.x-e.x),dy=Math.abs(p.y-e.y);
    if(e.spT<=0&&d<(key==='necro'?340:210)&&seen&&(key!=='necro'||dy<40)){e.spT=SPECIAL_CD;startMove(e,'special',p.x);return}
    if(e.mdT<=0&&d<(key==='void'?108:128)&&dy<70&&seen){e.mdT=3;startMove(e,'moderate',p.x);return}
    if(e.smT<=0&&dx<rng&&dy<(key==='void'?120:46)&&seen){e.smT=1.7;startMove(e,'small',p.x);return}
    if(d>(key==='void'?180:70)||!seen||dy>40)steer(e,dt,e.sp*.85,seen);return}
  e.guarding=e.method==='shield'&&d<170&&e.wind<=0;
  if(e.method==='heal'){if(e.healWind>0){e.healWind-=dt;if(e.healWind<=0){e.healT=5;const hurt=G.enemies.filter(o=>o.kind==='rival'&&!o.dead&&o.hp<o.maxHp&&dist(o,e)<190);hurt.slice(0,3).forEach(o=>{const h=o.maxHp*.16;o.hp=Math.min(o.maxHp,o.hp+h);text(o.x,o.y-70,'+'+Math.round(h),'#6fdca0');burst(o.x,o.y-24,'#6fdca0',6,80)})}return}e.healT-=dt;if(e.healT<=0&&G.enemies.some(o=>o.kind==='rival'&&!o.dead&&o.hp<o.maxHp*.9&&dist(o,e)<190)){e.healWind=.9;e.castT=.9;text(e.x,e.y-88,'HEALING','#6fdca0',true);return}}

  if(a.melee){
    if(e.wind>0){aiWindUp(e,p,dt);e.wind-=dt;if(e.wind<=0){if(e.role==='brute'&&p.dashT>0&&!e.delayed&&Math.random()<AI.delayChance){e.delayed=true;e.wind=e.windMax=AI.delay;return}e.cd=a.atk;e.atkShow=.2;let hit=false;if(dist(e,p)<a.range+e.r+p.r+8){let da=Math.abs(Math.atan2(p.y-e.y,p.x-e.x)-e.ang)%TAU;if(da>Math.PI)da=TAU-da;if(da<1.3){hit=true;hurtPlayer(e.dmg)}}if(e.role==='brute'&&p.dashT>0&&(!hit||p.inv>0))expose(e,2+Math.min(3,(p.runBoons||{}).opening||0));aiAfterSwing(e,p)}return}
    if(seen&&d<AI.engage&&!aiToken(e,p))return aiOrbit(e,p,dt);
    if(d<a.range+e.r+p.r-2&&e.cd<=0)return aiStartAttack(e,p);
    if(d>e.r+p.r)steer(e,dt,e.sp*(e.rushT>0?AI.rush:1),seen);else e.ang=Math.atan2(p.y-e.y,p.x-e.x);
  }else{
    e.ang=Math.atan2(p.y-e.y,p.x-e.x);
    e.strafeT=(e.strafeT||0)-dt;if(e.strafeT<=0){e.strafeT=rnd(1,2.5);e.strafeD=Math.random()<.5?1:-1}
    if(seen&&d<(e.role==='healer'?AI.healerKeep:AI.keep)){const b=Math.atan2(e.y-p.y,e.x-p.x);if(move(e,Math.cos(b)*e.sp*dt,Math.sin(b)*e.sp*dt)){const s=b+e.strafeD*Math.PI/2;if(move(e,Math.cos(s)*e.sp*dt,Math.sin(s)*e.sp*dt))e.strafeD=-e.strafeD}e.walk+=dt*6;e.moving=true}
    else if(!seen||d>310)steer(e,dt,e.sp,seen);
    else{const s=e.ang+e.strafeD*Math.PI/2;if(move(e,Math.cos(s)*e.sp*AI.strafe*dt,Math.sin(s)*e.sp*AI.strafe*dt))e.strafeD=-e.strafeD;e.walk+=dt*5;e.moving=true}
    if(e.role==='caster'){e.zoneT=(e.zoneT===undefined?rnd(4,7):e.zoneT)-dt;if(e.zoneT<=0&&seen&&d<360){e.zoneT=rnd(6,9);e.castT=.5;G.hazards=G.hazards||[];G.hazards.push({x:p.x+clamp((p.vx||0)*.6,-AI.leadMax,AI.leadMax),y:p.y+clamp((p.vy||0)*.6,-AI.leadMax,AI.leadMax),r:52,t:3.2,dps:e.dmg*.25,from:'e',col:'120,90,200'});text(e.x,e.y-88,'ZONE','#b98cff',true)}}
    if(seen&&e.cd<=0&&d<480){e.cd=a.atk;const sp=e.method==='spell',ss=sp?165:220,la=aiLead(e,p,ss);if(sp)e.castT=.3;else e.atkShow=.2;G.shots.push({x:e.x,y:e.y-22,vx:Math.cos(la)*ss,vy:Math.sin(la)*ss,r:sp?8:4,from:'e',life:3,dmg:e.dmg*(sp?1.25:1),web:e.role==='webber',spell:sp,fx:e.role==='webber'?'orb':sp?(e.w==='flask'?'flask':e.w==='staff'?'skull':e.w==='cards'?'card':e.w==='book'?'arcane':e.w==='candle'?'ember':'orb'):(e.w==='bow'?'arrow':e.w==='blaster'?'plasma':'bullet'),col:e.role==='webber'?'230,230,200':sp?spellCol(e.name,e.w==='flask'?'flask':'orb'):e.w==='blaster'?'111,220,255':'255,160,90',a:la})}
  }
}
/* A boss sometimes follows one attack straight into another, more often when hurt. Each still has its full warning. */
const bossChains=low=>Math.random()<(low?AI.bossChainLow:AI.bossChain);
function updateBoss(e,dt,d,seen){
  const p=G.p,n=e.kit||G.stage,low=e.hp<e.maxHp*.5;e.actT-=dt;e.hitCd=Math.max(0,e.hitCd-dt);e.ang=e.ang||0;
  e.recover=Math.max(0,e.recover-dt);e.recoil=Math.max(0,e.recoil-dt);e.release=Math.max(0,e.release-dt);
  if((e.staggerT||0)>0){e.staggerT=Math.max(0,e.staggerT-dt);e.moving=false;if(Math.random()<.12)burst(e.x+rnd(-e.r,e.r),e.y-16,'#ffd860',1,50);return}
  if((e.breatherT||0)>0){e.breatherT=Math.max(0,e.breatherT-dt);e.moving=false;e.tel=null;return}
  bossEnrage(e,dt);if(n===1)bossPillarRegen(e,dt);
  e.eyeT=Math.max(0,(e.eyeT||0)-dt);e.ghostT=Math.max(0,(e.ghostT||0)-dt);
  if(bossActStage(e,dt,d,seen,p,n))return;
  if(e.act==='charge'){e.trail.push({x:e.x,y:e.y});if(e.trail.length>4)e.trail.shift()}else if(e.trail.length)e.trail.shift();
  if(e.act==='rise'){if(Math.random()<.5)burst(e.x+rnd(-e.r,e.r),e.y,'#8a8478',2,90);if(e.actT<=0){e.act='walk';e.actT=rnd(1,1.8)}return}
  const before=Math.sin((e.walk||0)*BOSS_RATE(e));
  e.punishCd=Math.max(0,(e.punishCd||0)-dt);
  if(e.act==='walk'){
    if(e.punishCd<=0&&seen&&aiOpen(p)){e.punishCd=AI.bossPunishCd;e.actT=Math.min(e.actT,.1);e.cd=Math.min(e.cd,.1)}
    if(d>e.r+p.r+6)steer(e,dt,e.sp*(n===6&&e.fleshSplit&&G.players.length===1?FLESH.soloSpeed:n===4?(e.phase>=2?1.5:1):(low?1.25:1)),seen);
    const after=Math.sin((e.walk||0)*BOSS_RATE(e));
    if(e.moving&&before*after<0&&BOSS_STYLE[STYLE_OF[e.art]].step>=6){burst(e.x+(after>0?-1:1)*e.r*.6,e.y,'#8a8478',4,70);shake(.7)}
    if(d<e.r+p.r+14&&e.cd<=0){if(n===7){startGhoulCleave(e,false);return}if(n===6){startFleshGrasp(e);return}e.act=n===5?'sporeSlam':'slam';bossTelegraph(e,'circle',e.r+(n===5?100:52),n===5?.9:Math.max(.34,.6-n*.02));return}
    if(e.actT<=0&&seen)bossPick(e,n,low);else if(e.actT<=0)e.actT=.6;
  }else if(e.act==='slam'){
    if(e.actT<=0){e.tel=null;if(d<e.r+p.r+52)hurtPlayer(e.dmg*(n===4&&e.phase>=2?1.6:1.2));G.fx.push({k:'ring',x:e.x,y:e.y,r:12,to:e.r+50,t:.22,m:.22,c:'#f0805c'});burst(e.x,e.y,'#8a8478',12,160);e.recover=.3;shake(4);sfx('boom');e.cd=Math.max(.9,1.8-n*.07)*bossCd(e);e.act='walk';e.actT=rnd(1,2);if(bossChains(low)&&dist(e,p)<e.r+p.r+120){e.cd=0;e.act='slam';bossTelegraph(e,'circle',e.r+52,BOSS_TELEGRAPH)}}
  }else if(e.act==='aim'){if(e.actT>.2)e.ang=aiLead(e,p,430+n*14);if(e.actT<=0){e.act='charge';e.actT=.85;sfx('dash')}
  }else if(e.act==='charge'){const hit=move(e,Math.cos(e.ang)*(430+n*14)*dt,Math.sin(e.ang)*(430+n*14)*dt);if(dist(e,p)<e.r+p.r+2&&e.hitCd<=0){hurtPlayer(e.dmg*1.15);e.hitCd=.6}if(hit||e.actT<=0){if(hit){shake(6);sfx('boom');e.recover=.3}e.tel=null;e.act='walk';e.actT=rnd(1.4,2.6);if(bossChains(low)&&seen){e.act='aim';bossTelegraph(e,'line',e.r+230,BOSS_TELEGRAPH)}}
  }else if(e.act==='nova'){if(e.actT<=0){e.tel=null;const c=(low?16:10)+n,o=rnd(TAU);for(let i=0;i<c;i++){const a=o+i/c*TAU;G.shots.push({x:e.x,y:e.y-30,vx:Math.cos(a)*(170+n*4),vy:Math.sin(a)*(170+n*4),r:7,from:'e',life:3.2,dmg:e.dmg*.7,fx:'orb',col:'255,110,90',a})}sfx('bolt');e.release=.25;e.act='walk';e.actT=rnd(1.5,2.8)}
  }else if(e.act==='burrow'){e.moving=false;if(e.actT<=0){const t=topThreatPlayer(e);e.x=t.x;e.y=t.y;e.ang=0;e.act='erupt';bossTelegraph(e,'circle',112,.6)}
  }else if(e.act==='erupt'){e.moving=false;if(e.actT<=0){e.tel=null;e.buried=false;for(const q of G.players){if(q.deadT>0||q.respawnT>0)continue;if(Math.hypot(q.x-e.x,q.y-e.y)<112+q.r){G.p=q;hurtPlayer(e.dmg*1.6)}}G.fx.push({k:'ring',x:e.x,y:e.y,r:14,to:130,t:.3,m:.3,c:'#f0805c'});burst(e.x,e.y,'#8a8478',26,230);shake(7);sfx('boom');e.recover=.45;e.cd=Math.max(.9,1.8-n*.07)*bossCd(e);e.act='walk';e.actT=rnd(1.2,2.2)}
  }else if(e.act==='spray'){e.ang=aiLead(e,p,260+n*6);if(e.actT<=0){e.tel=null;const c=6;for(let i=0;i<c;i++){const a=e.ang+(i-(c-1)/2)*.13;G.shots.push({x:e.x,y:e.y-28,vx:Math.cos(a)*(260+n*6),vy:Math.sin(a)*(260+n*6),r:6,from:'e',life:2.4,dmg:e.dmg*.6,fx:'shard',col:'150,230,255',a})}sfx('bolt');shake(3);e.release=.2;e.act='walk';e.actT=rnd(1.4,2.6)}
  }else if(e.act==='call'){if(e.actT<=0){const minions=G.enemies.filter(o=>o.minion).length;if(minions<2+n)for(let i=0;i<2+(n>>2);i++){const a=rnd(TAU),nx=e.x+Math.cos(a)*(e.r+24),ny=e.y+Math.sin(a)*(e.r+24);if(!blocked(nx,ny,13)){const m=useMobs()?spawnMob(0,{x:nx,y:ny},false):spawnRival(0,false,{x:nx,y:ny});if(m){m.aware=true;m.minion=true;m.xp*=.3}}}e.act='walk';e.actT=rnd(1.8,3)}}
}
