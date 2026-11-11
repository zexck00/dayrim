'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),zlib=require('zlib'),crypto=require('crypto');
const {WebSocketServer}=require('ws');
const sim=require('./sim');
const {snapshot,newClient}=require('./sync');
const {Profiles}=require('./profiles');

const num=(k,d)=>{const v=parseInt(process.env[k],10);return Number.isFinite(v)&&v>0?v:d};
const PORT=num('PORT',8080),HOST=process.env.HOST||'0.0.0.0',MAX_PLAYERS=num('MAX_PLAYERS_PER_ROOM',4),MAX_ROOMS=num('MAX_ROOMS',50),MAX_CONN=num('MAX_CONNECTIONS',400),MAX_PER_IP=num('MAX_CONNECTIONS_PER_IP',12);
const TRUST_PROXY=process.env.TRUST_PROXY==='1',ORIGINS=(process.env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
const DATA=process.env.DATA_DIR||path.join(__dirname,'..','data'),PAGE=process.env.GAME_HTML||path.join(__dirname,'..','dayrim.html');
const VERSION=require('./package.json').version;
const TICK=1/30,SNAP_EVERY=2,SAVE_EVERY=20000,ROOM_GRACE=30000;

const profiles=new Profiles(path.join(DATA,'profiles'));
/* Pictures and sounds the page links to. Names carry a content hash, so each file can be cached for good. */
const ASSETS=process.env.ASSETS_DIR||path.join(path.dirname(PAGE),'assets');
const ASSET_TYPES={'.webp':'image/webp','.m4a':'audio/mp4','.mp3':'audio/mpeg','.wav':'audio/wav','.js':'text/javascript; charset=utf-8'};
const page=fs.readFileSync(PAGE),pageGz=zlib.gzipSync(page,{level:9}),pageTag='"'+crypto.createHash('sha1').update(page).digest('hex').slice(0,16)+'"';
const rooms=new Map(),conns=new Set(),byToken=new Map(),perIp=new Map();

/* ---------- HTTP ---------- */
const server=http.createServer((req,res)=>{
  const url=(req.url||'/').split('?')[0];
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{Allow:'GET, HEAD'});return res.end()}
  if(url==='/healthz'){res.writeHead(200,{'Content-Type':'text/plain'});return res.end('ok')}
  if(url==='/api/info'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(JSON.stringify({dayrim:true,version:VERSION,rooms:rooms.size,players:conns.size,maxPerRoom:MAX_PLAYERS}))}
  if(url==='/'||url==='/index.html'||url==='/dayrim.html'){
    const head={'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache',ETag:pageTag,Vary:'Accept-Encoding'};
    if(req.headers['if-none-match']===pageTag){res.writeHead(304,head);return res.end()}
    const gz=/\bgzip\b/.test(req.headers['accept-encoding']||''),body=gz?pageGz:page;
    res.writeHead(200,Object.assign(head,{'Content-Length':body.length},gz?{'Content-Encoding':'gzip'}:{}));
    return res.end(req.method==='HEAD'?undefined:body);
  }
  if(url.startsWith('/assets/')){
    const name=url.slice(8),type=ASSET_TYPES[path.extname(name)];
    /* Only plain hashed file names from the assets folder: no slashes, dots-only names or other folders */
    if(type&&/^[A-Za-z0-9_-]+\.[0-9a-f]{10}\.[a-z0-9]+$/.test(name)){
      return fs.stat(path.join(ASSETS,name),(err,st)=>{
        if(err||!st.isFile()){res.writeHead(404,{'Content-Type':'text/plain'});return res.end('Not found')}
        const head={'Content-Type':type,'Content-Length':st.size,'Cache-Control':'public, max-age=31536000, immutable'};
        res.writeHead(200,head);if(req.method==='HEAD')return res.end();
        fs.createReadStream(path.join(ASSETS,name)).on('error',()=>res.destroy()).pipe(res);
      });
    }
  }
  res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');
});

/* ---------- Connections ---------- */
const wss=new WebSocketServer({noServer:true,maxPayload:4096,perMessageDeflate:{threshold:256,serverNoContextTakeover:true,clientNoContextTakeover:true,zlibDeflateOptions:{level:1}}});
const ipOf=req=>{const f=TRUST_PROXY&&req.headers['x-forwarded-for'];return f?String(f).split(',')[0].trim():req.socket.remoteAddress||'?'};
function originOk(req){const o=req.headers.origin;if(!o)return true;if(ORIGINS.length)return ORIGINS.includes(o);try{return new URL(o).host===req.headers.host}catch(e){return false}}
server.on('upgrade',(req,sock,head)=>{
  const url=(req.url||'').split('?')[0],ip=ipOf(req);
  const refuse=c=>{sock.write('HTTP/1.1 '+c+'\r\nConnection: close\r\n\r\n');sock.destroy()};
  if(!url.endsWith('/ws'))return refuse('404 Not Found');
  if(!originOk(req))return refuse('403 Forbidden');
  if(conns.size>=MAX_CONN||(perIp.get(ip)||0)>=MAX_PER_IP)return refuse('503 Service Unavailable');
  wss.handleUpgrade(req,sock,head,ws=>{perIp.set(ip,(perIp.get(ip)||0)+1);accept(ws,ip)});
});
function send(ws,o){if(ws.readyState===1)ws.send(JSON.stringify(o))}
function accept(ws,ip){
  const c={ws,ip,token:null,profile:null,name:'',room:null,player:null,known:null,alive:true,win:Date.now(),count:0};
  conns.add(c);
  ws.on('pong',()=>{c.alive=true});
  ws.on('error',()=>{});
  ws.on('close',()=>{conns.delete(c);const n=(perIp.get(ip)||1)-1;if(n>0)perIp.set(ip,n);else perIp.delete(ip);leaveRoom(c);if(c.token&&byToken.get(c.token)===c)byToken.delete(c.token)});
  ws.on('message',(data,binary)=>{
    if(binary)return;
    const now=Date.now();if(now-c.win>1000){c.win=now;c.count=0}if(++c.count>200){ws.close(1008,'Too many messages');return}
    let m;try{m=JSON.parse(data.toString())}catch(e){return}
    if(!m||typeof m!=='object')return;
    try{handle(c,m)}catch(e){console.error('message failed:',e)}
  });
}

/* ---------- Messages ---------- */
const cleanName=s=>{const n=String(s==null?'':s).replace(/[^\p{L}\p{N} _-]/gu,'').trim().slice(0,16);return n||'Player'};
const finite=(v,lo,hi)=>typeof v==='number'&&Number.isFinite(v)?Math.max(lo,Math.min(hi,v)):0;
const roomList=()=>[...rooms.values()].filter(r=>!r.private&&r.clients.size<MAX_PLAYERS&&r.clients.size>0).slice(0,30).map(r=>({code:r.code,side:r.faction,stage:r.G.stage,mode:r.G.swarm?'swarm':'story',wave:r.G.swarm?r.G.swarm.wave:0,count:r.clients.size,max:MAX_PLAYERS,host:r.hostName}));
function handle(c,m){
  if(m.t==='i'){const p=c.player;if(!p)return;const seq=typeof m.s==='number'&&m.s>=p.input.s?m.s:p.input.s;p.input={s:seq,x:finite(m.x,-1,1),y:finite(m.y,-1,1),ax:finite(m.ax,-500,5000),ay:finite(m.ay,-500,5000),l:!!m.l,r:!!m.r,sp:!!m.sp};return}
  if(m.t==='ping'){send(c.ws,{t:'pong',c:m.c});return}
  if(m.t==='hello'){
    if(c.token)return;
    const known=typeof m.token==='string'&&/^[\w-]{20,64}$/.test(m.token);
    c.token=known?m.token:profiles.newToken();c.profile=profiles.load(c.token);c.name=cleanName(m.name);
    const old=byToken.get(c.token);if(old&&old!==c){leaveRoom(old);old.ws.close(4001,'Signed in elsewhere')}
    byToken.set(c.token,c);send(c.ws,{t:'welcome',token:c.token,name:c.name});return;
  }
  if(!c.token)return;
  if(m.t==='rooms'){send(c.ws,{t:'rooms',rooms:roomList()});return}
  if(m.t==='name'){c.name=cleanName(m.name);return}
  if(m.t==='create'){createRoom(c,m);return}
  if(m.t==='join'){joinRoom(c,m);return}
  if(m.t==='leave'){leaveRoom(c);send(c.ws,{t:'left'});return}
  if(m.t==='a'&&c.player){
    const n=String(m.n);
    if(n==='travel'||n==='next'||n==='stay'){if(c.room.hostId===c.player.id)sim.hostAction(c.room,c.player,n,m.v);return}
    if(c.player.actions.length<12&&!(c.player.deadT>0))c.player.actions.push({n,v:m.v});
  }
}
const err=(c,msg)=>send(c.ws,{t:'error',msg});
function makeCode(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ';for(;;){let s='';for(const b of crypto.randomBytes(5))s+=A[b%A.length];if(!rooms.has(s))return s}}
function saveOf(c,char){return c.profile.chars[char]||null}
function createRoom(c,m){
  if(c.room)return err(c,'You are already in a room.');
  if(typeof m.char!=='string'||!sim.charExists(m.char))return err(c,'Choose a character first.');
  if(rooms.size>=MAX_ROOMS)return err(c,'The server is full. Try again soon.');
  const room={code:makeCode(),private:!!m.private,faction:sim.factionOf(m.char),clients:new Map(),tick:0,cleared:false,stageChanged:false,emptyAt:0,hostId:0,hostName:c.name,G:null,ev:null};
  const stage=Number.isInteger(m.stage)&&m.stage>=1&&m.stage<=10?m.stage:1;
  const p=sim.createRoom(room,m.char,saveOf(c,m.char),c.name,{mode:m.mode==='swarm'?'swarm':'story',stage});
  rooms.set(room.code,room);enterRoom(c,room,p);
}
function joinRoom(c,m){
  if(c.room)return err(c,'You are already in a room.');
  const room=rooms.get(String(m.code||'').toUpperCase().trim());
  if(!room)return err(c,'No room with that code.');
  if(room.clients.size>=MAX_PLAYERS)return err(c,'That room is full.');
  if(typeof m.char!=='string'||!sim.charExists(m.char))return err(c,'Choose a character first.');
  if(sim.factionOf(m.char)!==room.faction)return err(c,'This room plays as '+(room.faction==='hero'?'heroes':'villains')+'. Choose a '+room.faction+' to join.');
  enterRoom(c,room,sim.addPlayer(room,m.char,saveOf(c,m.char),c.name));
}
function stageInfo(room){const G=room.G;return{stage:G.stage,seed:G.seed,map:sim.mapOf(room),kills:G.killsStage}}
function enterRoom(c,room,p){
  c.room=room;c.player=p;c.known=newClient();room.clients.set(p.id,c);room.emptyAt=0;
  if(!room.hostId){room.hostId=p.id;room.hostName=c.name}
  send(c.ws,Object.assign({t:'joined',code:room.code,you:p.id,host:room.hostId,char:p.char,x:p.x,y:p.y,cleared:room.cleared},stageInfo(room)));
  console.log('room',room.code,'+',c.name,'as',p.char,'('+room.clients.size+' in room)');
}
function saveClient(c){if(c.player&&c.token){c.profile.chars[c.player.char]=sim.saveOf(c.player);profiles.save(c.token,c.profile)}}
function leaveRoom(c){
  const room=c.room,p=c.player;if(!room||!p)return;
  saveClient(c);sim.removePlayer(room,p);room.clients.delete(p.id);c.room=null;c.player=null;c.known=null;
  if(!room.clients.size){room.emptyAt=Date.now();room.hostId=0;return}
  if(room.hostId===p.id){const [id,h]=room.clients.entries().next().value;room.hostId=id;room.hostName=h.name;for(const o of room.clients.values())send(o.ws,{t:'host',host:id})}
}

/* ---------- Game loop ---------- */
function stepRoom(room){
  sim.step(room,TICK);room.tick++;
  if(room.stageChanged){room.stageChanged=false;const info=Object.assign({t:'stage',cleared:false},stageInfo(room));for(const c of room.clients.values()){c.known=newClient();send(c.ws,info)}}
  if(room.tick%SNAP_EVERY)return;
  for(const c of room.clients.values()){
    if(c.ws.readyState!==1||c.ws.bufferedAmount>262144)continue; // a slow connection skips a frame and catches up on the next one
    c.ws.send(JSON.stringify(snapshot(room,c.player,c.known,room.tick)));
  }
  room.ev.length=0;
}
let last=Date.now(),acc=0,slow=0;
const loop=setInterval(()=>{
  const now=Date.now();acc=Math.min(.25,acc+(now-last)/1000);last=now;
  while(acc>=TICK){
    acc-=TICK;
    for(const room of rooms.values()){
      if(!room.clients.size){if(now-room.emptyAt>ROOM_GRACE){rooms.delete(room.code);console.log('room',room.code,'closed')}continue}
      try{stepRoom(room)}catch(e){
        // One broken room must not take the other rooms down with it
        console.error('room',room.code,'failed:',e);for(const c of room.clients.values()){saveClient(c);err(c,'This room hit a server error and closed.');c.room=null;c.player=null;c.known=null;send(c.ws,{t:'left'})}rooms.delete(room.code);
      }
    }
  }
  const took=Date.now()-now;if(took>30&&now-slow>10000){slow=now;console.warn('slow frame:',took,'ms across',rooms.size,'rooms')}
},Math.round(TICK*1000/2));
const saver=setInterval(()=>{for(const c of conns)if(c.player)saveClient(c)},SAVE_EVERY);
const beat=setInterval(()=>{for(const c of conns){if(!c.alive){c.ws.terminate();continue}c.alive=false;try{c.ws.ping()}catch(e){}}},30000);

function shutdown(sig){
  console.log(sig,'saving players and shutting down');clearInterval(loop);clearInterval(saver);clearInterval(beat);
  for(const c of conns){saveClient(c);try{c.ws.close(1001,'Server restarting')}catch(e){}}
  server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),1500).unref();
}
process.on('SIGTERM',()=>shutdown('SIGTERM'));process.on('SIGINT',()=>shutdown('SIGINT'));
server.listen(PORT,HOST,()=>console.log('Dayrim server on http://'+HOST+':'+PORT));
