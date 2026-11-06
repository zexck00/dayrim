'use strict';
/* Builds one snapshot per client. Each client is sent only what changed since its last snapshot, and only what is near its player. */
const AOI=1300,EVENT_AOI=1500;
const ENEMY_SKIP=new Set(['xp','gold','dmg','sp','cd','wander','wa','still','kx','ky','spT','smT','mdT','healT','hitCd','pid','dead','id','th']);
const NPC_SKIP=new Set(['kx','ky','t','sp','scare','dead','id']);
const LOOT_SKIP=new Set(['t','amt','id']);
const OWN_SKIP=new Set(['input','actions','ack','id','combo_','x','y']);
const OTHER_KEEP=['char','pname','r','hp','lvl','face','walk','moving','moveA','mv','inv','dashT','dashX','dashY','hitT','guard','castT','atkT','atkDur','pickT','swing','swingA','swingR','swingArc','fastT','magicT','healFx','pillT','pillC','weapon','deadT','respawnT','reviveTarget','reviveProgress','stats'];
let nextEnt=1;
const entId=o=>o.id||(o.id=nextEnt++);
const rnum=(k,v)=>k==='x'||k==='y'||k==='walk'?Math.round(v*10)/10:Math.round(v*100)/100;
const replacer=(k,v)=>typeof v==='number'?Math.round(v*100)/100:v;
function val(k,v){if(typeof v==='number')return rnum(k,v);if(v&&typeof v==='object')return JSON.stringify(v,replacer);return v}
function flatten(o,skip){const f={};for(const k in o){if(skip.has(k))continue;const v=o[k];if(v===undefined||typeof v==='function')continue;f[k]=val(k,v)}return f}

/* Changed fields per object, plus the ids that are gone */
function diff(items,known,toFlat,once){
  const upd=[],seen=new Set();
  for(const o of items){
    const id=entId(o);seen.add(id);const prev=known.get(id);
    if(!prev){const f=toFlat(o);known.set(id,f);upd.push(Object.assign({id},f));continue}
    if(once)continue;
    const f=toFlat(o);let d=null;
    for(const k in f)if(f[k]!==prev[k]){(d=d||{id})[k]=f[k]}
    for(const k in prev)if(!(k in f)){(d=d||{id})[k]=null}
    known.set(id,f);if(d)upd.push(d);
  }
  const rm=[];for(const id of known.keys())if(!seen.has(id)){rm.push(id);known.delete(id)}
  return upd.length||rm.length?[upd,rm]:undefined;
}
function newClient(){return{g:{},p:new Map(),e:new Map(),n:new Map(),h:new Map(),l:new Map(),z:new Map(),pr:new Map()}}
const near=(a,o,r)=>Math.hypot(a.x-o.x,a.y-o.y)<r;

function snapshot(room,me,known,tick){
  const G=room.G,out={t:'s',k:tick,a:me.ack};
  const players=diff(G.players,known.p,q=>{
    if(q===me){const f=flatten(q,OWN_SKIP);f.x=rnum('x',q.x);f.y=rnum('y',q.y);return f}
    const f={x:rnum('x',q.x),y:rnum('y',q.y),s:JSON.stringify({maxHp:Math.round(q.s.maxHp)})};for(const k of OTHER_KEEP)if(q[k]!==undefined)f[k]=val(k,q[k]);return f});
  if(players)out.p=players;
  const e=diff(G.enemies.filter(o=>o.kind==='boss'||near(me,o,AOI)),known.e,o=>flatten(o,ENEMY_SKIP));if(e)out.e=e;
  const n=diff(G.npcs.filter(o=>near(me,o,AOI)),known.n,o=>flatten(o,NPC_SKIP));if(n)out.n=n;
  const shot=s=>({x:rnum('x',s.x),y:rnum('y',s.y),vx:Math.round(s.vx),vy:Math.round(s.vy),r:s.r,from:s.from,fx:s.fx,col:s.col,a:rnum('a',s.a||0),small:s.small?1:0,spell:s.spell?1:0});
  const h=diff(G.shots.filter(o=>near(me,o,AOI)),known.h,shot,true);if(h)out.h=h;
  const hazard=z=>({x:rnum('x',z.x),y:rnum('y',z.y),r:z.r,t:rnum('t',z.t),from:z.from,col:z.col});
  const z=diff((G.hazards||[]).filter(o=>near(me,o,AOI)),known.z,hazard,true);if(z)out.z=z;
  const l=diff(G.loot.filter(o=>near(me,o,AOI)),known.l,o=>flatten(o,LOOT_SKIP));if(l)out.l=l;
  const prop=o=>({x:rnum('x',o.x),y:rnum('y',o.y),r:o.r,k:o.kind,t:rnum('t',o.t||0),by:o.by||0,d:o.done?1:0});
  const pr=diff((G.props||[]).filter(o=>near(me,o,AOI)||o.kind==='drop'||o.kind==='escort'),known.pr,prop);if(pr)out.pr=pr;
  /* Room-wide values. The banner is only sent when a new one appears, and the client counts it down. */
  const b=G.banner;if(b&&!b.t0){b.t0=b.t;b.bid=entId({})}
  const g={hour:Math.round(G.hour*20)/20,kills:G.killsStage,hope:G.hope,maxHope:G.hopeMax,hopeSpent:G.hopeSpent||0,obj:G.obj?JSON.stringify({i:G.obj.i,d:G.obj.done?1:0,h:(G.obj.steps[G.obj.i]||{}).have||0,n:(G.obj.steps[G.obj.i]||{}).need||0,l:(G.obj.steps[G.obj.i]||{}).label||''}):'',gate:G.gate.open?1:0,boss:G.boss?entId(G.boss):0,ban:b?JSON.stringify({a:b.a,b:b.b,t:b.t0,i:b.bid}):'',time:Math.floor(G.t/3)*3,ch:G.chain?G.chain.n:0,ct:G.chain?Math.round(Math.max(0,G.chain.t)*10)/10:0,lk:G.link?JSON.stringify({n:G.link.ids.length,t:Math.round(G.link.t*10)/10,in:G.link.ids.indexOf(me.id)>=0?1:0}):''};
  let gd=null;for(const k in g)if(g[k]!==known.g[k]){(gd=gd||{})[k]=g[k];known.g[k]=g[k]}
  if(gd)out.g=gd;
  const evs=[];for(const v of room.ev){if(v.to!==undefined?v.to===me.id:(v.x===undefined||Math.hypot(v.x-me.x,v.y-me.y)<EVENT_AOI))evs.push(v.e)}
  if(evs.length)out.v=evs;
  return out;
}
module.exports={snapshot,newClient};
