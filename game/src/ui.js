/* ---------- Sheet, menus, input and main loop ---------- */
const achievementQueue=[];let achievementTimer=0;
function showAchievement(id){const a=ACHIEVEMENTS.find(x=>x.id===id);if(!a)return;achievementQueue.push(a);if(achievementTimer)return;const next=()=>{const item=achievementQueue.shift(),box=$('achievement-toast');if(!item){box.hidden=true;achievementTimer=0;return}$('achievement-name').textContent=item.n;box.hidden=false;achievementTimer=setTimeout(next,3500)};next()}
achievementNotice=(p,id)=>{if(G.p===p)showAchievement(id)};

function renderStats(){const p=G.p,s=p.s;
  $('whoname').textContent='The '+label(p.char);$('who').textContent='Level '+p.lvl+' · '+Math.floor(p.gold)+' gold'+(p.sp?' · '+p.sp+' skill pts':'');
  const rows=[['Hit damage',Math.round(weaponDamage(p.weapon))],['Life',Math.ceil(p.hp)+' / '+Math.round(s.maxHp)],['Mana',Math.floor(p.mana)+' / '+Math.round(s.maxMana)],['Armor',Math.round(s.armor)],['Critical',Math.round(s.crit*100)+'%'],['Speed',Math.round(s.speed)],['Haste',Math.round((1-s.cdMul)*100)+'%'],['Items','P'+p.potions+' F'+p.fast+' M'+p.magic],['Rage',Math.floor(p.rage)+'%'],['Best combo',p.bestCombo]];
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
function returnToMenu(){if(netOn()){netLeave();return}if(G.story&&!G.story.over)storyWrite();writeSave();demoScene();setMode('title');showModes()}
const touchPointers=new Map();
let scoutHold=false;
function stopScoutRevive(){if(!scoutHold)return;scoutHold=false;touchHold.revive=false;if(netOn())netAct('revive',false)}
function updateScoutButton(){const p=G.p,b=$('scout-revive'),show=G.mode==='play'&&!touchMode&&p&&!(p.deadT>0||p.respawnT>0)&&G.npcs.some(c=>c.wounded&&!c.dead&&dist(p,c)<=Math.max(archKey(p.char)==='medic'?120:60,80));if(!show)stopScoutRevive();b.hidden=!show}
$('scout-revive').addEventListener('pointerdown',ev=>{if(ev.button!==0)return;ev.preventDefault();scoutHold=true;touchHold.revive=true;ev.currentTarget.setPointerCapture(ev.pointerId);if(netOn())netAct('revive',true)});
['pointerup','pointercancel','lostpointercapture'].forEach(n=>$('scout-revive').addEventListener(n,stopScoutRevive));
$('scout-revive').addEventListener('keydown',ev=>{if((ev.code==='Space'||ev.code==='Enter')&&!ev.repeat){ev.preventDefault();scoutHold=true;touchHold.revive=true;if(netOn())netAct('revive',true)}});
$('scout-revive').addEventListener('keyup',ev=>{if(ev.code==='Space'||ev.code==='Enter'){ev.preventDefault();stopScoutRevive()}});
$('scout-revive').addEventListener('blur',stopScoutRevive);
function closeTouchExtra(){$('touch-extra').hidden=true;const b=$('touch').querySelector('[data-a=more]');b.setAttribute('aria-expanded','false')}
function resetTouch(){closeTouchExtra();stopScoutRevive();if(touchHold.revive&&netOn())netAct('revive',false);touchPointers.clear();touchHold.slash=touchHold.guard=touchHold.revive=false;joy.on=false;joy.id=null;joy.dx=joy.dy=0;$('joystick').hidden=true;$('scout-revive').hidden=true;$('touch').querySelectorAll('.held').forEach(b=>b.classList.remove('held'))}
/* Game-style notice card, used for being downed, stage clear, the final victory and pause.
   tone sets the colour: dead (red), win (gold), pause (blue). chips: [label, value] pairs shown as stat plates. */
function gameCard(c,tone,o){c.classList.add('notice');c.dataset.tone=tone;$('ov').dataset.tone=tone;
  c.innerHTML='<div class="notice-k"><span>'+o.kicker+'</span></div><h2 class="notice-t">'+o.title+'</h2>'+(o.line?'<p class="notice-l">'+o.line+'</p>':'')+
    (o.chips&&o.chips.length?'<div class="chips">'+o.chips.map(([k,v])=>'<span class="chip"><b>'+v+'</b><small>'+k+'</small></span>').join('')+'</div>':'')+'<div class="btnrow">'+o.buttons+'</div>'}
function setMode(m){
  /* A story chapter ends with its closing scene before the victory card. */
  if(m==='clear'&&G.story&&!G.story.over){storyOutro();return}
  setTimeout(()=>{menuMusic();gameAmbience()},0);
  resetTouch();G.mode=m;mouse.left=mouse.right=false;keys.clear();const ov=$('ov'),c=$('card');
  $('touch').hidden=!(touchMode&&m==='play');$('screen').classList.toggle('touch-playing',touchMode&&m==='play');
  if(m==='play'){ov.hidden=true;return}$('story-act').hidden=true;
  ov.hidden=false;ov.classList.toggle('pick',m==='title'||m==='menu');c.classList.toggle('sel',m==='title'||m==='menu');c.classList.remove('notice');delete c.dataset.tone;delete ov.dataset.tone;
  if(m==='title')renderSelect();
  else if(m==='menu')renderMenu();
  else if(netOn()&&netOverlay(m,c))return;
  else if(m==='pause'){gameCard(c,'pause',{kicker:'Game paused',title:'Paused',line:(G.story?esc(storyTitle()):'Stage '+G.stage+' · '+esc(STAGES[G.stage-1].n))+'. Your progress saves automatically.',chips:[['Level',G.p.lvl],['Gold',Math.floor(G.p.gold)],['Kills',G.p.kills||0]],buttons:'<button class="go" id="go" type="button">Resume</button><button class="ghost" id="tomenu" type="button">Return to menu</button>'});$('go').onclick=()=>setMode('play');$('tomenu').onclick=returnToMenu}
  else if(m==='dead'){gameCard(c,'dead',{kicker:'Defeated',title:'You fell',line:'The '+esc(label(G.p.char))+' wakes at the safehouse. Level, gear and '+(G.story?'story':'stage')+' progress are kept. Train, upgrade skills and stock potions before the boss.',chips:[['Gold lost','20%'],['Stage',G.stage],['Level',G.p.lvl]],buttons:'<button class="go" id="go" type="button">Wake at safehouse</button><button class="ghost" id="tomenu" type="button">Return to main menu</button>'});$('tomenu').onclick=returnToMenu;$('go').onclick=()=>{const p=G.p;enterStage(G.stage,true);p.hp=p.s.maxHp;p.mana=p.s.maxMana;p.fastT=p.magicT=0;setMode('play')}}
  else if(m==='clear'&&G.story)storyCard(c);
  else if(m==='clear'){const n=G.stage,last=n>=10,hero=factionOf(G.p.char)==='hero';
    if(last)gameCard(c,'win',{kicker:'Legend of Dayrim',title:hero?'Dayrim is safe':'Dayrim is yours',line:'The crowned horror has fallen and all 10 stages are clear.',chips:[['Level',G.p.lvl],['Defeated',G.p.kills],['Hero',esc(label(G.p.char))]],buttons:'<button class="go" id="go" type="button">Keep playing</button>'});
    else gameCard(c,'win',{kicker:'Victory',title:'Stage '+n+' cleared',line:esc(STAGES[n-1].label||STAGES[n-1].boss)+' is defeated. Next: stage '+(n+1)+', '+esc(STAGES[n].n)+'.',chips:[['Skill points','+2'],['Your level',G.p.lvl],['Recommended',recLevel(n+1)]],buttons:'<button class="go" id="go" type="button">Go to stage '+(n+1)+'</button><button class="ghost" id="stay" type="button">Keep training here</button>'});
    c.querySelector('.btnrow').insertAdjacentHTML('beforeend','<button class="ghost" id="tomenu" type="button">Return to main menu</button>');$('tomenu').onclick=returnToMenu;
    $('go').onclick=()=>{if(!last)enterStage(n+1);setMode('play')};const st=$('stay');if(st)st.onclick=()=>{G.gate.open=true;setMode('play')}}
}
/* Scales with its column through CSS alone, so it never depends on measuring the page */
const cardStyle=n=>{const a=CAST[n];return 'width:100%;aspect-ratio:'+a.w+'/'+a.h+';background-size:'+(AW/a.w*100)+'% '+(AH/a.h*100)+'%;background-position:'+(a.x/(AW-a.w)*100)+'% '+(a.y/(AH-a.h)*100)+'%'};
/* The Swarm picker: any stage this character has reached. */
function swarmPanel(sv){const top=sv&&sv.char===chosen?Math.max(sv.stage||1,sv.maxStage||1):1;let best=0;try{best=JSON.parse(localStorage.getItem('dayrim-swarm-best')||'{}')[chosen]||0}catch(e){}
  return '<div class="cont"><span>The Swarm: endless waves on a stage map. Nothing carries over to your saved game.'+(best?' Best: wave '+best+'.':'')+'</span>'+Array.from({length:Math.min(10,top)},(_,i)=>'<button class="buy" type="button" data-swarm="'+(i+1)+'">Stage '+(i+1)+'</button>').join('')+'</div>'}
function renderSelect(){
  const c=$('card'),names=Object.keys(ROSTER[selTab]),a=archOf(chosen),sv=readSave(),foe=factionOf(chosen)==='hero'?'villains':'heroes';
  const abil=ABILITIES[chosen]?' · C '+ABILITIES[chosen].n.toLowerCase()+', click to use':'',controls=touchMode?'Drag on the game to move. Aim is automatic.':KIT_OF[chosen]?'WASD move · Left click small attack · Q moderate attack · X special (60s)'+abil+' · V ultimate · Hold right click shield · E heal · Space dodge · Hold Shift sprint · 1 potion · Hold F revive · G team ability · 2 fast pill · 3 magic pill · T skills · L fullscreen':'WASD move · Mouse aim · Left click attack'+abil+' · Hold right click shield · Q spell · E heal · Space dodge · Hold Shift sprint · V ultimate · Tab change weapon · 1 potion · Hold F revive · G team ability · 2 fast pill · 3 magic pill · T skills · L fullscreen';
  const w0=weaponOf(chosen);
  c.innerHTML='<div class="sel-top"><h2><button class="ghost tomodes" id="tomodes" type="button" aria-label="Back to game modes">‹ Modes</button>Choose your character</h2><div class="tabs"><button class="tab" type="button" data-tab="hero" aria-pressed="'+(selTab==='hero')+'">Heroes</button><button class="tab" type="button" data-tab="villain" aria-pressed="'+(selTab==='villain')+'">Villains</button></div></div>'+
  (sv?'<div class="cont"><span>Saved: The '+esc(label(sv.char))+', level '+sv.lvl+', stage '+sv.stage+'</span><button class="go" id="cont" type="button">Continue</button></div>':'')+
  '<div class="sel-body"><div class="roster">'+names.map((n,ri)=>'<button class="rc h" type="button" data-c="'+esc(n)+'" aria-pressed="'+(n===chosen)+'" aria-label="The '+esc(label(n))+', '+ARCH[ROSTER[selTab][n]].n+'"><i style="'+cardStyle(n)+'"></i><b>'+String(ri+1).padStart(2,'0')+'</b></button>').join('')+'</div>'+
  '<div class="detail"><div class="pv"><canvas id="pv" width="96" height="96" aria-label="Animated pixel preview"></canvas><span id="pvl" class="ctl"></span></div><h3>The '+esc(label(chosen))+'</h3><div class="role">'+(factionOf(chosen)==='hero'?'Hero':'Villain')+' · '+a.n+'</div><p>'+a.d+'</p>'+(passiveOf(chosen)?'<p class="passive"><b>Passive · '+esc(passiveOf(chosen)[0])+':</b> '+esc(passiveOf(chosen)[1])+'</p>':'')+(ABILITIES[chosen]?'<p class="passive ability-note"><b>Ability · '+esc(abilityTitle(ABILITIES[chosen]))+':</b> '+esc(ABILITIES[chosen].d)+' <i>C to ready, click to use.</i></p>':'')+'<button class="go" id="go" type="button">'+(sv?(confirmNew?'Confirm: erase saved run':'New game'):'Start game')+'</button><button class="ghost" id="swarm" type="button" style="margin-left:8px">The Swarm</button>'+(swarmPick?swarmPanel(sv):'')+(netAvailable()?'<button class="ghost" id="online" type="button" style="margin-left:8px">Play online</button>':'')+'<div class="sbs">'+statBars(STATS[chosen])+'</div><p class="ctl">Starts with: '+WEAPONS[w0].n+' ('+METHODS[WEAPONS[w0].m].n.toLowerCase()+'). Enemies: the '+foe+'.</p><p class="ctl">'+controls+'</p></div></div>';
  c.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{selTab=b.dataset.tab;playSound(selTab==='hero'?'heroBrowse':'villainBrowse');renderSelect()});
  c.querySelectorAll('.rc').forEach(b=>{b.onclick=()=>{chosen=b.dataset.c;playSound(factionOf(chosen)==='hero'?'heroBrowse':'villainBrowse');confirmNew=false;try{localStorage.setItem('dayrim-char',chosen)}catch(e){}G.p.char=chosen;recalc();renderSelect()}});
  $('go').onclick=()=>{if(sv&&!confirmNew){confirmNew=true;renderSelect();return}confirmNew=false;audioOn();announce('start',2);clearSave();newRun(chosen);addLog('You hit the streets as the '+esc(label(chosen))+'.');setMode('play')};
  $('tomodes').onclick=showModes;
  const onl=$('online');if(onl)onl.onclick=()=>{audioOn();renderLobby()};
  {const sw=$('swarm');if(sw)sw.onclick=()=>{swarmPick=!swarmPick;renderSelect()}}c.querySelectorAll('[data-swarm]').forEach(b=>b.onclick=()=>{audioOn();announce('start',2);swarmPick=false;startSwarmRun(chosen,+b.dataset.swarm);addLog('The Swarm begins. Nothing here changes your saved game.')});
  const ct=$('cont');if(ct)ct.onclick=()=>{audioOn();announce('start',2);loadRun(sv);addLog('Welcome back, '+esc(label(sv.char))+'.');setMode('play')};
}
/* Summaries come from the same upgrade tables that the attack rules use. */
function upgradeSummary(w,n){if(w.m==='shoot'){const u=GUN_UP[n];return u.angles.length+' shot'+(u.angles.length===1?'':'s')+' at '+Math.round(u.damage*100)+'% each'}if(w.m==='spell'){const u=SPELL_UP[n];return u.angles.length+' blast'+(u.angles.length===1?'':'s')+' at '+Math.round(u.damage*100)+'% each · radius '+u.blast}return 'Damage +'+Math.round((MELEE_UP[n]-1)*100)+'% · reach '+meleeReach(w,n)+' · swing '+Math.round(meleeArc(n)*2*180/Math.PI)+'°'}
function weaponEffect(id,w){if(PIERCING_WEAPONS.has(id))return 'Shots pierce one additional enemy.';if(w.m==='shield')return 'Bash interrupts ordinary enemy wind-ups.';if(w.m==='heal')return 'A hit restores 2% life to one nearby ally, once per second.';return ''}
function weaponTier(n){return '<span class="weapon-tier"><span class="weapon-pips" aria-hidden="true">'+Array.from({length:MAX_WEAPON_TIER},(_,i)=>'<i class="'+(n>i?'on':'')+'"></i>').join('')+'</span><b>Tier '+n+'/'+MAX_WEAPON_TIER+'</b></span>'}
function upgradeReason(n,safe,cost,gold){if(!cost)return 'Fully upgraded.';if(!safe)return 'Return to the safehouse to upgrade.';if(gold<cost)return 'Need '+Math.ceil(cost-gold)+' more gold.';return ''}
/* Keep the open progress menu in sync with authoritative online updates. */
function refreshProgressMenu(){const ov=$('ov'),scroll=ov.scrollTop,active=document.activeElement,key=active&&active.dataset&&(active.dataset.upgrade!==undefined?['upgrade',active.dataset.upgrade]:active.dataset.weapon!==undefined?['weapon',active.dataset.weapon]:active.dataset.skill!==undefined?['skill',active.dataset.skill]:active.dataset.boon!==undefined?['boon',active.dataset.boon]:null);renderMenu();ov.scrollTop=scroll;if(key){const b=[...$('card').querySelectorAll('[data-'+key[0]+']')].find(x=>x.dataset[key[0]]===key[1]);if(b&&!b.disabled)b.focus({preventScroll:true})}}
const SKILL_GROUPS=[['Offense',['power','aim','spell','crit']],['Defense',['guard','tough','mend','leech']],['Mobility and magic',['foot','focus']]];
const SKILL_VALUES={power:[8,'% damage'],aim:[8,'% damage'],spell:[10,'% damage'],guard:[12,'% shield armor'],mend:[10,'% self-healing'],tough:[6,'% maximum life'],foot:[2,'% move speed (cap 290)'],focus:[1,' mana per second'],crit:[1.5,'% critical chance'],leech:[.5,' life per hit']};
function skillValue(s,r){const v=SKILL_VALUES[s.id];return '+'+(Math.round(v[0]*r*10)/10)+v[1]}
function renderMenu(){
  const c=$('card'),p=G.p,tabs=[['skills','Skills'],['weapons','Weapons'],['achievements','Achievements'],['gym','Gym'],['shop','Shop'],...(G.story?[]:[['travel','Travel']]),['settings','Settings']],safe=G.p.nearSafe;
  let body='';
  if(menuTab==='skills'){const aura=auraOf(p),team=TEAM_ABILITY[archKey(p.char)],boon=p.boonPending?'<div class="boons"><p class="mhead">Checkpoint boon: choose one for this run.</p><button class="boon" type="button" data-boon="wide"'+((p.runBoons.wide||0)>=3?' disabled':'')+'><strong>Safer dodge</strong><span>Longer dodge protection.</span></button><button class="boon" type="button" data-boon="opening"'+((p.runBoons.opening||0)>=3?' disabled':'')+'><strong>Longer opening</strong><span>Dodged brute attacks stay open longer.</span></button></div>':'';const ab=abilityOf(p);body=boon+(ab?'<p class="mhead">Ability (C): <b>'+abilityTitle(ab)+'</b> · '+ab.d+' '+ABILITY_HOW+'</p>':'')+'<p class="mhead">Team ability (G): <b>'+team.n+'</b> · '+team.d+'</p><p class="mhead">Aura: <b>'+aura.n+'</b> · '+aura.d+' for you and nearby allies.</p><p class="mhead">Element: <b>'+ELEMENT[p.char]+'</b>. Different players combine statuses for reactions; other pairs resonate. Alone, a second hit triggers weaker resonance.</p><p class="mhead">Skill points: <b>'+p.sp+'</b>. You earn 1 per level and 2 per boss.</p>'+SKILL_GROUPS.map(([name,ids])=>'<h3 class="skill-group">'+name+'</h3>'+ids.map(id=>{const s=SKILLS.find(x=>x.id===id),r=p.skills[id]||0,full=r>=s.max;return'<div class="mrow skill-row"><div><strong>'+s.n+'</strong><span>'+s.d+'</span><span>Now: '+skillValue(s,r)+(full?'':' · Next: '+skillValue(s,r+1))+'</span><span class="skill-progress" role="progressbar" aria-label="'+s.n+' rank" aria-valuemin="0" aria-valuemax="'+s.max+'" aria-valuenow="'+r+'"><i style="width:'+(100*r/s.max)+'%"></i></span></div><em>'+r+'/'+s.max+'</em><button type="button" class="buy" data-skill="'+s.id+'"'+(p.sp<=0||full?' disabled':'')+'>'+(full?'Max':p.sp<=0?'No points':'Train')+'</button></div>'}).join('')).join('')}
  else if(menuTab==='weapons'){const gold=Math.floor(p.gold),intro='<p class="mhead">Upgrade at the safehouse · Gold: <b>'+gold+'</b></p>';
    if(kitOf(p)){const lv=upgradeLevel(p,'signature'),cost=upgradeCost(lv),now=Math.round((MELEE_UP[lv]-1)*100),next=cost?Math.round((MELEE_UP[lv+1]-1)*100):now,reason=upgradeReason(lv,safe,cost,p.gold);body=intro+'<p class="mhead">Small, moderate and special signature moves gain damage.</p><div class="mrow weapon-row"><div class="weapon-choice"><div class="weapon-info"><strong>Signature moves</strong>'+weaponTier(lv)+'<span>Now: damage +'+now+'%</span>'+(cost?'<span>Next: damage +'+next+'%</span>':'')+(reason?'<span class="weapon-reason">'+reason+'</span>':'')+'</div></div><button type="button" class="buy" data-upgrade="signature"'+(!safe||!cost||p.gold<cost?' disabled':'')+'>'+(cost?'Upgrade '+cost+' gold':'Max')+'</button></div>'}
    else body=intro+p.weapons.map(id=>{const w=WEAPONS[id],on=id===p.weapon,lv=upgradeLevel(p,id),cost=upgradeCost(lv),effect=weaponEffect(id,w),reason=upgradeReason(lv,safe,cost,p.gold);return '<div class="mrow weapon-row"><div class="weapon-choice"><canvas class="weapon-icon" width="44" height="44" data-icon="'+id+'" aria-hidden="true"></canvas><div class="weapon-info"><strong>'+esc(w.n)+'</strong><span>'+METHODS[w.m].n+' · power '+w.p+'</span>'+weaponTier(lv)+'<span>Now: '+upgradeSummary(w,lv)+'</span>'+(cost?'<span>Next: '+upgradeSummary(w,lv+1)+'</span>':'')+(effect?'<span class="weapon-effect">'+(lv>=2?'Effect: ':'Tier 2: ')+effect+'</span>':'')+(reason?'<span class="weapon-reason">'+reason+'</span>':'')+'</div></div><em>'+(on?'In hand':'')+'</em><button type="button" class="buy" data-weapon="'+id+'"'+(on?' disabled':'')+'>'+(on?'Equipped':'Equip')+'</button><button type="button" class="buy" data-upgrade="'+id+'"'+(!safe||!cost||p.gold<cost?' disabled':'')+'>'+(cost?'Upgrade '+cost+' gold':'Max')+'</button></div>'}).join('')}
  else if(menuTab==='achievements'){const earned=ACHIEVEMENTS.filter(a=>(p.achievements||{})[a.id]).length,view=G.swarm&&p.swarmSave?Object.assign({},p.swarmSave,{achievements:p.achievements,swarmBest:p.swarmBest}):p;body='<p class="mhead">'+earned+' / '+ACHIEVEMENTS.length+' unlocked · Story progress is for this run. Some teamwork goals require multiplayer.</p>'+[...new Set(ACHIEVEMENTS.map(a=>a.group))].map(group=>'<h3 class="skill-group">'+group+'</h3>'+ACHIEVEMENTS.filter(a=>a.group===group).map(a=>{const done=!!(p.achievements||{})[a.id],value=Math.min(a.goal,achievementValue(view,a));return '<div class="achievement-card'+(done?' earned':'')+'"><span class="medal" aria-hidden="true">'+(done?'★':'◇')+'</span><div><strong>'+a.n+'</strong><span>'+a.d+'</span></div><em>'+(done?'Unlocked':value+' / '+a.goal)+'</em></div>'}).join('')).join('')}
  else if(menuTab==='settings')body='<div class="settings-actions"><button class="ghost" type="button" data-setting="sound">'+(muted?'Sound off':'Sound on')+'</button>'+(canFullscreen?'<button class="ghost" type="button" data-setting="fsbtn">'+(fsEl()?'Exit fullscreen':'Fullscreen')+'</button>':'')+'<button class="ghost" type="button" data-setting="fx3btn">'+esc($('fx3btn').textContent)+'</button></div>';
  else if(!safe)body='<p class="mhead">Go to the green safehouse marker to use the '+(menuTab==='gym'?'gym':menuTab==='shop'?'shop':'travel board')+'. Follow its dot on the mini map.</p>';
  else if(menuTab==='gym'){body='<p class="mhead">Gold: <b>'+Math.floor(p.gold)+'</b>. Training is permanent and gets more expensive.</p>'+GYM.map(g=>{const r=p.train[g.id]||0,cost=gymCost(r);return'<div class="mrow"><div><strong>'+g.n+'</strong><span>'+g.d+'</span></div><em>'+r+' done</em><button type="button" class="buy" data-gym="'+g.id+'"'+(p.gold<cost?' disabled':'')+'>'+cost+' gold</button></div>'}).join('')}
  else if(menuTab==='shop'){body='<p class="mhead">Gold: <b>'+Math.floor(p.gold)+'</b>. You can carry up to 9 of each.</p>'+SHOP.map(s=>{const cost=shopCost(s),have=p[s.id];return'<div class="mrow"><div><strong>'+s.n+'</strong><span>'+s.d+'</span></div><em>'+have+' held</em><button type="button" class="buy" data-shop="'+s.id+'"'+(p.gold<cost||have>=9?' disabled':'')+'>'+cost+' gold</button></div>'}).join('')}
  else{body='<p class="mhead">'+(netOn()&&!netIsHost()?'Only the room host can change stage.':'Replay any unlocked stage to train.')+'</p>'+STAGES.map((s,i)=>{const n=i+1,locked=n>p.maxStage;return'<div class="mrow"><div><strong>Stage '+n+': '+s.n+'</strong><span>Boss: '+(locked?'unknown':(s.label||s.boss))+'. Recommended level '+recLevel(n)+'.</span></div><em>'+(n<=p.beaten?'Cleared':locked?'Locked':'Open')+'</em><button type="button" class="buy" data-go="'+n+'"'+(locked||n===G.stage||(netOn()&&!netIsHost())?' disabled':'')+'>'+(n===G.stage?'Here':'Go')+'</button></div>'}).join('')}
  c.innerHTML='<div class="sel-top"><h2>Stage '+G.stage+' · Level '+p.lvl+'</h2><div class="tabs">'+tabs.map(t=>'<button class="tab" type="button" data-m="'+t[0]+'" aria-pressed="'+(menuTab===t[0])+'">'+t[1]+'</button>').join('')+'</div></div><div class="mlist">'+body+'</div><div class="btnrow"><button class="go" id="go" type="button">Back to the city</button><button class="ghost" id="tomenu" type="button">Return to main menu</button></div>';
  c.querySelectorAll('[data-icon]').forEach(el=>{const id=el.dataset.icon,g=el.getContext('2d');g.imageSmoothingEnabled=false;g.save();g.translate(19,25);g.scale(1.5,1.5);drawWeaponSprite(g,id==='fists'?'fist':id,0,0,-.65,undefined,'#d9ac83');g.restore()});
  c.querySelectorAll('[data-boon]').forEach(b=>b.onclick=()=>{if(netOn())netAct('boon',b.dataset.boon);else{chooseBoon(b.dataset.boon);renderMenu()}});
  c.querySelectorAll('[data-upgrade]').forEach(b=>b.onclick=()=>{if(netOn())netAct('upgrade',b.dataset.upgrade);else{upgradeWeapon(b.dataset.upgrade);renderMenu()}});
  c.querySelectorAll('[data-weapon]').forEach(b=>b.onclick=()=>{if(netOn())netAct('weapon',b.dataset.weapon);else{equipWeapon(b.dataset.weapon);renderMenu()}});
  c.querySelectorAll('[data-setting]').forEach(b=>b.onclick=async()=>{if(b.dataset.setting==='fx3btn')await setFx3(!FX3.enabled);else $(b.dataset.setting).click();if(G.mode==='menu'&&menuTab==='settings')renderMenu()});
  $('tomenu').onclick=returnToMenu;
  c.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{menuTab=b.dataset.m;renderMenu()});
  c.querySelectorAll('[data-skill]').forEach(b=>b.onclick=()=>{if(netOn()){netAct('skill',b.dataset.skill);return}const skill=SKILLS.find(s=>s.id===b.dataset.skill);if(!skill||p.sp<=0||(p.skills[skill.id]||0)>=skill.max)return;p.sp--;p.skills[skill.id]=(p.skills[skill.id]||0)+1;recalc();writeSave();renderMenu()});
  c.querySelectorAll('[data-gym]').forEach(b=>b.onclick=()=>{if(netOn()){netAct('gym',b.dataset.gym);return}const id=b.dataset.gym,cost=gymCost(p.train[id]||0);if(p.gold<cost)return;p.gold-=cost;p.train[id]=(p.train[id]||0)+1;recalc();writeSave();renderMenu()});
  c.querySelectorAll('[data-shop]').forEach(b=>b.onclick=()=>{if(netOn()){netAct('shop',b.dataset.shop);return}const s=SHOP.find(x=>x.id===b.dataset.shop),cost=shopCost(s);if(p.gold<cost||p[s.id]>=9)return;p.gold-=cost;p[s.id]++;dirty();writeSave();renderMenu()});
  c.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{if(G.swarm){addLog('Travel is closed during the Swarm.');return}if(netOn()){netAct('travel',+b.dataset.go);setMode('play');return}enterStage(+b.dataset.go);p.hp=p.s.maxHp;p.mana=p.s.maxMana;setMode('play')});
  $('go').onclick=()=>{writeSave();setMode('play')};
}

/* Input. Online, actions go to the server. Alone, they run here. */
const LOCAL_ACT={dash:()=>doDash(),ult:()=>doUlt(),team:()=>doTeam(),special:()=>doMove('special'),ability:()=>doAbility(),use:()=>doUse(),spell:()=>doSpell(),heal:()=>doHeal(),potion:()=>usePotion(),fast:()=>useFast(),magic:()=>useMagic(),cycle:d=>cycleWeapon(d)};
/* Name shown in menus: Ability → what using it does. How to use it is the same for everyone. */
const abilityTitle=ab=>ab.n+' → '+ab.use,ABILITY_HOW='Press C to ready it, then click to use it (on touch, tap Ability again). C again cancels; for buffs and grabs it fires the finisher.';
function doAct(n,v){if(G.p&&(G.p.deadT>0||G.p.respawnT>0))return;if(n==='ability')touchAim=null;if(netOn())netAct(n,v);else LOCAL_ACT[n](v)}
function screenToWorld(ev){const r=canvas.getBoundingClientRect();return{x:G.cam.x+(ev.clientX-r.left-W/2)/zoom,y:G.cam.y+(ev.clientY-r.top-H/2)/zoom}}
function trackMouse(ev){const w=screenToWorld(ev);mouse.x=w.x;mouse.y=w.y;mouse.sx=ev.clientX;mouse.sy=ev.clientY}
function setTouch(on){if(touchMode===on)return;resetTouch();touchMode=on;resize();$('touch').hidden=!(on&&G.mode==='play');$('screen').classList.toggle('touch-playing',on&&G.mode==='play')}
function mouseButtons(ev){if(G.mode!=='play')return;mouse.left=!!(ev.buttons&1);mouse.right=!!(ev.buttons&2)}
let aimPointer=null;
const dragsAim=ev=>{const a=G.p&&G.p.abil;return !!a&&(a.aim==='spot'||a.aim==='line'||a.fx==='hurl'||a.fx==='blitz')&&(joy.on||ev.clientX-canvas.getBoundingClientRect().left>W/2)};
canvas.addEventListener('pointerdown',ev=>{if(ev.pointerType==='touch'){setTouch(true);if(G.mode!=='play')return;const r=canvas.getBoundingClientRect();if(dragsAim(ev)){aimPointer=ev.pointerId;touchAim=screenToWorld(ev);try{canvas.setPointerCapture(ev.pointerId)}catch(e){}return}if(!joy.on){joy.on=true;joy.id=ev.pointerId;joy.ox=ev.clientX-r.left;joy.oy=ev.clientY-r.top;joy.dx=0;joy.dy=0;const el=$('joystick');el.style.left=joy.ox+'px';el.style.top=joy.oy+'px';el.firstElementChild.style.transform='';el.hidden=false;canvas.setPointerCapture(ev.pointerId)}return}
  setTouch(false);trackMouse(ev);mouseButtons(ev);if(G.mode==='play')try{canvas.setPointerCapture(ev.pointerId)}catch(e){}});
canvas.addEventListener('pointermove',ev=>{if(ev.pointerType==='touch'){if(ev.pointerId===aimPointer){touchAim=screenToWorld(ev);return}if(joy.on&&ev.pointerId===joy.id){const r=canvas.getBoundingClientRect(),dx=ev.clientX-r.left-joy.ox,dy=ev.clientY-r.top-joy.oy,m=Math.max(1,Math.hypot(dx,dy)),k=Math.min(1,m/46);sprintKey=m>SPRINT.drag;$('joystick').classList.toggle('sprint',sprintKey);joy.dx=dx/m*k;joy.dy=dy/m*k;$('joystick').firstElementChild.style.transform='translate('+joy.dx*46+'px,'+joy.dy*46+'px)'}return}trackMouse(ev);mouseButtons(ev)});
const up=ev=>{if(ev.pointerType==='touch'){if(ev.pointerId===aimPointer)aimPointer=null;if(ev.pointerId===joy.id){sprintKey=false;$('joystick').classList.remove('sprint');joy.on=false;joy.id=null;joy.dx=0;joy.dy=0;$('joystick').hidden=true}return}mouseButtons(ev)};
canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('lostpointercapture',up);canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('wheel',e=>{if(G.mode!=='play')return;e.preventDefault();doAct('cycle',e.deltaY>0?1:-1)},{passive:false});
const GAME_CODES=new Set(['Tab','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
addEventListener('keydown',ev=>{if(ev.metaKey||ev.ctrlKey||ev.altKey)return;
  if(ev.code==='KeyL'&&!ev.repeat&&ev.target.tagName!=='INPUT'){toggleFullscreen();return}
  if(splashOn()){if((ev.code==='Enter'||ev.code==='Space')&&!ev.repeat){ev.preventDefault();leaveSplash()}return}
  if(modesOn()){if(ev.code==='Escape'){const b=$('mdpanel').querySelector('.mp-back');if(b)b.click()}return}
  if(G.mode==='talk'){if(ev.target.closest&&ev.target.closest('.dlg-opt,.dlg-skip'))return;if(ev.code==='Escape')dlgSkip();else if(['Space','Enter','KeyF','KeyE'].includes(ev.code)&&!ev.repeat){ev.preventDefault();dlgNext()}return}
  if(ev.code==='Escape'||ev.code==='KeyP'){if(G.mode==='play'){setMode('pause');return}if(G.mode==='pause'||G.mode==='menu'){writeSave();setMode('play');return}}
  if(G.mode==='menu'&&(ev.code==='KeyT'||ev.code==='KeyR')){writeSave();setMode('play');return}
  if(G.mode!=='play')return;if(GAME_CODES.has(ev.code))ev.preventDefault();if(ev.repeat)return;keys.add(ev.code);
  if(ev.code==='KeyF'&&G.story&&storyAct())return;
  if(ev.code==='KeyM')toggleSound();
  if(ev.code==='Space')doAct('dash');
  if(ev.code==='ShiftLeft'||ev.code==='ShiftRight')sprintKey=true;
  if(ev.code==='KeyG')doAct('team');if(ev.code==='KeyV')doAct('ult');if(ev.code==='KeyX')doAct('special');if(ev.code==='KeyC')doAct('ability');if(ev.code==='KeyQ')doAct('spell');if(ev.code==='KeyE')doAct('heal');if(ev.code==='Tab'){ev.preventDefault();doAct('cycle',ev.shiftKey?-1:1)}
  if(ev.code==='Digit1')doAct('potion');if(ev.code==='KeyF'&&netOn())netAct('revive',true);if(ev.code==='Digit2')doAct('fast');if(ev.code==='Digit3')doAct('magic');
  if(ev.code==='KeyT'){menuTab='skills';setMode('menu')}
  if(ev.code==='KeyR'&&G.p.nearSafe){menuTab='shop';setMode('menu')}});
addEventListener('keyup',ev=>{keys.delete(ev.code);if(ev.code==='ShiftLeft'||ev.code==='ShiftRight')sprintKey=false;if(ev.code==='KeyF'&&netOn())netAct('revive',false)});
addEventListener('blur',()=>{keys.clear();sprintKey=false;resetTouch();mouse.left=mouse.right=false;if(G&&G.mode==='play'&&!window.__botOn&&!netOn())setMode('pause')});
function toggleSound(){muted=!muted;$('sound').textContent=muted?'Sound off':'Sound on';titleMusic();menuMusic();gameAmbience()}
/* Menu music and the browse sounds. The files are the owner's, from ASSETS/audio, converted by tools/make_sfx.sh. */
const SOUND_BUF={},SOUND_WAIT={};let menuSrc=null,menuGain=null,browseSrc=null;
/* Sounds load in priority order: the title song and menu music first, then the browse sounds and start line, then everything else */
const SOUND_FIRST=['titleSong','menu','heroBrowse','villainBrowse','an_start','ambA','ambB'];
function soundLoaded(k,b){SOUND_BUF[k]=b;if(k.startsWith('an_')&&SOUND_WAIT[k]>0&&performance.now()-SOUND_WAIT[k]<900){SOUND_WAIT[k]=0;announce(k.slice(3))}if(k==='menu')menuMusic();else if(k==='titleSong')titleMusic();else if(k==='ambA'||k==='ambB')gameAmbience();else if(SOUND_WAIT[k]>0&&performance.now()-SOUND_WAIT[k]<900)playSound(k);SOUND_WAIT[k]=0}
function loadSounds(){if(!ac)return;const ks=Object.keys(SOUND_CLIPS).sort((a,b)=>{const ia=SOUND_FIRST.indexOf(a),ib=SOUND_FIRST.indexOf(b);return(ia<0?99:ia)-(ib<0?99:ib)});
  ks.forEach(k=>{if(SOUND_BUF[k]||SOUND_WAIT[k]===-1)return;SOUND_WAIT[k]=SOUND_WAIT[k]||-1;queueAudio(SOUND_CLIPS[k],b=>soundLoaded(k,b),()=>{SOUND_WAIT[k]=0})})}
/* A browse sound cuts off the one before it, so clicking quickly through cards doesn't pile up */
/* Villain browse is twice the hero browse level, at the owner's request. Its loudest point stays below clipping (about -1.7 dB). */
const SOUND_VOL={heroBrowse:.8,villainBrowse:1.6};
function playSound(k,v=SOUND_VOL[k]||.8){if(muted||!ac)return;const b=SOUND_BUF[k];if(!b){if(SOUND_WAIT[k]===-1)SOUND_WAIT[k]=performance.now();return}
  try{if(browseSrc)browseSrc.stop()}catch(e){}try{const s=ac.createBufferSource(),g=ac.createGain();s.buffer=b;g.gain.value=v;s.connect(g).connect(ac.destination);s.start();browseSrc=s;(window.__soundLog=window.__soundLog||[]).push(k)}catch(e){}}
/* Title song: plays on the title poster only. It fades in to 70% volume, at the owner's request, and fades out when Play Game is pressed. */
const TITLE_VOL=.7;let titleSrc=null,titleGain=null;
function titleMusic(){const want=!muted&&!!ac&&!!SOUND_BUF.titleSong&&splashOn();if(want===!!titleSrc)return;const now=ac?ac.currentTime:0;
  if(want){try{const s=ac.createBufferSource(),g=ac.createGain();s.buffer=SOUND_BUF.titleSong;loopTrim(s,SOUND_BUF.titleSong);g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(TITLE_VOL,now+3);s.connect(g).connect(ac.destination);s.start(now,s.loopStart);titleSrc=s;titleGain=g}catch(e){}}
  else{const s=titleSrc,g=titleGain;titleSrc=titleGain=null;try{g.gain.cancelScheduledValues(now);g.gain.setValueAtTime(g.gain.value,now);g.gain.linearRampToValueAtTime(0,now+.9);s.stop(now+.95)}catch(e){}}}
/* Loops on the character and online screens, fades in and out, and respects Sound off */
function menuMusic(){const want=!muted&&!!ac&&!!SOUND_BUF.menu&&!!G&&G.mode==='title'&&!splashOn();if(want===!!menuSrc)return;const now=ac?ac.currentTime:0;
  if(want){try{const s=ac.createBufferSource(),g=ac.createGain();s.buffer=SOUND_BUF.menu;loopTrim(s,SOUND_BUF.menu);g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.5,now+1.2);s.connect(g).connect(ac.destination);s.start();menuSrc=s;menuGain=g}catch(e){}}
  else{const s=menuSrc,g=menuGain;menuSrc=menuGain=null;try{g.gain.cancelScheduledValues(now);g.gain.setValueAtTime(g.gain.value,now);g.gain.linearRampToValueAtTime(0,now+.6);s.stop(now+.65)}catch(e){}}}
/* Encoders add a sliver of silence at each end, so loops skip it to avoid a gap */
function loopTrim(s,b){const d=b.getChannelData(0);let i=0,j=d.length-1;while(i<j&&Math.abs(d[i])<1e-4)i++;while(j>i&&Math.abs(d[j])<1e-4)j--;s.loop=true;s.loopStart=i/b.sampleRate;s.loopEnd=(j+1)/b.sampleRate;return i/b.sampleRate}
/* In-game background: both ambience tracks loop at their own lengths, so the mix keeps shifting.
   The "half volume" file is the loud one (about -22 dB) and the other is very quiet (about -51 dB),
   so these gains bring them to about -34 and -38 dB, a soft bed under the game at about -32 dB. */
const AMB_MIX={ambB:.25,ambA:4.6};let ambSrcs=null,ambGain=null;
function gameAmbience(){const want=!muted&&!!ac&&!!SOUND_BUF.ambA&&!!SOUND_BUF.ambB&&!!G&&G.mode!=='title'&&!G.boss;if(want===!!ambSrcs)return;const now=ac?ac.currentTime:0;
  if(want){try{const m=ac.createGain();m.gain.setValueAtTime(0,now);m.gain.linearRampToValueAtTime(1,now+2.5);m.connect(ac.destination);ambSrcs=Object.entries(AMB_MIX).map(([k,v])=>{const s=ac.createBufferSource(),g=ac.createGain();s.buffer=SOUND_BUF[k];const off=loopTrim(s,SOUND_BUF[k]);g.gain.value=v;s.connect(g).connect(m);s.start(now,off);return s});ambGain=m}catch(e){ambSrcs=null}}
  else{const ss=ambSrcs,m=ambGain;ambSrcs=ambGain=null;try{m.gain.cancelScheduledValues(now);m.gain.setValueAtTime(m.gain.value,now);m.gain.linearRampToValueAtTime(0,now+1);ss.forEach(s=>s.stop(now+1.05))}catch(e){}}}
/* Footsteps. The ground under each player picks the sound, and each surface has several takes.
   Grass uses the dirt takes (8 of them, as grass is walked on most), sandy paths use dirt v2,
   stone clearings use stone, ponds use water and bridges use wood. Water and wood are boosted to match. */
const STEP_OF={0:'dirt',1:'dirtv2',2:'stone',3:'water',4:'wood'},STEP_VOL={dirt:.3,dirtv2:.3,stone:.3,water:.75,wood:.42},stepLast={};
function stepTakes(set){return Object.keys(SOUND_BUF).filter(k=>k.startsWith('step_'+set+'_'))}
function playStep(set,vol){const ks=stepTakes(set);if(!ks.length)return;let k=ks[Math.floor(Math.random()*ks.length)];if(ks.length>1&&k===stepLast[set])k=ks[(ks.indexOf(k)+1)%ks.length];stepLast[set]=k;
  try{const b=SOUND_BUF[k],d=b.getChannelData(0);let i=0;while(i<d.length&&Math.abs(d[i])<.003)i++;const s=ac.createBufferSource(),g=ac.createGain();s.buffer=b;s.playbackRate.value=.94+Math.random()*.12;g.gain.value=vol;s.connect(g).connect(ac.destination);s.start(0,i/b.sampleRate);(window.__stepLog=window.__stepLog||[]).push(set)}catch(e){}}
function footsteps(){if(muted||!ac||!G||!G.w||G.mode!=='play')return;const me=G.p;
  for(const q of G.players){const st=Math.floor((q.walk||0)/3);if(!q.moving||q.deadT>0||q.dashT>0||q.downed){q._st=st;continue}if(q._st===undefined||st===q._st){q._st=st;continue}q._st=st;
    const d=q===me?0:dist(q,me);if(d>650)continue;const g=G.w.ground[idx(clamp(q.x/T|0,0,MW-1),clamp(q.y/T|0,0,MH-1))]||0,set=STEP_OF[g]||'dirt';playStep(set,STEP_VOL[set]*(q===me?1:.5*(1-d/650)))}}
/* The owner's announcer lines share one voice, so they never talk over each other. A more important line interrupts a less important one. */
let annPrio=0,annUntil=0;
function announce(k,prio=2,vol=.8){if(muted||!ac)return false;const b=SOUND_BUF['an_'+k];if(!b){if(SOUND_WAIT['an_'+k]===-1)SOUND_WAIT['an_'+k]=performance.now();return false}
  const now=performance.now();if(now<annUntil&&prio<annPrio)return true;try{if(voiceSrc)voiceSrc.stop()}catch(e){}
  try{const s=ac.createBufferSource(),g=ac.createGain();s.buffer=b;g.gain.value=vol;s.connect(g).connect(ac.destination);s.start();voiceSrc=s;annPrio=prio;annUntil=now+b.duration*1000;(window.__annLog=window.__annLog||[]).push(k)}catch(e){}return true}
/* kill 1 is the owner's "First blood" line. Combo tiers follow it: Double Kill is kill 2, up to Godlike as kill 9.
   Legendary has no recording yet, so it falls back to the computer voice. */
function announceTier(text){const i=COMBO_TIERS.findIndex(c=>c[1]===text);return i>=0&&announce('kill_'+(i+2),2)}
/* First blood plays on a kill only if it hasn't played in the last 10 minutes, at the owner's request */
const FIRST_BLOOD_GAP=10*60*1000;let firstBloodAt=-Infinity,killSeen=null;
function watchFirstBlood(){const k=(G.killsStage||0)+((G.p&&G.p.kills)||0);if(killSeen===null||k<killSeen){killSeen=k;return}if(k===killSeen)return;killSeen=k;
  const now=performance.now();if(now-firstBloodAt<FIRST_BLOOD_GAP)return;if(announce('kill_1',3))firstBloodAt=now}
/* Rule sounds that have the owner's recording. Anything else falls back to the synth. */
const GEN_VOL={react:.6,link:.75,revive:.5,downed:.6,ping:.5,weak:.32,strong:.4,beast:.42,boss:.7};
/* A generated sound plays under its own name, or one of its numbered versions: sfx('weak_hurt') picks sfx_weak_hurt_1 to _3 */
const genSets={};
function genSet(n){const have=Object.keys(SOUND_BUF).length;if(genSets[n]&&genSets[n].have===have)return genSets[n].keys.length?genSets[n]:null;const k='sfx_'+n,keys=Object.keys(SOUND_BUF).filter(x=>x===k||(x.startsWith(k+'_')&&/^\d+$/.test(x.slice(k.length+1))));
  genSets[n]={keys,have,vol:GEN_VOL[n.split('_')[0]]||.55};return keys.length?genSets[n]:null}
/* Crowds of minions would flood the mix, so each enemy sound waits a moment before it can play again (milliseconds) */
const GEN_GAP={weak_spot:500,strong_spot:600,beast_spot:700,weak_attack:180,strong_attack:220,beast_attack:250,weak_hurt:110,strong_hurt:140,beast_hurt:160,weak_die:90,strong_die:120,beast_die:150,boss_warn:300},genLast={};
const ASSET_SFX={slash:{keys:['sfx_melee_1','sfx_melee_2','sfx_melee_3'],vol:.45},pull:{keys:['sfx_heal_1','sfx_heal_2','sfx_heal_3'],vol:.3}};
let rivalAnnT=0;
function playAsset(n){if(n==='rivalDown'){if(performance.now()-rivalAnnT>6000){rivalAnnT=performance.now();announce('rival_down',1)}return true}
  /* Generated sounds (tools/make_audio.py) play under their own name: sfx('react_inferno') plays sfx_react_inferno */
  if(n in GEN_GAP){const now=performance.now();if(now-(genLast[n]||0)<GEN_GAP[n])return true;genLast[n]=now}
  const a=ASSET_SFX[n]||genSet(n);if(!a)return false;if(!ASSET_SFX[n])(window.__genLog=window.__genLog||[]).push(n);const ks=a.keys.filter(k=>SOUND_BUF[k]);if(!ks.length)return false;
  try{const s=ac.createBufferSource(),g=ac.createGain();s.buffer=SOUND_BUF[ks[Math.floor(Math.random()*ks.length)]];s.playbackRate.value=.95+Math.random()*.1;g.gain.value=a.vol;s.connect(g).connect(ac.destination);s.start()}catch(e){}return true}
/* Boss music: the entrance track for the first minute, then the "not defeated yet" track, back to ambience after */
const BOSS_MUS={mus_boss:.35,mus_boss_late:.3};let bossMus=null,bossT0=0,bossSeen=null,bossLastHp=1,downSeen={},stageSeen=0;
function setBossMusic(k){if(bossMus&&bossMus.k===k)return;const now=ac.currentTime;if(bossMus){const o=bossMus;try{o.g.gain.cancelScheduledValues(now);o.g.gain.setValueAtTime(o.g.gain.value,now);o.g.gain.linearRampToValueAtTime(0,now+1.5);o.s.stop(now+1.55)}catch(e){}bossMus=null}
  if(k&&SOUND_BUF[k]){try{const s=ac.createBufferSource(),g=ac.createGain();s.buffer=SOUND_BUF[k];loopTrim(s,SOUND_BUF[k]);g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(BOSS_MUS[k],now+1.5);s.connect(g).connect(ac.destination);s.start();bossMus={k,s,g}}catch(e){}}}
const isDown=q=>q.deadT>0||q.downed||q.hp<=0;
/* Watches the game each frame for moments that have a sound: a boss arriving or falling, and players going down */
function soundWatch(){if(!ac||!G||!G.p||G.mode==='title'){if(bossMus&&ac)setBossMusic(null);bossSeen=null;downSeen={};return}
  if(G.stage!==stageSeen){stageSeen=G.stage;bossSeen=null}
  const b=G.boss;if(b&&b!==bossSeen){bossSeen=b;bossT0=G.t;announce('boss_fight',3)}
  if(b){bossLastHp=b.hp/(b.maxHp||1);setBossMusic(muted?null:(G.t-bossT0<60?'mus_boss':'mus_boss_late'))}
  else{if(bossSeen&&(bossSeen.dead||bossSeen.hp<=bossSeen.maxHp*.25||bossLastHp<.25))announce('boss_defeated',4);bossSeen=null;if(bossMus)setBossMusic(null)}
  gameAmbience();watchFirstBlood();
  const me=G.p,ps=G.players||[me];for(const q of ps){const d=isDown(q),was=!!downSeen[q.id||0];downSeen[q.id||0]=d;if(!d||was)continue;
    const all=ps.every(isDown),others=ps.filter(o=>o!==q);
    if(q===me)announce(all&&others.length?'all_down':'you_down',4);
    else if(!isDown(me)&&others.filter(o=>o!==me).every(isDown))announce(others.length>1?'friends_all_down':'friend_down',4);
    else if(all)announce('all_down',5);else announce('friend_down',3)}}
/* Browsers only allow sound after the player interacts, so the first click or key turns it on */
['pointerdown','keydown'].forEach(n=>addEventListener(n,()=>{audioOn();titleMusic();menuMusic();gameAmbience()},{capture:true}));
$('sound').onclick=ev=>{audioOn();toggleSound();ev.currentTarget.blur()};
/* Fullscreen. Browsers keep Esc for themselves, so the game reacts to the change, not the key. */
const SCREEN=$('screen'),canFullscreen=!!(SCREEN.requestFullscreen||SCREEN.webkitRequestFullscreen);
function fsEl(){return document.fullscreenElement||document.webkitFullscreenElement||null}
function aimHidden(){return !!fsEl()&&G.mode==='play'&&!touchMode}
function toggleFullscreen(){if(!canFullscreen)return;try{const r=fsEl()?(document.exitFullscreen||document.webkitExitFullscreen).call(document):(SCREEN.requestFullscreen||SCREEN.webkitRequestFullscreen).call(SCREEN);if(r&&r.catch)r.catch(()=>{})}catch(e){}}
function onFullscreen(){const on=!!fsEl();$('fsbtn').textContent=on?'Exit fullscreen':'Fullscreen';resize();if(G.mode==='menu'&&menuTab==='settings')renderMenu();if(!on&&G&&G.mode==='play'&&!netOn()&&!window.__botOn)setMode('pause')}
document.addEventListener('fullscreenchange',onFullscreen);document.addEventListener('webkitfullscreenchange',onFullscreen);
$('fsbtn').hidden=!canFullscreen;$('fsbtn').onclick=ev=>{ev.currentTarget.blur();toggleFullscreen()};
$('menubtn').onclick=ev=>{ev.currentTarget.blur();if(G.mode==='play'){menuTab='skills';setMode('menu')}};
/* Indicators describe known local or server-confirmed state; action validation stays in the rules. */
/* The touch Ability and Use buttons carry the character's own move names. */
let touchAbilFor=null;
function touchAbilityLabels(ab){const box=$('touch-ability');box.hidden=!ab;if(!ab)return;const p=G.p,name=p.abil?ab.use:ab.n,b=box.querySelector('[data-a="ability"]');b.classList.toggle('armed',!!p.abil);if(touchAbilFor===name)return;touchAbilFor=name;
  const l=b.querySelector('.touch-label');l.textContent=name;l.classList.toggle('long',name.length>8)}
function updateTouchStatus(){if(!touchMode||G.mode!=='play'||!G.p)return;touchAbilityLabels(abilityOf(G.p));const p=G.p,cd=p.cd||{},kit=!!kitOf(p),wait=t=>t>0?Math.ceil(t)+'s':'',low=p.hp>=p.s.maxHp,states={
  dash:wait(cd.dash),team:wait(p.teamCd),ability:p.abilCast?'Casting':p.abil?'Tap again':wait(p.abilT),ult:p.rage<100?Math.floor(p.rage)+'%':'',special:kit?wait(p.specT):'—',
  spell:kit?(p.mv?'Busy':''):(wait(cd.bolt)||(p.mana<p.s.spellCost?'Mana':'')),heal:wait(cd.pull)||(p.mana<22?'Mana':low?'Full':''),
  potion:wait(cd.potion)||(!p.potions?'Empty':low?'Full':''),fast:wait(p.fastT)||(!p.fast?'Empty':''),magic:wait(p.magicT)||(!p.magic?'Empty':'')};
  const near=!(p.deadT>0||p.respawnT>0)&&((G.players||[]).some(q=>q!==p&&q.deadT>0&&dist(p,q)<=(archKey(p.char)==='medic'?120:60))||(G.npcs||[]).some(q=>q.wounded&&!q.dead&&dist(p,q)<=Math.max(archKey(p.char)==='medic'?120:60,80)));$('touch').querySelector('[data-a=revive]').classList.toggle('nearby',near);
  for(const [id,status] of Object.entries(states)){const b=$('touch').querySelector('[data-a="'+id+'"]'),value=status||'';if(b.dataset.status===value)continue;b.dataset.status=value;b.dataset.state=value?'waiting':id==='ult'?'ready':'';b.setAttribute('aria-label',b.querySelector('.touch-label').textContent+(value?', '+value:''))}}
$('touch').addEventListener('pointerdown',ev=>{const b=ev.target.closest('button');if(!b)return;ev.preventDefault();const a=b.dataset.a;
  if(a==='more'){const panel=$('touch-extra');panel.hidden=!panel.hidden;b.setAttribute('aria-expanded',String(!panel.hidden));return}if(b.closest('#touch-extra'))closeTouchExtra();
  if(['slash','guard','revive'].includes(a)){touchPointers.set(ev.pointerId,a);touchHold[a]=true;b.classList.add('held');b.setPointerCapture(ev.pointerId);if(a==='revive'&&netOn())netAct('revive',true)}if(a==='swap')doAct('cycle',1);if(a==='ability'){doAct(G.p&&G.p.abil?'use':'ability')}if(['ult','team','special','spell','heal','dash','potion','fast','magic'].includes(a))doAct(a);if(a==='menu'){menuTab=G.p.nearSafe?'shop':'skills';setMode('menu')}});
['pointerup','pointercancel','lostpointercapture'].forEach(n=>$('touch').addEventListener(n,ev=>{const a=touchPointers.get(ev.pointerId);if(!a)return;touchPointers.delete(ev.pointerId);if(![...touchPointers.values()].includes(a)){touchHold[a]=false;const b=$('touch').querySelector('[data-a="'+a+'"]');if(b)b.classList.remove('held');if(a==='revive'&&netOn())netAct('revive',false)}}));
document.querySelectorAll('.copy').forEach(b=>b.addEventListener('click',()=>{const pre=b.previousElementSibling,done=()=>{b.textContent='Copied';setTimeout(()=>b.textContent='Copy',1400)},sel=()=>{const r=document.createRange();r.selectNodeContents(pre);const s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent='Selected';setTimeout(()=>b.textContent='Copy',1400)};try{navigator.clipboard.writeText(pre.textContent).then(done,sel)}catch(e){sel()}}));
if('IntersectionObserver'in window)new IntersectionObserver(es=>{es.forEach(e=>{if(e.intersectionRatio<.35&&G&&G.mode==='play'&&!window.__botOn&&!netOn())setMode('pause')})},{threshold:[.35]}).observe($('screen'));
/* Select-screen preview cycles through every animation */
const PV=[['walk',WALK_N,18,2,'Walking'],['run',WALK_N,26,2,'Sprinting'],['attack',ATTACK_N,12,2,'Attacking'],['dodge',1,1,2,'Dodging'],['pickup',3,4,2,'Picking up'],['walk',WALK_N,18,0,'Walking'],['walk',WALK_N,18,1,'Walking']];
function drawPreview(now){const cv=$('pv');if(!cv)return;const g=cv.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,96,96);
  const seg=Math.floor(now/1400)%PV.length,[anim,nf,fps,dir,label]=PV[seg],f=Math.floor(now/1000*fps)%nf;g.fillStyle='rgba(10,14,28,.5)';g.beginPath();g.ellipse(48,90,20,5,0,0,TAU);g.fill();blit(g,chosen,48,88,dir,anim,f,false,anim==='dodge'?(now/1000*9)%TAU:0);const l=$('pvl');if(l&&l.textContent!==label)l.textContent=label}
/* Loop */
function resize(){const r=$('screen').getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);zoom=Math.max(H/560,W/980);portraitMode=touchMode&&W<640&&H>W;hudK=portraitMode?1:clamp(H/640,1,2.5);const cs=getComputedStyle($('screen'));hudTop=parseFloat(cs.paddingTop)||0;hudBottom=parseFloat(cs.paddingBottom)||0;$('screen').style.setProperty('--k',hudK)}
addEventListener('orientationchange',resetTouch);
if('ResizeObserver'in window)new ResizeObserver(resize).observe($('screen'));else addEventListener('resize',resize);
let last=performance.now(),statT=0,touchStatusT=0;
function tick(now){const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
  if(netOn()){if(G.mode==='play'&&!touchMode&&mouse.sx!==undefined){const r=canvas.getBoundingClientRect();mouse.x=G.cam.x+(mouse.sx-r.left-W/2)/zoom;mouse.y=G.cam.y+(mouse.sy-r.top-H/2)/zoom}netUpdate(dt)}
  else if(G.mode==='play'){if(!touchMode&&mouse.sx!==undefined){const r=canvas.getBoundingClientRect();mouse.x=G.cam.x+(mouse.sx-r.left-W/2)/zoom;mouse.y=G.cam.y+(mouse.sy-r.top-H/2)/zoom}update(G.hitStop>0?(G.hitStop-=dt,dt*.08):dt)}
  else if(G.mode==='title'||G.mode==='menu'){G.t+=dt;if(G.mode==='title')drawPreview(now)}
  else if(G.mode==='talk'){G.t+=dt;dlgTick(dt,now)}
  {const hide=aimHidden()?'none':'';if(canvas.style.cursor!==hide)canvas.style.cursor=hide}
  footsteps();soundWatch();
  touchStatusT-=dt;if(touchStatusT<=0){touchStatusT=.1;updateTouchStatus();updateScoutButton();storyButton()}
  try{render();drawFx3(now)}catch(err){ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';if(!window.__renderErr){window.__renderErr=err.message;console.error(err)}}
  statT+=dt;if(isDirty){isDirty=false;statT=0;renderPanel()}else if(statT>.25){statT=0;renderStats()}
  requestAnimationFrame(tick)}
if(matchMedia('(pointer:coarse)').matches)touchMode=true;
/* Title poster, shown once before hero selection. Play Game (or Enter) goes on to choosing a hero. */
const SPLASH=$('splash');
function splashOn(){return !!SPLASH&&!SPLASH.classList.contains('gone')}
function leaveSplash(){if(!splashOn())return;const b=$('spplay');if(b.classList.contains('go'))return;b.classList.add('go');
  setTimeout(()=>{SPLASH.classList.add('gone');titleMusic();if(G.mode!=='title')setMode('title');showModes();menuMusic()},350)}
function initSplash(){if(!SPLASH)return;const ims=[$('spposter'),$('spwords')];ims[0].src=TITLE_URLS.poster;SPLASH.style.setProperty('--poster','url('+TITLE_URLS.poster+')');ims[1].src=TITLE_URLS.words;
  /* Show the poster only once both pictures are decoded */
  Promise.all(ims.map(im=>im.decode?im.decode().catch(()=>{}):Promise.resolve())).then(()=>SPLASH.classList.add('ready'));
  /* The button letters are filled with stone cut from the DAYRIM letters, so they match the title */
  SPLASH.querySelector('.pg-t').style.backgroundImage='url('+TITLE_URLS.stone+'),linear-gradient(#d9cbb4,#8a7660)';
  audioOn();if(ac)ac.addEventListener('statechange',titleMusic);const b=$('spplay');b.addEventListener('click',leaveSplash);try{b.focus({preventScroll:true})}catch(e){}requestAnimationFrame(splashTick)}
/* Embers drift slowly up across the poster */
const spEmbers=[];let spLast=0;
function newEmber(){const a=Math.random();return{x:Math.random(),y:1.02,vx:(Math.random()-.5)*.02,vy:-.03-Math.random()*.06,life:0,max:6+Math.random()*8,r:.8+Math.random()*1.8,h:a<.8?24+Math.random()*24:275+Math.random()*20,w:Math.random()*6.28}}
function drawEmbers(cv,list,dt){const w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;const dpr=Math.min(2,devicePixelRatio||1);
  if(cv.width!==Math.round(w*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr)}const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);c.globalCompositeOperation='lighter';
  for(let i=list.length-1;i>=0;i--){const e=list[i];e.life+=dt;if(e.life>e.max){list.splice(i,1);continue}
    e.w+=dt*1.3;e.x+=(e.vx+Math.sin(e.w)*.008)*dt;e.y+=e.vy*dt;
    const k=1-e.life/e.max,al=Math.min(1,e.life*4)*k,x=e.x*w,y=e.y*h,r=e.r*1.2;
    const g=c.createRadialGradient(x,y,0,x,y,r*4);g.addColorStop(0,`hsla(${e.h},100%,75%,${al})`);g.addColorStop(.35,`hsla(${e.h},100%,55%,${al*.55})`);g.addColorStop(1,`hsla(${e.h},100%,45%,0)`);
    c.fillStyle=g;c.beginPath();c.arc(x,y,r*4,0,6.283);c.fill()}}
function splashTick(now){if(!splashOn())return;const dt=Math.min(.05,(now-(spLast||now))/1000);spLast=now;
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&Math.random()<dt*14)spEmbers.push(newEmber());
  drawEmbers($('spfx'),spEmbers,dt);requestAnimationFrame(splashTick)}
demoScene();resize();setMode('title');
initModes();initSplash();
window.__dayrim={get state(){return G},net,objTargets,get sound(){return{boss:bossMus&&bossMus.k,announced:[...(window.__annLog||[])],ambiencePlaying:!!ambSrcs,steps:(window.__stepLog||[]).length,loaded:Object.keys(SOUND_BUF),menuPlaying:!!menuSrc,firstBloodAt:firstBloodAt===-Infinity?null:Math.round(firstBloodAt),titlePlaying:!!titleSrc,titleGain:titleGain&&+titleGain.gain.value.toFixed(2),ambiencePlaying:!!ambSrcs,context:ac&&ac.state,muted}},enterStage,summonBoss,recalc,frame,SPECS,update,keys,mouse,doDash,usePotion,useFast,useMagic,setMode,newRun,gymCost,shopCost,SKILLS,dropLoot,VOICE_BUF,voice,doUlt,addRage,doMove,KIT_OF,KIT,spawnVillainPair,spawnMob,SHOP,GYM,recLevel,quota,xpNeed,STAGES,idx,MW,MH,T,dist,los,drawBossSprite,bossPose,drawBossDeath,doSpell,doHeal,wearBest,equipWeapon,weaponDamage,WEAPONS,METHODS,STATS,guardArmor,ROSTER,STORY,storyBegin,storyMap,storyDone,storyAct,dlgNext,dlgSkip,showModes,killEnemy};
requestAnimationFrame(tick);
