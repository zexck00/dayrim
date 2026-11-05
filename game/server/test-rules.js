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
console.log('\n'+n+' checks passed');
