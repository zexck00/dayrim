/* Story mode engine: runs the script in story-data.js on the maps in story-map.js.
   A chapter is a list of beats (talk, go, kill, collect, defend, hold, elite, boss). One beat is live at a time;
   finishing the boss beat ends the chapter. Story mode is single player and keeps its own save, one per side. */
const STORY_KEY='dayrim-story',STORY_FIELDS=['char','lvl','xp','gold','potions','fast','magic','gear','bag','weapons','weapon','skills','train','sp','kills','rage','bestCombo','runBoons','weaponUpgrades','achievements','maxStage','beaten'];
function storyRead(){try{const r=JSON.parse(localStorage.getItem(STORY_KEY)||'{}');return r&&typeof r==='object'?r:{}}catch(e){return{}}}
function storyPack(p){const o={};for(const k of STORY_FIELDS)o[k]=p[k];return o}
function storyWrite(){const S=G.story;if(!S)return;const all=storyRead();all[S.fac]={char:G.players[0].char,ci:S.ci,q:S.q,top:S.top,opened:S.opened,time:Math.round(S.time),p:storyPack(G.players[0])};try{localStorage.setItem(STORY_KEY,JSON.stringify(all))}catch(e){}}
const storyTitle=()=>'Chapter '+(G.story.ci+1)+': '+STORY[G.story.ci].n;
const storySafeName=()=>STORY[G.story.ci].safe[G.story.fac];
/* The nearest walkable spot to a tile, in world units */
function storySpot(tx,ty){tx=Math.round(tx);ty=Math.round(ty);for(let r=0;r<7;r++)for(let b=-r;b<=r;b++)for(let a=-r;a<=r;a++){if(Math.max(Math.abs(a),Math.abs(b))!==r)continue;const x=tx+a,y=ty+b;if(x>1&&y>1&&x<MW-2&&y<MH-2&&!G.w.map[idx(x,y)])return tilePx(x,y)}return tilePx(tx,ty)}
const storySpotAt=(x,y)=>storySpot(x/T-.5,y/T-.5);

function storyBegin(char,ci,sv,q){
  G=baseState(false);G.p=sv?Object.assign(freshPlayer(char),sv.p):freshPlayer(char);G.players=[G.p];achievementInit(G.p,true);
  G.story={ci,fac:factionOf(char),q:q||0,top:Math.max(ci,(sv&&sv.top)||0),opened:(sv&&sv.ci===ci&&(q||0)===(sv.q||0)&&sv.opened)||[],time:(sv&&sv.time)||0,rt:null,npcs:{},roamT:6,over:false,freed:false};
  recalc();enterStage(ci+1);G.p.hp=G.p.s.maxHp;G.p.mana=G.p.s.maxMana;hideModes();setMode('play');storyWrite();
  const ch=STORY[ci];G.banner={t:4,a:'Chapter '+(ci+1)+' · '+ch.n,b:ch.title[G.story.fac]};
  if(!q)storyTalk(ch.intro[G.story.fac]);
}
/* Called by enterStage once the map is built and the player is placed: people, camps and the live beat. */
function storyEnter(){
  const S=G.story,ch=STORY[S.ci];G.gate.open=false;G.hour=ch.hour;G.villT=1e9;G.decals=[];G.hazards=[];S.npcs={};S.rt=null;
  for(const c of ch.npcs){if(c.f&&c.f!==S.fac)continue;const o=storySpot(c.at[0],c.at[1]),k=STORY_CAST[c.id];
    const n={name:k.n,art:k.art,sid:c.id,x:o.x,y:o.y,r:9,dx:0,dy:0,t:0,walk:0,quip:null,qt:0,sp:0,hp:1e9,maxHp:1e9,scare:0,kx:0,ky:0,flash:0,fixed:true,chat:(c.chat&&c.chat[S.fac])||[],ci:0};G.npcs.push(n);S.npcs[c.id]=n}
  for(let i=0,t=0;i<7&&t<200;t++){const c=pick(G.w.open),x=(c%MW+.5)*T,y=((c/MW|0)+.5)*T;if(Math.hypot(x-G.safe.x,y-G.safe.y)>620)continue;const hp=26*stageScale(G.stage);G.npcs.push({name:pick(NPC_NAMES),x,y,r:9,dx:0,dy:1,t:0,walk:rnd(9),quip:null,qt:0,sp:rnd(34,56),hp,maxHp:hp,scare:0,kx:0,ky:0,flash:0});i++}
  for(const c of ch.camps){const o=storySpot(c[0],c[1]);storyFoes(o.x,o.y,4,{strong:1,spread:140})}
  G.obj={i:0,done:false,steps:[{kind:'story',label:'',have:0,need:1}],tg:[]};
  if(S.over){G.obj.steps[0].label='Chapter complete. Explore freely.';return}
  storyBeat(true);
}
/* Enemies for a beat. Heroes fight the chapter's minions; villains fight heroes, who are tougher, so fewer come. */
function storyFoes(x,y,n,o={}){
  const S=G.story,hero=S.fac==='hero',own=STORY[S.ci].own,out=[],cnt=hero?n:Math.max(2,Math.round(n*.6));
  for(let i=0;i<cnt;i++){const a=rnd(TAU),d=rnd(20,o.spread||150),at=storySpotAt(x+Math.cos(a)*d,y+Math.sin(a)*d),strong=i<(o.strong||0);
    const e=hero?spawnMob(0,at,strong):spawnRival(0,strong&&!hero?true:false,at);if(!e)continue;
    if(hero){const m=MINIONS[own][strong?1:0];e.owner=own;e.name=e.art=m.n;e.ah=m.ah}
    if(o.tag)e.sq=o.tag;if(o.aware)e.aware=true;out.push(e)}
  return out;
}
function storyElite(at,name,adds){
  const e=spawnRival(0,true,{x:at.x,y:at.y},name);
  if(e){e.hp*=3.2;e.maxHp=e.hp;e.dmg*=1.15;e.xp*=2.5;e.gold*=5;e.lvl=recLevel(G.stage)+3;e.sq='elite';e.lt=true;e.aware=true;e.title=theName(name)}
  storyFoes(at.x,at.y,adds,{tag:'adds',spread:170,aware:true,strong:1});
  G.banner={t:3,a:theName(name),b:'Lieutenant of the '+(G.story.fac==='hero'?'Night Court':'Dawn Watch')};sfx('boom');shake(6);return e;
}
/* Leftover wave enemies give up when a defence is won */
function storyRout(tag){for(const e of G.enemies)if(e.sq===tag&&!e.dead){e.dead=true;G.fx.push({k:'ring',x:e.x,y:e.y-20,r:6,to:40,t:.3,m:.3,c:'#c8d8ff'});burst(e.x,e.y-20,'#c8d8ff',8,120)}}
function storyBeat(quiet){
  const S=G.story,b=STORY[S.ci].beats[S.q];if(!b){S.rt=null;storyHud();return}
  const f=b[S.fac],rt=S.rt={k:b.k,have:0,need:1,label:f.l,t:0},P=a=>storySpot(a[0],a[1]);
  if(b.k==='talk')rt.npc=S.npcs[f.npc];
  else if(b.k==='go')rt.at=P(b.at);
  else if(b.k==='kill'){rt.at=P(b.at);rt.foes=storyFoes(rt.at.x,rt.at.y,b.n,{strong:b.strong,tag:'q',spread:210});rt.need=rt.foes.length}
  else if(b.k==='collect'){rt.items=b.items.map(a=>Object.assign(P(a),{done:false}));rt.need=rt.items.length;rt.item=f.item;if(b.guards){const g=P(b.guards);storyFoes(g.x,g.y,b.guards[2],{spread:230})}}
  else if(b.k==='defend'){rt.at=P(b.at);rt.need=b.t;rt.wave=2.5;rt.r=180}
  else if(b.k==='hold'){rt.zones=b.pts.map(a=>Object.assign(P(a),{t:0,done:false,woke:false}));rt.need=rt.zones.length;rt.hold=b.t;rt.mark=b.mark||'Zone';rt.r=115}
  else if(b.k==='elite'){rt.at=P(b.at);rt.phase=0}
  else if(b.k==='boss'){rt.at={x:G.gate.x,y:G.gate.y};if(quiet)G.gate.open=true;else openGate()}
  storyHud();
  if(!quiet){if(b.k!=='boss')G.banner={t:3.4,a:'New objective',b:f.l};if(f.in)storyTalk(f.in)}
}
/* The objective line and the on-screen pointers both read G.obj */
function storyHud(){
  const S=G.story,rt=S.rt,st=G.obj.steps[0],tg=[];
  if(!rt){st.label=S.over?'Chapter complete. Explore freely.':'';st.have=0;st.need=1;G.obj.tg=tg;return}
  st.label=rt.label;st.have=Math.min(rt.have,rt.need);st.need=rt.need;st.secs=rt.k==='defend';
  if(rt.k==='talk'&&rt.npc)tg.push([rt.npc.x,rt.npc.y,rt.npc.name]);
  else if(rt.k==='go'||rt.k==='defend')tg.push([rt.at.x,rt.at.y,rt.k==='go'?'Go here':'Defend']);
  else if(rt.k==='kill'){const live=rt.foes.filter(e=>!e.dead);if(live.length){const n=live.reduce((a,e)=>dist(e,G.p)<dist(a,G.p)?e:a);tg.push([n.x,n.y,'Enemy'])}}
  else if(rt.k==='collect'){for(const it of rt.items)if(!it.done)tg.push([it.x,it.y,rt.item])}
  else if(rt.k==='hold'){for(const z of rt.zones)if(!z.done)tg.push([z.x,z.y,rt.mark])}
  else if(rt.k==='elite'){if(rt.boss&&!rt.boss.dead)tg.push([rt.boss.x,rt.boss.y,rt.boss.title]);else if(rt.phase===0)tg.push([rt.at.x,rt.at.y,'Lieutenant'])}
  else if(rt.k==='boss'&&!G.boss)tg.push([G.gate.x,G.gate.y,'Boss']);
  G.obj.tg=tg;
}
function storyTick(dt){
  const S=G.story,ch=STORY[S.ci],b=ch.beats[S.q],rt=S.rt,p=G.players[0];S.time+=dt;if(!S.freed)G.hour=ch.hour;G.p=p;
  /* a few enemies always roam the wilds, away from the town, so there is something to fight between objectives */
  S.roamT-=dt;if(S.roamT<=0){S.roamT=5;if(!G.boss&&G.enemies.filter(e=>e.kind==='rival'&&!e.sq).length<7+S.ci*2)for(let t=0;t<24;t++){const c=pick(G.w.open),x=(c%MW+.5)*T,y=((c/MW|0)+.5)*T,d=Math.hypot(x-p.x,y-p.y);if(d>620&&d<1500&&Math.hypot(x-G.safe.x,y-G.safe.y)>700){storyFoes(x,y,irnd(2,3),{spread:90,strong:Math.random()<.25?1:0});break}}}
  if(!rt||!b||S.over)return;const alive=!(p.deadT>0||p.respawnT>0);
  if(rt.k==='go'){if(alive&&dist(p,rt.at)<95)return storyDone()}
  else if(rt.k==='kill'){rt.have=rt.foes.filter(e=>e.dead).length;if(rt.have>=rt.need)return storyDone()}
  else if(rt.k==='collect'){if(alive)for(const it of rt.items)if(!it.done&&dist(p,it)<32){it.done=true;rt.have++;sfx('loot');text(it.x,it.y-24,rt.item,'#8fe6b8',true);burst(it.x,it.y-12,'#8fe6b8',14,150)}if(rt.have>=rt.need)return storyDone()}
  else if(rt.k==='defend'){if(alive&&dist(p,rt.at)<rt.r){rt.t+=dt;rt.wave-=dt;if(rt.wave<=0){rt.wave=7.5;const a=rnd(TAU);storyFoes(rt.at.x+Math.cos(a)*340,rt.at.y+Math.sin(a)*340,3,{tag:'w',spread:70,aware:true})}}rt.have=Math.floor(rt.t);if(rt.t>=rt.need){storyRout('w');return storyDone()}}
  else if(rt.k==='hold'){for(const z of rt.zones){if(z.done)continue;if(alive&&dist(p,z)<rt.r){if(!z.woke){z.woke=true;const a=rnd(TAU);storyFoes(z.x+Math.cos(a)*270,z.y+Math.sin(a)*270,4,{tag:'w',spread:80,aware:true,strong:1})}z.t+=dt;if(z.t>=rt.hold){z.done=true;rt.have++;sfx('level');burst(z.x,z.y-24,'#ffe9a0',26,210);text(z.x,z.y-60,S.fac==='hero'?'SHRINE LIT':'SHRINE SNUFFED','#ffe9a0',true);const sh=G.w.props.find(o=>o.t==='shrine'&&Math.hypot(o.x-z.x,o.y-z.y)<120);if(sh)sh.on=S.fac==='hero'}}else z.t=Math.max(0,z.t-dt*.5)}if(rt.have>=rt.need)return storyDone()}
  else if(rt.k==='elite'){if(rt.phase===0){if(alive&&dist(p,rt.at)<380){rt.phase=1;const f=b[S.fac],go=()=>{rt.boss=storyElite(rt.at,f.name,b.adds);rt.phase=2};if(f.pre)storyTalk(f.pre,go);else go()}}else if(rt.phase===2&&rt.boss&&rt.boss.dead)return storyDone()}
  storyHud();
}
function storyDone(){
  const S=G.story,f=STORY[S.ci].beats[S.q][S.fac],p=G.players[0];S.rt=null;G.p=p;storyHud();
  const xp=Math.round(xpNeed(p.lvl)*.2),gold=25*(S.ci+1);p.gold+=gold;gainXp(xp);sfx('level');text(p.x,p.y-92,'OBJECTIVE COMPLETE','#8fe6b8',true);addLog('Objective complete: +'+xp+' XP and '+gold+' gold.');
  const next=()=>{S.q++;storyWrite();storyBeat(false)};
  if(f.out)storyTalk(f.out,next);else next();
}
/* What the player can use right now: a named person within reach, or an unopened chest */
function storyNear(){
  const S=G&&G.story;if(!S||G.mode!=='play')return null;const p=G.p;if(!p||p.deadT>0||p.respawnT>0)return null;let best=null,bd=74;
  for(const c of G.npcs)if(c.fixed){const d=dist(p,c);if(d<bd){bd=d;best={kind:'npc',o:c,label:'Talk'}}}
  for(const o of G.w.props)if(o.t==='chest'&&!S.opened.includes(o.id)){const d=dist(p,o);if(d<bd){bd=d;best={kind:'chest',o,label:'Open chest'}}}
  return best;
}
function storyAct(){
  const n=storyNear();if(!n)return false;const S=G.story,p=G.p;
  if(n.kind==='chest'){const o=n.o,gold=Math.round((50+rnd(30))*(S.ci+1));S.opened.push(o.id);p.gold+=gold;p.potions++;sfx('loot');burst(o.x,o.y-14,'#e8c95c',22,190);text(o.x,o.y-34,'+'+gold+' gold','#e8c95c',true);
    if(o.id===3){p.sp++;text(o.x,o.y-56,'+1 SKILL POINT','#8fe6b8',true);addLog('The chest held an old relic: +1 skill point, '+gold+' gold and a potion.')}else{if(Math.random()<.5)p.fast++;else p.magic++;addLog('Chest opened: '+gold+' gold, a potion and a pill.')}
    dirty();storyWrite();return true}
  const c=n.o,rt=S.rt;
  if(rt&&rt.k==='talk'&&rt.npc===c){storyTalk(STORY[S.ci].beats[S.q][S.fac].t,storyDone);return true}
  if(c.chat.length)storyTalk([c.sid+': '+c.chat[c.ci++%c.chat.length]]);
  return true;
}
function storyGift(kind){const p=G.players[0],ci=G.story.ci;if(kind==='sp'){p.sp+=2;addLog('Gift: +2 skill points. Press T to spend them.')}else if(kind==='supplies'){p.potions+=3;p.fast++;p.magic++;addLog('Gift: 3 potions, a fast pill and a magic pill.')}else{const g=150*(ci+1);p.gold+=g;addLog('Gift: '+g+' gold.')}sfx('level');dirty()}

/* ---------- Dialogue ---------- */
const DLG={q:[],i:0,n:0,text:'',who:'',art:null,ask:null,on:false,done:null};
function storyTalk(lines,done){
  if(!lines||!lines.length){if(done)done();return}
  if(DLG.on){DLG.q.push(...lines);const prev=DLG.done;DLG.done=()=>{if(prev)prev();if(done)done()};return}
  DLG.q=lines.slice();DLG.i=0;DLG.done=done||null;DLG.on=true;
  resetTouch();G.mode='talk';keys.clear();mouse.left=mouse.right=false;sprintKey=false;$('touch').hidden=true;$('screen').classList.remove('touch-playing');$('ov').hidden=true;$('story-act').hidden=true;$('dlg').hidden=false;dlgLine();
}
function dlgLine(){
  const raw=DLG.q[DLG.i],ask=typeof raw==='object'?raw:null,s=ask?ask.ask:raw,k=s.indexOf(': '),who=k<0?'':s.slice(0,k),p=G.players[0];
  DLG.text=s.slice(k<0?0:k+2).replace('{voice}',(STORY_VOICE[p.char]||[''])[G.story?G.story.ci:0]||'').replace(/\{me\}/g,label(p.char));
  const c=who==='me'?{n:theName(p.char),art:p.char}:STORY_CAST[who]||null;DLG.who=who;DLG.art=c&&c.art&&SPECS[c.art]?c.art:null;DLG.ask=ask;DLG.n=reduced?DLG.text.length:0;
  const d=$('dlg');d.classList.toggle('narr',!c);d.classList.toggle('mine',who==='me');d.classList.toggle('noart',!DLG.art);$('dlgn').textContent=c?c.n:'';$('dlgo').innerHTML='';$('dlgt').textContent=DLG.text.slice(0,DLG.n);dlgOpts();
}
function dlgOpts(){
  const o=$('dlgo'),typing=DLG.n<DLG.text.length;$('dlgh').textContent=typing?'':DLG.ask?'Choose one':touchMode?'Tap to continue':'Space or click to continue';
  if(typing||!DLG.ask||o.childElementCount)return;
  DLG.ask.opts.forEach(([kind,[lab,reply]])=>{const b=document.createElement('button');b.type='button';b.className='dlg-opt';b.textContent=lab;b.onclick=ev=>{ev.stopPropagation();storyGift(kind);DLG.q.splice(DLG.i+1,0,DLG.who+': '+reply);DLG.ask=null;dlgNext(true)};o.appendChild(b)});
  const first=o.querySelector('button');if(first&&!touchMode)try{first.focus({preventScroll:true})}catch(e){}
}
function dlgNext(force){
  if(!DLG.on)return;if(DLG.n<DLG.text.length&&!force){DLG.n=DLG.text.length;$('dlgt').textContent=DLG.text;dlgOpts();return}
  if(DLG.ask&&!force)return;
  DLG.i++;if(DLG.i<DLG.q.length){dlgLine();return}
  DLG.on=false;$('dlg').hidden=true;const done=DLG.done;DLG.done=null;setMode('play');if(done)done();
}
/* Skip runs to the next choice, or to the end */
function dlgSkip(){if(!DLG.on)return;while(DLG.on&&!(typeof DLG.q[DLG.i]==='object')){if(DLG.i>=DLG.q.length-1){DLG.n=DLG.text.length;dlgNext(true);return}DLG.i++}if(DLG.on){dlgLine();DLG.n=DLG.text.length;$('dlgt').textContent=DLG.text;dlgOpts()}}
let dlgAcc=0;
function dlgTick(dt,now){
  if(!DLG.on)return;
  if(DLG.n<DLG.text.length){dlgAcc+=dt*70;const add=dlgAcc|0;if(add){dlgAcc-=add;DLG.n=Math.min(DLG.text.length,DLG.n+add);$('dlgt').textContent=DLG.text.slice(0,DLG.n);if(DLG.n>=DLG.text.length)dlgOpts()}}
  const cv=$('dlgp'),g=cv.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,96,96);if(DLG.art){g.imageSmoothingEnabled=false;g.fillStyle='rgba(10,14,28,.5)';g.beginPath();g.ellipse(48,90,20,5,0,0,TAU);g.fill();blit(g,DLG.art,48,88,2,'idle',Math.floor(now/420)%2,false,0)}
}
/* The floating Talk / Open button, for mouse and touch alike. Keyboard: F. */
function storyButton(){const b=$('story-act'),n=storyNear();if(!n){if(!b.hidden)b.hidden=true;return}const t=(touchMode?'':'F · ')+n.label;if(b.textContent!==t)b.textContent=t;b.hidden=false}

/* ---------- Chapter end ---------- */
function storyOutro(){
  const S=G.story,ch=STORY[S.ci],last=S.ci>=STORY.length-1;S.over=true;S.freed=true;S.rt=null;G.gate.open=false;storyHud();
  S.top=Math.min(STORY.length-1,Math.max(S.top,S.ci+1));
  {const all=storyRead();all[S.fac]={char:G.players[0].char,ci:last?S.ci:S.ci+1,q:last?ch.beats.length:0,top:S.top,opened:last?S.opened:[],time:Math.round(S.time),p:storyPack(G.players[0])};try{localStorage.setItem(STORY_KEY,JSON.stringify(all))}catch(e){}}
  storyTalk(ch.outro[S.fac],()=>setMode('clear'));
}
const storyClock=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
function storyCard(c){
  const S=G.story,ch=STORY[S.ci],last=S.ci>=STORY.length-1,hero=S.fac==='hero',p=G.players[0];
  gameCard(c,'win',{kicker:'Chapter '+(S.ci+1)+' complete',title:esc(ch.title[S.fac]),line:esc(ch.boss)+' is defeated. '+(hero?'The Hour is free.':'The Hour is yours.')+(last?' The story continues in a later update.':' Next: '+esc(STORY[S.ci+1].n)+'.'),
    chips:[['Level',p.lvl],['Play time',storyClock(S.time)],['Hours',(S.ci+1)+'/10']],
    buttons:(last?'':'<button class="go" id="go" type="button">Chapter '+(S.ci+2)+'</button>')+'<button class="'+(last?'go':'ghost')+'" id="stay" type="button">Keep exploring</button><button class="ghost" id="tomenu" type="button">Return to main menu</button>'});
  const g=$('go');if(g)g.onclick=()=>storyBegin(p.char,S.ci+1,{p:storyPack(p),top:S.top,time:S.time},0);
  $('stay').onclick=()=>setMode('play');$('tomenu').onclick=returnToMenu;
}

/* ---------- World drawing for the live beat ---------- */
function drawStoryWorld(inView){
  const S=G.story,rt=S&&S.rt,t=G.t;if(!rt)return;
  const ring=(z,r,col,q)=>{ctx.save();ctx.fillStyle='rgba('+col+',.1)';ctx.strokeStyle='rgba('+col+',.75)';ctx.lineWidth=3;ctx.setLineDash([10,8]);ctx.lineDashOffset=reduced?0:-t*18;ctx.beginPath();ctx.ellipse(z.x,z.y,r,r*.62,0,0,TAU);ctx.fill();ctx.stroke();ctx.setLineDash([]);
    if(q>0){ctx.strokeStyle='rgba('+col+',1)';ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(z.x,z.y,r,r*.62,0,-Math.PI/2,-Math.PI/2+TAU*clamp(q,0,1));ctx.stroke()}ctx.restore()};
  if(rt.k==='defend'&&inView(rt.at))ring(rt.at,rt.r,'143,230,184',rt.t/rt.need);
  else if(rt.k==='go'&&inView(rt.at))ring(rt.at,70,'143,230,184',0);
  else if(rt.k==='hold'){for(const z of rt.zones)if(!z.done&&inView(z))ring(z,rt.r,'255,233,160',z.t/rt.hold)}
  else if(rt.k==='elite'&&rt.phase===0&&inView(rt.at))ring(rt.at,90,'255,120,110',0);
  else if(rt.k==='collect'){for(const it of rt.items){if(it.done||!inView(it))continue;const bob=reduced?0:Math.sin(t*3+it.x)*3,y=it.y-10+bob;
    ctx.fillStyle='rgba(143,230,184,'+(.2+.12*Math.sin(t*4+it.x)).toFixed(2)+')';ctx.beginPath();ctx.arc(it.x,y,20,0,TAU);ctx.fill();shadow(it.x,it.y,9);
    const R=(c,x,yy,w,h)=>{ctx.fillStyle=c;ctx.fillRect(x,yy,w,h)};
    if(/keg|oil/i.test(rt.item)){R('#7a5230',it.x-8,y-12,16,18);R('#3a3a3e',it.x-9,y-8,18,2);R('#3a3a3e',it.x-9,y+1,18,2);R(/oil/i.test(rt.item)?'#f0c23c':'#e8463f',it.x-3,y-5,6,5)}
    else if(/axe/i.test(rt.item)){ctx.save();ctx.translate(it.x,y);ctx.rotate(.6);R('#7a5634',-2,-14,4,26);R('#c8ccd0',2,-14,10,9);R('#8a9098',2,-14,10,3);ctx.restore()}
    else if(/stone/i.test(rt.item)){R('#8a8678',it.x-7,y-14,14,20);R('#6c685c',it.x+2,y-14,5,20);R('#8fe0ff',it.x-3,y-9,6,6)}
    else{R('#3f8a3a',it.x-1,y-4,2,12);R('#c8f0ff',it.x-6,y-12,5,5);R('#e8f8ff',it.x+1,y-14,6,6);R('#c8f0ff',it.x-3,y-6,5,4)}}}
}
/* Name plate and a marker over the people you can talk to */
function drawStoryNpcTag(c){
  const S=G.story,want=S&&S.rt&&S.rt.k==='talk'&&S.rt.npc===c,y=c.y-70;ctx.textAlign='center';ctx.font='700 11px Barlow,sans-serif';ctx.lineWidth=3;ctx.strokeStyle='rgba(5,10,20,.9)';ctx.strokeText(c.name,c.x,y);ctx.fillStyle=want?'#ffe9a0':'#d8e4f4';ctx.fillText(c.name,c.x,y);
  if(want){const b=reduced?0:Math.sin(G.t*4)*3;ctx.font='700 22px "Pixelify Sans",monospace';ctx.lineWidth=4;ctx.strokeText('!',c.x,y-16+b);ctx.fillStyle='#ffd23c';ctx.fillText('!',c.x,y-16+b)}
}

function drawStoryEliteTag(e){const y=e.y-78;ctx.textAlign='center';ctx.font='700 13px "Pixelify Sans",monospace';ctx.lineWidth=4;ctx.strokeStyle='rgba(5,10,20,.92)';ctx.strokeText(e.title,e.x,y);ctx.fillStyle='#ff9a8a';ctx.fillText(e.title,e.x,y)}

/* ---------- Game modes screen ---------- */
let storyTab='hero',storyPickChar={hero:STORY_PICK.hero[0],villain:STORY_PICK.villain[0]},storyWipe=false;
const modesOn=()=>!$('modes').hidden;
/* The modes screen art: the title poster, or the poster of the mode under the pointer or open. Two layers crossfade. */
let modeArt='poster',modeOpen=null;
function setModeArt(k){k=k||'poster';if(k===modeArt)return;modeArt=k;const a=$('mdart'),b=$('mdart2'),url='url('+TITLE_URLS[k]+')';if(b.classList.contains('on')){a.style.backgroundImage=url;b.classList.remove('on')}else{b.style.backgroundImage=url;b.classList.add('on')}}
/* The trailer plays once, holds its last frame, and plays again after WZ_REPLAY. Opening Warzone again restarts it and the wait. */
const WZ_REPLAY=10*60*1000;let wzTimer=0;
function stopWarzone(){clearTimeout(wzTimer);wzTimer=0;const v=$('mdvid');if(!v)return;v.pause();v.hidden=true;$('modes').classList.remove('wz');$('mdpanel').classList.remove('wz')}
function playWarzone(v){v.currentTime=0;const pl=v.play();if(pl&&pl.catch)pl.catch(()=>{v.muted=true;v.play().catch(()=>{})})}
/* The trailer loads and plays when the pointer is over Warzone (or it has focus); clicking only opens the coming-soon note. */
function startWarzone(){clearTimeout(wzTimer);const v=$('mdvid');if(!v.src)v.src=TITLE_URLS.warzone;v.hidden=false;v.muted=muted;$('modes').classList.add('wz');
  v.onended=()=>{clearTimeout(wzTimer);wzTimer=setTimeout(()=>{if(!v.hidden)playWarzone(v)},WZ_REPLAY)};playWarzone(v)}
function renderWarzone(){const v=$('mdvid');if(v.hidden)startWarzone();modeOpen='war';
  modePanel('<div class="mp-head"><button class="ghost mp-back" type="button">‹ Back</button><h2>Warzone</h2></div><p class="mp-kick">Coming soon</p><p class="mp-lede">Heroes and villains clash in open battle. Warzone is not playable yet.</p><button class="ghost" id="wzsound" type="button">'+(v.muted?'Sound on':'Sound off')+'</button>');
  $('modes').classList.add('wz');$('mdpanel').classList.add('wz');$('wzsound').onclick=()=>{v.muted=!v.muted;$('wzsound').textContent=v.muted?'Sound on':'Sound off'}}
function showModes(){const m=$('modes');m.hidden=false;m.classList.remove('open');stopWarzone();modeOpen=null;$('mdpanel').hidden=true;$('mdpanel').innerHTML='';$('mdart').style.backgroundImage='url('+TITLE_URLS[modeArt]+')';setModeArt('poster');$('mdlogo').src=TITLE_URLS.words;$('mdver').textContent='v'+GAME_VERSION;const b=m.querySelector('[data-m=story]');if(b&&!touchMode)try{b.focus({preventScroll:true})}catch(e){}}
function hideModes(){stopWarzone();$('modes').hidden=true}
function modePanel(html){const m=$('modes'),p=$('mdpanel');m.classList.add('open');p.hidden=false;p.innerHTML=html;p.scrollTop=0;const bk=p.querySelector('.mp-back');if(bk)bk.onclick=()=>{m.classList.remove('open');p.hidden=true;p.innerHTML='';stopWarzone();modeOpen=null;setModeArt('poster')}}
function renderStoryPanel(){
  const all=storyRead(),sv=all[storyTab]&&STORY_PICK[storyTab].includes(all[storyTab].char)?all[storyTab]:null,pickC=storyPickChar[storyTab],hero=storyTab==='hero',fin=sv&&sv.ci>=STORY.length-1&&sv.q>=STORY[STORY.length-1].beats.length;
  modePanel('<div class="mp-head"><button class="ghost mp-back" type="button">‹ Back</button><h2>Story</h2></div>'+
   '<p class="mp-kick">'+esc(STORY_NAME)+'</p><p class="mp-lede">The Daywheel of Dayrim is broken and its ten Hours of daylight have been swallowed by beasts. '+(hero?'As a hero you win them back for the sky.':'As a villain you take them for your own crown.')+' Explore each land, talk to its people, grow your character, and bring down the beast that holds its Hour.</p>'+
   '<div class="tabs"><button class="tab" type="button" data-st="hero" aria-pressed="'+hero+'">Heroes</button><button class="tab" type="button" data-st="villain" aria-pressed="'+!hero+'">Villains</button></div>'+
   (sv?'<div class="mp-save"><i style="'+cardStyle(sv.char)+'"></i><div><b>'+esc(theName(sv.char))+' · level '+sv.p.lvl+'</b><span>'+(fin?'All three chapters complete':'Chapter '+(sv.ci+1)+' · '+esc(STORY[sv.ci].n))+' · '+storyClock(sv.time||0)+' played</span></div><button class="go" id="stcont" type="button">'+(fin?'Explore':'Continue')+'</button></div>':'')+
   '<h3 class="mp-h">'+(sv?'Chapters':'Choose your '+(hero?'hero':'villain'))+'</h3>'+
   (sv?'':'<div class="mp-chars">'+STORY_PICK[storyTab].map(n=>'<button class="mp-char" type="button" data-c="'+esc(n)+'" aria-pressed="'+(n===pickC)+'"><i style="'+cardStyle(n)+'"></i><b>'+esc(label(n))+'</b><small>'+esc(archOf(n).n)+'</small></button>').join('')+'</div><p class="mp-note"><b>'+esc(theName(pickC))+'.</b> '+esc(archOf(pickC).d)+(ABILITIES[pickC]?' Ability: '+esc(ABILITIES[pickC].n)+'.':'')+'</p>')+
   '<div class="mp-chs">'+STORY.map((ch,i)=>{const open=sv?i<=(sv.top||0):i===0;return '<button class="mp-ch" type="button" data-ch="'+i+'"'+(open?'':' disabled')+'><span class="mp-num">'+(i+1)+'</span><span class="mp-cht"><b>'+esc(ch.n)+'</b><em>'+esc(ch.title[storyTab])+'</em><small>Boss: '+esc(ch.boss)+' · recommended level '+recLevel(i+1)+'</small></span><span class="mp-state">'+(!open?'Locked':sv&&i<sv.ci||fin?'Replay':sv&&i===sv.ci?'Current':'Start')+'</span></button>'}).join('')+'</div>'+
   (sv?'<button class="ghost mp-new" id="stnew" type="button">'+(storyWipe?'Confirm: erase this story and start again':'Start a new '+(hero?'hero':'villain')+' story')+'</button>':'<button class="go mp-begin" id="stgo" type="button">Begin the story</button>')+
   '<p class="mp-note">A chapter takes about 10 to 30 minutes. Progress saves after every objective. Story mode is single player.</p>');
  const p=$('mdpanel'),start=(char,ci,s,q)=>{audioOn();announce('start',2);storyWipe=false;storyBegin(char,ci,s,q)};
  p.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{storyTab=b.dataset.st;storyWipe=false;playSound(storyTab==='hero'?'heroBrowse':'villainBrowse');renderStoryPanel()});
  p.querySelectorAll('.mp-char').forEach(b=>b.onclick=()=>{storyPickChar[storyTab]=b.dataset.c;playSound(hero?'heroBrowse':'villainBrowse');renderStoryPanel()});
  p.querySelectorAll('.mp-ch').forEach(b=>b.onclick=()=>{const i=+b.dataset.ch;if(!sv)start(pickC,0,null,0);else if(i===sv.ci&&!fin)start(sv.char,sv.ci,sv,sv.q);else start(sv.char,i,sv,0)});
  const c=$('stcont');if(c)c.onclick=()=>start(sv.char,sv.ci,sv,sv.q);
  const g=$('stgo');if(g)g.onclick=()=>start(pickC,0,null,0);
  const nw=$('stnew');if(nw)nw.onclick=()=>{if(!storyWipe){storyWipe=true;renderStoryPanel();return}storyWipe=false;const a=storyRead();delete a[storyTab];try{localStorage.setItem(STORY_KEY,JSON.stringify(a))}catch(e){}renderStoryPanel()};
}
/* The changelog is the project's CHANGELOG.md, turned into simple headings and lists */
function changelogHtml(md){
  const inl=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1');let out='',ul=false;const close=()=>{if(ul){out+='</ul>';ul=false}};
  for(const raw of md.split('\n')){const l=raw.trim();if(!l||l.startsWith('# ')||l.startsWith('Versions follow'))continue;
    if(l.startsWith('## ')){close();out+='<h3>'+inl(l.slice(3).replace(/[\[\]]/g,''))+'</h3>'}
    else if(l.startsWith('### ')){close();out+='<h4>'+inl(l.slice(4))+'</h4>'}
    else if(/^\*\*[^*]+\*\*$/.test(l)){close();out+='<h5>'+esc(l.slice(2,-2))+'</h5>'}
    else if(l.startsWith('- ')){if(!ul){out+='<ul>';ul=true}out+='<li>'+inl(l.slice(2))+'</li>'}
    else{close();out+='<p>'+inl(l)+'</p>'}}
  close();return out;
}
function renderChangelog(){stopWarzone();modeOpen=null;modePanel('<div class="mp-head"><button class="ghost mp-back" type="button">‹ Back</button><h2>Changelog</h2></div><p class="mp-kick">Dayrim v'+esc(GAME_VERSION)+'</p><div class="mp-log">'+changelogHtml(CHANGELOG_MD)+'</div>')}
function initModes(){
  const m=$('modes');
  m.querySelector('[data-m=story]').onclick=()=>{audioOn();stopWarzone();modeOpen='story';setModeArt('story');renderStoryPanel()};
  m.querySelector('[data-m=quick]').onclick=()=>{audioOn();hideModes();if(G.mode!=='title')setMode('title')};
  m.querySelector('[data-m=war]').onclick=()=>{audioOn();renderWarzone()};
  {const w=m.querySelector('[data-m=war]'),on=()=>{if(modeOpen!=='war'){audioOn();startWarzone()}},off=()=>{if(modeOpen!=='war')stopWarzone()};w.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')on()});w.addEventListener('focus',on);w.addEventListener('pointerleave',off);w.addEventListener('blur',off)}
  /* Pointing at a mode shows its poster; leaving shows the open mode's poster, or the title poster */
  const art={story:'story',quick:'quick'};m.querySelectorAll('.md-nav button').forEach(b=>{const k=art[b.dataset.m];if(!k)return;const on=()=>{if(modeOpen!=='war')setModeArt(k)},off=()=>{if(modeOpen!=='war')setModeArt(modeOpen==='story'?'story':'poster')};b.addEventListener('pointerenter',on);b.addEventListener('focus',on);b.addEventListener('pointerleave',off);b.addEventListener('blur',off)});
  $('mdlog').onclick=renderChangelog;
  $('dlg').addEventListener('click',()=>dlgNext());$('dlgskip').addEventListener('click',ev=>{ev.stopPropagation();dlgSkip()});
  $('story-act').addEventListener('click',ev=>{ev.preventDefault();storyAct()});
}
