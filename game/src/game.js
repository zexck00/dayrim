/* Dayrim: city action RPG. Rules, world and rendering. Atlas data is injected by tools/build.py */
const TAU=Math.PI*2,T=40,PXB=15,PYB=13;
/* Map size in tiles. Stages are 156×110; story chapters keep their hand-made 78×55 (setMapSize switches). */
const STAGE_MW=156,STAGE_MH=110,STORY_MW=78,STORY_MH=55;let MW=STAGE_MW,MH=STAGE_MH;
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rnd=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);
const irnd=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const idx=(x,y)=>y*MW+x;
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
/* ctx is swapped while Pixel 3D draws its layers; ctx0 is always the screen */
const canvas=$('c'),ctx0=canvas.getContext('2d');let ctx=ctx0;
/* The character art behind every card and sprite. WebP first; if it fails, try once more, then the PNG copy
   (for a browser without WebP or a broken download), so nobody is left with blank character cards. */
const ATLAS=new Image();
{let tries=0;const set=u=>{ATLAS.src=u;document.documentElement.style.setProperty('--atlas','url("'+u+'")')};
 ATLAS.onerror=()=>{tries++;if(tries===1)setTimeout(()=>set(ATLAS_URL+'?retry=1'),800);else if(tries===2&&typeof ATLAS_PNG_URL==='string'&&ATLAS_PNG_URL)set(ATLAS_PNG_URL)};set(ATLAS_URL)}
const artStyle=(n,bw,bh)=>{if(CARD_ART[n]){const w=Math.min(bw,bh*.75);return 'width:'+Math.round(w)+'px;height:'+Math.round(w/.75)+'px;background:url('+CARD_ART[n]+') center/100% 100% no-repeat'}const a=CAST[n],k=Math.min(bw/a.w,bh/a.h);return 'width:'+Math.round(a.w*k)+'px;height:'+Math.round(a.h*k)+'px;background-size:'+AW*k+'px '+AH*k+'px;background-position:'+(-a.x*k)+'px '+(-a.y*k)+'px'};

/* ---------- Data ---------- */
const ARCH={
  bruiser:{n:'Bruiser',d:'35% more life and extra armor, but slower.',f:s=>{s.maxHp*=1.35;s.armor+=6;s.speed*=.92},e:{hp:1.7,sp:60,dmg:1.3,r:15,range:22,atk:1.3}},
  striker:{n:'Striker',d:'20% more damage from every attack.',f:s=>{s.dmg*=1.2},e:{hp:1,sp:86,dmg:1,r:13,range:20,atk:.95}},
  shooter:{n:'Marksman',d:'Attacks 15% faster, and spells cost less mana.',f:s=>{s.cdMul*=.85;s.spellCost=11},e:{hp:.72,sp:64,dmg:.8,r:13,range:20,atk:1.7}},
  medic:{n:'Medic',d:'Heals 2 life per hit and starts with 3 extra potions.',f:s=>{s.leech+=2},potions:3,e:{hp:.9,sp:66,dmg:.7,r:13,range:20,atk:1.8}},
  scout:{n:'Scout',d:'15% faster, and the dodge recharges 30% quicker.',f:s=>{s.speed*=1.15;s.dashCd*=.7},e:{hp:.8,sp:112,dmg:.85,r:13,range:18,atk:.85}}
};
const ROSTER={hero:{Detective:'shooter',Vigilante:'scout',Guardian:'bruiser',Ranger:'scout',Inventor:'shooter',Firefighter:'bruiser','Hero Shadow':'striker',Prodigy:'striker',Sage:'shooter',Patriot:'shooter',Phantom:'scout',Pyromancer:'shooter',Chronomancer:'shooter',Beastmaster:'striker',Voidwalker:'shooter',Exorcist:'medic','Gravity Mage':'shooter',Druid:'medic',Cyborg:'bruiser',Illusionist:'scout'},
villain:{Necromancer:'shooter','Blood Reaper':'bruiser','Toxin Alchemist':'medic','Soul Stealer':'scout','Shadow Monarch':'striker',Puppeteer:'shooter','Void Empress':'shooter','Plague Doctor':'medic','Mad Scientist':'shooter','Demon Knight':'bruiser','Gravity Weaver':'shooter','Mecha Tyrant':'bruiser','Chrono Thief':'scout','Swarm Queen':'scout','Ice Archmage':'shooter','Deep Siren':'striker','Ash Shaman':'medic','Soul Forger':'bruiser','Mirror Jester':'scout','Cyber Priest':'medic'}};
/* Signature passives (Z-30): each character has one small bonus of its own, on top of its archetype.
   [name, description, effect on the stat block, 'effect' when it works in play instead of on stats]. Kept small so the archetypes and balance still lead. */
const PASSIVES={
 Detective:['Keen Eye','6% more critical chance.',s=>{s.crit+=.06}],
 Vigilante:['Night Prowler','8% faster movement.',s=>{s.speed*=1.08}],
 Guardian:['Stalwart','6 extra armor.',s=>{s.armor+=6}],
 Ranger:['Trailwise','Dodge recharges 15% faster.',s=>{s.dashCd*=.85}],
 Inventor:['Tinkerer','Cooldowns are 6% shorter.',s=>{s.cdMul*=.94}],
 Firefighter:['Heat Proof','15% more life.',s=>{s.maxHp*=1.15}],
 'Hero Shadow':['Backstab','8% more critical chance.',s=>{s.crit+=.08}],
 Prodigy:['Natural Talent','8% more damage.',s=>{s.dmg*=1.08}],
 Sage:['Deep Wisdom','25% more mana.',s=>{s.maxMana*=1.25}],
 Patriot:['Tailwind','10% faster movement and 5% more critical chance.',s=>{s.speed*=1.1;s.crit+=.05}],
 Phantom:['Ethereal','Dodge recharges 20% faster.',s=>{s.dashCd*=.8}],
 Pyromancer:['Kindling','Spell blasts are 20% wider.',s=>{s.blast*=1.2}],
 Chronomancer:['Borrowed Time','Cooldowns are 8% shorter.',s=>{s.cdMul*=.92}],
 Beastmaster:['Pack Leader','Heals 1.5 life per hit.',s=>{s.leech+=1.5}],
 Voidwalker:['Void Step','10% faster movement.',s=>{s.speed*=1.1}],
 Exorcist:['Blessed','Healing is 12% stronger.',s=>{s.mendMul+=.12}],
 'Gravity Mage':['Mass','Spells cost 3 less mana.',s=>{s.spellCost-=3}],
 Druid:['Regrowth','Regenerates 3 extra life per second.',s=>{s.regen+=3}],
 Cyborg:['Plating','8 extra armor.',s=>{s.armor+=8}],
 Illusionist:['Misdirection','4% more critical chance, and the dodge recharges 10% faster.',s=>{s.crit+=.04;s.dashCd*=.9}],
 Necromancer:['Grave Harvest','Every kill restores 3% of your life and 6 mana.',s=>{},'effect'],
 'Blood Reaper':['Bloodlust','5% more damage, and heals 1 life per hit.',s=>{s.dmg*=1.05;s.leech+=1}],
 'Toxin Alchemist':['Toxic Aura','Enemies within reach take poison damage every second.',s=>{},'effect'],
 'Soul Stealer':['Siphon','20% more mana.',s=>{s.maxMana*=1.2}],
 'Shadow Monarch':['Dominion','10% more damage.',s=>{s.dmg*=1.1}],
 Puppeteer:['Strings Attached','Cooldowns are 7% shorter.',s=>{s.cdMul*=.93}],
 'Void Empress':['Gravity Well','Your spell hits slow enemies by 40% for 1.5 seconds.',s=>{},'effect'],
 'Plague Doctor':['Black Remedy','Healing is 15% stronger.',s=>{s.mendMul+=.15}],
 'Mad Scientist':['Overclocked','Cooldowns are 8% shorter.',s=>{s.cdMul*=.92}],
 'Demon Knight':['Infernal Hide','10% more life and 3 extra armor.',s=>{s.maxHp*=1.1;s.armor+=3}],
 'Gravity Weaver':['Orbital Guard','Shield blocks 15% more.',s=>{s.guardMul+=.15}],
 'Mecha Tyrant':['Armored Core','10 extra armor.',s=>{s.armor+=10}],
 'Chrono Thief':['Quick Hands','Dodge recharges 20% faster.',s=>{s.dashCd*=.8}],
 'Swarm Queen':['Hive Mind','Regenerates 2 extra life per second.',s=>{s.regen+=2}],
 'Ice Archmage':['Frostbite','5% more critical chance.',s=>{s.crit+=.05}],
 'Deep Siren':['Undertow','8% faster movement.',s=>{s.speed*=1.08}],
 'Ash Shaman':['Ember Mend','Healing is 12% stronger, and regenerates 1 extra life per second.',s=>{s.mendMul+=.12;s.regen+=1}],
 'Soul Forger':['Tempered','12% more life.',s=>{s.maxHp*=1.12}],
 'Mirror Jester':['Reflection','7% more critical chance.',s=>{s.crit+=.07}],
 'Cyber Priest':['Firmware','15% more mana, and the shield blocks 10% more.',s=>{s.maxMana*=1.15;s.guardMul+=.1}]
};
const passiveOf=n=>PASSIVES[n]||null;
/* The action methods. Each character's stats (1 to 5) set how strong each method is for them. */
const METHODS={unarmed:{n:'Unarmed',st:'pow'},melee:{n:'Weapon melee',st:'pow'},shoot:{n:'Shoot',st:'aim'},spell:{n:'Spell',st:'mag'},shield:{n:'Shield',st:'grd'},heal:{n:'Heal',st:'hea'}};
const STAT_NAMES={pow:'Melee',aim:'Shooting',mag:'Magic',grd:'Shield',hea:'Healing'};
const STAT_MUL=[.6,.8,1,1.2,1.4];
const mkS=(pow,aim,mag,grd,hea)=>({pow,aim,mag,grd,hea});
/* Display names. The Patriot is now Falcon EX; the key stays 'Patriot' so saves and online play keep working. */
const label=n=>n==='Hero Shadow'?'Shadow':n==='Patriot'?'Falcon EX':n;
const theName=n=>n==='Patriot'?'Falcon EX':'The '+label(n);
const STATS={Necromancer:mkS(1,1,5,2,4),'Blood Reaper':mkS(5,1,2,3,2),'Toxin Alchemist':mkS(2,3,4,1,4),'Soul Stealer':mkS(2,1,5,1,3),'Shadow Monarch':mkS(5,2,3,2,2),Puppeteer:mkS(1,2,5,2,2),'Void Empress':mkS(1,1,5,3,2),'Plague Doctor':mkS(2,1,3,2,5),'Mad Scientist':mkS(1,5,3,1,2),'Demon Knight':mkS(5,1,2,5,1),'Gravity Weaver':mkS(1,1,5,3,2),'Mecha Tyrant':mkS(5,4,1,5,1),'Chrono Thief':mkS(3,5,2,1,2),'Swarm Queen':mkS(3,2,5,1,3),'Ice Archmage':mkS(1,1,5,3,3),'Deep Siren':mkS(4,1,4,2,3),'Ash Shaman':mkS(2,1,4,2,5),'Soul Forger':mkS(5,1,2,4,2),'Mirror Jester':mkS(4,3,3,1,2),'Cyber Priest':mkS(1,3,4,2,5),
Guardian:mkS(3,1,1,5,2),Ranger:mkS(3,5,1,1,3),'Hero Shadow':mkS(5,2,2,1,1),Sage:mkS(1,1,5,2,4),Phantom:mkS(2,1,5,1,3),Pyromancer:mkS(1,1,5,1,2),Chronomancer:mkS(2,2,5,2,3),Beastmaster:mkS(5,2,1,2,3),Voidwalker:mkS(1,1,5,2,2),Exorcist:mkS(2,1,4,2,5),'Gravity Mage':mkS(1,1,5,3,2),Druid:mkS(2,1,4,2,5),Cyborg:mkS(5,4,1,4,1),Illusionist:mkS(2,3,5,1,2),Detective:mkS(3,5,1,2,2),Nurse:mkS(1,1,2,2,5),'Beat Cop':mkS(4,3,1,4,1),Vigilante:mkS(4,2,1,2,2),Reporter:mkS(2,3,2,2,2),Firefighter:mkS(5,1,1,4,2),Doctor:mkS(1,2,3,1,5),Boxer:mkS(5,1,1,3,1),Priest:mkS(1,1,5,2,4),Mechanic:mkS(4,2,2,3,1),SWAT:mkS(3,3,1,5,1),Prodigy:mkS(4,2,2,2,2),Ranger:mkS(3,3,1,2,3),Judge:mkS(4,1,3,3,1),Inventor:mkS(2,5,3,2,1),Paramedic:mkS(2,1,2,2,5),Patriot:mkS(3,5,2,3,2),Athlete:mkS(5,1,1,2,3),Baker:mkS(4,1,1,3,3),
Boss:mkS(2,4,4,2,1),Brute:mkS(4,5,1,3,1),Sister:mkS(1,1,4,2,5),Shadow:mkS(2,5,3,1,1),Scribe:mkS(1,1,5,1,3),Chemist:mkS(1,2,4,1,5),Driver:mkS(4,3,1,2,1),Soldier:mkS(3,5,1,3,1),Spy:mkS(3,3,3,2,1),Prelate:mkS(5,1,3,2,1),Grandmaster:mkS(1,1,5,2,3),Executioner:mkS(5,1,1,4,1),Undertaker:mkS(4,1,3,3,2),Whisperer:mkS(1,2,5,2,2),Smuggler:mkS(3,5,1,2,1),Apothecary:mkS(1,2,3,1,5),Silencer:mkS(5,1,2,1,1),Medium:mkS(1,1,5,1,4),Usurer:mkS(3,2,2,2,4),Initiate:mkS(4,1,2,2,2)};
/* Weapons. Power never changes, whichever enemy or stage it came from. 25 power means +100% damage. */
const WEAPONS={
 fists:{n:'Fists',m:'unarmed',p:0,cd:.26,reach:50},knife:{n:'Knife',m:'melee',p:6,cd:.28,reach:54},cane:{n:'Cane',m:'melee',p:7,cd:.34,reach:64},baton:{n:'Baton',m:'melee',p:8,cd:.34,reach:64},pin:{n:'Rolling Pin',m:'melee',p:9,cd:.38,reach:62},wrench:{n:'Wrench',m:'melee',p:10,cd:.38,reach:62},hook:{n:'Crowbar',m:'melee',p:10,cd:.38,reach:64},torch:{n:'Flashlight',m:'melee',p:6,cd:.32,reach:60},money:{n:'Money Bag',m:'melee',p:11,cd:.44,reach:58},gavel:{n:'Gavel',m:'melee',p:12,cd:.44,reach:62},bat:{n:'Baseball Bat',m:'melee',p:13,cd:.44,reach:72},shovel:{n:'Shovel',m:'melee',p:15,cd:.5,reach:76},cleaver:{n:'Cleaver',m:'melee',p:17,cd:.5,reach:62},axe:{n:'Fire Axe',m:'melee',p:20,cd:.58,reach:76},
 pistol:{n:'Pistol',m:'shoot',p:6,cd:.34},wind:{n:'Gale Gauntlets',m:'shoot',p:9,cd:.34},camera:{n:'Flash Camera',m:'shoot',p:4,cd:.3},tommy:{n:'Tommy Gun',m:'shoot',p:3,cd:.22},blaster:{n:'Blaster',m:'shoot',p:16,cd:.6},
 candle:{n:'Cursed Candle',m:'spell',p:6,cd:.42,cost:4},book:{n:'Spell Book',m:'spell',p:10,cd:.5,cost:6},flask:{n:'Potion Flask',m:'spell',p:12,cd:.55,cost:7},orb:{n:'Magic Orb',m:'spell',p:15,cd:.6,cost:9},
 sword:{n:'Dark Blade',m:'melee',p:16,cd:.46,reach:72},scythe:{n:'Reaper Scythe',m:'melee',p:19,cd:.54,reach:84},hammer:{n:'Forge Hammer',m:'melee',p:22,cd:.62,reach:70},trident:{n:'Trident',m:'melee',p:15,cd:.48,reach:86},staff:{n:'Magic Staff',m:'spell',p:13,cd:.56,cost:8},
 bow:{n:'Longbow',m:'shoot',p:9,cd:.42},spear:{n:'Spear',m:'melee',p:14,cd:.46,reach:84},cards:{n:'Trick Cards',m:'spell',p:8,cd:.46,cost:5},
 shield:{n:'Knight Shield',m:'shield',p:5,cd:.46,reach:56},medkit:{n:'Medkit',m:'heal',p:3,cd:.4,reach:56},censer:{n:'Holy Censer',m:'heal',p:5,cd:.44,reach:60},herb:{n:'Living Herb',m:'heal',p:4,cd:.4,reach:56}
};
const weaponOf=name=>{const w=SPECS[name].w;return w&&w!=='fist'?w:'fists'};
/* Characters whose own weapon is a spell pay mana for every basic attack, so their mana comes back twice as fast. The three asset villains attack without mana. */
const CASTER_REGEN=2,isCaster=name=>WEAPONS[weaponOf(name)].m==='spell';
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
function achievementUnlock(p,id,notify=true){if(p.ai||G.demo||!ACHIEVEMENTS.some(a=>a.id===id)||p.achievements[id])return false;p.achievements[id]=true;if(notify)achievementNotice(p,id);achievementStore(p);return true}
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
/* Every skill trains to rank 100, one point per level and two per boss. */
const SKILL_MAX=100,CRIT_CAP=.6;
const SKILLS=[
 {id:'power',n:'Melee Training',d:'+8% melee, shield and healing-weapon damage per rank',max:SKILL_MAX},
 {id:'aim',n:'Marksmanship',d:'+8% ranged-weapon damage per rank',max:SKILL_MAX},
 {id:'spell',n:'Spellcraft',d:'+10% spell and signature-move damage per rank',max:SKILL_MAX},
 {id:'guard',n:'Shield Drill',d:'+12% armor while shielding',max:SKILL_MAX},
 {id:'mend',n:'First Aid',d:'+10% self-healing from E and healing weapons per rank',max:SKILL_MAX},
 {id:'tough',n:'Toughness',d:'+6% maximum life',max:SKILL_MAX},
 {id:'foot',n:'Footwork',d:'+2% move speed',max:SKILL_MAX},
 {id:'focus',n:'Focus',d:'+1 mana per second',max:SKILL_MAX},
 {id:'crit',n:'Precision',d:'+1.5% critical chance',max:SKILL_MAX},
 {id:'leech',n:'Second Wind',d:'+0.5 life per hit',max:SKILL_MAX}
];
const GYM=[{id:'str',n:'Strength drills',d:'+2 base damage'},{id:'end',n:'Endurance run',d:'+15 maximum life'},{id:'agi',n:'Agility course',d:'+2 move speed'}];
const SHOP=[{id:'potions',n:'Potion',d:'Heals 45% of your life',base:18},{id:'fast',n:'Fast Pill',d:'40% faster for 20 seconds',base:30},{id:'magic',n:'Magic Pill',d:'Double damage for 20 seconds',base:40}];
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
/* L: the enemy's level, the stage's recommended level unless it follows the party */
const mobUnit=(s,L=recLevel(s))=>(11+2.6*L)*REC_HITS/.6;
/* Enemy damage is set in hits to down a player at the recommended level, like enemy life is set in hits to kill. The old curve left 20 or more weak hits on early stages. Later stages keep the old curve where it is already harsher. Life and armor follow recalc. */
const WEAK_HITS_TO_DOWN=[10,8,7];
const mobHit=(s,L=recLevel(s))=>{const hp=95+L*18,ar=L*1.6,hits=WEAK_HITS_TO_DOWN[Math.min(s,WEAK_HITS_TO_DOWN.length)-1];return Math.max(11*Math.pow(1.36,s-1),hp/((1-ar/(ar+60))*.7*hits))};
const bossHp=s=>3600*Math.pow(1.47,s-1),bossDmg=s=>36*Math.pow(1.33,s-1);
/* Enemies carry the stage's recommended level; tougher kinds sit a few levels above it. Their life and damage above follow the same stage. */
const enemyLevel=e=>e.lvl||recLevel(G.stage)+(e.kind==='boss'?4:e.vill?3:e.elite||e.mob==='strong'?1:0);
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
function setMapSize(w,h){MW=w;MH=h;if(mini.width!==w||mini.height!==h){mini.width=w;mini.height=h}}
try{const c=localStorage.getItem('dayrim-char');if(c&&archKey(c)){chosen=c;selTab=factionOf(c)}}catch(e){}
function readSave(){try{const r=JSON.parse(localStorage.getItem('dayrim-save')||'null');return r&&archKey(r.char)?r:null}catch(e){return null}}
/* Starting a Swarm run builds a character and enters a stage, which would normally save. Hold saves until the run is marked. */
let saveHold=false;
function writeSave(){if(!G||G.demo||G.mp||G.swarm||G.story||saveHold)return;const p=(G.players||[]).find(q=>!q.ai)||G.p;try{localStorage.setItem('dayrim-save',JSON.stringify({char:p.char,lvl:p.lvl,xp:p.xp,gold:p.gold,potions:p.potions,fast:p.fast,magic:p.magic,gear:p.gear,bag:p.bag,weapons:p.weapons,weapon:p.weapon,skills:p.skills,train:p.train,sp:p.sp,kills:p.kills,rage:p.rage,bestCombo:p.bestCombo,stage:G.stage,runBoons:p.runBoons,weaponUpgrades:p.weaponUpgrades,achievements:p.achievements,secondWind:!!p.secondWind,maxStage:p.maxStage,beaten:p.beaten}))}catch(e){}}
function clearSave(){try{localStorage.removeItem('dayrim-save')}catch(e){}}

/* ---------- Audio ---------- */
let ac=null,muted=false;
const SFX={slash:[240,90,.07,'sawtooth'],hit:[150,70,.06,'square'],bolt:[540,170,.18,'sine'],loot:[660,1020,.16,'triangle'],hurt:[120,55,.16,'sawtooth'],level:[440,920,.35,'triangle'],dash:[280,720,.1,'sine'],pull:[90,300,.3,'sine'],boom:[110,40,.3,'square'],shot:[900,300,.06,'square'],lock:[1200,1800,.12,'sine'],charge:[300,900,.5,'triangle']};
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
  /* K scales routes, branches and counts with the map (1 at 78 tiles wide, 2 at 156) */
  const N=MW*MH,K=MW/78,map=new Uint8Array(N),ground=new Uint8Array(N),deco=new Uint8Array(N),bld=new Uint8Array(N),props=[],lamps=[];
  for(let i=0;i<N;i++){map[i]=Math.random()<.43?1:0;deco[i]=Math.random()*255}
  const border=(x,y)=>x<2||y<2||x>=MW-2||y>=MH-2;
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++)if(border(x,y))map[idx(x,y)]=1;
  for(let it=0;it<4;it++){const n=map.slice();for(let y=1;y<MH-1;y++)for(let x=1;x<MW-1;x++){let c=0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)c+=map[idx(x+a,y+b)];n[idx(x,y)]=(c>=5||border(x,y))?1:0}map.set(n)}
  const open=(x,y,g)=>{if(x>1&&y>1&&x<MW-2&&y<MH-2){map[idx(x,y)]=0;if(g!==undefined)ground[idx(x,y)]=g}};
  const blob=(cx,cy,rx,ry,g)=>{for(let y=cy-ry-2;y<=cy+ry+2;y++)for(let x=cx-rx-2;x<=cx+rx+2;x++){const d=((x-cx)/rx)**2+((y-cy)/ry)**2+rnd(-.12,.12);if(d<1)open(x,y,g)}};
  const trail=(ax,ay,bx,by)=>{let x=ax,y=ay,s=0;while((Math.abs(x-bx)>1||Math.abs(y-by)>1)&&s++<500*K*K){if(Math.random()<.7){if(Math.abs(x-bx)>Math.abs(y-by))x+=Math.sign(bx-x);else y+=Math.sign(by-y)}else{x+=irnd(-1,1);y+=irnd(-1,1)}x=clamp(x,3,MW-4);y=clamp(y,3,MH-4);for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if(Math.abs(a)+Math.abs(b)<2||Math.random()<.5)open(x+a,y+b,1)}};
  const s={x:irnd(8,11),y:irnd(9,MH-10)},e={x:irnd(MW-12,MW-9),y:irnd(9,MH-10)},nodes=[s];const mids=Math.round(irnd(4,6)*K);
  for(let i=0;i<mids;i++)nodes.push({x:Math.round(s.x+(e.x-s.x)*(i+1)/(mids+1)+rnd(-4,4)*K),y:irnd(7,MH-8)});nodes.push(e);
  nodes.forEach((n,i)=>{const start=i===0,last=i===nodes.length-1;blob(n.x,n.y,start||last?8:irnd(4,7+Math.round(K)),start||last?6:irnd(3,5+Math.round(K)),start||last?2:undefined);if(i)trail(nodes[i-1].x,nodes[i-1].y,n.x,n.y)});
  for(let i=0;i<Math.round(4*K*K*.75);i++){const a=pick(nodes),bx=clamp(a.x+irnd(-14,14)*K,6,MW-7),by=clamp(a.y+irnd(-12,12)*K,6,MH-7);blob(bx,by,irnd(3,6),irnd(2,5));trail(a.x,a.y,bx,by)}
  /* A winding river across the middle of the map; trails cross it on bridges */
  if(K>1){let x=irnd(Math.round(MW*.38),Math.round(MW*.62));const w=irnd(2,3),ph=rnd(0,TAU);
    for(let y=2;y<MH-2;y++){x=clamp(Math.round(x+Math.sin(y*.18+ph)*.9+rnd(-.5,.5)),6,MW-7);
      for(let a=-w;a<=w;a++){const tx=x+a,i=idx(tx,y);if(ground[i]===2)continue;map[i]=0;ground[i]=ground[i]===1?4:3}}}
  // keep only ground that can be walked to from the start
  const seen=new Uint8Array(N),q=[idx(s.x,s.y)];seen[q[0]]=1;for(let h=0;h<q.length;h++){const c=q[h];for(const n of[c-1,c+1,c-MW,c+MW])if(n>=0&&n<N&&!map[n]&&!seen[n]){seen[n]=1;q.push(n)}}
  for(let i=0;i<N;i++)if(!seen[i])map[i]=1;
  // shallow ponds you can wade through; where the path crosses one, it becomes a wooden bridge
  const pond=(cx,cy,rx,ry)=>{for(let y=cy-ry-1;y<=cy+ry+1;y++)for(let x=cx-rx-1;x<=cx+rx+1;x++){if(x<2||y<2||x>=MW-2||y>=MH-2)continue;const i=idx(x,y),d=((x-cx)/rx)**2+((y-cy)/ry)**2+rnd(-.15,.15);if(d<1&&!map[i]&&ground[i]!==2)ground[i]=ground[i]===1||ground[i]===4?4:3}};
  {const mids=nodes.slice(1,-1);for(let k=Math.min(mids.length,Math.round(K));k>0;k--){const n=pick(mids);pond(n.x,n.y,irnd(2,3+Math.round(K)),irnd(2,2+Math.round(K)))}
   for(let k=Math.round(irnd(1,3)*K*1.5);k>0;k--){for(let t=0;t<30;t++){const x=irnd(4,MW-5),y=irnd(4,MH-5);if(!map[idx(x,y)]&&Math.hypot(x-s.x,y-s.y)>10&&Math.hypot(x-e.x,y-e.y)>10){pond(x,y,irnd(2,3+Math.round(K*1.5)),irnd(1,2+Math.round(K)));break}}}}
  const biome=BIOMES[STAGES[((G&&G.stage)||1)-1].biome];
  const put=(t,x,y,v)=>props.push({t,x:(x+rnd(.1,.9))*T,y:(y+rnd(.1,.9))*T,v});
  for(let y=1;y<MH-1;y++)for(let x=1;x<MW-1;x++){const i=idx(x,y),d=deco[i],nearWall=map[idx(x-1,y)]||map[idx(x+1,y)]||map[idx(x,y-1)]||map[idx(x,y+1)];
    if(map[i]){if(map[idx(x,y+1)]===1&&d<(K>1?62:34))put('tree',x,y,d%3);continue}
    if(ground[i])continue;
    if(nearWall&&d<(K>1?72:54))put(d%3?'shrub':'tree',x,y,d%3);
    else if(d<26)put('shrub',x,y,d%3);else if(d<58)put('grass',x,y,d%3);else if(d<70)put('fern',x,y,d%3);else if(d<78)put('flower',x,y,d%3);else if(d<82)put('mush',x,y,d%3);else if(d<86)put('rock',x,y,d%3)}
  // ruins and braziers in the two main clearings, torches along the way
  [s,e].forEach(n=>{for(let a=0;a<6;a++){const an=a/6*TAU,px=n.x+Math.cos(an)*6.5,py=n.y+Math.sin(an)*4.5;if(!map[idx(Math.round(px),Math.round(py))]){const l={t:a%2?'ruin':'lamp',x:(px+.5)*T,y:(py+.5)*T,v:a%3};props.push(l);if(!(a%2))lamps.push(l)}}});
  nodes.slice(1,-1).forEach(n=>{if(!map[idx(n.x,n.y)]){const l={t:'lamp',x:(n.x+.5)*T,y:(n.y+.5)*T};props.push(l);lamps.push(l)}});
  /* Groves: stands of trees on open ground, so the bigger stages have real woods to cross */
  for(let k=K>1?Math.round(6*K):0;k>0;k--){for(let t=0;t<30;t++){const cx=irnd(5,MW-6),cy=irnd(4,MH-5);if(map[idx(cx,cy)]||ground[idx(cx,cy)]||Math.hypot(cx-s.x,cy-s.y)<12||Math.hypot(cx-e.x,cy-e.y)<10)continue;
    const r=irnd(3,5);for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++){if(x<2||y<2||x>=MW-2||y>=MH-2)continue;const i=idx(x,y);if(map[i]||ground[i]||Math.hypot(x-cx,y-cy)>r+rnd(-.6,.6)||deco[i]%5>2)continue;put('tree',x,y,deco[i]%3)}break}}
  /* Stage rule: patches of tall thicket on plain ground. Seeded like the rest of the map, so client and server agree. */
  const thicket=new Uint8Array(N),cover=[];
  for(let k=Math.round((STAGES[((G&&G.stage)||1)-1].thicket||0)*K);k>0;k--){let c=null;for(let t=0;t<30&&!c;t++){const x=irnd(5,MW-6),y=irnd(4,MH-5);if(!map[idx(x,y)]&&!ground[idx(x,y)]&&Math.hypot(x-s.x,y-s.y)>10&&Math.hypot(x-e.x,y-e.y)>8)c={x,y}}if(!c)continue;
    const rx=irnd(3,5),ry=irnd(2,4);for(let y=Math.max(2,c.y-ry-1);y<=Math.min(MH-3,c.y+ry+1);y++)for(let x=Math.max(2,c.x-rx-1);x<=Math.min(MW-3,c.x+rx+1);x++){const i=idx(x,y);if(map[i]||ground[i]||thicket[i]||((x-c.x)/rx)**2+((y-c.y)/ry)**2+rnd(-.2,.2)>=1)continue;thicket[i]=1;cover.push(i);for(let b=0;b<3;b++)put('thicket',x,y,b)}}
  /* Stage rule (C-24): dry islands that stay above the rising water. */
  const isle=new Uint8Array(N);
  for(let k=Math.round((STAGES[((G&&G.stage)||1)-1].islands||0)*K);k>0;k--){let c=null;for(let t=0;t<30&&!c;t++){const x=irnd(5,MW-6),y=irnd(4,MH-5);if(!map[idx(x,y)]&&!ground[idx(x,y)])c={x,y}}if(!c)continue;
    const rx=irnd(2,3),ry=irnd(1,2);for(let y=Math.max(2,c.y-ry);y<=Math.min(MH-3,c.y+ry);y++)for(let x=Math.max(2,c.x-rx);x<=Math.min(MW-3,c.x+rx);x++){const i=idx(x,y);if(!map[i]&&!ground[i]&&((x-c.x)/rx)**2+((y-c.y)/ry)**2<=1.1)isle[i]=1}}
  const openList=[];for(let i=0;i<N;i++)if(!map[i])openList.push(i);
  mctx.fillStyle='#14181c';mctx.fillRect(0,0,MW,MH);
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const i=idx(x,y);if(map[i])continue;mctx.fillStyle=thicket[i]?biome.leaf[0]:ground[i]===1?biome.d:ground[i]===2?'#a89a7c':ground[i]===3?biome.wa[1]:ground[i]===4?'#7a5a38':biome.g[0];mctx.fillRect(x,y,1,1)}

  return{map,ground,deco,bld,props,lamps,thicket,cover,isle:STAGES[((G&&G.stage)||1)-1].islands?isle:null,cars:[],open:openList,biome,start:{x:s.x-6,y:s.y-5},boss:{x:e.x-6,y:e.y-5},flow:new Int16Array(N),queue:new Int32Array(N)};
}
const wall=(tx,ty)=>tx<0||ty<0||tx>=MW||ty>=MH||G.w.map[idx(tx,ty)]===1;
function blocked(x,y,r){const a=r*.8;return wall((x-a)/T|0,(y-a)/T|0)||wall((x+a)/T|0,(y-a)/T|0)||wall((x-a)/T|0,(y+a)/T|0)||wall((x+a)/T|0,(y+a)/T|0)}
/* The nearest place someone of radius r can stand, searching outward tile by tile (walkable tiles all connect to the haven) */
function freeSpot(x,y,r=14){if(!blocked(x,y,r))return{x,y};const tx=x/T|0,ty=y/T|0;
  for(let d=1;d<=14;d++){let best=null,bd=Infinity;for(let j=-d;j<=d;j++)for(let i=-d;i<=d;i++){if(Math.max(Math.abs(i),Math.abs(j))!==d)continue;const cx=(tx+i+.5)*T,cy=(ty+j+.5)*T;if(blocked(cx,cy,r))continue;const k=Math.hypot(cx-x,cy-y);if(k<bd){bd=k;best={x:cx,y:cy}}}if(best)return best}
  return{x:G.safe.x+60,y:G.safe.y+30}}
/* Teleport: jump next to any teammate (online or AI) from the party list. One shared 60 second cooldown. */
const TELEPORT_CD=60;
const canTeleportTo=(p,q)=>!!p&&!!q&&q!==p&&!(q.deadT>0||q.respawnT>0)&&!(p.deadT>0||p.respawnT>0)&&!((p.tpT||0)>0)&&G.mode==='play';
function doTeleport(id){const p=G.p,q=G.players.find(o=>(o.id||1)===id);if(!canTeleportTo(p,q))return;if(p.rideWith)hopOut(p);if(p.carry){p.carry.by=0;p.carry=null}
  burst(p.x,p.y-20,'#8fe0ff',16,160);const o=freeSpot(q.x-Math.cos(q.face||0)*40,q.y+20,p.r||13);p.x=o.x;p.y=o.y;p.dashT=0;p.inv=Math.max(p.inv||0,1);p.tpT=TELEPORT_CD;
  G.fx.push({k:'ring',x:p.x,y:p.y,r:10,to:70,t:.4,m:.4,c:'#8fe0ff'});text(p.x,p.y-80,'Teleported','#8fe0ff',true);sfx('dash')}
/* Unstuck (U): out of a wall to the nearest open spot, otherwise back to the haven (or the edge of the boss arena) */
const UNSTUCK_CD=10;
function homeSpot(p){let x=G.safe.x+60,y=G.safe.y+30;if(G.boss&&G.arena){const a=Math.atan2(G.safe.y-G.arena.y,G.safe.x-G.arena.x);x=G.arena.x+Math.cos(a)*(G.arena.r-45);y=G.arena.y+Math.sin(a)*(G.arena.r-45)}return freeSpot(x,y,p.r||14)}
function doUnstuck(){const p=G.p;if(!p||p.deadT>0||p.respawnT>0||G.mode!=='play')return;if((p.unstuckT||0)>0){addLog('Unstuck ready in '+Math.ceil(p.unstuckT)+' seconds.');return}
  p.unstuckT=UNSTUCK_CD;if(p.carry){p.carry.by=0;p.carry=null}const to=blocked(p.x,p.y,p.r||14)?freeSpot(p.x,p.y,p.r||14):homeSpot(p);p.x=to.x;p.y=to.y;p.dashT=0;p.inv=Math.max(p.inv||0,1.5);
  burst(p.x,p.y-20,'#8fe0ff',14,140);text(p.x,p.y-80,'Unstuck','#8fe0ff',true)}
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
/* Day and night rules (C-73, design section 16). nightness() above is the smooth light level for drawing and crowds;
   the rules read the four periods from this one table. enemyDmg: enemies spawned in the period. gold and xp: kill rewards.
   elite: multiplies the elite chance of rivals and the strong chance of minions. shop: safehouse prices. safeHeal: safehouse
   healing. ranged: chance a hero or villain rival is re-picked from the ranged fighters (the day's "more shooters").
   el: player damage bonus by element. crowdNight: extra rivals on the streets at full night (scaled by nightness, so
   dusk ramps up and day is quietest). retreat: night-born rivals leave at dawn (see dawnRetreat). warnAt: the warning hour. */
const DAYNIGHT={
  periods:[
    {id:'dawn',n:'Dawn',from:5,to:8,enemyDmg:1,gold:1,xp:1,elite:1,shop:1,safeHeal:1.5,ranged:0,el:{}},
    {id:'day',n:'Day',from:8,to:17,enemyDmg:1,gold:1,xp:1,elite:1,shop:.9,safeHeal:1,ranged:.5,el:{holy:1.15}},
    {id:'dusk',n:'Dusk',from:17,to:20,enemyDmg:1,gold:1,xp:1,elite:1,shop:1,safeHeal:1,ranged:0,el:{burn:1.15}},
    {id:'night',n:'Night',from:20,to:5,enemyDmg:1.15,gold:1.25,xp:1.25,elite:2,shop:1,safeHeal:1,ranged:0,el:{void:1.15}}],
  crowdNight:5,retreat:{far:650,unseen:400,maxT:8},warnAt:19,warn:{a:'Night is coming',b:'Enemies grow stronger at 20:00. Elites are twice as likely.'}
};
function period(h){h=(h%24+24)%24;return DAYNIGHT.periods.find(q=>q.from<q.to?h>=q.from&&h<q.to:h>=q.from||h<q.to)}
const dn=()=>period(G.hour),elemTime=el=>(el&&dn().el[el])||1;
/* Dawn: ordinary rivals that arrived at night give up and walk away, then vanish out of sight (no kill, no reward).
   Bosses, elites, villains, Shades, Swarm waves, story foes, stage enemies (stalkers, lurkers and the like) and anyone
   mid-attack stay and fight. */
const RETREAT_ROLES=['rusher','brute','shooter','caster','guard','healer'];
const canRetreat=e=>e.bornNight&&e.kind==='rival'&&!e.elite&&!e.vill&&!e.shade&&!e.swarm&&!G.swarm&&!G.story&&RETREAT_ROLES.includes(e.role)&&!e.shieldbearer&&!e.scrapGolem&&!(e.wind>0)&&!(e.healWind>0);
function dawnRetreat(e,dt){if(!e.retreat){if(dn().id!=='dawn'||!canRetreat(e))return false;e.retreat=true;e.retreatT=0;e.aware=false;e.wind=0;text(e.x,e.y-70,'Retreats','#d8c8a8')}
  const q=nearestPlayer(e),R=DAYNIGHT.retreat;e.retreatT+=dt;const d=q?dist(e,q):1e9;
  if(!q||d>R.far||(d>R.unseen&&!los(e,q))||e.retreatT>R.maxT){e.dead=true;e.gone=true;return true}
  const b=Math.atan2(e.y-q.y,e.x-q.x);stepMove(e,b,e.sp*dt);e.ang=b;e.walk+=dt*6;e.moving=true;return true}
/* The clock crossed the warning hour this frame (handles the wrap past midnight). */
function duskCrossed(h0,h1){const w=DAYNIGHT.warnAt;return h1>=h0?h0<w&&h1>=w:h0<w||h1>=w}
function tintOf(h,n){h=(h%24+24)%24;const warm=(h>=5&&h<8)||(h>=16&&h<20);return warm&&n<.75?{c:[235,120,60],a:.16+.12*Math.sin(n*Math.PI)}:{c:[14,18,52],a:n*.62}}
const clock=h=>{h=(h%24+24)%24;const hh=h|0,m=(h-hh)*60|0;return String(hh).padStart(2,'0')+':'+String(m-(m%5)).padStart(2,'0')};

/* ---------- Stage flow ---------- */
function freshPlayer(name){return{char:name,id:1,x:0,y:0,r:13,hp:100,mana:50,lvl:1,xp:0,gold:20,potions:3+(archOf(name).potions||0),fast:1,magic:1,gear:{armor:null,clothes:null,tool:null},bag:[],weapons:weaponOf(name)==='fists'?['fists']:['fists',weaponOf(name)],weapon:weaponOf(name),weaponUpgrades:{},achievements:{},weaponHealCd:0,runBoons:{wide:0,opening:0},boonPending:false,teamCd:0,breakReady:0,tauntGuard:0,mendT:0,mendRate:0,stats:STATS[name],skills:{},train:{str:0,end:0,agi:0},sp:0,maxStage:1,beaten:0,kills:0,rage:0,bestCombo:0,combo:0,comboT:0,comboPop:0,comboTier:null,ult:null,nearSafe:false,killerT:0,deadT:0,respawnT:0,downCount:0,lastDown:-100,secondWind:false,reviveHold:0,reviveTarget:0,reviveProgress:0,cd:{slash:0,bolt:0,pull:0,dash:0,potion:0},face:0,inv:0,dashT:0,dashX:0,dashY:0,swing:0,swingA:0,walk:0,moving:false,atkT:0,pickT:0,hitT:0,castT:0,guard:false,fastT:0,magicT:0,s:{}}}
function recalc(){
  const p=G.p,sk=id=>p.skills[id]||0,s={dmg:11+p.lvl*2.6+p.train.str*2,maxHp:95+p.lvl*18+p.train.end*15,maxMana:60+p.lvl*4,armor:p.lvl*1.6,crit:.05,speed:165+p.train.agi*2,leech:0,regen:3,blast:64,dashCd:2.4,mana:0,hp:0,spellCost:16,cdMul:1-.012*(p.lvl-1)-.03*p.train.agi,guardMul:1,mendMul:1};
  Object.values(p.gear).forEach(it=>{if(!it)return;for(const k in it.aff)s[k]=(s[k]||0)+it.aff[k]});
  s.maxHp+=s.hp;s.maxMana+=s.mana;archOf(p.char).f(s);{const ps=passiveOf(p.char);if(ps)ps[2](s)}
  s.maxHp*=1+sk('tough')*.06;s.speed=Math.min(290,s.speed*(1+sk('foot')*.02));s.regen+=sk('focus');s.crit+=sk('crit')*.015;s.leech+=sk('leech')*.5;s.guardMul+=sk('guard')*.12;s.mendMul+=sk('mend')*.1;
  /* Haste: levels and Agility shorten every ability cooldown, but never past 60% of the base timer. Character quirks apply first, so the floor holds for them too. */
  s.cdMul=Math.max(.6,Math.min(1,s.cdMul));s.crit=Math.min(CRIT_CAP,s.crit);if(isCaster(p.char))s.regen*=CASTER_REGEN;
  if(p.ai){s.dmg*=AI_MATE.k;s.maxHp*=AI_MATE.k;s.speed*=AI_MATE.spd;s.cdMul*=AI_MATE.cd}
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
function propSpot(minD,maxD){return randomOpen(minD,maxD)||randomOpen(minD*.5,maxD*2)||randomOpen(minD*.25,maxD*4)||{x:G.safe.x+rnd(-160,160),y:G.safe.y+rnd(-60,150)}}
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
function objTargets(){{const id=typeof store!=='undefined'?store.get('dayrim-track'):null,tq=id&&id!=='main'?(G.side||[]).find(q=>q.id===id&&q.st!==2):null;if(tq)return tq.tg?tq.tg.map(t=>({x:t[0],y:t[1],label:t[2]})):sideTargets(tq.id)}const o=G.obj,out=[];if(!o||o.done)return out;if(o.tg)return o.tg.map(t=>({x:t[0],y:t[1],label:t[2]}));const st=o.steps&&o.steps[o.i];if(!st)return out;
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
  const split=st.simul&&!st.alone&&humanSize()>=st.need;
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
function objStep(dt){const o=G.obj;if(!o||o.done||G.story)return;const st=o.steps[o.i];if(!st)return;
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
function enterStage(n,keepKills){for(const q of G.players){q.abil=null;q.abilCast=null;q.beam=null;q.burst=null;q.lungeT=0;q.chg=0;q.holdT=0}
  const kept=keepKills?G.killsStage:0;
  G.stage=n;G.seed=Math.random()*2147483647|0;if(G.story)setMapSize(STORY_MW,STORY_MH);else setMapSize(STAGE_MW,STAGE_MH);G.w=G.story?storyMap(G.story.ci):genCitySeeded(G.seed);G.enemies=[];G.shots=[];G.loot=[];G.fx=[];G.texts=[];G.npcs=[];G.props=[];G.shadeUp=false;G.shadeDone=false;G.boss=null;G.arena=null;G.flesh=null;G.tide=0;G.tideT=0;G.valeT=VALE.first;G.chain={n:0,t:0,tier:null};G.link=null;G.killsStage=kept;G.spawnT=0;G.clearPending=0;G.hopeMax=G.mp?Math.max(3,partyScale().hope):0;G.hopeSpent=0;G.hope=G.hopeMax;
  const st=STAGES[n-1];G.hour=st.h;placeInStage(n);sideInit();springInit();
  G.players.forEach((q,i)=>{q.x=G.safe.x+60-i*30;q.y=G.safe.y+30;q.combo=0;q.comboT=0;q.comboTier=null;q.ult=null;q.mv=null;q.killerT=0;q.boonPending=false;q.weaponHealCd=0;q.teamCd=0;q.breakReady=0;q.tauntGuard=0;q.mendT=0;q.deadT=0;q.respawnT=0;q.reviveHold=0;q.reviveTarget=0;q.reviveProgress=0;q.carry=null;clearEncounterStatus(q);if(!keepKills){q.secondWind=false;q.downCount=0;q.lastDown=-100}});
  G.cam={x:G.p.x,y:G.p.y};
  /* Story chapters bring their own people, enemies and objectives. */
  if(G.story){storyEnter();updateFlow();dirty();return}
  for(let i=0;i<12;i++)spawnNpc();
  G.villT=60;G.decals=[];G.hazards=[];
  const start=Math.round((8+n)*partyCrowd());for(let i=0;i<start;i++)useMobs()?spawnMob(380):spawnRival(380,null,null,n===1&&i===2?'Exorcist':null);
  startObjective();
  G.banner={t:3.4,a:'Stage '+n+': '+st.n,b:n===7?'Rust weakens armor at night. Find shelter.':n===6?'Watch for collapsing floor. Flank Shieldbearers.':n===5?'Spores raise toxin. Clean up at the safehouse or active vents.':(G.obj.steps[0]&&G.obj.steps[0].label)||('Defeat '+quota(n)+' '+foeWord())};
  updateFlow();dirty();writeSave();
}
/* Prototype party scaling; tune after party and human playtests. */
const PARTY_SCALE=[{difficulty:1,minion:1,count:1,quota:1,hope:0},{difficulty:2,minion:1.6,count:1.3,quota:1.4,hope:4},{difficulty:4,minion:2.2,count:1.6,quota:1.8,hope:5},{difficulty:8,minion:2.8,count:1.9,quota:2.2,hope:6}];
/* Bigger parties face tougher enemies, so every gold drop grows with the party: ×1, ×1.5, ×2, ×2.5 (AI teammates count) */
const partyGold=()=>1+.5*(partySize()-1);
const partySize=()=>Math.max(1,Math.min(4,G.players.length)),partyScale=()=>PARTY_SCALE[partySize()-1],partyCrowd=()=>partyScale().count;
function enemyScale(e){const s=partyScale();return e.mob?s.minion:s.difficulty}
function partyToughen(e){const k=enemyScale(e);e.hp*=k;e.maxHp*=k;if(!e.mob)e.dmg*=partyScale().difficulty;e.partyLife=k;e.partyDamage=e.mob?1:partyScale().difficulty;return e}
function offerBoons(){for(const p of G.players){const b=p.runBoons||{};if((b.wide||0)<3||(b.opening||0)<3)p.boonPending=true}addLog('Checkpoint choice ready: open Skills.')};
function rescaleParty(){if(G.mp){const max=Math.max(3,partyScale().hope);G.hopeMax=max;G.hope=Math.max(0,max-(G.hopeSpent||0))}for(const e of G.enemies){if(e.dead)continue;const life=enemyScale(e),damage=e.mob?1:partyScale().difficulty;e.hp*=life/(e.partyLife||1);e.maxHp*=life/(e.partyLife||1);e.dmg*=damage/(e.partyDamage||1);e.partyLife=life;e.partyDamage=damage}if(G.gate&&!G.gate.open&&G.obj&&G.obj.done)openGate();}
const alivePlayers=()=>{const a=G.players.filter(q=>!(q.deadT>0)&&!(q.respawnT>0));return a.length?a:G.players};
function rusherTarget(e){if(e.role!=='rusher'||!e.aware)return null;const a=G.players.filter(q=>!q.deadT&&!q.respawnT&&dist(q,e)<600&&['shooter','medic'].includes(archKey(q.char)));return a.sort((a,b)=>dist(a,e)-dist(b,e))[0]||null}
function nearestPlayer(o,human){let b=null,bd=Infinity;for(const q of alivePlayers()){if(human&&q.ai&&G.players.some(h=>!h.ai))continue;const d=dist(q,o);if(d<bd){bd=d;b=q}}return b}
const ownerOf=s=>G.players.find(q=>q.id===s.pid)||G.players[0];
function shareXp(x){const me=G.p;for(const q of G.players){if(q.ai)continue;G.p=q;gainXp(x)}G.p=me}
function playerDown(p,wind=false){sfx('downed');p.beam=null;p.burst=null;p.lungeT=0;p.chg=0;p.holdT=0;if(p.carry&&p.carry.kind==='canister'){p.carry.by=0;p.carry=null}p.windDown=wind;p.downCount=G.t-p.lastDown<=60?p.downCount+1:0;p.lastDown=G.t;p.deadT=wind?3:Math.max(8,20-p.downCount*5);p.respawnT=0;p.ult=null;p.mv=null;p.guard=false;p.combo=0;p.comboT=0;p.comboTier=null;p.dashT=0;p.reviveHold=0;p.reviveTarget=0;p.reviveProgress=0;p.breakReady=0;p.tauntGuard=0;p.mendT=0;p.moving=false;bleed(p.x,p.y-20,rnd(-1,1),rnd(-1,1),wind?8:16);burst(p.x,p.y-20,'#f0805c',wind?10:24,200);addLog(wind?'Second Wind: getting up in 3 seconds.':'You are down. An ally can revive you.')}
function revive(p){sfx('revive_done');p.deadT=0;p.respawnT=0;p.hp=p.s.maxHp*.35;p.inv=1.5;p.moving=false;burst(p.x,p.y-20,'#6fdca0',18,120)}
function respawn(p){p.deadT=0;p.respawnT=0;{const to=homeSpot(p);p.x=to.x;p.y=to.y}p.hp=p.s.maxHp;p.mana=p.s.maxMana;p.inv=2;p.fastT=p.magicT=0}
function restartCheckpoint(){if(G.swarm){endSwarm();return}const gate=G.gate.open;G.shadeUp=false;G.enemies=[];G.shots=[];G.hazards=[];G.fx=[];G.boss=null;G.arena=null;G.flesh=null;clearLanterns();clearBossEggs();clearSporeBoss();clearGhoul();clearVale();clearScrap();for(const q of G.players)clearEncounterStatus(q);G.clearPending=0;G.spawnT=3;G.villT=60;G.hopeSpent=0;G.hope=G.hopeMax;if(!gate)G.killsStage=0;for(const [i,p] of G.players.entries()){p.deadT=0;p.respawnT=0;p.windDown=false;p.hp=p.s.maxHp;p.mana=p.s.maxMana;p.inv=3;p.dashT=0;p.ult=null;p.mv=null;p.guard=false;p.reviveHold=0;p.reviveTarget=0;p.reviveProgress=0;p.downCount=0;p.lastDown=-100;p.fastT=0;p.magicT=0;p.x=gate?G.gate.x+(i-1.5)*28:G.safe.x+60-i*30;p.y=gate?G.gate.y+100:G.safe.y+30}resetStepState();G.banner={t:4,a:'Party wiped',b:gate?'Retry from the boss gate':'Retry from the latest objective checkpoint'};writeSave()}
function bleedOut(p){p.deadT=0;p.respawnT=8;p.gold=Math.floor(p.gold*.8);p.moving=false;const wipe=G.mp&&!G.clearPending&&G.hope<=0&&!G.players.some(q=>q!==p&&q.deadT<=0&&q.respawnT<=0);if(G.mp&&G.hope>0){G.hopeSpent++;G.hope--;}addLog('You bled out and lost 20% of your gold.');if(wipe)restartCheckpoint();writeSave()}
/* Hold to revive. A downed ally comes first; with none in reach, the same key picks a wounded NPC back up. */
function updateRevive(p,dt){
  const holding=G.mp?p.reviveHold>0:(keys.has('KeyF')||touchHold.revive);p.reviveHold=Math.max(0,p.reviveHold-dt);
  const range=archKey(p.char)==='medic'?120:60;
  if(!holding){p.reviveTarget=0;p.reviveProgress=0;return}
  let q=G.players.find(x=>x.id===p.reviveTarget&&x!==p&&x.deadT>0&&dist(p,x)<=range);
  if(!q)q=G.players.filter(x=>x!==p&&x.deadT>0&&dist(p,x)<=range).sort((a,b)=>dist(p,a)-dist(p,b))[0];
  if(q){if(p.reviveTarget!==q.id)p.reviveProgress=0;if(!p.reviveProgress)sfx('revive_start');p.reviveTarget=q.id;p.reviveProgress+=dt/(archKey(p.char)==='medic'?1.5:3);if(p.reviveProgress>=1){revive(q);achievementUnlock(p,'revive');threatHeal(p,q.s.maxHp*.35);p.reviveTarget=0;p.reviveProgress=0}return}
  p.reviveTarget=0;
  const c=G.npcs.find(x=>x.wounded&&!x.dead&&dist(p,x)<=Math.max(range,80));
  if(!c){p.reviveProgress=0;return}
  if(!p.reviveProgress)sfx('revive_start');p.reviveProgress=Math.min(1,p.reviveProgress+dt/2.4);c.reviveT=p.reviveProgress;
  if(p.reviveProgress>=1){sfx('revive_done');c.wounded=false;c.hp=c.maxHp;c.sp=rnd(34,56);text(c.x,c.y-42,'Saved','#6fdca0',true);burst(c.x,c.y-20,'#6fdca0',14,120);const st=G.obj&&G.obj.steps[G.obj.i];if(st&&st.kind==='revive')st.have++}
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
function addLog(html){if(G.p&&G.p.ai)return;G.log.unshift(html);G.log.length=Math.min(G.log.length,6);dirty()}
let isDirty=true;function dirty(){isDirty=true}

/* Tries scale with map area, so the bigger stages find spots as reliably as the small ones */
function randomOpen(minD,maxD){for(let i=0,n=Math.ceil(40*MW*MH/4290);i<n;i++){const c=pick(G.w.open),x=(c%MW+.5)*T,y=((c/MW|0)+.5)*T;let d=Infinity;for(const q of G.players)d=Math.min(d,Math.hypot(x-q.x,y-q.y));if(d>=minD&&d<=maxD&&dist({x,y},G.safe)>240)return{x,y}}return null}
const ENEMY_VILLAINS=['Necromancer','Void Empress','Toxin Alchemist'];
const MINIONS={Necromancer:[{n:'Skeleton',ah:70},{n:'Bone Goliath',ah:100}],'Void Empress':[{n:'Voidling',ah:70},{n:'Void Goliath',ah:100}],'Toxin Alchemist':[{n:'Toxin Grunt',ah:70},{n:'Toxin Enforcer',ah:100}]};
/* Strong minions have twice the old life, damage and speed of a brute. Life and damage are shares of mobUnit and mobHit. */
const MOB={weak:{hp:.6,dmg:.7,sp:92},strong:{hp:6.4,dmg:3.4,sp:120}};
/* Minions keep up with the party: their level is the stage's recommended level, or the party's average level when that is higher. */
const partyLevel=()=>G.players.length?G.players.reduce((n,q)=>n+(q.lvl||1),0)/G.players.length:1;
const minionLevel=s=>Math.max(recLevel(s),Math.round(partyLevel()));
const useMobs=()=>factionOf(G.p.char)==='hero';
/* Section 11: one job per enemy, picked from how the character fights. */
const METHOD_ROLE={heal:'healer',shield:'guard',spell:'caster',shoot:'shooter'};
/* Weak and strong minions of the three villains */
function spawnMob(minD=500,at=null,forceStrong=null){
  const o=at||randomOpen(minD,1500);if(!o)return null;
  const s=G.stage,P=dn(),strong=forceStrong===null?Math.random()<(.14+s*.018)*P.elite:forceStrong,own=pick(ENEMY_VILLAINS),m=MINIONS[own][strong?1:0],k=MOB[strong?'strong':'weak'],L=minionLevel(s),night=P.enemyDmg;
  const a={melee:true,range:strong?30:18,atk:strong?1.5:1.05,r:strong?20:12};
  const e={role:strong?'brute':'rusher',kind:'rival',mob:strong?'strong':'weak',owner:own,name:m.n,art:m.n,ah:m.ah,a,method:'melee',healT:9,castT:0,guarding:false,x:o.x,y:o.y,r:a.r,lvl:L+(strong?1:0),hp:mobUnit(s,L)*k.hp,maxHp:mobUnit(s,L)*k.hp,dmg:mobHit(s,L)*k.dmg*night,sp:k.sp*(1+s*.012)*Math.min(1.6,1+.15*Math.max(0,s-4)),xp:9*Math.pow(1.22,s-1)*(strong?2.4:.65),gold:rnd(2,6)*Math.pow(1.22,s-1)*(strong?2.5:.6),elite:false,cd:rnd(.4,1),wind:0,ang:rnd(TAU),aware:false,flash:0,kx:0,ky:0,ph:rnd(TAU),walk:rnd(9),atkShow:0,wander:0,wa:rnd(TAU),fs:1};
  if(!strong&&G.stage===1&&G.enemies.filter(x=>x.role==='healer').length===0&&G.enemies.length>=2){e.role='healer';e.method='heal';e.a.melee=false;e.a.atk=1.8;e.healT=2}
  e.bornNight=P.id==='night';partyToughen(e);G.enemies.push(e);return e;
}
/* Every minute two villains walk in. They come from the far side of the player, not on top of them. */
function spawnVillainPair(){for(let i=0;i<2;i++){const e=spawnRival(620,false,null,pick(ENEMY_VILLAINS));if(e){e.hp*=2.6;e.maxHp=e.hp;e.xp*=4;e.gold*=3;e.dmg*=1.25;e.vill=true}}G.banner={t:2.6,a:'Two villains arrive',b:'Their minions came first. Now they want you.'};sfx('boom');G.npcs.forEach(c=>say(c,'villain',.25))}
const isRangedName=n=>['shoot','spell'].includes(WEAPONS[weaponOf(n)].m);
function dayPick(fac){const all=Object.keys(ROSTER[fac]),rng=all.filter(isRangedName);return rng.length&&Math.random()<dn().ranged?pick(rng):pick(all)}
function spawnRival(minD=500,elite=null,at=null,force=null){
  const o=at||randomOpen(minD,1500);if(!o)return null;
  const fac=factionOf(G.p.char)==='hero'?'villain':'hero',name=force||(useMobs()?pick(ENEMY_VILLAINS):dayPick(fac)),s=G.stage,sc=stageScale(s),w=weaponOf(name),method=WEAPONS[w].m,a=Object.assign({},ARCH[ROSTER[fac][name]].e);
  a.melee=method!=='shoot'&&method!=='spell';
  if(a.melee)a.atk=Math.min(a.atk,1.3);else a.atk=method==='spell'?2.1:1.7;
  if(method==='unarmed'){a.atk*=.75;a.dmg*=.85}
  const P=dn(),el=elite===null?Math.random()<(.06+s*.008)*P.elite:elite,m=el?2.5:1;
  const night=P.enemyDmg;
  const e={role:METHOD_ROLE[method]||(a.melee?'rusher':'shooter'),kind:'rival',name,a,w,method,healT:rnd(1,3),castT:0,guarding:false,x:o.x,y:o.y,r:a.r*(el?1.1:1),hp:mobUnit(s)*a.hp*m,maxHp:mobUnit(s)*a.hp*m,dmg:mobHit(s)*a.dmg*(el?1.3:1)*night,sp:a.sp*(1+s*.012),xp:9*Math.pow(1.22,s-1)*(el?3:1),gold:rnd(2,6)*Math.pow(1.22,s-1)*(el?3:1),elite:el,cd:rnd(.4,1),wind:0,ang:rnd(TAU),aware:false,flash:0,kx:0,ky:0,ph:rnd(TAU),walk:rnd(9),atkShow:0,wander:0,wa:rnd(TAU)};
  e.bornNight=P.id==='night';partyToughen(e);G.enemies.push(e);return e;
}
function spawnNpc(){const o=randomOpen(0,5000);if(!o)return;const hp=26*stageScale(G.stage);G.npcs.push({name:pick(NPC_NAMES),x:o.x,y:o.y,r:9,dx:0,dy:1,t:0,walk:rnd(9),quip:null,qt:0,sp:rnd(34,56),hp,maxHp:hp,scare:0,kx:0,ky:0,flash:0})}
/* ---------- Boss framework (C-17) ----------
   Every boss shares a guard bar, a stagger, an enrage clock, phase changes and a telegraph on every big
   attack. The numbers live here so one balance pass moves all ten bosses. */
const BOSS_GUARD_MAX=100,BOSS_STAGGER=5,BOSS_TELEGRAPH=.6,BOSS_ENRAGE_BASE=240,BOSS_ENRAGE_STEP=30,BOSS_ENRAGE_RATE=.66,BOSS_STAGGER_DMG=1.5;
const BOSS_PHASES={1:[.5],2:[.6,.25],3:[.5],4:[.6,.3],5:[.6,.3],6:[.66],7:[.5,.2]};
const BOSS_GUARD_GAIN={break:34,reaction:22,special:10,eye:30};
function bossGuard(e,amt){if(!e||e.kind!=='boss'||e.staggerT>0)return;e.guard=Math.min(e.guardMax||BOSS_GUARD_MAX,(e.guard||0)+amt);if(e.guard>=(e.guardMax||BOSS_GUARD_MAX)){e.guard=0;e.staggerT=BOSS_STAGGER;sfx('boss_stagger');e.tel=null;e.act='walk';e.actT=BOSS_STAGGER;text(e.x,e.y-e.ah*.8,'STAGGERED','#ffd860',true);shake(8);sfx('boom');addLog('The boss is staggered.')}}
/* Enemy voices (tools/make_audio.py): weak and strong voices for minions and role enemies (brutes, guards and elites
   sound strong), and creature voices for Stalkers, Lurkers and art monsters. Bosses and the three kit villains have their own. */
const mobVoice=e=>e.kind==='boss'||e.vill?null:(e.role==='stalker'||e.role==='lurker'||(e.art&&!e.mob))?'beast':(e.mob==='strong'||e.elite||e.role==='brute'||e.role==='guard'||e.scrapGolem||e.shieldbearer)?'strong':'weak';
function enemySfx(e,ev){const v=mobVoice(e);if(v)sfx(v+'_'+ev)}
/* After each enemy update: a voice when it first notices someone, and when it starts any attack (wind-up, strike, cast or shot) */
function enemyVoiceWatch(e){if(e.dead)return;if(e.aware&&!e.spoke){e.spoke=1;enemySfx(e,'spot')}
  const busy=(e.wind||0)>0||(e.atkShow||0)>0||(e.castT||0)>0||(e.aimT||0)>0||(e.pounceT||0)>0;if(busy&&!e.attacking)enemySfx(e,'attack');e.attacking=busy}
function bossTelegraph(e,kind,r,dur){sfx('boss_warn');e.tel={k:kind,r,r2:r,dur:Math.max(BOSS_TELEGRAPH,dur)};e.actT=e.tel.dur;return e.tel}
function bossPhaseCheck(e){if(e.kind!=='boss')return;if(e.fleshSplit){fleshAfterDamage(e);return}const th=BOSS_PHASES[e.kit||G.stage]||[];const frac=e.hp/e.maxHp;while((e.phase||0)<th.length&&frac<=th[e.phase]){e.phase=(e.phase||0)+1;sfx('boss_phase');G.shots=G.shots.filter(s=>s.from!=='e');const fx=BOSS_PHASE_FX[e.kit||G.stage];if(fx)fx(e);e.breatherT=2;e.act='walk';e.actT=2;e.tel=null;G.banner=(e.kit||G.stage)===7?(e.phase===1?{t:3,a:'Rust Field',b:'Shock it with the charged coil'}:{t:3,a:'Last Stand',b:'Watch the faster combo'}):(e.kit||G.stage)===6&&e.phase===1?{t:3,a:'Keep them apart',b:'Separate the bodies or they heal'}:{t:2.4,a:'Phase '+(e.phase+1),b:'It changes its attack'};shake(6);sfx('boom');burst(e.x,e.y-30,'#ffd8a0',40,240)}}
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
  G.banner={t:2.6,a:'Crystal pillars',b:soloPlay()?'A charged move breaks one':'Hit one together, within 2s'}}
function breakPillar(c){if(!c||c.done)return false;c.done=true;G.fx.push({k:'ring',x:c.x,y:c.y,r:10,to:90,t:.35,m:.35,c:'#bff0ff'});burst(c.x,c.y,'#bff0ff',26,210);shake(4);sfx('boom');text(c.x,c.y-44,'Pillar broken','#8fd6ff',true);return true}
/* A pillar only breaks on timing, never on raw damage. */
function pillarHit(c,p,charged){if(!c||c.done)return false;
  if(soloPlay()){if(!charged){text(c.x,c.y-44,'Charged move','#8fd6ff',true);return false}const done=breakPillar(c);if(done)achievementUnlock(p,'pillar');return done}
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
function spawnLanterns(){clearLanterns();const o=G.arena||G.boss||G.gate;for(const s of[-1,1]){let x=o.x+s*150,y=o.y+60;if(blocked(x,y,12)){x=o.x;y=o.y}addProp('lantern',x,y,12)}G.banner={t:3.2,a:'Lantern Anchor',b:soloPlay()?'Carry a lantern to her and hold F to set it down':'Only lantern light lets you hurt her. Hold F to set one down'}}
function lanternTick(dt){for(const l of G.props){if(l.kind!=='lantern')continue;l.cool=Math.max(0,(l.cool||0)-dt);if(l.dropBy){const d=G.players.find(q=>(q.id||1)===l.dropBy);if(!d||dist(d,l)>40)l.dropBy=0}if(l.by){const c=G.players.find(q=>(q.id||1)===l.by);if(!c||c.carry!==l||c.deadT>0||c.respawnT>0){l.by=0;l.t=soloPlay()?999:BANSHEE.lanternLit;if(c&&c.carry===l)c.carry=null}else{l.x=c.x;l.y=c.y}}else if(l.t>0&&l.t<900)l.t=Math.max(0,l.t-dt)}}
function lanternStep(p){const ls=G.props.filter(o=>o.kind==='lantern');if(!ls.length)return;
  if(!p.carry){const l=ls.find(l=>!l.by&&!(l.cool>0)&&l.dropBy!==(p.id||1)&&dist(p,l)<28);if(l){l.by=p.id||1;l.x=p.x;l.y=p.y;p.carry=l;text(p.x,p.y-70,'Hold F to set the lantern down','#ffe2a0',true)}return}
  const f=G.mp?p.reviveHold>0:(keys.has('KeyF')||touchHold.revive);
  if(p.carry.kind==='lantern'&&f&&!G.players.some(q=>q!==p&&q.deadT>0&&dist(q,p)<120)){const l=p.carry;l.by=0;l.t=soloPlay()?999:BANSHEE.lanternLit;l.cool=1;l.dropBy=p.id||1;p.carry=null;text(p.x,p.y-70,'Lantern set','#ffe2a0',true)}}
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
function sporeBossTick(dt){const e=G.boss;if(!e||(e.kit||G.stage)!==5)return;if(!soloPlay()&&!G.props.some(c=>c.kind==='purifier')){const o=sporeSpot(Math.PI/2,190);addProp('purifier',o.x,o.y,12,{sporeBoss:true})}purifierTick(dt);const live=G.players.filter(p=>!p.ai&&!(p.deadT>0||p.respawnT>0));if(!live.length)return;
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
function fleshDownBody(e){const f=G.flesh;if(!f||e.fleshDown)return;e.hp=0;e.fleshDown=true;e.act='walk';e.tel=null;e.moving=false;e.flash=0;e.rotT=0;if(f.one.fleshDown&&f.two.fleshDown){fleshRejoin(f.one.maxHp*FLESH.rejoin);return}f.t=soloPlay()?FLESH.soloWindow:FLESH.partyWindow;f.one.fleshTime=f.t;f.one.fleshTotal=Math.max(0,f.one.hp)+Math.max(0,f.two.hp);G.banner={t:3,a:'One body is down',b:'Defeat the other within '+f.t+' seconds'};sfx('boom')}
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
function ghoulTick(dt){const e=G.boss;if(!e||(e.kit||G.stage)!==7)return;const live=G.players.filter(q=>!q.ai&&!(q.deadT>0||q.respawnT>0)),g=G.props.find(o=>o.kind==='ghoulGen'),c=G.props.find(o=>o.kind==='ghoulCoil');if(!live.length||!g||!c)return;if(e.rustField)for(const q of live)q.fieldRust=Math.min(GHOUL.fieldMax,(q.fieldRust||0)+GHOUL.fieldRate*dt);const solo=live.length===1,power=!solo&&live.some(q=>dist(q,g)<70&&(G.mp?q.reviveHold>0:(keys.has('KeyF')||touchHold.revive))&&!G.players.some(x=>x!==q&&x.deadT>0&&dist(x,q)<120));g.by=power?1:0;c.t=Math.min(1,(c.t||0)+(solo?dt/GHOUL.soloCharge:power?dt/GHOUL.partyCharge:0));g.t=c.t;c.by=c.t>=1?1:0;if(c.by&&(solo||power)&&!(e.staggerT>0)&&dist(e,c)<c.r+e.r){const me=G.p;G.p=nearestPlayer(e)||me;bossGuard(e,(e.guardMax||BOSS_GUARD_MAX)-(e.guard||0));G.p=me;e.rustField=false;for(const q of G.players)q.fieldRust=0;c.t=g.t=0;c.by=0;G.fx.push({k:'ring',x:c.x,y:c.y,r:10,to:160,t:.5,m:.5,c:'#8fd6ff'});G.banner={t:2.6,a:'Generator Shock',b:'The Rust Field is cleared'};sfx('bolt')}}
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
    if(soloPlay()&&!(e.eyeT>0)&&p.dashT>0&&inBeam(e,p,e.beamA,GLOOM.beamLen,GLOOM.beamW+30))openEye(e,Math.atan2(p.y-e.y,p.x-e.x));
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
/* ---------- Late stages: bosses scale up from stage 5, and bosses, shades and minions dodge ----------
   Only plain hits can be dodged (no charged hits, beams, abilities or ultimates), so skill still pays. */
const BOSS_MULT={5:2,6:2.5,7:3,8:3.5,9:4,10:10},bossMult=n=>BOSS_MULT[n]||1;
const DODGE={boss:n=>n<5?0:n>=10?.45:.15+(n-5)*.05,mob:n=>n<5?0:.08+(n-5)*.028,bossCd:1.6,mobCd:2,safe:.35};
const ESCAPE={share:.12,window:3,cd:8,min:110,max:240};
function dodgeChance(e){const n=G.stage||1;if(e.kind==='boss')return DODGE.boss(n);if(e.shade)return e.lives===1?SHADE.lastDodge:Math.max(DODGE.boss(n),DODGE.boss(5));if(e.mob)return DODGE.mob(n);return 0}
function tryDodge(e,ang){const ch=dodgeChance(e);if(!(ch>0)||(e.dodgeCd||0)>G.t||Math.random()>=ch)return false;
  const big=e.kind==='boss'||e.shade;e.dodgeCd=G.t+(big?DODGE.bossCd:DODGE.mobCd);e.dodgeUntil=G.t+DODGE.safe;
  const side=Math.random()<.5?1:-1,d=big?70:46;for(const s of [side,-side]){const a=ang+s*Math.PI/2,nx=e.x+Math.cos(a)*d,ny=e.y+Math.sin(a)*d;if(!blocked(nx,ny,(e.r||14)*.6)){e.x=nx;e.y=ny;break}}
  text(e.x,e.y-(e.ah||60)*.9,'Dodged','#c8d8ff');for(let i=0;i<6;i++)G.fx.push({k:'p',x:e.x+rnd(-10,10),y:e.y+rnd(-4,4),vx:rnd(-60,60),vy:rnd(-40,0),t:.3,m:.3,c:'#c8c8c0',s:rnd(2,4)});return true}
/* Bosses and shades from stage 5 slip away after a burst of damage */
function escapeCheck(e){if((G.stage||1)<5)return;if(e.escT0===undefined||G.t-e.escT0>ESCAPE.window){e.escT0=G.t;e.escHp=e.hp}
  if(e.escHp-e.hp<e.maxHp*ESCAPE.share||(e.escCd||0)>G.t||e.act==='rise')return;
  const foe=G.players.filter(q=>!(q.deadT>0)).sort((a,b)=>dist(a,e)-dist(b,e))[0];if(!foe)return;
  for(let k=0;k<28;k++){const a=k<14?Math.atan2(e.y-foe.y,e.x-foe.x)+rnd(-1.2,1.2):rnd(0,TAU),d=rnd(ESCAPE.min,ESCAPE.max),nx=e.x+Math.cos(a)*d,ny=e.y+Math.sin(a)*d;
    if(blocked(nx,ny,(e.r||14)*.7)||(G.arena&&e.kind==='boss'&&Math.hypot(nx-G.arena.x,ny-G.arena.y)>G.arena.r-40))continue;
    G.fx.push({k:'ring',x:e.x,y:e.y-20,r:10,to:70,t:.35,m:.35,c:'rgba(200,180,255,.8)'});e.x=nx;e.y=ny;G.fx.push({k:'ring',x:e.x,y:e.y-20,r:70,to:10,t:.35,m:.35,c:'rgba(200,180,255,.8)'});
    text(e.x,e.y-(e.ah||60),'Escaped','#c8b8ff',true);e.escCd=G.t+ESCAPE.cd;e.dodgeUntil=G.t+.5;e.escT0=G.t;e.escHp=e.hp;return}}
/* ---------- Side quests and stage goals ----------
   Every stage has three handwritten side quests; each run offers two or three of them. Each giver is a different
   person standing in their own spot out on the map: find them (the Quests panel can point the way), read their story
   and accept. Quests never block the gate. */
const STAGE_GOAL={1:'Free Sunrise Hollow: drive out the foes and slay the Crystal Scurrier.',2:'Light the way through Noonshade Thicket and blind the Gloom Eye.',3:'Cross Duskwater Fen before the tide and silence the Banshee Phantasm.',4:'Break into the Webbed Barrow and crack the Chitin Horror.',5:'Cleanse Sporefall Marsh and fell the Spore Brute.',6:'Hold the crumbling Ruined Vale and tear apart the Flesh Amalgam.',7:'Brave the rusting woods and scrap the Rusted Ghoul.',8:'Delve the Midnight Warrens and shut down the Cyber Dread.',9:'Walk the Blightmoor and unravel the Void Weaver.',10:'Face The Last Night and end the Nameless King.'};
const SIDE_QUESTS={
 1:[{id:'s1a',giver:'Miller Hob',title:"The miller's lost sheep",kind:'rescue',item:'Sheep',story:['A storm scattered my flock, and old Bramble never came home.','Find her in the hills and walk her back to the haven, would you?'],gold:40},
    {id:'s1b',giver:'Herbwife Ela',title:'Sunpetals for a fever',kind:'gather',item:'Sunpetal',n:8,story:['The village children burn with fever.','Sunpetals bloom across the hollow. Bring me eight before it worsens.'],gold:35},
    {id:'s1c',giver:'Watchman Dorr',title:'The bandit captain',kind:'bounty',item:'Captain Redcap',story:['A captain leads raids on our road at dusk.','End him, and the watch will pay you well.'],gold:55,loot:true}],
 2:[{id:'s2a',giver:'Herbalist Wren',title:'Moonpetals for the herbalist',kind:'gather',item:'Moonpetal',n:8,story:['Moonpetals only grow where the thicket is darkest.','Gather eight and I can brew sight against the Gloom.'],gold:50},
    {id:'s2b',giver:'Ranger Tess',title:'The poisoned spring',kind:'cleanse',item:'Tainted spring',n:3,story:['Something has fouled the three springs in the thicket.','Stand by each one until the water runs clear.'],gold:55},
    {id:'s2c',giver:'Courier Jem',title:'A letter through the thorns',kind:'deliver',item:'Sealed letter',story:['This letter must reach the woodcutters past the thorns.','Carry it to their camp. Mind the beasts.'],gold:50}],
 3:[{id:'s3a',giver:'Bellkeeper Oswin',title:'The drowned bell of Duskwater',kind:'hold',item:'Old bell tower',n:20,story:['When the bell tower sank, the fen went silent.','Guard the old tower while I ring it one last time.'],gold:70},
    {id:'s3b',giver:'Fisher Maud',title:'Lost in the reeds',kind:'rescue',item:'Lost boy',story:['My boy chased a light into the reeds at dusk.','Find him and bring him home before the tide.'],gold:65},
    {id:'s3c',giver:'Witch Nell',title:'Bog-lantern wicks',kind:'gather',item:'Glow-wick',n:10,story:['Bog lanterns guide the lost, but their wicks are spent.','Gather ten glow-wicks from the fen for me.'],gold:60}],
 4:[{id:'s4a',giver:'Gravekeeper Sol',title:'Silence the web-mother',kind:'bounty',item:'The Web-Mother',story:['A brood-mother nests among the barrows.','Kill her before her young hatch.'],gold:90,loot:true},
    {id:'s4b',giver:'Priest Avel',title:'Restless barrows',kind:'cleanse',item:'Restless barrow',n:3,story:['Three barrows will not stay quiet.','Stand at each and let them rest again.'],gold:85},
    {id:'s4c',giver:'Digger Bram',title:'Bones for the ossuary',kind:'gather',item:'Old bone',n:10,story:['The dead deserve their place in the ossuary.','Gather ten scattered bones for me.'],gold:80}],
 5:[{id:'s5a',giver:'Alchemist Ivo',title:'Purify the spore wells',kind:'cleanse',item:'Spore well',n:3,story:['Spores choke the three wells.','Burn them clean by standing watch over each one.'],gold:120},
    {id:'s5b',giver:'Mushroom-wife Gilda',title:'Glowcaps for the cure',kind:'gather',item:'Glowcap',n:10,story:['Glowcaps cure the spore-cough.','Pick ten before the marsh rots them.'],gold:110},
    {id:'s5c',giver:'Hunter Kael',title:'The rot-hound',kind:'bounty',item:'Rot-Hound Grisk',story:['A hound twisted by spores hunts my trail.','Put it down for good.'],gold:140,loot:true}],
 6:[{id:'s6a',giver:'Scholar Vey',title:"The vale's stolen relic",kind:'deliver',item:'Stone relic',story:['Raiders took our relic to sell beyond the vale.','I got it back. Carry it to the old shrine, quickly.'],gold:160},
    {id:'s6b',giver:'Mason Gerd',title:'Shore up the ruins',kind:'hold',item:'Leaning ruin',n:22,story:['That old wall is about to fall on my crew.','Hold off the beasts while we brace it.'],gold:170},
    {id:'s6c',giver:'Widow Ama',title:"A soldier's dog",kind:'rescue',item:'Loyal hound',story:["My husband's hound still waits at the battlefield.",'Bring her home to me.'],gold:150}],
 7:[{id:'s7a',giver:'Lamplighter Fen',title:'Rust-eaten lanterns',kind:'cleanse',item:'Rusted lantern',n:3,story:['Rust has eaten the lanterns on the woodland path.','Relight each one while I fetch oil.'],gold:210},
    {id:'s7b',giver:'Smith Oda',title:'Iron for the forge',kind:'gather',item:'Iron scrap',n:12,story:['My forge is cold without iron.','Bring me twelve scraps from the rusting woods.'],gold:200},
    {id:'s7c',giver:'Tinker Pell',title:'The scrap warden',kind:'bounty',item:'Scrap Warden',story:['A warden of rust guards the old machines.','Bring it down and the parts are yours.'],gold:240,loot:true}],
 8:[{id:'s8a',giver:'Foreman Rusk',title:"The crystal miner's last shift",kind:'rescue',item:'Trapped miner',story:['One of my miners never came up.','Find him in the warrens and lead him out.'],gold:280},
    {id:'s8b',giver:'Seer Lio',title:'Singing crystals',kind:'gather',item:'Singing crystal',n:12,story:['The crystals hum warnings of what is coming.','Bring me twelve to listen to.'],gold:270},
    {id:'s8c',giver:'Warden Hale',title:'Hold the lift',kind:'hold',item:'Mine lift',n:25,story:['The lift is our only way out.','Keep the creatures off it while it climbs.'],gold:300}],
 9:[{id:'s9a',giver:'Pilgrim Ysolde',title:'Void-touched pilgrim',kind:'deliver',item:'Pilgrim relic',story:['The void is in me. I cannot walk on.','Carry my relic to the moor shrine for me.'],gold:360},
    {id:'s9b',giver:'Exorcist Brann',title:'Seal the rifts',kind:'cleanse',item:'Void rift',n:3,story:['Three rifts bleed the void onto the moor.','Stand at each until it seals.'],gold:380},
    {id:'s9c',giver:'Knight Aldric',title:'The fallen champion',kind:'bounty',item:'Champion Morvane',story:['My old champion walks the moor, void-taken.','Free him with your blade.'],gold:420,loot:true}],
 10:[{id:'s10a',giver:'Herald Corin',title:"The king's broken crown",kind:'gather',item:'Crown shard',n:12,story:['The old crown shattered across the land.','Gather twelve shards, so his power wanes.'],gold:520},
    {id:'s10b',giver:'Last Priest',title:'The final vigil',kind:'hold',item:'Last altar',n:30,story:['The last altar must burn until dawn.','Guard it against the night.'],gold:560},
    {id:'s10c',giver:'Queen Mira',title:"The queen's champion",kind:'bounty',item:'The Black Knight',story:["The king's black knight hunts the living.",'End him and I will reward you as a queen should.'],gold:620,loot:true}]
};
/* Every giver is a different person: their own look, standing somewhere out on the map */
const GIVER_ART={s1a:'Baker',s1b:'Gardener',s1c:'Guard',s2a:'Apothecary',s2b:'Athlete',s2c:'Mail',s3a:'Prelate',s3b:'Fisher',s3c:'Medium',s4a:'Undertaker',s4b:'Priest',s4c:'Builder',s5a:'Chemist',s5b:'Shopper',s5c:'Soldier',s6a:'Scribe',s6b:'Carpenter',s6c:'Sister',s7a:'Janitor',s7b:'Mechanic',s7c:'Plumber',s8a:'Driver',s8b:'Initiate',s8c:'Judge',s9a:'Nurse',s9b:'Paramedic',s9c:'Boxer',s10a:'Reporter',s10b:'Elder',s10c:'Singer'};
for(const k in SIDE_QUESTS)for(const q of SIDE_QUESTS[k])q.art=GIVER_ART[q.id]||'Tourist';
const SIDE_KINDS=['gather','cleanse','bounty','rescue','deliver','hold'],SIDE_REACH=34,SIDE_CHANNEL=2.5,GIVER_GAP=520;
const sideDef=id=>{for(const k in SIDE_QUESTS){const q=SIDE_QUESTS[k].find(x=>x.id===id);if(q)return q}return null};
/* Pick two or three of the stage's quests and place their givers around the haven */
function sideInit(){G.side=[];if(G.story||G.swarm||!SIDE_QUESTS[G.stage])return;const pool=SIDE_QUESTS[G.stage].slice(),n=Math.random()<.5?2:3;
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
  const spots=[];pool.slice(0,n).forEach(d=>{let o=null,best=-1;for(let t=0;t<40;t++){const c=propSpot(600,3600),gap=Math.min(Infinity,...spots.map(s=>Math.hypot(s.x-c.x,s.y-c.y)),Math.hypot(c.x-G.safe.x,c.y-G.safe.y));if(gap>GIVER_GAP){o=c;break}if(gap>best){best=gap;o=c}}spots.push(o);
    G.side.push({id:d.id,kind:d.kind,st:0,have:0,need:d.n||1,t:0});addProp('sq_giver',o.x,o.y,14,{q:d.id})})}
const sideOf=id=>(G.side||[]).find(q=>q.id===id),sideProps=id=>(G.props||[]).filter(o=>o.q===id&&o.kind!=='sq_giver');
/* Accepting sets the quest up on the map */
function sideAccept(id){const q=sideOf(id),d=sideDef(id);if(!q||!d||q.st!==0)return false;q.st=1;const far=()=>propSpot(900,6000);
  if(q.kind==='gather')for(let i=0;i<q.need;i++){const o=far();addProp('sq_item',o.x,o.y,12,{q:id})}
  else if(q.kind==='cleanse')for(let i=0;i<q.need;i++){const o=far();addProp('sq_totem',o.x,o.y,40,{q:id})}
  else if(q.kind==='rescue'){const o=far();addProp('sq_lost',o.x,o.y,12,{q:id})}
  else if(q.kind==='deliver'){addProp('sq_parcel',G.safe.x+rnd(-40,40),G.safe.y+50,12,{q:id});const o=far();addProp('sq_drop',o.x,o.y,46,{q:id})}
  else if(q.kind==='hold'){const o=far();addProp('sq_shrine',o.x,o.y,90,{q:id})}
  else if(q.kind==='bounty'){const o=far(),e=spawnRival(0,true,o);if(e){e.hp=e.maxHp=e.maxHp*2;e.title=d.item;e.sq=id;e.lvl=(e.lvl||recLevel(G.stage))+2;e.aware=false}}
  G.banner={t:2.6,a:d.title,b:'Quest accepted'};sfx('menu');return true}
function sideFinish(q){const d=sideDef(q.id);q.st=2;for(const o of G.props)if(o.q===q.id)o.done=true;G.props=G.props.filter(o=>o.q!==q.id||o.kind==='sq_giver');
  const gold=Math.round(d.gold*Math.pow(1.12,G.stage-1));for(const p of G.players){p.gold+=gold}shareXp(xpNeed(recLevel(G.stage))*.35);
  if(d.loot){const p=G.players[0];dropLoot({x:p.x+20,y:p.y,elite:true,kind:'rival',lvl:recLevel(G.stage)+2,gold:Math.round(gold*.5),xp:0},false)}
  text(G.players[0].x,G.players[0].y-70,'+'+gold+' gold','#e8c95c',true);G.banner={t:3,a:'Quest complete',b:d.title};sfx('loot')}
function sideStep(dt){if(!G.side||!G.side.length)return;const live=alivePlayers();
  for(const q of G.side){if(q.st!==1)continue;const ps=sideProps(q.id);
    if(q.kind==='gather'){for(const o of ps)if(!o.done&&live.some(p=>dist(p,o)<SIDE_REACH)){o.done=true;q.have++;text(o.x,o.y-30,sideDef(q.id).item,'#e0b878')}G.props=G.props.filter(o=>!(o.q===q.id&&o.kind==='sq_item'&&o.done))}
    else if(q.kind==='cleanse'){for(const o of ps)if(!o.done){if(live.some(p=>dist(p,o)<o.r)){o.t+=dt;if(o.t>=SIDE_CHANNEL){o.done=true;q.have++;text(o.x,o.y-50,'Cleansed','#8fe6b8',true)}}else o.t=Math.max(0,o.t-dt*.5)}}
    else if(q.kind==='rescue'){const o=ps[0];if(o){const lead=live.filter(p=>dist(p,o)<220).sort((a,b)=>dist(a,o)-dist(b,o))[0];if(lead){o.by=lead.id||1;const d=dist(lead,o);if(d>40){const a=Math.atan2(lead.y-o.y,lead.x-o.x),sp=Math.min(190,d*2);const nx=o.x+Math.cos(a)*sp*dt,ny=o.y+Math.sin(a)*sp*dt;if(!blocked(nx,ny,8)){o.x=nx;o.y=ny}}}else o.by=0;if(dist(o,G.safe)<80)q.have=1}}
    else if(q.kind==='deliver'){const o=ps.find(x=>x.kind==='sq_parcel'),to=ps.find(x=>x.kind==='sq_drop');if(o&&to){let c=o.by?live.find(p=>(p.id||1)===o.by):null;if(!c){c=live.find(p=>dist(p,o)<SIDE_REACH);if(c)o.by=c.id||1}if(c){o.x=c.x;o.y=c.y-2}if(dist(o,to)<to.r)q.have=1}}
    else if(q.kind==='hold'){const o=ps[0];if(o){if(live.some(p=>dist(p,o)<o.r)){if(!o.by){o.by=1;for(let i=0;i<3+Math.floor(G.stage/3);i++)spawnMob(0,{x:o.x+rnd(-260,260),y:o.y+rnd(-200,200)})}q.have=Math.min(q.need,q.have+dt);o.t=q.have}}}
    else if(q.kind==='bounty'){const e=G.enemies.find(x=>x.sq===q.id);if(!e||e.dead)q.have=1}
    if(q.have>=q.need)sideFinish(q)}}
/* Where the HUD arrow should point for a tracked quest */
function sideTargets(id){const q=sideOf(id);if(!q)return[];if(q.st===0){const g=(G.props||[]).find(o=>o.q===id&&o.kind==='sq_giver');return g?[{x:g.x,y:g.y,label:'Quest'}]:[]}if(q.st!==1)return[];
  if(q.kind==='bounty'){const e=G.enemies.find(x=>x.sq===id&&!x.dead);return e?[{x:e.x,y:e.y,label:sideDef(id).item}]:[]}
  if(q.kind==='rescue'){const o=sideProps(id)[0];return o?[{x:o.by?G.safe.x:o.x,y:o.by?G.safe.y:o.y,label:o.by?'Haven':sideDef(id).item}]:[]}
  if(q.kind==='deliver'){const o=sideProps(id).find(x=>x.kind===(sideProps(id).find(y=>y.kind==='sq_parcel'&&y.by)?'sq_drop':'sq_parcel'));return o?[{x:o.x,y:o.y,label:o.kind==='sq_drop'?'Deliver':sideDef(id).item}]:[]}
  return sideProps(id).filter(o=>!o.done).slice(0,6).map(o=>({x:o.x,y:o.y,label:sideDef(id).item}))}
const sideLine=q=>{const d=sideDef(q.id);if(!d)return'';return d.title+(q.st===2?' · done':q.st===0?' · talk to '+d.giver:q.kind==='hold'?' '+Math.floor(q.have)+'/'+q.need+'s':q.need>1?' '+Math.floor(q.have)+'/'+q.need:'')};
/* Sent to clients as compact JSON: [id,state,have,need,targets] */
const sideWire=()=>JSON.stringify((G.side||[]).map(q=>[q.id,q.st,Math.floor(q.have*10)/10,q.need,sideTargets(q.id).map(t=>[Math.round(t.x),Math.round(t.y),t.label])]));
/* ---------- The Shade (stage 2+) ----------
   Before the boss, each living player meets a darkened double of their own character: twice the life, damage and
   speed of an elite of that character at the player's level (four times on stage 10, speed capped). It has three
   lives: twice it falls and rises again at full life; on its last life it takes far less damage, dodges often and
   heals whenever it is left alone, so only a steady, skilful attack finishes it. The boss comes once it falls. */
const SHADE={from:2,mul:2,finalMul:4,maxSpeed:2.8,lives:3,lastTake:.4,lastDodge:.6,regen:.03,regenWait:2.5};
const shadeMul=()=>(G.stage||1)>=10?SHADE.finalMul:SHADE.mul,shadesAlive=()=>G.enemies.some(e=>e.shade&&!e.dead);
const needShades=()=>(G.stage||1)>=SHADE.from&&!G.story&&!G.swarm&&!G.shadeDone&&!G.shadeUp;
function spawnShade(p,at){const name=p.char,fac=factionOf(name),arch=ROSTER[fac]&&ROSTER[fac][name];if(!arch)return null;
  const s=G.stage,w=p.weapon||weaponOf(name),method=WEAPONS[w]?WEAPONS[w].m:'melee',a=Object.assign({},ARCH[arch].e),k=shadeMul();
  a.melee=method!=='shoot'&&method!=='spell';a.atk=a.melee?Math.min(a.atk,1.1):method==='spell'?1.6:1.3;
  const hp=mobUnit(s,p.lvl)*a.hp*2.5*k,sp=Math.min(SHADE.maxSpeed,k)*p.s.speed;
  const e={role:METHOD_ROLE[method]||(a.melee?'rusher':'shooter'),kind:'rival',shade:true,mirrorOf:p.id||1,title:'Shade of '+label(name),name,a,w,method,healT:rnd(1,3),castT:0,guarding:false,x:at.x,y:at.y,r:a.r*1.1,lvl:p.lvl+2,
    hp,maxHp:hp,lives:SHADE.lives,dmg:mobHit(s,p.lvl)*a.dmg*1.3*k,sp,xp:xpNeed(p.lvl)*.6,gold:60*Math.pow(1.25,s-1),elite:false,cd:rnd(.6,1.2),wind:0,ang:rnd(TAU),aware:true,flash:0,kx:0,ky:0,ph:rnd(TAU),walk:rnd(9),atkShow:0,wander:0,wa:rnd(TAU),target:p.id||1};
  G.enemies.push(e);return e}
/* A shade that falls with lives to spare rises again at full life, throwing back anyone close */
function shadeRise(e){e.lives--;e.hp=e.maxHp;e.dodgeUntil=G.t+1.2;e.flash=.4;e.escT0=G.t;e.escHp=e.hp;shake(6);sfx('boss_roar');
  for(const q of alivePlayers())if(dist(q,e)<120){const a=Math.atan2(q.y-e.y,q.x-e.x);q.kx=(q.kx||0)+Math.cos(a)*380;q.ky=(q.ky||0)+Math.sin(a)*380}
  G.fx.push({k:'ring',x:e.x,y:e.y-20,r:10,to:120,t:.5,m:.5,c:'rgba(150,80,230,.9)'});text(e.x,e.y-90,e.lives===1?'Last life':'It rises again','#c8a8ff',true)}
function summonShades(){const ps=alivePlayers().filter(q=>!q.ai);ps.forEach((q,i)=>{const a=i/Math.max(1,ps.length)*TAU,at={x:G.gate.x+Math.cos(a)*70,y:G.gate.y-60+Math.sin(a)*40};spawnShade(q,blocked(at.x,at.y,16)?{x:G.gate.x,y:G.gate.y-40}:at)});
  G.shadeUp=true;shake(8);sfx('boss_roar');G.banner={t:3.2,a:ps.length>1?'Your shades bar the way':'Your shade bars the way',b:'Defeat it to face the boss'}}
function summonBoss(kit,at){
  const n=G.stage,k=kit||n,st=STAGES[k-1],g=G.gate,o=at||{x:g.x,y:g.y-40};
  const e={kind:'boss',kit:k,name:st.label||st.boss,art:st.boss,ah:st.ah,x:o.x,y:o.y,r:st.r,hp:bossHp(n),maxHp:bossHp(n),dmg:bossDmg(n),sp:58+n*3,xp:xpNeed(recLevel(n)),gold:40*Math.pow(1.25,n-1),cd:1,ang:0,aware:true,flash:0,kx:0,ky:0,ph:rnd(TAU),act:'rise',actT:.95,hitCd:0,atkShow:0,wind:0,walk:0,fs:1,recover:0,recoil:0,release:0,trail:[],guard:0,guardMax:BOSS_GUARD_MAX,staggerT:0,phase:0,breatherT:0,enrageT:BOSS_ENRAGE_BASE+BOSS_ENRAGE_STEP*n,tel:null};
  {const m=bossMult(n);if(m>1){e.hp=e.maxHp=e.maxHp*m;e.dmg*=1+(m-1)*.35;e.sp*=Math.min(1.6,1+.06*(m-1));e.enrageT=Math.max(60,e.enrageT/(1+.1*(m-1)));e.mult=m}}
  partyToughen(e);G.enemies.push(e);G.boss=e;G.arena=at?null:{x:G.gate.x,y:G.gate.y-40,r:430};shake(10);sfx('boom');
  if(k===3)spawnLanterns();if(k===5)spawnSporeArena();if(k===7)spawnGhoulArena();
  sfx('boss_roar');const rec=recLevel(n),lv=G.p.lvl;
  G.banner={t:3.2,a:e.name,b:k===7?(soloPlay()?'The coil charges itself. Lure the boss onto it.':'Hold F / Revive at the generator; lure it onto the coil.'):k===6?'Keep the two bodies apart.':k===5?(soloPlay()?'Clean Toxic Load at the vents.':'Share Toxic Load or carry the purifier to clean it.'):k===4?'Crack the shell: attack its green back':lv<rec?'Recommended level '+rec+'. You are level '+lv+'. Train more if you fall.':'Final boss of stage '+n};
}

/* ---------- Combat ---------- */
const dmgMul=()=>batK(G.p,'dmg')*timeDmg(G.p)*abilDmgMul(G.p)*(G.p.magicT>0?2:1)*(auraHas(G.p,'shooter')?1.08:1)*chainBonus().dmg;
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
  overload:(e,p,b)=>{e.statusT=0;e.stunT=e.kind==='boss'?0:1;reactChain(e,b*.6,160,5);return soloPlay()?1.15:1.3},
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
  purge:(e,p,b)=>{e.statusT=0;const share=soloPlay()?.05:.1;for(const q of alivePlayers()){if(dist(q,e)>200)continue;const h=q.s.maxHp*share;q.hp=Math.min(q.s.maxHp,q.hp+h);text(q.x,q.y-72,'+'+Math.round(h),'#6fdca0',true)}return 1},
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
/* Hit-stop: heavy hits freeze the action for a moment so they land with weight. Solo only; the main loop slows time while it runs. */
const HIT_STOP=.06;
function hitEnemy(e,base,ang,kb,heavy=false){if(heavy&&kb>0)G.hitStop=Math.max(G.hitStop||0,HIT_STOP);
  if(e.dead||e.buried||e.fleshDown||e.scrapDown)return;const p=G.p;if((e.dodgeUntil||0)>G.t)return;if(e.shade){e.lastHit=G.t;if(e.lives===1)base*=SHADE.lastTake}if(p&&p.char==='Chronomancer'&&e.frozenT>0&&e.tsBy===(p.id||1))base*=1+CHRONO.bonus;if(!heavy&&kb>0&&tryDodge(e,ang))return;if(!heavy&&kb>0&&p&&p.char==='Chronomancer')chronoRewind(e);if(bossWarded(e)){if(!(e.wardT>G.t)){e.wardT=G.t+1;text(e.x,e.y-110,e.ghostT>0?'UNTOUCHABLE':'NEEDS LANTERN LIGHT','#c8b8ff',true)}return}if(e.role==='lurker'&&e.grab&&(soloPlay()||(p.id||1)!==e.grab))lurkRelease(e,true);if(e.eyeT>0&&eyeBehind(e,p)&&!(e.eyeCd>G.t)){e.eyeCd=G.t+.4;bossGuard(e,BOSS_GUARD_GAIN.eye);base*=1.5;text(e.x,e.y-e.ah,'EYE HIT','#ffd860',true)}let justBroke=false;if(p.breakReady>0){p.breakReady=0;e.brokenT=5;e.brokenBy=p.id||0;justBroke=true;if(e.wind>0||e.healWind>0){e.wind=0;e.healWind=0;e.healT=3;e.castT=0;e.cd=1;expose(e)}text(e.x,e.y-80,'BROKEN','#ffd860',true)}else if(heavy&&e.healWind>0){e.healWind=0;e.healT=3;e.castT=0;e.cd=1;expose(e);text(e.x,e.y-80,'INTERRUPTED','#ffd860',true)}
  if(heavy&&!justBroke&&e.brokenT>0&&(soloPlay()||(e.brokenBy||0)!==(p.id||0))){e.brokenT=0;base*=1.5;text(e.x,e.y-98,'BREAK STRIKE','#ffe27a',true)}
  if(justBroke)bossGuard(e,BOSS_GUARD_GAIN.break);
  const el=ELEMENT[p.char],prev=e.statusType,solo=soloPlay(),rid=(el&&e.statusT>0&&prev&&G.t>=(e.reactAt||0)&&(solo||(e.statusBy||0)!==(p.id||0)))?(solo?'resonance':reactionOf(prev,el)):'';
  if(rid&&REACT_FX[rid]){sfx('react_'+rid);achievementUnlock(p,'reaction');if(!solo)achievementUnlock(p,'teamReaction');e.reactAt=G.t+REACT_CD;const mult=REACT_FX[rid](e,p,base);base*=solo?1+(mult-1)*.5:mult;text(e.x,e.y-110,REACT_NAME[rid],'#80eaff',true);G.fx.push({k:'ring',x:e.x,y:e.y,r:8,to:72,t:.4,m:.4,c:'#80eaff'});reactRage(e,p,solo?.5:1);bossGuard(e,BOSS_GUARD_GAIN.reaction*(solo?.5:1))}
  else if(el){e.statusType=el;e.statusT=4;e.statusBy=p.id||0}
  base*=elemTime(el);if(e.shatterT>0)base*=1.25;if((e.staggerT||0)>0)base*=BOSS_STAGGER_DMG;
  base*=shellBlock(e,p);base*=((e.exposedT||0)>0?1.25:1)*((e.markT||0)>0?1.25:1);const crit=Math.random()<p.s.crit+(auraHas(p,'striker')?.04:0),facing=Math.abs(Math.atan2(Math.sin(ang-e.ang-Math.PI),Math.cos(ang-e.ang-Math.PI))),block=(e.guarding&&facing<1.05)?.45:1,d=base*(crit?2:1)*rnd(.9,1.1)*block;
  e.hp-=d;e.flash=.11;e.aware=true;if(p&&p.char==='Void Empress'&&(WEAPONS[p.weapon]||{}).m==='spell')e.slowT=Math.max(e.slowT||0,1.5);if(e.hp>0)enemySfx(e,'hurt');threatAdd(e,p.id||0,100*d/Math.max(1,e.maxHp));bossPhaseCheck(e);if(e.kind==='boss')e.recoil=.16;const res=e.kind==='boss'?.15:1;e.kx+=Math.cos(ang)*kb*res;e.ky+=Math.sin(ang)*kb*res;
  G.fx.push({k:'spark',x:e.x,y:e.y-24,a:ang,t:crit?.26:.18,m:crit?.26:.18,crit:crit?1:0,c:heavy||crit?'255,220,120':'255,250,235'});
  text(e.x,e.y-(e.kind==='boss'?e.ah*.7:66),Math.round(d)+(crit?'!':''),crit?'#ffd86b':'#fff',crit);if(crit||(e.exposedT||0)>0)G.fx.push({k:'ring',x:e.x,y:e.y-20,r:6,to:e.r*1.6,t:.22,m:.22,c:crit?'#ffd86b':'#f2ecd8'});goreSpray(e,ang,d/Math.max(1,e.maxHp),crit);burst(e.x,e.y-20,'#f0805c',crit?4:1);if(crit||heavy)goreChunks(e,ang,crit?2:1);
  if(p.s.leech>0)p.hp=Math.min(p.s.maxHp,p.hp+p.s.leech);lifeSteal(p,d);if(p.char==='Pyromancer')ignite(e,p,d);sigOnHit(p,e,d,heavy);sfx('hit');if(crit)shake(2);
  if(e.hp<=0)killEnemy(e);
}
function killEnemy(e){if(e.shade&&(e.lives||1)>1){shadeRise(e);return}
  if(e.fleshSplit){fleshDownBody(e);return}
  if(e.scrapGolem&&!e.scrapFinished){scrapDisable(e);return}
  if(e.grab)lurkRelease(e,false);if(e.role==='bloater')sporeCloud(e);e.dead=true;const p=G.p,boss=e.kind==='boss';if(boss)sfx('boss_death');else enemySfx(e,'die');p.kills++;G.fx.push({k:'ring',x:e.x,y:e.y-20,r:8,to:boss?170:58,t:.3,m:.3,c:'#fff2d0'});onKill(e);if(!G.swarm)achievementCheck(p);if(e.vill||e.elite)sfx('rivalDown');burst(e.x,e.y-20,e.elite?'#e8c95c':'#c8c8d0',boss?70:12,boss?300:150);
  const ga=(e.kx||e.ky)?Math.atan2(e.ky,e.kx):rnd(TAU);goreSpray(e,ga,.6,boss);goreChunks(e,ga,boss?26:(e.mob?6:10));gorePool(e,boss?3:1);if(e.vill)G.fx.push({k:'kitdie',key:KIT_OF[e.name],x:e.x,y:e.y,mir:G.p.x>e.x,t:6,m:6});else if(boss||e.art)G.fx.push({k:'bossdie',art:e.art,ah:e.ah,x:e.x,y:e.y,fs:e.fs||1,t:boss?1.5:.8,m:boss?1.5:.8});else G.fx.push({k:'ko',name:e.name,x:e.x,y:e.y,t:.7,m:.7});
  const P=dn();
  if(!boss&&e.kind==='rival'&&!e.minion)G.killsStage++;
  /* Necromancer passive, Grave Harvest */
  if(p&&p.char==='Necromancer'&&p.s){p.hp=Math.min(p.s.maxHp,p.hp+p.s.maxHp*.03);p.mana=Math.min(p.s.maxMana,p.mana+6)}
  dropLoot(e,P.gold);shareXp(e.xp*P.xp);
  if(boss){G.flesh=null;clearBossEggs();clearSporeBoss();clearGhoul();shake(12);sfx('boom');G.boss=null;G.arena=null;clearLanterns();G.players.forEach(q=>{q.sp+=2;q.possT=0});G.enemies.forEach(o=>{if(o.minion)o.dead=true});if(!G.swarm)stageCleared()}
  dirty();
}
function dropLoot(e,night){
  const boss=e.kind==='boss',start=G.loot.length; // no equipment or weapons for now: gold, potions and pills only
  if(Math.random()<(boss?1:.7))G.loot.push({x:e.x+rnd(-16,16),y:e.y+rnd(-16,16),kind:'gold',amt:Math.round(e.gold*night*partyGold()),t:0});
  if(boss||Math.random()<(e.elite?.3:.1))G.loot.push({x:e.x+rnd(-16,16),y:e.y+rnd(-16,16),kind:'potions',t:0});
  if(Math.random()<(boss?.8:e.elite?.2:.05))G.loot.push({x:e.x+rnd(-16,16),y:e.y+rnd(-16,16),kind:'fast',t:0});
  if(Math.random()<(boss?.8:e.elite?.2:.05))G.loot.push({x:e.x+rnd(-16,16),y:e.y+rnd(-16,16),kind:'magic',t:0});
  for(let i=start;i<G.loot.length;i++){const l=G.loot[i];let k=0;while(blocked(l.x,l.y,6)&&k++<8){l.x+=(e.x-l.x)*.5;l.y+=(e.y-l.y)*.5}}
}
function gainXp(x){const p=G.p;p.xp+=x;let up=false;
  while(p.xp>=xpNeed(p.lvl)){p.xp-=xpNeed(p.lvl);p.lvl++;p.sp++;up=true}
  if(up){if(!G.swarm)achievementCheck(p);recalc();p.hp=p.s.maxHp;p.mana=p.s.maxMana;sfx('level');burst(p.x,p.y-20,'#e8c95c',28,220);text(p.x,p.y-74,'Level '+p.lvl,'#e8c95c',true);addLog('Level '+p.lvl+'. Skill point earned (press T).');writeSave();if(!p.ai)aiLevel()}}
function hurtPlayer(d){
  const p=G.p;if(G.mode!=='play'||p.respawnT>0||p.inv>0)return;if(p.deadT>0){p.deadT=Math.max(.001,p.deadT-3);p.inv=.4;return;}let ar=p.s.armor*(1-Math.min(90,(p.rust||0)+(p.fieldRust||0))/100)+(p.guard?guardArmor(p):0),red=ar/(ar+60),v=d*(1-red)*abilGuard(p)*(auraHas(p,'bruiser')?.92:1)*(p.tauntGuard>0?.7:1);{const left=tankSoak(p,v);if(left<=0){p.inv=.4;return}if(left<v){v=left}}if(p.guard)burst(p.x+Math.cos(p.face)*18,p.y-24,'#8fd0ff',7,120);p.hp-=v;p.inv=.4;beaconHit(p);p.hitT=.18;shake(5);sfx('hurt');
  text(p.x,p.y-72,'-'+Math.round(v),'#ff6a5f');burst(p.x,p.y-20,'#f0805c',8);if(!p.guard)bleed(p.x,p.y-24,rnd(-1,1),rnd(-1,1),clamp(Math.round(v/Math.max(1,p.s.maxHp)*60),3,22));
  if(p.hp<=0){p.hp=0;if(p.ai)playerDown(p);else if(soloPlay()&&!p.secondWind){p.secondWind=true;playerDown(p,true);writeSave()}else if(G.mp)playerDown(p);else if(G.swarm){p.hp=0;endSwarm()}else{p.gold=Math.floor(p.gold*.8);writeSave();setMode('dead')}}
}
/* An upgraded shield cancels ordinary enemies' current wind-up, never a boss move. */
function shieldInterrupt(e){if(!e||e.dead||e.kind==='boss'||!((e.wind||0)>0||(e.healWind||0)>0))return false;achievementUnlock(G.p,'interrupt');e.wind=0;e.healWind=0;e.healT=Math.max(e.healT||0,3);e.castT=0;e.cd=Math.max(e.cd||0,1);text(e.x,e.y-98,'INTERRUPTED','#8fd0ff',true);G.fx.push({k:'shieldFx',x:e.x,y:e.y-24,a:Math.atan2(e.y-G.p.y,e.x-G.p.x),t:.28,m:.28});burst(e.x,e.y-24,'#8fd0ff',6,100);return true}
const WEAPON_HEAL_RANGE=200,WEAPON_HEAL_SHARE=.02,WEAPON_HEAL_CD=1;
/* From tier two, a healing weapon restores one nearby ally once per second. */
function weaponHealAlly(p){if((p.weaponHealCd||0)>0)return false;const q=G.players.filter(q=>q!==p&&!(q.deadT>0||q.respawnT>0)&&q.hp<q.s.maxHp&&dist(q,p)<=WEAPON_HEAL_RANGE).sort((a,b)=>a.hp/a.s.maxHp-b.hp/b.s.maxHp)[0];if(!q)return false;const h=Math.min(q.s.maxHp-q.hp,q.s.maxHp*WEAPON_HEAL_SHARE);q.hp+=h;achievementUnlock(p,'healAlly');p.weaponHealCd=WEAPON_HEAL_CD;threatHeal(p,h);G.fx.push({k:'healLink',x:p.x,y:p.y-24,x2:q.x,y2:q.y-24,t:.32,m:.32});text(q.x,q.y-72,'+'+Math.round(h),'#6fdca0',true);burst(q.x,q.y-24,'#6fdca0',8,90);return true}
/* ---------- Charge, beam and lunge (hold the attack button) ----------
   A tap attacks at once, as before. Holding past CHARGE.delay gathers power (you move at CHARGE.slow speed).
   Let go at CHARGE.min or more: casters and shooters fire a beam that locks them in place while it burns along
   a line; melee fighters lunge through enemies. Damage is a share of the character's own basic hit, like abilities. */
const CHARGE={delay:.28,time:.9,min:.6,slow:.45};
const BEAM={dur:.5,tick:.1,len:560,w:20,mul:.9,knock:150,stop:.1,grow:.1};
const LUNGE={t:.2,speed:640,reach:46,mul:3.2,knock:420};
const STAGGER={red:.12,big:.18,dust:6};
const beamUser=p=>!!kitOf(p)||(WEAPONS[p.weapon]||{}).m==='spell';
const shotUser=p=>!kitOf(p)&&(WEAPONS[p.weapon]||{}).m==='shoot';
/* Charged shots for marksmen: each gun changes how it fires instead of firing a beam.
   n: shots · spread: fan width (radians) · mul: share of one basic hit per shot, at full charge.
   A full charge is worth about 3 to 4 basic hits on a crowd, well below an ability (10 basic hits). */
const CHARGED_SHOT={
 pistol:{name:'SHOTGUN',n:7,spread:.7,mul:.55,sp:720,life:.34,fx:'pellet',r:4,kb:220,recoil:14},
 bow:{name:'VOLLEY',n:5,spread:.5,mul:.7,sp:560,life:.9,fx:'arrow',r:5,kb:140,pierce:1},
 blaster:{name:'OVERCHARGE',n:1,spread:0,mul:3.2,sp:330,life:1.2,fx:'plasma',r:14,blast:95,big:1},
 wind:{name:'GALE BURST',n:3,spread:.36,mul:1.1,sp:600,life:.85,fx:'wind',r:12,kb:260,pierce:3,big:1},
 tommy:{name:'BULLET STORM',n:10,spread:.22,mul:.35,sp:700,life:.7,fx:'tracer',r:4,kb:90,burst:.05},
 camera:{name:'FLASH',n:1,spread:0,mul:2,sp:0,flash:{range:230,arc:.7,stun:1.6}}
};
/* Fires one charged shot pattern. A burst (tommy gun) is spread over time by burstStep. */
function chargedShot(p,k){const id=p.weapon,C=CHARGED_SHOT[id]||CHARGED_SHOT.pistol,a=p.face,dmg=weaponDamage(id)*dmgMul()*C.mul*k;
  text(p.x,p.y-92,C.name,'#ffe9a0',true);shake(C.big?4:3);sfx(C.big?'boom':'shot');
  if(C.flash){const F=C.flash;for(const e of G.enemies.slice()){if(!foeAlive(e)||dist(e,p)>F.range+e.r)continue;if(angGap(Math.atan2(e.y-p.y,e.x-p.x),a)>F.arc)continue;hitEnemy(e,dmg,Math.atan2(e.y-p.y,e.x-p.x),120,true);if(!e.dead)stunFor(e,F.stun)}G.fx.push({k:'ring',x:p.x+Math.cos(a)*30,y:p.y-24+Math.sin(a)*30,r:10,to:F.range*.6,t:.25,m:.25,c:'#ffffff'});return}
  if(C.burst){p.burst={n:C.n,t:0,a,k,id};return}
  for(let i=0;i<C.n;i++){const off=C.n>1?-C.spread/2+C.spread*i/(C.n-1):0,ang=a+off+(C.fx==='pellet'?rnd(-.04,.04):0);chargedBullet(p,C,ang,dmg)}
  muzzle(p.x+Math.cos(a)*30,p.y-24+Math.sin(a)*30,a,C.fx==='pellet'?'bullet':C.fx);
  if(C.recoil)move(p,-Math.cos(a)*C.recoil,-Math.sin(a)*C.recoil)}
/* Casters with their own charged attack instead of the beam. Toxin Alchemist: a fan of three lobbed flasks that leave pools.
   The Voidwalker and Void Empress open a void area (see Signature kits). The Necromancer keeps the beam (a green soul beam). */
const CASTER_CHARGE={
 'Toxin Alchemist'(p,k){const m=abilAim(p),a=Math.atan2(m.y-p.y,m.x-p.x),d=clamp(Math.hypot(m.x-p.x,m.y-p.y),120,320);text(p.x,p.y-92,'FLASK BARRAGE','#c8ff9a',true);sfx('bolt');shake(3);
   for(const off of[-.32,0,.32])lobFlask(p,{x:p.x+Math.cos(a+off)*d,y:p.y+Math.sin(a+off)*d},basicHit(p)*1.1*k,{blast:85,pool:80,t:3.4,dps:.05,sp:380},'140,240,70')}
};
function chargedBullet(p,C,ang,dmg){const fx=Math.cos(ang),fy=Math.sin(ang),sp=C.sp*(C.fx==='pellet'?rnd(.9,1.1):1);
  const s={x:p.x+fx*24,y:p.y-24+fy*24,vx:fx*sp,vy:fy*sp,r:C.r,from:'p',life:C.life,dmg,fx:C.fx,col:C.col||(C.fx==='wind'?'150,225,255':C.fx==='plasma'?'111,220,255':'255,220,140'),a:ang,kb:C.kb,stag:1};
  if(C.blast){s.blast=C.blast;s.heavy=true}else s.small=true;
  if(C.pierce){s.pierce=C.pierce;s.piercing=true}if(C.big)s.big=1;G.shots.push(s)}
function burstStep(p,dt){const b=p.burst;b.t-=dt;if(b.t>0)return;const C=CHARGED_SHOT[b.id]||CHARGED_SHOT.tommy;b.t=C.burst;b.n--;
  const ang=b.a+rnd(-C.spread/2,C.spread/2);chargedBullet(p,C,ang,weaponDamage(b.id)*dmgMul()*C.mul*b.k);muzzle(p.x+Math.cos(b.a)*30,p.y-24+Math.sin(b.a)*30,b.a,'tracer');sfx('shot');if(b.n<=0)p.burst=null}
const chargePower=c=>.7+.3*clamp((c-CHARGE.min)/(1-CHARGE.min),0,1);
const LUNGE_HIT=new WeakMap();
const TOXIC_AURA={r:95,mul:.25};
/* How far a beam reaches from here before a wall stops it */
function beamReach(p,a){for(let d=24;d<=BEAM.len;d+=8)if(wall((p.x+Math.cos(a)*d)/T|0,(p.y+Math.sin(a)*d)/T|0))return d-8;return BEAM.len}
/* A heavy hit: a red flash, a shove, and a puff of dust. The first hit of a beam also freezes the moment. */
function stagger(e,a,power,first){if(!e||e.dead)return;e.redT=first?STAGGER.big:STAGGER.red;e.kx=(e.kx||0)+Math.cos(a)*power*(e.kind==='boss'?.15:1);e.ky=(e.ky||0)+Math.sin(a)*power*(e.kind==='boss'?.15:1);burst(e.x,e.y-4,'#d8c8a0',STAGGER.dust,90)}
function chargeStep(p,held,dt){
  if(riding(p)){p.boost=held?1:0;p.holdT=0;p.chg=0;p.chgTier=0;return}p.boost=0;
  if(p.beam||p.lungeT>0||p.burst){if(!held){p.holdT=0;p.chg=0}return}
  if(p.carry||p.stunT>0||p.guard||p.dashT>0||p.ult){p.holdT=held?.001:0;p.chg=0;return}
  if(held){if(!p.holdT)doAttack();p.holdT=(p.holdT||0)+dt;p.chg=p.holdT>CHARGE.delay?Math.min(1,(p.holdT-CHARGE.delay)/CHARGE.time):0;p.chgTier=chargeTier(p);return}
  const c=p.chg||0,tier=chargeTier(p);p.holdT=0;p.chg=0;p.chgTier=0;if(c>=CHARGE.min)releaseCharge(p,c,tier)}
/* ---------- Unique quick attack: how long you hold the attack sets the charge colour ----------
   Blue (a full charge, about 1.2 s): the usual charged attack. Green (3 s): twice as strong. Red (6 s): four times.
   The Chronomancer's charged attack is a time-stop fan instead, and the colour sets how long time stops. */
const CHARGE_TIER={green:3,red:6,mul:[1,1,2,4],name:['','Blue','Green','Red']};
const chargeTier=p=>!(p.chg>=1)?0:(p.holdT||0)>=CHARGE_TIER.red?3:(p.holdT||0)>=CHARGE_TIER.green?2:1;
/* ---------- Chronomancer ----------
   Basic shots rewind the enemy two steps (back where it was a moment ago). The charged attack is a fan of stopped
   time near you: enemies hit freeze for 2, 4 or 6 seconds (blue, green, red) and take +50% from you while frozen.
   Time Field (ability) freezes everything in a wide area around you for 10 seconds, and for that time you and your
   party deal 50% more damage and move and attack twice as fast. Against bosses, freezes and the buff are halved. */
const CHRONO={step:.1,keep:8,back:5,bossBack:2,fanR:190,fanArc:1.05,stop:[0,2,4,6],bonus:.5,field:{r:320,stop:10,buff:10,dmg:.5,haste:1}};
function timeStop(e,sec,by){const s=e.kind==='boss'?sec/2:sec;e.frozenT=Math.max(e.frozenT||0,s);e.tsBy=by;e.wind=0;e.castT=0}
function chronoTrack(e,dt){e.histT=(e.histT||0)+dt;if(e.histT<CHRONO.step)return;e.histT=0;(e.hist||(e.hist=[])).push({x:e.x,y:e.y});if(e.hist.length>CHRONO.keep)e.hist.shift()}
function chronoRewind(e){const h=e.hist;if(!h||!h.length)return;const back=e.kind==='boss'?CHRONO.bossBack:CHRONO.back,t=h[Math.max(0,h.length-1-back)];if(!t||blocked(t.x,t.y,(e.r||14)*.6))return;
  G.fx.push({k:'rewind',x0:e.x,y0:e.y,x1:t.x,y1:t.y,t:.45,m:.45});e.x=t.x;e.y=t.y;h.length=Math.max(0,h.length-1-back)}
function timeFan(p,tier,k){const a=p.face,dmg=basicHit(p)*k*.6;let hit=0;
  for(const e of G.enemies.slice()){if(!foeAlive(e))continue;const d=dist(e,p),da=Math.abs(((Math.atan2(e.y-p.y,e.x-p.x)-a+Math.PI*3)%TAU)-Math.PI);if(d>CHRONO.fanR+(e.r||14)||da>CHRONO.fanArc)continue;
    hitEnemy(e,dmg,a,0,true);if(!e.dead){timeStop(e,CHRONO.stop[tier],p.id||1);hit++}}
  G.fx.push({k:'timefan',x:p.x,y:p.y,a,r:CHRONO.fanR,arc:CHRONO.fanArc,tier,t:.5,m:.5});sfx('boom');if(hit)text(p.x,p.y-80,'Time stop '+CHRONO.stop[tier]+'s','#9ff0ff',true)}
const timeDmg=p=>p&&p.timeBuffT>0?1+CHRONO.field.dmg*(p.timeBuffK||1):1,timeHaste=p=>p&&p.timeBuffT>0?1+CHRONO.field.haste*(p.timeBuffK||1):1;
/* ---------- Signature kits: Firefighter, Voidwalker, Shadow Monarch, Void Empress ----------
   "+1" on a basic attack, an ability or a speed is +50%. The quick attack colours (blue, green, red) multiply the charged attack.
   Life steal: each +1 returns 10% of the damage dealt as life.
   Firefighter: the axe hits +2. Fire Truck (ability): ride a fire truck for 8 s, +6 speed; ramming hits +4, holding attack boosts (+6).
   Voidwalker and Void Empress: basic shots open a small void that pushes enemies back. The charged attack opens a void
   area at your aim; red also scares (stuns) for 1 s (Empress 2 s). Void Field (ability) traps every enemy in a wide area
   for 3 s (Empress 5 s) while small voids strike them from all sides, one strike per player level (3 to 12).
   Shadow Monarch: sword hits steal life. Vampire Form (ability): 10 s of flight with +5 attack, attack speed, life steal and speed. */
const SIG={
 Firefighter:{hit:2,tier:[1,4,6,10],truck:{speed:6,ram:4,boost:6,boostSpeed:1.3,r:44,gap:.45}},
 Voidwalker:{hit:1,push:55,tier:[1,1,2,3],scare:[0,0,0,1],area:105,field:{hold:3,hit:1}},
 'Shadow Monarch':{steal:1,tier:[1,1,2,5],stealT:[1,1,2,4],bat:{dmg:5,haste:5,steal:5,speed:5}},
 'Void Empress':{hit:2,push:80,tier:[1,2,4,5],scare:[0,0,0,2],area:125,field:{hold:5,hit:3}},
 Pyromancer:{hit:1,tier:[1,2,3,5],blaze:{t:3,tick:.5,k:.1},wave:{r:210,arc:.6,mul:2.2},wall:{n:3,r:58,t:3,dps:.3},pillar:{range:360,r:105,mul:2.6,stun:.8},
   meteor:{base:6,max:12,gap:.3,fall:.55,blast:85,k:.15,ground:{r:60,t:2.5,dps:.04}}},
 Guardian:{hit:1,tier:[1,1.5,2.5,4],taunt:1.5},
 'Soul Forger':{hit:1,tier:[1,2,3,5],splash:{r:70,k:.35}}
};
/* ---------- Tanks: the Guardian (hero) and the Soul Forger (villain) ----------
   Guardian: shield bashes hit +1 and taunt what they hit (1.5 s). Quick attack: blue Shield Slam (a close cone that
   stuns), green Bulwark Wave (a long cone that throws enemies back), red Judgement (a holy ring that stuns and taunts).
   Soul Forger: hammer hits +1 and splash molten sparks on enemies next to the target. Quick attack: blue Anvil Slam
   (a ring around you), green Molten Fissure (a burning line ahead), red Anvil Fall (an anvil crushes your aim).
   Ability (both): for 6 s every enemy near the tank turns on it, and damage to allies near the tank (and to the tank)
   is soaked by a shield of 50% of the tank's life, plus 25% per extra party member, so it scales with level and party
   size. It breaks when used up. The Guardian's finisher releases the soaked damage as a holy blast; the Soul Forger's
   aura burns nearby enemies harder the more it soaks, and its finisher heals allies from what it soaked. */
const TANK={r:230,taunt:320,base:.5,per:.25,refresh:.5};
const tankUp=q=>!!q&&(abilBuff(q,'aegis')||abilBuff(q,'anvil'))&&q.tankPool>0&&!(q.deadT>0||q.respawnT>0);
function tankSoak(p,v){const t=G.players.find(q=>tankUp(q)&&(q===p||dist(q,p)<TANK.r));if(!t||!(v>0))return v;const take=Math.min(v,t.tankPool);
  t.tankPool=+(t.tankPool-take).toFixed(1);t.tankAbs=(t.tankAbs||0)+take;t.tankBurst=(t.tankBurst||0)+take;G.fx.push({k:'soak',x0:p.x,y0:p.y,x1:t.x,y1:t.y,f:abilBuff(t,'aegis')?1:2,t:.35,m:.35});
  text(p.x,p.y-72,'Shielded '+Math.round(take),abilBuff(t,'aegis')?'#ffe08a':'#ffb070');if(t.tankPool<=0){text(t.x,t.y-100,'Shield broken','#ff8f80',true);abilityEnd(t)}return v-take}
function tankTaunt(p,r,sec){for(const e of G.enemies)if(foeAlive(e)&&dist(e,p)<r){e.tauntT=Math.max(e.tauntT||0,sec);e.tauntId=p.id||0;e.aware=true}}
function tankArm(p,ab){const pool=p.s.maxHp*(TANK.base+TANK.per*(partySize()-1));p.tankPool=p.tankMax=+pool.toFixed(1);p.tankAbs=0;p.tankBurst=0;p.tankTk=0;tankTaunt(p,TANK.taunt,ab.dur);
  text(p.x,p.y-96,ab.fx==='aegis'?'AEGIS':'SOUL ANVIL',ab.fx==='aegis'?'#ffe08a':'#ffb070',true);G.fx.push({k:'tankup',x:p.x,y:p.y,r:TANK.r,f:ab.fx==='aegis'?1:2,t:.6,m:.6});shake(4);sfx('boom')}
function tankStep(p,dt){if(!(abilBuff(p,'aegis')||abilBuff(p,'anvil'))){if(p.tankPool)p.tankPool=0;return}p.tankTk=(p.tankTk||0)-dt;if(p.tankTk>0)return;p.tankTk=TANK.refresh;tankTaunt(p,TANK.taunt,1);
  if(abilBuff(p,'anvil')){const k=(p.tankBurst||0)*.6;p.tankBurst=0;for(const e of G.enemies.slice())if(foeAlive(e)&&dist(e,p)<150)hitEnemy(e,basicHit(p)*.25+k/2,Math.atan2(e.y-p.y,e.x-p.x),0,true)}}
let FORGE_SPLASH=false;
function sigOnHit(p,e,d,heavy){if(p.char==='Guardian'&&foeAlive(e)){e.tauntT=Math.max(e.tauntT||0,SIG.Guardian.taunt);e.tauntId=p.id||0}
  if(p.char==='Soul Forger'&&!heavy&&!FORGE_SPLASH){const S=SIG['Soul Forger'].splash;FORGE_SPLASH=true;try{for(const o of G.enemies.slice())if(o!==e&&foeAlive(o)&&dist(o,e)<S.r+(o.r||14))hitEnemy(o,d*S.k,Math.atan2(o.y-e.y,o.x-e.x),60,true)}finally{FORGE_SPLASH=false}G.fx.push({k:'sparks',x:e.x,y:e.y,t:.35,m:.35})}}
const inCone=(p,e,r,arc)=>dist(e,p)<=r+(e.r||14)&&angGap(Math.atan2(e.y-p.y,e.x-p.x),p.face)<=arc;
function guardCharge(p,tier,k){const t=Math.max(1,tier||1),b=basicHit(p);
  if(t===1){for(const e of G.enemies.slice())if(foeAlive(e)&&inCone(p,e,130,1)){hitEnemy(e,b*2.4*k,p.face,260,true);if(!e.dead)stunFor(e,.6)}tankTaunt(p,160,3);G.fx.push({k:'shieldslam',x:p.x,y:p.y,a:p.face,r:130,arc:1,t:.4,m:.4});text(p.x,p.y-92,'SHIELD SLAM','#ffe08a',true)}
  else if(t===2){for(const e of G.enemies.slice())if(foeAlive(e)&&inCone(p,e,230,.75)){hitEnemy(e,b*2.4*k,p.face,320,true);if(!e.dead)stunFor(e,.4)}tankTaunt(p,260,4);G.fx.push({k:'shieldslam',x:p.x,y:p.y,a:p.face,r:230,arc:.75,wave:1,t:.55,m:.55});text(p.x,p.y-92,'BULWARK WAVE','#ffe08a',true)}
  else{for(const e of G.enemies.slice())if(foeAlive(e)&&dist(e,p)<190+(e.r||14)){hitEnemy(e,b*2.6*k,Math.atan2(e.y-p.y,e.x-p.x),200,true);if(!e.dead)stunFor(e,1.2)}tankTaunt(p,300,5);p.inv=Math.max(p.inv||0,.5);G.fx.push({k:'judgement',x:p.x,y:p.y,r:190,t:.9,m:.9});text(p.x,p.y-92,'JUDGEMENT','#fff2b0',true)}
  p.castT=.3;sfx('boom');shake(2+t*1.5)}
function forgeCharge(p,tier,k){const t=Math.max(1,tier||1),b=basicHit(p);
  if(t===1){for(const e of G.enemies.slice())if(foeAlive(e)&&dist(e,p)<120+(e.r||14)){hitEnemy(e,b*2.4*k,Math.atan2(e.y-p.y,e.x-p.x),180,true);if(!e.dead)stunFor(e,.4)}G.fx.push({k:'anvilslam',x:p.x,y:p.y,r:120,t:.45,m:.45});text(p.x,p.y-92,'ANVIL SLAM','#ffb070',true)}
  else if(t===2){const a=p.face;for(const e of onLine(p.x,p.y,a,260,40))hitEnemy(e,b*2.4*k,a,120,true);for(let i=1;i<=3;i++)fireGround(p,p.x+Math.cos(a)*i*80,p.y+Math.sin(a)*i*80,50,3,b*.3*k);G.fx.push({k:'fissure',x:p.x,y:p.y,a,len:260,t:.6,m:.6});text(p.x,p.y-92,'MOLTEN FISSURE','#ff9a4a',true)}
  else{const to=clampRange(p,abilAim(p),340);for(const e of G.enemies.slice())if(foeAlive(e)&&Math.hypot(e.x-to.x,e.y-to.y)<130+(e.r||14)){hitEnemy(e,b*2.8*k,Math.atan2(e.y-to.y,e.x-to.x),160,true);if(!e.dead)stunFor(e,1.5)}fireGround(p,to.x,to.y,100,3,b*.3*k);G.fx.push({k:'anvilfall',x:to.x,y:to.y,r:130,t:.8,m:.8});text(p.x,p.y-92,'ANVIL FALL','#ff7a3a',true)}
  p.castT=.3;sfx('boom');shake(2+t*1.5)}

/* Pyromancer: every hit sets the enemy ablaze for 3 s (a tenth of the hit every half second, refreshed by new hits).
   Quick attack: blue Flame Wave (a cone of fire), green Fire Wall (the wave leaves three patches of burning ground),
   red Flame Pillar (erupts at your aim, stuns and leaves burning ground). Meteor Storm (ability) rains 6 meteors, plus
   one per two player levels (up to 12), on the aimed area (the first on the spot itself); each falls after a warning shadow, blasts and burns the ground. */
let BLAZE_TICK=false;
function ignite(e,p,d){if(BLAZE_TICK||!foeAlive(e))return;const B=SIG.Pyromancer.blaze;if(!(e.blazeT>0))e.blazeD=0;e.blazeT=B.t;e.blazeBy=p.id||1;e.blazeD=+Math.max(e.blazeD||0,d*B.k).toFixed(2)}
function blazeStep(p,dt){const B=SIG.Pyromancer.blaze,id=p.id||1;
  for(const e of G.enemies.slice()){if(!(e.blazeT>0)||e.blazeBy!==id)continue;if(!foeAlive(e)){e.blazeT=0;continue}e.blazeT-=dt;e.blazeTk=(e.blazeTk||0)-dt;
    if(e.blazeTk<=0){e.blazeTk=B.tick;BLAZE_TICK=true;try{hitEnemy(e,e.blazeD,0,0,true)}finally{BLAZE_TICK=false}}}}
const fireGround=(p,x,y,r,t,dps)=>G.hazards.push({x:+x.toFixed(1),y:+y.toFixed(1),r,t,dps:+dps.toFixed(2),from:'p',pid:p.id,col:'255,120,40',fire:1});
function flameWave(p,k,wall){const W=SIG.Pyromancer.wave,a=p.face,dmg=basicHit(p)*W.mul*k;
  for(const e of G.enemies.slice()){if(!foeAlive(e))continue;const d=dist(e,p);if(d>W.r+(e.r||14)||angGap(Math.atan2(e.y-p.y,e.x-p.x),a)>W.arc)continue;hitEnemy(e,dmg,a,140,true)}
  if(wall){const L=SIG.Pyromancer.wall;for(let i=1;i<=L.n;i++){const r=W.r*i/(L.n+.4);fireGround(p,p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,L.r,L.t,basicHit(p)*L.dps*k)}}
  G.fx.push({k:'flamewave',x:p.x,y:p.y,a,r:W.r,arc:W.arc,wall:wall?1:0,t:.5,m:.5});p.castT=.3;text(p.x,p.y-92,wall?'FIRE WALL':'FLAME WAVE','#ffb070',true);sfx('boom');shake(wall?4:3)}
function flamePillar(p,k){const P=SIG.Pyromancer.pillar,to=clampRange(p,abilAim(p),P.range),dmg=basicHit(p)*P.mul*k;
  for(const e of G.enemies.slice()){if(!foeAlive(e)||Math.hypot(e.x-to.x,e.y-to.y)>P.r+(e.r||14))continue;hitEnemy(e,dmg,Math.atan2(e.y-to.y,e.x-to.x),60,true);if(!e.dead)stunFor(e,P.stun)}
  fireGround(p,to.x,to.y,P.r*.8,3,basicHit(p)*.3*k);G.fx.push({k:'flamepillar',x:to.x,y:to.y,r:P.r,t:1.2,m:1.2});p.castT=.45;text(p.x,p.y-92,'FLAME PILLAR','#ff7a4a',true);sfx('boom');shake(6)}
function pyroCharge(p,tier,k){const t=Math.max(1,tier||1);if(t>=3)flamePillar(p,k);else flameWave(p,k,t===2)}
function meteorStep(p,dt){const M=p.meteor,C=SIG.Pyromancer.meteor;M.tick-=dt;
  if(M.left>0&&M.tick<=0){M.tick=C.gap;const first=!M.falls.length&&M.left===M.n;M.left--;const a=Math.random()*TAU,r=first?0:Math.sqrt(Math.random())*M.r,x=M.x+Math.cos(a)*r,y=M.y+Math.sin(a)*r*.8;M.falls.push({x:+x.toFixed(1),y:+y.toFixed(1),t:C.fall});G.fx.push({k:'meteor',x,y,r:C.blast,t:C.fall,m:C.fall})}
  for(const f of M.falls){f.t-=dt;if(f.t>0)continue;blast(f.x,f.y,C.blast,M.d,140,0);fireGround(p,f.x,f.y,C.ground.r,C.ground.t,M.d*C.ground.dps*10);G.fx.push({k:'meteorhit',x:f.x,y:f.y,r:C.blast,t:.45,m:.45});shake(3);sfx('boom')}
  M.falls=M.falls.filter(f=>f.t>0);if(M.left<=0&&!M.falls.length)p.meteor=null}

const plus=n=>1+.5*(n||0),STEAL_STEP=.1,VOID_HITS=[3,12];
const sigOf=p=>p&&SIG[p.char]||null,ownWeapon=(p,id)=>id===weaponOf(p.char);
const tierMul=(p,t)=>((sigOf(p)||{}).tier||CHARGE_TIER.mul)[t||0];
/* the basic attack bonus applies to the character's own weapon */
const sigHit=(p,id)=>{const S=sigOf(p);return S&&S.hit&&ownWeapon(p,id)?plus(S.hit):1};
const riding=p=>abilBuff(p,'truck'),batForm=p=>abilBuff(p,'bat'),keepsAttack=p=>riding(p)||batForm(p)||abilBuff(p,'aegis')||abilBuff(p,'anvil');
const batK=(p,k)=>batForm(p)?plus(SIG['Shadow Monarch'].bat[k]):1;
const sigSpeed=p=>(riding(p)?plus(SIG.Firefighter.truck.speed)*(p.boost?SIG.Firefighter.truck.boostSpeed:1):1)*batK(p,'speed');
function stealOf(p){const S=sigOf(p);if(!S||!S.steal)return 0;if(batForm(p))return STEAL_STEP*S.bat.steal;return STEAL_STEP*(p.lungeT>0?S.stealT[p.lungeTier||1]:S.steal)}
function lifeSteal(p,d){const f=stealOf(p);if(!(f>0)||!(d>0)||p.deadT>0)return;const h=Math.min(p.s.maxHp-p.hp,d*f);if(h<=0)return;p.hp+=h;p.stealN=(p.stealN||0)+h;
  if(!(p.stealAt>G.t)){p.stealAt=G.t+.5;text(p.x,p.y-84,'+'+Math.round(p.stealN),'#ff6b7a');p.stealN=0}}
function scare(e,sec){stunFor(e,sec);e.scaredT=Math.max(e.scaredT||0,e.kind==='boss'?sec*.3:sec);text(e.x,e.y-(e.ah||70)-14,'Scared','#d8b8ff',true)}
/* the void quick attack: an area at your aim */
function voidArea(p,tier,k){const S=sigOf(p),t=Math.max(1,tier||1),to=clampRange(p,abilAim(p),340),R=S.area*(1+.15*(t-1)),dmg=basicHit(p)*2.4*k;let n=0;
  for(const e of G.enemies.slice()){if(!foeAlive(e)||Math.hypot(e.x-to.x,e.y-to.y)>R+(e.r||14))continue;hitEnemy(e,dmg,Math.atan2(e.y-to.y,e.x-to.x),120,true);n++;if(!e.dead&&S.scare[t])scare(e,S.scare[t])}
  G.fx.push({k:'voidarea',x:to.x,y:to.y,r:R,tier:t,t:.7,m:.7});text(p.x,p.y-92,'VOID AREA','#d8b8ff',true);sfx('boom');shake(2+t)}
/* basic void shots push what they burst on */
function voidPush(s,R){for(const e of G.enemies){if(!foeAlive(e)||Math.hypot(e.x-s.x,e.y-22-s.y)>R+e.r)continue;shove(e,Math.atan2(e.y-s.y+22,e.x-s.x),s.vpush)}G.fx.push({k:'voidpop',x:s.x,y:s.y+22,r:R,t:.35,m:.35})}
/* Fire Truck: ram everything the truck touches (each enemy at most every 0.45 s) */
const RAMMED=new WeakMap();
function truckStep(p,dt){const S=SIG.Firefighter.truck,seen=RAMMED.get(p)||new Map();RAMMED.set(p,seen);if(!p.moving)return;
  const a=p.moveA!==undefined?p.moveA:p.face,fx=p.x+Math.cos(a)*16,fy=p.y+Math.sin(a)*10;
  for(const e of G.enemies.slice()){if(!foeAlive(e)||Math.hypot(e.x-fx,e.y-fy)>S.r+(e.r||14))continue;if((seen.get(e)||0)>G.t)continue;seen.set(e,G.t+S.gap);
    hitEnemy(e,basicHit(p)*plus(p.boost?S.boost:S.ram),a,0,true);if(!e.dead&&e.kind!=='boss'){shove(e,a+(Math.random()<.5?-.6:.6),70);stunFor(e,.3)}
    G.fx.push({k:'ram',x:e.x,y:e.y,a,boost:p.boost?1:0,t:.3,m:.3});shake(p.boost?3:2)}}
/* ---------- AI teammates (single player) ----------
   After choosing single play you can bring 1 to 3 AI teammates, picked at random from your side. They play one level
   below you with 15% less damage and life, 10% less speed and slower attacks, and they count as party members, so
   enemies scale up as for a real party. Puzzles that need real teammates (split plates, lanterns, coils, toxic load)
   keep their solo rules, and loot and saves stay yours. They follow you, fight what threatens you, use their charged
   attack and ability now and then, drink a potion when low, and catch up if they fall far behind. */
const AI_MATE={max:3,lvlGap:1,k:.85,spd:.9,cd:1.15,follow:110,engage:430,leash:950,keep:{shoot:230,spell:220},think:.15};
const humans=()=>G.players.filter(q=>!q.ai),soloPlay=()=>humans().length<=1,humanSize=()=>Math.max(1,Math.min(4,humans().length));
const leadOf=()=>G.players.find(q=>!q.ai)||G.players[0];
function addCompanions(n){n=clamp(n|0,0,AI_MATE.max);G.players=G.players.filter(q=>!q.ai);if(n&&!G.mp){const lead=leadOf(),pool=Object.keys(ROSTER[factionOf(lead.char)]).filter(c=>c!==lead.char);
  for(let i=0;i<n&&pool.length;i++){const ch=pool.splice(Math.floor(Math.random()*pool.length),1)[0],q=freshPlayer(ch);q.id=101+i;q.ai=1;q.input={s:0,x:0,y:0,ax:0,ay:0,l:false,r:false,sp:false};q.actions=[];q.pname=label(ch)+' (AI)';q.stats=STATS[ch];achievementInit(q,false);G.players.push(q)}
  aiSync()}rescaleParty()}
function aiSync(){const lead=leadOf(),was=G.p;G.players.forEach((q,i)=>{if(!q.ai)return;q.lvl=Math.max(1,(lead.lvl||1)-AI_MATE.lvlGap);G.p=q;recalc();q.hp=q.s.maxHp;q.mana=q.s.maxMana;q.deadT=q.respawnT=0;
  const o=freeSpot(lead.x-36*i,lead.y+34,q.r||13);q.x=o.x;q.y=o.y;q.aiIn=null});G.p=was}
/* AI teammates stay one level below you as you level up, keeping their share of life */
function aiLevel(){const lead=leadOf(),was=G.p;for(const q of G.players){if(!q.ai)continue;const k=q.s?q.hp/q.s.maxHp:1;q.lvl=Math.max(1,(lead.lvl||1)-AI_MATE.lvlGap);G.p=q;recalc();q.hp=q.s.maxHp*k}G.p=was}
function aiThink(p,dt){const i=p.aiIn||(p.aiIn={x:0,y:0,ax:p.x,ay:p.y-22,l:false,t:0}),lead=leadOf();i.t-=dt;
  if(p.deadT>0||p.respawnT>0||!lead){i.x=i.y=0;i.l=false;return}
  if(!(lead.deadT>0)&&dist(p,lead)>AI_MATE.leash){const o=freeSpot(lead.x-30,lead.y+30,p.r||13);p.x=o.x;p.y=o.y}
  /* stuck behind something while far away: after 2 s without progress, rejoin */
  {const far=dist(p,lead)>250&&!(lead.deadT>0);if(!far){p.aiStuck=0;p.aiMark=null}else{if(!p.aiMark){p.aiMark={x:p.x,y:p.y};p.aiStuck=0}p.aiStuck+=dt;if(p.aiStuck>2){if(Math.hypot(p.x-p.aiMark.x,p.y-p.aiMark.y)<40){const o=freeSpot(lead.x-30,lead.y+30,p.r||13);p.x=o.x;p.y=o.y}p.aiMark=null}}}
  if(i.t>0)return;i.t=AI_MATE.think;
  let foe=null,bd=AI_MATE.engage;for(const e of G.enemies){if(!foeAlive(e)||e.buried||concealed(e,p))continue;const d=dist(e,p);if(d<bd&&dist(e,lead)<AI_MATE.engage+250){bd=d;foe=e}}
  const W=WEAPONS[p.weapon]||{},ranged=W.m==='shoot'||W.m==='spell',want=ranged?AI_MATE.keep[W.m]:(W.reach||50)*.7;let tx,ty;
  if(foe){const d=dist(foe,p),a=Math.atan2(foe.y-p.y,foe.x-p.x),side=p.id%2?1:-1;i.ax=foe.x;i.ay=foe.y-22;
    if(d>want+30){tx=foe.x;ty=foe.y}else if(ranged&&d<want-60){tx=p.x-Math.cos(a)*80;ty=p.y-Math.sin(a)*80}else{tx=p.x+Math.cos(a+side*Math.PI/2)*40;ty=p.y+Math.sin(a+side*Math.PI/2)*40}
    const reach=d<=(ranged?want+120:(W.reach||50)+(foe.r||14)+6);
    if(p.abil&&!keepsAttack(p))i.l=!i.l;
    else if(reach){if(p.aiHold>0){p.aiHold-=AI_MATE.think;i.l=true}else if(Math.random()<.08){p.aiHold=1.3;i.l=true}else i.l=!i.l}else{i.l=false;p.aiHold=0}
    if(!(p.abilT>0)&&!p.abil&&!p.abilCast&&d<300&&Math.random()<.2)p.aiDo='ability';
    else if(p.hp<p.s.maxHp*.35&&p.potions>0&&Math.random()<.3)p.aiDo='potion'}
  else{i.l=false;p.aiHold=0;const a=G.players.indexOf(p)*2.1+.8;tx=lead.x+Math.cos(a)*AI_MATE.follow;ty=lead.y+Math.sin(a)*AI_MATE.follow*.6;i.ax=tx+Math.cos(a)*50;i.ay=ty-22}
  const dx=tx-p.x,dy=ty-p.y,L=Math.hypot(dx,dy);if(L>14){i.x=dx/L;i.y=dy/L;if(blocked(p.x+i.x*22,p.y+i.y*22,p.r||13)){const a=Math.atan2(i.y,i.x)+(p.id%2?1:-1)*Math.PI/2;i.x=Math.cos(a);i.y=Math.sin(a)}}else i.x=i.y=0}
/* An AI's turn runs the normal player rules with its own stick and mouse, then puts yours back */
function aiTurn(p,dt){G.p=p;aiThink(p,dt);const i=p.aiIn,s={jo:joy.on,jx:joy.dx,jy:joy.dy,mx:mouse.x,my:mouse.y,ml:mouse.left,mr:mouse.right,sp:sprintKey,ts:touchHold.slash,tg:touchHold.guard,tm:touchMode,ta:touchAim};
  if(p.input)Object.assign(p.input,{x:i.x,y:i.y,ax:i.ax,ay:i.ay,l:!!i.l,r:false,sp:false});
  joy.on=true;joy.dx=i.x;joy.dy=i.y;mouse.x=i.ax;mouse.y=i.ay;mouse.left=!!i.l;mouse.right=false;sprintKey=false;touchHold.slash=false;touchHold.guard=false;touchMode=false;touchAim=null;
  try{const a=p.aiDo;p.aiDo=null;if(a==='ability')doAbility();else if(a==='potion')usePotion();updatePlayer(p,dt)}
  finally{joy.on=s.jo;joy.dx=s.jx;joy.dy=s.jy;mouse.x=s.mx;mouse.y=s.my;mouse.left=s.ml;mouse.right=s.mr;sprintKey=s.sp;touchHold.slash=s.ts;touchHold.guard=s.tg;touchMode=s.tm;touchAim=s.ta}}
{const base=enterStage;enterStage=function(...a){const r=base.apply(this,a);if(G.players&&G.players.some(q=>q.ai))aiSync();return r}}
/* Fire Truck passenger: one other player near a riding Firefighter can hop in (H). They sit behind the driver, move with
   the truck and can still attack. The seat frees when they hop out, the ride ends, or either of them goes down. */
const SEAT={reach:95,pick:170,back:22};
const truckA=f=>f.moving&&f.moveA!==undefined?f.moveA:f.face;
const seatFree=f=>riding(f)&&!(f.deadT>0||f.respawnT>0)&&!G.players.some(q=>q.rideWith===(f.id||1));
function truckNear(p){let best=null,bd=SEAT.reach;for(const f of G.players){if(f===p||!seatFree(f))continue;const d=dist(f,p);if(d<bd){bd=d;best=f}}return best}
const canHopIn=p=>!!p&&!p.rideWith&&!riding(p)&&!(p.deadT>0||p.respawnT>0)&&!!truckNear(p);
function hopOut(p){if(!p.rideWith)return;p.rideWith=0;const to=freeSpot(p.x,p.y+26,p.r||14);p.x=to.x;p.y=to.y;p.inv=Math.max(p.inv||0,.6)}
/* The driver presses H once: the nearest player in reach (a teammate or an AI teammate) hops in; H again drops them off */
const seatedWith=f=>G.players.find(q=>q.rideWith===(f.id||1));
function pickUpTarget(f){if(!riding(f)||f.deadT>0)return null;let best=null,bd=SEAT.pick;for(const q of G.players){if(q===f||q.rideWith||riding(q)||q.deadT>0||q.respawnT>0)continue;const d=dist(q,f);if(d<bd){bd=d;best=q}}return best}
function doRide(){const p=G.p;if(!p)return;
  if(riding(p)){const s=seatedWith(p);if(s){hopOut(s);return}const q=pickUpTarget(p);if(!q)return;if(q.carry){q.carry.by=0;q.carry=null}q.rideWith=p.id||1;text(q.x,q.y-80,'Hop in','#ffb070',true);sfx('lock');return}
  if(p.rideWith){hopOut(p);return}if(!canHopIn(p))return;const f=truckNear(p);if(p.carry){p.carry.by=0;p.carry=null}p.rideWith=f.id||1;text(p.x,p.y-80,'Hop in','#ffb070',true);sfx('lock')}
function seatStep(){for(const p of G.players){if(!p.rideWith)continue;const f=G.players.find(q=>(q.id||1)===p.rideWith);
  if(!f||f===p||!riding(f)||f.deadT>0||f.respawnT>0||p.deadT>0||p.respawnT>0||riding(p)){hopOut(p);continue}
  const fl=Math.cos(truckA(f))<0?-1:1;p.x=f.x-fl*SEAT.back;p.y=f.y-1;p.moving=false;p.dashT=0}}
/* Void Field: holds what it caught; small voids strike each one from all sides */
const VOID_CAUGHT=new WeakMap();
function voidStep(p,dt){const F=p.voidF;F.t-=dt;F.tick-=dt;
  if(F.tick<=0&&F.left>0){F.tick=F.gap;F.left--;const list=VOID_CAUGHT.get(p)||[];
    for(const e of list){if(!foeAlive(e))continue;const a=Math.random()*TAU;hitEnemy(e,F.d,a+Math.PI,0,true);G.fx.push({k:'voidbolt',x0:e.x+Math.cos(a)*70,y0:e.y-30+Math.sin(a)*40,x1:e.x,y1:e.y-26,t:.25,m:.25})}}
  if(F.t<=0){p.voidF=null;VOID_CAUGHT.delete(p)}}
function releaseCharge(p,c,tier=0){const k=+(chargePower(c)*tierMul(p,tier)).toFixed(2),a=p.face;p.mv=null;p.lungeTier=tier||1;
  if(sigOf(p)&&sigOf(p).area){p.cd.slash=Math.max(p.cd.slash,.35);voidArea(p,tier,k);return}
  if(p.char==='Pyromancer'){p.cd.slash=Math.max(p.cd.slash,.35);pyroCharge(p,tier,k);return}
  if(p.char==='Guardian'){p.cd.slash=Math.max(p.cd.slash,.35);guardCharge(p,tier,k);return}
  if(p.char==='Soul Forger'){p.cd.slash=Math.max(p.cd.slash,.35);forgeCharge(p,tier,k);return}
  if(p.char==='Chronomancer'){p.cd.slash=Math.max(p.cd.slash,.35);timeFan(p,Math.max(1,tier||1),chargePower(c));return}
  if(shotUser(p)){p.cd.slash=Math.max(p.cd.slash,.35);chargedShot(p,k);return}
  if(CASTER_CHARGE[p.char]){p.cd.slash=Math.max(p.cd.slash,.35);CASTER_CHARGE[p.char](p,k);return}
  if(beamUser(p)){p.beam={t:BEAM.dur,a:+a.toFixed(3),len:beamReach(p,a),k,tick:0,ext:0,hit:0,full:c>=.98?1:0,col:spellCol(p.char,'orb')};sfx('boom');shake(3)}
  else{p.lungeT=LUNGE.t;p.lungeA=a;p.lungeK=k;LUNGE_HIT.set(p,new Set());p.atkT=.25;p.atkDur=.25;p.swing=.17;p.swingA=a;p.swingR=70;p.swingArc=1.2;sfx('dash');sfx('slash')}}
function beamStep(p,dt){const b=p.beam;b.t-=dt;b.tick-=dt;b.ext=Math.min(1,b.ext+dt/BEAM.grow);
  if(b.tick<=0){b.tick=BEAM.tick;const hx=p.x+Math.cos(b.a)*18,hy=p.y+Math.sin(b.a)*18,dmg=basicHit(p)*BEAM.mul*b.k;
    for(const e of onLine(hx,hy,b.a,b.len*b.ext,BEAM.w)){const first=!b.hit;stagger(e,b.a,BEAM.knock,first);hitEnemy(e,dmg,b.a,BEAM.knock,true);if(first){b.hit=1;G.hitStop=Math.max(G.hitStop||0,BEAM.stop);if(b.full)G.flashT=.07}}}
  if(b.t<=0)p.beam=null}
function lungeStep(p,dt){p.lungeT-=dt;p.inv=Math.max(p.inv,.05);const a=p.lungeA,seen=LUNGE_HIT.get(p)||new Set();move(p,Math.cos(a)*LUNGE.speed*dt,Math.sin(a)*LUNGE.speed*dt);
  for(const e of G.enemies.slice()){if(!foeAlive(e)||seen.has(e)||dist(e,p)>LUNGE.reach+e.r)continue;seen.add(e);stagger(e,a,LUNGE.knock,seen.size===1);hitEnemy(e,basicHit(p)*LUNGE.mul*(p.lungeK||1),a,LUNGE.knock,true)}
  if(p.lungeT<=0){p.lungeT=0;LUNGE_HIT.delete(p)}}
function doAttack(){
  if(G.p.carry||G.p.stunT>0||riding(G.p))return;
  if(kitOf(G.p)){doMove('small');return}
  const p=G.p,id=p.weapon,W=WEAPONS[id];if(p.cd.slash>0||p.guard)return;
  if(W.m==='spell'&&p.mana<W.cost)return;
  p.cd.slash=W.cd*cdMulOf(p)/timeHaste(p)/batK(p,'haste');p.atkT=Math.min(.3,p.cd.slash);p.atkDur=p.atkT;const dmg=weaponDamage(id)*dmgMul()*sigHit(p,id),vp=sigOf(p)&&sigOf(p).push&&ownWeapon(p,id)?sigOf(p).push:0,up=upgradeLevel(p,id),fx=Math.cos(p.face),fy=Math.sin(p.face);
  if(up)G.fx.push({k:'ring',x:p.x+fx*12,y:p.y-24+fy*12,r:6,to:22+up*10,t:.24,m:.24,shape:up>=2?'diamond':'circle',c:up===1?'#ffd166':'#80eaff'});
  if(W.m==='shoot'){sfx('shot');const sty={bow:'arrow',blaster:'plasma',tommy:'tracer',camera:'flash',wind:'wind'}[id]||'bullet',sp=sty==='arrow'?470:sty==='plasma'?430:sty==='wind'?560:640;for(const off of GUN_UP[up].angles){const a=p.face+off;G.shots.push({x:p.x+fx*24,y:p.y-24+fy*24,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:sty==='plasma'?7:sty==='wind'?8:4,from:'p',life:.8,dmg:dmg*GUN_UP[up].damage,small:true,tier:up,pierce:up>=2&&PIERCING_WEAPONS.has(id)?1:0,piercing:up>=2&&PIERCING_WEAPONS.has(id),fx:sty,col:sty==='plasma'?'111,220,255':sty==='wind'?'150,225,255':'255,220,120',a})}muzzle(p.x+fx*30,p.y-24+fy*30,p.face,sty);return}
  if(W.m==='spell'){p.mana-=W.cost;sfx('bolt');const sty={book:'arcane',flask:'flask',candle:'ember',staff:'skull',cards:'card'}[id]||'orb';for(const off of SPELL_UP[up].angles){const a=p.face+off;G.shots.push({x:p.x+fx*20,y:p.y-24+fy*20,vx:Math.cos(a)*390,vy:Math.sin(a)*390,r:6,from:'p',life:.9,dmg:dmg*SPELL_UP[up].damage,blast:SPELL_UP[up].blast,tier:up,fx:sty,col:spellCol(p.char,sty),a,hopT:THROWN_HOP[sty]?.9:0,vpush:vp||undefined})}return}
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
function explode(s){const p=G.p,R=s.blast||p.s.blast;impact(s,R);if(s.vpush)voidPush(s,Math.max(R,46));sfx('boom');shake(s.blast?.8:2);for(const c of G.npcs){if(!c.dead&&Math.hypot(c.x-s.x,c.y-22-s.y)<R)hitNpc(c,s.dmg,Math.atan2(c.y-s.y,c.x-s.x),true)}for(const e of G.enemies.slice()){if(!e.dead&&Math.hypot(e.x-s.x,e.y-22-s.y)<R+e.r)hitEnemy(e,s.dmg,Math.atan2(e.y-s.y,e.x-s.x),210,!!s.heavy)}}
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
function impact(s,R){const c=s.col||'190,120,255';if(s.fx==='flask')burst(s.x,s.y+6,'rgb('+c+')',16,210);else if(s.fx==='skull')burst(s.x,s.y,'#e4dcc4',10,170);if(s.pool&&!s.pooled){s.pooled=1;G.hazards.push({x:s.x,y:s.y+22,r:s.pool.r,t:s.pool.t,dps:s.pool.dps,from:s.from,pid:s.pid,col:c})}G.fx.push({k:'nova',x:s.x,y:s.y,r:R||20,t:.32,m:.32,c,a:rnd(TAU)});glowP(s.x,s.y,c,R?22:8,R?260:150,.5,4);if(R)shake(.5)}
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
function hitNpc(c,d,a,byPlayer){if(c.dead||c.wounded||c.fixed)return;c.hp-=d;c.kx=(c.kx||0)+Math.cos(a)*180;c.ky=(c.ky||0)+Math.sin(a)*180;c.scare=4;c.flash=.1;sfx('hit');bleed(c.x,c.y-26,Math.cos(a),Math.sin(a),10);if(c.hp<=0)killNpc(c,a,byPlayer);else say(c,byPlayer?'hurt':'hurtEnemy')}
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
/* The old small/moderate/special move kit is only for the enemy villains now. Players play the Necromancer, Void Empress and
   Toxin Alchemist like everyone else: basic attack, hold to charge, ability and passive. */
const kitOf=a=>a.char?null:(KIT_OF[a.vill?a.name:null]||null);
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
    if(id==='small')throwKit(a,side,d,from,col,KIT_THROW.necro.small);
    if(id==='moderate'){strike(a,(x,y)=>Math.hypot(x,y*1.2)<112&&x*side>-22,d,240);shake(2)}
    if(id==='special'){strike(a,(x,y)=>x*side>16&&x*side<390&&band(y+6,44),d,70);shake(2.2);glowP(a.x+side*rnd(60,380),a.y-40,col,5,120,.35,4)}
  }else if(key==='void'){
    if(id==='small'){const ang=a.char?a.face:Math.atan2(G.p.y-a.y,G.p.x-a.x),an=Math.cos(ang)*side>=0?ang:(side>0?0:Math.PI);G.shots.push({x:a.x+side*52,y:a.y-48,vx:Math.cos(an)*360,vy:Math.sin(an)*360,r:9,from,life:1.3,dmg:d,blast:a.char?46:undefined,small:a!==G.p,tier:a.char?upgradeLevel(a,'signature'):0,fx:'orb',col,a:an})}
    if(id==='moderate'){strike(a,(x,y)=>Math.hypot(x,y*1.2)<112,d*(hitN?1:.7),160);shake(3);glowP(a.x,a.y-16,col,14,190,.45,3.5)}
    if(id==='special'){const R=70+hitN*48;strike(a,(x,y)=>Math.hypot(x,y)<R,d,80);shake(3);G.fx.push({k:'nova',x:a.x,y:a.y-44,r:R,t:.3,m:.3,c:col,a:rnd(TAU)})}
  }else{
    if(id==='small')throwKit(a,side,d,from,col,KIT_THROW.toxic.small);
    if(id==='moderate')throwKit(a,side,d,from,col,KIT_THROW.toxic.moderate);
    if(id==='special'){if(!hitN)G.hazards.push({x:a.x,y:a.y,r:215,t:4.2,dps:d*.75,from,col});strike(a,(x,y)=>Math.hypot(x,y)<215,d*.8,90);shake(2.5)}
  }
}
/* The asset villains throw things: the Toxin Alchemist its flasks, the Necromancer a skull.
   Toxin Alchemist throws its flasks. small: a fast flask thrown straight, it breaks on the first enemy
   or wall, or at its range. moderate: a heavier flask lobbed in an arc over enemies to the aimed spot.
   Both burst and leave a poison pool. Enemy alchemists throw them at their target the same way. */
const KIT_THROW={
 toxic:{small:{fx:'flask',sp:430,range:250,blast:46,pool:46,t:2.2,dps:.3},moderate:{fx:'flask',sp:340,range:300,min:110,blast:80,pool:80,t:3.4,dps:.55,lob:1}},
 necro:{small:{fx:'skull',sp:460,range:240,blast:40}}};
function throwKit(a,side,d,from,col,F){const to=a.char?abilAim(a):{x:G.p.x,y:G.p.y},x=a.x+side*20,y=a.y-24,ang=Math.atan2(to.y-a.y,to.x-a.x),dist0=clamp(Math.hypot(to.x-a.x,to.y-a.y),F.min||0,F.range),
    life=dist0/F.sp,gy=a.y-22;
  G.shots.push({x,y:F.lob?gy:y,vx:Math.cos(ang)*F.sp,vy:Math.sin(ang)*F.sp,r:F.lob?10:8,from,life,dmg:d,blast:F.blast,fx:F.fx,col,a:ang,heavy:!!F.lob,lob:F.lob?life:0,hopT:F.lob?0:life,breaks:1,pid:a.id||0,
    pool:F.pool?{r:F.pool,t:F.t,dps:d*F.dps}:undefined});sfx('bolt')}
function updateMove(a,dt){const mv=a.mv;if(!mv)return;mv.t+=dt;const M=KIT[mv.key][mv.id];while(mv.hit<M.hits.length&&mv.t>=M.hits[mv.hit]*mv.dur){fireMove(a,mv,mv.hit);mv.hit++}if(mv.t>=mv.dur)a.mv=null}
function doMove(id){const p=G.p;if(p.carry||!kitOf(p)||p.guard||p.mv||p.stunT>0)return;if(id==='special'){if((p.specT||0)>0)return;p.specT=SPECIAL_CD*cdMulOf(p);G.banner=null}startMove(p,id,mouseAimX());if(id==='special')addLog('Special attack used. Ready again in '+Math.round(SPECIAL_CD*p.s.cdMul)+' seconds.')}
const mouseAimX=()=>{const p=G.p;return touchMode?p.x+Math.cos(p.face):mouse.x};
/* ---------- Abilities ----------
   C readies the ability: it locks a target, picks an ally, aims a spot or line, grabs an enemy, or starts a
   buff. A left click uses it (online, the attack input; on touch, tapping Ability again). C again cancels an
   aimed ability, and fires the finisher of a buff or a grab.
   Every character has one Ability (C) and its Use (Z). Ability arms the move: it locks a target, picks
   an ally, aims a spot or a line, grabs an enemy, or starts a short buff. Use fires it after the special
   attack's cast delay. It hits for ten of the character's basic attacks.
   aim  foe: enemy nearest the aim · ally: most hurt ally in range · spot: a point in range
        line: a direction, len long · grab: the nearest enemy in reach
        self: a buff around you; its cooldown starts when it is armed, and Use is its finisher
   fx   what Use does; see ABILITY_FIRE. */
const ABILITY_CAST=KIT.toxic.special.hits[0]*KIT.toxic.special.dur,ABILITY_ARMED=10,EXECUTE_BELOW=.25;
const ABILITY_FX={
 mark:{aim:'foe',range:560,shot:{kind:'bullet',sp:1100},col:'255,207,112',d:'Locks onto the enemy nearest your aim and shoots it. Enemies other than bosses and villains below a quarter of their life die outright.'},
 pool:{aim:'spot',range:440,r:110,shot:{kind:'lob',t:.6},col:'140,240,70',d:'Throws to a spot in range. It bursts and leaves a damaging pool.'},
 leap:{aim:'foe',range:420,r:95,col:'255,170,90',d:'Leaps onto the enemy nearest your aim and slams the ground around it.'},
 /* Necromancer: five homing skulls. Toxin Alchemist: a rain of flasks that leave poison pools. Void Empress: a black hole that pulls, then collapses. */
 souls:{aim:'foe',range:560,count:5,col:'110,255,170',d:'Marks the enemy nearest your aim. Using it releases five homing skulls that hunt the nearest enemies.'},
 rain:{aim:'spot',range:460,r:130,count:6,col:'140,240,70',d:'Aim a spot in range. Using it hurls six flasks around it; each bursts into a poison pool.'},
 singularity:{aim:'spot',range:480,r:210,dur:2.6,col:'170,110,255',d:'Aim a spot in range. Using it opens a black hole that drags enemies in and hurts them, then collapses in a blast.'},
 /* Falcon EX: three full-power diving strikes, each on the enemy nearest where you aim (or nearest you) */
 dive:{aim:'foe',range:520,r:105,hits:3,gap:.38,col:'111,214,255',d:'Locks onto the enemy nearest your aim. Using it flies up and dives three times, each dive slamming the enemy nearest your aim.'},
 pierce:{aim:'line',len:650,w:34,charge:2,shot:{kind:'spear',sp:950},col:'255,230,140',d:'Fires along your aim through every enemy on the line. It charges for 2 seconds while ready.'},
 stun:{aim:'foe',range:520,stun:2.5,shot:{kind:'bolt',sp:720},col:'120,220,255',d:'Fires at the enemy nearest your aim and stuns it (shorter on bosses).'},
 brace:{aim:'self',dur:8,r:160,col:'120,200,255',d:'Raises a dome: you and allies inside take half damage. The finisher releases it as a shockwave that pushes and stuns.'},
 heal:{aim:'ally',range:420,cd:90,col:'130,255,170',d:'Fully heals the most hurt ally in range (or you) and clears poison, webs and stuns. 90 second cooldown.'},
 vanish:{aim:'self',dur:5,r:160,col:'180,160,220',d:'You turn invisible for 5 seconds: enemies lose track of you and cannot hurt you. The finisher ambushes the nearest enemy for double damage.'},
 roar:{aim:'self',dur:6,r:320,col:'255,110,90',d:'You roar: nearby enemies turn on you and you take 30% less damage. The finisher slams the ground.'},
 collapse:{aim:'spot',range:460,r:220,shot:{kind:'lob',t:.7},col:'190,130,255',d:'Pulls every enemy near the aimed point into it and crushes them.'},
 decoy:{aim:'self',dur:10,r:110,col:'255,140,210',d:'Leaves a copy of you where you stand. The finisher swaps you back to it and the copy bursts.'},
 hook:{aim:'line',len:450,w:30,shot:{kind:'hook',sp:900},col:'200,210,230',d:'Fires a hook along your aim. The first enemy hit is dragged to you and dazed. Bosses only take the damage.'},
 hurl:{aim:'grab',range:90,throw:420,r:90,col:'255,190,110',d:'Grabs the nearest enemy in reach; the finisher hurls it where you aim. It knocks down enemies where it lands. Not bosses or villains.'},
 blitz:{aim:'self',dur:6,len:320,col:'130,255,220',d:'Overdrive: twice as fast for 6 seconds. The finisher dashes where you aim, untouchable, hitting everything you pass.'},
 titan:{aim:'self',dur:8,r:220,col:'255,140,80',d:'You grow to twice your size for 8 seconds: 50% more damage and a third less damage taken. The finisher stomps a stunning shockwave and ends it.'},
 timefield:{aim:'self',dur:8,r:320,col:'112,221,255',d:'Ready it, then use it: a wide field of stopped time bursts from you. Enemies inside freeze for 10 seconds (5 for bosses). For that time you and your party deal 50% more damage and move and attack twice as fast (half as much while a boss is up).'},
 aegis:{aim:'self',dur:6,r:230,col:'255,205,94',d:'Ready it to raise the Aegis for 6 seconds: every enemy nearby turns on you, and damage to you and allies near you is soaked by a shield worth half your life, plus a quarter for each extra party member. It breaks when used up. The finisher releases what it soaked as a holy blast.'},
 anvil:{aim:'self',dur:6,r:230,col:'232,137,42',d:'Ready it to forge the Soul Anvil for 6 seconds: every enemy nearby turns on you, and damage to you and allies near you is soaked by a shield worth half your life, plus a quarter for each extra party member. A molten aura burns nearby enemies harder the more it soaks. The finisher heals allies from what it soaked.'},
 truck:{aim:'self',dur:8,r:150,col:'255,120,60',d:'Ready it to ride a fire truck for 8 seconds: much faster (+6 speed), and ramming enemies hits them hard (+4). Hold attack while riding to boost: faster, and rams hit even harder (+6). The finisher ends the ride with a hose blast.'},
 bat:{aim:'self',dur:10,r:150,col:'220,40,70',d:'Ready it to turn into a winged vampire for 10 seconds: you fly, with +5 attack, attack speed, life steal and speed. The finisher ends it with a blood burst.'},
 meteor:{aim:'spot',range:480,r:240,col:'255,130,60',d:'Aim a spot in range. Using it calls a meteor storm on the area: 6 meteors plus one for every two player levels (up to 12). Each falls after a warning shadow, blasts, sets enemies ablaze and burns the ground.'},
 voidfield:{aim:'spot',range:460,r:230,col:'170,110,255',d:'Aim a spot in range. Using it opens a wide void: every enemy inside is trapped for 3 seconds while small voids strike it from all sides, one strike per player level (3 to 12), each +1.'},
 push:{aim:'self',dur:10,r:110,grow:110,charge:1.5,col:'170,140,255',d:'Charges a force ring while ready (1.5 s). Using it blasts every enemy in the ring away and breaks their attacks; at full charge it also hurts.'}
};
const defAbility=(fx,n,use,o={})=>Object.assign({fx},ABILITY_FX[fx],{n,use},o);
const ABILITIES={
 Detective:defAbility('mark','Lock On','Execute'),Vigilante:defAbility('hook','Grapple','Reel In'),Guardian:defAbility('aegis','Aegis','Aegis Release'),Ranger:defAbility('pierce','Steady Aim','Piercing Shot'),
 Inventor:defAbility('stun','Stun Gun','Taser Shot',{chain:2}),Firefighter:defAbility('truck','Fire Truck','Hose Blast'),'Hero Shadow':defAbility('vanish','Vanish','Ambush'),Prodigy:defAbility('hurl','Grab','Home Run'),
 Sage:defAbility('stun','Arcane Bind','Seal',{col:'211,168,255'}),Patriot:defAbility('dive','Falcon Dive','Triple Dive'),Phantom:defAbility('blitz','Phase Run','Phase Dash'),Pyromancer:defAbility('meteor','Meteor Storm','Call Meteors'),
 Chronomancer:defAbility('timefield','Time Field','Time Stop',{col:'112,221,255'}),Beastmaster:defAbility('leap','Stalk','Pounce'),Voidwalker:defAbility('voidfield','Void Field','Open Void'),Exorcist:defAbility('heal','Triage','Sacred Mend',{col:'255,229,159'}),
 'Gravity Mage':defAbility('collapse','Singularity','Collapse'),Druid:defAbility('pool','Thorn Field','Bloom',{col:'139,238,139'}),Cyborg:defAbility('titan','Titan Form','Titan Stomp',{col:'105,224,255'}),Illusionist:defAbility('decoy','Decoy','Swap'),
 Necromancer:defAbility('souls','Soul Swarm','Release'),'Blood Reaper':defAbility('roar','Blood Roar','Ground Pound'),'Toxin Alchemist':defAbility('rain','Plague Rain','Pour'),'Soul Stealer':defAbility('hook','Soul Chain','Drag Soul',{col:'204,146,255'}),
 'Shadow Monarch':defAbility('bat','Vampire Form','Blood Burst'),Puppeteer:defAbility('hurl','String Grab','Fling',{col:'237,147,255'}),'Void Empress':defAbility('voidfield','Void Field','Open Void',{r:270,d:'Aim a spot in range. Using it opens a wide void: every enemy inside is trapped for 5 seconds while small voids strike it from all sides, one strike per player level (3 to 12), each +3.'}),'Plague Doctor':defAbility('heal','Triage','Black Remedy',{col:'169,227,117'}),
 'Mad Scientist':defAbility('stun','Tesla Lock','Arc Shock',{chain:2,col:'101,245,236'}),'Demon Knight':defAbility('leap','Hellmark','Infernal Leap',{col:'255,126,66'}),'Gravity Weaver':defAbility('push','Gravity Ring','Repel'),'Mecha Tyrant':defAbility('titan','Overcharge','Iron Stomp'),
 'Chrono Thief':defAbility('blitz','Haste','Time Dash',{col:'255,214,111'}),'Swarm Queen':defAbility('pool','Swarm Mark','Release Swarm',{col:'229,221,98'}),'Ice Archmage':defAbility('stun','Frost Lock','Freeze',{freeze:1,col:'168,232,255'}),'Deep Siren':defAbility('hook','Siren Lure','Undertow',{col:'110,230,255'}),
 'Ash Shaman':defAbility('pool','Ash Circle','Eruption',{col:'255,120,60'}),'Soul Forger':defAbility('anvil','Soul Anvil','Temper'),'Mirror Jester':defAbility('decoy','Mirror Image','Swap',{col:'255,118,193'}),'Cyber Priest':defAbility('heal','Diagnose','Full Restore',{col:'111,224,216'})
};
const abilityOf=p=>ABILITIES[p.char]||null;
/* Buffs and grabs are already running once readied, so pressing C again fires their finisher instead of cancelling. */
const hasFinisher=ab=>ab.aim==='self'||ab.aim==='grab';
const abilFoe=new WeakMap();
let touchAim=null;
/* Sprint: hold Shift (or drag the touch stick far out). Faster with a longer stride; costs mana; stops while attacking, shielding or dodging. */
const SPRINT={mul:1.5,stride:1.35,mana:8,drag:80};
let sprintKey=false;
const canSprint=(p,v)=>sprintKey&&!!(v.x||v.y)&&!p.guard&&!mouse.left&&!touchHold.slash&&!(p.dashT>0)&&!p.mv&&!p.carry&&!(p.stunT>0)&&p.mana>0;
/* An ability hits for ten basic attacks: a basic hit is a tenth of an ability. The basic hit is the character's own
   weapon (or the small move of an asset villain), so both grow together with level, stats, skills and upgrades. */
const ABILITY_BASIC_X=10;
/* Pills, auras, links and Titan Form apply on top (the asset villains' small move already includes them). */
const basicHit=p=>{const k=kitOf(p);return k?moveDamage(p,k,'small'):weaponDamage(weaponOf(p.char))*dmgMul()};
const abilityDamage=p=>basicHit(p)*ABILITY_BASIC_X;
/* Where the player is aiming: the mouse, or on touch a dragged point, else the nearest enemy */
function abilAim(p){if(!touchMode)return{x:mouse.x,y:mouse.y};if(touchAim)return touchAim;const n=nearestEnemy();return n?{x:n.x,y:n.y}:{x:p.x+Math.cos(p.face)*200,y:p.y+Math.sin(p.face)*200}}
function clampRange(p,pt,range){const a=Math.atan2(pt.y-p.y,pt.x-p.x),d=Math.min(range,Math.hypot(pt.x-p.x,pt.y-p.y));return{x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d}}
const foeAlive=e=>!!e&&!e.dead&&!e.fleshDown&&!e.scrapDown;
function markTarget(p,ab){const aim=abilAim(p);let best=null,bd=Infinity;for(const e of G.enemies){if(!foeAlive(e)||concealed(e,p)||dist(e,p)>ab.range||!los(e,p))continue;const d=Math.hypot(e.x-aim.x,e.y-aim.y);if(d<bd){bd=d;best=e}}return best}
function grabTarget(p,ab){let best=null,bd=ab.range;for(const e of G.enemies){if(!foeAlive(e)||e.kind==='boss'||e.vill)continue;const d=dist(e,p);if(d<bd){bd=d;best=e}}return best}
function hurtAlly(p,ab){let best=null,bv=2;for(const q of G.players){if(q.deadT>0||q.respawnT>0||dist(q,p)>ab.range)continue;const v=q.hp/q.s.maxHp;if(v<bv){bv=v;best=q}}return best||p}
/* Buffs that change other rules while they are armed */
const abilBuff=(p,fx)=>!!(p&&p.abil&&p.abil.fx===fx);
const abilSpeed=p=>abilBuff(p,'blitz')?2:1;
const abilSize=p=>abilBuff(p,'titan')?2:1;
const abilDmgMul=p=>abilBuff(p,'titan')?1.5:1;
const abilGuard=p=>(abilBuff(p,'titan')?.67:1)*(abilBuff(p,'roar')?.7:1)*(G.players.some(q=>abilBuff(q,'brace')&&dist(q,p)<ABILITY_FX.brace.r)?.5:1);
const abilStealth=p=>abilBuff(p,'vanish');
const abilCharge=(a,ab)=>ab.charge?clamp((a.armed||0)/ab.charge,0,1):1;
const abilityBlocked=p=>p.carry||p.stunT>0||p.guard||p.mv||p.ult||G.mode!=='play';
function abilityEnd(p){const e=abilFoe.get(p);if(e&&p.abil&&p.abil.aim==='grab')e.stunT=Math.max(e.stunT||0,.4);p.abil=null;abilFoe.delete(p)}
function doAbility(){const p=G.p,ab=abilityOf(p);if(!ab||abilityBlocked(p)||p.abilCast)return;
  if(p.abil){if(hasFinisher(ab))doUse();else abilityEnd(p);return}
  if((p.abilT||0)>0){addLog(ab.n+' ready in '+Math.ceil(p.abilT)+' seconds.');return}
  const a={fx:ab.fx,aim:ab.aim,t:ab.dur||ABILITY_ARMED,armed:0,x:p.x,y:p.y};
  if(ab.aim==='foe'||ab.aim==='grab'){const e=ab.aim==='foe'?markTarget(p,ab):grabTarget(p,ab);if(!e){text(p.x,p.y-70,ab.aim==='grab'?'Nothing to grab':'No target in range','#ffb080');return}abilFoe.set(p,e);a.x=e.x;a.y=e.y}
  else if(ab.aim==='ally'){const q=hurtAlly(p,ab);a.pid=q.id||0;a.x=q.x;a.y=q.y}
  else if(ab.aim==='spot')Object.assign(a,clampRange(p,abilAim(p),ab.range));
  else if(ab.aim==='line'){const m=abilAim(p);a.a=Math.atan2(m.y-p.y,m.x-p.x);a.x=p.x+Math.cos(a.a)*ab.len;a.y=p.y+Math.sin(a.a)*ab.len}
  p.abil=a;if(ab.aim==='self'){p.abilT=(ab.cd||SPECIAL_CD)*cdMulOf(p);abilityArm(p,ab)}sfx('lock')}
function abilityArm(p,ab){
  if(ab.fx==='roar'){for(const e of G.enemies)if(foeAlive(e)&&dist(e,p)<ab.r){e.tauntT=Math.max(e.tauntT||0,ab.dur);e.tauntId=p.id||0}text(p.x,p.y-80,ab.n.toUpperCase(),'#ff8a70',true);shake(3)}
  else if(ab.fx==='aegis'||ab.fx==='anvil')tankArm(p,ab);
  else if(ab.fx==='truck'||ab.fx==='bat'){text(p.x,p.y-90,ab.fx==='truck'?'FIRE TRUCK':'VAMPIRE FORM',ab.fx==='truck'?'#ffb070':'#ff6b7a',true);fxAt(p.x,p.y,ab.col,20);shake(3);sfx('boom')}
  else glowP(p.x,p.y-24,ab.col,12,160,.5,3)}
function doUse(){const p=G.p,ab=abilityOf(p),a=p.abil;if(!ab||!a||abilityBlocked(p)||p.abilCast)return;
  if((ab.aim==='foe'||ab.aim==='grab')&&!foeValid(p,ab))return;
  const wind=ab.shot?ABILITY_CAST*SHOT_WINDUP:ABILITY_CAST;
  p.abilCast={fx:a.fx,aim:a.aim,t:wind,m:wind,x:a.x,y:a.y,a:a.a,pid:a.pid,k:abilCharge(a,ab)};
  /* Aimed abilities are spent on Use; buffs and a held enemy stay until the cast fires */
  if(ab.aim!=='self'&&ab.aim!=='grab'){p.abil=null;p.abilT=(ab.cd||SPECIAL_CD)*cdMulOf(p)}
  if(ab.aim==='grab')p.abilT=SPECIAL_CD*cdMulOf(p);
  p.castT=wind;sfx('charge')}
function foeValid(p,ab){const e=abilFoe.get(p);if(foeAlive(e)&&dist(e,p)<=ab.range*1.25+(ab.aim==='grab'?60:0))return e;abilFoe.delete(p);if(p.abil&&(p.abil.aim==='foe'||p.abil.aim==='grab')){p.abil=null;text(p.x,p.y-70,'Target lost','#ffb080')}return null}
/* Shared pieces for the effects */
function stepMove(o,ang,d){const n=Math.max(1,Math.ceil(d/12));for(let i=0;i<n;i++)if(move(o,Math.cos(ang)*d/n,Math.sin(ang)*d/n))break}
const shove=(e,ang,d)=>{if(e.kind!=='boss')stepMove(e,ang,d)};
function stunFor(e,t){e.stunT=Math.max(e.stunT||0,e.kind==='boss'?t*.3:t);e.wind=0}
function blast(x,y,r,dmg,kb,stun){for(const e of G.enemies.slice()){if(!foeAlive(e)||Math.hypot(e.x-x,e.y-y)>r+e.r)continue;hitEnemy(e,dmg,Math.atan2(e.y-y,e.x-x),kb,true);if(stun&&!e.dead)stunFor(e,stun)}
  for(const n of G.npcs)if(!n.dead&&Math.hypot(n.x-x,n.y-y)<r)hitNpc(n,dmg,rnd(TAU),true)}
const segDist=(o,x0,y0,x1,y1)=>{const dx=x1-x0,dy=y1-y0,L=dx*dx+dy*dy||1,t=clamp(((o.x-x0)*dx+(o.y-y0)*dy)/L,0,1);return Math.hypot(o.x-(x0+dx*t),o.y-(y0+dy*t))};
function onLine(x0,y0,ang,len,w){const x1=x0+Math.cos(ang)*len,y1=y0+Math.sin(ang)*len;return G.enemies.filter(e=>foeAlive(e)&&segDist(e,x0,y0,x1,y1)<w+e.r).sort((a,b)=>Math.hypot(a.x-x0,a.y-y0)-Math.hypot(b.x-x0,b.y-y0))}
const fxAt=(x,y,col,n=16)=>{burst(x,y-10,'rgb('+col+')',n,220);glowP(x,y-20,col,n,200,.6,4)};
/* ---------- Ability projectiles ----------
   Ranged abilities wind up for part of the cast, then launch a projectile that travels and lands the
   effect on arrival. bullet and bolt home in on the locked enemy; spear flies a line and hits every
   enemy it passes; hook stops at the first enemy; lob arcs to the aimed spot over walls. Walls stop
   the others. The projectile's position lives on the cast (px, py), so allies see it too. */
const SHOT_WINDUP=.45,SHOT_Y=24;
const shotHits=new WeakMap();
function launchShot(p,ab,c){c.fly=1;c.px=p.x;c.py=p.y;c.gone=0;c.lt=0;if(ab.shot.kind==='lob'){c.ox=p.x;c.oy=p.y}shotHits.set(p,new Set());sfx(ab.shot.kind==='lob'?'bolt':'shot')}
/* Moves the projectile one step; returns true when it has landed. */
function flyShot(p,ab,c,dt,d){const S=ab.shot;
  if(S.kind==='lob'){c.lt=Math.min(1,c.lt+dt/S.t);c.px=c.ox+(c.x-c.ox)*c.lt;c.py=c.oy+(c.y-c.oy)*c.lt;return c.lt>=1}
  const step=S.sp*dt;
  if(S.kind==='bullet'||S.kind==='bolt'){const e=abilFoe.get(p);if(foeAlive(e)){c.x=e.x;c.y=e.y}const L=Math.hypot(c.x-c.px,c.y-c.py);c.a=Math.atan2(c.y-c.py,c.x-c.px);if(L<=step+(foeAlive(e)?e.r:4)){c.px=c.x;c.py=c.y;return true}c.px+=Math.cos(c.a)*step;c.py+=Math.sin(c.a)*step;return false}
  /* spear and hook fly straight along the aimed line */
  const x0=c.px,y0=c.py,x1=x0+Math.cos(c.a)*step,y1=y0+Math.sin(c.a)*step,seen=shotHits.get(p)||new Set();c.gone+=step;
  for(const e of G.enemies.slice()){if(!foeAlive(e)||seen.has(e)||segDist(e,x0,y0,x1,y1)>ab.w+e.r)continue;seen.add(e);
    if(S.kind==='hook'){abilFoe.set(p,e);c.px=e.x;c.py=e.y;return true}
    const k=(.5+.5*c.k)*(c.k>=1?1.3:1);hitEnemy(e,d*k,c.a,160,true);fxAt(e.x,e.y,ab.col,8)}
  c.px=x1;c.py=y1;return c.gone>=ab.len||wall(x1/T|0,y1/T|0)}
/* What Use does, for each kind. c: the cast, d: special-attack damage. */
const ABILITY_FIRE={
 aegis(p,ab,c,d){const s=p.tankAbs||0;abilityEnd(p);p.tankPool=0;blast(p.x,p.y,200,d*.4+s*.5,260,1);G.fx.push({k:'judgement',x:p.x,y:p.y,r:200,t:.9,m:.9});text(p.x,p.y-96,'AEGIS RELEASE','#fff2b0',true);shake(6)},
 anvil(p,ab,c,d){const s=p.tankAbs||0;abilityEnd(p);p.tankPool=0;blast(p.x,p.y,170,d*.35,220,.6);for(const q of G.players){if(q.deadT>0||q.respawnT>0||dist(q,p)>240)continue;const h=Math.min(q.s.maxHp-q.hp,s*.3);if(h>0){q.hp+=h;text(q.x,q.y-84,'+'+Math.round(h),'#80ffaa')}}G.fx.push({k:'anvilslam',x:p.x,y:p.y,r:170,t:.6,m:.6});text(p.x,p.y-96,'TEMPERED','#ffb070',true);shake(5)},
 truck(p,ab,c,d){abilityEnd(p);blast(p.x+Math.cos(p.face)*60,p.y+Math.sin(p.face)*40,ab.r*.8,d*.4,300,.6);G.fx.push({k:'hose',x:p.x,y:p.y,a:p.face,t:.5,m:.5});fxAt(p.x,p.y,'110,200,255',18);shake(4)},
 bat(p,ab,c,d){abilityEnd(p);blast(p.x,p.y,ab.r,d*.5,200,.5);fxAt(p.x,p.y,ab.col,26);shake(5)},
 meteor(p,ab,c,d){const C=SIG.Pyromancer.meteor,n=clamp(C.base+Math.floor((p.lvl||1)/2),C.base,C.max);p.meteor={x:+c.x.toFixed(1),y:+c.y.toFixed(1),r:ab.r,left:n,n,tick:0,falls:[],d:+(d*C.k).toFixed(1)};text(c.x,c.y-90,'METEOR STORM','#ffb070',true);sfx('boom')},
 voidfield(p,ab,c,d){const S=sigOf(p)&&sigOf(p).field||SIG.Voidwalker.field,n=clamp(p.lvl||1,VOID_HITS[0],VOID_HITS[1]),caught=[];
   for(const e of G.enemies){if(!foeAlive(e)||Math.hypot(e.x-c.x,e.y-c.y)>ab.r+(e.r||14))continue;e.voidT=Math.max(e.voidT||0,e.kind==='boss'?S.hold/2:S.hold);e.wind=0;e.castT=0;caught.push(e)}
   VOID_CAUGHT.set(p,caught);p.voidF={x:+c.x.toFixed(1),y:+c.y.toFixed(1),r:ab.r,t:S.hold,m:S.hold,gap:+(S.hold/n).toFixed(3),tick:0,left:n,d:+(basicHit(p)*plus(S.hit)).toFixed(1)};
   G.fx.push({k:'voidfield',x:c.x,y:c.y,r:ab.r,t:S.hold,m:S.hold});text(c.x,c.y-90,caught.length?'VOID FIELD':'Nothing caught','#d8b8ff',true);shake(5);sfx('boom')},
 timefield(p,ab,c,d){abilityEnd(p);const boss=!!G.boss,k=boss?.5:1,dur=boss?CHRONO.field.buff/2:CHRONO.field.buff;let n=0;
   for(const e of G.enemies.slice()){if(!foeAlive(e)||dist(e,p)>ab.r+(e.r||14))continue;hitEnemy(e,d*.3,Math.atan2(e.y-p.y,e.x-p.x),0,true);if(!e.dead){timeStop(e,CHRONO.field.stop,p.id||1);n++}}
   for(const q of G.players)if(!(q.deadT>0||q.respawnT>0)){q.timeBuffT=dur;q.timeBuffK=k}
   G.fx.push({k:'timefield',x:p.x,y:p.y,r:ab.r,t:1,m:1});text(p.x,p.y-90,'TIME STOP','#9ff0ff',true);shake(6);sfx('boom')},
 mark(p,ab,c,d){const e=abilFoe.get(p);if(!foeAlive(e))return;const kill=e.kind!=='boss'&&!e.vill&&e.hp<e.maxHp*EXECUTE_BELOW;hitEnemy(e,kill?e.hp+1:d,Math.atan2(e.y-p.y,e.x-p.x),220,true);if(kill&&!e.dead){e.hp=0;killEnemy(e)}text(e.x,e.y-90,kill?'EXECUTED':'CASE CLOSED','#ffcf70',true);fxAt(e.x,e.y,ab.col,14);shake(5)},
 pool(p,ab,c,d){G.hazards.push({x:c.x,y:c.y,r:ab.r,t:4.2,dps:d*.5/9,from:'p',pid:p.id,col:ab.col});blast(c.x,c.y,ab.r,d*.5,140,0);fxAt(c.x,c.y,ab.col,26);shake(4)},
 souls(p,ab,c,d){const e=abilFoe.get(p);for(let i=0;i<ab.count;i++){const a=p.face+(i-(ab.count-1)/2)*.45;G.shots.push({x:p.x+Math.cos(a)*18,y:p.y-30+Math.sin(a)*10,vx:Math.cos(a)*300,vy:Math.sin(a)*300,r:7,from:'p',life:2.4,dmg:d*.28,small:true,fx:'skull',col:ab.col,a,home:1,homeT:i===0&&foeAlive(e)?1:0,kb:120,stag:1,pid:p.id||0})}fxAt(p.x,p.y-24,ab.col,18);sfx('bolt');shake(3)},
 rain(p,ab,c,d){for(let i=0;i<ab.count;i++){const ang=i/ab.count*TAU+rnd(-.3,.3),rr=i===0?0:rnd(ab.r*.45,ab.r);lobFlask(p,{x:c.x+Math.cos(ang)*rr,y:c.y+Math.sin(ang)*rr},d*.12,{blast:70,pool:72,t:3.6,dps:.06,sp:360},ab.col)}sfx('bolt');shake(3)},
 singularity(p,ab,c,d){p.sing={x:c.x,y:c.y,t:ab.dur,tick:0,d:+d.toFixed(1)};fxAt(c.x,c.y,ab.col,26);sfx('boom');shake(4)},
 dive(p,ab,c,d){const e=abilFoe.get(p);DIVE_FOE.set(p,foeAlive(e)?e:null);p.dive={n:ab.hits,t:0,d:+d.toFixed(1)};diveStep(p,0)},
 leap(p,ab,c,d){stepMove(p,Math.atan2(c.y-p.y,c.x-p.x),Math.max(0,Math.hypot(c.x-p.x,c.y-p.y)-24));p.inv=Math.max(p.inv,.3);blast(p.x,p.y,ab.r,d,240,.6);fxAt(p.x,p.y,ab.col,22);shake(6)},
 pierce(p,ab,c,d){fxAt(c.px,c.py,ab.col,14);shake(3)},
 stun(p,ab,c,d){const e=abilFoe.get(p);if(!foeAlive(e))return;hitEnemy(e,d*.5,Math.atan2(e.y-p.y,e.x-p.x),60,true);if(!e.dead){if(ab.freeze&&e.kind!=='boss')e.frozenT=Math.max(e.frozenT||0,ab.stun);else stunFor(e,ab.stun)}fxAt(e.x,e.y,ab.col,16);
   if(ab.chain)for(const o of G.enemies.filter(o=>o!==e&&foeAlive(o)&&dist(o,e)<170).sort((a,b)=>dist(a,e)-dist(b,e)).slice(0,ab.chain)){hitEnemy(o,d*.25,0,30,true);if(!o.dead)stunFor(o,ab.stun*.5);fxAt(o.x,o.y,ab.col,6)}},
 brace(p,ab,c,d){abilityEnd(p);blast(p.x,p.y,ab.r,d*.5,300,1);fxAt(p.x,p.y,ab.col,24);shake(5)},
 heal(p,ab,c,d){const q=G.players.find(o=>(o.id||0)===c.pid)||p;if(q.deadT>0||q.respawnT>0)return;q.hp=q.s.maxHp;for(const k of ['toxicLoad','loadMark','webT','stunT','grabT','possT'])if(q[k])q[k]=0;q.healFx=1;threatHeal(p,q.s.maxHp*.5);text(q.x,q.y-90,'FULL HEAL','#80ffaa',true);fxAt(q.x,q.y,ab.col,20)},
 vanish(p,ab,c,d){abilityEnd(p);let best=null,bd=ab.r;for(const e of G.enemies){if(!foeAlive(e))continue;const r=dist(e,p);if(r<bd){bd=r;best=e}}if(best){hitEnemy(best,d*2,Math.atan2(best.y-p.y,best.x-p.x),200,true);text(best.x,best.y-90,'AMBUSH','#d8c0ff',true);fxAt(best.x,best.y,ab.col,18)}shake(4)},
 roar(p,ab,c,d){abilityEnd(p);blast(p.x,p.y,170,d,220,.5);fxAt(p.x,p.y,ab.col,24);shake(7)},
 collapse(p,ab,c,d){for(const e of G.enemies)if(foeAlive(e)){const r=Math.hypot(e.x-c.x,e.y-c.y);if(r<ab.r)shove(e,Math.atan2(c.y-e.y,c.x-e.x),Math.max(0,r-20))}blast(c.x,c.y,90,d,0,.8);fxAt(c.x,c.y,ab.col,28);shake(6)},
 decoy(p,ab,c,d){abilityEnd(p);fxAt(p.x,p.y,ab.col,10);p.x=c.x;p.y=c.y;p.inv=Math.max(p.inv,.5);blast(c.x,c.y,ab.r,d*.8,200,.6);fxAt(c.x,c.y,ab.col,22);shake(4)},
 hook(p,ab,c,d){const e=abilFoe.get(p);abilFoe.delete(p);if(!foeAlive(e)){fxAt(c.px,c.py,ab.col,6);return}hitEnemy(e,d*.6,c.a+Math.PI,0,true);if(!e.dead&&e.kind!=='boss'){shove(e,Math.atan2(p.y-e.y,p.x-e.x),Math.max(0,dist(e,p)-34));stunFor(e,1)}fxAt(e.x,e.y,ab.col,12)},
 hurl(p,ab,c,d){const e=abilFoe.get(p);abilityEnd(p);if(!foeAlive(e))return;const to=clampRange(p,abilAim(p),ab.throw),ang=Math.atan2(to.y-e.y,to.x-e.x);shove(e,ang,Math.hypot(to.x-e.x,to.y-e.y));hitEnemy(e,d*.6,ang,0,true);blast(e.x,e.y,ab.r,d*.4,180,1);fxAt(e.x,e.y,ab.col,20);shake(5)},
 blitz(p,ab,c,d){abilityEnd(p);const m=abilAim(p),ang=Math.atan2(m.y-p.y,m.x-p.x),x0=p.x,y0=p.y;stepMove(p,ang,ab.len);p.inv=Math.max(p.inv,.4);for(const e of G.enemies.slice())if(foeAlive(e)&&segDist(e,x0,y0,p.x,p.y)<30+e.r)hitEnemy(e,d*.7,ang,160,true);fxAt(p.x,p.y,ab.col,14)},
 titan(p,ab,c,d){blast(p.x,p.y,ab.r,d,260,1.5);abilityEnd(p);fxAt(p.x,p.y,ab.col,30);shake(9)},
 push(p,ab,c,d){const r=ab.r+ab.grow*c.k;abilityEnd(p);for(const e of G.enemies.slice()){if(!foeAlive(e)||dist(e,p)>r+e.r)continue;const ang=Math.atan2(e.y-p.y,e.x-p.x);e.wind=0;e.castT=0;shove(e,ang,220);if(c.k>=1)hitEnemy(e,d*.6,ang,0,true);else e.flash=.15}fxAt(p.x,p.y,ab.col,26);shake(4)}
};
/* Falcon Dive: each dive lands on its target, slams the ground, then the next follows ab.gap seconds later. */
const DIVE_FOE=new WeakMap();
function diveStep(p,dt){const dv=p.dive,ab=ABILITY_FX.dive;dv.t-=dt;if(dv.t>0)return;
  const m=abilAim(p);let e=DIVE_FOE.get(p);DIVE_FOE.set(p,null);
  if(!foeAlive(e)){e=null;let bd=ab.range;for(const o of G.enemies){if(!foeAlive(o))continue;const r=Math.min(Math.hypot(o.x-m.x,o.y-m.y),dist(o,p));if(r<bd&&dist(o,p)<ab.range){bd=r;e=o}}}
  if(!e){p.dive=null;return}
  const a=Math.atan2(e.y-p.y,e.x-p.x);stepMove(p,a,Math.max(0,dist(e,p)-22));p.inv=Math.max(p.inv,ab.gap+.1);
  for(const o of G.enemies.slice())if(foeAlive(o)&&dist(o,p)<ab.r+o.r)stagger(o,Math.atan2(o.y-p.y,o.x-p.x),260,o===e);
  blast(p.x,p.y,ab.r,dv.d*.7,260,.4);G.hitStop=Math.max(G.hitStop||0,.08);fxAt(p.x,p.y,ab.col,24);shake(7);sfx('boom');
  dv.n--;text(p.x,p.y-96,'DIVE '+(ab.hits-dv.n)+'/'+ab.hits,'#9fe8ff',true);if(dv.n<=0)p.dive=null;else dv.t=ab.gap}
/* A lobbed flask that lands at a point and bursts into a poison pool (Toxin Alchemist's charged throw and Plague Rain) */
function lobFlask(p,to,d,F,col){const ang=Math.atan2(to.y-p.y,to.x-p.x),dd=Math.max(40,Math.hypot(to.x-p.x,to.y-p.y)),life=dd/F.sp;
  G.shots.push({x:p.x,y:p.y-22,vx:Math.cos(ang)*F.sp,vy:Math.sin(ang)*F.sp,r:10,from:'p',life,dmg:d,blast:F.blast,fx:'flask',col:col||'140,240,70',a:ang,heavy:true,lob:life,breaks:1,pid:p.id||0,pool:{r:F.pool,t:F.t,dps:d*F.dps*10}})}
/* Singularity: pulls enemies toward its centre and hurts them, then collapses in a blast */
function singStep(p,dt){const S=p.sing,ab=ABILITY_FX.singularity;S.t-=dt;S.tick-=dt;
  for(const e of G.enemies){if(!foeAlive(e))continue;const r=Math.hypot(e.x-S.x,e.y-S.y);if(r<ab.r&&r>12){const k=e.kind==='boss'?.25:1;move(e,(S.x-e.x)/r*190*k*dt,(S.y-e.y)/r*190*k*dt)}}
  if(S.tick<=0){S.tick=.5;for(const e of G.enemies.slice())if(foeAlive(e)&&Math.hypot(e.x-S.x,e.y-S.y)<ab.r*.6)hitEnemy(e,S.d*.08,Math.atan2(S.y-e.y,S.x-e.x),0,false)}
  if(S.t<=0){blast(S.x,S.y,120,S.d*.6,260,.6);fxAt(S.x,S.y,ab.col,30);shake(7);sfx('boom');p.sing=null}}
function tickAbility(p,dt){p.abilT=Math.max(0,(p.abilT||0)-dt);if(p.dive)diveStep(p,dt);if(p.sing)singStep(p,dt);if(p.voidF)voidStep(p,dt);if(p.meteor)meteorStep(p,dt);tankStep(p,dt);if(p.char==='Pyromancer')blazeStep(p,dt);if(riding(p))truckStep(p,dt);const ab=abilityOf(p);if(!ab)return;
  const c=p.abilCast;if(c){const e=abilFoe.get(p);if(c.aim==='foe'&&foeAlive(e)&&!c.fly){c.x=e.x;c.y=e.y}
    let land=false;if(c.fly)land=flyShot(p,ab,c,dt,abilityDamage(p));else{c.t-=dt;if(c.t<=0){if(ab.shot)launchShot(p,ab,c);else land=true}}
    if(land){p.abilCast=null;ABILITY_FIRE[c.fx](p,ab,c,abilityDamage(p));if(c.aim==='foe')abilFoe.delete(p);shotHits.delete(p)}}
  const a=p.abil;if(!a)return;a.t-=dt;a.armed+=dt;if(a.t<=0||p.carry){abilityEnd(p);return}
  if(a.aim==='foe'){if(!c){const e=foeValid(p,ab);if(e){a.x=e.x;a.y=e.y}}}
  else if(a.aim==='grab'){const e=foeValid(p,ab);if(e){e.x=p.x+Math.cos(p.face)*26;e.y=p.y-2;e.stunT=Math.max(e.stunT||0,.2);a.x=e.x;a.y=e.y}}
  else if(a.aim==='ally'){const q=G.players.find(o=>(o.id||0)===a.pid);if(q){a.x=q.x;a.y=q.y}}
  else if(a.aim==='spot')Object.assign(a,clampRange(p,abilAim(p),ab.range));
  else if(a.aim==='line'){const m=abilAim(p);a.a=Math.atan2(m.y-p.y,m.x-p.x);a.x=p.x+Math.cos(a.a)*ab.len;a.y=p.y+Math.sin(a.a)*ab.len}
  else if(ab.fx!=='decoy'){a.x=p.x;a.y=p.y}
  if(ab.fx==='vanish')p.inv=Math.max(p.inv,.15)}
/* ---------- Voice-over: the browser's built-in speech, plus a synth stinger that always plays ---------- */
let VOICE=null;
function pickVoice(){if(!('speechSynthesis'in window))return null;const vs=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang));return vs.find(v=>/daniel|alex|fred|ralph|male|david|george/i.test(v.name))||vs[0]||null}
const VOICE_BUF={};let voiceSrc=null;
/* Sound files are separate downloads (assets/), fetched only when sound is switched on.
   A small queue fetches a few at a time, so the first ones needed are not stuck behind the rest. */
function fetchAudio(url){return fetch(url).then(r=>{if(!r.ok)throw new Error(r.status);return r.arrayBuffer()}).then(b=>new Promise((ok,no)=>ac.decodeAudioData(b,ok,no)))}
const AUDIO_Q=[];let audioBusy=0;
function queueAudio(url,done,fail){AUDIO_Q.push({url,done,fail});pumpAudio()}
function pumpAudio(){while(audioBusy<3&&AUDIO_Q.length){const j=AUDIO_Q.shift();audioBusy++;fetchAudio(j.url).then(j.done,j.fail||(()=>{})).finally(()=>{audioBusy--;pumpAudio()})}}
function loadVoices(){Object.entries(VOICE_CLIPS).forEach(([k,url])=>queueAudio(url,b=>{VOICE_BUF[k]=b}))}
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
 'Hero Shadow':['Silent strike','181,130,153','slash','dagger'],Prodigy:['Power play','215,153,255','slash','bat'],Sage:['Arcane wisdom','211,168,255','rune','book'],Patriot:['Falcon storm','111,214,255','spiral','star'],Phantom:['Spectral passage','125,255,198','spiral','ghost'],Pyromancer:['Inferno','255,130,60','flame','flame'],Chronomancer:['Time fracture','112,221,255','orbit','clock'],Beastmaster:['Wild hunt','239,190,112','slash','claw'],Voidwalker:['Beyond the veil','170,137,255','spiral','portal'],Exorcist:['Sacred rite','255,229,159','rune','cross'],'Gravity Mage':['Gravity well','184,145,255','orbit','orbit'],Druid:['Wild bloom','139,238,139','bloom','leaf'],Cyborg:['System overload','105,224,255','tech','circuit'],Illusionist:['Grand illusion','255,118,193','shard','card'],
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
  for(const e of G.enemies.slice()){if(e.dead||e.fleshDown||e.scrapDown||dist(e,p)>ULT_RADIUS)continue;const a=Math.atan2(e.y-p.y,e.x-p.x);G.fx.push({k:'ultStyle',x:e.x,y:e.y-25,t:.4,m:.4,char:p.char,phase:'impact',c:u.col});glowP(e.x,e.y-30,u.col,8,190,.5,4);const hp=e.fleshSplit&&G.flesh?G.flesh.one.fleshTotal:e.hp;hitEnemy(e,ultDmgFor(e,p,lb),a,260,true);const after=e.fleshSplit&&G.flesh?G.flesh.one.fleshTotal:e.hp;if(G.link&&G.link.ids.includes(p.id)&&!e.dead&&!e.fleshDown)G.link.hits.push({e,p,base:Math.max(0,hp-after)/(1+lb),bonus:lb})}
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
  sfx('link_'+t[2].toLowerCase().replace(' ','_'));
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
  G.link={t:LINK_WINDOW,ids:[p.id],dmg:0,name:'',hits:[]};sfx('link_open');
  for(const q of G.players)if(q.id!==p.id)text(q.x,q.y-118,'LINK NOW!','#8fe6ff',true);
}
function tickLink(dt){const L=G.link;if(!L)return;L.t-=dt;if(L.t<=0)G.link=null}
const gymCost=r=>Math.round(40*Math.pow(1.3,r));
const shopCost=s=>Math.round(s.base*(1+(G.stage-1)*.35)*dn().shop);
const guardArmor=p=>(8+p.stats.grd*10+p.lvl*1.4)*(p.weapon==='shield'?1.6:1)*p.s.guardMul;
function moveVec(){let x=0,y=0;if(keys.has('KeyA')||keys.has('ArrowLeft'))x--;if(keys.has('KeyD')||keys.has('ArrowRight'))x++;if(keys.has('KeyW')||keys.has('ArrowUp'))y--;if(keys.has('KeyS')||keys.has('ArrowDown'))y++;if(joy.on){x=joy.dx;y=joy.dy}const m=Math.hypot(x,y);if(m>1){x/=m;y/=m}return{x,y}}
function doDash(){const p=G.p;if(p.rideWith){hopOut(p);return}if(p.cd.dash>0||p.stunT>0||p.grabT>0||p.webT>0)return;const v=moveVec(),a=(v.x||v.y)?Math.atan2(v.y,v.x):p.face;p.cd.dash=p.s.dashCd*cdMulOf(p);p.dashT=.26;p.dashX=Math.cos(a);p.dashY=Math.sin(a);p.inv=Math.max(p.inv,.32+Math.min(3,(p.runBoons||{}).wide||0)*.12);sfx('dash')}
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
  p.unstuckT=Math.max(0,(p.unstuckT||0)-dt);p.tpT=Math.max(0,(p.tpT||0)-dt);p.specT=Math.max(0,(p.specT||0)-dt);tickAbility(p,dt);p.healFx=Math.max(0,(p.healFx||0)-dt);p.pillT=Math.max(0,(p.pillT||0)-dt);updateMove(p,dt);const v=moveVec();p.sprint=canSprint(p,v);if(p.sprint)p.mana=Math.max(0,p.mana-SPRINT.mana*dt);const drag=archKey(p.char)==='scout'&&p.reviveTarget?G.players.find(q=>q.id===p.reviveTarget&&q.deadT>0):null,ox=p.x,oy=p.y,sp=envSpeed(p)*p.s.speed*abilSpeed(p)*(p.sprint?SPRINT.mul:1)*(auraHas(p,'scout')?1.08:1)*(drag?.5:1)*(p.fastT>0?1.4:1)*(p.guard?.55:1)*(p.mv?.3:1)*(p.beam?0:p.chg>0?CHARGE.slow:1)*chainBonus().spd*timeHaste(p)*sigSpeed(p);p.timeBuffT=Math.max(0,(p.timeBuffT||0)-dt);p.moving=!!(v.x||v.y)&&!p.beam;
  if(p.lungeT>0)lungeStep(p,dt);
  else if(p.dashT>0&&!(p.webT>0)){p.dashT-=dt;move(p,p.dashX*520*dt,p.dashY*520*dt)}
  else{move(p,v.x*sp*dt,v.y*sp*dt);if(p.moving){p.walk+=dt*11*(p.sprint?SPRINT.stride:1);p.moveA=Math.atan2(v.y,v.x)}}
  if(drag)move(drag,p.x-ox,p.y-oy);
  if(touchMode){const n=nearestEnemy();if(n)p.face=Math.atan2(n.y-p.y,n.x-p.x);else if(p.moving)p.face=Math.atan2(v.y,v.x)}else p.face=Math.atan2(mouse.y-(p.y-22),mouse.x-p.x);
  /* A click uses a readied ability; that click is spent and does not attack until the button is let go. */
  if(!mouse.left)p.clickLatch=0;else if(p.abil&&!keepsAttack(p)&&!p.clickLatch){p.clickLatch=1;doUse()}
  /* Tap to attack; hold to charge, let go to fire. A beam keeps facing where it was fired. */
  chargeStep(p,(mouse.left&&!p.clickLatch&&(!p.abil||keepsAttack(p)))||(touchHold.slash&&(!p.abil||keepsAttack(p))),dt);if(p.burst)burstStep(p,dt);
  if(p.beam){p.face=p.beam.a;beamStep(p,dt)}
  /* Toxin Alchemist passive, Toxic Aura: poison every enemy within reach once a second */
  if(p.char==='Toxin Alchemist'&&!(p.deadT>0)){p.auraT=(p.auraT||1)-dt;if(p.auraT<=0){p.auraT=1;for(const e of G.enemies.slice())if(foeAlive(e)&&dist(e,p)<TOXIC_AURA.r+e.r){hitEnemy(e,basicHit(p)*TOXIC_AURA.mul,Math.atan2(e.y-p.y,e.x-p.x),0,false);burst(e.x,e.y-20,'#8cf046',4,60)}}}
  tagOwned(p);
  /* Carry steps: walk over an item to lift it, walk into the drop zone to deliver it. */
  if(G.obj){const st=G.obj.steps[G.obj.i];
    if(st&&(st.kind==='carry'||st.kind==='generator')){const items=G.obj.items||[];
      if(!p.carry&&!p.mv&&!p.ult){const c=items.find(c=>!c.done&&!c.by&&dist(p,c)<28);if(c){c.by=p.id||0;p.carry=c;text(p.x,p.y-70,'Carrying','#8fd6ff',true)}}
      if(p.carry){p.carry.x=p.x;p.carry.y=p.y;const d=G.obj.vents?G.obj.vents.find(v=>!v.done&&dist(p,v)<v.r):G.obj.drop&&dist(p,G.obj.drop)<G.obj.drop.r?G.obj.drop:null;if(d){if(G.obj.vents)d.done=true;p.carry.done=true;p.carry.by=0;p.carry=null;text(p.x,p.y-70,'Delivered','#8fd6ff',true);sfx('loot')}}
      if(p.carry&&p.carry.done)p.carry=null}}
  p.nearSafe=dist(p,G.safe)<70;
  if(p.nearSafe&&!(G.swarm&&G.swarm.breakT<=0))p.hp=Math.min(p.s.maxHp,p.hp+p.s.maxHp*.08*dn().safeHeal*dt);
}
/* Shots and hazards remember who made them, so kills and leech go to the right player */
function tagOwned(p){for(const s of G.shots)if(s.from==='p'&&s.pid===undefined)s.pid=p.id;for(const h of (G.hazards||[]))if(h.from!=='e'&&h.pid===undefined)h.pid=p.id}
function update(dt){
  const real=dt;let slow=1;
  chainTick(real);tickLink(real);
  for(const p of G.players){G.p=p;if(p.ult){tickUlt(real);tagOwned(p);if(!G.mp&&p.ult)slow=p.ult.t<ULT_HITS[0]?.06:.45}else if(p.combo){p.comboT-=real;if(p.comboT<=0){p.combo=0;p.comboTier=null}}p.comboPop=Math.max(0,p.comboPop-real*4)}
  dt*=slow;bossEggTick(dt);G.t+=dt;{const h0=G.hour;G.hour=(G.hour+dt/20)%24;if(duskCrossed(h0,G.hour)&&!G.swarm&&!G.story){G.banner={t:3,a:DAYNIGHT.warn.a,b:DAYNIGHT.warn.b};sfx('boss_warn')}}objStep(dt);sideStep(dt);
  for(const p of G.players){if(p.ai)aiTurn(p,dt);else updatePlayer(p,dt)}seatStep();
  valeTick(dt);G.p=G.players[0];
  G.flowT-=dt;if(G.flowT<=0){G.flowT=.25;updateFlow()}
  // keep the streets populated: more rivals at night, more citizens by day
  const n=nightness(G.hour);G.spawnT-=dt;
  if(G.swarm)swarmTick(dt);else if(G.story)storyTick(dt);else if(G.spawnT<=0){G.spawnT=1.4;const target=Math.round((9+G.stage+Math.round(n*DAYNIGHT.crowdNight))*partyCrowd()*(MW>100?1.4:1)),count=G.enemies.filter(e=>e.kind==='rival').length;if(count<target&&!G.clearPending&&!stalkerDue()&&!lurkerDue()&&!webberDue()&&!bloaterDue()&&!shieldbearerDue()&&!scrapGolemDue())useMobs()?spawnMob(520):spawnRival(520);
    const wantN=Math.round(14*(1-n)+3);if(G.npcs.length<wantN)spawnNpc();else if(G.npcs.length>wantN)G.npcs.splice(G.npcs.findIndex(c=>!c.wounded&&dist(c,nearestPlayer(c))>500)>>>0,1)}
  if(useMobs()&&!G.clearPending&&!G.swarm&&!G.story){G.villT-=dt;if(G.villT<=0){G.villT=60;spawnVillainPair()}}
  updateNpcs(dt);tickHazards(dt);G.p=G.players[0];
  for(const c of G.w.cars){if(c.v){c.y+=c.s*dt;if(c.y<-60)c.y=MH*T+60;if(c.y>MH*T+60)c.y=-60}else{c.x+=c.s*dt;if(c.x<-60)c.x=MW*T+60;if(c.x>MW*T+60)c.x=-60}}
  tideTick(dt);lanternTick(dt);sporeBossTick(dt);scrapTick(dt);for(const q of G.players){playerStatus(q,dt);toxinStep(q,dt);rustStep(q,dt)}ghoulTick(dt)
  for(const q of G.players){if(q.lx!==undefined&&dt>0){q.vx=(q.x-q.lx)/dt;q.vy=(q.y-q.ly)/dt}q.lx=q.x;q.ly=q.y}
  for(const e of G.enemies){G.p=threatTarget(e);e.targetId=G.p?(G.p.id||0):0;const a0=e.ang;updateEnemy(e,dt);enemyVoiceWatch(e);if(e.method==='shield'&&!e.dead)e.ang=turnTo(a0||0,e.ang||0,AI.guardTurn*dt);goreTrail(e,dt)}
  for(let i=0;i<G.enemies.length;i++){const a=G.enemies[i];if(a.dead||a.fleshDown||a.scrapDown||!a.aware)continue;for(let j=i+1;j<G.enemies.length;j++){const b=G.enemies[j];if(b.dead||b.fleshDown||b.scrapDown)continue;const dx=b.x-a.x,dy=b.y-a.y,m=a.r+b.r,d2=dx*dx+dy*dy;if(d2<m*m&&d2>.01){const d=Math.sqrt(d2),o=(m-d)*.5,ox=dx/d*o,oy=dy/d*o;if(a.kind!=='boss')move(a,-ox,-oy);if(b.kind!=='boss')move(b,ox,oy)}}}
  for(const e of G.enemies)if(e.redT>0)e.redT=Math.max(0,e.redT-dt);if(G.flashT>0)G.flashT=Math.max(0,G.flashT-dt);
  G.enemies=G.enemies.filter(e=>!e.dead);
  for(const s of G.shots){s.life-=dt;
    /* homing skulls turn toward the nearest enemy */
    if(s.home&&s.from==='p'){let t=null,bd=440;for(const e of G.enemies){if(!foeAlive(e))continue;const d=Math.hypot(e.x-s.x,e.y-22-s.y);if(d<bd){bd=d;t=e}}if(t){const cur=Math.atan2(s.vy,s.vx),sp=Math.min(520,Math.hypot(s.vx,s.vy)*1.02),da=((Math.atan2(t.y-22-s.y,t.x-s.x)-cur+Math.PI)%TAU+TAU)%TAU-Math.PI,na=cur+clamp(da,-6*dt,6*dt);s.vx=Math.cos(na)*sp;s.vy=Math.sin(na)*sp;s.a=na}}
    const nx=s.x+s.vx*dt,ny=s.y+s.vy*dt;if(s.from==='p')G.p=ownerOf(s);
    if(s.lob){s.x=nx;s.y=ny;trail(s,dt);continue}
    if(wall(nx/T|0,(ny+22)/T|0)){s.life=0;if(s.from==='p'&&!s.small)explode(s);else impact(s);continue}
    s.x=nx;s.y=ny;trail(s,dt);
    if(s.from==='e'||s.from==='p'){for(const c of G.npcs){if(!c.dead&&!c.wounded&&Math.hypot(c.x-s.x,c.y-22-s.y)<c.r+s.r+3){s.life=0;if(s.from==='p'&&!s.small)explode(s);else{impact(s);hitNpc(c,s.dmg,Math.atan2(s.vy,s.vx),s.from==='p')}break}}if(s.life<=0)continue}
    if(s.from==='p'){let propHit=false;for(const c of G.props||[])if((c.kind==='egg'||c.kind==='scrapPart')&&!c.done&&Math.hypot(c.x-s.x,c.y-22-s.y)<c.r+s.r+4){if(c.kind==='egg')eggHit(c);else scrapPartHit(c,G.p);s.life=0;propHit=true;break}if(propHit)continue;for(const q of G.players)if(q!==G.p&&q.webT>0&&Math.hypot(q.x-s.x,q.y-22-s.y)<q.r+s.r+4){clearWeb(q,G.p);s.life=0;propHit=true;break}if(propHit)continue;for(const e of G.enemies){if(!e.dead&&!e.fleshDown&&!e.scrapDown&&!(s.hitTargets&&s.hitTargets.includes(e))&&Math.hypot(e.x-s.x,e.y-22-s.y)<e.r+s.r+4){if(s.small){impact(s);if(s.stag)stagger(e,Math.atan2(s.vy,s.vx),s.kb||90,false);hitEnemy(e,s.dmg,Math.atan2(s.vy,s.vx),s.kb||90);if(s.pierce>0){G.fx.push({k:'pierceFx',x:s.x,y:s.y,a:Math.atan2(s.vy,s.vx),t:.22,m:.22});(s.hitTargets||(s.hitTargets=[])).push(e);s.pierce--}else s.life=0}else{s.life=0;explode(s)}break}}}
    else for(const q of G.players){if(!(q.respawnT>0)&&Math.hypot(q.x-s.x,q.y-22-s.y)<q.r+s.r+2){s.life=0;G.p=q;if(s.web&&!(q.inv>0||q.deadT>0)){q.webT=WEBBED.webTime;q.dashT=0;G.banner={t:2.5,a:'Webbed',b:G.players.length>1?'An ally can attack the web to free you':'The web breaks after 5 seconds'};text(q.x,q.y-70,'WEBBED','#e6e6c8',true)}hurtPlayer(s.dmg);impact(s);break}}}
  for(const s of G.shots)if(s.life<=0&&s.breaks&&!s.pooled){s.pooled=s.pooled||!s.pool;if(s.from==='p'){G.p=ownerOf(s);explode(s)}else{impact(s,s.blast);for(const q of G.players){G.p=q;if(Math.hypot(q.x-s.x,q.y-22-s.y)<s.blast+q.r)hurtPlayer(s.dmg)}}}
  G.shots=G.shots.filter(s=>s.life>0);G.enemies=G.enemies.filter(e=>!e.dead);
  G.loot=G.loot.filter(l=>{l.t+=dt;const p=nearestPlayer(l,true);G.p=p;const d=dist(l,p),mag=(l.kind==='item'||(l.kind==='weapon'&&!p.weapons.includes(l.w)))?0:96;if(mag&&d<mag){const a=Math.atan2(p.y-l.y,p.x-l.x);l.x+=Math.cos(a)*300*dt;l.y+=Math.sin(a)*300*dt}if(d<(l.kind==='item'||l.kind==='weapon'?30:18)){pickup(l);return false}return true});
  if(G.shadeUp&&!shadesAlive()){G.shadeUp=false;G.shadeDone=true;G.banner={t:2.6,a:'The way is open',b:'The boss awaits at the gate'}}
  for(const q of alivePlayers()){if(G.gate.open&&!G.boss&&!G.clearPending&&!G.shadeUp&&!(q.deadT>0||q.respawnT>0)&&dist(q,G.gate)<46){G.p=q;if(needShades())summonShades();else summonBoss()}}
  if(G.clearPending){G.clearPending-=dt;if(G.clearPending<=0){G.clearPending=0;if(G.mode==='play')setMode('clear')}}
  fleshTick(dt);G.p=G.players[0];tickFx(dt);
  if(G.banner){G.banner.t-=dt;if(G.banner.t<=0)G.banner=null}
}
function fearedPlayer(c){let found=null,bd=170;for(const p of alivePlayers()){const d=dist(p,c);if((p.killerT||0)>0&&d<bd){found=p;bd=d}}return found}
function updateNpcs(dt){const boss=!!G.boss;G.quipT-=dt;for(const p of G.players)p.killerT=Math.max(0,(p.killerT||0)-dt);
  for(const c of G.npcs){if(c.dead)continue;const p=nearestPlayer(c);G.p=p;if(c.wounded){c.moving=false;continue}if(c.fixed){c.qt=Math.max(0,c.qt-dt);continue}c.t-=dt;c.qt=Math.max(0,c.qt-dt);c.scare=Math.max(0,c.scare-dt);c.flash=Math.max(0,c.flash-dt);
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
/* How high a thrown or lobbed shot is above its ground track right now. */
const thrownLift=s=>{const k=v=>Math.sin(clamp(v,0,1)*Math.PI);return s.lob?k((s.age||0)/s.lob)*90:s.hopT?k((s.age||0)/s.hopT)*(THROWN_HOP[s.fx]||12):0};
/* Thrown objects hop as they fly (height in units) and spin; the rest fly flat. */
const THROWN_HOP={flask:22,skull:14,card:10},THROWN_SPIN={flask:15,skull:11,card:22};
function trail(s,dt){const c=s.col||'255,200,120',f=s.fx;s.age=(s.age||0)+dt;s.tr=(s.tr||0)-dt;s.spin=(s.spin||0)+dt*(THROWN_SPIN[f]||6);if(s.tr>0)return;s.tr=f==='comet'?.012:.03;
  if(f==='comet'){glowP(s.x,s.y,c,2,50,.5,5);glowP(s.x,s.y,'255,255,255',1,20,.2,2)}else if(f==='orb'||f==='arcane'||f==='skull')glowP(s.x,s.y,c,1,40,.45,4);else if(f==='ember'){glowP(s.x,s.y,'255,140,50',2,60,.5,4)}else if(f==='flask'){glowP(s.x,s.y-thrownLift(s),c,1,30,.5,3.5);if(Math.random()<.5)G.fx.push({k:'p',x:s.x+rnd(-3,3),y:s.y-thrownLift(s)+4,vx:rnd(-10,10),vy:rnd(30,70),t:.35,m:.35,c:'rgb('+c+')',s:rnd(1.5,3)})}else if(f==='plasma')glowP(s.x,s.y,c,1,30,.25,3);else if(f==='card')glowP(s.x,s.y,c,1,50,.35,2.5)}
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
function rustStep(p,dt){if(G.stage!==7||p.deadT>0||p.respawnT>0)return;const night=dn().id==='night',safe=dist(p,G.safe)<70&&!(G.swarm&&G.swarm.breakT<=0);p.rust=clamp((p.rust||0)+(night&&!safe?RUST.gain:-RUST.clean)*dt,0,RUST.max)}
function spawnScrapGolem(){const e=spawnMob(500,null,true);if(!e)return null;e.scrapGolem=true;e.role='brute';e.hp*=1.4;e.maxHp*=1.4;e.sp*=.8;e.aware=true;return e}
const scrapGolemDue=()=>G.stage===7&&G.enemies.filter(e=>!e.dead&&e.scrapGolem).length<Math.round(RUST.golemCap*partyCrowd())&&spawnScrapGolem();
function clearScrap(){G.props=G.props.filter(c=>c.kind!=='scrapPart')}
function scrapSpot(e,dx,other){let best=null,bd=Infinity;for(const i of G.w.open){const o={x:(i%MW+.5)*T,y:((i/MW|0)+.5)*T};if(blocked(o.x,o.y,14)||other&&dist(o,other)<35||G.arena&&dist(o,G.arena)>G.arena.r-14)continue;const d=Math.hypot(o.x-e.x-dx,o.y-e.y);if(d<bd){bd=d;best=o}}return best||{x:e.x,y:e.y}}
function scrapDisable(e){if(e.scrapDown)return;e.hp=0;e.scrapDown=true;e.scrapT=RUST.rebuild;e.flash=0;e.wind=0;e.rotT=0;e.moving=false;const a=scrapSpot(e,-34),b=scrapSpot(e,34,a);for(const o of[a,b])addProp('scrapPart',o.x,o.y,14,{golem:e});text(e.x,e.y-90,'BREAK THE PARTS','#ffd080',true);G.banner={t:2.5,a:'Scrap Golem down',b:soloPlay()?'Break both parts before it rebuilds':'Two players must break its parts'};sfx('boom')}
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
/* Stage 5: spores slowly build toxin outside the haven, active vents and clean springs; spore clouds build it faster.
   Full toxin hurts gently (1.5% of life every 2 s) and never takes you below 20% life. Clean springs, scattered over
   the map, clear it fast while you stand in them. */
const SPORE={fill:.5,cloudFill:4,clean:14,drain:.015,every:2,floor:.2,cloudT:8,cloudR:95,bloaterCap:2,fuse:1.2},SPRING={n:8,r:110,clean:25,gap:700};
function springInit(){if(G.stage!==5||G.story)return;const at=[];for(let i=0;i<SPRING.n;i++){let o=null,best=-1;for(let t=0;t<30;t++){const c=propSpot(350,4200),g=Math.min(Infinity,...at.map(s=>Math.hypot(s.x-c.x,s.y-c.y)),Math.hypot(c.x-G.safe.x,c.y-G.safe.y));if(g>SPRING.gap){o=c;break}if(g>best){best=g;o=c}}at.push(o);addProp('spring',o.x,o.y,SPRING.r,{done:true})}}
const inSpring=p=>(G.props||[]).some(v=>v.kind==='spring'&&dist(p,v)<SPRING.r);
function sporeCloud(e){G.hazards.push({x:e.x,y:e.y,r:SPORE.cloudR,t:SPORE.cloudT,from:'e',col:'130,200,65',spore:true});G.fx.push({k:'ring',x:e.x,y:e.y,r:8,to:SPORE.cloudR,t:.4,m:.4,c:'#a8e668'});sfx('boom')}
function toxinStep(p,dt){if(G.stage!==5||p.deadT>0||p.respawnT>0||G.clearPending)return;const spring=inSpring(p),clean=spring||dist(p,G.safe)<100&&!(G.swarm&&G.swarm.breakT<=0)||(G.props||[]).some(v=>v.kind==='vent'&&v.done&&dist(p,v)<110)||(G.boss&&(G.boss.kit||G.stage)===5&&cleanSporeAt(p));const inCloud=(G.hazards||[]).some(h=>h.spore&&h.t>0&&dist(p,h)<h.r+p.r),before=p.toxin||0;p.toxin=clamp((p.toxin||0)+(clean?-(spring?SPRING.clean:SPORE.clean):SPORE.fill+(inCloud?SPORE.cloudFill:0))*dt,0,100);if(p.toxin>=100){if(before<100)text(p.x,p.y-80,'TOXIN FULL · find a clean spring','#b8ec72',true);p.toxinTick=(p.toxinTick||0)-dt;if(p.toxinTick<=0){p.toxinTick=SPORE.every;if(p.hp>p.s.maxHp*SPORE.floor){const me=G.p;G.p=p;const keep=p.hp;hurtPlayer(p.s.maxHp*SPORE.drain);if(p.hp<p.s.maxHp*SPORE.floor&&keep>=p.s.maxHp*SPORE.floor)p.hp=p.s.maxHp*SPORE.floor;G.p=me}}}else p.toxinTick=0}
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
const envSpeed=p=>{if(p.stunT>0||p.grabT>0||p.webT>0)return 0;let k=1;if((G.tide||0)>0&&!dryAt(p)&&!batForm(p))k*=1-TIDE.slow*G.tide;if(p.possT>0)k*=.5;return k};
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
function updateEnemy(e,dt){chronoTrack(e,dt);if(e.kind==='boss'||e.shade)escapeCheck(e);if(e.shade&&e.lives===1&&G.t-(e.lastHit||0)>SHADE.regenWait)e.hp=Math.min(e.maxHp,e.hp+e.maxHp*SHADE.regen*dt);
  if(e.dead||e.fleshDown||e.scrapDown)return;threatDecay(e,dt);const p=G.p;e.tauntT=Math.max(0,(e.tauntT||0)-dt);e.markT=Math.max(0,(e.markT||0)-dt);e.brokenT=Math.max(0,(e.brokenT||0)-dt);e.exposedT=Math.max(0,(e.exposedT||0)-dt);e.statusT=Math.max(0,(e.statusT||0)-dt);e.shatterT=Math.max(0,(e.shatterT||0)-dt);e.slowT=Math.max(0,(e.slowT||0)-dt);
  if(e.rotT>0&&!bossWarded(e)){e.rotT=Math.max(0,e.rotT-dt);const rotBy=G.players.find(x=>(x.id||0)===(e.rotBy||0)),was=G.p;if(rotBy)G.p=rotBy;e.hp-=e.rotRate*dt;if(e.kind==='boss'&&[6,7].includes(e.kit||G.stage))bossPhaseCheck(e);e.flash=Math.max(e.flash||0,.05);if(e.hp<=0){killEnemy(e);G.p=was;return}G.p=was}
  if(e.frozenT>0){e.frozenT=Math.max(0,e.frozenT-dt);e.moving=false;return}
  if(e.scaredT>0)e.scaredT=Math.max(0,e.scaredT-dt);
  if(e.voidT>0){e.voidT=Math.max(0,e.voidT-dt);e.moving=false;return}
  if(e.stunT>0){e.stunT=Math.max(0,e.stunT-dt);e.moving=false;return}
  if((e.retreat||e.bornNight)&&dawnRetreat(e,dt))return;
  /* An invisible target: the enemy loses track and stands still until it can see someone again */
  if(p&&abilStealth(p)&&e.kind!=='boss'){e.aware=false;e.moving=false;e.wind=0;return}e.moving=false;e.cd-=dt;e.flash=Math.max(0,e.flash-dt);e.atkShow=Math.max(0,e.atkShow-dt);e.castT=Math.max(0,(e.castT||0)-dt);
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
/* ---------- Boss final attack ----------
   Once per fight, at a quarter of its life, a boss stops and gathers itself while a full-screen scene plays, then
   locks onto the nearest player and shows the danger zone for a moment before striking: a circle where you stood, a
   wide line, or a huge ring around itself. It hits very hard (scaled to the boss, and at least about half your life
   before armour). Dashing through it, or leaving the zone in time, avoids it. */
const FINAL={on:true,at:.25,wind:2.2,tel:.9,mul:3.5,share:.55,
  names:{'Crystal Scurrier':'Shard Storm','Gloom Eye':'Abyssal Gaze','Banshee Phantasm':'Death Wail','Chitin Horror':'Carapace Cataclysm','Spore Brute':'Rot Bloom','Flesh Amalgam':'Feast of Flesh','Rusted Ghoul':'Iron Requiem','Cyber Dread':'Overload Protocol','Void Weaver':'The Unmaking','Nameless King':'The Last Night'},
  shape:{'Crystal Scurrier':['slam',170],'Gloom Eye':['beam',60],'Banshee Phantasm':['nova',330],'Chitin Horror':['slam',160],'Spore Brute':['slam',190],'Flesh Amalgam':['nova',300],'Rusted Ghoul':['beam',70],'Cyber Dread':['beam',55],'Void Weaver':['slam',200],'Nameless King':['slam',230]}};
const finalShape=e=>FINAL.shape[e.art]||['nova',280];
/* Is a player inside the locked zone? */
function inFinal(q,z,e){if(z.k==='nova')return Math.hypot(q.x-e.x,q.y-e.y)<z.r+(q.r||12);if(z.k==='slam')return Math.hypot(q.x-z.x,q.y-z.y)<z.r+(q.r||12);
  const dx=q.x-z.x,dy=q.y-z.y,along=dx*Math.cos(z.a)+dy*Math.sin(z.a),side=Math.abs(-dx*Math.sin(z.a)+dy*Math.cos(z.a));return along>-20&&along<z.len&&side<z.r+(q.r||12)}
function bossFinal(e){
  if(e.act!=='final'){if(!FINAL.on||e.finalDone||e.kind!=='boss'||e.act==='rise'||e.hp>e.maxHp*FINAL.at)return false;
    e.finalDone=true;e.act='final';e.finPh=0;e.actT=FINAL.wind;e.tel=null;e.wind=0;e.moving=false;e.finalAim=null;
    G.fx.push({k:'bossult',art:e.art,name:e.name,move:FINAL.names[e.art]||'Final assault',x:e.x,y:e.y,t:FINAL.wind+.3,m:FINAL.wind+.3});
    shake(6);sfx('boss_roar');text(e.x,e.y-(e.ah||100)-10,'Final attack','#ff8f80',true)}
  e.moving=false;if(e.actT>0)return true;
  if(e.finPh===0){const foe=alivePlayers().sort((a,b)=>dist(a,e)-dist(b,e))[0]||G.p,[k,r]=finalShape(e);
    e.finalAim=k==='beam'?{k,x:e.x,y:e.y,a:Math.atan2(foe.y-e.y,foe.x-e.x),r,len:900}:k==='slam'?{k,x:foe.x,y:foe.y,r}:{k,x:e.x,y:e.y,r};
    e.finPh=1;e.actT=FINAL.tel;e.ang=Math.atan2(foe.y-e.y,foe.x-e.x);return true}
  const z=e.finalAim;
  for(const q of alivePlayers())if(inFinal(q,z,e)){const me=G.p;G.p=q;hurtPlayer(Math.max(e.dmg*FINAL.mul,q.s.maxHp*FINAL.share));G.p=me}
  G.fx.push({k:'finalfx',z,ex:e.x,ey:e.y,art:e.art,t:.55,m:.55});G.hitStop=Math.max(G.hitStop||0,.12);shake(18);sfx('boom');
  e.finalAim=null;e.finPh=0;e.act='walk';e.actT=1.2;e.cd=1;return true}
function updateBoss(e,dt,d,seen){
  const p=G.p,n=e.kit||G.stage,low=e.hp<e.maxHp*.5;e.actT-=dt;e.hitCd=Math.max(0,e.hitCd-dt);e.ang=e.ang||0;
  e.recover=Math.max(0,e.recover-dt);e.recoil=Math.max(0,e.recoil-dt);e.release=Math.max(0,e.release-dt);
  if((e.staggerT||0)>0){e.staggerT=Math.max(0,e.staggerT-dt);e.moving=false;if(Math.random()<.12)burst(e.x+rnd(-e.r,e.r),e.y-16,'#ffd860',1,50);return}
  if((e.breatherT||0)>0){e.breatherT=Math.max(0,e.breatherT-dt);e.moving=false;e.tel=null;return}
  if(bossFinal(e))return;
  bossEnrage(e,dt);if(n===1)bossPillarRegen(e,dt);
  e.eyeT=Math.max(0,(e.eyeT||0)-dt);e.ghostT=Math.max(0,(e.ghostT||0)-dt);
  if(bossActStage(e,dt,d,seen,p,n))return;
  if(e.act==='charge'){e.trail.push({x:e.x,y:e.y});if(e.trail.length>4)e.trail.shift()}else if(e.trail.length)e.trail.shift();
  if(e.act==='rise'){if(Math.random()<.5)burst(e.x+rnd(-e.r,e.r),e.y,'#8a8478',2,90);if(e.actT<=0){e.act='walk';e.actT=rnd(1,1.8)}return}
  const before=Math.sin((e.walk||0)*BOSS_RATE(e));
  e.punishCd=Math.max(0,(e.punishCd||0)-dt);
  if(e.act==='walk'){
    if(e.punishCd<=0&&seen&&aiOpen(p)){e.punishCd=AI.bossPunishCd;e.actT=Math.min(e.actT,.1);e.cd=Math.min(e.cd,.1)}
    if(d>e.r+p.r+6)steer(e,dt,e.sp*(n===6&&e.fleshSplit&&soloPlay()?FLESH.soloSpeed:n===4?(e.phase>=2?1.5:1):(low?1.25:1)),seen);
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
