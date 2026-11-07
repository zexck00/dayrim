/* ---------- Rendering ---------- */
const BCOL=[null,['#7a4a40','#5c352f','#3a2428'],['#5a6878','#435060','#2a3340'],['#8a7a5a','#6c5e44','#403a2c'],['#4a5a70','#364458','#20293a'],['#9a5a48','#7a4438','#3f2622'],['#606a60','#4a5249','#2c312c']];
function drawTiles(l,t,r,b){
  const {map,ground,deco,biome}=G.w,tm=G.t;
  for(let y=t;y<=b;y++)for(let x=l;x<=r;x++){
    const px=x*T,py=y*T;
    if(x<0||y<0||x>=MW||y>=MH){ctx.fillStyle=biome.w[2];ctx.fillRect(px,py,T+.5,T+.5);continue}
    const i=idx(x,y),d=deco[i];
    if(map[i]){
      const open=y+1<MH&&!map[idx(x,y+1)];
      ctx.fillStyle=open?biome.w[0]:biome.w[2];ctx.fillRect(px,py,T+.5,T+.5);
      if(open){ctx.fillStyle=biome.w[1];ctx.fillRect(px,py+4,T+.5,6);ctx.fillRect(px+(d%18),py+16,14,5);ctx.fillRect(px+(d%24)+6,py+28,10,4);ctx.fillStyle=biome.w[2];ctx.fillRect(px,py+36,T+.5,4);ctx.fillStyle=biome.leaf[d%3];ctx.fillRect(px,py,T+.5,5);ctx.fillRect(px+(d%30),py+5,6,4+(d%6))}
      else{ctx.fillStyle=biome.w[0];if(d%4===0)ctx.fillRect(px+(d%26),py+(d%24),10,8);ctx.fillStyle=biome.leaf[d%3];if(d%3===0)ctx.fillRect(px+(d%30),py+((d*3)%30),9,7)}
    }else{
      const g=ground[i];
      if(g===3||g===4){const wa=biome.wa,isW=n=>{const k=ground[n];return !map[n]&&(k===3||k===4)};
        ctx.fillStyle=wa[0];ctx.fillRect(px,py,T+.5,T+.5);
        // slow ripples, then a pale shore where the water meets land
        const ph=tm*1.6+d*.05;ctx.fillStyle=wa[1];ctx.fillRect(px+((d+tm*6)%34),py+6+(d%22),8,2);ctx.fillRect(px+((d*3+tm*4)%30),py+22+(d%12),6,2);
        ctx.fillStyle='rgba(255,255,255,'+(.07+.05*Math.sin(ph)).toFixed(3)+')';ctx.fillRect(px+(d%28),py+((d*5)%30),4,1);
        ctx.fillStyle=wa[2];ctx.globalAlpha=.55;if(!isW(i-1))ctx.fillRect(px,py,3,T);if(!isW(i+1))ctx.fillRect(px+T-3,py,3,T);if(!isW(i-MW))ctx.fillRect(px,py,T,3);if(!isW(i+MW))ctx.fillRect(px,py+T-3,T,3);ctx.globalAlpha=1;
        if(g===4){const across=isW(i-1)||isW(i+1)?0:1;ctx.fillStyle='rgba(5,10,20,.3)';ctx.fillRect(px+2,py+2,T-2,T-2);
          for(let k=0;k<5;k++){ctx.fillStyle=(k+d)%3?'#8a6840':'#7a5a38';if(across)ctx.fillRect(px+3+k*7,py+2,6,T-4);else ctx.fillRect(px+2,py+3+k*7,T-4,6)}
          ctx.fillStyle='#4a3420';if(across){ctx.fillRect(px+3,py+2,T-6,2);ctx.fillRect(px+3,py+T-4,T-6,2)}else{ctx.fillRect(px+2,py+3,2,T-6);ctx.fillRect(px+T-4,py+3,2,T-6)}}}
      else if(g===2){ctx.fillStyle=(x+y)%2?'#a89a7c':'#9c8e70';ctx.fillRect(px,py,T+.5,T+.5);ctx.fillStyle='rgba(40,34,24,.28)';ctx.fillRect(px,py,T,1);ctx.fillRect(px,py,1,T);if(d<40){ctx.fillStyle=biome.leaf[d%3];ctx.fillRect(px+(d%30),py+(d%32),7,3)}}
      else{ctx.fillStyle=g===1?biome.d:biome.g[0];ctx.fillRect(px,py,T+.5,T+.5);
        // soften edges against grass and paths with chunky dither
        if(g===1){ctx.fillStyle=biome.g[0];if(d%2)ctx.fillRect(px+(d%34),py,6,3);if(d%3===0)ctx.fillRect(px,py+(d%34),3,6);ctx.fillStyle='rgba(30,24,16,.3)';ctx.fillRect(px+(d%28),py+(d*3%30),5,3)}
        else{ctx.fillStyle=biome.g[1+d%2];ctx.fillRect(px+(d%26),py+(d*7%28),12,8);ctx.fillRect(px+(d*3%30),py+(d*11%32),7,5);ctx.fillStyle='rgba(255,255,255,.05)';ctx.fillRect(px+(d*5%34),py+(d*3%36),3,3);if(d>205){const sw=Math.sin(tm*2+x+y)*1.5;ctx.fillStyle=biome.leaf[d%3];ctx.fillRect(px+(d%32)+sw,py+(d%20)+10,2,6);ctx.fillRect(px+(d%32)+4+sw,py+(d%20)+12,2,4)}}
      }
      if(y>0&&map[idx(x,y-1)]){const gr=ctx.createLinearGradient(0,py,0,py+16);gr.addColorStop(0,'rgba(5,10,10,.5)');gr.addColorStop(1,'rgba(5,10,10,0)');ctx.fillStyle=gr;ctx.fillRect(px,py,T+.5,16)}
    }
  }
}
/* Solo keeps every step on G.obj; online the server sends only the current one as G.obj.cur. */
function objNow(){const o=G.obj;if(!o)return null;const st=o.steps&&o.steps[o.i];return st&&st.need?st:(o.cur||null)}
/* Objective props: hold zones, carriable items, the drop ring and the escort. */
function drawProp2(o){const tm=G.t;if(o.k==='zone'){const q=clamp((o.t||0)/zoneNeed(),0,1),col=o.d?'#5c7a68':'#6fdca0';ctx.save();ctx.globalAlpha=.5;ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,TAU);ctx.stroke();ctx.globalAlpha=.18;ctx.fillStyle=col;ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,TAU);ctx.fill();ctx.restore();if(q>0&&!o.d){ctx.strokeStyle='#bdf5d2';ctx.lineWidth=3;ctx.beginPath();ctx.arc(o.x,o.y,o.r+4,-Math.PI/2,-Math.PI/2+TAU*q);ctx.stroke()}if(!o.d){ctx.globalAlpha=.5+.3*Math.sin(tm*3);ctx.fillStyle='#6fdca0';ctx.fillRect(o.x-2,o.y-o.r-14,4,10);ctx.globalAlpha=1}}
  else if(o.k==='canister'){if(o.d)return;const lift=o.by?4:0;ctx.fillStyle='rgba(10,18,26,.35)';ctx.beginPath();ctx.ellipse(o.x,o.y+3,o.r,o.r*.45,0,0,TAU);ctx.fill();ctx.fillStyle='#8fd6ff';ctx.fillRect(o.x-6,o.y-16-lift,12,16);ctx.fillStyle='#2b4a63';ctx.fillRect(o.x-6,o.y-11-lift,12,3);ctx.fillStyle='#d8f2ff';ctx.fillRect(o.x-2,o.y-18-lift,4,3)}
  else if(o.k==='drop'){ctx.save();ctx.globalAlpha=.35+.2*Math.sin(tm*2.5);ctx.strokeStyle='#8fd6ff';ctx.lineWidth=3;ctx.setLineDash([7,7]);ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,TAU);ctx.stroke();ctx.restore()}
  else if(o.k==='pillar'){if(o.done){ctx.globalAlpha=.35;ctx.fillStyle='#5a7a8c';ctx.fillRect(o.x-9,o.y-8,18,8);ctx.globalAlpha=1;return}
    ctx.fillStyle='rgba(10,18,26,.4)';ctx.beginPath();ctx.ellipse(o.x,o.y+3,o.r*.9,o.r*.4,0,0,TAU);ctx.fill();
    const g=ctx.createLinearGradient(o.x,o.y-64,o.x,o.y);g.addColorStop(0,'#e8f8ff');g.addColorStop(.55,'#8fd6ff');g.addColorStop(1,'#2f6f8c');
    ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(o.x,o.y-66);ctx.lineTo(o.x+o.r*.55,o.y-40);ctx.lineTo(o.x+o.r*.4,o.y-2);ctx.lineTo(o.x-o.r*.4,o.y-2);ctx.lineTo(o.x-o.r*.55,o.y-40);ctx.closePath();ctx.fill();
    if((o.hits||[]).length){ctx.strokeStyle='#ffe27a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(o.x-8,o.y-44);ctx.lineTo(o.x+4,o.y-30);ctx.lineTo(o.x-3,o.y-16);ctx.stroke()}}
  else if(o.k==='escort'){ctx.fillStyle='rgba(10,18,26,.4)';ctx.beginPath();ctx.ellipse(o.x,o.y+4,o.r+6,o.r*.5,0,0,TAU);ctx.fill();ctx.fillStyle=o.d?'#5c7a68':'#b8863f';ctx.fillRect(o.x-o.r,o.y-10,o.r*2,16);ctx.fillStyle='#8fd6ff';ctx.beginPath();ctx.arc(o.x,o.y-16,5,0,TAU);ctx.fill();if(!o.d){ctx.fillStyle='#ffe9a8';ctx.globalAlpha=.6+.4*Math.sin(G.t*4);ctx.fillRect(o.x-3,o.y-24,6,6);ctx.globalAlpha=1}}}
function drawDecals(inV){const d=G.decals;if(!d)return;for(const o of d){if(!inV(o))continue;const base=o.col||(o.pool?'#5e0f16':'#7c141c'),hi=o.col?shade(o.col):'#8c1820',lo=o.col?shade(hi):'#6e1219';ctx.fillStyle=base;if(o.pool){const s=o.seed;ctx.beginPath();ctx.ellipse(o.x,o.y+2,o.r,o.r*.55,0,0,TAU);ctx.fill();ctx.fillStyle=hi;ctx.beginPath();ctx.ellipse(o.x-3,o.y,o.r*.6,o.r*.3,0,0,TAU);ctx.fill();for(let i=0;i<5;i++){const a=(s+i*53)%63/10;ctx.fillStyle=lo;ctx.fillRect(o.x+Math.cos(a)*o.r*1.2,o.y+Math.sin(a)*o.r*.7,3,3)}}else ctx.fillRect(o.x-o.r/2,o.y-o.r/3,o.r,o.r*.66)}}
function drawCar(c){ctx.save();ctx.translate(c.x,c.y);if(c.v)ctx.rotate(Math.PI/2);if(c.s<0)ctx.scale(-1,1);ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(-21,-8,44,20);ctx.fillStyle=c.col;ctx.fillRect(-22,-10,44,20);ctx.fillStyle='#22303c';ctx.fillRect(-8,-8,18,16);ctx.fillStyle=shade(c.col);ctx.fillRect(-4,-7,9,14);ctx.fillStyle='#fff6c0';ctx.fillRect(20,-8,2,4);ctx.fillRect(20,4,2,4);ctx.fillStyle='#d02020';ctx.fillRect(-22,-8,2,4);ctx.fillRect(-22,4,2,4);ctx.restore()}
function shadow(x,y,r){ctx.fillStyle='rgba(10,14,20,.34)';ctx.beginPath();ctx.ellipse(x,y+3,r*.95,r*.4,0,0,TAU);ctx.fill()}
function drawProp(o){
  const B=G.w.biome,t=G.t,sw=Math.sin(t*1.6+o.x*.04)*1.2;
  switch(o.t){
   case'tree':{shadow(o.x,o.y,20);ctx.fillStyle='#4a3524';ctx.fillRect(o.x-5,o.y-26,10,28);ctx.fillStyle='#35261a';ctx.fillRect(o.x+1,o.y-26,4,28);const c=B.leaf,v=o.v;[[0,-52,24,c[v]],[-16,-38,18,c[(v+1)%3]],[16,-38,18,c[(v+2)%3]],[-6,-66,17,c[(v+1)%3]],[8,-58,14,c[v]]].forEach(([ax,ay,r,col])=>{ctx.fillStyle=col;ctx.beginPath();ctx.arc(o.x+ax+sw,o.y+ay,r,0,TAU);ctx.fill()});ctx.fillStyle='rgba(255,255,255,.1)';ctx.beginPath();ctx.arc(o.x-6+sw,o.y-60,8,0,TAU);ctx.fill();break}
   case'shrub':{shadow(o.x,o.y,12);const c=B.leaf;[[-7,-9,8,c[o.v]],[7,-9,8,c[(o.v+1)%3]],[0,-15,9,c[(o.v+2)%3]]].forEach(([a,b,r,col])=>{ctx.fillStyle=col;ctx.beginPath();ctx.arc(o.x+a+sw*.6,o.y+b,r,0,TAU);ctx.fill()});ctx.fillStyle=B.flower[o.v];if(o.v===1){ctx.fillRect(o.x-5+sw,o.y-13,2,2);ctx.fillRect(o.x+4+sw,o.y-8,2,2)}break}
   case'thicket':{const c=B.leaf;for(let i=-3;i<=3;i++){const h=30+((i+4)*(o.v+2))%14;ctx.fillStyle=c[(i+4+o.v)%3];ctx.fillRect(o.x+i*5+sw*(h/14),o.y-h,4,h)}break}
   case'grass':{ctx.fillStyle=B.leaf[o.v];for(let i=-2;i<=2;i++){const h=6+((i+3)*o.v)%6;ctx.fillRect(o.x+i*3+sw*(h/8),o.y-h,2,h)}break}
   case'fern':{ctx.strokeStyle=B.leaf[o.v];ctx.lineWidth=2;ctx.lineCap='round';for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.quadraticCurveTo(o.x+i*4,o.y-12,o.x+i*8+sw,o.y-8+Math.abs(i));ctx.stroke()}break}
   case'flower':{ctx.fillStyle=B.leaf[0];ctx.fillRect(o.x,o.y-7,2,7);ctx.fillStyle=B.flower[o.v];ctx.fillRect(o.x-2+sw*.5,o.y-10,6,4);ctx.fillRect(o.x+sw*.5,o.y-12,2,8);ctx.fillStyle='#fff6c0';ctx.fillRect(o.x+sw*.5,o.y-9,2,2);break}
   case'mush':{ctx.fillStyle='#e8e0cc';ctx.fillRect(o.x-1,o.y-6,3,6);ctx.fillStyle=['#c0392f','#c88a30','#8a5ac8'][o.v];ctx.beginPath();ctx.ellipse(o.x,o.y-7,6,4,0,Math.PI,0);ctx.fill();break}
   case'rock':{shadow(o.x,o.y,9);ctx.fillStyle=B.w[1];ctx.beginPath();ctx.moveTo(o.x-10,o.y);ctx.lineTo(o.x-6,o.y-9);ctx.lineTo(o.x+3,o.y-11);ctx.lineTo(o.x+10,o.y);ctx.closePath();ctx.fill();ctx.fillStyle=B.w[0];ctx.fillRect(o.x+1,o.y-7,7,7);break}
   case'ruin':{shadow(o.x,o.y,14);const h=[46,30,58][o.v||0];ctx.fillStyle='#8a8678';ctx.fillRect(o.x-10,o.y-h,20,h);ctx.fillStyle='#6c685c';ctx.fillRect(o.x+3,o.y-h,7,h);ctx.fillStyle='#a8a494';ctx.fillRect(o.x-12,o.y-h-5,24,6);ctx.fillStyle=B.leaf[0];ctx.fillRect(o.x-10,o.y-h+6,6,14);ctx.fillRect(o.x-4,o.y-10,10,10);break}
   case'lamp':{shadow(o.x,o.y,8);ctx.fillStyle='#3a3630';ctx.fillRect(o.x-3,o.y-24,6,24);ctx.fillStyle='#55504a';ctx.fillRect(o.x-8,o.y-28,16,5);const fl=Math.sin(t*14+o.x)*2;ctx.fillStyle='#ff8a30';ctx.beginPath();ctx.moveTo(o.x-6,o.y-28);ctx.quadraticCurveTo(o.x+fl,o.y-46,o.x+6,o.y-28);ctx.fill();ctx.fillStyle='#ffe080';ctx.beginPath();ctx.moveTo(o.x-3,o.y-28);ctx.quadraticCurveTo(o.x+fl,o.y-38,o.x+3,o.y-28);ctx.fill();break}
  }
}
function poseOf(e,moving,attacking,facing){let anim='idle',f=Math.floor(G.t*2.4)%2,dir=dirOf(facing),flip=Math.cos(facing)<0;
  if(moving){anim='walk';f=Math.floor(e.walk||0)%4}
  return{anim,f,dir,flip:dir===2&&flip}}
/* Draw one frame from a villain's asset sheet, feet on the ground point */
function kitFrame(key,st,i,x,y,mirror,alpha,extra){const im=MOVE_IMG[key];if(!im||!im.complete||!im.naturalWidth)return false;const fr=MOVES[key].frames[st],f=fr[clamp(i,0,fr.length-1)],s=WS*(MOVES[key].scale[st]||1);ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.translate(x,y);if(mirror)ctx.scale(-1,1);if(alpha!==undefined)ctx.globalAlpha=alpha;if(extra)extra();ctx.drawImage(im,f[0],f[1],f[2],f[3],f[4]*s,f[5]*s,f[2]*s,f[3]*s);ctx.restore();return true}
/* The videos show no walking, dodging, pills or healing, so those are built from the real idle frames */
function drawKitActor(a,moving,walkT,face,opts={}){
  const key=opts.key,mv=a.mv,x=a.x,y=a.y+6,n=MOVES[key].frames.idle.length,idleI=Math.floor(G.t*9+(a.ph||0))%n,side=Math.cos(face)<0;
  shadow(a.x,a.y+4,20);
  if(mv){const fr=MOVES[key].frames[mv.id],i=Math.floor(mv.t/mv.dur*fr.length);kitFrame(key,mv.id,i,x,y,mv.mirror);
    if(key==='necro'&&mv.id==='special'&&i>=4&&i<=12){const dir=mv.side,len=240,sx=x+dir*(160),cy=y-48;ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createLinearGradient(sx,0,sx+dir*len,0);g.addColorStop(0,'rgba(170,255,210,.95)');g.addColorStop(1,'rgba(90,255,160,0)');ctx.fillStyle=g;const wob=Math.sin(G.t*40)*2;ctx.fillRect(Math.min(sx,sx+dir*len),cy-22-wob,len,44+wob*2);const g2=ctx.createLinearGradient(sx,0,sx+dir*len,0);g2.addColorStop(0,'rgba(255,255,255,.95)');g2.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g2;ctx.fillRect(Math.min(sx,sx+dir*len),cy-8,len,16);ctx.restore()}
    return}
  const dodge=a.dashT>0;
  if(dodge){const dx=a.dashX||0,dy=a.dashY||0;for(let i=3;i>=1;i--)kitFrame(key,'idle',0,x-dx*i*20,y-dy*i*20,dx<0,.16*(4-i)/1.3,()=>{ctx.rotate((dx>=0?1:-1)*.3)});kitFrame(key,'idle',0,x,y,dx<0,undefined,()=>{ctx.rotate((dx>=0?1:-1)*.3);ctx.scale(1.08,.9)});return}
  const im=MOVE_IMG[key];
  if(moving&&im&&im.complete){const fr=MOVES[key].frames.idle[idleI],s=WS*(MOVES[key].scale.idle||1),[fx,fy,fw,fh,ox,oy]=fr,hip=Math.round(fh*.56),sw=Math.sin(walkT),bob=Math.abs(sw)*-3,mid=-ox;ctx.save();ctx.imageSmoothingEnabled=true;ctx.translate(x,y);if(side)ctx.scale(-1,1);ctx.rotate(.05*Math.abs(Math.cos(face))+sw*.015);
    ctx.drawImage(im,fx,fy,fw,hip,ox*s,(oy*s)+bob,fw*s,hip*s);const Lw=clamp(mid,1,fw-1);ctx.drawImage(im,fx,fy+hip,Lw,fh-hip,ox*s+sw*3,(oy+hip)*s+bob-Math.max(0,sw)*5,Lw*s,(fh-hip)*s);ctx.drawImage(im,fx+Lw,fy+hip,fw-Lw,fh-hip,(ox+Lw)*s-sw*3,(oy+hip)*s+bob-Math.max(0,-sw)*5,(fw-Lw)*s,(fh-hip)*s);ctx.restore()}
  else kitFrame(key,'idle',idleI,x,y,side);
  if(a.flash>0||a.hitT>0){ctx.globalCompositeOperation='lighter';kitFrame(key,'idle',idleI,x,y,side,.6);ctx.globalCompositeOperation='source-over'}
  if(a.healFx>0){const q=a.healFx/.8;ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(110,240,160,'+q+')';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(a.x,a.y,34*(1.4-q),16*(1.4-q),0,0,TAU);ctx.stroke();for(let i=0;i<4;i++){const py=a.y-(1-q)*90-i*18,px=a.x+Math.sin(i*2.1)*18;ctx.fillStyle='rgba(120,255,170,'+q+')';ctx.fillRect(px-1,py-5,3,10);ctx.fillRect(px-5,py-1,10,3)}ctx.restore()}
  if(a.pillT>0){const q=a.pillT/.8,c=a.pillC||'200,140,255';ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(a.x,a.y-50,4,a.x,a.y-50,70);g.addColorStop(0,'rgba('+c+','+(.5*q)+')');g.addColorStop(1,'rgba('+c+',0)');ctx.fillStyle=g;ctx.fillRect(a.x-70,a.y-120,140,140);ctx.restore();ctx.fillStyle='rgb('+c+')';ctx.fillRect(a.x-6,a.y-96-(1-q)*16,6,5);ctx.fillStyle='#fff';ctx.fillRect(a.x,a.y-96-(1-q)*16,6,5)}
}
function drawHazard(h){const q=clamp(h.t/1.2,0,1),c=h.col,tm=G.t;ctx.save();ctx.globalAlpha=.55*q;for(let i=0;i<9;i++){const a=i*.7+tm*.4,R=h.r*(.25+((i*37)%70)/100),px=h.x+Math.cos(a)*R,py=h.y+Math.sin(a)*R*.5,r=h.r*.3+Math.sin(tm*2+i)*2;ctx.fillStyle=i%2?'rgba('+c+',.55)':'rgba(70,150,40,.5)';ctx.beginPath();ctx.ellipse(px,py-6,r,r*.65,0,0,TAU);ctx.fill()}ctx.restore()}
function drawTag(q){const y=q.y-(kitOf(q)?112:66);ctx.textAlign='center';ctx.font='700 12px Barlow,sans-serif';ctx.lineWidth=3;ctx.strokeStyle='rgba(5,10,20,.9)';const t=(q.pname||'Player')+' · '+q.lvl;ctx.strokeText(t,q.x,y-5);ctx.fillStyle='#8fe0ff';ctx.fillText(t,q.x,y-5);ctx.fillStyle='rgba(5,10,20,.85)';ctx.fillRect(q.x-22,y-2,44,5);ctx.fillStyle='#d8483c';ctx.fillRect(q.x-21,y-1,42*clamp(q.hp/(q.s.maxHp||1),0,1),3)}
function drawDowned(p){const r=G.players.find(q=>q.reviveTarget===p.id&&q.reviveProgress>0);ctx.textAlign='center';ctx.font='700 14px Barlow,sans-serif';ctx.lineWidth=4;ctx.strokeStyle='#101019';const t=r?'Reviving '+Math.round(r.reviveProgress*100)+'%':'Down · '+Math.ceil(p.deadT)+'s';ctx.strokeText(t,p.x,p.y-125);ctx.fillStyle='#ffcf65';ctx.fillText(t,p.x,p.y-125)}
function drawPlayer(p){
  if(kitOf(p)){drawKitActor(p,p.moving&&!p.mv,p.walk,p.moving&&touchMode&&p.moveA!==undefined?p.moveA:p.face,{key:kitOf(p)});if(p.guard){ctx.strokeStyle='rgba(150,190,240,.85)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y-40,42,p.face-1,p.face+1);ctx.stroke()}return}
  shadow(p.x,p.y,p.r+2);
  const blink=p.inv>0&&p.dashT<=0&&Math.floor(G.t*22)%2===0;let anim='idle',f=Math.floor(G.t*2.4)%2,face=p.face,rot=0;
  if(p.dashT>0){anim='dodge';f=0;const a=Math.atan2(p.dashY,p.dashX);face=a;rot=(1-p.dashT/.26)*TAU*(Math.cos(a)<0?-1:1);for(let i=0;i<2;i++)G.fx.push({k:'p',x:p.x+rnd(-8,8),y:p.y+rnd(-2,4),vx:-p.dashX*50,vy:rnd(-20,5),t:.25,m:.25,c:'#c8c8c0',s:rnd(2,4)})}
  else if(p.hitT>0){anim='hit';f=0}
  else if(p.guard){anim='guard';f=0}
  else if(p.castT>0){anim='cast';f=p.castT>.2?0:1}
  else if(p.atkT>0){anim='attack';f=clamp(Math.floor((1-p.atkT/(p.atkDur||.3))*3),0,2)}
  else if(p.pickT>0){anim='pickup';f=clamp(Math.floor((1-p.pickT/.45)*3),0,2)}
  else if(p.moving){anim='walk';f=Math.floor(p.walk)%4;if(touchMode&&p.moveA!==undefined&&!touchHold.slash)face=p.moveA}
  const dir=(anim==='dodge')?2:dirOf(face),flip=dir===2&&Math.cos(face)<0;
  if(p.fastT>0&&Math.random()<.4)G.fx.push({k:'p',x:p.x,y:p.y-20,vx:0,vy:-20,t:.3,m:.3,c:'#6fb4ff',s:3});
  if(p.magicT>0&&Math.random()<.4)G.fx.push({k:'p',x:p.x+rnd(-12,12),y:p.y-rnd(0,50),vx:0,vy:-30,t:.4,m:.4,c:'#c88cff',s:3});
  if(p.castT>0&&Math.random()<.6)G.fx.push({k:'p',x:p.x+rnd(-14,14),y:p.y-rnd(0,56),vx:0,vy:-34,t:.4,m:.4,c:'#e0c8ff',s:2.5});
  blit(ctx,p.char,p.x,p.y,dir,anim,f,flip,rot,blink?.5:undefined,p.weapon);
  if(p.guard){const on=p.weapon==='shield'?'120,200,255':'150,190,240';ctx.strokeStyle='rgba('+on+',.85)';ctx.lineWidth=p.weapon==='shield'?5:3;ctx.lineCap='round';ctx.beginPath();ctx.arc(p.x,p.y-24,30,p.face-1,p.face+1);ctx.stroke();ctx.fillStyle='rgba('+on+',.1)';ctx.beginPath();ctx.ellipse(p.x,p.y-24,30,36,0,0,TAU);ctx.fill()}
  if(p.swing>0){const q=1-p.swing/.17,st=p.swingA-(p.swingArc||1.1),en=st+2*(p.swingArc||1.1)*q,R=(p.swingR||60)*.9,cy=p.y-24;const SW={axe:'255,120,50',cleaver:'240,70,70',bat:'255,220,130',knife:'200,240,255',sword:'190,110,255',scythe:'110,255,170',hammer:'255,170,70',trident:'110,230,255',spear:'255,240,190',fists:'255,255,255'}[p.weapon]||'230,240,255';ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';[[14,.28],[8,.55],[3,1]].forEach(([lw,al])=>{ctx.strokeStyle='rgba('+SW+','+(al*(1-q*.55)).toFixed(2)+')';ctx.lineWidth=lw*(1-q*.4);ctx.beginPath();ctx.arc(p.x,cy,R,st+Math.max(0,q-.45)*2*(p.swingArc||1.1),en);ctx.stroke()});ctx.restore();if(Math.random()<.8)glowP(p.x+Math.cos(en)*R,cy+Math.sin(en)*R,SW,2,120,.3,3)}
}
function drawMob(e){
  shadow(e.x,e.y,e.r+2);
  if(e.wind>0){const R=e.a.range+e.r+12;ctx.fillStyle='rgba(240,80,60,.3)';ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.arc(e.x,e.y,R,e.ang-1.2,e.ang+1.2);ctx.closePath();ctx.fill()}
  const P={sx:1,sy:1,rot:e.atkShow>0?.14:e.wind>0?-.08:0,dy:e.wind>0?-3:0,arm:e.wind>0?1:0,glow:e.wind>0?.25:0,shake:0,walk:e.moving?1:0,rise:1,tint:0};
  drawBossSprite(ctx,e,G.t,P);
  if(e.hp<e.maxHp||e.aware){const w=e.r*2.8,y=e.y-e.ah-6;ctx.fillStyle='rgba(5,10,20,.8)';ctx.fillRect(e.x-w/2,y,w,4);ctx.fillStyle=e.mob==='strong'?'#e8c95c':'#e8463f';ctx.fillRect(e.x-w/2,y,w*Math.max(0,e.hp/e.maxHp),4)}
}
function drawCombatMarker(e){const status=e.healWind>0?'HEALING · Q TO INTERRUPT':e.exposedT>0?'OPEN':e.brokenT>0?'BROKEN':e.markT>0?'MARKED':e.role==='healer'?'HEALER':e.role==='brute'?'BRUTE':e.role==='rusher'?'RUSHER':e.role==='shooter'?'SHOOTER':e.role==='caster'?'CASTER':e.role==='guard'?'GUARD':e.role==='stalker'?'STALKER':e.statusT>0?'STATUS':e.tauntT>0?'TAUNTED':'';if(!status)return;ctx.textAlign='center';ctx.font='700 12px Barlow,sans-serif';ctx.lineWidth=3;ctx.strokeStyle='rgba(5,10,20,.9)';ctx.strokeText(status,e.x,e.y-(e.ah||74)-20);ctx.fillStyle=e.healWind>0?'#80e5aa':e.exposedT>0?'#ffe27a':'#bcd9ee';ctx.fillText(status,e.x,e.y-(e.ah||74)-20);if(e.statusT>0&&e.statusType){const t=e.statusType+' '+Math.ceil(e.statusT)+'s';ctx.font='600 10px Barlow,sans-serif';ctx.fillStyle='#80eaff';ctx.fillText(t,e.x,e.y-(e.ah||74)-8)}if(e.tauntT>0){ctx.fillStyle='#ffd166';ctx.fillText('Taunted '+Math.ceil(e.tauntT)+'s',e.x,e.y-(e.ah||74)-48)}}
/* Who an enemy is coming for. Red means you, pale with a party number means an ally. */
function drawTargetMark(e){if(!e.aware||!e.targetId)return;const idx=G.players.findIndex(q=>(q.id||0)===e.targetId);if(idx<0)return;const mine=!!G.p&&(G.p.id||0)===e.targetId,x=e.x,y=e.y-(e.ah||74)-38+Math.sin(G.t*7+e.x*.3)*1.5;ctx.beginPath();ctx.moveTo(x-6,y-4);ctx.lineTo(x+6,y-4);ctx.lineTo(x,y+4);ctx.closePath();ctx.globalAlpha=mine?.95:.5;ctx.fillStyle=mine?'#ff5a4a':'#8fd4ff';ctx.fill();ctx.globalAlpha=1;if(!mine&&G.players.length>1){ctx.font='700 10px Barlow,sans-serif';ctx.textAlign='center';ctx.fillStyle='#8fd4ff';ctx.fillText(String(idx+1),x,y-6)}}
function drawRival(e){
  if(e.art)return drawMob(e);
  if(e.vill){drawKitActor(e,e.moving,e.walk,e.ang,{key:KIT_OF[e.name]});const w=56,y=e.y-112;ctx.fillStyle='rgba(5,10,20,.8)';ctx.fillRect(e.x-w/2,y,w,5);ctx.fillStyle='#ff4a6a';ctx.fillRect(e.x-w/2,y,w*Math.max(0,e.hp/e.maxHp),5);return}
  shadow(e.x,e.y,e.r);
  if(e.elite){ctx.strokeStyle='rgba(232,201,92,'+(.5+.3*Math.sin((G.t+e.ph)*4)).toFixed(2)+')';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(e.x,e.y+2,e.r+7,(e.r+7)*.5,0,0,TAU);ctx.stroke()}
  if(e.wind>0){const R=e.a.range+e.r+12;ctx.fillStyle='rgba(240,80,60,.3)';ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.arc(e.x,e.y,R,e.ang-1.2,e.ang+1.2);ctx.closePath();ctx.fill()}
  let anim='idle',f=Math.floor((G.t+e.ph)*2.4)%2;
  if(e.castT>0){anim='cast';f=e.castT>.15?0:1}else if(e.guarding&&!e.moving){anim='guard';f=0}else if(e.wind>0){anim='attack';f=0}else if(e.atkShow>0){anim='attack';f=e.atkShow>.1?1:2}else if(e.moving){anim='walk';f=Math.floor(e.walk)%4}
  const dir=dirOf(e.ang),flip=dir===2&&Math.cos(e.ang)<0;
  blit(ctx,e.name,e.x,e.y,dir,anim,f,flip);
  if(e.flash>0){ctx.globalCompositeOperation='lighter';blit(ctx,e.name,e.x,e.y,dir,anim,f,flip,0,.7);ctx.globalCompositeOperation='source-over'}
  if(e.hp<e.maxHp||e.aware){const w=e.r*2.8,y=e.y-74;ctx.fillStyle='rgba(5,10,20,.8)';ctx.fillRect(e.x-w/2,y,w,4);ctx.fillStyle=e.elite?'#e8c95c':'#e8463f';ctx.fillRect(e.x-w/2,y,w*Math.max(0,e.hp/e.maxHp),4)}
}
/* Boss animation: the art is cut into a grid of cells, and each cell is moved by the monster's style and current pose. */
function bossPose(e){
  const P={sx:1,sy:1,rot:0,dy:0,arm:0,glow:0,shake:0,walk:0,rise:1,tint:0},k=(d)=>clamp(1-e.actT/d,0,1);
  switch(e.act){
    case'rise':P.rise=k(.95);P.sy=.82+.18*P.rise;P.sx=1.14-.14*P.rise;P.arm=P.rise>.65?(P.rise-.65)/.35:0;P.shake=1.5*(1-P.rise);break;
    case'walk':P.walk=e.moving?1:0;break;
    case'slam':{const q=k(.5),snap=q>.8?(1-q)/.2:1;P.sy=1+.13*q*snap;P.sx=1-.09*q*snap;P.dy=-13*q*snap;P.arm=q*snap;P.glow=q*.35;break}
    case'aim':{const q=k(.7);P.sy=1-.15*q;P.sx=1+.1*q;P.rot=-.13*q;P.glow=q*.6;P.shake=q*1.6;break}
    case'charge':P.sy=.9;P.sx=1.13;P.rot=.24;P.walk=2.6;P.glow=.3;break;
    case'nova':{const q=k(.6);P.sx=P.sy=1+.15*q;P.arm=q;P.glow=q;P.shake=q*1.3;break}
    case'call':{const q=k(.5);P.sy=1+.08*Math.sin(q*Math.PI);P.arm=Math.sin(q*Math.PI);P.rot=Math.sin(G.t*30)*.03;P.shake=1.5;P.glow=.25;break}
  }
  if(e.recover>0){const r=e.recover/.3;P.sy*=1-.24*r;P.sx*=1+.2*r;P.arm=0}
  if(e.release>0){const r=e.release/.25;P.sx*=1-.1*r;P.sy*=1-.1*r}
  if(e.recoil>0){P.rot-=.035*(e.recoil/.16);P.sx*=1-.02}
  if(e.hp!==undefined&&e.hp<e.maxHp*.5)P.tint=.1+.08*Math.sin(G.t*7);
  return P;
}
function paintBossCells(c,art,h,st,tm,P,seed,extra){
  const a=CAST[art],k=h/a.h,w=a.w*k,cols=12,rows=16,cw=a.w/cols,ch=a.h/rows,dw=w/cols,dh=h/rows,tq=st.jerk?Math.floor(tm/st.jerk)*st.jerk:tm;
  const walk=P.walk,ph=(seedPhase(seed)+tq*(walk?3.2*st.rate*(walk>1?1.7:1):0));
  for(let r=0;r<rows;r++)for(let q=0;q<cols;q++){
    const u=(q+.5)/cols,v=(r+.5)/rows;let dx=0,dy=0;
    if(st.step&&walk){const w2=clamp((v-st.legV)/(1-st.legV),0,1),left=u<.5,sn=Math.sin(ph);
      dy-=Math.max(0,left?sn:-sn)*st.step*w2*Math.min(walk,1.5);dx+=(left?sn:-sn)*st.step*.5*w2;
      dy+=(v<st.legV?Math.abs(sn)*-st.bob*1:0);if(st.sway)dx+=sn*st.sway*h*(1-v)}
    else if(st.bob)dy+=Math.sin(tq*2.4+seed)*st.bob*.45*(1-v);
    if(st.jitter&&walk&&v>st.legV)dx+=Math.sin(tq*40+q*2.1)*st.jitter;
    if(st.float)dy+=Math.sin(tq*2.3+seed)*st.float-st.float;
    if(st.wave){const am=st.wave*(v*v+.08)*(1+P.glow*.5);dx+=Math.sin(v*st.waveK-tq*3.2+u*2)*am;dy+=Math.cos(u*6+tq*2.2)*am*.2}
    if(st.radial){const ux=u-.5,uy=v-.5,d=Math.hypot(ux,uy),an=Math.atan2(uy,ux),edge=clamp((d-.26)/.24,0,1);const wr=Math.sin(an*5+tq*3.4)*st.radial*edge;dx+=Math.cos(an+1.57)*wr;dy+=Math.sin(an+1.57)*wr}
    if(st.arms&&P.arm){const side=clamp((Math.abs(u-.5)-.16)/.3,0,1),band=clamp(1-Math.abs(v-.4)/.28,0,1);dy-=P.arm*st.arms*side*band;dx+=(u<.5?-1:1)*P.arm*st.arms*.3*side*band}
    if(extra){const o=extra(u,v,q,r);dx+=o[0];dy+=o[1];if(o[2]!==undefined)c.globalAlpha=o[2]}
    c.drawImage(ATLAS,a.x+q*cw,a.y+r*ch,cw,ch,-w/2+q*dw+dx-.4,-h+r*dh+dy-.4,dw+.9,dh+.9);
  }
}
const seedPhase=s=>s*7.3;
function drawBossSprite(c,e,t,only){
  if(!ATLAS.complete||!ATLAS.naturalWidth)return;
  const st=BOSS_STYLE[STYLE_OF[e.art]],P=only||bossPose(e),h=e.ah,seed=e.ph||0;
  const target=(e.act==='charge'?Math.cos(e.ang)<0:G.p&&G.p.x<e.x)?-1:1;e.fs=(e.fs===undefined?target:e.fs+(target-e.fs)*.14);
  const tx=Math.abs(e.fs)<.25?(e.fs<0?-.25:.25):e.fs;
  const sh=P.shake?[rnd(-P.shake,P.shake),rnd(-P.shake,P.shake)]:[0,0];
  c.save();c.translate(e.x+sh[0],e.y+4+sh[1]);c.imageSmoothingEnabled=true;
  if(P.rise<1){const w=h*2;c.beginPath();c.rect(-w,-h*1.6,w*2,h*1.6+6);c.clip();c.translate(0,h*(1-P.rise)*.95)}
  c.scale(tx,1);c.rotate(P.rot);c.scale(P.sx,P.sy);c.translate(0,P.dy);
  // walk phase follows distance walked, so feet match ground speed
  const tm=(e.walk||0)*.31+0*t;
  const anim=(ca,extra)=>paintBossCells(ca,e.art,h,st,P.walk?tm:t,P,seed,extra);
  anim(c);
  if(e.flash>0||P.glow>0||P.tint>0){c.globalCompositeOperation='lighter';c.globalAlpha=Math.min(.9,(e.flash>0?.7:0)+P.glow*.32+P.tint);anim(c);c.globalCompositeOperation='source-over';c.globalAlpha=1}
  c.restore();
}
function drawBoss(e){
  if(!e.buried)shadow(e.x,e.y,(e.r+8)*(e.act==='rise'?clamp(1-e.actT/.95,.2,1):1));
  /* One telegraph renderer for every boss attack: the marked area fills as the timer runs out. */
  if(e.tel){const q=clamp(1-(e.actT||0)/e.tel.dur,0,1);
    if(e.tel.k==='cone'){ctx.save();ctx.globalAlpha=.16+.3*q;ctx.fillStyle='#90e0ff';ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.arc(e.x,e.y,e.tel.r,e.ang-.5,e.ang+.5);ctx.closePath();ctx.fill();ctx.restore();
      ctx.strokeStyle='rgba(160,235,255,.7)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(e.ang-.5)*e.tel.r,e.y+Math.sin(e.ang-.5)*e.tel.r);ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(e.ang+.5)*e.tel.r,e.y+Math.sin(e.ang+.5)*e.tel.r);ctx.stroke()}
    else if(e.tel.k==='circle'){ctx.fillStyle='rgba(240,80,60,'+(.1+.24*q).toFixed(2)+')';ctx.beginPath();ctx.ellipse(e.x,e.y,e.tel.r,e.tel.r*.7,0,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,168,120,'+(.35+.55*q).toFixed(2)+')';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(e.x,e.y,e.tel.r*(.3+.7*q),e.tel.r*.7*(.3+.7*q),0,0,TAU);ctx.stroke()}
    else{ctx.save();ctx.globalAlpha=.26+.42*q;ctx.strokeStyle='#f0805c';ctx.lineCap='butt';ctx.lineWidth=e.r*1.4;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(e.ang)*e.tel.r,e.y+Math.sin(e.ang)*e.tel.r);ctx.stroke();ctx.restore()}}
  if(!e.buried){(e.trail||[]).forEach((o,i)=>{ctx.globalAlpha=.1+.06*i;drawBossSprite(ctx,Object.assign({},e,{x:o.x,y:o.y,flash:0,hp:undefined}),G.t);ctx.globalAlpha=1});
  drawBossSprite(ctx,e,G.t)}
}
function drawBossDeath(f){
  if(!ATLAS.complete||!ATLAS.naturalWidth)return;
  const q=1-f.t/f.m,st=BOSS_STYLE[STYLE_OF[f.art]],sn=q<.28;
  ctx.save();ctx.translate(f.x+(sn?rnd(-3,3):0),f.y+4);ctx.imageSmoothingEnabled=true;ctx.scale(f.fs<0?-1:1,1);
  const P={sx:1,sy:1,rot:0,dy:0,arm:sn?q/.28:0,glow:0,shake:0,walk:0,rise:1,tint:0},b=clamp((q-.28)/.72,0,1);
  paintBossCells(ctx,f.art,f.ah,st,G.t,P,1,(u,v,c,r)=>{const j=Math.sin(c*12.9+r*78.2)*43758.5,rn=j-Math.floor(j),an=Math.atan2(v-.55,u-.5),sp=f.ah*(.35+rn*.9);return[Math.cos(an)*sp*b,Math.sin(an)*sp*b-f.ah*.4*b+f.ah*1.2*b*b,clamp(1-b*(1+rn*.5),0,1)]});
  if(sn){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55*q/.28;paintBossCells(ctx,f.art,f.ah,st,G.t,P,1);ctx.globalCompositeOperation='source-over'}
  ctx.globalAlpha=1;ctx.restore();
}
function drawNpc(c){shadow(c.x,c.y,9);const a=(c.dx||c.dy)?Math.atan2(c.dy,c.dx):Math.PI/2,dir=dirOf(a),walking=c.dx||c.dy,hurt=c.flash>0;blit(ctx,c.art||c.name,c.x,c.y,dir,hurt?'hit':walking?'walk':'idle',hurt?0:walking?Math.floor(c.walk)%4:Math.floor(G.t*2)%2,dir===2&&c.dx<0);
  if(c.hp<c.maxHp){const w=24,y=c.y-74;ctx.fillStyle='rgba(5,10,20,.8)';ctx.fillRect(c.x-w/2,y,w,3);ctx.fillStyle='#6fdca0';ctx.fillRect(c.x-w/2,y,w*Math.max(0,c.hp/c.maxHp),3)}
  if(c.qt>0){ctx.font='600 12px Barlow,sans-serif';ctx.textAlign='center';const tw=ctx.measureText(c.quip).width;ctx.fillStyle='rgba(255,255,255,.92)';ctx.fillRect(c.x-tw/2-5,c.y-90,tw+10,17);ctx.fillStyle='#20242e';ctx.fillText(c.quip,c.x,c.y-77)}}
function drawShot(s){
  const c=s.col||'255,200,120',f=s.fx||'bullet',a=Math.atan2(s.vy,s.vx),X=s.x,Y=s.y;
  const glow=(R,al,col=c)=>{const g=ctx.createRadialGradient(X,Y,1,X,Y,R);g.addColorStop(0,'rgba('+col+','+al+')');g.addColorStop(1,'rgba('+col+',0)');ctx.fillStyle=g;ctx.fillRect(X-R,Y-R,R*2,R*2)};
  ctx.save();ctx.globalCompositeOperation='lighter';
  if(s.piercing){ctx.save();ctx.translate(X,Y);ctx.rotate(a);ctx.strokeStyle='rgba(135,235,255,.85)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(reduced?-14:-30,0);ctx.lineTo(-5,0);ctx.stroke();ctx.restore()}
  const sp=s.spin||0;
  if(f==='bullet'||f==='tracer'){const L=f==='tracer'?46:26;ctx.translate(X,Y);ctx.rotate(a);const g=ctx.createLinearGradient(-L,0,4,0);g.addColorStop(0,'rgba('+c+',0)');g.addColorStop(1,'rgba('+c+',1)');ctx.fillStyle=g;ctx.fillRect(-L,-1.5,L+4,3);ctx.fillStyle='#fff';ctx.fillRect(-4,-1,8,2)}
  else if(f==='plasma'){glow(20,.7);ctx.translate(X,Y);ctx.rotate(a);ctx.fillStyle='rgba('+c+',.8)';ctx.fillRect(-22,-3,26,6);ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(0,0,8,4,0,0,TAU);ctx.fill()}
  else if(f==='arrow'){ctx.globalCompositeOperation='source-over';ctx.translate(X,Y);ctx.rotate(a);ctx.fillStyle='rgba(255,240,180,.35)';ctx.fillRect(-34,-1,22,2);ctx.fillStyle='#8a5a30';ctx.fillRect(-14,-1,20,2);ctx.fillStyle='#d8e0e8';ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(3,-4);ctx.lineTo(3,4);ctx.closePath();ctx.fill();ctx.fillStyle='#e8e4d8';ctx.fillRect(-16,-4,5,2);ctx.fillRect(-16,2,5,2)}
  else if(f==='flash'){glow(26,.9,'255,255,240');ctx.translate(X,Y);ctx.rotate(sp);ctx.fillStyle='#fff';for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.fillRect(0,-1,16,2)}}
  else if(f==='comet'){glow(30,.75);ctx.translate(X,Y);ctx.rotate(a);const g=ctx.createLinearGradient(-44,0,6,0);g.addColorStop(0,'rgba('+c+',0)');g.addColorStop(1,'rgba('+c+',.9)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-44,0);ctx.lineTo(4,-8);ctx.lineTo(4,8);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(2,0,6,0,TAU);ctx.fill();ctx.rotate(sp);ctx.strokeStyle='rgba('+c+',.9)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,14,5,0,0,TAU);ctx.stroke()}
  else if(f==='orb'||f==='arcane'){glow(24,.7);ctx.translate(X,Y);ctx.rotate(sp);ctx.fillStyle='rgba('+c+',1)';ctx.beginPath();ctx.arc(0,0,6,0,TAU);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-1,-1,2.6,0,TAU);ctx.fill();ctx.strokeStyle='rgba('+c+',.9)';ctx.lineWidth=2;if(f==='arcane'){for(let i=0;i<3;i++){ctx.rotate(TAU/3);ctx.fillStyle='rgba('+c+',1)';ctx.fillRect(10,-2,4,4)}ctx.beginPath();ctx.arc(0,0,11,0,TAU);ctx.stroke()}else{ctx.beginPath();ctx.arc(0,0,11,0,4);ctx.stroke()}}
  else if(f==='ember'){glow(22,.75);ctx.translate(X,Y);ctx.rotate(a);ctx.fillStyle='#ff7a28';ctx.beginPath();ctx.moveTo(8,0);ctx.quadraticCurveTo(-2,-8,-16+Math.sin(sp*2)*3,0);ctx.quadraticCurveTo(-2,8,8,0);ctx.fill();ctx.fillStyle='#ffe080';ctx.beginPath();ctx.arc(2,0,3.5,0,TAU);ctx.fill()}
  else if(f==='skull'){glow(24,.7);ctx.globalCompositeOperation='source-over';ctx.translate(X,Y);ctx.fillStyle='#e8e0cc';ctx.beginPath();ctx.arc(0,-1,6,0,TAU);ctx.fill();ctx.fillRect(-3,3,6,4);ctx.fillStyle='rgba('+c+',1)';ctx.fillRect(-4,-3,3,3);ctx.fillRect(1,-3,3,3)}
  else if(f==='flask'){glow(18,.5);ctx.globalCompositeOperation='source-over';ctx.translate(X,Y);ctx.rotate(sp);ctx.fillStyle='rgba(200,230,240,.9)';ctx.fillRect(-2,-9,4,5);ctx.fillStyle='rgb('+c+')';ctx.beginPath();ctx.arc(0,0,6,0,TAU);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(-3,-3,2,2)}
  else if(f==='card'){glow(16,.5);ctx.globalCompositeOperation='source-over';ctx.translate(X,Y);ctx.rotate(sp);ctx.fillStyle='#f2ecd8';ctx.fillRect(-5,-7,10,14);ctx.fillStyle='#c8282a';ctx.beginPath();ctx.arc(0,0,3,0,TAU);ctx.fill()}
  ctx.restore();
}
function drawFxTop(){
  {const p=G.p;if(p.rage>=100&&!G.p.ult){const q=.5+.5*Math.sin(G.t*7),[,c]=ultOf(p);ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba('+c+','+(.35+.5*q)+')';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y+3,26+q*7,12+q*3,0,0,TAU);ctx.stroke();ctx.restore();if(Math.random()<.5)glowP(p.x+rnd(-20,20),p.y-rnd(0,70),c,1,30,.5,3)}}
  G.fx.forEach(f=>{
    if(f.k==='pierceFx'){ctx.save();ctx.globalAlpha=clamp(f.t/f.m,0,1);ctx.translate(f.x,f.y);ctx.rotate(f.a);ctx.strokeStyle='#a7f2ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-6,-6);ctx.lineTo(1,0);ctx.lineTo(-6,6);ctx.moveTo(2,-6);ctx.lineTo(9,0);ctx.lineTo(2,6);ctx.stroke();ctx.restore()}
    else if(f.k==='shieldFx'){ctx.save();ctx.globalAlpha=clamp(f.t/f.m,0,1);ctx.translate(f.x,f.y);ctx.rotate(f.a);ctx.strokeStyle='#a7dfff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-5,-12);ctx.lineTo(8,-9);ctx.lineTo(11,0);ctx.lineTo(8,9);ctx.lineTo(-5,12);ctx.closePath();ctx.stroke();ctx.restore()}
    else if(f.k==='healLink'){ctx.save();ctx.globalAlpha=clamp(f.t/f.m,0,1)*(reduced?.65:.9);ctx.strokeStyle='#80e5aa';ctx.lineWidth=reduced?2:3;ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(f.x2,f.y2);ctx.stroke();ctx.fillStyle='#d6ffe3';ctx.beginPath();ctx.arc(f.x2,f.y2,4,0,TAU);ctx.fill();ctx.restore()}
    else if(f.k==='g'){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=clamp(f.t/f.m,0,1);ctx.fillStyle='rgb('+f.c+')';ctx.fillRect(f.x-f.s/2,f.y-f.s/2,f.s,f.s);ctx.restore()}
    else if(f.k==='muz'){const q=f.t/f.m;ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(f.x,f.y);ctx.rotate(f.a);ctx.fillStyle='rgba(255,220,120,'+q+')';const L=(f.big?30:20)*q+6;ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(L,0);ctx.lineTo(0,5);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(-2,-2,6,4);ctx.restore()}
    else if(f.k==='nova'){const q=1-f.t/f.m,R=f.r*q+6;ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(f.x,f.y);ctx.rotate(f.a);ctx.globalAlpha=1-q;ctx.strokeStyle='rgb('+f.c+')';ctx.lineWidth=5*(1-q)+1;ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.stroke();ctx.fillStyle='rgb('+f.c+')';for(let i=0;i<8;i++){ctx.rotate(TAU/8);ctx.beginPath();ctx.moveTo(R*.4,-3);ctx.lineTo(R*1.25,0);ctx.lineTo(R*.4,3);ctx.closePath();ctx.fill()}const g=ctx.createRadialGradient(0,0,1,0,0,R);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba('+f.c+',0)');ctx.fillStyle=g;ctx.fillRect(-R,-R,R*2,R*2);ctx.restore()}
    else if(f.k==='pillar'){const q=f.t/f.m,w=f.w*(.4+q);ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createLinearGradient(0,f.y-520,0,f.y);g.addColorStop(0,'rgba('+f.c+',0)');g.addColorStop(1,'rgba('+f.c+','+q+')');ctx.fillStyle=g;ctx.fillRect(f.x-w,f.y-520,w*2,522);ctx.fillStyle='rgba(255,255,255,'+q+')';ctx.fillRect(f.x-w*.3,f.y-520,w*.6,522);ctx.beginPath();ctx.ellipse(f.x,f.y,w*1.8,w*.8,0,0,TAU);ctx.fill();ctx.restore()}
    else if(f.k==='blood'){ctx.fillStyle='#b01c26';ctx.fillRect(f.x-f.s/2,f.y+f.z-f.s/2,f.s,f.s)}
    else if(f.k==='gib'){ctx.save();ctx.translate(f.x,f.y+f.z);ctx.rotate(f.rot);ctx.globalAlpha=clamp(f.t/.2,0,1);ctx.fillStyle=f.col;ctx.fillRect(-f.s/2,-f.s/2,f.s,f.s*(f.kind==='arm'||f.kind==='leg'?2.2:1));ctx.fillStyle='#8c1820';ctx.fillRect(-f.s/2,f.s/4,f.s,2);if(f.kind==='head'){ctx.fillStyle=f.hair;ctx.fillRect(-f.s/2,-f.s/2,f.s,f.s/3);ctx.fillStyle='#151520';ctx.fillRect(-2,-1,1,1);ctx.fillRect(1,-1,1,1)}ctx.restore()}
  });
}

function drawLoot(l){const c=l.kind==='item'?RAR[l.item.rar].c:l.kind==='weapon'?'#f0c23c':l.kind==='gold'?'#e8c95c':l.kind==='potions'?'#ff6a7a':l.kind==='fast'?'#6fb4ff':'#c88cff',y=l.y-3+Math.sin(l.t*3)*1.8;
  if(l.kind==='weapon'){const owned=G.p.weapons.includes(l.w),W=WEAPONS[l.w];ctx.save();ctx.translate(l.x,y);ctx.scale(1.8,1.8);drawWeaponSprite(ctx,l.w==='fists'?'fist':l.w,-3,1,-.65,undefined,'#d9ac83');ctx.restore();if(!owned){ctx.font='700 12px Barlow,sans-serif';ctx.textAlign='center';const lb=W.n+' (power '+W.p+')',w=ctx.measureText(lb).width;ctx.fillStyle='rgba(6,10,20,.82)';ctx.fillRect(l.x-w/2-4,l.y-34,w+8,16);ctx.fillStyle='#f0c23c';ctx.fillText(lb,l.x,l.y-22)}return}
  if(l.kind==='item'){const g=ctx.createLinearGradient(0,l.y-54,0,l.y);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,c+'aa');ctx.fillStyle=g;ctx.fillRect(l.x-3,l.y-54,6,54);ctx.save();ctx.translate(l.x,y);ctx.rotate(.78);ctx.fillStyle=c;ctx.fillRect(-5,-5,10,10);ctx.fillStyle='#12203a';ctx.fillRect(-2,-2,4,4);ctx.restore();
    ctx.font='700 12px Barlow,sans-serif';ctx.textAlign='center';const w=ctx.measureText(l.item.name).width;ctx.fillStyle='rgba(6,10,20,.82)';ctx.fillRect(l.x-w/2-4,l.y-73,w+8,16);ctx.fillStyle=c;ctx.fillText(l.item.name,l.x,l.y-61)}
  else if(l.kind==='gold'){ctx.fillStyle=c;ctx.beginPath();ctx.arc(l.x-2,y,3.2,0,TAU);ctx.arc(l.x+3,y+2,3.2,0,TAU);ctx.fill()}
  else if(l.kind==='potions'){ctx.fillStyle=c;ctx.beginPath();ctx.arc(l.x,y+1,5.5,0,TAU);ctx.fill();ctx.fillStyle='#e8e4d8';ctx.fillRect(l.x-2,y-7,4,5)}
  else{ctx.fillStyle=c;ctx.fillRect(l.x-6,y-3,6,6);ctx.fillStyle='#fff';ctx.fillRect(l.x,y-3,6,6)}}
function drawSafe(){const s=G.safe,on=G.p.nearSafe;ctx.fillStyle=on?'rgba(111,220,160,.5)':'rgba(111,220,160,.28)';ctx.beginPath();ctx.ellipse(s.x,s.y,64,40,0,0,TAU);ctx.fill();ctx.strokeStyle='#6fdca0';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#223040';ctx.fillRect(s.x-52,s.y-66,104,20);ctx.fillStyle='#6fdca0';ctx.font='700 14px "Pixelify Sans",monospace';ctx.textAlign='center';ctx.fillText('SAFEHOUSE',s.x,s.y-51)}
function drawGate(){const g=G.gate;if(G.boss)return;const o=g.open,t=G.t;ctx.fillStyle=o?'rgba(232,70,63,.4)':'rgba(40,44,58,.65)';ctx.beginPath();ctx.ellipse(g.x,g.y,48,30,0,0,TAU);ctx.fill();ctx.strokeStyle=o?'#ff6a5f':'#5a6070';ctx.lineWidth=4;ctx.stroke();
  if(o){ctx.strokeStyle='rgba(255,200,190,.8)';ctx.lineWidth=2;for(let i=0;i<3;i++){const a=t*2+i*2.1;ctx.beginPath();ctx.ellipse(g.x,g.y,32,18,0,a,a+1.4);ctx.stroke()}}
  ctx.fillStyle='#223040';ctx.fillRect(g.x-52,g.y-60,104,20);ctx.fillStyle=o?'#ff8f80':'#a0a8b8';ctx.font='700 14px "Pixelify Sans",monospace';ctx.textAlign='center';ctx.fillText(o?'BOSS GATE':'LOCKED',g.x,g.y-45)}
function render(){
  const cam=G.cam,sx=G.shake>.05?rnd(-G.shake,G.shake):0,sy=G.shake>.05?rnd(-G.shake,G.shake):0,vw=W/zoom,vh=H/zoom;
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#22262e';ctx.fillRect(0,0,W,H);
  ctx.setTransform(zoom*dpr,0,0,zoom*dpr,(W/2-(cam.x+sx)*zoom)*dpr,(H/2-(cam.y+sy)*zoom)*dpr);
  const l=Math.floor((cam.x-vw/2)/T)-1,r=Math.ceil((cam.x+vw/2)/T)+1,t=Math.floor((cam.y-vh/2)/T)-1,b=Math.ceil((cam.y+vh/2)/T)+1;
  ctx.imageSmoothingEnabled=false;drawTiles(l,t,r,b);
  const inView=o=>o.x>cam.x-vw/2-90&&o.x<cam.x+vw/2+90&&o.y>cam.y-vh/2-60&&o.y<cam.y+vh/2+150;
  G.w.cars.forEach(c=>{if(inView(c))drawCar(c)});
  drawDecals(inView);
  G.fx.forEach(f=>{if(f.k==='corpse'){ctx.globalAlpha=clamp(f.t/1.5,0,1);blit(ctx,f.name,f.x,f.y,2,'ko',0,false,Math.PI/2);ctx.globalAlpha=1}});
  drawSafe();drawGate();
  for(const q of G.players){if(q.deadT>0||q.respawnT>0)continue;const a=auraOf(q);if(!a||!inView(q))continue;ctx.save();ctx.globalAlpha=.22;ctx.strokeStyle=a.col;ctx.lineWidth=2;ctx.setLineDash([8,8]);ctx.beginPath();ctx.arc(q.x,q.y,AURA_RADIUS,0,TAU);ctx.stroke();ctx.restore()}
  G.fx.forEach(f=>{if(f.k!=='p')return;ctx.globalAlpha=clamp(f.t/f.m,0,1);ctx.fillStyle=f.c;ctx.fillRect(f.x-f.s/2,f.y-f.s/2,f.s,f.s)});ctx.globalAlpha=1;
  G.fx.forEach(f=>{if(f.k==='ko')blit(ctx,f.name,f.x,f.y,2,'ko',0,false,Math.PI/2,clamp(f.t/f.m,0,1))});
  const list=[...G.enemies.filter(e=>!concealed(e,G.p)),...G.players.filter(q=>!(q.respawnT>0)),...G.loot,...G.npcs,...G.w.props.filter(inView)].filter(inView).sort((a,b)=>a.y-b.y);
  list.forEach(o=>{if(o.stats){drawPlayer(o);if(G.mp&&o!==G.p)drawTag(o);if(o.deadT>0)drawDowned(o)}else if(typeof o.t==='string')drawProp(o);else if(o.kind==='boss'){drawBoss(o);drawCombatMarker(o);drawTargetMark(o)}else if(o.kind==='rival'){drawRival(o);drawCombatMarker(o);drawTargetMark(o)}else if(o.name&&o.quip!==undefined)drawNpc(o);else drawLoot(o)});
  G.shots.forEach(drawShot);
  drawFxTop();
  (G.props||[]).forEach(o=>{if(inView(o))drawProp2(o)});
  (G.hazards||[]).forEach(h=>{if(inView(h))drawHazard(h)});
  G.fx.forEach(f=>{if(f.k==='bossdie')drawBossDeath(f);else if(f.k==='kitdie'){const n=MOVES[f.key].frames.defeated.length,el=f.m-f.t,i=Math.min(n-1,Math.floor(el/1.2*n));kitFrame(f.key,'defeated',i,f.x,f.y+6,f.mir,clamp(f.t/1,0,1))}});
  G.fx.forEach(f=>{if(f.k!=='ring')return;const q=reduced?.5:1-f.t/f.m;ctx.strokeStyle=f.c;ctx.globalAlpha=clamp(f.t/f.m,0,1);ctx.lineWidth=4;const R=f.r+(f.to-f.r)*q;ctx.beginPath();if(f.shape==='diamond'){ctx.moveTo(f.x,f.y-R);ctx.lineTo(f.x+R,f.y);ctx.lineTo(f.x,f.y+R);ctx.lineTo(f.x-R,f.y);ctx.closePath()}else ctx.arc(f.x,f.y,R,0,TAU);ctx.stroke();ctx.globalAlpha=1});
  // day and night lighting
  const n=nightness(G.hour),tint=tintOf(G.hour,n);
  if(tint.a>.01){ctx.fillStyle='rgba('+tint.c.join(',')+','+tint.a.toFixed(3)+')';ctx.fillRect(cam.x-vw,cam.y-vh,vw*2,vh*2)}
  if(n>.25){ctx.globalCompositeOperation='lighter';(G.shots||[]).forEach(s=>{if(inView(s)){const R=46,g0=ctx.createRadialGradient(s.x,s.y,1,s.x,s.y,R);g0.addColorStop(0,'rgba('+(s.col||'255,200,120')+','+(.35*n).toFixed(2)+')');g0.addColorStop(1,'rgba('+(s.col||'255,200,120')+',0)');ctx.fillStyle=g0;ctx.fillRect(s.x-R,s.y-R,R*2,R*2)}});const glow=(x,y,R,c,a)=>{const g=ctx.createRadialGradient(x,y,2,x,y,R);g.addColorStop(0,'rgba('+c+','+a+')');g.addColorStop(1,'rgba('+c+',0)');ctx.fillStyle=g;ctx.fillRect(x-R,y-R,R*2,R*2)};
    G.w.lamps.forEach(o=>{if(inView(o))glow(o.x+10,o.y-20,130,'255,210,130',(.28*n).toFixed(2))});
    G.w.cars.forEach(c=>{if(inView(c))glow(c.x+(c.v?0:Math.sign(c.s)*44),c.y+(c.v?Math.sign(c.s)*44:0),60,'255,245,190',(.28*n).toFixed(2))});
    glow(G.p.x,G.p.y-24,150,'170,190,230',(.2*n).toFixed(2));glow(G.safe.x,G.safe.y,110,'111,220,160',(.22*n).toFixed(2));if(G.gate.open&&!G.boss)glow(G.gate.x,G.gate.y,120,'255,90,80',(.3*n).toFixed(2));
    ctx.globalCompositeOperation='source-over'}
  ctx.textAlign='center';G.texts.forEach(x=>{ctx.globalAlpha=clamp(x.t/.35,0,1);ctx.font=(x.big?'700 18px':'700 14px')+' Barlow,sans-serif';ctx.lineWidth=3;ctx.strokeStyle='rgba(5,10,20,.9)';ctx.strokeText(x.s,x.x,x.y);ctx.fillStyle=x.c;ctx.fillText(x.s,x.x,x.y)});ctx.globalAlpha=1;
  hud();
  if(G.p.ult)drawUlt(G.p.ult);
  if(aimHidden()&&mouse.sx!==undefined)drawCrosshair();
}
/* In fullscreen play the system cursor is hidden, so the game draws where you aim */
function drawCrosshair(){const r=canvas.getBoundingClientRect(),x=mouse.sx-r.left,y=mouse.sy-r.top;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';const arms=c=>{ctx.strokeStyle=c;ctx.beginPath();for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){ctx.moveTo(x+a*5,y+b*5);ctx.lineTo(x+a*13,y+b*13)}ctx.stroke()};ctx.lineWidth=4;arms('rgba(5,10,20,.85)');ctx.lineWidth=2;arms('#f0c23c');ctx.fillStyle='#f0c23c';ctx.fillRect(x-1,y-1,2,2)}
/* Fullscreen ultimate: world dims and nearly stops, a character banner slashes across, then flash and shockwaves */
function drawUlt(u){
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=true;
  const T=u.t,c=u.col,hitT=ULT_HITS[0],cx=W/2,cy=H/2,R=Math.hypot(W,H)*.6,after=T-hitT;
  const dim=T<hitT?clamp(T/.12,0,1)*.74:clamp(.74*(1-after/.5),0,.74);
  ctx.fillStyle='rgba(6,2,14,'+dim+')';ctx.fillRect(0,0,W,H);
  ctx.save();ctx.globalCompositeOperation='lighter';
  // colored vignette for the whole move
  const fade=clamp((ULT_LEN-T)/.4,0,1),v=ctx.createRadialGradient(cx,cy,R*.35,cx,cy,R);v.addColorStop(0,'rgba('+c+',0)');v.addColorStop(1,'rgba('+c+','+(.55*fade)+')');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
  // speed lines rushing toward the center while it charges
  if(T<hitT+.15){const s=clamp(T/.2,0,1)*clamp((hitT+.15-T)/.15,0,1);ctx.translate(cx,cy);for(let i=0;i<54;i++){const a=(i*137.5+u.seed)*Math.PI/180,w=((i*7)%5+1)*.006,off=((T*2.4+i*.13)%1),r0=R*(.32+.68*(1-off));ctx.fillStyle='rgba('+(i%3?c:'255,255,255')+','+(.5*s)+')';ctx.beginPath();ctx.moveTo(Math.cos(a-w)*r0,Math.sin(a-w)*r0);ctx.lineTo(Math.cos(a+w)*r0,Math.sin(a+w)*r0);ctx.lineTo(Math.cos(a)*(r0+R*.5),Math.sin(a)*(r0+R*.5));ctx.fill()}ctx.translate(-cx,-cy)}
  // shockwave rings and rays after the hit
  ULT_HITS.forEach((h,i)=>{const q=(T-h)/.55;if(q<0||q>1)return;const rr=R*1.15*(1-Math.pow(1-q,3));ctx.strokeStyle='rgba('+c+','+(1-q)+')';ctx.lineWidth=26*(1-q)+2;ctx.beginPath();ctx.arc(cx,cy-20,rr,0,TAU);ctx.stroke();ctx.strokeStyle='rgba(255,255,255,'+(.8*(1-q))+')';ctx.lineWidth=6*(1-q)+1;ctx.beginPath();ctx.arc(cx,cy-20,rr*.94,0,TAU);ctx.stroke();ctx.translate(cx,cy-20);for(let k=0;k<16;k++){const a=k/16*TAU+u.seed+i;ctx.fillStyle='rgba('+c+','+(.7*(1-q))+')';ctx.beginPath();ctx.moveTo(Math.cos(a-.03)*20,Math.sin(a-.03)*20);ctx.lineTo(Math.cos(a+.03)*20,Math.sin(a+.03)*20);ctx.lineTo(Math.cos(a)*rr*1.1,Math.sin(a)*rr*1.1);ctx.fill()}ctx.translate(-cx,-cy+20)});
  ctx.restore();
  // diagonal banner with the character card and the attack's name
  if(T<hitT){const inn=clamp(T/.16,0,1),out=clamp((T-(hitT-.12))/.12,0,1),ease=1-Math.pow(1-inn,3),sl=(ease-1)*W*1.2+out*W*1.2,bh=Math.min(H*.46,210),by=cy-bh/2;
    ctx.save();ctx.translate(sl,0);ctx.beginPath();ctx.moveTo(-40,by+34);ctx.lineTo(W+40,by-34);ctx.lineTo(W+40,by+bh-34);ctx.lineTo(-40,by+bh+34);ctx.closePath();const g=ctx.createLinearGradient(0,0,W,0);g.addColorStop(0,'rgba('+c+',.95)');g.addColorStop(.55,'rgba(20,10,30,.96)');g.addColorStop(1,'rgba(8,4,16,.96)');ctx.fillStyle=g;ctx.fill();ctx.clip();
    const a=CAST[G.p.char];if(a&&ATLAS.complete){const ch=bh*1.3,cw=a.w/a.h*ch;ctx.drawImage(ATLAS,a.x,a.y,a.w,a.h,W*.06,cy-ch/2+10,cw,ch)}
    ctx.textAlign='left';const tx=W*.06+bh*1.05+14,sz=Math.min(54,Math.max(24,(W-tx)/Math.max(8,u.name.length)*1.45));ctx.font='700 '+Math.round(sz*.42)+'px "IBM Plex Mono",monospace';ctx.fillStyle='rgb('+c+')';ctx.fillText('ULTIMATE',tx,cy-sz*.55);ctx.font='700 '+Math.round(sz)+'px "Pixelify Sans",monospace';ctx.lineWidth=5;ctx.strokeStyle='rgba(0,0,0,.8)';ctx.strokeText(u.name,tx,cy+sz*.35);ctx.fillStyle='#fff';ctx.fillText(u.name,tx,cy+sz*.35);ctx.restore()}
  // flashes, softened for players who ask for reduced motion
  ULT_HITS.forEach((h,i)=>{const q=(T-h)/.2;if(q>=0&&q<1){ctx.fillStyle='rgba(255,255,255,'+((reduced?.25:(i?.45:.95))*(1-q))+')';ctx.fillRect(0,0,W,H)}});
}
function bar(x,y,w,h,v,c,label){ctx.fillStyle='rgba(5,10,20,.82)';ctx.fillRect(x,y,w,h);ctx.fillStyle=c;ctx.fillRect(x+2,y+2,(w-4)*clamp(v,0,1),h-4);if(label){ctx.font='500 11px "IBM Plex Mono",monospace';ctx.textAlign='left';ctx.fillStyle='#f2ecd8';ctx.fillText(label,x+7,y+h-5)}}
/* The HUD is laid out for about 640 tall and grows on larger screens, so it stays readable at Full HD and above */

/* Points at the current objective: a marker when it is in view, an arrow on the screen edge when it is not. */
function drawObjPointer(){
  if(!G.p)return;const list=objTargets();if(!list.length)return;
  const cam=G.cam,z=zoom/hudK,m=52,pad=74;
  for(const o of list){
    let sx=W/2+(o.x-cam.x)*z,sy=H/2+(o.y-cam.y)*z;
    const on=sx>m&&sx<W-m&&sy>m&&sy<H-m,d=Math.round(Math.hypot(o.x-G.p.x,o.y-G.p.y)/40),pulse=.55+.45*Math.sin(G.t*4),col='#8fe6b8';
    ctx.save();ctx.lineWidth=3;ctx.strokeStyle='rgba(5,10,20,.92)';ctx.font='700 12px "IBM Plex Mono",monospace';ctx.textAlign='center';
    if(on){
      const y=sy-40-5*Math.sin(G.t*3);
      ctx.globalAlpha=.9;ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(sx,y-8);ctx.lineTo(sx+7,y+1);ctx.lineTo(sx-7,y+1);ctx.closePath();ctx.fill();
      ctx.globalAlpha=.35+.45*pulse;ctx.beginPath();ctx.arc(sx,sy,Math.max(o.r||10,12),0,TAU);ctx.lineWidth=2;ctx.stroke();
      ctx.globalAlpha=1;const t=o.label+'  '+d+'m';ctx.strokeText(t,sx,y-13);ctx.fillStyle='#e6fff0';ctx.fillText(t,sx,y-13);
    }else{
      const cx=W/2,cy=H/2,a=Math.atan2(sy-cy,sx-cx),hw=W/2-pad,hh=H/2-pad;
      const k=Math.min(hw/Math.max(Math.abs(Math.cos(a)),1e-6),hh/Math.max(Math.abs(Math.sin(a)),1e-6));
      const ex=cx+Math.cos(a)*k,ey=cy+Math.sin(a)*k;
      ctx.translate(ex,ey);ctx.rotate(a);ctx.globalAlpha=.6+.4*pulse;ctx.fillStyle=col;
      ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(-7,9);ctx.lineTo(-7,-9);ctx.closePath();ctx.fill();
      ctx.rotate(-a);ctx.globalAlpha=1;const t=d+'m';ctx.strokeText(t,0,-16);ctx.fillStyle='#e6fff0';ctx.fillText(t,0,-16);
    }
    ctx.restore();
  }
}

let hudK=1;
function hud(){const w0=W,h0=H;W=w0/hudK;H=h0/hudK;try{hudBody()}finally{W=w0;H=h0}}
function hudBody(){
  ctx.setTransform(dpr*hudK,0,0,dpr*hudK,0,0);ctx.imageSmoothingEnabled=false;
  const p=G.p,small=W<560,bw=small?150:210,st=STAGES[G.stage-1],q=quota(G.stage),n=nightness(G.hour);if(!G.mp&&p.deadT>0){ctx.textAlign='center';ctx.font='700 22px Barlow,sans-serif';ctx.fillStyle='#ffcf65';ctx.fillText('Second Wind in '+Math.ceil(p.deadT),W/2,110)}
  const pad=(x,y,w,h)=>{ctx.fillStyle='rgba(5,10,20,.62)';ctx.fillRect(x,y,w,h)};pad(6,6,small?210:300,48);
  ctx.textAlign='left';ctx.font='700 '+(small?15:19)+'px "Pixelify Sans",monospace';ctx.fillStyle='#f2ecd8';ctx.fillText('Stage '+G.stage+': '+st.n,12,25);
  ctx.font='600 13px Barlow,sans-serif';ctx.fillStyle=G.gate.open?'#ff8f80':'#d0d8e8';
  const cur=objNow(),obj=G.boss?'Defeat '+G.boss.name:G.gate.open?'Boss gate open. Rec. level '+recLevel(G.stage):cur?(cur.label||'Objective')+' '+Math.min(cur.have,cur.need)+'/'+cur.need:'Defeat '+foeWord()+': '+Math.min(G.killsStage,q)+'/'+q;ctx.fillText(obj,12,46);
  const barY=touchMode?(H<500?85:60):H-57;
  bar(12,barY,bw,20,p.hp/p.s.maxHp,'#c0392f','Life '+Math.ceil(p.hp)+'/'+Math.round(p.s.maxHp));bar(12,barY+23,bw,18,p.mana/p.s.maxMana,'#2d6fc0','Mana '+Math.floor(p.mana));bar(12,barY+44,bw,8,p.xp/xpNeed(p.lvl),'#e8c02a','');
  // rage gauge
  {const rd=p.rage>=100,rY=touchMode?barY+56:barY-42,pul=rd?.5+.5*Math.sin(G.t*9):0;ctx.fillStyle='rgba(5,10,20,.82)';ctx.fillRect(12,rY,bw,19);const gr=ctx.createLinearGradient(12,0,12+bw,0);gr.addColorStop(0,'#ff7a28');gr.addColorStop(1,rd?'#ffe060':'#e8263c');ctx.fillStyle=gr;ctx.fillRect(14,rY+2,(bw-4)*clamp(p.rage/100,0,1),15);if(rd){ctx.strokeStyle='rgba(255,230,120,'+(.45+.55*pul)+')';ctx.lineWidth=2;ctx.strokeRect(12,rY,bw,19)}ctx.font='700 11px "IBM Plex Mono",monospace';ctx.textAlign='left';ctx.fillStyle='#fff';ctx.fillText(rd?(touchMode?'ULTIMATE READY: tap Ult':'ULTIMATE READY: press V'):'Rage '+Math.floor(p.rage)+'%',19,rY+14)}
  {const active=Object.keys(AURA_TYPES).filter(k=>auraHas(p,k)).map(k=>AURA_TYPES[k].n);if(active.length){const t='Auras: '+active.join(' · '),y=touchMode?barY+88:barY-48;ctx.font='600 11px Barlow,sans-serif';ctx.textAlign='left';ctx.lineWidth=3;ctx.strokeStyle='rgba(5,10,20,.9)';ctx.strokeText(t,12,y);ctx.fillStyle='#cbeee4';ctx.fillText(t,12,y)}}
  // kill combo
  if(G.p.combo>=2){const t=comboTier(G.p.combo)||COMBO_TIERS[0],sc=1+G.p.comboPop*.45,xr=W-16,yc=small?190:Math.max(205,H*.4),q=clamp(G.p.comboT/COMBO_WINDOW,0,1);ctx.save();ctx.translate(xr,yc);ctx.scale(sc,sc);ctx.textAlign='right';ctx.font='700 '+(small?44:62)+'px "Pixelify Sans",monospace';ctx.lineWidth=7;ctx.strokeStyle='rgba(5,5,15,.9)';ctx.strokeText(G.p.combo,0,0);ctx.fillStyle=t[2];ctx.fillText(G.p.combo,0,0);ctx.restore();ctx.textAlign='right';ctx.font='700 12px "IBM Plex Mono",monospace';ctx.lineWidth=3;ctx.strokeStyle='rgba(5,5,15,.9)';ctx.strokeText('KILL COMBO',xr,yc+18);ctx.fillStyle='#f2ecd8';ctx.fillText('KILL COMBO',xr,yc+18);ctx.font='700 '+(small?16:21)+'px "Pixelify Sans",monospace';ctx.strokeText(t[1],xr,yc+40);ctx.fillStyle=t[2];ctx.fillText(t[1],xr,yc+40);ctx.fillStyle='rgba(5,5,15,.8)';ctx.fillRect(xr-110,yc+47,110,5);ctx.fillStyle=t[2];ctx.fillRect(xr-110*q,yc+47,110*q,5)}
  // Party chain: everyone's kills feed one counter, and its bonus tiers belong to the whole party.
  {const ch=G.chain;if(G.mp&&ch&&ch.n>=2){const t=comboTier(ch.n)||COMBO_TIERS[0],xr=W-16,yc=(small?190:Math.max(205,H*.4))+70;ctx.textAlign='right';ctx.font='700 12px "IBM Plex Mono",monospace';ctx.lineWidth=3;ctx.strokeStyle='rgba(5,5,15,.9)';ctx.strokeText('PARTY CHAIN '+ch.n,xr,yc);ctx.fillStyle=t[2];ctx.fillText('PARTY CHAIN '+ch.n,xr,yc);const bonuses=CHAIN_BONUS.filter(c=>ch.n>=c[0]).map(c=>c[2]).reverse().join(' · ');if(bonuses){const mw=W-24;ctx.font='600 11px Barlow,sans-serif';ctx.strokeText(bonuses,xr,yc+15,mw);ctx.fillStyle='#cbeee4';ctx.fillText(bonuses,xr,yc+15,mw)}ctx.fillStyle='rgba(5,5,15,.8)';ctx.fillRect(xr-110,yc+20,110,4);ctx.fillStyle='#8fe6ff';ctx.fillRect(xr-110,yc+20,110*clamp(ch.t/CHAIN_WINDOW,0,1),4)}}
  // Linked ultimates: an ally's ultimate opens a three second window.
  {const L=G.link;if(L&&L.t>0){const mine=L.ids&&L.ids.indexOf(G.p.id)>=0,q=.5+.5*Math.sin(G.t*8),compact=touchMode&&H<500,xr=compact?W/2+60:W-16,yc=compact?65:(small?190:Math.max(205,H*.4))+110;
    ctx.textAlign='right';ctx.font='700 '+(small?15:19)+'px "Pixelify Sans",monospace';ctx.lineWidth=4;ctx.strokeStyle='rgba(5,5,15,.92)';
    const lab=mine?'LINKED '+L.n+(L.dmg?' · +'+Math.round(L.dmg*100)+'%':''):(touchMode?'LINK NOW: tap Ult':'LINK NOW: press V');
    ctx.strokeText(lab,xr,yc);ctx.fillStyle=mine?'rgba(143,230,255,'+(.7+.3*q)+')':'rgba(255,240,160,'+(.55+.45*q)+')';ctx.fillText(lab,xr,yc);
    const bw=120;ctx.fillStyle='rgba(5,5,15,.8)';ctx.fillRect(xr-bw,yc+7,bw,5);ctx.fillStyle='#8fe6ff';ctx.fillRect(xr-bw*clamp(L.t/3,0,1),yc+7,bw*clamp(L.t/3,0,1),5)}}
  // current weapon
  ctx.fillStyle='rgba(5,10,20,.75)';ctx.fillRect(12,barY-20,bw,18);ctx.font='700 12px Barlow,sans-serif';ctx.textAlign='left';ctx.fillStyle='#f0c23c';ctx.fillText(kitOf(p)?'Special attack: '+((p.specT||0)>0?'ready in '+Math.ceil(p.specT)+'s':touchMode?'READY':'READY (X)'):(touchMode?'':'Tab: ')+WEAPONS[p.weapon].n+' · power '+WEAPONS[p.weapon].p,18,barY-7);
  {const k=archKey(p.char),team=TEAM_ABILITY[k],target=teamTarget(p,k),preview=['shooter','medic','scout'].includes(k)?(target?' · '+String(target.pname||target.name||label(target.char)).slice(0,12):' · no target'):'',t=team.n+(p.teamCd>0?' '+Math.ceil(p.teamCd)+'s':' ready')+preview+(p.boonPending?' · boon ready':'');ctx.textAlign='left';ctx.font='600 11px Barlow,sans-serif';ctx.lineWidth=3;ctx.strokeStyle='rgba(5,10,20,.9)';ctx.strokeText((touchMode?'Team: ':'G: ')+t,12,touchMode?barY+102:barY-61);ctx.fillStyle='#d8e9ff';ctx.fillText((touchMode?'Team: ':'G: ')+t,12,touchMode?barY+102:barY-61)}
  if(p.killerT>0){ctx.textAlign='left';ctx.font='600 11px Barlow,sans-serif';ctx.fillStyle='#ffb080';ctx.fillText('Citizens fear you · '+Math.ceil(p.killerT)+'s',12,touchMode?barY+116:barY-74)}
  // buffs
  let bx=12+bw+6;[[p.fastT,'FAST','#6fb4ff'],[p.magicT,'POWER','#c88cff']].forEach(([v,l,c])=>{if(v>0){ctx.fillStyle='rgba(5,10,20,.82)';ctx.fillRect(bx,barY,54,22);ctx.font='500 10px "IBM Plex Mono",monospace';ctx.textAlign='center';ctx.fillStyle=c;ctx.fillText(l+' '+Math.ceil(v),bx+27,barY+15);bx+=58}});
  if(!touchMode&&W>=660){
    const kit=kitOf(p),WP=WEAPONS[p.weapon],slots=kit?[['LMB','Small',p.mv&&p.mv.id==='small'?1:0,false],['Q','Moder',p.mv&&p.mv.id==='moderate'?1:0,false],['X',(p.specT||0)>0?Math.ceil(p.specT)+'s':'SPECIAL',(p.specT||0)/SPECIAL_CD,(p.specT||0)>0],['RMB','Shield',p.guard?1:0,false],['E','Heal',p.cd.pull/5,p.mana<22],['Space','Dodge',p.cd.dash/p.s.dashCd,false],['1','Pot '+p.potions,p.cd.potion,p.potions<=0],['2','Fast '+p.fast,p.fastT>0?1:0,p.fast<=0],['3','Pill '+p.magic,p.magicT>0?1:0,p.magic<=0]]:[['LMB',{unarmed:'Punch',melee:'Melee',shoot:'Shoot',spell:'Cast',shield:'Bash',heal:'Mend'}[WP.m],p.cd.slash/(WP.cd*p.s.cdMul),WP.m==='spell'&&p.mana<WP.cost],['RMB','Shield',p.guard?1:0,false],['Q','Spell',p.cd.bolt/.7,p.mana<p.s.spellCost],['E','Heal',p.cd.pull/5,p.mana<22],['Space','Dodge',p.cd.dash/p.s.dashCd,false],['1','Pot '+p.potions,p.cd.potion,p.potions<=0],['2','Fast '+p.fast,p.fastT>0?1:0,p.fast<=0],['3','Pill '+p.magic,p.magicT>0?1:0,p.magic<=0]];
    const sw=Math.min(50,(W-bw-40)/slots.length-4),gap=4;let x=W-(slots.length*(sw+gap)-gap)-10;const y=H-54;
    slots.forEach(s=>{ctx.fillStyle='rgba(5,10,20,.82)';ctx.fillRect(x,y,sw,44);ctx.strokeStyle=s[3]?'#7b4a3d':'#30446e';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,sw-1,43);
      if(s[2]>0){ctx.fillStyle='rgba(111,180,255,.3)';const hh=42*clamp(s[2],0,1);ctx.fillRect(x+1,y+43-hh,sw-2,hh)}
      ctx.textAlign='center';ctx.font='500 10px "IBM Plex Mono",monospace';ctx.fillStyle='#f0c23c';ctx.fillText(s[0],x+sw/2,y+14);ctx.font='700 12px Barlow,sans-serif';ctx.fillStyle=s[3]?'#8a8078':'#f2ecd8';ctx.fillText(s[1],x+sw/2,y+31);x+=sw+gap});
  }
  const mw=small?96:130,mh=mw*MH/MW,mx=W-mw-10,my=10;ctx.fillStyle='rgba(5,10,20,.75)';ctx.fillRect(mx-2,my-2,mw+4,mh+4);ctx.drawImage(mini,mx,my,mw,mh);
  const dot=(o,c,s)=>{ctx.fillStyle=c;ctx.fillRect(mx+o.x/T*mw/MW-s/2,my+o.y/T*mh/MH-s/2,s,s)};
  G.enemies.forEach(e=>{if(dist(e,p)<620&&!concealed(e,p))dot(e,e.kind==='boss'?'#ff2020':'#ff5040',3)});dot(G.safe,'#6fdca0',5);dot(G.gate,G.gate.open?'#ff8f80':'#6a7080',5);G.players.forEach(q=>{if(q!==p&&!(q.deadT>0))dot(q,'#6fd8ff',4)});dot(p,'#fff',4);
  // clock
  ctx.fillStyle='rgba(5,10,20,.75)';ctx.fillRect(mx-2,my+mh+3,mw+4,20);ctx.font='500 12px "IBM Plex Mono",monospace';ctx.textAlign='center';ctx.fillStyle=n>.5?'#a8b8f0':'#f0c23c';ctx.fillText(clock(G.hour)+(n>.5?' NIGHT':n>0?' DUSK':' DAY'),mx+mw/2,my+mh+17);
  if(G.gate.open&&!G.boss&&dist(p,G.gate)>200){const a=Math.atan2(G.gate.y-p.y,G.gate.x-p.x),ax=W/2+Math.cos(a)*Math.min(W,H)*.36,ay=H/2+Math.sin(a)*Math.min(W,H)*.36;ctx.save();ctx.translate(ax,ay);ctx.rotate(a);ctx.fillStyle='#ff6a5f';ctx.strokeStyle='#20242e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-10);ctx.lineTo(-3,0);ctx.lineTo(-8,10);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
  if(G.p.nearSafe){ctx.textAlign='center';ctx.font='700 15px Barlow,sans-serif';ctx.lineWidth=3;ctx.strokeStyle='rgba(5,10,20,.9)';const m=touchMode?'Tap Menu for shop, gym and travel':'Press R for shop, gym and travel';ctx.strokeText(m,W/2,H*.72);ctx.fillStyle='#6fdca0';ctx.fillText(m,W/2,H*.72)}
  if(G.boss){const bwid=Math.min(W*.5,420),x=(W-bwid)/2,y=small?H-16:78,e=G.boss;ctx.fillStyle='rgba(5,10,20,.85)';ctx.fillRect(x,y,bwid,12);ctx.fillStyle='#e8463f';ctx.fillRect(x+2,y+2,(bwid-4)*Math.max(0,e.hp/e.maxHp),8);ctx.textAlign='center';ctx.font='700 17px "Pixelify Sans",monospace';ctx.lineWidth=3;ctx.strokeStyle='rgba(5,10,20,.9)';ctx.strokeText(e.name,W/2,y-4);ctx.fillStyle='#f2ecd8';ctx.fillText(e.name,W/2,y-4);
    const gy=small?y-8:y+13,gf=clamp((e.guard||0)/(e.guardMax||100),0,1);
    ctx.fillStyle='rgba(5,10,20,.8)';ctx.fillRect(x,gy,bwid,6);ctx.fillStyle=(e.staggerT||0)>0?'#ffd860':'#7db6ff';ctx.fillRect(x+1,gy+1,(bwid-2)*gf,4);
    if(!small){ctx.font='700 12px Barlow,sans-serif';if((e.staggerT||0)>0){ctx.fillStyle='#ffd860';ctx.fillText('STAGGERED '+Math.ceil(e.staggerT)+'s',W/2,gy+22)}else if(e.enraged){ctx.fillStyle='#ff8f80';ctx.fillText('ENRAGED',W/2,gy+22)}else{const pu=pillarsUp();if(pu){ctx.fillStyle='#8fd6ff';ctx.fillText('PILLARS '+pu,W/2,gy+22)}}}}
  if(G.mp)netHud(small);
  if(G.banner){const bannerY=small?H*.55:H*.3;ctx.globalAlpha=clamp(G.banner.t/.5,0,1);ctx.textAlign='center';ctx.font='700 '+(small?24:40)+'px "Pixelify Sans",monospace';ctx.lineWidth=5;ctx.strokeStyle='rgba(5,10,20,.85)';ctx.strokeText(G.banner.a,W/2,bannerY);ctx.fillStyle='#f2ecd8';ctx.fillText(G.banner.a,W/2,bannerY);ctx.font='600 '+(small?13:16)+'px Barlow,sans-serif';ctx.lineWidth=3;ctx.strokeText(G.banner.b,W/2,bannerY+24);ctx.fillStyle='#f0c23c';ctx.fillText(G.banner.b,W/2,bannerY+24);ctx.globalAlpha=1}
  /* Where the objective is, drawn last so it sits over the HUD */
  drawObjPointer();
}
