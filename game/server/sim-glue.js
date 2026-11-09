/* Runs inside the same closure as src/game.js on the server.
   The rules stay exactly as written. Anything they do for the player's eyes and ears becomes an event sent to clients. */
let EV=[],CUR=null,nextId=1;
const ev=(e,x,y,to)=>EV.push({e,x,y,to});
const here=()=>G.p||{};
sfx=n=>{const p=here();ev(['s',n],p.x,p.y)};
voice=t=>ev(['v',t],undefined,undefined,here().id);
tone=(...a)=>ev(['t',...a],undefined,undefined,here().id);
noiseHit=(...a)=>ev(['o',...a],undefined,undefined,here().id);
stinger=l=>ev(['g',l],undefined,undefined,here().id);
shake=v=>ev(['k',v],undefined,undefined,here().id);
addLog=html=>ev(['l',html],undefined,undefined,here().id);
text=(x,y,s,c,big)=>ev(['x',Math.round(x),Math.round(y),s,c,big?1:0],x,y);
burst=(x,y,c,n,sp=120)=>ev(['b',Math.round(x),Math.round(y),c,n,sp],x,y);
glowP=(x,y,c,n=1,sp=60,t=.4,s=3)=>ev(['w',Math.round(x),Math.round(y),c,n,sp,t,s],x,y);
bleed=(x,y,dx,dy,n)=>ev(['e',Math.round(x),Math.round(y),+dx.toFixed(2),+dy.toFixed(2),n],x,y);
addDecal=(x,y,r,pool,col)=>ev(['d',Math.round(x),Math.round(y),+r.toFixed(1),pool?1:0,typeof col==='string'?col.slice(0,7):''],x,y);
trail=()=>{};tickFx=()=>{};dirty=()=>{};audioOn=()=>{};writeSave=()=>{};
function setMode(m){if(m==='clear'&&CUR){CUR.cleared=true;ev(['clear',G.stage])}}

const roundDeep=o=>{for(const k in o){const v=o[k];if(typeof v==='number')o[k]=Math.round(v*100)/100}return o};
const SAVE_KEYS=['char','lvl','xp','gold','potions','fast','magic','gear','bag','weapons','weapon','weaponUpgrades','runBoons','skills','train','sp','kills','rage','bestCombo','maxStage','beaten','swarmBest'];

/* Input and actions from the network take effect at the start of that player's own turn */
applyInput=p=>{const i=p.input;joy.on=true;joy.dx=i.x;joy.dy=i.y;mouse.x=i.ax;mouse.y=i.ay;mouse.left=i.l;mouse.right=i.r;
  const q=p.actions;p.actions=[];for(const a of q){if(!(p.deadT>0||p.respawnT>0)&&Object.prototype.hasOwnProperty.call(ACTIONS,a.n))ACTIONS[a.n](p,a.v)}};
const ACTIONS={
  team:()=>doTeam(),boon:(p,v)=>{if(typeof v==='string')chooseBoon(v)},
  revive:(p,v)=>{if(typeof v==='boolean')p.reviveHold=v?.45:0},
  dash:()=>doDash(),ult:()=>doUlt(),special:()=>doMove('special'),spell:()=>doSpell(),heal:()=>doHeal(),potion:()=>usePotion(),fast:()=>useFast(),magic:()=>useMagic(),
  cycle:(p,v)=>cycleWeapon(v>0?1:-1),
  upgrade:(p,v)=>{upgradeWeapon(v)},
  weapon:(p,v)=>{if(typeof v==='string'&&Object.prototype.hasOwnProperty.call(WEAPONS,v))equipWeapon(v)},
  skill:(p,v)=>{const s=SKILLS.find(x=>x.id===v);if(!s||p.sp<=0||(p.skills[v]||0)>=s.max)return;p.sp--;p.skills[v]=(p.skills[v]||0)+1;recalc()},
  gym:(p,v)=>{if(!p.nearSafe||!GYM.some(x=>x.id===v))return;const c=gymCost(p.train[v]||0);if(p.gold<c)return;p.gold-=c;p.train[v]=(p.train[v]||0)+1;recalc()},
  shop:(p,v)=>{const s=SHOP.find(x=>x.id===v);if(!p.nearSafe||!s)return;const c=shopCost(s);if(p.gold<c||p[s.id]>=9)return;p.gold-=c;p[s.id]++}
};
function makePlayer(char,save,pname,id){
  const sv=save||{},p=Object.assign(freshPlayer(char),sv);
  p.char=char;p.id=id;p.pname=pname;p.gear=Object.assign({armor:null,clothes:null,tool:null},p.gear);delete p.gear.weapon;
  p.bag=(p.bag||[]).filter(i=>i.slot!=='weapon');
  if(!Array.isArray(p.weapons)||!p.weapons.includes('fists'))p.weapons=['fists'].concat(p.weapons||[]);if(!p.weapons.includes(p.weapon))p.weapon='fists';
  if(!p.runBoons||typeof p.runBoons!=='object'||Array.isArray(p.runBoons))p.runBoons={wide:0,opening:0};
  if(!p.weaponUpgrades||typeof p.weaponUpgrades!=='object'||Array.isArray(p.weaponUpgrades))p.weaponUpgrades={};
  p.input={s:0,x:0,y:0,ax:0,ay:0,l:false,r:false};p.actions=[];p.ack=0;p.stats=STATS[char];
  return p;
}
function freshHealth(p){G.p=p;recalc();p.hp=p.s.maxHp;p.mana=p.s.maxMana}
function afterStage(room){for(const q of G.players){freshHealth(q);q.deadT=0;q.respawnT=0;q.fastT=0;q.magicT=0}G.p=G.players[0];room.cleared=false;room.stageChanged=true}

return{
  charExists:n=>typeof n==='string'&&Object.prototype.hasOwnProperty.call(STATS,n)&&!!archKey(n),factionOf,SAVE_KEYS,
  createRoom(room,char,save,pname,opts){
    G=baseState(false);G.mp=true;G.mode='play';EV=[];CUR=room;
    const id=nextId++,p=makePlayer(char,save,pname,id);G.p=p;G.players=[p];room.G=G;room.ev=EV;
    const top=Math.min(10,Math.max(1,p.maxStage||1)),swarm=!!(opts&&opts.mode==='swarm');
    recalc();enterStage(swarm?Math.min(top,Math.max(1,(opts.stage|0)||1)):top);afterStage(room);if(swarm){room.mode='swarm';startSwarm()}room.stageChanged=false;
    return p;
  },
  addPlayer(room,char,save,pname){
    G=room.G;EV=room.ev;CUR=room;const id=nextId++,p=makePlayer(char,save,pname,id);G.players.push(p);rescaleParty();freshHealth(p);if(G.swarm)p.swarmSave=swarmSnap(p);p.x=G.safe.x+60-(G.players.length-1)*30;p.y=G.safe.y+30;
    return p;
  },
  removePlayer(room,p){G=room.G;const i=G.players.indexOf(p);if(i>=0){G.players.splice(i,1);rescaleParty()}G.p=G.players[0]||null},
  step(room,dt){
    G=room.G;EV=room.ev;CUR=room;
    for(const p of G.players)p.ack=p.input.s;
    update(dt);
    /* Far zones and the scout may be outside a client's view, so the server names the objective's targets and hold time. */
    if(G.obj){const st=G.obj.steps[G.obj.i];G.obj.wire={tg:objTargets().map(t=>[Math.round(t.x/10)*10,Math.round(t.y/10)*10,t.label]),hn:st&&st.kind==='hold'?zoneNeed():0}}
    for(const f of G.fx){roundDeep(f);ev(['f',f],f.x,f.y)}G.fx=[];G.texts=[];
    G.p=G.players[0];
  },
  /* Room-wide choices. The caller has already checked this player is the host. */
  hostAction(room,p,n,v){
    G=room.G;EV=room.ev;CUR=room;G.p=p;if(G.swarm)return;
    if(n==='travel'){const t=+v;if(!Number.isInteger(t)||t<1||t>10||t>p.maxStage||t===G.stage||!p.nearSafe)return;enterStage(t);afterStage(room)}
    else if(n==='next'){if(!room.cleared||G.stage>=10)return;enterStage(G.stage+1);afterStage(room)}
    else if(n==='stay'){if(!room.cleared)return;room.cleared=false;G.gate.open=true;ev(['clearDone'])}
  },
  saveOf(p){const o={},src=p.swarmSave?Object.assign({},p.swarmSave,{swarmBest:p.swarmBest||0}):p;for(const k of SAVE_KEYS)o[k]=src[k];return JSON.parse(JSON.stringify(o))},
  mapOf(room){return Buffer.from(room.G.w.map).toString('base64')},
  test:{GHOUL,clearGhoul,spawnGhoulArena,farthestLiving,startGhoulHook,startGhoulCleave,pickGhoul,ghoulTick,RUST,rustStep,spawnScrapGolem,scrapDisable,scrapPartHit,scrapTick,clearScrap,generatorStep,reactHit,nearestEnemy,FLESH,splitFlesh,fleshTick,fleshAfterDamage,fleshDownBody,fleshRejoin,startFleshGrasp,pickFlesh,VALE,valeTick,valeFall,valeLanding,clearVale,spawnShieldbearer,SPORE_BOSS,sporeBossTick,purifierTick,cleanSporeAt,spawnMushrooms,pickSpore,doMove,doUlt,SPORE,toxinStep,spawnBloater,sporeCloud,bloaterAct,WEBBED,spawnWebber,eggHit,clearWeb,SWARM,startSwarm,nextWave,swarmTick,endSwarm,restartSwarm,restartCheckpoint,GLOOM,BANSHEE,TIDE,tideAt,envSpeed,dryAt,spawnLurker,lurkRelease,bossWarded,spawnLanterns,lanternLit,inBeam,mobHit,AI,concealed,inThicket,spawnStalker,genCitySeeded,get G(){return G},enter(room){G=room.G;EV=room.ev;CUR=room},summonBoss,addRage,gainXp,hurtPlayer,killEnemy,quota,bossUltDamage,hitNpc,fearedPlayer,blocked,ROSTER,auraOf,auraHas,upgradeLevel,doAttack,dmgMul,teamTarget,doTeam,chooseBoon,offerBoons,spawnMob,spawnRival,hitEnemy,updateEnemy,doDash,rusherTarget,nearestPlayer,threatAdd,threatDecay,threatScore,threatTarget,threatHeal,THREAT,doHeal,usePotion,recalc,addDecal,GORE,goreTrail,goreSpray,goreChunks,gorePool,ELEMENT,REACTIONS,REACT_NAME,REACT_FX,reactionOf,reactionCoverage,objStep,resetStepState,objectiveSteps,updateBoss,bossGuard,bossTelegraph,bossPhaseCheck,BOSS_TELEGRAPH,BOSS_STAGGER,ultHit,ultDmgFor,ULT_LEN,openLink,linkBonus,linkTier,tickLink,LINK_TIERS,LINK_WINDOW,weaponDamage,moveDamage,recDamage,mobUnit,REC_HITS,MELEE_UP,WEAPONS,statMul,stageScale,recLevel,objTargets,holdStep,zoneNeed,HOLD_ALONE_T,chainAdd,chainBonus,chainReset,chainTick,cdMulOf,CHAIN_BONUS,CHAIN_WINDOW,rageShare,RAGE_SHARE_RANGE,pillarHit,spawnPillars,pillarsUp,breakPillar,startBurrow,startSpray,bossPick}
};
