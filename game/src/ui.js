/* ---------- Sheet, menus, input and main loop ---------- */
function renderStats(){const p=G.p,s=p.s;
  $('whoname').textContent='The '+label(p.char);$('who').textContent='Level '+p.lvl+' · '+Math.floor(p.gold)+' gold'+(p.sp?' · '+p.sp+' skill pts':'');
  const rows=[['Hit damage',Math.round(weaponDamage(p.weapon))],['Life',Math.ceil(p.hp)+' / '+Math.round(s.maxHp)],['Mana',Math.floor(p.mana)+' / '+Math.round(s.maxMana)],['Armor',Math.round(s.armor)],['Critical',Math.round(s.crit*100)+'%'],['Speed',Math.round(s.speed)],['Items','P'+p.potions+' F'+p.fast+' M'+p.magic],['Rage',Math.floor(p.rage)+'%'],['Best combo',p.bestCombo]];
  $('stats').innerHTML=rows.map(r=>'<dt>'+r[0]+'</dt><dd>'+r[1]+'</dd>').join('')}
const statBars=st=>Object.keys(STAT_NAMES).map(k=>'<div class="sb"><span>'+STAT_NAMES[k]+'</span><i>'+'<b></b>'.repeat(st[k])+'<u></u>'.repeat(5-st[k])+'</i></div>').join('');
function renderPanel(){const p=G.p;renderStats();$('whoart').style.cssText=artStyle(p.char,52,62);
  $('gear').innerHTML=SLOTS.map(k=>{const it=p.gear[k],label=k[0].toUpperCase()+k.slice(1);return it?'<li><span class="iname r'+it.rar+'">'+esc(it.name)+'</span><span></span><span class="iinfo">'+itemInfo(it)+'</span></li>':'<li><span class="empty">'+label+': empty</span></li>'}).join('');
  {const k=!!kitOf(p);$('rack').hidden=k;$('rackh').hidden=k}
  $('rack').innerHTML=p.weapons.map(id=>{const W=WEAPONS[id],on=id===p.weapon,dm=Math.round(weaponDamage(id));return '<li class="'+(on?'wrow on':'wrow')+'"><span class="iname">'+esc(W.n)+'</span><span class="acts">'+(on?'<em>In hand</em>':'<button type="button" data-w="'+id+'">Use</button>')+'</span><span class="iinfo">'+METHODS[W.m].n+' · power '+W.p+' · '+dm+' per hit</span></li>'}).join('');
  $('bag').innerHTML=p.bag.length?p.bag.map((it,i)=>{const cur=p.gear[it.slot],delta=cur?it.score-cur.score:it.score,tag=delta>=0?'<span class="up">▲'+Math.round(delta)+'</span>':'<span class="down">▼'+Math.round(-delta)+'</span>';return '<li><span class="iname r'+it.rar+'">'+esc(it.name)+' '+tag+'</span><span class="acts"><button type="button" data-eq="'+i+'" aria-label="Equip '+esc(it.name)+'">Equip</button><button type="button" data-sell="'+i+'" aria-label="Sell '+esc(it.name)+'">Sell</button></span><span class="iinfo">'+itemInfo(it)+'</span></li>'}).join(''):'<li><span class="empty">Nothing yet. Defeated '+(G.p&&factionOf(p.char)==='hero'?'villains':'heroes')+' drop gear.</span></li>';
  $('log').innerHTML=G.log.length?G.log.map(l=>'<li>'+l+'</li>').join(''):'<li>Your story has not started.</li>'}
$('bag').addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;const p=G.p;
  if(b.dataset.eq!==undefined){const i=+b.dataset.eq,it=p.bag[i];if(!it)return;const old=p.gear[it.slot];p.gear[it.slot]=it;p.bag.splice(i,1);if(old)p.bag.unshift(old);recalc();addLog(esc(it.name)+' worn.');writeSave()}
  if(b.dataset.sell!==undefined){const i=+b.dataset.sell,it=p.bag[i];if(!it)return;const g=salvage(it);p.gold+=g;p.bag.splice(i,1);addLog('Sold '+esc(it.name)+' for '+g+' gold.');writeSave()}});
$('rack').addEventListener('click',ev=>{const b=ev.target.closest('button');if(b&&b.dataset.w){if(netOn())netAct('weapon',b.dataset.w);else equipWeapon(b.dataset.w)}});
$('wearbest').addEventListener('click',()=>wearBest());
function setMode(m){
  G.mode=m;mouse.left=mouse.right=false;touchHold.slash=false;touchHold.guard=false;keys.clear();const ov=$('ov'),c=$('card');
  $('touch').hidden=!(touchMode&&m==='play');
  if(m==='play'){ov.hidden=true;return}
  ov.hidden=false;ov.classList.toggle('pick',m==='title'||m==='menu');c.classList.toggle('sel',m==='title'||m==='menu');
  if(m==='title')renderSelect();
  else if(m==='menu')renderMenu();
  else if(netOn()&&netOverlay(m,c))return;
  else if(m==='pause'){c.innerHTML='<h2>Paused</h2><p>Stage '+G.stage+'. Your progress saves automatically.</p><button class="go" id="go" type="button">Resume</button>';$('go').onclick=()=>setMode('play')}
  else if(m==='dead'){c.innerHTML='<h2>The '+esc(label(G.p.char))+' is down</h2><p>You lost 20% of your gold and wake at the safehouse. Your level, gear and stage progress are safe. Bosses get much harder each stage, so train, upgrade skills and stock up on potions.</p><div class="btnrow"><button class="go" id="go" type="button">Wake at safehouse</button></div>';$('go').onclick=()=>{const p=G.p;enterStage(G.stage,true);p.hp=p.s.maxHp;p.mana=p.s.maxMana;p.fastT=p.magicT=0;setMode('play')}}
  else if(m==='clear'){const n=G.stage,last=n>=10,hero=factionOf(G.p.char)==='hero';
    c.innerHTML=last?'<h2>'+(hero?'Dayrim is safe':'Dayrim is yours')+'</h2><p>The crowned horror has fallen and all 10 stages are clear. You finished as a level '+G.p.lvl+' '+esc(label(G.p.char))+' with '+G.p.kills+' defeated.</p><div class="btnrow"><button class="go" id="go" type="button">Keep playing</button></div>':'<h2>Stage '+n+' cleared</h2><p>You defeated '+esc(STAGES[n-1].label||STAGES[n-1].boss)+' and earned 2 skill points. Next is stage '+(n+1)+': '+esc(STAGES[n].n)+'. The recommended level is '+recLevel(n+1)+'. You are level '+G.p.lvl+'.</p><div class="btnrow"><button class="go" id="go" type="button">Go to stage '+(n+1)+'</button><button class="ghost" id="stay" type="button">Keep training here</button></div>';
    $('go').onclick=()=>{if(!last)enterStage(n+1);setMode('play')};const st=$('stay');if(st)st.onclick=()=>{G.gate.open=true;setMode('play')}}
}
/* Scales with its column through CSS alone, so it never depends on measuring the page */
const cardStyle=n=>{const a=CAST[n];return 'width:100%;aspect-ratio:'+a.w+'/'+a.h+';background-size:'+(AW/a.w*100)+'% '+(AH/a.h*100)+'%;background-position:'+(a.x/(AW-a.w)*100)+'% '+(a.y/(AH-a.h)*100)+'%'};
function renderSelect(){
  const c=$('card'),names=Object.keys(ROSTER[selTab]),a=archOf(chosen),sv=readSave(),foe=factionOf(chosen)==='hero'?'villains':'heroes';
  const controls=touchMode?'Drag on the game to move. Aim is automatic.':KIT_OF[chosen]?'WASD move · Left click small attack · Q moderate attack · X special (60s) · V ultimate · Hold right click shield · E heal · Space dodge · 1 potion · 2 fast pill · 3 magic pill · T skills':'WASD move · Mouse aim · Left click attack · Hold right click shield · Q spell · E heal · Space dodge · V ultimate · Tab change weapon · 1 potion · 2 fast pill · 3 magic pill · T skills';
  const w0=weaponOf(chosen);
  c.innerHTML='<div class="sel-top"><h2>Choose your character</h2><div class="tabs"><button class="tab" type="button" data-tab="hero" aria-pressed="'+(selTab==='hero')+'">Heroes</button><button class="tab" type="button" data-tab="villain" aria-pressed="'+(selTab==='villain')+'">Villains</button></div></div>'+
  (sv?'<div class="cont"><span>Saved: The '+esc(label(sv.char))+', level '+sv.lvl+', stage '+sv.stage+'</span><button class="go" id="cont" type="button">Continue</button></div>':'')+
  '<div class="sel-body"><div class="roster">'+names.map((n,ri)=>'<button class="rc h" type="button" data-c="'+esc(n)+'" aria-pressed="'+(n===chosen)+'" aria-label="The '+esc(label(n))+', '+ARCH[ROSTER[selTab][n]].n+'"><i style="'+cardStyle(n)+'"></i><b>'+String(ri+1).padStart(2,'0')+'</b></button>').join('')+'</div>'+
  '<div class="detail"><div class="pv"><canvas id="pv" width="96" height="96" aria-label="Animated pixel preview"></canvas><span id="pvl" class="ctl"></span></div><h3>The '+esc(label(chosen))+'</h3><div class="role">'+(factionOf(chosen)==='hero'?'Hero':'Villain')+' · '+a.n+'</div><p>'+a.d+'</p><button class="go" id="go" type="button">'+(sv?(confirmNew?'Confirm: erase saved run':'New game'):'Start game')+'</button>'+(netAvailable()?'<button class="ghost" id="online" type="button" style="margin-left:8px">Play online</button>':'')+'<div class="sbs">'+statBars(STATS[chosen])+'</div><p class="ctl">Starts with: '+WEAPONS[w0].n+' ('+METHODS[WEAPONS[w0].m].n.toLowerCase()+'). Enemies: the '+foe+'.</p><p class="ctl">'+controls+'</p></div></div>';
  c.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{selTab=b.dataset.tab;renderSelect()});
  c.querySelectorAll('.rc').forEach(b=>{b.onclick=()=>{chosen=b.dataset.c;confirmNew=false;try{localStorage.setItem('dayrim-char',chosen)}catch(e){}G.p.char=chosen;recalc();renderSelect()}});
  $('go').onclick=()=>{if(sv&&!confirmNew){confirmNew=true;renderSelect();return}confirmNew=false;audioOn();clearSave();newRun(chosen);addLog('You hit the streets as the '+esc(label(chosen))+'.');setMode('play')};
  const onl=$('online');if(onl)onl.onclick=()=>{audioOn();renderLobby()};
  const ct=$('cont');if(ct)ct.onclick=()=>{audioOn();loadRun(sv);addLog('Welcome back, '+esc(label(sv.char))+'.');setMode('play')};
}
function renderMenu(){
  const c=$('card'),p=G.p,tabs=[['skills','Skills'],['gym','Gym'],['shop','Shop'],['travel','Travel']],safe=G.p.nearSafe;
  let body='';
  if(menuTab==='skills'){body='<p class="mhead">Skill points: <b>'+p.sp+'</b>. You earn 1 per level and 2 per boss.</p>'+SKILLS.map(s=>{const r=p.skills[s.id]||0,full=r>=s.max;return'<div class="mrow"><div><strong>'+s.n+'</strong><span>'+s.d+'</span></div><em>'+r+'/'+s.max+'</em><button type="button" class="buy" data-skill="'+s.id+'"'+(p.sp<=0||full?' disabled':'')+'>'+(full?'Max':'Train')+'</button></div>'}).join('')}
  else if(!safe)body='<p class="mhead">Go to the green safehouse marker to use the '+(menuTab==='gym'?'gym':menuTab==='shop'?'shop':'travel board')+'. Follow its dot on the mini map.</p>';
  else if(menuTab==='gym'){body='<p class="mhead">Gold: <b>'+Math.floor(p.gold)+'</b>. Training is permanent and gets more expensive.</p>'+GYM.map(g=>{const r=p.train[g.id]||0,cost=gymCost(r);return'<div class="mrow"><div><strong>'+g.n+'</strong><span>'+g.d+'</span></div><em>'+r+' done</em><button type="button" class="buy" data-gym="'+g.id+'"'+(p.gold<cost?' disabled':'')+'>'+cost+' gold</button></div>'}).join('')}
  else if(menuTab==='shop'){body='<p class="mhead">Gold: <b>'+Math.floor(p.gold)+'</b>. You can carry up to 9 of each.</p>'+SHOP.map(s=>{const cost=shopCost(s),have=p[s.id];return'<div class="mrow"><div><strong>'+s.n+'</strong><span>'+s.d+'</span></div><em>'+have+' held</em><button type="button" class="buy" data-shop="'+s.id+'"'+(p.gold<cost||have>=9?' disabled':'')+'>'+cost+' gold</button></div>'}).join('')}
  else{body='<p class="mhead">'+(netOn()&&!netIsHost()?'Only the room host can change stage.':'Replay any unlocked stage to train.')+'</p>'+STAGES.map((s,i)=>{const n=i+1,locked=n>p.maxStage;return'<div class="mrow"><div><strong>Stage '+n+': '+s.n+'</strong><span>Boss: '+(locked?'unknown':(s.label||s.boss))+'. Recommended level '+recLevel(n)+'.</span></div><em>'+(n<=p.beaten?'Cleared':locked?'Locked':'Open')+'</em><button type="button" class="buy" data-go="'+n+'"'+(locked||n===G.stage||(netOn()&&!netIsHost())?' disabled':'')+'>'+(n===G.stage?'Here':'Go')+'</button></div>'}).join('')}
  c.innerHTML='<div class="sel-top"><h2>Stage '+G.stage+' · Level '+p.lvl+'</h2><div class="tabs">'+tabs.map(t=>'<button class="tab" type="button" data-m="'+t[0]+'" aria-pressed="'+(menuTab===t[0])+'">'+t[1]+'</button>').join('')+'</div></div><div class="mlist">'+body+'</div><div class="btnrow"><button class="go" id="go" type="button">Back to the city</button></div>';
  c.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{menuTab=b.dataset.m;renderMenu()});
  c.querySelectorAll('[data-skill]').forEach(b=>b.onclick=()=>{if(netOn()){netAct('skill',b.dataset.skill);return}if(p.sp<=0)return;p.sp--;p.skills[b.dataset.skill]=(p.skills[b.dataset.skill]||0)+1;recalc();writeSave();renderMenu()});
  c.querySelectorAll('[data-gym]').forEach(b=>b.onclick=()=>{if(netOn()){netAct('gym',b.dataset.gym);return}const id=b.dataset.gym,cost=gymCost(p.train[id]||0);if(p.gold<cost)return;p.gold-=cost;p.train[id]=(p.train[id]||0)+1;recalc();writeSave();renderMenu()});
  c.querySelectorAll('[data-shop]').forEach(b=>b.onclick=()=>{if(netOn()){netAct('shop',b.dataset.shop);return}const s=SHOP.find(x=>x.id===b.dataset.shop),cost=shopCost(s);if(p.gold<cost||p[s.id]>=9)return;p.gold-=cost;p[s.id]++;dirty();writeSave();renderMenu()});
  c.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{if(netOn()){netAct('travel',+b.dataset.go);setMode('play');return}enterStage(+b.dataset.go);p.hp=p.s.maxHp;p.mana=p.s.maxMana;setMode('play')});
  $('go').onclick=()=>{writeSave();setMode('play')};
}

/* Input. Online, actions go to the server. Alone, they run here. */
const LOCAL_ACT={dash:()=>doDash(),ult:()=>doUlt(),special:()=>doMove('special'),spell:()=>doSpell(),heal:()=>doHeal(),potion:()=>usePotion(),fast:()=>useFast(),magic:()=>useMagic(),cycle:d=>cycleWeapon(d)};
function doAct(n,v){if(netOn())netAct(n,v);else LOCAL_ACT[n](v)}
function screenToWorld(ev){const r=canvas.getBoundingClientRect();return{x:G.cam.x+(ev.clientX-r.left-W/2)/zoom,y:G.cam.y+(ev.clientY-r.top-H/2)/zoom}}
function trackMouse(ev){const w=screenToWorld(ev);mouse.x=w.x;mouse.y=w.y;mouse.sx=ev.clientX;mouse.sy=ev.clientY}
function setTouch(on){if(touchMode===on)return;touchMode=on;$('touch').hidden=!(on&&G.mode==='play')}
function mouseButtons(ev){if(G.mode!=='play')return;mouse.left=!!(ev.buttons&1);mouse.right=!!(ev.buttons&2)}
canvas.addEventListener('pointerdown',ev=>{if(ev.pointerType==='touch'){setTouch(true);if(G.mode!=='play')return;const r=canvas.getBoundingClientRect();if(!joy.on){joy.on=true;joy.id=ev.pointerId;joy.ox=ev.clientX-r.left;joy.oy=ev.clientY-r.top;joy.dx=0;joy.dy=0;canvas.setPointerCapture(ev.pointerId)}return}
  setTouch(false);trackMouse(ev);mouseButtons(ev);if(G.mode==='play')try{canvas.setPointerCapture(ev.pointerId)}catch(e){}});
canvas.addEventListener('pointermove',ev=>{if(ev.pointerType==='touch'){if(joy.on&&ev.pointerId===joy.id){const r=canvas.getBoundingClientRect(),dx=ev.clientX-r.left-joy.ox,dy=ev.clientY-r.top-joy.oy,m=Math.max(1,Math.hypot(dx,dy)),k=Math.min(1,m/46);joy.dx=dx/m*k;joy.dy=dy/m*k}return}trackMouse(ev);mouseButtons(ev)});
const up=ev=>{if(ev.pointerType==='touch'){if(ev.pointerId===joy.id){joy.on=false;joy.id=null;joy.dx=0;joy.dy=0}return}mouseButtons(ev)};
canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('wheel',e=>{if(G.mode!=='play')return;e.preventDefault();doAct('cycle',e.deltaY>0?1:-1)},{passive:false});
const GAME_CODES=new Set(['Tab','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
addEventListener('keydown',ev=>{if(ev.metaKey||ev.ctrlKey||ev.altKey)return;
  if(ev.code==='Escape'||ev.code==='KeyP'){if(G.mode==='play'){setMode('pause');return}if(G.mode==='pause'||G.mode==='menu'){writeSave();setMode('play');return}}
  if(G.mode==='menu'&&(ev.code==='KeyT'||ev.code==='KeyR')){writeSave();setMode('play');return}
  if(G.mode!=='play')return;if(GAME_CODES.has(ev.code))ev.preventDefault();if(ev.repeat)return;keys.add(ev.code);
  if(ev.code==='KeyM')toggleSound();
  if(ev.code==='Space'||ev.code==='ShiftLeft')doAct('dash');
  if(ev.code==='KeyV')doAct('ult');if(ev.code==='KeyX')doAct('special');if(ev.code==='KeyQ')doAct('spell');if(ev.code==='KeyE')doAct('heal');if(ev.code==='Tab'){ev.preventDefault();doAct('cycle',ev.shiftKey?-1:1)}
  if(ev.code==='Digit1'||ev.code==='KeyF')doAct('potion');if(ev.code==='Digit2')doAct('fast');if(ev.code==='Digit3')doAct('magic');
  if(ev.code==='KeyT'){menuTab='skills';setMode('menu')}
  if(ev.code==='KeyR'&&G.p.nearSafe){menuTab='shop';setMode('menu')}});
addEventListener('keyup',ev=>keys.delete(ev.code));
addEventListener('blur',()=>{keys.clear();mouse.left=mouse.right=false;if(G&&G.mode==='play'&&!window.__botOn&&!netOn())setMode('pause')});
function toggleSound(){muted=!muted;$('sound').textContent=muted?'Sound off':'Sound on'}
$('sound').onclick=ev=>{audioOn();toggleSound();ev.currentTarget.blur()};
$('menubtn').onclick=ev=>{ev.currentTarget.blur();if(G.mode==='play'){menuTab='skills';setMode('menu')}};
$('touch').addEventListener('pointerdown',ev=>{const b=ev.target.closest('button');if(!b)return;ev.preventDefault();const a=b.dataset.a;
  if(a==='slash'){touchHold.slash=true;b.setPointerCapture(ev.pointerId)}
  if(a==='guard'){touchHold.guard=true;b.setPointerCapture(ev.pointerId)}if(a==='swap')doAct('cycle',1);if(['ult','special','spell','heal','dash','potion','fast','magic'].includes(a))doAct(a);if(a==='menu'){menuTab=G.p.nearSafe?'shop':'skills';setMode('menu')}});
['pointerup','pointercancel'].forEach(n=>$('touch').addEventListener(n,ev=>{const b=ev.target.closest('button');if(b&&b.dataset.a==='slash')touchHold.slash=false;if(b&&b.dataset.a==='guard')touchHold.guard=false}));
document.querySelectorAll('.copy').forEach(b=>b.addEventListener('click',()=>{const pre=b.previousElementSibling,done=()=>{b.textContent='Copied';setTimeout(()=>b.textContent='Copy',1400)},sel=()=>{const r=document.createRange();r.selectNodeContents(pre);const s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent='Selected';setTimeout(()=>b.textContent='Copy',1400)};try{navigator.clipboard.writeText(pre.textContent).then(done,sel)}catch(e){sel()}}));
if('IntersectionObserver'in window)new IntersectionObserver(es=>{es.forEach(e=>{if(e.intersectionRatio<.35&&G&&G.mode==='play'&&!window.__botOn&&!netOn())setMode('pause')})},{threshold:[.35]}).observe($('screen'));
/* Select-screen preview cycles through every animation */
const PV=[['walk',4,9,2,'Walking'],['attack',3,7,2,'Attacking'],['dodge',1,1,2,'Dodging'],['pickup',3,4,2,'Picking up'],['walk',4,9,0,'Walking'],['walk',4,9,1,'Walking']];
function drawPreview(now){const cv=$('pv');if(!cv)return;const g=cv.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,96,96);
  const kk=KIT_OF[chosen];if(kk&&MOVE_IMG[kk]&&MOVE_IMG[kk].complete){const SS=[['idle','Standing'],['small','Small attack'],['moderate','Moderate attack'],['special','Special attack'],['defeated','Defeated']],sg=Math.floor(now/1800)%SS.length,[st,lab]=SS[sg],fr=MOVES[kk].frames[st],f=fr[Math.floor((now%1800)/1800*fr.length)],s=.36;g.imageSmoothingEnabled=true;g.drawImage(MOVE_IMG[kk],f[0],f[1],f[2],f[3],48+f[4]*s,90+f[5]*s,f[2]*s,f[3]*s);const l0=$('pvl');if(l0&&l0.textContent!==lab)l0.textContent=lab;return}const seg=Math.floor(now/1400)%PV.length,[anim,nf,fps,dir,label]=PV[seg],f=Math.floor(now/1000*fps)%nf;g.fillStyle='rgba(10,14,28,.5)';g.beginPath();g.ellipse(48,90,20,5,0,0,TAU);g.fill();blit(g,chosen,48,88,dir,anim,f,false,anim==='dodge'?(now/1000*9)%TAU:0);const l=$('pvl');if(l&&l.textContent!==label)l.textContent=label}
/* Loop */
function resize(){const r=$('screen').getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);zoom=Math.max(H/560,W/980)}
if('ResizeObserver'in window)new ResizeObserver(resize).observe($('screen'));else addEventListener('resize',resize);
let last=performance.now(),statT=0;
function tick(now){const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
  if(netOn()){if(G.mode==='play'&&!touchMode&&mouse.sx!==undefined){const r=canvas.getBoundingClientRect();mouse.x=G.cam.x+(mouse.sx-r.left-W/2)/zoom;mouse.y=G.cam.y+(mouse.sy-r.top-H/2)/zoom}netUpdate(dt)}
  else if(G.mode==='play'){if(!touchMode&&mouse.sx!==undefined){const r=canvas.getBoundingClientRect();mouse.x=G.cam.x+(mouse.sx-r.left-W/2)/zoom;mouse.y=G.cam.y+(mouse.sy-r.top-H/2)/zoom}update(dt)}
  else if(G.mode==='title'||G.mode==='menu'){G.t+=dt;if(G.mode==='title')drawPreview(now)}
  try{render()}catch(err){ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';if(!window.__renderErr){window.__renderErr=err.message;console.error(err)}}
  statT+=dt;if(isDirty){isDirty=false;statT=0;renderPanel()}else if(statT>.25){statT=0;renderStats()}
  requestAnimationFrame(tick)}
if(matchMedia('(pointer:coarse)').matches)touchMode=true;
demoScene();resize();setMode('title');
window.__dayrim={get state(){return G},net,enterStage,summonBoss,recalc,frame,SPECS,update,keys,mouse,doDash,usePotion,useFast,useMagic,setMode,newRun,gymCost,shopCost,SKILLS,dropLoot,VOICE_BUF,voice,doUlt,addRage,doMove,KIT_OF,KIT,spawnVillainPair,spawnMob,SHOP,GYM,recLevel,quota,xpNeed,STAGES,idx,MW,MH,T,dist,los,drawBossSprite,bossPose,drawBossDeath,doSpell,doHeal,wearBest,equipWeapon,weaponDamage,WEAPONS,METHODS,STATS,guardArmor,ROSTER};
requestAnimationFrame(tick);
