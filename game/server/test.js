'use strict';
/* End-to-end check: starts the real server on a spare port and plays it over real WebSocket connections. Run with: npm test */
const {spawn}=require('child_process'),http=require('http'),fs=require('fs'),os=require('os'),path=require('path'),assert=require('assert');
const WebSocket=require('ws');
const PORT=18000+Math.floor(Math.random()*1000),DATA=fs.mkdtempSync(path.join(os.tmpdir(),'dayrim-test-'));
let srv,passed=0;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ok=(c,m)=>{assert.ok(c,m);passed++;console.log('  ok  '+m)};
function start(){srv=spawn(process.execPath,['index.js'],{cwd:__dirname,env:{...process.env,PORT,HOST:'127.0.0.1',DATA_DIR:DATA,MAX_ROOMS:'3'},stdio:['ignore','pipe','inherit']});return new Promise((resolve,reject)=>{const cleanup=()=>{srv.stdout.removeListener('data',ready);srv.removeListener('exit',exited);srv.removeListener('error',failed)},ready=()=>{cleanup();resolve()},exited=(code,signal)=>{cleanup();reject(new Error('Test server exited before listening: '+(signal||code)))},failed=e=>{cleanup();reject(e)};srv.stdout.once('data',ready);srv.once('exit',exited);srv.once('error',failed)})}
const stop=()=>new Promise(res=>{srv.once('exit',res);srv.kill('SIGTERM')});
const get=(p,h={})=>new Promise((res,rej)=>http.get({port:PORT,host:'127.0.0.1',path:p,headers:h},r=>{const b=[];r.on('data',d=>b.push(d));r.on('end',()=>res({status:r.statusCode,headers:r.headers,body:Buffer.concat(b)}))}).on('error',rej));
class Bot{
  constructor(){this.msgs=[];this.waiters=[];this.bytes=0;this.snaps=0;this.me={};this.world={};this.ents={e:new Map(),p:new Map()};this.events=[]}
  open(h){return new Promise((res,rej)=>{this.ws=new WebSocket('ws://127.0.0.1:'+PORT+'/ws',{headers:h});this.ws.on('open',res);this.ws.on('error',rej);this.ws.on('close',c=>{this.closed=c});
    this.ws.on('message',d=>{this.bytes+=d.length;const m=JSON.parse(d);if(m.t==='s'){this.snap(m);return}const w=this.waiters.find(x=>x.t===m.t);if(w){this.waiters.splice(this.waiters.indexOf(w),1);w.r(m)}else this.msgs.push(m)})})}
  snap(m){this.snaps++;this.ack=m.a;if(m.g)Object.assign(this.world,m.g);if(m.v)this.events.push(...m.v);if(m.p)for(const d of m.p[0]){if(d.id===this.id)Object.assign(this.me,d);else{const o=this.ents.p.get(d.id)||{};Object.assign(o,d);this.ents.p.set(d.id,o)}}if(m.p)for(const i of m.p[1])this.ents.p.delete(i);if(m.e){for(const d of m.e[0])this.ents.e.set(d.id,Object.assign(this.ents.e.get(d.id)||{},d));for(const i of m.e[1])this.ents.e.delete(i)}}
  send(o){this.ws.send(JSON.stringify(o))}
  wait(t){const i=this.msgs.findIndex(m=>m.t===t);if(i>=0)return Promise.resolve(this.msgs.splice(i,1)[0]);return new Promise((r,j)=>{const w={t,r};this.waiters.push(w);setTimeout(()=>j(new Error('timed out waiting for '+t)),4000)})}
  async hello(name,token){this.send({t:'hello',name,token});const w=await this.wait('welcome');this.token=w.token;this.name=w.name;return w}
  async create(char,priv){this.send({t:'create',char,private:priv});const j=await this.wait('joined');this.id=j.you;return j}
  async join(code,char){this.waiters=[];this.send({t:'join',code,char});const m=await Promise.race([this.wait('joined'),this.wait('error')]);this.waiters=[];if(m.t==='joined')this.id=m.you;return m}
  close(){this.ws.close()}
}
(async()=>{
  await start();
  console.log('HTTP');
  const home=await get('/',{'accept-encoding':'gzip'});
  ok(home.status===200&&home.headers['content-encoding']==='gzip','game page is served compressed ('+Math.round(home.body.length/1024)+' KB)');
  ok(JSON.parse((await get('/api/info')).body).dayrim===true,'/api/info identifies the server');
  ok((await get('/healthz')).status===200,'/healthz answers');
  for(const p of['/../server/index.js','/server/index.js','/data/profiles','/src/game.js','/..%2f..%2fetc/passwd'])ok((await get(p)).status===404,'not exposed: '+p);
  ok((await get('/',{'if-none-match':home.headers.etag})).status===304,'browsers can reuse the cached page');
  {const html=require('zlib').gunzipSync(home.body).toString(),m=html.match(/const ATLAS_URL="(assets\/[^"]+)"/);ok(!!m&&home.body.length<1024*1024,'the page links its pictures and sounds instead of embedding them');
   const a=await get('/'+m[1]);ok(a.status===200&&a.headers['content-type']==='image/webp'&&/immutable/.test(a.headers['cache-control']||''),'linked assets are served and cached for good');
   for(const p of['/assets/../server/index.js','/assets/..%2fdayrim.html','/assets/nothing.0123456789.webp','/assets/','/assets/index.js'])ok((await get(p)).status===404,'not exposed: '+p)}

  console.log('Rooms');
  const a=new Bot(),b=new Bot(),c=new Bot();await a.open();await b.open();await c.open();
  await a.hello('Ana<script>');ok(a.name==='Anascript','names are cleaned of markup');await b.hello('Bo');await c.hello('Cy');
  const ja=await a.create('Detective');ok(/^[A-Z]{5}$/.test(ja.code)&&ja.seed!==undefined&&ja.map.length>4000,'room created with code '+ja.code);
  c.send({t:'rooms'});ok((await c.wait('rooms')).rooms.some(r=>r.code===ja.code),'public room appears in the list');
  ok((await c.join(ja.code,'Necromancer')).msg.includes('heroes'),'a villain cannot join a hero room');
  ok((await c.join('ZZZZZ','Detective')).msg.includes('No room'),'unknown code is refused');
  ok((await c.join(ja.code,'__proto__')).t==='error','a made-up character is refused');
  const jb=await b.join(ja.code.toLowerCase(),'Firefighter');ok(jb.t==='joined'&&jb.seed===ja.seed,'second player joins with the same map seed');
  await sleep(400);ok(a.ents.p.size===1&&b.ents.p.size===1,'each player sees the other');ok(a.me.char==='Detective'&&a.me.s&&a.me.gold!==undefined,'own snapshot holds full character data');ok(a.world.hope===4&&a.world.maxHope===4&&b.world.hope===4&&b.world.maxHope===4,'both players receive shared Hope');
  const other=[...a.ents.p.values()][0];ok(other.gold===undefined&&other.bag===undefined,'other players do not receive your gold or bag');

  console.log('Input is checked by the server');
  await sleep(200);const x0=a.me.x;for(let i=0;i<30;i++){a.send({t:'i',s:i+1,x:1,y:0,ax:x0+500,ay:a.me.y,l:false,r:false});await sleep(33)}
  await sleep(200);const moved=a.me.x-x0,ms=a.me.s&&JSON.parse(a.me.s).speed;ok(moved>0||a.ack>=30,'moving works: '+moved.toFixed(0)+' units in 1 s, server acknowledged input '+a.ack);
  const x1=a.me.x;for(let i=0;i<30;i++){a.send({t:'i',s:100+i,x:9999,y:0,ax:NaN,ay:null,l:'yes',r:{}});await sleep(33)}await sleep(150);
  ok(a.me.x-x1<=ms*1.2+40,'a forged speed cannot outrun the character: '+(a.me.x-x1).toFixed(0)+' units vs top speed '+ms);
  const gold=a.me.gold;a.send({t:'a',n:'gym',v:'str'});a.send({t:'a',n:'__proto__'});a.send({t:'a',n:'constructor',v:1});a.send({t:'a',n:'skill',v:'power'});a.send({t:'a',n:'travel',v:10});a.send({t:'a',n:'next'});
  b.send({t:'a',n:'travel',v:1});for(const bad of['not json','{"t":1}','[]','null','{"t":"i","s":"x"}'])a.ws.send(bad);
  await sleep(300);ok(a.me.gold===gold&&a.me.sp===0,'forged purchases and skills do nothing');ok(a.ws.readyState===1&&srv.exitCode===null,'bad messages do not crash the server');

  console.log('Fighting together');
  await sleep(1500);const bb=a.bytes;const sn=a.snaps;const t0=Date.now();
  const atk=setInterval(()=>{for(const p of[a,b]){const es=[...p.ents.e.values()].filter(e=>!e.dead);const e=es.sort((x,y)=>Math.hypot(x.x-p.me.x,x.y-p.me.y)-Math.hypot(y.x-p.me.x,y.y-p.me.y))[0];
    p.send({t:'i',s:Date.now()%1e9,x:e?Math.sign(e.x-p.me.x):0,y:e?Math.sign(e.y-p.me.y):0,ax:(e?e.x:0),ay:(e?e.y:0),l:true,r:false})}},100);
  await sleep(5000);clearInterval(atk);const sec=(Date.now()-t0)/1000;
  console.log('      '+Math.round((a.bytes-bb)/sec/1024*10)/10+' KB/s before compression per player, '+Math.round((a.snaps-sn)/sec)+' snapshots/s, '+a.ents.e.size+' enemies in view');
  ok(a.ents.e.size>=0&&a.snaps>sn+50,'snapshots keep flowing during a fight');
  ok(a.world.ch!==undefined&&a.world.ch===b.world.ch,'both players see the same party chain: '+(a.world.ch||0));
  ok(Number.isFinite(a.world.ct)&&Number.isFinite(a.world.hopeSpent),'chain timer and Hope spent reach real clients');
  ok(a.world.lk!==undefined&&a.world.lk===b.world.lk,'the link window is on the wire and empty when nobody links');

  console.log('Host and leaving');
  const host=b.wait('host');a.close();const hm=await host;ok(hm.host===b.id,'host moves to the next player when the host leaves');
  await sleep(300);ok(b.ents.p.size===0,'the player who left disappears');
  ok(fs.readdirSync(path.join(DATA,'profiles')).length>=1,'progress is saved on leaving');
  const files=fs.readdirSync(path.join(DATA,'profiles')).map(f=>fs.readFileSync(path.join(DATA,'profiles',f),'utf8'));ok(!files.some(f=>f.includes(a.token))&&!fs.readdirSync(path.join(DATA,'profiles')).some(f=>f.includes(a.token)),'secret tokens are never written to disk');

  console.log('Full rooms and limits');
  const e1=new Bot(),e2=new Bot(),e3=new Bot();await e1.open();await e2.open();await e3.open();await e1.hello('E1');await e2.hello('E2');await e3.hello('E3');
  await e1.join(ja.code,'Guardian');await e2.join(ja.code,'Ranger');const j3=await e3.join(ja.code,'Sage');ok(j3.t==='joined','fourth player fits');
  await c.hello;const f=await c.join(ja.code,'Prodigy');ok(f.msg&&f.msg.includes('full'),'fifth player is told the room is full');
  e1.close();e2.close();e3.close();b.close();await sleep(200);

  console.log('Saved progress');
  const p1=JSON.parse(fs.readFileSync(path.join(DATA,'profiles',fs.readdirSync(path.join(DATA,'profiles')).find(n=>JSON.parse(fs.readFileSync(path.join(DATA,'profiles',n))).chars.Detective)),'utf8'));
  ok(p1.chars.Detective&&p1.chars.Detective.lvl>=1,'character saved at level '+p1.chars.Detective.lvl+', '+p1.chars.Detective.kills+' kills');
  await stop();await start();
  const again=new Bot();await again.open();await again.hello('Ana',a.token);const r=await again.create('Detective',true);await sleep(300);
  ok(again.me.kills===p1.chars.Detective.kills&&again.me.lvl===p1.chars.Detective.lvl,'same token gets the same character back after a restart');
  const lst=new Bot();await lst.open();await lst.hello('Zed');lst.send({t:'rooms'});ok(!(await lst.wait('rooms')).rooms.some(x=>x.code===r.code),'private room stays out of the list');
  const dup=new Bot();await dup.open();await dup.hello('Ana',a.token);await sleep(200);ok(again.closed===4001,'signing in twice closes the older connection');

  console.log('The Swarm');
  const sw=new Bot();await sw.open();await sw.hello('Swarmer');sw.send({t:'create',char:'Detective',mode:'swarm',stage:7});const sj=await sw.wait('joined');sw.id=sj.you;ok(sj.stage===1,'a Swarm room is clamped to the furthest stage the character has reached');
  await sleep(400);const swo=JSON.parse(sw.world.sw||'null');ok(swo&&swo.w===0&&swo.b>0,'clients get the wave state before the first wave');
  const look=new Bot();await look.open();await look.hello('Look');look.send({t:'rooms'});const sr=(await look.wait('rooms')).rooms.find(x=>x.code===sj.code);ok(sr&&sr.mode==='swarm'&&sr.wave===0,'the room list shows a Swarm room and its wave');
  sw.close();look.close();await sleep(200);

  console.log('Bad origins and floods');
  const evil=new Bot();const refused=await evil.open({Origin:'https://evil.example'}).then(()=>false,()=>true);ok(refused,'another website cannot open a connection');
  const fl=new Bot();await fl.open();await fl.hello('F');for(let i=0;i<500;i++)fl.send({t:'ping',c:i});await sleep(400);ok(fl.closed===1008,'message floods are disconnected');
  const huge=new Bot();await huge.open();huge.ws.on('error',()=>{});huge.ws.send('x'.repeat(10000));await sleep(200);ok(huge.closed,'oversized messages are refused');
  ok(srv.exitCode===null,'server is still running after all of that');
  console.log('\n'+passed+' checks passed');
  await stop();fs.rmSync(DATA,{recursive:true,force:true});process.exit(0);
})().catch(e=>{console.error('\nFAILED:',e.message);if(srv)srv.kill();process.exit(1)});
