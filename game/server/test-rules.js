'use strict';
/* Rules with several players, no network. Run with: node test-rules.js */
const s=require('./sim'),assert=require('assert');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;console.log('  ok  '+m)};
const T=s.test,mk=()=>({clients:new Map(),ev:null});
const room=mk(),a=s.createRoom(room,'Detective',null,'A'),b=s.addPlayer(room,'Firefighter',null,'B');const G=()=>T.G;
/* Several tests park an enemy 40 units east of a player. Require an open neighbour so a wall cannot make the case impossible. */
const openEast=()=>{const W=G().w;return W.open.find(c=>c%78<77&&!W.map[c+1]&&Math.hypot((c%78+.5)*40-G().safe.x,((c/78|0)+.5)*40-G().safe.y)>500)};
const step=(k=1)=>{for(let i=0;i<k;i++){s.step(room,1/30);room.ev.length=0}};
T.enter(room);
const cityA=T.genCitySeeded(12345),cityB=T.genCitySeeded(12345);ok(cityA.boss.x===cityB.boss.x&&cityA.boss.y===cityB.boss.y&&Buffer.from(cityA.map).equals(Buffer.from(cityB.map)),'party runner reconstructs a seeded map deterministically');
ok(new Set(G().players.map(p=>p.id)).size===2,'two players, different ids');
const solo=mk(),sp=s.createRoom(solo,'Detective',null,'S');T.enter(solo);const soloHp=G().enemies[0].maxHp/ (G().enemies[0].mob==='strong'?3.2:.6);T.enter(room);
// Membership changes rescale living enemies without changing their life percentage.
const scaleRoom=mk(),scalePlayers=[s.createRoom(scaleRoom,'Detective',null,'Scale')];T.enter(scaleRoom);T.summonBoss();const boss=G().boss,minion=G().enemies.find(e=>e.mob),baseBossHp=boss.maxHp,baseBossDmg=boss.dmg,baseMinionHp=minion.maxHp,baseMinionDmg=minion.dmg;boss.hp*=.37;minion.hp*=.6;
for(let i=1;i<4;i++){scalePlayers.push(s.addPlayer(scaleRoom,'Detective',null,'Scale'));T.enter(scaleRoom);ok(Math.abs(boss.maxHp/baseBossHp-[1,2,4,8][i])<1e-8&&Math.abs(boss.dmg/baseBossDmg-[1,2,4,8][i])<1e-8&&Math.abs(boss.hp/boss.maxHp-.37)<1e-8,'boss scales on join '+(i+1));ok(Math.abs(minion.maxHp/baseMinionHp-[1,1.6,2.2,2.8][i])<1e-8&&minion.dmg===baseMinionDmg&&Math.abs(minion.hp/minion.maxHp-.6)<1e-8,'minion scales on join '+(i+1));ok(T.quota(1)===Math.ceil(8*[1,1.4,1.8,2.2][i]),'quota scales for '+(i+1));ok(Math.abs(T.bossUltDamage(boss,0)/boss.maxHp*(i+1)-.04)<1e-10,'ultimates share boss percent damage for '+(i+1))}
for(let i=3;i>0;i--){s.removePlayer(scaleRoom,scalePlayers[i]);T.enter(scaleRoom);ok(Math.abs(boss.maxHp/baseBossHp-[1,2,4,8][i-1])<1e-8&&Math.abs(boss.hp/boss.maxHp-.37)<1e-8,'boss rescales on leave to '+i)}
ok(T.quota(1)===8,'solo quota unchanged');T.enter(solo);ok(G().players.length===1&&G().enemies[0].maxHp/(G().enemies[0].mob==='strong'?3.2:.6)===soloHp,'another room is untouched');T.enter(room);
// Citizen fear belongs to the player responsible, including when another ally is closer.
T.enter(room);const witness={x:a.x+70,y:a.y},victim=G().npcs[0];G().p=a;T.hitNpc(victim,1e9,0,true);b.x=witness.x+10;b.y=witness.y;ok(a.killerT===45&&!b.killerT,'civilian kill marks only its owner');ok(T.fearedPlayer(witness)===a,'citizen fears the killer even when an ally is closer');a.x=witness.x+200;ok(!T.fearedPlayer(witness),'citizen does not fear an innocent nearby ally');a.killerT=b.killerT=0;
// Objective NPCs can use a display name without a matching art spec.
{const c={name:'Scout',art:'Tourist',x:a.x+20,y:a.y,r:9,hp:1,maxHp:40,wounded:true};G().npcs=[c];G().p=a;T.hitNpc(c,10,0,true);ok(c.dead&&a.killerT===45,'killing the wounded scout uses fallback art and credits the player');a.killerT=0}
// Attack credit
a.x=G().safe.x;a.y=G().safe.y;
const e=G().enemies.find(x=>x.kind==='rival');e.x=a.x+30;e.y=a.y;e.hp=1;a.input.ax=a.x+30;a.input.ay=a.y-22;a.input.l=true;const ka=a.kills,kb=b.kills,xb=b.xp,la=b.lvl;
for(let i=0;i<20&&a.kills===ka;i++){e.x=a.x+30;e.y=a.y;step()}a.input.l=false;
ok(a.kills===ka+1&&b.kills===kb,'the kill goes to the player who made it');ok(b.xp>xb||b.lvl>la,'both players earn the experience');ok(a.combo===1&&b.combo===0,'combo belongs to the killer only');
// Enemy targets nearest
const f=G().enemies.find(x=>x.kind==='rival'&&!x.dead);G().enemies=[f];{const c=openEast();b.x=(c%78+.5)*40;b.y=((c/78|0)+.5)*40}a.x=G().safe.x;a.y=G().safe.y;a.hp=a.s.maxHp;f.x=b.x+40;f.y=b.y;f.aware=true;f.a.melee=true;f.method='melee';f.cd=0;f.wind=0;f.dmg=5;const ha=a.s.maxHp;b.inv=0;b.hp=b.s.maxHp;
const hb=b.hp;let hurtB=false;for(let i=0;i<60&&!hurtB;i++){f.x=b.x+24;f.y=b.y;G().enemies=[f];step();b.inv=0;hurtB=b.hp<hb}ok(hurtB&&a.hp===ha,'enemies hit the player beside them, not the far one');
// Downed, revive, repeat penalty and bleed-out.
T.enter(room);G().enemies=[];a.x=G().safe.x;a.y=G().safe.y;b.x=a.x+30;b.y=a.y;b.hp=1;b.inv=0;b.gold=100;G().p=b;T.hurtPlayer(9999);ok(b.deadT===20&&b.hp===0&&b.gold===100,'downed for 20 seconds without losing gold');
const oldX=b.x;b.input.x=1;step(15);b.input.x=0;ok(b.x>oldX,'downed players can crawl');b.x=a.x+30;b.y=a.y;
for(let i=0;i<100&&b.deadT>0;i++){if(i%6===0)a.actions.push({n:'revive',v:true});step()}ok(b.deadT===0&&b.hp>=b.s.maxHp*.35&&b.hp<b.s.maxHp*.36&&b.inv>0,'ally revives at 35 percent life');
T.enter(room);G().p=b;b.inv=0;T.hurtPlayer(9999);ok(b.deadT===15,'a repeat down within 60 seconds shortens bleed-out');a.actions.push({n:'revive',v:true});step(8);const progress=a.reviveProgress;a.x=b.x+200;step(1);ok(progress>0&&a.reviveProgress===0,'moving away cancels revive progress');
b.deadT=.01;step(1);ok(b.respawnT>0&&b.gold===80,'bleed-out starts respawn and costs gold');step(241);ok(b.respawnT===0&&b.hp===b.s.maxHp,'bleed-out respawns at the safehouse');
// Solo Second Wind is once per stage and costs no gold.
const wind=mk(),wp=s.createRoom(wind,'Detective',null,'Wind');T.enter(wind);G().mp=false;G().enemies=[];wp.gold=100;wp.hp=1;wp.inv=0;T.hurtPlayer(9999);ok(wp.deadT===3&&wp.gold===100,'solo Second Wind starts without gold loss');for(let i=0;i<91;i++){s.step(wind,1/30);wind.ev.length=0}ok(wp.deadT===0&&wp.hp>0&&wp.secondWind,'Second Wind revives once');const onlineSolo=mk(),os=s.createRoom(onlineSolo,'Detective',null,'Solo');T.enter(onlineSolo);G().enemies=[];os.hp=1;os.inv=0;T.hurtPlayer(9999);ok(os.windDown&&os.deadT===3,'one online player also gets Second Wind');for(let i=0;i<91;i++)s.step(onlineSolo,1/30);ok(os.hp>0&&!os.deadT,'online Second Wind revives');T.enter(room);
// Medic range and speed, Scout dragging, and checked revive input.
const rr=mk(),med=s.createRoom(rr,'Exorcist',null,'Medic'),down=s.addPlayer(rr,'Detective',null,'Down'),scout=s.addPlayer(rr,'Vigilante',null,'Scout');T.enter(rr);G().enemies=[];med.x=G().safe.x;med.y=G().safe.y;down.x=med.x+90;down.y=med.y;scout.x=med.x+300;scout.y=med.y;G().p=down;down.hp=1;down.inv=0;T.hurtPlayer(9999);
med.actions.push({n:'revive',v:'true'});s.step(rr,1/30);ok(!med.reviveHold&&!med.reviveProgress,'non-boolean revive input is rejected');for(let i=0;i<47&&down.deadT>0;i++){if(i%6===0)med.actions.push({n:'revive',v:true});s.step(rr,1/30)}ok(down.deadT===0,'Medic revives from 90 units in 1.5 seconds');
T.enter(rr);G().p=down;down.inv=0;T.hurtPlayer(9999);med.x=down.x+300;scout.x=down.x-20;scout.y=down.y;scout.input.x=-1;const sx=scout.x,dx=down.x;for(let i=0;i<9;i++){if(i%6===0)scout.actions.push({n:'revive',v:true});s.step(rr,1/30)}scout.input.x=0;ok(scout.x<sx&&down.x<dx&&Math.abs((scout.x-sx)-(down.x-dx))<.1,'Scout drags an ally while reviving');
T.enter(rr);down.inv=0;const before=down.deadT;G().p=down;T.hurtPlayer(1);ok(Math.abs(down.deadT-(before-3))<.01,'a hit shortens the bleed-out timer');T.enter(room);
// Two simultaneous revivers do not revive the same ally twice or keep stale progress.
{const r=mk(),a=s.createRoom(r,'Detective',null,'R1'),b=s.addPlayer(r,'Guardian',null,'Down'),c=s.addPlayer(r,'Firefighter',null,'R2');T.enter(r);G().enemies=[];for(const p of [a,b,c]){p.x=G().safe.x;p.y=G().safe.y}b.deadT=10;b.hp=0;a.reviveTarget=c.reviveTarget=b.id;a.reviveProgress=c.reviveProgress=.999;a.actions.push({n:'revive',v:true});c.actions.push({n:'revive',v:true});s.step(r,1/30);ok(!b.deadT&&b.hp>=b.s.maxHp*.35&&b.hp<b.s.maxHp*.36&&!c.reviveProgress&&!c.reviveTarget,'simultaneous revivers finish once and clear the second target')}
// Hope is shared and a wipe retries the latest available checkpoint.
const hr=mk(),h1=s.createRoom(hr,'Detective',null,'H1'),h2=s.addPlayer(hr,'Firefighter',null,'H2');T.enter(hr);G().enemies=[];ok(G().hope===4&&G().hopeMax===4,'two-player party starts with four Hope');h1.deadT=.001;h1.hp=0;s.step(hr,1/30);ok(G().hope===3&&h1.respawnT>0,'bleed-out spends one shared Hope');
G().hopeSpent=4;G().hope=0;const h3=s.addPlayer(hr,'Detective',null,'H3');T.enter(hr);ok(G().hope===1&&G().hopeMax===5,'joining changes capacity while preserving spent Hope');s.removePlayer(hr,h3);T.enter(hr);ok(G().hope===0&&G().hopeMax===4,'leaving preserves spent Hope');const h4=s.addPlayer(hr,'Detective',null,'H4');T.enter(hr);ok(G().hope===1,'rejoining cannot erase spent Hope');s.removePlayer(hr,h4);T.enter(hr);
h1.respawnT=0;h1.deadT=.001;h2.deadT=0;h2.hp=h2.s.maxHp;s.step(hr,1/30);ok(h1.respawnT>0&&G().hope===0,'zero Hope does not wipe while an ally is standing');
T.enter(hr);G().killsStage=5;h1.respawnT=5;h2.deadT=.001;h2.hp=0;const lvl=h2.lvl,xp=h2.xp;s.step(hr,1/30);ok(G().hope===4&&G().killsStage===0&&h1.hp===h1.s.maxHp&&h2.hp===h2.s.maxHp,'wipe resets stage checkpoint and refills Hope');ok(h2.lvl===lvl&&h2.xp===xp&&!h1.deadT&&!h1.respawnT,'wipe keeps progress and clears downed states');
T.enter(hr);G().gate.open=true;G().killsStage=15;T.summonBoss();G().boss.hp*=.2;G().hope=0;G().hopeSpent=G().hopeMax;h1.deadT=2;h1.hp=0;h2.deadT=.001;h2.hp=0;G().shots.push({x:1,y:1,vx:0,vy:0,life:10,from:'e'});G().hazards.push({x:1,y:1,t:10,from:'e'});s.step(hr,1/30);ok(!G().boss&&G().gate.open&&G().killsStage===15&&G().hope===4,'boss wipe restores the gate checkpoint');ok(!G().shots.length&&!G().hazards.length&&!T.blocked(h1.x,h1.y,h1.r)&&!T.blocked(h2.x,h2.y,h2.r),'retry clears threats and places players on walkable ground');h1.x=G().gate.x;h1.y=G().gate.y;s.step(hr,1/30);ok(!!G().boss&&G().boss.hp===G().boss.maxHp,'party can start a fresh boss after a wipe');T.enter(room);
// Auras cover both rosters, affect nearby allies, and stop when their owner is down.
const ar=mk(),ap=s.createRoom(ar,'Detective',null,'Aura'),aq=s.addPlayer(ar,'Vigilante',null,'Scout');T.enter(ar);G().enemies=[];for(const side of Object.values(T.ROSTER))for(const ch of Object.keys(side))assert.ok(T.auraOf({char:ch}),'aura for '+ch);ok(true,'every hero and villain has an aura');ap.x=G().safe.x;ap.y=G().safe.y;aq.x=ap.x+100;aq.y=ap.y;ok(T.auraHas(ap,'scout')&&T.auraHas(aq,'shooter'),'auras apply to nearby allies and owner');aq.x=ap.x+400;ok(!T.auraHas(ap,'scout'),'auras do not reach distant allies');aq.x=ap.x+30;aq.deadT=10;ok(!T.auraHas(ap,'scout'),'a downed owner does not project an aura');aq.deadT=0;G().p=aq;ok(Math.abs(T.dmgMul()-1.08)<1e-9,'Marksman aura increases allied damage');const bruiser=s.addPlayer(ar,'Guardian',null,'Bruiser');T.enter(ar);bruiser.x=ap.x;bruiser.y=ap.y;ap.x=bruiser.x+30;ap.y=bruiser.y;ap.s.armor=0;ap.hp=ap.s.maxHp;ap.inv=0;G().p=ap;T.hurtPlayer(100);ok(Math.abs(ap.s.maxHp-ap.hp-92)<1e-8,'Bruiser aura reduces allied damage');s.removePlayer(ar,bruiser);T.enter(ar);
// Upgrade actions check ownership, safety, affordability and the two-level cap.
ap.gold=500;ap.nearSafe=false;ap.actions.push({n:'upgrade',v:'pistol'});s.step(ar,1/30);ok(!T.upgradeLevel(ap,'pistol')&&ap.gold===500,'upgrade is rejected away from the safehouse');ap.nearSafe=true;ap.actions.push({n:'upgrade',v:'__proto__'},{n:'upgrade',v:{id:'pistol'}},{n:'upgrade',v:'axe'});s.step(ar,1/30);ok(ap.gold===500&&!T.upgradeLevel(ap,'pistol'),'invalid and unowned upgrades are rejected');ap.nearSafe=true;ap.actions.push({n:'upgrade',v:'pistol'});s.step(ar,1/30);ok(T.upgradeLevel(ap,'pistol')===1&&ap.gold===420,'first upgrade costs gold');ap.nearSafe=true;ap.actions.push({n:'upgrade',v:'pistol'});s.step(ar,1/30);ok(T.upgradeLevel(ap,'pistol')===2&&ap.gold===240,'second upgrade costs gold');ap.nearSafe=true;ap.actions.push({n:'upgrade',v:'pistol'});s.step(ar,1/30);ok(ap.gold===240&&T.upgradeLevel(ap,'pistol')===2,'upgrades stop at level two');
T.enter(ar);G().p=ap;ap.cd.slash=0;ap.weapon='pistol';G().shots=[];T.doAttack();ok(G().shots.length===5,'fully upgraded gun fires a five-shot cone');ap.weapons.push('knife');ap.weapon='knife';ap.face=0;ap.cd.slash=0;const target=s.test.G.enemies[0]||{kind:'rival',x:0,y:0,r:13,hp:10000,maxHp:10000,kx:0,ky:0};target.x=ap.x+Math.cos(1.35)*45;target.y=ap.y+Math.sin(1.35)*45;target.hp=10000;G().enemies=[target];T.doAttack();ok(target.hp===10000,'unupgraded swing misses outside its arc');ap.weaponUpgrades.knife=2;ap.cd.slash=0;T.doAttack();ok(target.hp<10000,'upgraded swing hits inside its wider arc');ap.weapons.push('book');ap.weapon='book';ap.weaponUpgrades.book=2;ap.mana=ap.s.maxMana;ap.cd.slash=0;G().shots=[];T.doAttack();ok(G().shots.length===3&&G().shots.every(x=>x.blast===68),'upgraded spell spreads larger blasts');const saved=s.saveOf(ap),reload=mk(),reloaded=s.createRoom(reload,'Detective',saved,'Reload');ok(reloaded.weaponUpgrades.pistol===2,'weapon upgrades survive a save round trip');T.enter(room);
// The upgrade preview's tables also drive the actual projectile volleys.
{const r=mk(),p=s.createRoom(r,'Detective',null,'Weapon tiers'),q=s.addPlayer(r,'Firefighter',null,'Observer');T.enter(r);G().enemies=[];p.weapons.push('book');G().p=p;
 for(const [weapon,counts,powers,radii] of [['pistol',[1,3,5],[1,.4,.3],null],['book',[1,3,3],[1,.45,.45],[44,56,68]]])for(let n=0;n<3;n++){p.weapon=weapon;p.weaponUpgrades[weapon]=n;p.cd.slash=0;p.mana=p.s.maxMana;G().shots=[];G().fx=[];const base=T.weaponDamage(weapon)*T.dmgMul();T.doAttack();ok(G().shots.length===counts[n]&&G().shots.every(x=>Math.abs(x.dmg/base-powers[n])<1e-9&&(!radii||x.blast===radii[n]))&&G().fx.some(f=>f.k==='ring')===(n>0),weapon+' tier '+n+' has the expected projectile effects')}
 p.weapon='pistol';p.weaponUpgrades.pistol=2;p.cd.slash=0;p.input.l=true;p.input.ax=p.x+100;p.input.ay=p.y;q.x=p.x+20;q.y=p.y;r.ev.length=0;s.step(r,1/30);p.input.l=false;const snap=require('./sync').snapshot(r,q,require('./sync').newClient(),1);ok(snap.v&&snap.v.some(v=>v[0]==='f'&&v[1].k==='ring'&&v[1].c==='#80eaff'),'an upgraded attack pulse reaches nearby online allies')}
// Upgraded bullets pass through one distinct enemy, then stop.
{const r=mk(),p=s.createRoom(r,'Detective',null,'Pierce');T.enter(r);G().npcs=[];G().spawnT=999;const W=G().w,c=W.open.find(c=>c%78<74&&!W.map[c+1]&&!W.map[c+2]&&!W.map[c+3]);p.x=(c%78+.5)*40;p.y=((c/78|0)+.5)*40;p.face=0;p.weapon='pistol';p.s.crit=0;
 for(const tier of [0,1,2]){G().enemies=[];G().shots=[];const es=[65,100,135].map(dx=>{const e=T.spawnMob(0,{x:p.x+dx,y:p.y},false);e.hp=e.maxHp=1e6;e.sp=0;e.stunT=10;return e});p.cd.slash=0;p.face=0;p.weaponUpgrades.pistol=tier;G().p=p;T.doAttack();const shot=G().shots.find(s=>Math.abs(s.a)<.001);G().shots=[shot];const sync=require('./sync'),known=sync.newClient(),start=sync.snapshot(r,p,known,0),id=start.h[0][0].id;let stayed=false,pierceEvent=false;if(tier===2)ok(start.h[0][0].piercing===1,'online piercing shots carry their visual flag');for(let j=0;j<12;j++){s.step(r,1/30);if(tier===2&&r.ev.some(v=>v.e&&v.e[0]==='f'&&v.e[1].k==='pierceFx')){const fx=sync.snapshot(r,p,known,j+1);pierceEvent=!!(fx.v&&fx.v.some(v=>v[0]==='f'&&v[1].k==='pierceFx'))}r.ev.length=0;if(tier===2&&es[0].hp<es[0].maxHp&&es[1].hp===es[1].maxHp){const update=sync.snapshot(r,p,known,j+1);stayed=!update.h||!update.h[1].includes(id)}}if(tier===2){const finish=sync.snapshot(r,p,known,20);ok(stayed&&pierceEvent&&finish.h&&finish.h[1].includes(id),'online projectile and piercing flash survive the first hit and end after the second')}ok(es[0].hp<es[0].maxHp&&(tier===2?es[1].hp<es[1].maxHp:es[1].hp===es[1].maxHp)&&es[2].hp===es[2].maxHp,'pistol tier '+tier+' hits the permitted number of enemies')}
 p.weapons.push('bow','tommy');for(const id of ['bow','tommy']){G().p=p;p.weapon=id;p.weaponUpgrades[id]=2;p.cd.slash=0;G().shots=[];T.doAttack();ok(G().shots.length>0&&G().shots.every(s=>s.pierce===(id==='bow'?1:0)),id+' has the intended piercing behavior')}
}
// Shield interrupt requires the final upgrade and an active non-boss wind-up.
{const r=mk(),p=s.createRoom(r,'Guardian',null,'Shield');T.enter(r);G().enemies=[];p.weapon='shield';p.face=0;p.s.crit=0;const e=T.spawnMob(0,{x:p.x+35,y:p.y},false);e.hp=e.maxHp=1e6;e.wind=.6;e.healWind=.7;for(const tier of [0,1,2]){e.dead=false;e.hp=e.maxHp;e.wind=.6;e.healWind=.7;p.cd.slash=0;p.weaponUpgrades.shield=tier;G().fx=[];G().p=p;T.doAttack();ok(tier===2?e.wind===0&&e.healWind===0&&e.cd>=1&&G().fx.some(f=>f.k==='shieldFx'):e.wind===.6&&e.healWind===.7&&!G().fx.some(f=>f.k==='shieldFx'),'shield tier '+tier+' only interrupts at the final upgrade')}
 G().enemies=[];G().gate.open=true;T.summonBoss();const boss=G().boss;boss.x=p.x+35;boss.y=p.y;boss.wind=.6;const act=boss.act;p.cd.slash=0;p.face=0;G().p=p;T.doAttack();ok(boss.wind===.6&&boss.act===act,'shield effect does not interrupt a boss')}
// Fully upgraded healing weapons help one eligible nearby ally per cooldown.
{const r=mk(),p=s.createRoom(r,'Exorcist',null,'Healer'),q=s.addPlayer(r,'Guardian',null,'Injured'),v=s.addPlayer(r,'Ranger',null,'Other'),far=s.addPlayer(r,'Prodigy',null,'Far');T.enter(r);G().enemies=[];G().npcs=[];G().spawnT=999;const c=openEast();p.x=(c%78+.5)*40;p.y=((c/78|0)+.5)*40;q.x=p.x+30;q.y=p.y;v.x=p.x+40;v.y=p.y;far.x=p.x+250;far.y=p.y;q.hp=q.s.maxHp*.3;v.hp=v.s.maxHp*.5;far.hp=far.s.maxHp*.1;p.weapon='censer';p.face=0;p.s.crit=0;const es=[35,45].map(dx=>{const e=T.spawnMob(0,{x:p.x+dx,y:p.y},false);e.hp=e.maxHp=1e6;e.stunT=10;return e});
 for(const tier of [0,1]){p.cd.slash=0;p.weaponUpgrades.censer=tier;G().p=p;const hp=q.hp;T.doAttack();ok(q.hp===hp,'healing weapon tier '+tier+' does not heal allies')}
 p.cd.slash=0;p.weaponUpgrades.censer=2;G().p=p;const hq=q.hp,hv=v.hp,hf=far.hp;T.doAttack();ok(Math.abs(q.hp-hq-q.s.maxHp*.02)<1e-8&&v.hp===hv&&far.hp===hf&&G().fx.some(f=>f.k==='healLink'&&f.x===p.x&&f.x2===q.x),'upgraded healing strike restores the lowest-health nearby ally once even on multiple hits');
 p.cd.slash=0;const once=q.hp;T.doAttack();ok(q.hp===once,'healing weapon cooldown prevents repeated healing');G().enemies=[];for(let j=0;j<31;j++){s.step(r,1/30);r.ev.length=0}q.deadT=10;v.hp=v.s.maxHp-.5;G().enemies=es;es.forEach(e=>{e.dead=false;e.hp=e.maxHp;e.stunT=10});p.face=0;p.cd.slash=0;G().p=p;const hdown=q.hp;T.doAttack();ok(q.hp===hdown&&v.hp===v.s.maxHp,'after cooldown the effect ignores downed allies and clips overheal');const sync=require('./sync'),snap=sync.snapshot(r,v,sync.newClient(),1);ok(snap.p&&snap.p[0].some(x=>x.id===v.id&&x.hp===Math.round(v.hp*100)/100),'healing weapon ally health is present in the online snapshot')}
{const r=mk(),p=s.createRoom(r,'Exorcist',null,'Solo heal');T.enter(r);G().mp=false;G().enemies=[];p.weapon='censer';p.weaponUpgrades.censer=2;p.hp=p.s.maxHp*.5;p.face=0;const e=T.spawnMob(0,{x:p.x+35,y:p.y},false);e.hp=e.maxHp=1e6;G().p=p;const before=p.hp;T.doAttack();ok(p.hp>before&&!p.weaponHealCd,'solo healing weapon keeps self-healing without creating an ally-heal cooldown');p.cd.slash=0;G().enemies=[];const hp=p.hp;T.doAttack();ok(p.hp===hp&&!p.weaponHealCd,'a missed healing-weapon swing does not heal')}
// Effect cues are forwarded to nearby online observers.
{const r=mk(),p=s.createRoom(r,'Guardian',null,'Cue'),q=s.addPlayer(r,'Exorcist',null,'Observer');T.enter(r);G().enemies=[];G().npcs=[];q.x=p.x+20;q.y=p.y;p.weapon='shield';p.weaponUpgrades.shield=2;p.face=0;const e=T.spawnMob(0,{x:p.x+35,y:p.y},false);e.hp=e.maxHp=1e6;e.wind=.5;G().p=p;r.ev.length=0;T.doAttack();s.step(r,1/30);const sync=require('./sync');let snap=sync.snapshot(r,q,sync.newClient(),1);ok(snap.v&&snap.v.some(v=>v[0]==='f'&&v[1].k==='shieldFx'),'shield interrupt cue reaches a nearby observer');
 T.enter(r);G().enemies=[];q.weapon='censer';q.weaponUpgrades.censer=2;q.face=0;q.cd.slash=0;p.hp=p.s.maxHp*.5;const m=T.spawnMob(0,{x:q.x+35,y:q.y},false);m.hp=m.maxHp=1e6;G().p=q;r.ev.length=0;T.doAttack();s.step(r,1/30);snap=sync.snapshot(r,p,sync.newClient(),2);ok(snap.v&&snap.v.some(v=>v[0]==='f'&&v[1].k==='healLink'&&v[1].x2===p.x),'ally healing connection reaches the healed online player')}
// Signature characters upgrade their own move set through the checked action.
for(const ch of ['Necromancer','Void Empress','Toxin Alchemist']){const r=mk(),p=s.createRoom(r,ch,null,'Signature');T.enter(r);G().enemies=[];G().p=p;p.gold=500;p.nearSafe=false;p.actions.push({n:'upgrade',v:'signature'});s.step(r,1/30);ok(!T.upgradeLevel(p,'signature')&&p.gold===500,ch+' cannot upgrade away from the safehouse');p.nearSafe=true;p.actions.push({n:'upgrade',v:'fists'},{n:'upgrade',v:'__proto__'});s.step(r,1/30);ok(p.gold===500&&!T.upgradeLevel(p,'signature'),ch+' rejects forged weapon upgrades');T.enter(r);G().p=p;const base=['small','moderate','special'].map(id=>T.moveDamage(p,'',id));p.nearSafe=true;p.actions.push({n:'upgrade',v:'signature'});s.step(r,1/30);T.enter(r);G().p=p;ok(T.upgradeLevel(p,'signature')===1&&p.gold===420&&['small','moderate','special'].every((id,i)=>Math.abs(T.moveDamage(p,'',id)/base[i]-1.2)<1e-9),ch+' first signature upgrade improves every move by 20 percent');p.nearSafe=true;p.actions.push({n:'upgrade',v:'signature'});s.step(r,1/30);T.enter(r);G().p=p;ok(T.upgradeLevel(p,'signature')===2&&p.gold===240&&['small','moderate','special'].every((id,i)=>Math.abs(T.moveDamage(p,'',id)/base[i]-1.5)<1e-9),ch+' second signature upgrade improves every move by 50 percent');p.nearSafe=true;p.actions.push({n:'upgrade',v:'signature'});s.step(r,1/30);ok(p.gold===240&&T.upgradeLevel(p,'signature')===2,ch+' signature upgrades stop at level two');const saved=s.saveOf(p),reload=mk(),q=s.createRoom(reload,ch,saved,'Reload');ok(T.upgradeLevel(q,'signature')===2,ch+' signature upgrade survives saving')}
{const r=mk(),p=s.createRoom(r,'Necromancer',null,'Kit effects'),q=s.addPlayer(r,'Void Empress',null,'Observer');T.enter(r);G().enemies=[];p.weaponUpgrades.signature=2;p.input.l=true;p.input.ax=p.x+100;p.input.ay=p.y;q.x=p.x+20;q.y=p.y;r.ev.length=0;for(let i=0;i<20;i++)s.step(r,1/30);p.input.l=false;const sync=require('./sync'),snap=sync.snapshot(r,q,sync.newClient(),1);ok(snap.v&&snap.v.some(v=>v[0]==='f'&&v[1].k==='ring'&&v[1].c==='#6effaa'),'upgraded signature pulse reaches nearby online allies')}
// Signature upgrades reach the real damage-over-time hazard, not only the preview.
{const r=mk(),p=s.createRoom(r,'Toxin Alchemist',null,'Kit hazard');T.enter(r);G().enemies=[];p.input.ax=p.x+100;p.input.ay=p.y;p.input.l=true;for(let i=0;i<18;i++)s.step(r,1/30);p.input.l=false;const first=G().hazards.find(h=>h.from==='p'),dps=first&&first.dps;p.mv=null;G().hazards=[];p.weaponUpgrades.signature=2;p.input.l=true;for(let i=0;i<18;i++)s.step(r,1/30);p.input.l=false;const next=G().hazards.find(h=>h.from==='p');ok(dps>0&&next&&Math.abs(next.dps/dps-1.5)<1e-9&&next.pid===p.id,'signature upgrade scales the owned poison hazard by 50 percent')}
{const r=mk(),p=s.createRoom(r,'Detective',null,'No kit');T.enter(r);p.nearSafe=true;p.gold=500;p.actions.push({n:'upgrade',v:'signature'});s.step(r,1/30);ok(p.gold===500&&!T.upgradeLevel(p,'signature'),'ordinary characters cannot buy signature upgrades')}
// Stage 1 gives both factions an interruptible healer encounter.
for(const ch of ['Detective','Necromancer']){const r=mk();s.createRoom(r,ch,null,'Stage');T.enter(r);ok(G().enemies.some(e=>e.role==='healer'),ch+' encounters a Stage 1 healer')}T.enter(room);
// Team abilities, exposed openings, reactions, and checkpoint choices.
const depth=mk(),markman=s.createRoom(depth,'Detective',null,'Marksman'),tank=s.addPlayer(depth,'Firefighter',null,'Bruiser'),striker=s.addPlayer(depth,'Prodigy',null,'Striker'),medic=s.addPlayer(depth,'Exorcist',null,'Medic');T.enter(depth);G().enemies=[];const point=openEast(),cx=(point%78+.5)*40,cy=((point/78|0)+.5)*40;for(const p of G().players){p.x=cx;p.y=cy;p.hp=p.s.maxHp;p.inv=0}const rusher=T.spawnMob(0,{x:cx+40,y:cy},false);rusher.role='rusher';rusher.aware=true;markman.x=cx+80;tank.x=cx+50;medic.x=cx+300;ok(T.rusherTarget(rusher)===markman,'Rusher prioritizes a nearby back-line ally');markman.x=cx;tank.x=cx;medic.x=cx;G().enemies=[];const brute=T.spawnMob(0,{x:cx+40,y:cy},true);brute.aware=true;brute.hp=brute.maxHp=100000;
G().p=markman;ok(T.teamTarget(markman,'shooter',{x:brute.x,y:brute.y})===brute,'Mark preview uses the same target selection');ok(T.doTeam()&&brute.markT===6&&markman.teamCd>0,'Marksman marks an enemy with a cooldown');ok(!T.doTeam(),'role ability cannot bypass its cooldown');
G().p=tank;ok(T.doTeam()&&brute.tauntId===tank.id&&brute.tauntT===4&&tank.tauntGuard>0,'Bruiser taunts and gains protection');
G().p=striker;ok(T.doTeam()&&striker.breakReady>0,'Striker primes Break');brute.healWind=.8;T.hitEnemy(brute,1,0,0);ok(brute.healWind===0&&brute.healT===3&&brute.exposedT>0&&brute.brokenT>0,'Break interrupts a healer and exposes the target');
const oldHp=brute.hp;markman.s.crit=0;G().p=markman;T.hitEnemy(brute,100,0,0,true);ok(oldHp-brute.hp>140&&brute.brokenT===0,'an ally heavy hit triggers Break Strike');
brute.statusT=0;brute.reactAt=0;G().p=tank;T.hitEnemy(brute,1,0,0);G().p=striker;T.hitEnemy(brute,1,0,0);ok(brute.stunT>0&&brute.statusT===0,'Soak and Shock from different allies cause Overload');
markman.hp=markman.s.maxHp*.25;G().p=medic;ok(T.teamTarget(medic,'medic')===markman,'Mend Link previews the lowest-health ally');ok(T.doTeam()&&markman.mendT>0,'Medic links the lowest-health nearby ally');const beforeMend=markman.hp;for(let i=0;i<30;i++)s.step(depth,1/30);ok(markman.hp>beforeMend,'Mend Link heals over time');
T.enter(depth);brute.stunT=0;brute.role='brute';brute.wind=.01;brute.delayed=true;brute.aware=true;brute.x=tank.x+30;brute.y=tank.y;tank.dashT=.2;tank.inv=1;G().p=tank;T.updateEnemy(brute,.02);ok(brute.exposedT>0,'dodging a brute wind-up creates an opening');
T.enter(depth);markman.boonPending=false;markman.actions.push({n:'boon',v:'wide'});s.step(depth,1/30);ok(!markman.runBoons.wide,'unearned boon is rejected');T.enter(depth);T.offerBoons();markman.actions.push({n:'boon',v:'__proto__'},{n:'boon',v:'wide'},{n:'boon',v:'opening'});s.step(depth,1/30);ok(markman.runBoons.wide===1&&!markman.runBoons.opening&&!markman.boonPending,'checkpoint permits exactly one valid choice');ok(s.saveOf(markman).runBoons.wide===1,'checkpoint choice survives save round trip');
const sr=mk(),sc=s.createRoom(sr,'Vigilante',null,'Scout'),ally=s.addPlayer(sr,'Guardian',null,'Ally');T.enter(sr);G().enemies=[];ally.x=sc.x+90;ally.y=sc.y;ally.hp=ally.s.maxHp*.4;G().p=sc;ok(T.doTeam()&&sc.teamCd>0&&sc.inv>0&&ally.inv>0,'Scout dashes to an ally and shields both');T.enter(room);
// Shots credit owner
T.enter(room);const k2=b.kills,tgt=G().enemies.find(x=>!x.dead);tgt.hp=1;tgt.x=b.x+70;tgt.y=b.y;G().shots.push({x:b.x+20,y:b.y-22,vx:400,vy:0,r:4,from:'p',life:1,dmg:50,small:true,fx:'bullet',col:'255,220,120',a:0,pid:b.id});step(12);ok(b.kills===k2+1,'a shot credits the player who fired it');
// Ultimate
T.enter(room);a.rage=100;a.actions.push({n:'ult'});step(1);ok(a.ult&&a.rage===0,'ultimate starts on its owner only');ok(!b.ult,'the other player keeps their rage');const tt=G().t;step(30);ok(Math.abs(G().t-tt-1)<.05,'the world does not slow down for other players online');step(40);ok(!a.ult,'ultimate ends');
// Boss & clear
T.enter(room);G().gate.open=true;G().enemies=[];a.x=G().gate.x;a.y=G().gate.y;b.deadT=0;step(1);ok(!!G().boss,'walking to the gate wakes the boss');
ok(G().boss.maxHp>3600*1.6,'bosses have more life for a bigger party: '+Math.round(G().boss.maxHp));const spa=a.sp,spb=b.sp;T.enter(room);G().p=a;T.killEnemy(G().boss);ok(a.sp>=spa+2&&b.sp>=spb+2,'both players earn the boss skill points');ok(a.maxStage===2&&b.maxStage===2,'both players unlock stage 2');
step(60);ok(room.cleared,'the stage reports cleared');s.hostAction(room,a,'next');ok(G().stage===2&&!room.cleared&&room.stageChanged,'the host moves the party on');ok(Math.abs(a.x-b.x)<=30,'the party arrives together');
// Save round trip
const sv=s.saveOf(a);ok(sv.lvl===a.lvl&&!('input'in sv),'saves contain progress and nothing else');
const r3=mk(),p3=s.createRoom(r3,'Detective',{...sv,gold:777},'A');ok(p3.gold===777&&p3.lvl===a.lvl,'a loaded save restores the character');
// Asset villains and every character run for a minute without errors
for(const ch of['Necromancer','Void Empress','Toxin Alchemist','Mad Scientist','Demon Knight']){const r=mk(),p=s.createRoom(r,ch,null,'V'),q=s.addPlayer(r,ch,null,'W');for(let i=0;i<1800;i++){p.input.x=Math.sin(i/40);p.input.y=Math.cos(i/70);p.input.ax=p.x+Math.cos(i/9)*90;p.input.ay=p.y+Math.sin(i/9)*90;p.input.l=i%7<3;q.input.ax=p.x;q.input.ay=p.y;q.input.r=i%30<10;if(i%90===0){p.actions.push({n:'spell'},{n:'special'},{n:'dash'});q.actions.push({n:'heal'},{n:'potion'})}s.step(r,1/30);r.ev.length=0}ok(true,ch+' pair plays one minute: '+p.kills+' kills')}
s.removePlayer(room,a);step(30);ok(G().players.length===1,'the game carries on after a player leaves');
// Threat: an enemy walks at whoever earned its attention, not only whoever is nearest.
const tr=mk(),tp=s.createRoom(tr,'Guardian',null,'Threat'),tq=s.addPlayer(tr,'Detective',null,'Quiet');T.enter(tr);G().enemies=[];
const tpt=G().w.open.find(c=>Math.hypot((c%78+.5)*40-G().safe.x,((c/78|0)+.5)*40-G().safe.y)>500),ttx=(tpt%78+.5)*40,tty=((tpt/78|0)+.5)*40;
tp.x=ttx-160;tp.y=tty;tq.x=ttx+40;tq.y=tty;
const te=T.spawnMob(0,{x:ttx,y:tty},false);te.aware=true;te.hp=te.maxHp=100000;te.role='';te.kind='rival';
ok(T.threatTarget(te)===tq,'an idle enemy targets the nearest player');
tp.s.crit=0;G().p=tp;for(let i=0;i<30;i++)T.hitEnemy(te,300,0,0);
ok(T.threatTarget(te)===tp,'damage pulls an enemy off the nearer player');
// A close race keeps its target; a clear lead takes it over.
tp.x=ttx-100;tq.x=ttx+100;te.th={[tp.id]:5,[tq.id]:6};te.targetId=tp.id;
ok(T.threatTarget(te)===tp,'a close race keeps the current target');
te.th[tq.id]=10;ok(T.threatTarget(te)===tq,'a clear lead takes the target');
// Threat fades, and the enemy goes back to the nearest player.
te.th={[tp.id]:6};T.threatDecay(te,1);ok(te.th[tp.id]===2,'threat decays every frame');
T.threatDecay(te,1);ok(!te.th[tp.id],'decayed threat is dropped');
tq.x=ttx+40;tq.y=tty;tp.x=ttx-700;ok(T.threatTarget(te)===tq,'attention returns to the nearer player');
// Healing earns attention too.
G().enemies=[te];te.th={};te.x=ttx;te.y=tty;tp.x=ttx-30;tp.y=tty;tp.hp=1;tp.mana=tp.s.maxMana;tp.cd.pull=0;G().p=tp;T.doHeal();
ok((te.th[tp.id]||0)>0,'healing earns attention from nearby enemies');
// Healing attention reflects actual life restored and the active healer.
{te.th={};tp.hp=tp.s.maxHp-1;tp.potions=1;tp.cd.potion=0;G().p=tp;T.usePotion();ok(Math.abs(te.th[tp.id]-T.THREAT.heal*100/tp.s.maxHp)<1e-8,'potion overheal produces threat for only one life');
 const m=s.addPlayer(tr,'Exorcist',null,'Medic threat');T.enter(tr);m.x=tp.x;m.y=tp.y;tp.hp=tp.s.maxHp-1;tp.mendT=1;tp.mendRate=100;tp.mendBy=m.id;te.th={};s.step(tr,1/30);ok((te.th[m.id]||0)>0&&!(te.th[tp.id]>0),'Mend Link credits the healer for effective healing');te.th={};s.step(tr,1/30);ok(!te.th[m.id],'full-health Mend Link creates no healing threat');tp.hp=tp.s.maxHp-1;tp.mendT=1;tp.mendBy=m.id;s.removePlayer(tr,m);T.enter(tr);te.th={};s.step(tr,1/30);ok(!te.th[tp.id],'disconnected healer does not transfer threat to the recipient')}
// Taunt overrides any amount of threat.
te.targetId=0;te.th={[tq.id]:200};ok(T.threatTarget(te)===tq,'threat alone picks the target');
G().p=tp;T.doTeam();ok(T.threatTarget(te)===tp,'taunt beats any amount of threat');
// A rusher still prefers a back-line ally until someone out-threatens it.
const ru=T.spawnMob(0,{x:ttx+40,y:tty},false);ru.role='rusher';ru.aware=true;ru.hp=ru.maxHp=100000;G().enemies=[ru];tp.x=ttx+60;tp.y=tty;tq.x=ttx+80;tq.y=tty;
ok(T.threatTarget(ru)===tq,'a rusher still prefers a nearby back-line ally');
ru.th={[tp.id]:40};ok(T.threatTarget(ru)===tp,'a rusher switches to whoever out-threatens the back line');
// Bosses keep to the nearest player for now.
T.enter(tr);G().enemies=[];G().gate.open=true;G().killsStage=15;T.summonBoss();const bz=G().boss;
if(bz){bz.tauntT=0;tp.x=bz.x-30;tp.y=bz.y;tq.x=bz.x+600;tq.y=bz.y;bz.th={[tq.id]:200};ok(T.threatTarget(bz)===tp,'bosses keep to the nearest player')}
// Haste: levels and Agility shorten every cooldown, with a floor at 60% of the base timer.
const hzr=mk(),hz=s.createRoom(hzr,'Guardian',null,'Haste');T.enter(hzr);
ok(Math.abs(hz.s.cdMul-1)<1e-9,'a level one character has no haste');
hz.lvl=10;T.recalc();const c10=hz.s.cdMul;ok(c10<1&&Math.abs(c10-.892)<1e-6,'ten levels give 10.8 percent haste: '+c10.toFixed(3));
hz.train.agi=4;T.recalc();ok(hz.s.cdMul<c10,'agility adds haste');
hz.lvl=99;hz.train.agi=20;T.recalc();ok(Math.abs(hz.s.cdMul-.6)<1e-9,'haste stops at 60 percent of the base timer');
const mkr=mk(),mkd=s.createRoom(mkr,'Detective',null,'Marksman');T.enter(mkr);ok(Math.abs(mkd.s.cdMul-.85)<1e-9,'the Marksman still starts 15 percent faster');mkd.lvl=99;mkd.train.agi=20;T.recalc();ok(Math.abs(mkd.s.cdMul-.6)<1e-9,'the Marksman cannot pass the floor either');
T.enter(hzr);hz.lvl=20;hz.train.agi=0;T.recalc();G().p=hz;hz.cd.dash=0;T.doDash();
ok(hz.cd.dash<hz.s.dashCd&&Math.abs(hz.cd.dash-hz.s.dashCd*hz.s.cdMul)<1e-9,'dash uses the haste timer');
hz.cd.dash=0;hz.teamCd=0;hz.x=G().safe.x;hz.y=G().safe.y;G().enemies=[];
ok(T.doTeam()&&hz.teamCd<14&&Math.abs(hz.teamCd-14*hz.s.cdMul)<1e-9,'team ability cooldowns shrink with haste');
// Gore: blood scales with the damage, kills leave chunks and a pool, wounds drip. On the server every
// drop and decal leaves as an event, so the counts here are what a client would draw.
const gr=mk(),gp=s.createRoom(gr,'Firefighter',null,'Gore');T.enter(gr);G().enemies=[];G().decals=[];gr.ev.length=0;
const gt=T.spawnMob(0,{x:G().safe.x+300,y:G().safe.y},false);gt.aware=true;gt.hp=gt.maxHp=1000;gt.kx=gt.ky=0;
const gBlood=()=>gr.ev.filter(v=>v.e&&v.e[0]==='e').reduce((a,v)=>a+v.e[5],0);
const gDecals=()=>gr.ev.filter(v=>v.e&&v.e[0]==='d');
gp.s.crit=0;G().p=gp;
gr.ev.length=0;T.hitEnemy(gt,10,0,0);const gLight=gBlood();
gr.ev.length=0;G().fx=[];T.hitEnemy(gt,400,0,0,true);const gHeavy=gBlood();
ok(gLight>0&&gHeavy>gLight,'a bigger hit bleeds more: '+gLight+' vs '+gHeavy);
ok(G().fx.some(f=>f.k==='gib'),'a heavy hit throws chunks');
gr.ev.length=0;G().fx=[];T.killEnemy(gt);
ok(G().fx.filter(f=>f.k==='gib').length>=6,'a kill throws chunks');
const gPool=gDecals().filter(v=>v.e[4]===1);
ok(gPool.length>=1,'a kill leaves a pool');
ok(gPool.every(v=>typeof v.e[5]==='string'&&v.e[5].length===7),'gore decals carry their own colour');
// A badly wounded enemy drips as it moves, once per interval, and a healthy one does not.
T.enter(gr);gr.ev.length=0;gt.dead=false;gt.hp=gt.maxHp*.2;gt.moving=true;gt.goreT=0;T.goreTrail(gt,1);
const dTrail=gDecals().length;T.goreTrail(gt,.05);
ok(dTrail===1&&gDecals().length===1,'a wounded enemy drips once per interval');
gt.hp=gt.maxHp;T.goreTrail(gt,1);ok(gDecals().length===1,'a healthy enemy leaves no trail');
// Elements and reactions: all 40 carry one, every row in the table has an effect, and each fires.
const eNames=Object.keys(T.ELEMENT);
const eRoster=Object.keys(T.ROSTER.hero).concat(Object.keys(T.ROSTER.villain));
ok(eRoster.length===40&&eRoster.every(n=>T.ELEMENT[n]),'every character in the roster has an element');
ok(eNames.length===40&&eNames.every(n=>eRoster.includes(n)),'the element table names no character the roster lacks');
ok(eNames.every(n=>['burn','toxin','chill','shock','soak','void','bleed','holy'].includes(T.ELEMENT[n])),'every element is one of the eight in the design');
ok(T.REACTIONS.length===10&&Object.keys(T.REACT_FX).length===11,'every reaction row has an implemented effect');
const eCov=T.reactionCoverage();
ok(eCov.total===780&&eCov.byElement===259&&eCov.byResonance===521&&eCov.covered===780,'coverage is pinned: '+eCov.covered+' of '+eCov.total+' ('+eCov.byElement+' by element, '+eCov.byResonance+' by resonance)');
const rx2=(ca,cb)=>{const r=mk(),a=s.createRoom(r,ca,null,'A'),b=s.addPlayer(r,cb,null,'B');T.enter(r);G().enemies=[];return[a,b]};
const rxBy=()=>G().safe.x+300;
const rxFoe=(x,y)=>{const e=T.spawnMob(0,{x,y},false);e.aware=true;e.hp=e.maxHp=10000;e.statusT=0;e.statusBy=0;e.cd=99;e.sp=0;e.kx=e.ky=0;return e};
const rxPair=(a,b,e)=>{G().p=a;T.hitEnemy(e,10,0,0);G().p=b;T.hitEnemy(e,10,0,0)};
// Inferno: burns the neighbours too.
{const [a,b]=rx2('Pyromancer','Ranger'),x=rxBy(),y=G().safe.y,e=rxFoe(x,y),n=rxFoe(x+90,y);
 G().enemies=[e,n];rxPair(a,b,e);ok(e.statusT===0&&n.hp<10000,'Inferno splashes onto a neighbour')}
// Shatter: armour off for four seconds.
{const [a,b]=rx2('Pyromancer','Chronomancer'),x=rxBy(),e=rxFoe(x,G().safe.y);
 G().enemies=[e];rxPair(a,b,e);ok(e.statusT===0&&Math.abs(e.shatterT-4)<1e-9,'Shatter strips armour for four seconds')}
// Freeze: a normal enemy is locked, a boss is only slowed.
{const [a,b]=rx2('Chronomancer','Firefighter'),x=rxBy(),e=rxFoe(x,G().safe.y);
 G().enemies=[e];rxPair(a,b,e);ok(e.frozenT>0,'Freeze locks a normal enemy')}
{const [a,b]=rx2('Chronomancer','Firefighter'),x=rxBy(),e=rxFoe(x,G().safe.y);
 e.kind='boss';e.hp=e.maxHp=40000;G().enemies=[e];rxPair(a,b,e);ok(e.frozenT===undefined&&e.slowT>0,'Freeze only slows a boss')}
// Rot: missing life burns away over five seconds.
{const [a,b]=rx2('Ranger','Hero Shadow'),x=rxBy(),e=rxFoe(x,G().safe.y);
 e.hp=e.maxHp*.5;G().enemies=[e];rxPair(a,b,e);ok(Math.abs(e.rotT-5)<1e-9&&e.rotRate>0,'Rot starts a five second burn on missing life');
 const hp0=e.hp;T.updateEnemy(e,.5);T.updateEnemy(e,.5);ok(e.hp<hp0,'Rot keeps eating life')}
// Collapse: pulls the neighbours in.
{const [a,b]=rx2('Hero Shadow','Detective'),x=rxBy(),y=G().safe.y,e=rxFoe(x,y),n=rxFoe(x+140,y);
 G().enemies=[e,n];const before=Math.hypot(n.x-e.x,n.y-e.y);rxPair(a,b,e);
 const after=Math.hypot(n.x-e.x,n.y-e.y);
 ok(n.hp<10000,'Collapse bursts the enemies it catches');
 ok(after<=before,'Collapse never pushes an enemy away, even when a wall blocks the pull')}
// Purge: heals the party.
{const [a,b]=rx2('Vigilante','Guardian'),x=rxBy(),e=rxFoe(x,G().safe.y);
 a.x=x-40;a.y=G().safe.y;b.x=x-60;b.y=G().safe.y;b.hp=b.s.maxHp*.5;G().enemies=[e];const hp0=b.hp;
 rxPair(a,b,e);ok(b.hp>hp0,'Purge heals nearby allies')}
// Eclipse: stuns everything nearby.
{const [a,b]=rx2('Guardian','Hero Shadow'),x=rxBy(),y=G().safe.y,e=rxFoe(x,y),n=rxFoe(x+150,y);
 G().enemies=[e,n];rxPair(a,b,e);ok(n.stunT>0,'Eclipse stuns everything near the target')}
// Cauterise and Frostbite: the two Bleed rows.
{const [a,b]=rx2('Vigilante','Pyromancer'),x=rxBy(),y=G().safe.y,e=rxFoe(x,y),n=rxFoe(x+60,y);
 G().enemies=[e,n];rxPair(a,b,e);ok(e.statusT===0&&n.hp<10000,'Cauterise burns the neighbours')}
{const [a,b]=rx2('Vigilante','Chronomancer'),x=rxBy(),e=rxFoe(x,G().safe.y);
 G().enemies=[e];rxPair(a,b,e);ok(Math.abs(e.slowT-3)<1e-9,'Frostbite slows for three seconds')}
// Overload still stuns and now jumps.
{const [a,b]=rx2('Firefighter','Detective'),x=rxBy(),y=G().safe.y,e=rxFoe(x,y),n=rxFoe(x+140,y);
 G().enemies=[e,n];a.rage=0;b.rage=0;rxPair(a,b,e);ok(e.stunT>0&&n.hp<10000&&a.rage>0&&b.rage>0,'Overload stuns, jumps and pays rage to both')}
// Same element from two players resonates instead of reacting.
{const [a,b]=rx2('Detective','Inventor'),x=rxBy(),e=rxFoe(x,G().safe.y);
 G().enemies=[e];G().fx=[];rxPair(a,b,e);
 ok(e.statusT===0&&a.rage>0&&b.rage>0,'two players with the same element resonate and both gain rage')}
// A player's own attacks cannot trigger resonance in an online party.
{const [a,b]=rx2('Detective','Inventor'),e=rxFoe(rxBy(),G().safe.y);G().enemies=[e];a.rage=0;G().p=a;T.hitEnemy(e,10,0,0);T.hitEnemy(e,10,0,0);ok(e.statusT>0&&a.rage===0,'repeated hits from the same player do not react online')}
// Solo characters can trigger half-strength resonance with consecutive attacks.
{const r=mk(),a=s.createRoom(r,'Detective',null,'Solo reaction');T.enter(r);G().mp=false;G().enemies=[];const e=rxFoe(rxBy(),G().safe.y);G().enemies=[e];a.rage=0;G().p=a;T.hitEnemy(e,10,0,0);T.hitEnemy(e,10,0,0);ok(e.statusT===0&&a.rage===6,'solo second hit consumes status and grants half reaction rage');const online=rx2('Detective','Inventor'),q=rxFoe(rxBy(),G().safe.y);G().enemies=[q];G().p=online[0];T.hitEnemy(q,10,0,0);T.hitEnemy(q,10,0,0);ok(q.statusT>0&&online[0].rage===0,'solo reaction cannot be used in a party')}
// C-19: roles follow the weapon, guards block only the front, casters leave zones, shooters keep distance.
const c19=mk(),c1=s.createRoom(c19,'Firefighter',null,'Roles');T.enter(c19);G().enemies=[];
const roleWant={heal:'healer',shield:'guard',spell:'caster',shoot:'shooter'},badRole=[];
for(const n of Object.keys(T.ROSTER.villain)){const e=T.spawnRival(0,false,{x:G().safe.x+300,y:G().safe.y},n);const want=roleWant[e.method]||'rusher';if(e.role!==want)badRole.push(n)}
ok(!badRole.length,'every enemy takes the role its weapon implies'+(badRole.length?': '+badRole.join(', '):''));
const rAway=p=>{const c=G().w.open.find(c=>Math.hypot((c%78+.5)*40-G().safe.x,((c/78|0)+.5)*40-G().safe.y)>600);p.x=(c%78+.5)*40;p.y=((c/78|0)+.5)*40;return p};
// A guard blocks the front and not the back.
{const gr=mk(),v=s.createRoom(gr,'Necromancer',null,'Villain');T.enter(gr);G().enemies=[];rAway(v);
 const gd=T.spawnRival(0,true,{x:v.x+90,y:v.y},'Guardian');gd.aware=true;gd.hp=gd.maxHp=10000;gd.guarding=true;gd.ang=0;gd.cd=99;
 v.s.crit=0;G().p=v;const h0=gd.hp;T.hitEnemy(gd,100,Math.PI,0);const front=h0-gd.hp;
 const h1=gd.hp;gd.guarding=true;gd.ang=0;T.hitEnemy(gd,100,0,0);const back=h1-gd.hp;
 ok(gd.role==='guard'&&back>front*1.5,'a guard blocks the front and not the back: '+Math.round(front)+' vs '+Math.round(back))}
// A caster leaves a damaging zone.
{const cr=mk(),c2=s.createRoom(cr,'Firefighter',null,'Caster');T.enter(cr);G().enemies=[];rAway(c2);
 const ce=T.spawnRival(0,false,{x:c2.x+30,y:c2.y},'Necromancer');ce.aware=true;ce.cd=99;ce.zoneT=.01;G().hazards=[];
 G().p=c2;T.updateEnemy(ce,.05);
 ok(ce.role==='caster'&&G().hazards.some(h=>h.from==='e'&&h.dps>0),'a caster leaves a damaging zone')}
// A shooter backs off when a player closes in.
{const sr=mk(),sh=s.createRoom(sr,'Firefighter',null,'Shooter');T.enter(sr);G().enemies=[];
 const c=openEast();sh.x=(c%78+.5)*40;sh.y=((c/78|0)+.5)*40;
 const se=T.spawnRival(0,false,{x:sh.x+40,y:sh.y},'Mad Scientist');se.aware=true;se.cd=99;
 G().p=sh;const d0=Math.abs(se.x-sh.x);for(let i=0;i<10;i++)T.updateEnemy(se,.05);
 ok(se.role==='shooter'&&se.moving&&Math.abs(se.x-sh.x)>=d0-1,'a shooter backs away from a close player')}
// Every aware enemy records which player it is after, so the marker has something to draw.
{const mr2=mk(),m1=s.createRoom(mr2,'Firefighter',null,'Mark'),m2=s.addPlayer(mr2,'Detective',null,'Mate');T.enter(mr2);G().enemies=[];
 const me2=T.spawnMob(0,{x:m1.x+60,y:m1.y},false);me2.aware=true;me2.cd=99;G().enemies=[me2];
 for(let i=0;i<3;i++){s.step(mr2,1/30);mr2.ev.length=0}
 ok(me2.targetId===m1.id||me2.targetId===m2.id,'an aware enemy records the player it targets')}
// C-18: a stage runs its steps in order, and the gate opens on the last one.
{const or=mk(),op=s.createRoom(or,'Firefighter',null,'Obj');T.enter(or);G().enemies=[];
 ok(G().obj&&G().obj.steps.length===2&&G().obj.steps[0].kind==='kill'&&G().obj.steps[0].need===T.quota(1),'stage 1 starts on the kill step');
 G().killsStage=T.quota(1)-1;G().enemies=[];
 const foe=T.spawnMob(0,{x:op.x+40,y:op.y},false);foe.aware=true;foe.hp=1;G().p=op;op.s.crit=0;
 T.hitEnemy(foe,9999,0,0);s.step(or,1/30);or.ev.length=0;
 ok(G().obj.i===1&&G().obj.steps[1].kind==='revive'&&G().npcs.some(c=>c.wounded),'the kill quota hands over to the wounded scout');
 ok(!G().gate.open,'the gate waits for the scout');
 const sc=G().npcs.find(c=>c.wounded);op.x=sc.x+10;op.y=sc.y;op.reviveProgress=0;
 for(let i=0;i<120&&!G().gate.open;i++){op.actions.push({n:'revive',v:true});s.step(or,1/30);or.ev.length=0}
 ok(!sc.wounded&&G().obj.done&&G().gate.open,'reviving the scout finishes the objective and opens the gate');
 ok(op.hp>0&&sc.hp===sc.maxHp,'the scout is back on their feet')}
{const dr=mk(),dp=s.createRoom(dr,'Firefighter',null,'Default');T.enter(dr);
 const fb=T.objectiveSteps(99);ok(fb.length===1&&fb[0].kind==='kill','a stage with no steps defined falls back to the kill quota')}
// C-18 hold, carry, escort and the checkpoint between steps.
const stg=n=>{const r=mk(),p=s.createRoom(r,'Firefighter',{maxStage:n},'Obj');T.enter(r);G().enemies=[];G().spawnT=1e9;G().villT=1e9;return{r,p}};
const adv=r=>{G().killsStage=T.quota(G().stage);s.step(r,1/30);r.ev.length=0};
// Hold: three beacons, each lit by standing on it.
{const {r,p}=stg(2);adv(r);
 ok(G().obj.i===1&&G().obj.steps[1].kind==='hold'&&(G().obj.zones||[]).length===3,'stage 2 spawns three beacons');
 for(const z of G().obj.zones){for(let i=0;i<200&&!z.done;i++){p.x=z.x;p.y=z.y;G().enemies=[];s.step(r,1/30);r.ev.length=0}}
 ok(G().obj.zones.every(z=>z.done)&&G().obj.done&&G().gate.open,'lighting all three beacons finishes the objective')}
// Hold at once: both plates, at the same time, from two players.
{const rr=mk(),a=s.createRoom(rr,'Firefighter',{maxStage:6},'A'),b=s.addPlayer(rr,'Detective',null,'B');T.enter(rr);G().enemies=[];G().spawnT=1e9;G().villT=1e9;adv(rr);
 const zs=G().obj.zones;ok(G().obj.steps[1].simul&&zs.length===2,'stage 6 needs both plates at once');
 for(let i=0;i<120;i++){a.x=zs[0].x;a.y=zs[0].y;b.x=zs[1].x+900;b.y=zs[1].y;s.step(rr,1/30);rr.ev.length=0}
 ok(!G().obj.done,'one plate alone is not enough');
 for(let i=0;i<150&&!G().obj.done;i++){a.x=zs[0].x;a.y=zs[0].y;b.x=zs[1].x;b.y=zs[1].y;s.step(rr,1/30);rr.ev.length=0}
 ok(G().obj.done,'both plates held at once finishes the objective')}
// Carry: lift an item, a carrier cannot attack, delivering it counts.
{const {r,p}=stg(5);adv(r);
 const items=G().obj.items||[];ok(items.length===3&&!!G().obj.drop,'stage 5 spawns three canisters and a vent');
 const c=items[0];p.x=c.x;p.y=c.y;s.step(r,1/30);r.ev.length=0;
 ok(p.carry===c&&c.by===p.id,'walking over a canister picks it up '+JSON.stringify({step:G().obj.steps[G().obj.i].kind,idx:G().obj.i,d:Math.round(Math.hypot(p.x-c.x,p.y-c.y)),by:c.by,done:!!c.done,carry:!!p.carry,dead:p.deadT>0,res:p.respawnT>0,hope:G().hope}));
 p.weapon='pistol';p.cd.slash=0;const shots=G().shots.length;T.doAttack();
 ok(G().shots.length===shots&&T.doTeam()===false,'a carrier cannot attack or use a team ability');
 p.x=G().obj.drop.x;p.y=G().obj.drop.y;s.step(r,1/30);r.ev.length=0;s.step(r,1/30);r.ev.length=0;
 ok(c.done&&!p.carry&&G().obj.steps[1].have===1,'delivering a canister counts one')}
// Escort: moves while somebody stays close, stops when nobody does.
{const {r,p}=stg(3);adv(r);
 const e=G().obj.escort;ok(!!e&&G().obj.steps[1].kind==='escort','stage 3 spawns the lantern boat');
 const x0=e.x,y0=e.y;
 for(let i=0;i<60;i++){p.x=e.x;p.y=e.y+20;s.step(r,1/30);r.ev.length=0}
 ok(Math.hypot(e.x-x0,e.y-y0)>5,'the boat moves while a player stays close');
 const x1=e.x;p.x=e.x+2000;p.y=e.y;
 for(let i=0;i<30;i++){s.step(r,1/30);r.ev.length=0}
 ok(Math.abs(e.x-x1)<1,'the boat stops when nobody is close')}
// A killed objective scout is replaced so the stage can still be completed.
{const {r,p}=stg(1);adv(r);const old=G().npcs.find(c=>c.wounded);G().p=p;T.hitNpc(old,1e9,0,true);s.step(r,1/30);r.ev.length=0;const replacement=G().npcs.find(c=>c.wounded&&!c.dead);ok(old.dead&&replacement&&replacement!==old&&G().obj.steps[1].have===0,'a killed wounded scout is replaced while the revive objective is active')}
// A wipe restarts the current step but keeps finished steps.
{const {r,p}=stg(2);adv(r);
 const zs=G().obj.zones;zs[0].t=2.5;zs[0].done=true;G().obj.steps[1].have=1;
 T.resetStepState();
 ok(G().obj.i===1&&zs.every(z=>!z.done&&z.t===0)&&G().obj.steps[1].have===0,'a wipe restarts only the step in progress')}
// A retry resets carry and escort progress without undoing completed steps.
{const {r,p}=stg(5);adv(r);const items=G().obj.items;items[0].done=true;items[1].by=p.id;p.carry=items[1];G().obj.steps[1].have=1;T.resetStepState();ok(G().obj.i===1&&!p.carry&&items.every(c=>!c.done&&!c.by)&&G().obj.steps[1].have===0,'checkpoint retry resets carried and delivered items')}
{const {r,p}=stg(3);adv(r);const e=G().obj.escort;e.x+=200;e.y+=100;e.done=true;e.t=9;G().obj.steps[1].have=1;T.resetStepState();ok(G().obj.i===1&&e.x===G().safe.x+90&&e.y===G().safe.y+70&&!e.done&&e.t===0,'checkpoint retry resets the escort')}
// C-17: guard bar, stagger, telegraph, enrage, phase changes and the arena.
{const br=mk(),bp=s.createRoom(br,'Detective',null,'Boss');T.enter(br);G().enemies=[];G().gate.open=true;G().killsStage=15;T.summonBoss();
 const bz=G().boss;
 ok(!!bz&&bz.guard===0&&bz.guardMax>0&&(bz.phase||0)===0&&!!G().arena,'a boss starts with a guard bar and closes the arena');
 ok(T.bossTelegraph(bz,'circle',100,.2).dur>=T.BOSS_TELEGRAPH,'a telegraph can never be shorter than the minimum');
 bp.s.crit=0;G().p=bp;
 for(let i=0;i<3;i++){bp.breakReady=6;T.hitEnemy(bz,10,0,0)}
 ok(bz.staggerT>0,'three Breaks fill the guard and stagger the boss');
 const rnd0=Math.random;Math.random=()=>.99;
 const h1=bz.hp;T.hitEnemy(bz,100,0,0);const staggeredHit=h1-bz.hp;
 bz.staggerT=0;const h2=bz.hp;T.hitEnemy(bz,100,0,0);const normalHit=h2-bz.hp;
 Math.random=rnd0;
 ok(staggeredHit>normalHit*1.2,'a staggered boss takes more damage: '+Math.round(staggeredHit)+' vs '+Math.round(normalHit));
 bz.staggerT=3;T.updateBoss(bz,.1,300,true);ok(bz.moving===false,'a staggered boss does not act');
 // A phase change clears enemy fire and gives the party a breather.
 bz.staggerT=0;bz.hp=bz.maxHp*.49;G().shots=[{x:1,y:1,vx:0,vy:0,life:9,from:'e'}];G().p=bp;
 T.hitEnemy(bz,1,0,0);
 ok(bz.phase===1&&bz.breatherT>0&&!G().shots.some(s=>s.from==='e'),'a phase change clears enemy shots and takes a breather');
 // Enrage when the clock runs out.
 bz.breatherT=0;bz.enrageT=.01;T.updateBoss(bz,.02,300,true);
 ok(bz.enraged,'the boss enrages when its clock runs out');
 // The arena keeps the party inside, and a wipe respawns at its edge.
 const out=G().arena;bp.x=out.x+out.r+400;bp.y=out.y;s.step(br,1/30);br.ev.length=0;
 ok(Math.hypot(bp.x-out.x,bp.y-out.y)<=out.r+1,'the arena keeps players inside');
 bp.deadT=0;bp.respawnT=.01;bp.hp=0;s.step(br,1/30);br.ev.length=0;
 const rd=Math.hypot(bp.x-out.x,bp.y-out.y);ok(rd>out.r-120&&rd<=out.r+1,'a respawn lands at the arena edge: '+Math.round(rd));
 // Killing the boss opens the arena again.
 bp.deadT=0;bp.respawnT=0;bp.hp=bp.s.maxHp;G().p=bp;
 for(let i=0;i<20&&G().boss;i++)T.hitEnemy(bz,bz.maxHp,0,0);
 ok(!G().boss&&!G().arena,'killing the boss opens the arena')}
// C-21: the Crystal Scurrier, its pillars and its burrow.
{const cr=mk(),cp=s.createRoom(cr,'Detective',null,'Boss21');T.enter(cr);G().enemies=[];G().gate.open=true;G().killsStage=15;T.summonBoss();
 const cz=G().boss;cp.s.maxHp=99999;cp.hp=99999;
 ok(cz.name==='Crystal Scurrier','stage 1 fields the Crystal Scurrier');
 // Half life raises two pillars, and they heal it while they stand.
 cz.hp=cz.maxHp*.49;T.hitEnemy(cz,1,0,0);
 ok(cz.phase===1&&T.pillarsUp()===2,'half life raises two crystal pillars');
 cz.breatherT=0;cz.staggerT=0;const hp0=cz.hp;
 for(let i=0;i<30;i++)T.updateBoss(cz,1/30,400,false);
 ok(cz.hp>hp0,'standing pillars heal the boss: '+Math.round(hp0)+' to '+Math.round(cz.hp));
 // Solo: a plain swing does nothing, a charged move breaks it.
 const pl=(G().props||[]).find(c=>c.kind==='pillar'&&!c.done);
 ok(T.pillarHit(pl,G().p,false)===false&&!pl.done,'a plain swing does not break a pillar solo');
 ok(T.pillarHit(pl,G().p,true)===true&&pl.done,'one charged move breaks a pillar solo');
 // The burrow hides the boss, then it erupts under the top-threat player.
 T.startBurrow(cz);ok(cz.buried===true,'burrowing hides the boss');
 const hpB=cz.hp;T.hitEnemy(cz,500,0,0);ok(cz.hp===hpB,'a buried boss cannot be hit');
 for(let i=0;i<100&&cz.buried;i++)T.updateBoss(cz,1/30,300,true);
 ok(!cz.buried,'the boss comes back up');
 // Shard spray throws a cone, not a ring.
 G().shots=[];T.startSpray(cz);
 for(let i=0;i<40;i++)T.updateBoss(cz,1/30,200,true);
 ok(G().shots.filter(s=>s.fx==='shard').length>=5,'shard spray fires a cone of crystals')}
// Signature move hit detection uses the acting player when breaking a pillar.
{const r=mk(),p=s.createRoom(r,'Necromancer',null,'Kit pillar');T.enter(r);G().enemies=[];T.spawnPillars(1);const pillar=G().props.find(c=>c.kind==='pillar');pillar.x=p.x+40;pillar.y=p.y;p.input.ax=p.x+100;p.input.ay=p.y;p.actions.push({n:'spell'});for(let i=0;i<28&&!pillar.done;i++){s.step(r,1/30);r.ev.length=0}ok(pillar.done,'a solo signature moderate move breaks a pillar without crashing')}
// Party pillars: two players, within two seconds.
{const pr=mk(),pa=s.createRoom(pr,'Detective',null,'P21'),pb=s.addPlayer(pr,'Firefighter',null,'Q');T.enter(pr);G().enemies=[];G().gate.open=true;G().killsStage=15;T.summonBoss();
 T.spawnPillars(1);const pc=(G().props||[]).find(c=>c.kind==='pillar'&&!c.done);
 ok(T.pillarHit(pc,pa,false)===false&&!pc.done,'one hit is not enough in a party');
 ok(T.pillarHit(pc,pa,false)===false,'the same player twice is not enough either');
 ok(T.pillarHit(pc,pb,false)===true&&pc.done,'two players inside the window break the pillar');
 // Outside the window it has to start over.
 const p2=T.spawnPillars(1),pc2=(G().props||[]).filter(c=>c.kind==='pillar'&&!c.done).pop();
 T.pillarHit(pc2,pa,false);G().t+=3;T.pillarHit(pc2,pb,false);
 ok(!pc2.done,'hits more than two seconds apart do not count')}
// C-15 party chain: one counter for the party, personal combos stay personal, and the bonus tiers bite.
{const cr=mk(),ca=s.createRoom(cr,'Detective',null,'ChainA'),cb=s.addPlayer(cr,'Firefighter',null,'ChainB');T.enter(cr);G().enemies=[];
 T.chainReset();ok(G().chain.n===0&&G().chain.t===0,'the chain starts empty');
 T.chainAdd();ok(G().chain.n===1&&Math.abs(G().chain.t-6)<1e-9,'a kill counts up and opens a six second window');
 T.chainTick(6.1);ok(G().chain.n===0,'the shared window runs out after six seconds');
 // A kill by either player feeds the same counter, and the personal combo belongs to the killer.
 const m1=T.spawnMob(0,{x:ca.x+30,y:ca.y},false),m2=T.spawnMob(0,{x:ca.x-30,y:ca.y},false);
 G().p=ca;T.killEnemy(m1);G().p=cb;T.killEnemy(m2);
 ok(G().chain.n===2&&ca.combo===1&&cb.combo===1,"either player's kill feeds the party chain while each keeps a personal combo");
 ok(ca.bestCombo===1&&cb.bestCombo===1,'the personal best is still recorded per player');
 for(let i=0;i<3;i++){G().p=ca;T.killEnemy(T.spawnMob(0,{x:ca.x+30,y:ca.y},false))}
 ok(G().chain.n===5&&T.chainBonus().spd===1.05&&/speed/.test(T.chainBonus().label),'five kills give the whole party 5 percent move speed');
 ok(T.chainBonus().dmg===1,'damage stays at 100 percent until twelve');
 while(G().chain.n<12){G().p=ca;T.killEnemy(T.spawnMob(0,{x:ca.x+30,y:ca.y},false))}
 ok(T.chainBonus().dmg===1.1,'twelve kills give the party 10 percent damage');
 while(G().chain.n<20){G().p=ca;T.killEnemy(T.spawnMob(0,{x:ca.x+30,y:ca.y},false))}
 ok(T.chainBonus().mana===2,'twenty kills double mana regeneration');
 while(G().chain.n<30){G().p=ca;T.killEnemy(T.spawnMob(0,{x:ca.x+30,y:ca.y},false))}
 ok(T.chainBonus().cd===.8,'thirty kills make every cooldown 20 percent faster');
 ok(/cooldowns/.test(T.chainBonus().label),'the label reports the strongest bonus, not the last one read');
 // The table has to reach the rules, not just exist.
 G().p=ca;G().enemies=[];
 const dm30=T.dmgMul(),cd30=T.cdMulOf(ca);T.chainReset();const dm0=T.dmgMul();
 ok(Math.abs(dm30/dm0-1.1)<1e-9,'the damage bonus reaches dmgMul');
 ok(Math.abs(cd30/ca.s.cdMul-.8)<1e-9,'the cooldown bonus reaches every ability timer');
 ok(Math.abs(T.cdMulOf(ca)/ca.s.cdMul-1)<1e-9,'and it is gone once the chain is');
 ca.x=G().safe.x;ca.y=G().safe.y;ca.input.x=1;s.step(cr,1/30);cr.ev.length=0;const x0=ca.x;
 ca.x=x0;ca.mana=0;T.chainReset();s.step(cr,1/30);cr.ev.length=0;const dx0=ca.x-x0,mg0=ca.mana;
 ca.x=x0;ca.mana=0;for(let i=0;i<5;i++)T.chainAdd();s.step(cr,1/30);cr.ev.length=0;
 ok(Math.abs((ca.x-x0)/dx0-1.05)<1e-6,'five kills really move the party 5 percent faster');
 ok(Math.abs(ca.mana/mg0-1)<1e-9,'five kills leave mana regeneration alone');
 ca.mana=0;while(G().chain.n<20)T.chainAdd();s.step(cr,1/30);cr.ev.length=0;
 ok(Math.abs(ca.mana/mg0-2)<1e-6,'twenty kills really double the mana that comes back');
 ca.input.x=0;
 // Rage: the killer fills up, allies inside 500 get a third of it, allies outside get nothing.
 T.enter(cr);G().enemies=[];T.chainReset();ca.rage=0;cb.rage=0;ca.x=G().safe.x;ca.y=G().safe.y;
 cb.x=ca.x+400;cb.y=ca.y;const rk1=T.spawnMob(0,{x:ca.x+10,y:ca.y},false);
 G().p=ca;T.killEnemy(rk1);const gainA=ca.rage,gainNear=cb.rage;
 ok(gainA>0&&Math.abs(gainNear/gainA-.35)<1e-9,"an ally inside 500 units earns 35 percent of the killer's rage");
 ca.rage=0;cb.rage=0;cb.x=ca.x+600;const rk2=T.spawnMob(0,{x:ca.x+10,y:ca.y},false);
 G().p=ca;T.killEnemy(rk2);
 ok(ca.rage>0&&cb.rage===0,'an ally beyond 500 units earns nothing');
 // A new stage wipes the chain.
 T.chainAdd();const nr=mk(),np=s.createRoom(nr,'Detective',null,'ChainNew');T.enter(nr);
 ok(G().chain.n===0,'a new stage starts with an empty chain')}
// C-16 linked ultimates: a three second window, and the party grows the effect.
{const lr=mk(),pa=s.createRoom(lr,'Detective',null,'L1'),pb=s.addPlayer(lr,'Firefighter',null,'L2'),pc=s.addPlayer(lr,'Prodigy',null,'L3'),pd=s.addPlayer(lr,'Exorcist',null,'L4');
 T.enter(lr);G().enemies=[];G().killsStage=99;G().gate.open=true;T.summonBoss();const bs=G().boss;
 T.tickLink(99);
 pa.rage=100;pa.actions.push({n:'ult'});s.step(lr,1/30);const evLink=lr.ev.slice();lr.ev.length=0;
 ok(G().link&&G().link.ids.length===1&&G().link.t>2.9&&!T.linkBonus(pa),'an ultimate alone opens a three second window and earns nothing');
 ok(evLink.some(v=>v.e&&v.e[0]==='x'&&v.e[3]==='LINK NOW!'),'allies are told to link now');
 T.openLink(pa);ok(G().link.ids.length===1&&G().link.dmg===0,'the same player cannot link twice');
 G().shots.push({from:'e',x:pa.x+20,y:pa.y,r:5,life:1,vx:0,vy:0,dmg:5});
 pb.rage=100;pb.actions.push({n:'ult'});s.step(lr,1/30);lr.ev.length=0;
 ok(G().link.ids.length===2&&G().link.dmg===.4&&T.linkTier(2)[2]==='Duo','a second ultimate inside the window makes a Duo link');
 ok(!G().shots.some(sh=>sh.from==='e'),'Duo clears every enemy shot on the field');
 ok(T.linkBonus(pa)===.4&&T.linkBonus(pb)===.4,'both ultimates gain 40 percent, including the one already running');
 pc.rage=100;pc.actions.push({n:'ult'});s.step(lr,1/30);lr.ev.length=0;
 ok(G().link.dmg===.7&&G().players.every(q=>q.inv>=T.ULT_LEN-.1),'a Trio gives 70 percent and makes the whole party invulnerable for the ultimate');
 pd.hp=1;pd.rage=100;pd.actions.push({n:'ult'});s.step(lr,1/30);lr.ev.length=0;
 ok(G().link.dmg===1&&pd.hp===pd.s.maxHp,'a Full Party doubles the ultimates and heals everyone');
 ok((bs.staggerT||0)>4&&bs.guard===0,'a Full Party staggers the boss for five seconds');
 ok(T.linkBonus(pa)===1,'the first caster still reads the new link strength');
 T.tickLink(3.1);ok(!G().link&&T.linkBonus(pa)===0,'the window closes after three seconds and the bonus goes with it');
 // The bonus has to reach ultimate damage, not just the table.
 const rnd0=Math.random;Math.random=()=>.4;
 const hitBoss=()=>{bs.hp=bs.maxHp;bs.guard=0;bs.staggerT=0;bs.armor=0;G().p=pa;pa.ult={t:0,hit:0,name:'x',col:'255,255,255',seed:1};pa.x=bs.x;pa.y=bs.y;T.ultHit(pa.ult,1);return bs.maxHp-bs.hp};
 G().p=pa;const plain=T.ultDmgFor(bs,pa,0),linked=T.ultDmgFor(bs,pa,.4);Math.random=rnd0;
 ok(plain>0&&Math.abs(linked/plain-1.4)<1e-9,'a Duo link multiplies the ultimate damage by 1.4: '+Math.round(plain)+' to '+Math.round(linked));
 const mob={kind:'rival',r:13,armor:0};ok(Math.abs(T.ultDmgFor(mob,pa,.4)/T.ultDmgFor(mob,pa,0)-1.4)<1e-9,'and the same on ordinary enemies');
 ok(Math.abs(T.bossUltDamage(bs,1e9)-bs.maxHp*.04/4)<1e-9,'even a high-damage build deals four percent divided by party size before the link bonus')}
// A late link upgrades damage that has already landed, without replaying reactions.
{const lr=mk(),a=s.createRoom(lr,'Detective',null,'Late A'),b=s.addPlayer(lr,'Detective',null,'Late B');T.enter(lr);G().enemies=[];const e=T.spawnMob(0,{x:a.x+20,y:a.y},false);e.hp=e.maxHp=100000;e.kx=e.ky=0;G().p=a;T.openLink(a);const hp=e.hp;T.ultHit({col:'255,255,255'},0);const damage=hp-e.hp;T.tickLink(2.9);G().p=b;T.openLink(b);ok(Math.abs((hp-e.hp)-damage*1.4)<1e-7,'late Duo upgrades earlier ultimate damage');T.openLink(b);ok(Math.abs((hp-e.hp)-damage*1.4)<1e-7,'repeat cast cannot apply the link bonus twice')}
// Delayed link upgrades handle target and caster state changes.
{const r=mk(),a=s.createRoom(r,'Detective',null,'Link A'),b=s.addPlayer(r,'Firefighter',null,'Link B'),c=s.addPlayer(r,'Prodigy',null,'Link C'),d=s.addPlayer(r,'Exorcist',null,'Link D');T.enter(r);G().enemies=[];const e=T.spawnMob(0,{x:a.x+30,y:a.y},false);e.hp=e.maxHp=100000;e.kx=e.ky=0;G().p=a;T.openLink(a);T.ultHit({col:'255,255,255'},0);const initial=100000-e.hp;e.hp=100000;G().p=b;T.openLink(b);ok(Math.abs(e.hp-(100000-initial*.4))<1e-7,'late bonus applies after target heals');G().p=c;T.openLink(c);ok(Math.abs(e.hp-(100000-initial*.7))<1e-7,'Trio applies only the additional tier bonus');d.deadT=10;d.hp=0;G().p=d;T.openLink(d);ok(d.hp===0&&d.deadT===10,'Full Party does not silently heal a downed player');ok(Math.abs(e.hp-(100000-initial))<1e-7,'Full Party applies only remaining bonus');
 T.tickLink(99);e.hp=e.maxHp;e.dead=false;G().p=a;T.openLink(a);T.ultHit({col:'255,255,255'},0);e.dead=true;const hp=e.hp;G().p=b;T.openLink(b);ok(e.hp===hp,'a dead target receives no late bonus');
 T.tickLink(99);e.dead=false;e.hp=e.maxHp;G().p=a;T.openLink(a);T.ultHit({col:'255,255,255'},0);const hp2=e.hp;s.removePlayer(r,a);T.enter(r);G().p=b;T.openLink(b);ok(e.hp<hp2,'a disconnected caster does not prevent a late link bonus')}
// A late bonus belongs to an earlier valid hit, even across a boss phase change.
{const r=mk(),a=s.createRoom(r,'Detective',null,'Boss link A'),b=s.addPlayer(r,'Firefighter',null,'Boss link B');T.enter(r);G().enemies=[];G().gate.open=true;T.summonBoss();const boss=G().boss;boss.x=a.x;boss.y=a.y;boss.phase=0;boss.hp=boss.maxHp*.51;boss.kx=boss.ky=0;G().p=a;T.openLink(a);T.ultHit({col:'255,255,255'},0);const afterHit=boss.hp;boss.buried=true;G().p=b;T.openLink(b);ok(boss.hp<afterHit&&boss.phase>=1,'late bonus from an earlier hit survives burrow and checks boss phase');T.tickLink(99);boss.buried=true;boss.hp=boss.maxHp;G().p=a;T.openLink(a);T.ultHit({col:'255,255,255'},0);const before=boss.hp;G().p=b;T.openLink(b);ok(boss.hp===before,'an ultimate blocked by burrow cannot create delayed damage')}
// Party feedback uses authoritative timers and enemy awareness in snapshots.
{const sr=mk(),p=s.createRoom(sr,'Detective',null,'HUD'),q=s.addPlayer(sr,'Firefighter',null,'Ally');T.enter(sr);G().enemies=[];const e=T.spawnMob(0,{x:p.x+30,y:p.y},false);e.aware=true;e.targetId=q.id;G().chain={n:12,t:2.6,tier:null};G().hopeSpent=1;const sync=require('./sync'),snap=sync.snapshot(sr,p,sync.newClient(),1),enemy=snap.e[0].find(x=>x.id===e.id);ok(snap.g.ch===12&&snap.g.ct===2.6&&snap.g.hopeSpent===1,'party chain time and Hope spent reach the client');ok(enemy.aware===true&&enemy.targetId===q.id,'enemy target marker has awareness and target in the snapshot')}
// Split objectives hand a party too small to split the design's timed version instead.
{const atStage=(n,chars)=>{const rr=mk(),list=[s.createRoom(rr,chars[0],null,'F'+n+chars.length)];
  for(let i=1;i<chars.length;i++)list.push(s.addPlayer(rr,chars[i],null,'F'+n+chars.length+i));
  T.enter(rr);const p=list[0];p.maxStage=10;p.nearSafe=true;s.hostAction(rr,p,'travel',String(n));T.enter(rr);
  T.G.enemies=[];T.G.killsStage=999;T.G.spawnT=1e9;for(const q of T.G.players)q.inv=1e9;const step=(k=1)=>{for(let i=0;i<k;i++){s.step(rr,1/30);rr.ev.length=0}};
  step(2);return {rr,list,p,step}};
 // Solo, two plates: the fallback, one plate at a time for eight seconds each.
 {const {list,p,step}=atStage(6,['Detective']);const o=T.G.obj,st=o.steps[o.i],zs=o.zones;
  ok(st.kind==='hold'&&st.simul&&!st.split&&st.aloneT===T.HOLD_ALONE_T,'one player cannot split a two plate step, so it uses the timed version');
  const stand=(z,n)=>{for(let i=0;i<n;i++){p.x=z.x;p.y=z.y;step(1)}};
  stand(zs[0],90);ok(!zs[0].done,'three seconds is not enough on the solo version');
  stand(zs[0],170);ok(zs[0].done&&zs[0].t>=T.HOLD_ALONE_T,'eight seconds lights the plate and it stays down');
  stand(zs[1],260);ok(T.G.obj.done&&T.G.gate.open,'the solo player finishes the two plate objective and the gate opens')}
 // Solo, three shrines: same fallback, and it also has to finish.
 {const {p,step}=atStage(9,['Detective']);const o=T.G.obj,st=o.steps[o.i],zs=o.zones;
  ok(zs.length===3&&!st.split&&st.aloneT===T.HOLD_ALONE_T,'a solo player lights three shrines one at a time');
  for(const z of zs){for(let i=0;i<260;i++){p.x=z.x;p.y=z.y;step(1)}}
  ok(T.G.obj.done&&T.G.gate.open,'three shrines are finishable alone')}
 // Two players still split two plates at once, and releasing one resets the hold.
 {const {list,step}=atStage(6,['Detective','Firefighter']);const o=T.G.obj,st=o.steps[o.i],zs=o.zones;
  ok(st.split&&st.aloneT===undefined,'two players for two plates keep the simultaneous version');
  const put=(a,b)=>{list[0].x=zs[0].x;list[0].y=zs[0].y;list[1].x=zs[1].x;list[1].y=zs[1].y};
  put();step(60);ok(!T.G.obj.done,'a partial hold is not the objective');
  for(let i=0;i<40;i++){put();step(1)}
  ok(T.G.obj.done&&T.G.gate.open,'two players holding both plates finish it in three seconds')}
 // A wipe restarts the step, and the step can still be finished afterwards.
 for(const [stage,name] of [[2,'beacons'],[6,'solo plates'],[9,'solo shrines']]){const {p,step}=atStage(stage,['Detective']);const zs=T.G.obj.zones;
  const light=z=>{for(let i=0;i<260&&!z.done;i++){p.x=z.x;p.y=z.y;step(1)}};
  light(zs[0]);ok(zs[0].done,stage+': first zone lit before the wipe');T.resetStepState();ok(!zs[0].done&&!T.G.obj.done,stage+': the wipe relights nothing');
  for(const z of zs)light(z);step(1);ok(T.G.obj.done&&T.G.gate.open,'a wipe does not soft-lock the '+name)}
 // A party that shrinks mid-step finishes with the fallback.
 {const {rr,list,p,step}=atStage(6,['Detective','Firefighter']);const zs=T.G.obj.zones,st=T.G.obj.steps[T.G.obj.i];ok(st.split&&st.met===false,'two players start on the simultaneous plates');
  s.removePlayer(rr,list[1]);T.enter(rr);for(const z of zs){for(let i=0;i<260&&!z.done;i++){p.x=z.x;p.y=z.y;step(1)}}step(1);
  ok(T.G.obj.done&&T.G.gate.open,'the player left behind can still finish both plates')}
 // Someone joining a fallback hold keeps the zone that is already lit.
 {const {rr,p,step}=atStage(6,['Detective']);const zs=T.G.obj.zones,st=T.G.obj.steps[T.G.obj.i];for(let i=0;i<260&&!zs[0].done;i++){p.x=zs[0].x;p.y=zs[0].y;step(1)}
  const j=s.addPlayer(rr,'Firefighter',null,'Late');T.enter(rr);j.inv=1e9;j.x=zs[0].x+900;j.y=zs[0].y;step(2);
  ok(zs[0].done&&!st.split&&T.objTargets().length===1,'a late joiner does not undo a lit plate, and the pointer stays on the other');
  for(let i=0;i<260&&!zs[1].done;i++){p.x=zs[1].x;p.y=zs[1].y;step(1)}step(1);ok(T.G.obj.done&&T.G.gate.open,'and the party finishes one plate at a time');
  const {rr:r2,step:st2,p:p2}=atStage(6,['Detective']);const z2=T.G.obj.zones;for(let i=0;i<260&&!z2[0].done;i++){p2.x=z2[0].x;p2.y=z2[0].y;st2(1)}const late=s.addPlayer(r2,'Firefighter',null,'Late2');T.enter(r2);late.inv=1e9;st2(2);s.removePlayer(r2,late);T.enter(r2);for(let i=0;i<260&&!z2[1].done;i++){p2.x=z2[1].x;p2.y=z2[1].y;st2(1)}st2(1);
  ok(T.G.obj.done&&T.G.gate.open,'joining and leaving during a hold cannot soft-lock it')}
 // The ring fills to the time the step really needs, on the server and from the wire.
 {const {step}=atStage(6,['Detective']);ok(T.zoneNeed()===T.HOLD_ALONE_T&&T.G.obj.wire.hn===T.HOLD_ALONE_T,'a fallback plate ring needs eight seconds');T.G.obj.holdNeed=T.G.obj.wire.hn;ok(T.zoneNeed()===8,'an online client reads the hold time it was sent');delete T.G.obj.holdNeed}
 {const {step}=atStage(6,['Detective','Firefighter']);ok(T.zoneNeed()===3&&T.G.obj.wire.hn===3,'a split plate ring needs three seconds')}
 // Two players on three shrines is too few to split, so it falls back.
 {const {step}=atStage(9,['Detective','Firefighter']);const o=T.G.obj,st=o.steps[o.i];
  ok(T.G.obj.zones.length===3&&!st.split&&st.aloneT===T.HOLD_ALONE_T,'two players on three shrines fall back to one at a time')}}
// Enemy health is set in hits, so the fight does not turn to chewing gum at high stages.
{const hr=mk(),hp=s.createRoom(hr,'Detective',null,'Hits');T.enter(hr);const hits=[],brutes=[];
 for(let st=1;st<=10;st++){hp.maxStage=10;hp.nearSafe=true;s.hostAction(hr,hp,'travel',String(st));T.enter(hr);
  const H=T.G;H.enemies=[];hp.lvl=st*3;T.recalc(hp);hp.weaponUpgrades={};
  const w=hp.weapons.find(x=>x!=='fists')||'fists';hp.weapon=w;const dmg=T.weaponDamage(w);
  const weak=T.spawnMob(0,{x:hp.x+200,y:hp.y},false),brute=T.spawnMob(0,{x:hp.x+240,y:hp.y},true);
  hits.push(weak.maxHp/dmg);brutes.push(brute.maxHp/weak.maxHp)}
 ok(Math.max(...hits)/Math.min(...hits)<1.001,'a weak minion takes the same number of hits at every stage: '+hits[0].toFixed(2));
 ok(hits[0]>1.2&&hits[0]<3,'and that number is snappy rather than spongy: '+hits[0].toFixed(2)+' hits at the recommended level');
 ok(Math.abs(brutes[0]-3.2/.6)<1e-9&&Math.max(...brutes)/Math.min(...brutes)<1.001,'brutes keep their place in the family at every stage: '+(brutes[0]).toFixed(2)+' times a weak minion');
 ok(Math.abs(T.mobUnit(10)/T.mobUnit(1)-(11+2.6*30)/(11+2.6*3))<1e-9,'the unit follows recommended-level damage instead of a runaway curve')}
// A melee upgrade now buys damage as well as reach.
{const mr=mk(),mp=s.createRoom(mr,'Firefighter',null,'Melee');T.enter(mr);const H=T.G;H.enemies=[];
 const w=mp.weapons.find(x=>{const M=T.WEAPONS[x].m;return M!=='shoot'&&M!=='spell'})||'fists';mp.weapon=w;
 const dummy=T.spawnMob(0,{x:mp.x+40,y:mp.y},false);dummy.hp=dummy.maxHp=1e6;dummy.armor=0;dummy.kx=dummy.ky=0;
 const rnd0=Math.random;Math.random=()=>.4;
 const swing=(up)=>{mp.weaponUpgrades={[w]:up};T.recalc(mp);mp.s.crit=0;mp.cd.slash=0;mp.face=0;mp.x=dummy.x-24;mp.y=dummy.y;H.p=mp;
   mp.breakReady=0;dummy.kx=dummy.ky=0;dummy.brokenT=0;dummy.statusT=0;dummy.statusType='';dummy.statusBy=0;dummy.hp=dummy.maxHp;const before=dummy.hp;T.doAttack();return before-dummy.hp};
 const avg=(up)=>{let t=0;for(let i=0;i<60;i++)t+=swing(up);return t/60};
 const d0=avg(0),d1=avg(1),d2=avg(2);Math.random=rnd0;
 ok(T.MELEE_UP[0]===1&&T.MELEE_UP[1]===1.2&&T.MELEE_UP[2]===1.5,'the swing table is exactly 1, 1.2 and 1.5');
 ok(d0>0&&d1/d0>1.1&&d1/d0<1.33&&d2/d0>1.36&&d2/d0<1.66,'a melee upgrade adds damage in the same 1.2 and 1.5 steps a ranged upgrade gives (hit variance allowed): '+Math.round(d0)+' '+Math.round(d1)+' '+Math.round(d2))}
// The HUD pointer knows where every kind of objective is.
{const go=(n,chars)=>{const rr=mk(),list=[s.createRoom(rr,chars[0],null,'O'+n+chars.length)];
  for(let i=1;i<chars.length;i++)list.push(s.addPlayer(rr,chars[i],null,'O'+n+chars.length+i));
  T.enter(rr);const p=list[0];p.maxStage=10;p.nearSafe=true;s.hostAction(rr,p,'travel',String(n));T.enter(rr);
  T.G.enemies=[];T.G.killsStage=999;T.G.spawnT=1e9;for(const q of T.G.players)q.inv=1e9;s.step(rr,1/30);rr.ev.length=0;T.enter(rr);return {rr,p,list}};
 {const {rr,p}=go(1,['Detective']);const o=T.G.obj,st=o.steps[o.i],tg=T.objTargets(),scout=T.G.npcs.find(c=>c.wounded);
  ok(st.kind==='revive'&&tg.length===1&&tg[0].label==='Scout'&&tg[0].x===scout.x&&tg[0].y===scout.y,'the revive step points at the wounded scout')}
 {const {rr,p}=go(6,['Detective']);const o=T.G.obj,st=o.steps[o.i],zs=o.zones;
  ok(st.kind==='hold'&&T.objTargets().length===2,'a two plate step points at both plates');
  zs[0].done=true;zs[0].t=99;ok(T.objTargets().length===1,'and stops pointing at the plate that is already down');
  p.x=zs[1].x;p.y=zs[1].y;for(let i=0;i<260;i++){p.x=zs[1].x;p.y=zs[1].y;s.step(rr,1/30);rr.ev.length=0}
  ok(T.G.obj.done&&T.objTargets().length===0,'a finished objective leaves nothing to point at '+JSON.stringify({i:T.G.obj.i,done:!!T.G.obj.done,z:zs.map(z=>[!!z.done,+(z.t||0).toFixed(1)]),dead:p.deadT>0,inv:p.inv>9}))}
 {const {rr,p}=go(5,['Detective']);const o=T.G.obj,st=o.steps[o.i];
  ok(st.kind==='carry'&&T.objTargets().length===3&&T.objTargets().every(t=>t.label==='Canister'),'a carry step points at every canister still on the ground');
  p.carry={x:0,y:0,done:false,by:p.id};ok(T.objTargets().length===3&&T.objTargets().every(t=>t.label==='Vent'),'and points to each unfilled vent once somebody is carrying');p.carry=null}
 {const {rr,p}=go(3,['Detective']);const o=T.G.obj,st=o.steps[o.i];
  ok(st.kind==='escort'&&T.objTargets().length===1&&T.objTargets()[0].label==='Boat','an escort step points at the boat')}
 {const {rr,p}=go(2,['Detective']);const o=T.G.obj,st=o.steps[o.i];
  ok(T.objTargets().length>=1,'a beacon step points at the beacons that are still dark')}}
// An online client cannot see the objective's rules or far props, so the snapshot carries where to point.
{const {snapshot,newClient}=require('./sync');const rr=mk(),p=s.createRoom(rr,'Detective',null,'Wire');T.enter(rr);p.maxStage=10;p.nearSafe=true;s.hostAction(rr,p,'travel','1');T.enter(rr);T.G.enemies=[];T.G.killsStage=999;T.G.spawnT=1e9;p.inv=1e9;s.step(rr,1/30);rr.ev.length=0;T.enter(rr);
 const scout=T.G.npcs.find(c=>c.wounded);scout.x=p.x+5000;scout.y=p.y;s.step(rr,1/30);rr.ev.length=0;T.enter(rr);
 const m=snapshot(rr,p,newClient(),1),o=JSON.parse(m.g.obj);ok(o.tg.length===1&&o.tg[0][2]==='Scout'&&Math.abs(o.tg[0][0]-scout.x)<=5&&!(m.n&&m.n[0].some(c=>c.wounded)),'the snapshot names a target the client has not been sent');
 const client={i:o.i,done:false,steps:[],cur:{have:o.h,need:o.n,label:o.l},tg:o.tg,holdNeed:o.hn},real=T.G.obj;T.G.obj=client;const out=T.objTargets();T.G.obj=real;ok(out.length===1&&out[0].label==='Scout'&&out[0].x===o.tg[0][0],'the client turns it into a pointer without the step list')}
// Reactions are limited per target, so fast weapons cannot turn every second hit into rage and boss guard.
{const r=mk(),a=s.createRoom(r,'Detective',null,'Rate');T.enter(r);G().mp=false;G().enemies=[];const e=rxFoe(rxBy(),G().safe.y);G().enemies=[e];a.rage=0;G().p=a;
 T.hitEnemy(e,10,0,0);T.hitEnemy(e,10,0,0);ok(a.rage===6,'the second hit reacts');for(let i=0;i<8;i++)T.hitEnemy(e,10,0,0);ok(a.rage===6&&e.statusT>0,'further hits only refresh the status during the cooldown');
 G().t+=2.01;T.hitEnemy(e,10,0,0);ok(a.rage===12,'the next reaction fires once the cooldown ends');
 const b=rxFoe(rxBy()+40,G().safe.y);G().enemies.push(b);T.hitEnemy(b,10,0,0);T.hitEnemy(b,10,0,0);ok(a.rage===18,'the cooldown belongs to each target')}
// C-22 Stage 2: the thicket hides enemies, Stalkers ambush from it, and beacons need defending.
{const go=(n,chars=['Detective'])=>{const rr=mk(),list=[s.createRoom(rr,chars[0],null,'T'+n)];for(let i=1;i<chars.length;i++)list.push(s.addPlayer(rr,chars[i],null,'T'+n+i));T.enter(rr);const p=list[0];p.maxStage=10;p.nearSafe=true;s.hostAction(rr,p,'travel',String(n));T.enter(rr);T.G.enemies=[];T.G.killsStage=999;T.G.spawnT=1e9;for(const q of T.G.players)q.inv=1e9;const step=(k=1)=>{for(let i=0;i<k;i++){s.step(rr,1/30);rr.ev.length=0}T.enter(rr)};step(1);T.G.enemies=[];return{rr,p,list,step}};
 const coverAt=()=>{const W=T.G.w,c=W.cover.find(c=>Math.hypot((c%78+.5)*40-T.G.safe.x,((c/78|0)+.5)*40-T.G.safe.y)>600);return{x:(c%78+.5)*40,y:((c/78|0)+.5)*40}};
 const clearTo=(a,b)=>{const W=T.G.w;for(let k=0;k<=20;k++){const x=(a.x+(b.x-a.x)*k/20)/40|0,y=(a.y+(b.y-a.y)*k/20)/40|0;W.map[y*78+x]=0}};
 {go(2);const a=T.G.w,c=T.genCitySeeded(777),d=T.genCitySeeded(777);ok(a.cover.length>=30&&a.props.some(o=>o.t==='thicket'),'stage 2 grows thicket patches: '+a.cover.length+' tiles');ok(c.cover.length===d.cover.length&&c.cover.every((v,i)=>v===d.cover[i]),'the same seed grows the same thicket, so client and server agree');go(1);ok(T.G.w.cover.length===0&&!T.G.w.props.some(o=>o.t==='thicket'),'other stages have none')}
 {const {p}=go(2),o=coverAt(),e=T.spawnMob(0,o,false);p.x=o.x+200;p.y=o.y;e.flash=0;ok(T.inThicket(e)&&T.concealed(e,p),'an enemy in the thicket is hidden beyond 120 units');p.x=o.x+100;ok(!T.concealed(e,p),'and shows inside 120 units');p.x=o.x+200;e.markT=2;ok(!T.concealed(e,p),'a marked enemy shows through the thicket');e.markT=0;e.flash=.1;ok(!T.concealed(e,p),'so does one that was just hit');e.flash=0;e.kind='boss';ok(!T.concealed(e,p),'a boss never hides');e.kind='rival';
  clearTo(o,{x:p.x,y:p.y});T.G.p=p;ok(T.teamTarget(p,'shooter',{x:o.x,y:o.y})===null,'Mark cannot pick an enemy the player cannot see');p.x=o.x+100;ok(T.teamTarget(p,'shooter',{x:o.x,y:o.y})===e,'but can once it is in sight')}
 {const {p,step}=go(2),o=coverAt();p.x=T.G.safe.x;p.y=T.G.safe.y;const made=[];for(let i=0;i<40&&made.length<2;i++){const e=T.spawnStalker();if(e)made.push(e)}ok(made.length>=1&&made.every(e=>e.role==='stalker'&&e.lurk&&T.inThicket(e)&&Math.hypot(e.x-p.x,e.y-p.y)>=300),'Stalkers spawn lurking in cover, away from players');T.G.enemies=[];
  const e=T.spawnStalker();e.x=o.x;e.y=o.y;e.cd=99;p.x=o.x+600;p.y=o.y;p.inv=1e9;step(30);ok(e.lurk&&e.x===o.x&&!(e.aimT>0),'a Stalker waits while nobody is near');
  const q={x:o.x+180,y:o.y};clearTo(o,q);p.x=q.x;p.y=q.y;step(1);ok(e.aimT>0&&!T.concealed(e,p),'a player in range sets off a visible warning first');
  const hp=p.hp;for(let i=0;i<30&&!(e.pounceT>0);i++){p.inv=0;p.x=q.x;p.y=q.y;step(1)}ok(e.pounceT>0&&!e.lurk,'then it lunges');for(let i=0;i<30&&e.pounceT>0;i++){p.inv=0;p.x=q.x;p.y=q.y;step(1)}ok(p.hp<hp&&!(e.exposedT>0),'a lunge that lands hurts');
  e.lurk=true;e.pounceT=0;e.aimT=0;e.x=o.x;e.y=o.y;e.kx=e.ky=0;p.x=q.x;p.y=q.y;p.inv=1e9;for(let i=0;i<60&&!(e.exposedT>0);i++){p.x=q.x;p.y=q.y;step(1)}ok(e.exposedT>0,'a lunge that is dodged leaves it open')}
 {const {p,step}=go(2),st=T.G.obj.steps[T.G.obj.i],zs=T.G.obj.zones;ok(st.guard&&zs.length===3&&T.objTargets()[0].label==='Beacon','Stage 2 asks for three guarded beacons');const z=zs[0],hold=k=>{for(let i=0;i<k;i++){p.x=z.x;p.y=z.y;step(1)}};
  T.G.w.cover.length=0;const before=T.G.enemies.length;hold(1);ok(T.G.enemies.length-before===2&&z.alarm,'starting a beacon draws a wave at the lighter');hold(30);ok(T.G.enemies.length-before===2,'but only one wave per beacon');
  T.G.enemies=[];p.x=z.x;p.y=z.y;const lit=z.t;p.inv=0;T.G.p=p;T.hurtPlayer(1);ok(Math.abs(z.t-(lit-1))<1e-9,'a hit on the lighter sets the beacon back a second');p.inv=1e9;
  const t0=z.t;p.x=z.x+300;p.y=z.y;p.inv=0;T.G.p=p;T.hurtPlayer(1);ok(z.t===t0,'a hit away from the beacon does not');p.inv=1e9;
  T.resetStepState();ok(!z.alarm&&z.t===0,'a wipe resets the beacon and its wave');for(const y of zs){for(let i=0;i<200&&!y.done;i++){p.x=y.x;p.y=y.y;T.G.enemies=[];step(1)}}step(1);ok(T.G.obj.done&&T.G.gate.open,'a solo player can light all three and open the gate')}
 {const {list,step}=go(2,['Detective','Firefighter']),z=T.G.obj.zones[0],before=T.G.enemies.length;list[0].x=z.x;list[0].y=z.y;step(1);ok(T.G.enemies.length-before===Math.round(2*1.3),'the wave grows with the party')}
 {const {snapshot,newClient}=require('./sync'),{rr,p}=go(2);s.step(rr,1/30);T.enter(rr);const w=JSON.parse(snapshot(rr,p,newClient(),1).g.obj);ok(w.hn===5&&w.tg.length===3&&w.tg[0][2]==='Beacon','online clients get the beacon names and the five second ring')}}
// Enemy AI: enemies press in turns, track then commit, punish openings, and do not forget a player at the safehouse.
{const arena=(chars=['Detective'])=>{const rr=mk(),list=[s.createRoom(rr,chars[0],null,'AI')];for(let i=1;i<chars.length;i++)list.push(s.addPlayer(rr,chars[i],null,'AI'+i));T.enter(rr);const W=T.G.w;for(let y=2;y<53;y++)for(let x=2;x<76;x++)W.map[y*78+x]=0;T.G.enemies=[];T.G.spawnT=1e9;T.G.villT=1e9;T.G.gate.open=true;const p=list[0];p.x=T.G.safe.x+900;p.y=T.G.safe.y;p.inv=1e9;const step=(k=1)=>{for(let i=0;i<k;i++){s.step(rr,1/30);rr.ev.length=0;T.enter(rr)}};return{rr,p,list,step}};
 const foe=(p,dx,dy,role='rusher')=>{const e=T.spawnMob(0,{x:p.x+dx,y:p.y+dy},role==='brute');e.role=role;e.method='melee';e.a.melee=true;e.aware=true;e.alerted=true;e.hp=e.maxHp=1e6;e.cd=0;return e};
 {const {p,step}=arena(),es=[0,1,2,3,4,5].map(i=>foe(p,Math.cos(i)*100,Math.sin(i)*100));let most=0,orbit=0;for(let i=0;i<30;i++){p.inv=1e9;step(1);most=Math.max(most,es.filter(e=>e.wind>0).length);orbit=Math.max(orbit,es.filter(e=>e.slotA!==undefined&&!(e.wind>0)).length)}ok(most<=2,'at most two enemies wind up on one player: '+most);ok(orbit>=4,'the others circle and wait');const had=new Set();for(let i=0;i<240;i++){p.inv=1e9;step(1);es.forEach((e,j)=>{if(e.wind>0)had.add(j)})}ok(had.size>2,'slots rotate, so more than two get a turn: '+had.size)}
 {const {p}=arena(),e=foe(p,20,0);T.G.p=p;e.wind=e.windMax=1;e.ang=Math.PI;p.x=e.x;p.y=e.y-100;T.updateEnemy(e,.1);const t1=e.ang;ok(t1!==Math.PI,'aim follows the player during the wind-up');e.wind=.2;e.ang=0;const x0=e.x;T.updateEnemy(e,.01);ok(e.ang===0&&e.x!==x0,'near the end it commits and steps forward, so a late dodge works')}
 {const {p}=arena(),e=foe(p,20,0,'brute');T.G.p=p;e.wind=e.windMax=.01;e.delayed=false;p.dashT=.2;const dc=T.AI.delayChance;T.AI.delayChance=1;T.updateEnemy(e,.02);T.AI.delayChance=dc;ok(e.wind>0&&e.delayed,'a brute can hold its swing to catch a panic dodge');p.dashT=0;e.wind=.01;T.updateEnemy(e,.02);ok(!(e.wind>0),'but only once per swing')}
 {const {p}=arena(),e=foe(p,20,0);T.G.p=p;e.wind=e.windMax=.01;e.comboLeft=1;e.delayed=true;T.updateEnemy(e,.02);ok(e.wind>0&&e.comboLeft===0,'an attack can chain into a second one');e.wind=.01;T.updateEnemy(e,.02);ok(!(e.wind>0)&&!e.tok,'and the slot is given up afterwards')}
 {const {p,step}=arena(),e=foe(p,200,0);e.cd=9;T.G.p=p;T.updateEnemy(e,.01);ok(!(e.rushT>0),'no rush while the player is not open');p.healFx=.8;T.updateEnemy(e,.01);ok(e.rushT>0&&e.cd<=.05,'healing draws a rush from nearby enemies');e.rushT=0;e.cd=9;T.updateEnemy(e,.01);ok(!(e.rushT>0),'on a cooldown');p.healFx=0;e.punishCd=0;p.reviveProgress=.3;T.updateEnemy(e,.01);ok(e.rushT>0,'reviving an ally leaves the reviver open too')}
 {const {p}=arena(),e=foe(p,300,0);e.a.melee=false;e.a.atk=1;e.method='shoot';e.role='shooter';T.G.shots=[];T.G.p=p;p.vx=0;p.vy=0;T.updateEnemy(e,.01);const st=T.G.shots.pop();e.cd=0;e.x=p.x+300;e.y=p.y;p.vx=0;p.vy=200;T.updateEnemy(e,.01);const ld=T.G.shots.pop();ok(Math.abs(st.vy)<1&&ld.vy>10,'a shooter leads a moving player')}
 {const {p,step}=arena(),e=foe(p,120,0);e.cd=0;p.x=T.G.safe.x;p.y=T.G.safe.y;e.x=p.x+120;e.y=p.y;const hp=p.hp;p.inv=0;for(let i=0;i<60;i++){p.inv=0;p.x=T.G.safe.x;p.y=T.G.safe.y;step(1)}ok(e.aware&&p.hp===hp,'enemies stay alert outside the safehouse without hurting anyone inside');ok(Math.hypot(e.x-p.x,e.y-p.y)>=150,'and keep back from it')}
 {const {p,step}=arena(),e=foe(p,1000,0);e.cd=9;T.G.p=p;T.updateEnemy(e,.01);ok(e.aware,'an enemy does not give up at 900 units');e.lostT=99;T.updateEnemy(e,.01);ok(!e.aware,'it forgets after losing sight for long enough')}
 {const {p}=arena(),a=foe(p,600,0),b=T.spawnMob(0,{x:p.x+700,y:p.y},false);a.alerted=false;b.aware=false;T.G.p=p;T.updateEnemy(a,.01);ok(b.aware,'a spotting enemy alerts the pack')}
 {const {p,step}=arena(),e=foe(p,60,0);e.method='shield';e.cd=9;e.ang=0;e.a.melee=true;p.x=e.x-60;p.y=e.y;step(1);ok(Math.abs(e.ang)<.2,'a guard turns slowly, so flanking it works')}
 {const {rr,p,step}=arena(),o=T.G.safe;T.G.w.cover=[Math.floor((p.y+200)/40)*78+Math.floor((p.x+300)/40)];T.G.w.thicket[T.G.w.cover[0]]=1;const e=foe(p,300,100,'stalker');e.lurk=false;e.tok=0;e.cd=9;e.hideT=99;T.G.p=p;for(let i=0;i<200&&!e.lurk;i++){e.cd=9;T.updateEnemy(e,.05)}ok(e.lurk&&!e.aware,'a Stalker slips back into cover after a while')}
 {const {p,step}=arena();T.summonBoss();const b=T.G.boss;b.x=p.x+80;b.y=p.y;T.G.p=p;b.act='walk';b.actT=5;b.cd=9;p.healFx=.8;T.updateEnemy(b,.01);ok(b.actT<=.1&&b.cd<=.1,'a boss punishes healing by acting sooner');p.healFx=0;b.act='slam';b.actT=.001;b.cd=0;b.tel={k:'circle',r:50};const bc=[T.AI.bossChain,T.AI.bossChainLow];T.AI.bossChain=T.AI.bossChainLow=1;T.updateEnemy(b,.01);[T.AI.bossChain,T.AI.bossChainLow]=bc;ok(b.act==='slam'&&b.tel&&b.actT>=.6,'a boss can chain attacks, and each keeps its full warning')}}
// Enemy damage is set in hits to down a player at the recommended level.
{const rr=mk(),p=s.createRoom(rr,'Detective',null,'Hits');T.enter(rr);const want=[10,8,7,7,7,7,7,7,7,7],got=[];for(let st=1;st<=10;st++){p.lvl=T.recLevel(st);T.recalc(p);const ar=p.s.armor,h=p.s.maxHp/(T.mobHit(st)*.7*(1-ar/(ar+60)));got.push(+h.toFixed(1));ok(h<=want[st-1]+.01,'stage '+st+': a weak hit takes at most '+want[st-1]+' to down a player at the recommended level: '+h.toFixed(1))}ok(got[0]>=got[1]&&got[1]>=got[2],'and Stage 1 stays the gentlest')}
// M1: Gloom Eye (C-23), Duskwater Fen (C-24) and Banshee Phantasm (C-25).
{const go=(n,chars=['Detective'])=>{const rr=mk(),list=[s.createRoom(rr,chars[0],null,'M'+n)];for(let i=1;i<chars.length;i++)list.push(s.addPlayer(rr,chars[i],null,'M'+n+i));T.enter(rr);const p=list[0];p.maxStage=10;p.nearSafe=true;s.hostAction(rr,p,'travel',String(n));T.enter(rr);const W=T.G.w;for(let y=2;y<53;y++)for(let x=2;x<76;x++)W.map[y*78+x]=0;T.G.enemies=[];T.G.spawnT=1e9;T.G.villT=1e9;for(const q of list){q.inv=0;q.hp=q.s.maxHp=1e6;q.x=1400+list.indexOf(q)*30;q.y=1000}const step=(k=1)=>{for(let i=0;i<k;i++){s.step(rr,1/30);rr.ev.length=0;T.enter(rr)}};return{rr,p,list,step}};
 const boss=(p)=>{T.G.gate.open=true;T.G.gate.x=p.x;T.G.gate.y=p.y-200;T.G.p=p;T.summonBoss();const b=T.G.boss;b.act='walk';b.actT=99;b.cd=99;b.hp=b.maxHp=1e7;b.x=p.x;b.y=p.y-200;return b};
 const tick=(b,p,dt=1/30,k=1)=>{for(let i=0;i<k;i++){T.G.p=p;T.updateEnemy(b,dt)}};
 {const {p,list}=go(2,['Detective','Firefighter']),b=boss(p),q=list[1];ok(T.G.boss.name&&(b.phase||0)===0,'the Stage 2 boss is summoned');
  b.act='beam';b.actT=1;b.beamDir=1;b.beamA=Math.atan2(p.y-(b.y),p.x-b.x);b.eyeT=0;const h0=p.hp,h1=q.hp;q.x=b.x-300;q.y=b.y;tick(b,p);ok(p.hp<h0&&q.hp===h1,'the gaze beam hits the player in its line and nobody else');
  b.act='slam3';b.tel={k:'spots',spots:[{x:q.x,y:q.y}],r:62,dur:.85};b.actT=0;p.inv=q.inv=0;const h2=q.hp,h3=p.hp;tick(b,p);ok(q.hp<h2&&p.hp===h3,'tentacle slam hits inside its marked circles only');
  b.act='pulse';b.actT=0;tick(b,p);ok(p.blindT>0&&q.blindT>0,'blinding pulse shrinks everyone\'s vision');
  b.act='gaze';b.gazeId=p.id;b.actT=0;p.face=Math.atan2(b.y-p.y,b.x-p.x);tick(b,p);ok(p.stunT>0&&!(b.eyeT>0),'facing the gaze stuns the player');T.G.p=p;const sh=T.G.shots.length;p.cd.slash=0;p.weapon='pistol';T.doAttack();ok(T.G.shots.length===sh,'a stunned player cannot attack');p.stunT=0;
  b.act='gaze';b.gazeId=p.id;b.actT=0;p.face=Math.atan2(p.y-b.y,p.x-b.x);tick(b,p);ok(b.eyeT>0&&!(p.stunT>0),'looking away opens the back eye');
  b.guard=0;b.staggerT=0;q.x=b.x+(b.x-p.x);q.y=b.y+(b.y-p.y);T.G.p=q;T.hitEnemy(b,10,0,0);ok(b.guard>=30,'an ally behind it lands a big guard hit: '+b.guard);const gb=b.guard;b.eyeCd=0;b.statusT=0;b.reactAt=0;T.G.p=p;T.hitEnemy(b,10,0,0);ok(b.guard===gb,'a hit from the front does not');
  b.act='beam';b.actT=.001;b.phase=2;b.beamTwice=false;tick(b,p);ok(b.act==='beamAim'&&b.tel&&b.tel.dur>=.6,'at 25% the beam sweeps back, with a fresh warning')}
 {const {p}=go(2),b=boss(p);b.act='beam';b.actT=1;b.beamDir=1;b.beamA=Math.atan2(p.y-b.y,p.x-b.x);b.eyeT=0;p.dashT=.2;p.inv=1;tick(b,p);ok(b.eyeT>0,'solo, dodging through the beam opens the eye')}
 {go(3);const w=T.G.w;ok(w.isle&&w.isle.some(v=>v),'Duskwater Fen has islands');go(2);ok(!T.G.w.isle,'other stages do not');
  ok(T.tideAt(0)===0&&Math.abs(T.tideAt(T.TIDE.rise/2)-.5)<1e-9&&T.tideAt(T.TIDE.rise+1)===1,'the tide rises, holds and falls on a cycle')}
 {const {p,step}=go(3);const w=T.G.w,wet=w.open.find(c=>!w.isle[c]&&!w.ground[c]),dry=w.open.find(c=>w.isle[c]);T.G.tide=1;p.x=(wet%78+.5)*40;p.y=((wet/78|0)+.5)*40;ok(Math.abs(T.envSpeed(p)-(1-T.TIDE.slow))<1e-9,'high water slows a player off the islands');p.x=(dry%78+.5)*40;p.y=((dry/78|0)+.5)*40;ok(T.envSpeed(p)===1,'an island keeps them at full speed')}
 {const {p,list,step}=go(3,['Detective','Firefighter']),q=list[1];const w=T.G.w;T.G.tide=0;const e=T.spawnLurker();ok(e&&e.role==='lurker'&&e.lurk&&!T.dryAt(e),'a Lurker waits under the water');e.x=1400;e.y=1000;e.cd=99;p.x=e.x+40;p.y=e.y;T.G.p=p;T.updateEnemy(e,1/30);ok(p.grabT>0&&e.grab===p.id,'it grabs a player who comes close');
  const x0=p.x;T.G.p=p;T.updateEnemy(e,.5);ok(p.x!==x0&&T.envSpeed(p)===0,'and drags them, and they cannot walk away');T.G.p=p;p.cd.dash=0;p.dashT=0;T.doDash();ok(!(p.dashT>0),'or dodge out');
  T.G.p=p;T.hitEnemy(e,1,0,0);ok(e.grab===p.id,'in a party, your own hits do not free you');T.G.p=q;T.hitEnemy(e,1,0,0);ok(!e.grab&&!(p.grabT>0)&&e.exposedT>0,'an ally\'s hit frees you and leaves it open')}
 {const {p}=go(3);T.G.tide=0;const e=T.spawnLurker();e.cd=99;p.x=e.x+40;p.y=e.y;T.G.p=p;T.updateEnemy(e,1/30);T.G.p=p;T.hitEnemy(e,1,0,0);ok(!e.grab&&!(p.grabT>0),'solo, your own hit frees you')}
 {const {rr,p,list,step}=go(3,['Detective','Firefighter']),q=list[1],b=boss(p);const ls=T.G.props.filter(o=>o.kind==='lantern');ok(ls.length===2&&T.bossWarded(b),'the Banshee arrives with two unlit lanterns and cannot be hurt');const hp=b.hp;T.G.p=p;T.hitEnemy(b,100,0,0);ok(b.hp===hp,'hits do nothing outside lantern light');
  const l=ls[0];q.x=l.x;q.y=l.y;step(1);ok(q.carry===l&&l.by===q.id&&T.lanternLit(l),'picking up a lantern lights it');q.x=b.x+40;q.y=b.y;step(1);ok(!T.bossWarded(b),'a lit lantern near her lets the party hurt her');T.G.p=p;p.x=b.x;p.y=b.y+60;T.hitEnemy(b,100,0,0);ok(b.hp<hp,'and hits land');
  q.reviveHold=.45;step(1);ok(!q.carry&&!l.by&&l.t>0&&l.t<=T.BANSHEE.lanternLit,'setting it down keeps it lit for a while in a party');step(Math.ceil(T.BANSHEE.lanternLit*30)+5);ok(!T.lanternLit(l)&&T.bossWarded(b)&&!q.carry,'then it goes out, and standing on it does not pick it straight back up')}
 {const {p,step}=go(3),b=boss(p);const l=T.G.props.find(o=>o.kind==='lantern');p.x=l.x;p.y=l.y;step(1);p.reviveHold=.45;step(1);step(400);ok(T.lanternLit(l),'solo, a set lantern stays lit')}
 {const {p,list}=go(3,['Detective','Firefighter']),q=list[1],b=boss(p);b.act='wailGo';b.wailR=150;b.wailHit=[];b.wailGap=0;p.x=b.x;p.y=b.y+152;q.x=b.x+152;q.y=b.y;const h0=p.hp,h1=q.hp;tick(b,p,.001);ok(p.hp<h0&&q.hp===h1,'the wail hits everyone on the ring except in its gap');const h2=p.hp;tick(b,p,.001);ok(p.hp===h2,'once per wail')}
 {const {p}=go(3),b=boss(p);b.act='drift';b.actT=1;b.ghostT=1;b.driftTo={x:b.x+200,y:b.y};const hp=b.hp;T.G.p=p;T.hitEnemy(b,100,0,0);ok(b.hp===hp,'she cannot be hurt while drifting')}
 {const {p}=go(3),b=boss(p);b.act='tether';b.possId=p.id;b.actT=0;tick(b,p);ok(p.possT>0&&T.envSpeed(p)===.5,'possess slows the player')}
 {const {rr,p,step}=go(3),b=boss(p);b.act='walk';b.actT=99;const d0=Math.hypot(b.x-p.x,b.y-p.y);p.possT=3;step(30);ok(Math.hypot(b.x-p.x,b.y-p.y)<d0,'and drifts them toward her');const l=T.G.props.find(o=>o.kind==='lantern');p.x=l.x;p.y=l.y;step(1);T.restartCheckpoint();ok(!T.G.props.some(o=>o.kind==='lantern')&&!p.carry,'a wipe clears the lanterns and frees the carrier')}}
// C-31: Chitin Horror, solo and party.
{const setup=(party=false)=>{const r=mk(),p=s.createRoom(r,'Detective',null,'Chitin'),q=party?s.addPlayer(r,'Firefighter',null,'Chitin ally'):null;T.enter(r);p.maxStage=10;p.nearSafe=true;s.hostAction(r,p,'travel','4');T.enter(r);for(let y=2;y<53;y++)for(let x=2;x<76;x++)T.G.w.map[y*78+x]=0;T.G.enemies=[];T.G.spawnT=T.G.villT=1e9;T.G.gate.x=1400;T.G.gate.y=1000;T.G.gate.open=true;T.G.p=p;T.summonBoss();const b=T.G.boss;b.x=1400;b.y=960;b.ang=0;b.act='walk';b.actT=99;b.cd=99;b.hp=b.maxHp=1e7;p.x=1500;p.y=960;p.s.crit=0;p.inv=0;if(q){q.x=1300;q.y=960;q.s.crit=0;q.inv=0}return{r,p,q,b}};
 {const {p,q,b}=setup(true);T.G.p=p;let h=b.hp;T.hitEnemy(b,1000,0,0);const front=h-b.hp;T.G.p=q;h=b.hp;b.statusT=0;T.hitEnemy(b,1000,0,0);const back=h-b.hp;ok(back>front*7,'Chitin shell blocks most damage from the front while an ally can hit its back');b.hp=b.maxHp*.59;T.bossPhaseCheck(b);const eggs=T.G.props.filter(o=>o.bossEgg);ok(b.phase===1&&eggs.length===3&&eggs.every(o=>o.t===10),'at 60 percent three sacs have ten seconds to hatch');T.eggHit(eggs[0]);b.hp=b.maxHp*.29;T.bossPhaseCheck(b);ok(b.phase===2&&T.G.props.filter(o=>o.bossEgg&&!o.done).length===2,'molting leaves unbroken sacs active');T.G.p=p;h=b.hp;T.hitEnemy(b,1000,0,0);ok(h-b.hp>front*7,'the molt removes the front armor');T.restartCheckpoint();ok(!T.G.props.some(o=>o.bossEgg),'a wipe clears boss egg sacs')}
 {const {r,p,b}=setup();b.hp=b.maxHp*.59;T.bossPhaseCheck(b);const eggs=T.G.props.filter(o=>o.bossEgg);T.eggHit(eggs[0]);for(let i=0;i<305;i++){s.step(r,1/30);r.ev.length=0}T.enter(r);ok(eggs.every(o=>o.done)&&T.G.enemies.filter(e=>e.minion&&!e.dead).length===2,'only uncut sacs hatch once');T.G.p=p;T.killEnemy(b);ok(!T.G.props.some(o=>o.bossEgg),'boss death removes its sacs')}
 {const {p,b}=setup();b.act='chitinCharge';b.actT=1;b.chargeHits=[];b.ang=0;p.x=b.x+b.r+p.r;p.y=b.y;p.dashT=.2;p.inv=1;T.G.p=p;T.updateBoss(b,1/30,100,true);ok(b.staggerT>0&&b.act==='walk','solo dodging through the charge makes the boss stumble')}
 {const {p,q,b}=setup(true);b.act='webSpit';b.actT=0;T.G.p=p;T.updateBoss(b,1/30,100,true);ok(T.G.shots.some(o=>o.web&&o.from==='e'),'web spit fires a rooting projectile');b.act='chitinCharge';b.actT=1;b.chargeHits=[];b.ang=0;p.x=b.x+b.r+p.r;p.y=b.y;p.dashT=.2;p.inv=1;T.G.p=p;T.updateBoss(b,1/30,100,true);ok(!(b.staggerT>0),'the solo charge stumble is not granted to a party')}
}
// The Swarm: endless waves on a stage map, with no rewards carried back to the story character.
{const sw=(chars=['Detective'],stage=1,save={maxStage:3})=>{const rr=mk(),list=[s.createRoom(rr,chars[0],JSON.parse(JSON.stringify(save)),'S',{mode:'swarm',stage})];for(let i=1;i<chars.length;i++)list.push(s.addPlayer(rr,chars[i],null,'S'+i));T.enter(rr);for(const q of list)q.inv=1e9;const step=(k=1)=>{for(let i=0;i<k;i++){for(const q of list)q.inv=1e9;s.step(rr,1/30);rr.ev.length=0;T.enter(rr)}};return{rr,p:list[0],list,step}};
 const S=()=>T.G.swarm,clearWave=(p)=>{for(const e of T.G.enemies.slice()){if(!e.dead){T.G.p=p;T.killEnemy(e)}}};
 {const {rr}=sw(['Detective'],3);ok(T.G.stage===3&&S()&&S().wave===0&&!T.G.obj&&!T.G.gate.open&&!T.G.enemies.length,'a Swarm room starts on the chosen stage with no objective and a short break');ok(rr.mode==='swarm','the room knows its mode')}
 {sw(['Detective'],9);ok(T.G.stage===3,'the stage is clamped to the furthest one reached')}
 {const {p,step}=sw();step(Math.ceil(T.SWARM.first*30)+2);ok(S().wave===1&&S().total===T.SWARM.base+T.SWARM.step,'the first wave starts after the break, sized base plus step');step(200);ok(S().spawned===S().total&&T.G.enemies.filter(e=>!e.dead).every(e=>e.aware),'every enemy of the wave arrives and comes for the party');
  const w1=S().total;clearWave(p);const pot=p.potions;step(1);ok(S().breakT>0&&p.swarmBest===1&&p.potions===Math.min(5,pot+1),'clearing a wave starts a break, records the best wave and hands out a potion');step(Math.ceil(T.SWARM.breakT*30)+2);ok(S().wave===2&&S().total>w1,'each wave is bigger than the last')}
 {const {p,step}=sw();S().breakT=0;S().wave=39;T.nextWave();step(30*40);const own=T.G.enemies.filter(e=>!e.dead&&e.swarm).length;ok(own<=T.SWARM.cap&&own>=T.SWARM.cap-5,'the director keeps about '+T.SWARM.cap+' of its enemies alive at once, never more: '+own);const base=T.spawnMob(0,{x:p.x+900,y:p.y},false);base.dead=true;const late=T.G.enemies.find(e=>!e.dead&&e.swarm&&e.mob==='weak');ok(late&&late.maxHp>=base.maxHp*2&&late.dmg>base.dmg*2,'and late waves are tougher instead: '+(late?Math.round(late.maxHp/base.maxHp*10)/10:0)+'x life')}
 {const {p,rr,step}=sw();const kits=[];for(const w of[4,9,14]){T.G.enemies=[];T.G.boss=null;S().breakT=0;S().wave=w;T.nextWave();kits.push(T.G.boss&&T.G.boss.kit)}ok(kits.join()==='1,2,3','boss waves rotate the three stage bosses: '+kits.join());ok(T.G.props.some(o=>o.kind==='lantern'),'and the Banshee brings her lanterns on any map');
  const ms=p.maxStage;T.G.p=p;T.killEnemy(T.G.boss);step(2);ok(!rr.cleared&&!T.G.clearPending&&p.maxStage===ms,'killing a Swarm boss does not clear the stage')}
 {const {p,rr,step}=sw(['Detective'],1,{maxStage:3,gold:40,lvl:5});const g0=p.gold,l0=p.lvl;p.gold+=900;p.lvl=12;p.swarmBest=7;const sv=s.saveOf(p);ok(sv.gold===g0&&sv.lvl===l0&&sv.swarmBest===7,'nothing earned in the Swarm reaches the saved character, except the best wave')}
 {const {p,rr,step}=sw();S().breakT=0;T.nextWave();p.gold+=500;T.restartCheckpoint();ok(S().over&&!T.G.enemies.length,'a wipe ends the run');step(Math.ceil(T.SWARM.overT*30)+2);ok(!S().over&&S().wave===0&&p.gold<500,'and a fresh run starts with the character as it was')}
 {const {p,rr,step}=sw(),rrOf=()=>rr;S().breakT=0;T.nextWave();step(1);const e=T.G.enemies.find(x=>!x.dead);e.method='melee';e.a.melee=true;e.role='rusher';e.cd=0;p.x=T.G.safe.x;p.y=T.G.safe.y;e.x=p.x+20;e.y=p.y;const hp=p.hp;for(let i=0;i<60;i++){p.inv=0;p.x=T.G.safe.x;p.y=T.G.safe.y;e.x=p.x+20;e.y=p.y;s.step(T.G===undefined?null:rrOf(),1/30)}ok(p.hp<hp,'during a wave the safehouse is no shelter')}
 {const {p,rr}=sw(['Detective'],1);p.nearSafe=true;s.hostAction(rr,p,'travel','2');T.enter(rr);ok(T.G.stage===1&&T.G.swarm,'travel is ignored during the Swarm')}
 {const {snapshot,newClient}=require('./sync'),{p,rr}=sw();const g=snapshot(rr,p,newClient(),1).g;const o=JSON.parse(g.sw);ok(o.w===0&&o.b>0&&o.o===0,'snapshots carry the wave state')}}
// Encounter cleanup must also work for damage over time, wipes and endless-mode retries.
{const r=mk(),p=s.createRoom(r,'Detective',{maxStage:3},'Cleanup');const q=s.addPlayer(r,'Firefighter',null,'Ally');T.enter(r);
 const e=T.spawnMob(0,{x:p.x+200,y:p.y},false);e.role='lurker';e.grab=p.id;p.grabT=6;T.G.p=q;T.killEnemy(e);ok(!p.grabT&&!e.grab,'killing a grabbing Lurker directly releases its victim');
 T.summonBoss(3);const b=T.G.boss,l=T.G.props.find(o=>o.kind==='lantern');p.carry=l;l.by=p.id;p.possT=6;T.G.p=q;T.killEnemy(b);ok(!p.carry&&!p.possT&&!T.G.props.some(o=>o.kind==='lantern'),'a defeated Banshee releases lantern carriers and possession');
 p.grabT=6;p.stunT=2;p.blindT=5;p.possT=6;T.restartCheckpoint();ok(!p.grabT&&!p.stunT&&!p.blindT&&!p.possT,'checkpoint retries clear encounter statuses');
 p.grabT=6;p.stunT=2;p.blindT=5;p.possT=6;p.nearSafe=true;s.hostAction(r,p,'travel',2);T.enter(r);ok(!p.grabT&&!p.stunT&&!p.blindT&&!p.possT,'stage travel clears encounter statuses')}
{const r=mk(),p=s.createRoom(r,'Detective',{maxStage:3,potions:9,gold:40},'Retry',{mode:'swarm'});T.enter(r);
 const S=T.G.swarm;S.breakT=0;S.wave=1;S.spawned=S.total=0;T.swarmTick(1/30);ok(p.potions===9,'a wave reward never removes potions above the reward cap');
 T.G.loot.push({x:p.x,y:p.y,kind:'gold',amt:999,t:0});p.fastT=20;p.magicT=20;p.combo=10;p.comboT=6;p.teamCd=12;p.mendT=10;p.breakReady=4;p.dashT=.2;p.cd.dash=3;T.G.chain={n:20,t:6,tier:null};T.G.link={t:5,ids:[p.id],hits:[]};
 T.endSwarm();T.restartSwarm();ok(!T.G.loot.length&&!T.G.link&&!T.G.chain.n,'a fresh Swarm run clears old loot and party combat bonuses');ok(!p.fastT&&!p.magicT&&!p.combo&&!p.teamCd&&!p.mendT&&!p.breakReady&&!p.dashT&&!p.cd.dash,'a fresh Swarm run clears temporary player effects and cooldowns');s.step(r,1/30);ok(p.gold===40,'old loot cannot grant rewards in the new run')}
// Webbed Barrow: objectives cannot soft-lock, and roots behave identically online and solo.
{const r=mk(),p=s.createRoom(r,'Firefighter',{maxStage:4},'Web');T.enter(r);G().enemies=[];G().spawnT=1e9;G().villT=1e9;G().killsStage=T.quota(4);s.step(r,1/30);T.enter(r);const eggs=G().obj.eggs;ok(eggs&&eggs.length===4&&G().obj.steps[1].kind==='eggs','stage 4 spawns four egg clusters after the quota');
 const egg=eggs[0];egg.t=.01;const before=G().enemies.length;T.objStep(.1);ok(!egg.done&&egg.t>0&&G().enemies.length>before,'an egg hatches enemies and remains available to cut');
 T.eggHit(egg);T.resetStepState();ok(eggs.every(e=>!e.done&&e.t===T.WEBBED.eggHatch),'retry resets the egg objective');
 for(const e of eggs)T.eggHit(e);T.objStep(1/30);ok(G().obj.done&&G().gate.open,'cutting four clusters opens the gate');
 p.webT=5;ok(T.envSpeed(p)===0,'web roots movement');const dash=p.cd.dash;T.doDash();ok(p.cd.dash===dash&&!p.dashT,'web prevents dodging');for(let i=0;i<151;i++){s.step(r,1/30);r.ev.length=0}T.enter(r);ok(!p.webT,'a solo player escapes the web after five seconds');
 const w=T.spawnWebber();ok(w&&w.role==='webber'&&!w.a.melee&&w.method==='shoot','a Webber attacks from range')}
{const r=mk(),p=s.createRoom(r,'Detective',{maxStage:4},'Shot'),q=s.addPlayer(r,'Firefighter',null,'Webbed');T.enter(r);G().enemies=[];G().npcs=[];G().spawnT=1e9;G().villT=1e9;G().killsStage=T.quota(4);s.step(r,1/30);T.enter(r);const e=G().obj.eggs[0];G().shots.push({x:e.x,y:e.y-22,vx:0,vy:0,r:5,life:2,from:'p',pid:p.id,small:true,dmg:1,fx:'bullet',col:'255,255,255'});s.step(r,1/30);T.enter(r);ok(e.done,'a ranged attack cuts an egg');
 q.inv=0;q.x=G().safe.x+100;q.y=G().safe.y;G().shots.push({x:q.x,y:q.y-22,vx:0,vy:0,r:5,life:2,from:'e',web:true,dmg:1,fx:'orb',col:'255,255,255'});s.step(r,1/30);T.enter(r);ok(q.webT>0&&T.envSpeed(q)===0,'a Webber projectile roots its target');G().shots.push({x:q.x,y:q.y-22,vx:0,vy:0,r:5,life:2,from:'p',pid:p.id,small:true,dmg:1,fx:'bullet',col:'255,255,255'});s.step(r,1/30);T.enter(r);ok(!q.webT,'an allied projectile cuts the web')}
{const r=mk(),p=s.createRoom(r,'Firefighter',{maxStage:4},'Web'),q=s.addPlayer(r,'Detective',null,'Ally');T.enter(r);G().enemies=[];G().spawnT=1e9;p.x=q.x+30;p.y=q.y;p.face=Math.PI;p.weapon='fists';p.cd.slash=0;q.webT=5;G().p=p;T.doAttack();ok(!q.webT,'an ally can cut a web with a melee attack');
 q.webT=5;const {snapshot,newClient}=require('./sync'),wire=snapshot(r,p,newClient(),1);const ally=wire.p[0].find(x=>x.id===q.id);ok(ally&&ally.webT===5,'web state reaches other online players');T.restartCheckpoint();ok(!q.webT,'checkpoint retry clears webs')}
{const r=mk(),p=s.createRoom(r,'Detective',{maxStage:4},'Webber');T.enter(r);G().enemies=[];G().npcs=[];G().spawnT=1e9;G().villT=1e9;const w=T.spawnWebber(),c=openEast();w.x=(c%78+.5)*40;w.y=((c/78|0)+.5)*40;p.x=w.x+35;p.y=w.y;w.cd=0;G().p=p;T.updateEnemy(w,1/30);ok(G().shots.some(x=>x.web&&x.from==='e'),'a Webber fires a web projectile at a visible player')}
{const r=mk(),list=[s.createRoom(r,'Detective',{maxStage:4},'Web')];for(let i=1;i<4;i++)list.push(s.addPlayer(r,'Firefighter',null,'Ally'+i));T.enter(r);G().enemies=[];G().npcs=[];G().spawnT=1e9;G().villT=1e9;const q=list[0];q.webT=5;for(let i=0;i<180;i++){s.step(r,1/30);r.ev.length=0}T.enter(r);ok(q.webT===5,'a web remains until rescued when allies are alive');for(const p of list.slice(1))s.removePlayer(r,p);for(let i=0;i<151;i++){s.step(r,1/30);r.ev.length=0}T.enter(r);ok(!q.webT,'a webbed player can escape after allies leave')}
// C-32: Sporefall Marsh toxin, canisters, vents and Bloaters.
{const setup=(party=false)=>{const r=mk(),p=s.createRoom(r,'Necromancer',{maxStage:5},'Marsh'),q=party?s.addPlayer(r,'Detective',null,'Ally'):null;T.enter(r);G().enemies=[];G().npcs=[];G().spawnT=G().villT=1e9;return{r,p,q}};
 {const {r,p,q}=setup(true);p.x=G().safe.x+300;p.y=G().safe.y;q.x=G().safe.x;q.y=G().safe.y;p.toxin=q.toxin=0;T.toxinStep(p,10);T.toxinStep(q,10);ok(p.toxin===12.5&&q.toxin===0,'ambient spores build toxin separately for each player and the safehouse cleans it');T.sporeCloud({x:p.x,y:p.y});const old=p.toxin;T.toxinStep(p,1);ok(p.toxin-old>T.SPORE.fill,'a Bloater cloud builds toxin faster');p.toxin=100;p.hp=p.s.maxHp;p.inv=0;T.toxinStep(p,1);ok(p.hp<p.s.maxHp,'full toxin drains life');p.x=G().safe.x;p.y=G().safe.y;T.toxinStep(p,1);ok(p.toxin<100,'returning to the safehouse clears toxin');const sync=require('./sync'),wire=sync.snapshot(r,p,sync.newClient(),1);ok(wire.p[0].find(o=>o.id===p.id).toxin===p.toxin,'the toxin meter reaches its owner online');T.restartCheckpoint();ok(!p.toxin&&!q.toxin,'checkpoint retries clear toxin')}
 {const {r,p}=setup();G().killsStage=T.quota(5);s.step(r,1/30);T.enter(r);const o=G().obj;ok(o.items.length===3&&o.vents.length===3,'Stage 5 creates three canisters and three vents');for(let i=0;i<3;i++){const c=o.items[i],v=o.vents[i];p.x=c.x;p.y=c.y;s.step(r,1/30);T.enter(r);ok(p.carry===c,'a canister can be picked up '+(i+1));p.x=v.x;p.y=v.y;s.step(r,1/30);T.enter(r);ok(c.done&&v.done&&!p.carry,'delivery activates one vent '+(i+1));if(i===0){p.toxin=50;T.toxinStep(p,1);ok(p.toxin<50,'an active vent cleans toxin');const sync=require('./sync'),snap=sync.snapshot(r,p,sync.newClient(),1);ok(snap.pr[0].some(x=>x.k==='vent'&&x.d===1),'active vents reach online clients')}}s.step(r,1/30);T.enter(r);ok(o.done&&G().gate.open,'all three deliveries open the boss gate')}
 {const {r,p}=setup();G().killsStage=T.quota(5);s.step(r,1/30);T.enter(r);const o=G().obj,c=o.items[0],v=o.vents[0];p.x=c.x;p.y=c.y;s.step(r,1/30);T.enter(r);const x=p.x;p.x+=60;s.step(r,1/30);T.enter(r);ok(c.x===p.x&&c.x!==x,'a carried canister follows its carrier');p.rage=100;G().p=p;T.doMove('special');ok(!p.mv&&!(p.specT>0)&&!T.doUlt(),'a carrier cannot use signature attacks or ultimates');p.hp=.01;p.inv=0;T.hurtPlayer(1e6);ok(!p.carry&&!c.by,'going down drops the canister');T.restartCheckpoint();ok(o.items.every(i=>!i.done&&!i.by&&i.x===i.startX&&i.y===i.startY)&&o.vents.every(v=>!v.done),'a retry resets canister positions and vents')}
 {const {r,p,q}=setup(true);const b=T.spawnBloater();ok(b&&b.role==='bloater','Stage 5 can spawn a Bloater');b.x=p.x=G().safe.x+300;b.y=p.y=G().safe.y;b.aware=true;G().p=p;T.updateEnemy(b,1/30);ok(b.fuseT>0,'a nearby Bloater warns before exploding');T.updateEnemy(b,T.SPORE.fuse+.1);ok(b.dead&&G().hazards.some(h=>h.spore),'its explosion leaves a spore cloud');const b2=T.spawnBloater();G().p=q;T.killEnemy(b2);ok(G().hazards.filter(h=>h.spore).length===2,'killing a Bloater also releases a cloud');const sync=require('./sync'),wire=sync.snapshot(r,p,sync.newClient(),1);ok(wire.z&&wire.z[0].some(h=>h.col==='130,200,65'),'spore clouds reach online clients')}
}
// C-33: Spore Brute and Share the Poison.
{const setup=(party=false)=>{const r=mk(),p=s.createRoom(r,'Detective',{maxStage:5},'Spore boss'),q=party?s.addPlayer(r,'Firefighter',null,'Ally'):null;T.enter(r);G().enemies=[];G().npcs=[];G().spawnT=G().villT=1e9;for(let y=2;y<53;y++)for(let x=2;x<76;x++)G().w.map[y*78+x]=0;G().gate.x=1400;G().gate.y=1000;G().gate.open=true;G().p=p;T.summonBoss();const b=G().boss;b.act='walk';b.actT=99;b.cd=99;p.x=b.x+150;p.y=b.y;p.inv=0;if(q){q.x=b.x-150;q.y=b.y;q.inv=0}return{r,p,q,b}};
 {const {p,q,b}=setup(true);ok(G().props.filter(o=>o.kind==='sporeVent').length===2&&G().props.some(o=>o.kind==='purifier'),'party boss has two clean zones and a purifier in its arena');b.loadId=p.id;b.loadCd=100;p.toxicLoad=60;q.toxicLoad=0;q.x=p.x+30;q.y=p.y;T.sporeBossTick(1);ok(p.toxicLoad<65&&q.toxicLoad>0&&Math.abs(p.toxicLoad+q.toxicLoad-65)<.01,'nearby allies share load without losing it');const sync=require('./sync'),snap=sync.snapshot({G:G(),ev:[]},q,sync.newClient(),1);ok(snap.p[0].some(o=>o.id===p.id&&o.toxicLoad>0&&o.loadMark===1),'the marked player and load reach allies online');q.x=p.x+300;p.toxicLoad=99;p.inv=0;const hp=p.hp;T.sporeBossTick(1);ok(p.toxicLoad===0&&p.hp<hp,'an unshared full load bursts and hurts its owner')}
 {const {r,p,q,b}=setup(true),c=G().props.find(o=>o.kind==='purifier');p.x=b.x+300;p.y=b.y;q.x=c.x;q.y=c.y;T.purifierTick(.1);ok(q.carry===c&&c.by===q.id,'an ally picks up the purifier');q.toxicLoad=50;b.loadId=p.id;b.loadCd=100;T.sporeBossTick(1);ok(q.toxicLoad<50,'carrying the purifier cleans the carrier load');q.actions.push({n:'revive',v:true});s.step(r,1/30);T.enter(r);ok(!q.carry&&!c.by,'the online revive action drops the purifier');T.purifierTick(.1);ok(!q.carry,'the dropped purifier is not picked straight back up');T.restartCheckpoint();ok(!G().props.some(o=>o.sporeBoss)&&!p.toxicLoad&&!q.toxicLoad,'retry clears boss props and loads')}
 {const {p,b}=setup();ok(!G().props.some(o=>o.kind==='purifier'),'solo uses the vents instead of a carried purifier');b.loadId=p.id;b.loadCd=100;p.toxicLoad=50;const v=G().props.find(o=>o.kind==='sporeVent');p.x=v.x;p.y=v.y;T.sporeBossTick(1);ok(p.toxicLoad<50,'solo load is cleaned at a vent');p.toxin=50;T.toxinStep(p,1);ok(p.toxin<50,'boss clean zones also clear marsh toxin');p.x=b.x;p.y=b.y;const before=p.toxicLoad;T.sporeBossTick(1);ok(Math.abs(p.toxicLoad-before-T.SPORE_BOSS.soloRate)<.01,'solo load grows at its slower rate')}
 {const {p,q,b}=setup(true);b.hp=b.maxHp*.59;T.bossPhaseCheck(b);const mushrooms=G().enemies.filter(e=>e.role==='mushroom');ok(b.phase===1&&mushrooms.length===3,'at 60 percent the boss grows three mushrooms');const hp=b.hp;T.sporeBossTick(1);ok(b.hp>hp,'living mushrooms heal the boss');for(const m of mushrooms){G().p=p;T.killEnemy(m)}const after=b.hp;T.sporeBossTick(1);ok(b.hp===after,'destroying the mushrooms stops their healing');b.hp=b.maxHp*.29;T.bossPhaseCheck(b);ok(b.phase===2,'at 30 percent the boss enters the storm phase');const v=G().props.find(o=>o.kind==='sporeVent');p.x=v.x;p.y=v.y;q.x=b.x;q.y=b.y;p.inv=q.inv=0;const ph=p.hp,qh=q.hp;b.act='toxicStorm';b.actT=0;b.breatherT=0;G().p=p;T.updateBoss(b,1/30,0,true);ok(p.hp===ph&&q.hp<qh,'the toxic storm hits exposed players and spares players in clean zones');b.act='sporeCast';b.actT=0;b.tel={spots:[{x:p.x,y:p.y}]};G().p=p;T.updateBoss(b,1/30,0,true);ok(G().hazards.some(h=>h.bossSpore&&h.t===T.SPORE_BOSS.cloudT),'spore cloud attack leaves a lingering damaging zone');G().p=p;T.killEnemy(b);ok(!G().props.some(o=>o.sporeBoss)&&!G().hazards.some(h=>h.bossSpore)&&!p.toxicLoad&&!q.toxicLoad,'defeating the boss cleans up the encounter')}
 {const {r,p,b}=setup();const q=s.addPlayer(r,'Firefighter',null,'Joined');T.enter(r);T.sporeBossTick(.1);ok(G().props.some(o=>o.kind==='purifier'),'a player joining a solo encounter brings the party purifier')}
}
console.log('\n'+n+' checks passed');




;;;
