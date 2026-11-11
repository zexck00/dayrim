/* ---------- Online play. The server runs the world. This file sends what you press and draws what it reports. ---------- */
const net={avail:false,ws:null,ready:false,inRoom:false,lobby:false,you:0,host:0,code:'',token:null,name:'',rooms:[],err:'',seq:0,sendT:0,idleT:0,last:'',pending:[],dash:0,dx:0,dy:0,rtt:0,pingT:0,retry:0,down:false,wantRoom:null,ents:null,bossId:0,bytes:0,onReady:null,reviveT:0};
const mkEnts=()=>({p:new Map(),e:new Map(),n:new Map(),h:new Map(),z:new Map(),l:new Map(),pr:new Map()});
function netAvailable(){return net.avail}
function netOn(){return net.inRoom}
function netIsHost(){return net.you===net.host}
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
/* The online button only appears when the page is served by the Dayrim server */
if(/^https?:$/.test(location.protocol))fetch('api/info',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(j&&j.dayrim){net.avail=true;if(G&&G.mode==='title'&&!net.lobby)renderSelect()}}).catch(()=>{});

function netConnect(then){
  if(net.ws&&net.ws.readyState===1&&net.ready){if(then)then();return}
  net.onReady=then||net.onReady;if(net.ws&&net.ws.readyState<=1)return;
  net.ready=false;const u=new URL('ws',location.href);u.protocol=location.protocol==='https:'?'wss:':'ws:';u.search='';u.hash='';
  const ws=new WebSocket(u.href);net.ws=ws;
  ws.onopen=()=>{netSend({t:'hello',token:store.get('dayrim-token'),name:net.name||store.get('dayrim-name')||''})};
  ws.onmessage=ev=>{net.bytes+=ev.data.length;let m;try{m=JSON.parse(ev.data)}catch(e){return}try{netMessage(m)}catch(e){console.error(e)}};
  ws.onclose=ev=>{if(net.ws!==ws)return;net.ready=false;netDropped(ev)};
  ws.onerror=()=>{};
}
function netSend(o){const w=net.ws;if(w&&w.readyState===1)w.send(JSON.stringify(o))}
/* Lost the connection in a room: keep trying for a while, then come back to the select screen */
function netDropped(ev){
  if(ev&&ev.code===4001){net.err='You signed in from another tab.';if(net.inRoom)netExit();else if(net.lobby)renderLobby();return}
  if(!net.inRoom){net.onReady=null;net.err=net.lobby?'Could not reach the server.':'';if(net.lobby)renderLobby();return}
  net.down=true;net.retry++;if(net.retry>6){net.err='The connection was lost.';netExit();return}
  const rejoin={code:net.code,char:G.p.char};
  setTimeout(()=>{if(!net.inRoom)return;netConnect(()=>{net.wantRoom=rejoin;netSend({t:'join',code:rejoin.code,char:rejoin.char})})},Math.min(8000,700*Math.pow(1.6,net.retry)));
}
function netExit(){net.inRoom=false;net.down=false;net.retry=0;net.wantRoom=null;net.pending=[];net.bossId=0;demoScene();setMode('title');if(net.err)renderLobby()}
function netLeave(){netSend({t:'leave'});net.err='';netExit()}

function netMessage(m){
  if(m.t==='s')return netSnapshot(m);
  if(m.t==='pong'){net.rtt=Math.round(performance.now()-m.c);return}
  if(m.t==='welcome'){store.set('dayrim-token',m.token);net.token=m.token;net.name=m.name;net.ready=true;const f=net.onReady;net.onReady=null;if(f)f();return}
  if(m.t==='rooms'){net.rooms=m.rooms;if(net.lobby&&!net.inRoom)paintRooms();return}
  if(m.t==='error'){
    net.err=m.msg;
    if(net.inRoom&&net.wantRoom){net.wantRoom=null;netExit();return}
    if(net.lobby&&!net.inRoom)renderLobby();return}
  if(m.t==='joined')return netJoined(m);
  if(m.t==='stage')return netStage(m);
  if(m.t==='host'){net.host=m.host;if(netIsHost())addLog('You are now the room host.');if(G.mode==='clear')setMode('clear');return}
  if(m.t==='left'){if(net.inRoom){net.err='This room closed.';netExit()}return}
}
function netJoined(m){if(typeof announce==='function')announce('start',2);
  net.lobby=false;net.you=m.you;net.host=m.host;net.code=m.code;net.err='';net.down=false;net.retry=0;net.wantRoom=null;net.seq=0;net.pending=[];net.bossId=0;
  if(!net.inRoom||!G.mp){G=baseState(false);G.mp=true;G.log=[]}
  const me=freshPlayer(m.char);me.id=m.you;me.pname=net.name;G.p=me;G.players=[me];me.x=m.x;me.y=m.y;recalc();net.inRoom=true;
  netStage(m);G.cam={x:me.x,y:me.y};setMode('play');addLog('Room '+esc(m.code)+'. Share this code so friends can join.');if(m.cleared)setMode('clear');
}
function netStage(m){
  const me=G.p;G.stage=m.stage;G.w=genCitySeeded(m.seed);const bin=atob(m.map);for(let i=0;i<bin.length;i++)G.w.map[i]=bin.charCodeAt(i);
  G.killsStage=m.kills||0;G.enemies=[];G.shots=[];G.loot=[];G.fx=[];G.texts=[];G.npcs=[];G.hazards=[];G.decals=[];G.boss=null;G.banner=null;net.bossId=0;placeInStage(m.stage);
  net.ents=mkEnts();net.ents.p.set(me.id,me);G.players=[me];net.pending=[];net.dash=0;me.tx=undefined;
  G.cam=G.cam||{x:me.x,y:me.y};dirty();if(m.t==='stage'&&G.mode==='clear')setMode('play');
}

/* Apply what the server says changed */
const OWN_PREDICTED=new Set(['face','walk','moving','moveA']);
function patch(o,d,glide,own){for(const k in d){if(k==='id')continue;if(own&&OWN_PREDICTED.has(k))continue;let v=d[k];if(typeof v==='string'&&(v[0]==='{'||v[0]==='['))v=JSON.parse(v);
  if(k==='x'&&glide){o.tx=v;continue}if(k==='y'&&glide){o.ty=v;continue}o[k]=v===null?undefined:v}}
function applyList(rec,map,kind){if(!rec)return false;const [upd,rm]=rec;let changed=rm.length>0;
  for(const d of upd){let o=map.get(d.id);const fresh=!o;if(fresh){o=kind==='p'?Object.assign(freshPlayer(d.char||G.p.char),{s:{maxHp:1}}):{};o.id=d.id;map.set(d.id,o);changed=true}
    patch(o,d,kind==='p'||kind==='e'||kind==='n',false);if(fresh&&o.tx!==undefined){o.x=o.tx;o.y=o.ty}if(fresh&&kind==='l')o.t=0}
  for(const id of rm)map.delete(id);return changed}
function netSnapshot(m){
  if(!net.inRoom||!net.ents)return;const E=net.ents,me=G.p;
  if(m.p){const [upd,rm]=m.p,others=[];
    for(const d of upd){if(d.id===me.id){const was=me.s&&me.s.maxHp;patch(me,d,true,true);if(d.lvl!==undefined||d.gold!==undefined||d.potions!==undefined||d.sp!==undefined||d.weapon!==undefined||was!==me.s.maxHp)dirty();if(G.mode==='menu'&&menuTab==='weapons'&&(d.gold!==undefined||d.weapon!==undefined||d.weapons!==undefined||d.weaponUpgrades!==undefined||d.nearSafe!==undefined))refreshProgressMenu();if(G.mode==='menu'&&menuTab==='achievements'&&(d.achievements!==undefined||d.kills!==undefined||d.bestCombo!==undefined||d.lvl!==undefined||d.beaten!==undefined||d.swarmBest!==undefined||d.weaponUpgrades!==undefined))refreshProgressMenu();if(G.mode==='menu'&&menuTab==='skills'&&(d.sp!==undefined||d.skills!==undefined||d.boonPending!==undefined||d.runBoons!==undefined))refreshProgressMenu()}else others.push(d)}
    if(applyList([others,rm],E.p,'p')){const before=G.players.length;G.players=[...E.p.values()];if(before!==G.players.length&&before>0)net.scaleNotice=performance.now()+4000}}
  if(applyList(m.e,E.e,'e'))G.enemies=[...E.e.values()];
  if(applyList(m.n,E.n,'n'))G.npcs=[...E.n.values()];
  if(applyList(m.h,E.h,'h'))G.shots=[...E.h.values()];
  if(applyList(m.z,E.z,'z'))G.hazards=[...E.z.values()];
  if(applyList(m.l,E.l,'l'))G.loot=[...E.l.values()];
  if(applyList(m.pr,E.pr,'pr'))G.props=[...E.pr.values()];
  const g=m.g;if(g){if(g.hour!==undefined)G.hour=g.hour;if(g.kills!==undefined)G.killsStage=g.kills;if(g.hope!==undefined)G.hope=g.hope;if(g.hopeSpent!==undefined)G.hopeSpent=g.hopeSpent;if(g.obj!==undefined){try{const o=JSON.parse(g.obj);G.obj={i:o.i,done:!!o.d,steps:[],cur:{have:o.h,need:o.n,label:o.l},tg:o.tg||[],holdNeed:o.hn||0}}catch(e){}}if(g.maxHope!==undefined)G.hopeMax=g.maxHope;if(g.gate!==undefined)G.gate.open=!!g.gate;if(g.td!==undefined)G.tide=g.td;if(g.sw!==undefined){try{const o=g.sw?JSON.parse(g.sw):null;G.swarm=o?{wave:o.w,left:o.l,breakT:o.b,over:!!o.o}:null}catch(e){}}if(g.time!==undefined&&Math.abs(G.t-g.time)>4)G.t=g.time;if(g.ch!==undefined){if(!G.chain)G.chain={n:0,t:0,tier:null};G.chain.n=g.ch}if(g.ct!==undefined){if(!G.chain)G.chain={n:0,t:0,tier:null};G.chain.t=g.ct}if(g.lk!==undefined){try{const L=g.lk?JSON.parse(g.lk):null;G.link=L?{n:L.n,t:L.t,dmg:(linkTier(L.n)||[0,0])[1],name:'',ids:L.in?[G.p.id]:[]}:null}catch(e){}}
    if(g.ban!==undefined){if(g.ban){const b=JSON.parse(g.ban);G.banner={a:b.a,b:b.b,t:b.t}}else G.banner=null}
    if(g.boss!==undefined)net.bossId=g.boss}
  G.boss=net.bossId?E.e.get(net.bossId)||null:null;
  if(m.v)for(const v of m.v)netEvent(v);
  // Your own position: trust the server, add back the moves it has not seen yet, and ease toward that
  if(me.tx!==undefined){const a=m.a;while(net.pending.length&&net.pending[0].s<=a)net.pending.shift();let x=me.tx,y=me.ty;for(const q of net.pending){x+=q.dx;y+=q.dy}const ex=x-me.x,ey=y-me.y,err=Math.hypot(ex,ey);if(err>110){me.x=x;me.y=y;G.cam.x=x;G.cam.y=y;net.down=false}else{me.x+=ex*.22;me.y+=ey*.22}}
}
function netEvent(v){switch(v[0]){
  case's':sfx(v[1]);break;case'v':voice(v[1]);break;case't':tone(v[1],v[2],v[3],v[4],v[5],v[6]);break;case'o':noiseHit(v[1],v[2]);break;case'g':stinger(v[1]);break;case'k':shake(v[1]);break;
  case'l':addLog(v[1]);break;case'x':text(v[1],v[2],v[3],v[4],!!v[5]);break;case'b':burst(v[1],v[2],v[3],v[4],v[5]);break;case'w':glowP(v[1],v[2],v[3],v[4],v[5],v[6],v[7]);break;
  case'e':bleed(v[1],v[2],v[3],v[4],v[5]);break;case'd':addDecal(v[1],v[2],v[3],!!v[4],v[5]||undefined);break;case'f':G.fx.push(v[1]);break;
  case'achievement':showAchievement(v[1]);break;case'clear':if(G.mode==='play'||G.mode==='menu'||G.mode==='pause')setMode('clear');break;case'clearDone':if(G.mode==='clear')setMode('play');break}}

/* Runs every frame in a room, in place of update() */
function netUpdate(dt){
  const me=G.p,k=Math.min(1,dt*14);G.t+=dt;net.pingT-=dt;if(net.pingT<=0){net.pingT=2;netSend({t:'ping',c:performance.now()})}
  const glide=o=>{if(o.tx===undefined)return;const ex=o.tx-o.x,ey=o.ty-o.y;if(Math.abs(ex)+Math.abs(ey)>260){o.x=o.tx;o.y=o.ty}else{o.x+=ex*k;o.y+=ey*k}};
  G.enemies.forEach(glide);G.npcs.forEach(glide);G.players.forEach(q=>{if(q!==me)glide(q)});
  for(const s of G.shots){s.x+=s.vx*dt;s.y+=s.vy*dt;trail(s,dt)}
  for(const h of G.hazards)h.t-=dt;for(const l of G.loot)l.t+=dt;
  if(G.banner){G.banner.t-=dt;if(G.banner.t<=0)G.banner=null}
  if(me.ult)me.ult.t+=dt;
  // Your character answers at once. The server corrects it if it disagrees.
  const playing=G.mode==='play'&&!(me.deadT>0||me.respawnT>0),v=G.mode==='play'&&!(me.respawnT>0)?moveVec():{x:0,y:0},guard=playing&&(mouse.right||touchHold.guard);
  if(touchMode){const n=nearestEnemy();if(n)me.face=Math.atan2(n.y-me.y,n.x-me.x);else if(v.x||v.y)me.face=Math.atan2(v.y,v.x)}else if(playing)me.face=Math.atan2(mouse.y-(me.y-22),mouse.x-me.x);
  const bx=me.x,by=me.y;if(me.deadT>0||me.respawnT>0)net.dash=0;
  if(me.webT>0)net.dash=0;
  if(!(me.deadT>0)&&net.dash>0){net.dash-=dt;move(me,net.dx*520*dt,net.dy*520*dt)}
  else if(v.x||v.y){const sp=envSpeed(me)*me.s.speed*abilSpeed(me)*(me.deadT>0?.25:(auraHas(me,'scout')?1.08:1)*(archKey(me.char)==='scout'&&me.reviveTarget?.5:1)*(me.fastT>0?1.4:1)*(guard?.55:1)*(me.mv?.3:1)*chainBonus().spd);move(me,v.x*sp*dt,v.y*sp*dt);me.walk+=dt*11;me.moveA=Math.atan2(v.y,v.x)}
  me.moving=!!(v.x||v.y);
  if(me.x!==bx||me.y!==by)net.pending.push({s:net.seq+1,dx:me.x-bx,dy:me.y-by});if(net.pending.length>240)net.pending.shift();
  net.reviveT-=dt;if(net.reviveT<=0&&G.mode==='play'&&(keys.has('KeyF')||touchHold.revive)){net.reviveT=.2;netSend({t:'a',n:'revive',v:true})}net.sendT+=dt;net.idleT+=dt;if(net.sendT>=1/30){net.sendT=0;netSendInput(false,v,playing)}
  tickFx(dt);
}
function netSendInput(force,v,playing){
  const me=G.p;if(playing===undefined)playing=G.mode==='play'&&!(me.deadT>0||me.respawnT>0);v=v||(G.mode==='play'&&!(me.respawnT>0)?moveVec():{x:0,y:0});const aim=touchMode?(me.abil?abilAim(me):{x:me.x+Math.cos(me.face)*120,y:me.y-22+Math.sin(me.face)*120}):mouse;
  const l=playing&&!!(mouse.left||touchHold.slash),r=playing&&!!(mouse.right||touchHold.guard);
  const body={x:+v.x.toFixed(3),y:+v.y.toFixed(3),ax:Math.round(aim.x||0),ay:Math.round(aim.y||0),l,r},str=JSON.stringify(body),same=str===net.last;
  if(same&&!force&&!(v.x||v.y)&&net.dash<=0&&net.idleT<.25)return;
  net.idleT=0;net.last=str;net.seq++;netSend(Object.assign({t:'i',s:net.seq},body));
}
function netAct(n,v){
  if(!net.inRoom)return;netSendInput(true);
  if(n==='dash'){const me=G.p;if(me.cd.dash<=0&&!(me.deadT>0)&&net.dash<=0){const q=moveVec(),a=(q.x||q.y)?Math.atan2(q.y,q.x):me.face;net.dash=.26;net.dx=Math.cos(a);net.dy=Math.sin(a);sfx('dash')}}
  netSend({t:'a',n,v});
  if(G.mode==='menu')setTimeout(()=>{if(net.inRoom&&G.mode==='menu')renderMenu()},160);
}

/* Screens */
function netOverlay(m,c){
  if(m==='pause'){c.innerHTML='<h2>Room '+esc(net.code)+'</h2><p>The game keeps running while this is open. Give friends this code so they can join. Returning to the menu leaves the room.</p><div class="btnrow"><button class="go" id="go" type="button">Back to the game</button><button class="ghost" id="leave" type="button">Return to menu</button></div>';$('go').onclick=()=>setMode('play');$('leave').onclick=netLeave;return true}
  if(m==='clear'){const n=G.stage,last=n>=10,host=netIsHost(),next=last?'':' Next is stage '+(n+1)+': '+esc(STAGES[n].n)+'.';
    c.innerHTML='<h2>'+(last?'All 10 stages clear':'Stage '+n+' cleared')+'</h2><p>Your party defeated the boss and everyone earned 2 skill points.'+next+(host||last?'':' The room host chooses when to move on.')+'</p><div class="btnrow">'+(host&&!last?'<button class="go" id="go" type="button">Go to stage '+(n+1)+'</button><button class="ghost" id="stay" type="button">Keep training here</button>':'<button class="go" id="stay" type="button">Keep fighting</button>')+'</div>';
    c.querySelector('.btnrow').insertAdjacentHTML('beforeend','<button class="ghost" id="tomenu" type="button">Return to main menu</button>');$('tomenu').onclick=netLeave;const g=$('go');if(g)g.onclick=()=>{netAct('next');setMode('play')};$('stay').onclick=()=>{if(host)netAct('stay');setMode('play')};return true}
  return false;
}
let lobbyPoll=null;
function renderLobby(){
  net.lobby=true;const c=$('card');$('ov').hidden=false;
  const side=factionOf(chosen),nm=net.name||store.get('dayrim-name')||'';
  c.innerHTML='<div class="sel-top"><h2>Play online</h2></div><div class="mlist"><p class="mhead">Up to 4 players fight together. You play as <b>the '+esc(label(chosen))+'</b> ('+(side==='hero'?'hero':'villain')+'). Everyone in a room plays on the same side.</p>'+
   (net.err?'<p class="mhead" role="alert" style="color:#ff8f80">'+esc(net.err)+'</p>':'')+
   '<div class="mrow"><div><strong><label for="nm">Your name</label></strong></div><input id="nm" maxlength="16" autocomplete="nickname" value="'+esc(nm)+'" style="font:inherit;padding:8px;min-width:0;width:170px"></div>'+
   '<div class="mrow"><div><strong>New room</strong><span><label><input type="checkbox" id="prv"> Private: only people with the code can join</label><label><input type="checkbox" id="swm"> The Swarm on stage <select id="sws">'+[1,2,3,4,5,6,7,8,9,10].map(n=>'<option>'+n+'</option>').join('')+'</select> (up to your furthest stage)</label></span></div><button type="button" class="buy" id="mk">Create</button></div>'+
   '<div class="mrow"><div><strong><label for="cd">Join with a code</label></strong></div><input id="cd" maxlength="5" autocapitalize="characters" autocomplete="off" style="font:inherit;padding:8px;width:90px;text-transform:uppercase"><button type="button" class="buy" id="jn">Join</button></div>'+
   '<div id="rl"></div></div><div class="btnrow"><button class="ghost" id="bk" type="button">Back to characters</button></div>';
  const setName=()=>{net.name=$('nm').value.slice(0,16);store.set('dayrim-name',net.name)};
  const go=msg=>{setName();net.err='';netConnect(()=>{netSend({t:'name',name:net.name});netSend(msg)})};
  $('mk').onclick=()=>go({t:'create',char:chosen,private:$('prv').checked,mode:$('swm').checked?'swarm':'story',stage:+$('sws').value||1});
  $('jn').onclick=()=>{const code=$('cd').value;if(code.trim())go({t:'join',code,char:chosen})};
  $('bk').onclick=()=>{net.lobby=false;net.err='';clearInterval(lobbyPoll);renderSelect()};
  paintRooms();clearInterval(lobbyPoll);const poll=()=>{if(!net.lobby){clearInterval(lobbyPoll);return}netConnect(()=>netSend({t:'rooms'}))};poll();lobbyPoll=setInterval(poll,3000);
}
function paintRooms(){const el=$('rl');if(!el)return;
  el.innerHTML=net.rooms.length?'<p class="mhead">Open rooms</p>'+net.rooms.map(r=>'<div class="mrow"><div><strong>'+esc(r.host)+'</strong><span>'+(r.side==='hero'?'Heroes':'Villains')+' · '+(r.mode==='swarm'?'The Swarm, stage '+r.stage+', wave '+(r.wave||0):'Stage '+r.stage)+' · Difficulty ×'+PARTY_SCALE[Math.max(0,Math.min(3,r.count-1))].difficulty+'</span></div><em>'+r.count+'/'+r.max+'</em><button type="button" class="buy" data-room="'+esc(r.code)+'"'+(r.side!==factionOf(chosen)?' disabled title="Choose a character from this side to join"':'')+'>Join</button></div>').join(''):'<p class="mhead">No open rooms right now. Create one.</p>';
  el.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>{const nm=$('nm');net.name=nm?nm.value.slice(0,16):net.name;store.set('dayrim-name',net.name);net.err='';netConnect(()=>{netSend({t:'name',name:net.name});netSend({t:'join',code:b.dataset.room,char:chosen})})})}
/* Party list, room code and the respawn message, drawn over the game */
function netHud(small,portrait=false,landscape=false){
  const me=G.p,x=12;let y=landscape?108:portrait?(G.boss?182:132):touchMode?(H<500?220:195):(small?116:70);ctx.textAlign='left';
  if(portrait){mobilePanel(6,y-14,148,23+(G.players.length-1)*17);ctx.font='600 12px Barlow,sans-serif';ctx.fillStyle='#f0c23c';ctx.fillText('Hope '+(G.hope??0)+'/'+(G.hopeMax??0)+' · Difficulty ×'+partyScale().difficulty,x,y,136);y+=18}else{
  ctx.fillStyle='rgba(5,10,20,.62)';ctx.fillRect(6,y-14,small?180:225,66+G.players.length*17);
  ctx.font='500 11px "IBM Plex Mono",monospace';ctx.fillStyle='#f0c23c';ctx.fillText('Room '+net.code+' · Hope '+(G.hope??0)+'/'+(G.hopeMax??0),x,y);y+=15;{const chg=net.scaleNotice>performance.now();ctx.fillStyle=chg?'#8fe6ff':'#f0c23c';ctx.fillText((chg?'Difficulty changed ×':'Difficulty ×')+partyScale().difficulty+' · Spent '+(G.hopeSpent||0),x,y,small?168:210)}y+=15;ctx.fillStyle='#f0c23c';ctx.fillText('Retry: '+(G.gate&&G.gate.open?'boss gate':'objective checkpoint'),x,y,small?168:210);y+=16;}

  for(const q of G.players){if(portrait&&q===me)continue;const hp=clamp(q.hp/((q.s&&q.s.maxHp)||1),0,1),isHost=q.id===net.host;ctx.fillStyle='rgba(5,10,20,.85)';ctx.fillRect(x,y-9,small?50:70,9);ctx.fillStyle=q.deadT>0?'#555':'#d8483c';ctx.fillRect(x+1,y-8,((small?50:70)-2)*hp,7);ctx.font='600 12px Barlow,sans-serif';ctx.fillStyle=q===me?'#ffffff':'#8fe0ff';const rev=G.players.find(z=>z.reviveTarget===q.id&&z.reviveProgress>0),status=q.respawnT>0?' · '+Math.ceil(q.respawnT)+'s':q.deadT>0?(rev?' · '+Math.round(rev.reviveProgress*100)+'%':' · down '+Math.ceil(q.deadT)+'s'):'';ctx.fillText((isHost?'★ ':'')+(q.pname||'Player')+status,x+(small?55:76),y,portrait?84:small?113:149);y+=17}
  const selected=G.players.find(q=>q.id===me.reviveTarget&&q.deadT>0);if(selected){ctx.font='600 11px Barlow,sans-serif';ctx.fillStyle='#8fe6ff';ctx.fillText('Reviving '+(selected.pname||label(selected.char))+' · '+Math.round(me.reviveProgress*100)+'%',x,y,portrait?136:W-24);y+=16}else if(G.players.some(q=>q!==me&&q.deadT>0)){ctx.font='600 11px Barlow,sans-serif';ctx.fillStyle='#d8e9ff';ctx.fillText((touchMode?'Hold revive':'Hold F')+' near an ally ('+(archKey(me.char)==='medic'?120:60)+')',x,y,portrait?136:W-24);y+=16}
  const big=(a,b)=>{const y=portrait&&!landscape?Math.max(portraitBounds().top+20,Math.min(H*.45,portraitBounds().bottom-30)):H*.45;ctx.textAlign='center';ctx.lineWidth=5;ctx.strokeStyle='rgba(5,10,20,.9)';ctx.font='700 '+(small?26:42)+'px "Pixelify Sans",monospace';ctx.strokeText(a,W/2,y,portrait?W-24:W);ctx.fillStyle='#ff8f80';ctx.fillText(a,W/2,y,portrait?W-24:W);ctx.font='600 15px Barlow,sans-serif';ctx.lineWidth=3;ctx.strokeText(b,W/2,y+26,portrait?W-24:W);ctx.fillStyle='#f2ecd8';ctx.fillText(b,W/2,y+26,portrait?W-24:W)};
  if(net.down)big('Reconnecting','Trying to get back to room '+net.code);
  else if(me.respawnT>0)big('You bled out','Waking at the safehouse in '+Math.ceil(me.respawnT));else if(me.deadT>0)big('You are down',me.windDown?'Second Wind in '+Math.ceil(me.deadT):'Crawl to an ally · Bleeding out in '+Math.ceil(me.deadT));
}
