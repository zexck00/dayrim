'use strict';
/* Rules with several players, no network. Run with: node test-rules.js */
const s=require('./sim'),assert=require('assert');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;console.log('  ok  '+m)};
const T=s.test,mk=()=>({clients:new Map(),ev:null});
const room=mk(),a=s.createRoom(room,'Detective',null,'A'),b=s.addPlayer(room,'Firefighter',null,'B');const G=()=>T.G;
const step=(k=1)=>{for(let i=0;i<k;i++){s.step(room,1/30);room.ev.length=0}};
T.enter(room);
ok(new Set(G().players.map(p=>p.id)).size===2,'two players, different ids');
const solo=mk(),sp=s.createRoom(solo,'Detective',null,'S');T.enter(solo);const soloHp=G().enemies[0].maxHp/ (G().enemies[0].mob==='strong'?3.2:.6);T.enter(room);
// Membership changes rescale living enemies without changing their life percentage.
const scaleRoom=mk(),scalePlayers=[s.createRoom(scaleRoom,'Detective',null,'Scale')];T.enter(scaleRoom);T.summonBoss();const boss=G().boss,minion=G().enemies.find(e=>e.mob),baseBossHp=boss.maxHp,baseBossDmg=boss.dmg,baseMinionHp=minion.maxHp,baseMinionDmg=minion.dmg;boss.hp*=.37;minion.hp*=.6;
for(let i=1;i<4;i++){scalePlayers.push(s.addPlayer(scaleRoom,'Detective',null,'Scale'));T.enter(scaleRoom);ok(Math.abs(boss.maxHp/baseBossHp-[1,2,4,8][i])<1e-8&&Math.abs(boss.dmg/baseBossDmg-[1,2,4,8][i])<1e-8&&Math.abs(boss.hp/boss.maxHp-.37)<1e-8,'boss scales on join '+(i+1));ok(Math.abs(minion.maxHp/baseMinionHp-[1,1.6,2.2,2.8][i])<1e-8&&minion.dmg===baseMinionDmg&&Math.abs(minion.hp/minion.maxHp-.6)<1e-8,'minion scales on join '+(i+1));ok(T.quota(1)===Math.ceil(8*[1,1.4,1.8,2.2][i]),'quota scales for '+(i+1));ok(Math.abs(T.bossUltDamage(boss,0)/boss.maxHp*(i+1)-.04)<1e-10,'ultimates share boss percent damage for '+(i+1))}
for(let i=3;i>0;i--){s.removePlayer(scaleRoom,scalePlayers[i]);T.enter(scaleRoom);ok(Math.abs(boss.maxHp/baseBossHp-[1,2,4,8][i-1])<1e-8&&Math.abs(boss.hp/boss.maxHp-.37)<1e-8,'boss rescales on leave to '+i)}
ok(T.quota(1)===8,'solo quota unchanged');T.enter(solo);ok(G().players.length===1&&G().enemies[0].maxHp/(G().enemies[0].mob==='strong'?3.2:.6)===soloHp,'another room is untouched');T.enter(room);
// Citizen fear belongs to the player responsible, including when another ally is closer.
T.enter(room);const witness={x:a.x+70,y:a.y},victim=G().npcs[0];G().p=a;T.hitNpc(victim,1e9,0,true);b.x=witness.x+10;b.y=witness.y;ok(a.killerT===45&&!b.killerT,'civilian kill marks only its owner');ok(T.fearedPlayer(witness)===a,'citizen fears the killer even when an ally is closer');a.x=witness.x+200;ok(!T.fearedPlayer(witness),'citizen does not fear an innocent nearby ally');a.killerT=b.killerT=0;
// Attack credit
a.x=G().safe.x;a.y=G().safe.y;
const e=G().enemies.find(x=>x.kind==='rival');e.x=a.x+30;e.y=a.y;e.hp=1;a.input.ax=a.x+30;a.input.ay=a.y-22;a.input.l=true;const ka=a.kills,kb=b.kills,xb=b.xp,la=b.lvl;
for(let i=0;i<20&&a.kills===ka;i++){e.x=a.x+30;e.y=a.y;step()}a.input.l=false;
ok(a.kills===ka+1&&b.kills===kb,'the kill goes to the player who made it');ok(b.xp>xb||b.lvl>la,'both players earn the experience');ok(a.combo===1&&b.combo===0,'combo belongs to the killer only');
// Enemy targets nearest
const f=G().enemies.find(x=>x.kind==='rival'&&!x.dead);G().enemies=[f];{const W=G().w,c=W.open.find(c=>Math.hypot((c%78+.5)*40-G().safe.x,((c/78|0)+.5)*40-G().safe.y)>500);b.x=(c%78+.5)*40;b.y=((c/78|0)+.5)*40}a.x=G().safe.x;a.y=G().safe.y;a.hp=a.s.maxHp;f.x=b.x+40;f.y=b.y;f.aware=true;f.a.melee=true;f.method='melee';f.cd=0;f.wind=0;f.dmg=5;const ha=a.s.maxHp;b.inv=0;b.hp=b.s.maxHp;
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
// Stage 1 gives both factions an interruptible healer encounter.
for(const ch of ['Detective','Necromancer']){const r=mk();s.createRoom(r,ch,null,'Stage');T.enter(r);ok(G().enemies.some(e=>e.role==='healer'),ch+' encounters a Stage 1 healer')}T.enter(room);
// Team abilities, exposed openings, reactions, and checkpoint choices.
const depth=mk(),markman=s.createRoom(depth,'Detective',null,'Marksman'),tank=s.addPlayer(depth,'Firefighter',null,'Bruiser'),striker=s.addPlayer(depth,'Prodigy',null,'Striker'),medic=s.addPlayer(depth,'Exorcist',null,'Medic');T.enter(depth);G().enemies=[];const point=G().w.open.find(c=>Math.hypot((c%78+.5)*40-G().safe.x,((c/78|0)+.5)*40-G().safe.y)>500),cx=(point%78+.5)*40,cy=((point/78|0)+.5)*40;for(const p of G().players){p.x=cx;p.y=cy;p.hp=p.s.maxHp;p.inv=0}const rusher=T.spawnMob(0,{x:cx+40,y:cy},false);rusher.role='rusher';rusher.aware=true;markman.x=cx+80;tank.x=cx+50;medic.x=cx+300;ok(T.rusherTarget(rusher)===markman,'Rusher prioritizes a nearby back-line ally');markman.x=cx;tank.x=cx;medic.x=cx;G().enemies=[];const brute=T.spawnMob(0,{x:cx+40,y:cy},true);brute.aware=true;brute.hp=brute.maxHp=100000;
G().p=markman;ok(T.doTeam()&&brute.markT===6&&markman.teamCd>0,'Marksman marks an enemy with a cooldown');ok(!T.doTeam(),'role ability cannot bypass its cooldown');
G().p=tank;ok(T.doTeam()&&brute.tauntId===tank.id&&brute.tauntT===4&&tank.tauntGuard>0,'Bruiser taunts and gains protection');
G().p=striker;ok(T.doTeam()&&striker.breakReady>0,'Striker primes Break');brute.healWind=.8;T.hitEnemy(brute,1,0,0);ok(brute.healWind===0&&brute.healT===3&&brute.exposedT>0&&brute.brokenT>0,'Break interrupts a healer and exposes the target');
const oldHp=brute.hp;markman.s.crit=0;G().p=markman;T.hitEnemy(brute,100,0,0,true);ok(oldHp-brute.hp>140&&brute.brokenT===0,'an ally heavy hit triggers Break Strike');
brute.statusT=0;G().p=tank;T.hitEnemy(brute,1,0,0);G().p=striker;T.hitEnemy(brute,1,0,0);ok(brute.stunT>0&&brute.statusT===0,'Soak and Shock from different allies cause Overload');
markman.hp=markman.s.maxHp*.25;G().p=medic;ok(T.doTeam()&&markman.mendT>0,'Medic links the lowest-health nearby ally');const beforeMend=markman.hp;for(let i=0;i<30;i++)s.step(depth,1/30);ok(markman.hp>beforeMend,'Mend Link heals over time');
T.enter(depth);brute.stunT=0;brute.role='brute';brute.wind=.01;brute.aware=true;brute.x=tank.x+30;brute.y=tank.y;tank.dashT=.2;tank.inv=1;G().p=tank;T.updateEnemy(brute,.02);ok(brute.exposedT>0,'dodging a brute wind-up creates an opening');
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
console.log('\n'+n+' checks passed');
