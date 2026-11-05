/* Paste into the browser console on the game page. Plays the real game logic at high speed and reports per-stage results. */
window.runBot=function(char,opts={}){
  const A=window.__dayrim;window.__botOn=true;A.newRun(char);A.setMode('play');
  const R={char,stages:[],deaths:0,simMin:0};let cur=null;const newCur=()=>cur={stage:A.state.stage,t0:simT,lvlIn:A.state.p.lvl,deaths:0,bossT:0,bossTries:0,kills0:A.state.p.kills};
  let simT=0,bfsT=0,dist2=null,target=null,inBoss=false;newCur();
  const dt=1/30;const maxT=opts.maxMin?opts.maxMin*60:60*240;
  const spend=()=>{const G=A.state,p=G.p,m0=A.WEAPONS[p.weapon].m,main=m0==='shoot'?'aim':m0==='spell'?'spell':'power',order=[main,'tough','guard','foot','crit','leech','focus','mend'];let g=0;
    while(p.sp>0&&g++<40){const s=order.find((id,i)=>(p.skills[id]||0)<Math.min(A.SKILLS.find(x=>x.id===id).max,Math.ceil(p.lvl/ (i<2?2:4))+1))||order.find(id=>(p.skills[id]||0)<A.SKILLS.find(x=>x.id===id).max);if(!s)break;p.sp--;p.skills[s]=(p.skills[s]||0)+1}
    const keep=()=>A.shopCost(A.SHOP[0]);
    while(p.potions<5&&p.gold>=keep()){p.gold-=keep();p.potions++}
    if(p.magic<2&&p.gold>=A.shopCost(A.SHOP[2])){p.gold-=A.shopCost(A.SHOP[2]);p.magic++}
    let gy=0;while(gy++<20){const id=A.GYM[gy%3].id,c=A.gymCost(p.train[id]||0);if(p.gold<c*1.2)break;p.gold-=c;p.train[id]=(p.train[id]||0)+1}
    A.wearBest();let bw=p.weapon,bv=0;for(const id of p.weapons){const W=A.WEAPONS[id];if(W.m==='spell')continue;const v=A.weaponDamage(id)/W.cd;if(v>bv){bv=v;bw=id}}if(bw!==p.weapon){p.weapon=bw}
    A.recalc()};
  const bfs=(G,tx,ty)=>{const{map}=G.w,d=new Int16Array(A.MW*A.MH).fill(-1),q=[];const s=A.idx(tx,ty);d[s]=0;q.push(s);let h=0;while(h<q.length){const c=q[h++],x=c%A.MW,y=c/A.MW|0;for(const[n,ok]of[[c-1,x>0],[c+1,x<A.MW-1],[c-A.MW,y>0],[c+A.MW,y<A.MH-1]])if(ok&&d[n]<0&&!map[n]){d[n]=d[c]+1;q.push(n)}}return d};
  while(simT<maxT){
    const G=A.state,p=G.p;
    if(G.mode==='dead'){R.deaths++;cur.deaths++;if(G.boss)cur.bossDeaths=(cur.bossDeaths||0)+1;A.enterStage(G.stage,true);p.hp=p.s.maxHp;p.mana=p.s.maxMana;p.fastT=p.magicT=0;A.setMode('play');spend();continue}
    if(G.mode==='clear'){cur.lvlOut=p.lvl;cur.gear=Object.values(p.gear).filter(Boolean).map(i=>i.rar).join('');cur.min=+((simT-cur.t0)/60).toFixed(1);cur.kills=p.kills-cur.kills0;cur.gold=Math.floor(p.gold);cur.bossSec=Math.round(cur.bossT/Math.max(1,cur.bossTries));R.stages.push(cur);if(G.stage>=10)break;A.enterStage(G.stage+1);A.setMode('play');newCur();spend();continue}
    if(G.mode!=='play')A.setMode('play');
    spend.c=(spend.c||0)+dt;if(spend.c>5){spend.c=0;spend()}
    const rec=A.recLevel(G.stage),ready=G.gate.open&&p.lvl>=rec+(opts.over||0);
    const boss=G.boss;let tgt=null;
    if(boss){tgt=boss;if(!inBoss){inBoss=true;cur.bossTries++}cur.bossT+=dt}else{inBoss=false;
      if(ready)tgt=G.gate;else{let b=1e9;for(const e of G.enemies){const d=A.dist(e,p);if(d<b){b=d;tgt=e}}}}
    bfsT-=dt;if(bfsT<=0&&tgt){bfsT=.4;dist2=bfs(G,Math.min(A.MW-1,tgt.x/A.T|0),Math.min(A.MH-1,tgt.y/A.T|0))}
    A.keys.clear();
    if(tgt){const d=A.dist(tgt,p),shootM=A.WEAPONS[p.weapon].m==='shoot',R0=A.WEAPONS[p.weapon].reach||60,want=tgt===G.gate?25:shootM?230:(boss?R0*.72+tgt.r*.6:32);
      const tx=p.x/A.T|0,ty=p.y/A.T|0;
      if(d>want){let bx=0,by=0,b=dist2?dist2[A.idx(tx,ty)]:1e9;if(dist2)for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=tx+dx,ny=ty+dy;if(nx<0||ny<0||nx>=A.MW||ny>=A.MH)continue;const v=dist2[A.idx(nx,ny)];if(v>=0&&v<b){b=v;bx=dx;by=dy}}
        const cx=(tx+bx+.5)*A.T,cy=(ty+by+.5)*A.T;bx=Math.abs(cx-p.x)>5?Math.sign(cx-p.x):0;by=Math.abs(cy-p.y)>5?Math.sign(cy-p.y):0;
        if(d<300&&A.los(p,tgt)){bx=Math.sign(tgt.x-p.x)*(Math.abs(tgt.x-p.x)>10?1:0);by=Math.sign(tgt.y-p.y)*(Math.abs(tgt.y-p.y)>10?1:0)}
        if(bx>0)A.keys.add('KeyD');if(bx<0)A.keys.add('KeyA');if(by>0)A.keys.add('KeyS');if(by<0)A.keys.add('KeyW')}
      A.mouse.x=tgt.x;A.mouse.y=tgt.y-22;A.mouse.sx=undefined;A.mouse.left=d<(shootM?400:R0+tgt.r+10)&&tgt!==G.gate;A.mouse.right=false;
      if(tgt!==G.gate&&d<320&&p.mana>40)A.doSpell();}
    // reactions a decent player would have
    const danger=G.enemies.some(e=>(e.wind>0&&e.wind<.2&&A.dist(e,p)<70)||(e.kind==='boss'&&((e.act==='slam'&&e.actT<.2)||e.act==='charge'&&A.dist(e,p)<120)));
    if(danger&&Math.random()<(opts.skill||.5)){A.keys.clear();A.keys.add(Math.random()<.5?'KeyA':'KeyD');A.doDash()}
    if(boss&&A.dist(boss,p)<300)A.doMove('special');
    if(p.rage>=100&&(boss||G.enemies.filter(e=>A.dist(e,p)<500).length>=3))A.doUlt();
    if(p.hp<p.s.maxHp*.42)A.usePotion();if(p.hp<p.s.maxHp*.6)A.doHeal();
    if(boss&&p.magic>0&&p.magicT<=0&&A.dist(boss,p)<260)A.useMagic();
    A.update(dt);simT+=dt;
  }
  R.simMin=+(simT/60).toFixed(0);R.final={lvl:A.state.p.lvl,stage:A.state.stage,beaten:A.state.p.beaten,dmg:Math.round(A.weaponDamage(A.state.p.weapon)),hp:Math.round(A.state.p.s.maxHp),arm:Math.round(A.state.p.s.armor)};window.__botOn=false;return R};
