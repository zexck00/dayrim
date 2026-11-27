/* Pixel 3D: the world drawn with Three.js (game/three/, bundled as vendor/three-world.js), then reduced to
   the DAYRIM-64 palette with ordered dither and ink outlines. Visual only: rules and hit areas never read it.
   Without WebGL, or when frames run slow, the game falls back to the classic 2D drawing. */
const FX3={enabled:false,layer:null,loading:false,failed:false,mod:null};
const fx3Canvas=$('fx3'),fx3Button=$('fx3btn');
const W3={seen:new WeakSet(),d3:false,uctx:null,octx:null,base:null,baseInv:null,cards:[],w:null,tide:-1,props:new Map(),bossCv:new WeakMap(),baking:false,slow:0,slowT:0,
  opts:{pal:true,ink:true,dither:true}};
const gfxLabel=()=>FX3.failed?'Graphics: Classic 2D (3D unavailable)':FX3.enabled?'Graphics: Pixel 3D':'Graphics: Classic 2D';
async function setFx3(on){
  FX3.enabled=on;store.set('dayrim-gfx',on?'pixel3d':'classic');fx3Button.textContent=gfxLabel();fx3Button.setAttribute('aria-pressed',String(on));
  if(!on){fx3Canvas.hidden=true;return}if(FX3.layer||FX3.loading)return;FX3.loading=true;
  try{const mod=await import(new URL(THREE_WORLD_URL,document.baseURI).href);FX3.mod=mod;FX3.layer=mod.createWorld(fx3Canvas);FX3.failed=false;W3.w=null}
  catch(e){console.warn('Pixel 3D unavailable',e);FX3.failed=true;FX3.enabled=false;fx3Button.textContent=gfxLabel();fx3Button.setAttribute('aria-pressed','false');fx3Canvas.hidden=true}
  finally{FX3.loading=false}
}
function fx3Off(reason){if(FX3.layer)try{FX3.layer.dispose()}catch(e){}FX3.layer=null;FX3.enabled=false;FX3.failed=true;fx3Canvas.hidden=true;fx3Button.textContent=gfxLabel();fx3Button.setAttribute('aria-pressed','false');console.warn('Pixel 3D off:',reason)}
fx3Canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fx3Off('context lost')});
fx3Button.onclick=()=>setFx3(!FX3.enabled);
blitHook=w3Card;
// for checking the look in the browser console: DAYRIM_GFX.pal / .ink / .dither = false
window.DAYRIM_GFX=W3.opts;W3.opts.finalPreview=art=>{G.fx.push({k:'bossult',art,name:art,move:FINAL.names[art]||'Final assault',x:0,y:0,t:FINAL.wind+.5,m:FINAL.wind+.5});return 'ok'};Object.defineProperty(W3.opts,'state',{get:()=>({cards:W3.cards.map(c=>[c.canvas.width,Math.round(c.footY)]),slow:W3.slow,fx:FX3.layer&&FX3.layer.stats(),p:G.p&&[Math.round(G.p.x),Math.round(G.p.y)],water:(()=>{const i=G.w.ground.findIndex((g,j)=>g===3&&!G.w.map[j]);return i<0?null:[(i%MW+.5)*T,((i/MW|0)+.5)*T]})(),tree:(G.w.props.find(o=>o.t==='tree')||{}).x}),enumerable:false});
/* The world is drawn in 3D only while playing; menus keep their 2D backdrops */
const w3On=()=>!!(FX3.enabled&&FX3.layer&&G&&G.mode==='play'&&G.w);

/* ---- baking the stage for the 3D world ---- */
const WALL_H=26;
function w3Bake(old){
  // the ground art in chunks of at most ~2600 px, so big maps stay inside phone texture limits; phones bake a bit smaller
  const s=(touchMode?.75:1)/PS,step=Math.max(8,Math.floor(2600/(T*s))),chunks=[];
  for(let ty0=0;ty0<MH;ty0+=step)for(let tx0=0;tx0<MW;tx0+=step){const tx1=Math.min(MW,tx0+step),ty1=Math.min(MH,ty0+step);
    const prev=old&&old.find(c=>c.tx0===tx0&&c.ty0===ty0),gc=prev?prev.canvas:document.createElement('canvas');
    if(!prev){gc.width=Math.ceil((tx1-tx0)*T*s);gc.height=Math.ceil((ty1-ty0)*T*s)}
    const g=gc.getContext('2d'),keep=ctx;ctx=g;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,gc.width,gc.height);g.imageSmoothingEnabled=false;g.setTransform(s,0,0,s,-tx0*T*s,-ty0*T*s);
    try{drawTiles(tx0,ty0,tx1-1,ty1-1)}finally{ctx=keep}
    chunks.push(prev||{canvas:gc,tx0,ty0,tx1,ty1})}
  // south face of a wall: leafy lip, stone courses, dark foot
  const B=G.w.biome,fc=document.createElement('canvas');fc.width=T;fc.height=WALL_H;const f=fc.getContext('2d');
  f.fillStyle=B.w[0];f.fillRect(0,0,T,WALL_H);f.fillStyle=B.w[1];for(let r=0;r<3;r++){const y=5+r*7,o=r%2?10:0;for(let x=-o;x<T;x+=20)f.fillRect(x+1,y,18,5)}
  f.fillStyle=B.w[2];f.fillRect(0,WALL_H-4,T,4);f.fillStyle=B.leaf[0];f.fillRect(0,0,T,3);f.fillStyle=B.leaf[1];f.fillRect(6,3,5,3);f.fillRect(24,3,7,2);
  return{chunks,front:fc};
}
function w3Stage(){
  const tide=Math.round((G.tide||0)*20)/20;
  // DAYRIM_GFX.look=1..10 previews another stage's look on the current map (visual only)
  const look=W3.opts.look|0;if(W3.w===G.w&&W3.tide===tide&&W3.look===look)return;
  // a look preview also paints the ground in that stage's colours (restored straight after)
  const realBiome=G.w.biome;if(look)G.w.biome=BIOMES[STAGES[look-1].biome];
  const same=W3.w===G.w&&W3.chunks&&W3.look===look;let b;try{b=w3Bake(same?W3.chunks:null)}finally{G.w.biome=realBiome}
  if(same)FX3.layer.refreshGround();
  else{W3.chunks=b.chunks;W3.props.clear();W3.veg=new Set(FX3.layer.vegKinds);
    // the stage picks its theme, 3D vegetation, scattered extras and water; the safehouse and gate stay clear
    const avoid=[G.safe&&{x:G.safe.x,y:G.safe.y,r:150},G.gate&&{x:G.gate.x,y:G.gate.y,r:120}].filter(Boolean);
    W3.theme=FX3.layer.setStage({map:G.w.map,ground:G.w.ground,MW,MH,T,chunks:b.chunks,front:b.front,wallH:WALL_H,edge:(look?BIOMES[STAGES[look-1].biome]:G.w.biome).w[2],stage:look||G.stage,story:!look&&!!G.story,ci:G.story?G.story.ci:0,props:G.w.props,avoid,biome:G.w.biome})}
  W3.w=G.w;W3.tide=tide;W3.look=look;
}

/* ---- the frame: 2D layers under and over the 3D world, plus sprite cards ---- */
function w3Begin(cam,sx,sy){
  w3Stage();
  // DAYRIM_GFX.peek={x,y} moves only the picture (for screenshots); the game camera is unchanged
  if(W3.opts.peek)cam=W3.opts.peek;
  const L=FX3.layer,iso=vxOn(),s=iso?vxScale():0,D=iso?2*(FX3.mod.isoSpan(W,H,s)+40):0,vw=iso?D:W/zoom,vh=iso?D:H/zoom,iw=Math.max(16,Math.round(vw/PS)),ih=Math.max(16,Math.round(vh/PS));
  W3.f={iw,ih,vw,vh,cx:cam.x+sx,cy:cam.y+sy,iso,s,rw:Math.round(W),rh:Math.round(H)};W3.heroes=[];
  // voxel preview: everything 2D goes on the ground layer; the screen overlay stays empty (the post pass sizes it)
  for(const cv of iso?[L.underCanvas]:[L.underCanvas,L.overCanvas])if(cv.width!==iw||cv.height!==ih){cv.width=iw;cv.height=ih}
  if(iso){L.overCtx.setTransform(1,0,0,1,0,0);L.overCtx.clearRect(0,0,L.overCanvas.width,L.overCanvas.height)}
  W3.base=new DOMMatrix([iw/vw,0,0,ih/vh,iw/2-(cam.x+sx)*iw/vw,ih/2-(cam.y+sy)*ih/vh]);W3.baseInv=W3.base.inverse();
  for(const c of iso?[L.underCtx]:[L.underCtx,L.overCtx]){c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,iw,ih);c.imageSmoothingEnabled=false;c.setTransform(W3.base)}
  w3Text(L.overCtx);L.overCtx.__txt.length=0;w3Text(L.underCtx);L.underCtx.__txt.length=0;W3.uctx=L.underCtx;W3.octx=iso?L.underCtx:L.overCtx;W3.cards.length=0;W3.d3=true;ctx=W3.uctx;shadowTo=W3.uctx;
}
/* blit() hands its sprite here when it would draw on the over layer at full opacity */
function w3Card(c2,name,x,y,dir,anim,f,flip,rot,alpha,wpn,size,mo){
  if(W3.skip&&name===W3.skip.char)return true;// drawn as a voxel model instead
  if(!W3.d3||W3.baking||c2!==W3.octx||(alpha!==undefined&&alpha<.99)||c2.globalAlpha<.99||c2.globalCompositeOperation!=='source-over')return false;
  let im=frame(name,dir,anim,f,wpn);if(blitDark)im=darkFrame(im);if(mo&&mo.red)im=redFrame(im);
  const m=W3.baseInv.multiply(c2.getTransform()),foot=m.transformPoint(new DOMPoint(x,y));
  m.translateSelf(x,y);
  if(mo){m.translateSelf(mo.dx||0,mo.dy||0);if(mo.rot)m.rotateSelf(mo.rot*180/Math.PI);if(mo.sx||mo.sy)m.scaleSelf(mo.sx||1,mo.sy||1)}
  if(size!==1)m.scaleSelf(size,size);if(flip)m.scaleSelf(-1,1);
  if(rot){m.translateSelf(0,-19*PS);m.rotateSelf(rot*180/Math.PI);m.translateSelf(0,19*PS)}
  const x0=-32*PS,y0=-61*PS,x1=x0+FS*PS,y1=y0+FS*PS,q=[];
  for(const [px,py] of [[x0,y0],[x1,y0],[x1,y1],[x0,y1]]){const p=m.transformPoint(new DOMPoint(px,py));q.push(p.x,p.y)}
  W3.cards.push({canvas:im,q,footY:foot.y,sink:blitSink});return true;
}
/* Trees, rocks and other props: drawn once into a picture, then stood up as a card */
const PROP_W=240,PROP_H=260,PROP_FOOT=228;
function w3Prop(o){
  if(W3.veg&&W3.veg.has(o.t))return;// drawn as real 3D vegetation
  // voxel view: ruins are part of the block stage; braziers are block posts with a flickering flame
  if(W3.f&&W3.f.iso){if(o.t==='ruin')return;if(o.t==='lamp'){W3.heroes.push({kind:'prop',key:'prop:brazier',prop:'brazier',x:o.x,y:o.y,face:0,size:1});return}}
  const k=o.t+'|'+(o.v||0)+'|'+(o.k||'');let cv=W3.props.get(k);
  if(!cv){cv=document.createElement('canvas');cv.width=PROP_W;cv.height=PROP_H;const g=cv.getContext('2d'),keep=ctx,b=W3.baking,sh=shadowTo;ctx=g;W3.baking=true;shadowTo=null;g.imageSmoothingEnabled=false;
    try{drawProp(Object.assign({},o,{x:PROP_W/2,y:PROP_FOOT}))}catch(e){}finally{ctx=keep;W3.baking=b;shadowTo=sh}W3.props.set(k,cv)}
  const l=o.x-PROP_W/2,t=o.y-PROP_FOOT;W3.cards.push({canvas:cv,q:[l,t,l+PROP_W,t,l+PROP_W,t+PROP_H,l,t+PROP_H],footY:o.y});
}
/* Bosses are painted fresh each frame onto their own picture */
function w3Boss(e,draw){
  const h=e.ah||100,cw=Math.ceil(h*4),ch=Math.ceil(h*3.2),fy=Math.round(ch*.82);let cv=W3.bossCv.get(e);
  if(!cv||cv.width!==cw){cv=document.createElement('canvas');cv.width=cw;cv.height=ch;W3.bossCv.set(e,cv)}
  const g=cv.getContext('2d'),keep=ctx,b=W3.baking;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cw,ch);g.setTransform(1,0,0,1,cw/2-e.x,fy-e.y);const sh=shadowTo;ctx=g;W3.baking=true;shadowTo=null;
  try{draw(e)}finally{ctx=keep;W3.baking=b;shadowTo=sh}
  const l=e.x-cw/2,t=e.y-fy;W3.cards.push({canvas:cv,q:[l,t,l+cw,t,l+cw,t+ch,l,t+ch],footY:e.y,dynamic:true});
}
/* Day and night: sun, ambient, point lights and the screen tint, from the game clock */
function w3Light(n,tint,inView){
  const h=((G.hour%24)+24)%24,day=1-n,warm=(h>=5&&h<8)||(h>=16&&h<20);
  const lights=[];
  G.w.lamps.forEach(o=>{if(inView(o))lights.push({x:o.x,y:o.y,z:34,col:'#ffc070',r:200,i:.25+n})});
  G.shots.forEach(s=>{if(inView(s))lights.push({x:s.x,y:s.y,z:20,col:'rgb('+(s.col||'255,200,120')+')',r:110,i:.3+.5*n})});
  if(n>.2&&G.p)lights.push({x:G.p.x,y:G.p.y,z:40,col:'#aabce6',r:170,i:.4*n});
  if(n>.2&&G.safe)lights.push({x:G.safe.x,y:G.safe.y,z:20,col:'#6fdca0',r:150,i:.5*n});
  // combat for the 3D layer: shot glows, beams (same start and growth as the 2D beam) and new hits
  const shots=G.shots.filter(inView).map(s=>({x:s.x,y:s.y,z:18+(thrownLift(s)||0),col:s.col,big:!!s.big}));
  const beams=G.players.filter(q=>q.beam&&!(q.deadT>0)).map(q=>{const b=q.beam,ca=Math.cos(b.a),sa=Math.sin(b.a);return{x:q.x+ca*18,y:q.y+sa*18,z:22,a:b.a,len:b.len*(b.ext||0),col:b.col,full:!!b.full}});
  const hits=[];for(const f of G.fx){if(W3.seen.has(f))continue;W3.seen.add(f);
    if(f.k==='spark')hits.push({k:'spark',x:f.x,y:f.y+24,z:24,col:f.c,power:f.crit?1.6:1});
    else if(f.k==='bossdie')hits.push({k:'bossdie',x:f.x,y:f.y,z:40,col:'255,200,140',power:2});
    else if(f.k==='nova')hits.push({k:'nova',x:f.x,y:f.y,z:10,col:f.c,power:1.2});
    else if(f.k==='muz')hits.push({k:'muz',x:f.x,y:f.y+22,z:22,col:'255,230,170',power:.4})}
  // Three.js divides diffuse light by pi; these keep a lit face at about its 2D brightness at noon
  return{sun:{dir:[-.45,.55,1],col:warm?'#ffd8a8':n>.6?'#8090d0':'#fff6e4',i:Math.PI*(.35+.15*day)},
    amb:{sky:n>.6?'#7080b0':'#f0f4ff',ground:'#b0a080',i:Math.PI*.55},lights,
    tint:tint.a>.01?[tint.c[0]/255,tint.c[1]/255,tint.c[2]/255,tint.a*.75]:[0,0,0,0],cardLight:[1,1,1],time:G.t,night:n,dayLight:1-.35*n,shots,beams,hits,reduced};
}
function w3End(lt){
  ctx=ctx0;W3.d3=false;shadowTo=null;
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
  // back to the screen with the usual world transform, for damage numbers and callouts
  ctx.setTransform(zoom*dpr,0,0,zoom*dpr,(W/2-W3.f.cx*zoom)*dpr,(H/2-W3.f.cy*zoom)*dpr);
  W3.frame=Object.assign({W,H,dpr,cards:W3.cards,opts:W3.f.iso?{pal:false,ink:false,dither:false}:W3.opts,heroes:W3.heroes},W3.f,lt);
  // text held back from the pixel layer is drawn here at full screen resolution
  const o=FX3.layer.overCtx,S=ctx.getTransform(),list=W3.f.iso?(FX3.layer.underCtx.__txt||[]):(o.__txt||[]);ctx.save();
  for(const t of list){if(W3.f.iso){const m=W3.baseInv.multiply(t.m),p=m.transformPoint(new DOMPoint(t.x,t.y)),a=vxAnchor(p.x,p.y),P=vxScreen(a.x,a.y,a.z),k=W3.f.s;
      ctx.setTransform(dpr*k*m.a,dpr*k*m.b,dpr*k*m.c,dpr*k*m.d,dpr*(P.x-k*(m.a*t.x+m.c*t.y)),dpr*(P.y-k*(m.b*t.x+m.d*t.y)))}
    else ctx.setTransform(S.multiply(W3.baseInv).multiply(t.m));ctx.font=t.font;ctx.fillStyle=t.fill;ctx.strokeStyle=t.stroke;ctx.lineWidth=t.lw;ctx.lineJoin=t.lj;ctx.textAlign=t.al;ctx.textBaseline=t.bl;ctx.globalAlpha=t.ga;
    if(t.mw===undefined)ctx[t.op](t.s,t.x,t.y);else ctx[t.op](t.s,t.x,t.y,t.mw)}
  ctx.restore();list.length=0;
}
/* Text on the 3D overlay would be drawn at pixel-art resolution and dithered, so it looks blurry.
   Names, levels, labels and timers are kept aside instead and drawn crisp on the screen in w3End. */
function w3Text(c){if(c.__txt)return;c.__txt=[];const P=CanvasRenderingContext2D.prototype;
  for(const op of ['fillText','strokeText'])c[op]=function(s,x,y,mw){if(!W3.d3||W3.baking)return mw===undefined?P[op].call(this,s,x,y):P[op].call(this,s,x,y,mw);
    this.__txt.push({op,s:String(s),x,y,mw,m:this.getTransform(),font:this.font,fill:this.fillStyle,stroke:this.strokeStyle,lw:this.lineWidth,lj:this.lineJoin,al:this.textAlign,bl:this.textBaseline,ga:this.globalAlpha})}}
function drawFx3(now){
  const show=!!(W3.frame&&w3On());fx3Canvas.hidden=!show;if(!show){W3.frame=null;return}
  const t0=performance.now();
  try{FX3.layer.frame(W3.frame)}catch(e){fx3Off(e.message)}
  W3.frame=null;
  // a device that keeps missing frames gets the classic view
  const dt=performance.now()-t0;W3.slowT+=1;W3.slow=W3.slow*.97+dt*.03;
  if(W3.slowT>180&&W3.slow>22){store.set('dayrim-gfx','classic');fx3Off('too slow ('+W3.slow.toFixed(1)+' ms)')}
}
{const g=store.get('dayrim-gfx');fx3Button.textContent=gfxLabel();if(g!=='classic')setFx3(true)}

/* ---- Voxel preview (proof of concept): Stage 1 with the Detective, two minutes at a time ----
   An isometric camera, block ground, walls and trees, and a block-built Detective. Drawing and camera only:
   aim is still a world point and movement still sends a world direction, so the rules see the same game. */
/* Phase 0: open to every hero on every stage, with no time limit, while the voxel heroes are built (VOXEL_PLAN.md) */
const VX={on:false,end:Infinity,prevGfx:null,starting:false},voxBtn=$('voxbtn');
const isHero=c=>!!(c&&ROSTER.hero[c]);
const vxAllowed=()=>!!(G&&G.mode==='play'&&!G.story&&G.p&&isHero(G.p.char));
function vxOn(){return !!(VX.on&&FX3.enabled&&FX3.layer&&FX3.mod&&w3On())}
async function vxStart(){
  if(VX.on||VX.starting||!vxAllowed())return;VX.starting=true;VX.prevGfx=store.get('dayrim-gfx');
  try{if(!FX3.enabled||!FX3.layer)await setFx3(true);if(!FX3.layer||!FX3.mod)return;FX3.layer.setVoxel(true);VX.on=true;VX.end=Infinity;moveRot=FX3.mod.ISO_TURN}
  finally{VX.starting=false;if(VX.prevGfx!==undefined&&VX.prevGfx!==null)store.set('dayrim-gfx',VX.prevGfx);vxButton()}
}
function vxStop(why){
  if(!VX.on)return;VX.on=false;moveRot=0;if(FX3.layer)FX3.layer.setVoxel(false);
  if(VX.prevGfx==='classic')setFx3(false);if(VX.prevGfx!==undefined&&VX.prevGfx!==null)store.set('dayrim-gfx',VX.prevGfx);
  if(why&&G&&G.mode==='play')G.banner={t:3,a:'Voxel preview ended',b:why};vxButton();
}
function vxButton(){
  // always shown while playing, so players can find it; where it cannot run it says what it needs
  const play=!!(G&&G.mode==='play'),ok=vxAllowed()||VX.on;voxBtn.hidden=!play;if(!play)return;voxBtn.setAttribute('aria-disabled',String(!ok));
  if(!ok){voxBtn.textContent='Voxel view: heroes only';voxBtn.title='The voxel view is built for heroes first';voxBtn.setAttribute('aria-pressed','false');return}voxBtn.title='';
  voxBtn.textContent=VX.on?'Voxel view: on':VX.starting?'Loading voxel view':'Voxel view (beta)';voxBtn.setAttribute('aria-pressed',String(VX.on))
}
voxBtn.onclick=()=>{if(VX.on)vxStop('');else if(vxAllowed())vxStart();else if(G)G.banner={t:3,a:'Voxel view',b:G.story?'Not in Story mode':'Heroes only for now'}};
/* Lineup for screenshot review (DAYRIM_GFX.lineup=true): all 20 heroes in voxel, facing the camera, each with its 2D
   sprite standing just in front. Drawing only; nothing is added to the game. */
function vxLineup(){const p=G.p;if(!p)return;const names=Object.keys(ROSTER.hero),down=W3.opts.lineupFace!==undefined?+W3.opts.lineupFace:Math.PI/4;// DAYRIM_GFX.lineupFace turns them (radians)
  const H2=Math.SQRT1_2,at=(a,b)=>({x:p.x+(a+b)*H2,y:p.y+(b-a)*H2});
  names.forEach((n,i)=>{const c=at(-405+(i%10)*90,70+Math.floor(i/10)*150),x=c.x,y=c.y,sp=SPECS[n]||{};
    W3.heroes.push({kind:n==='Detective'?'det':'rig',key:'line:'+n,name:n,spec:sp,art:{head:vxHeadArt(n)},weapon:sp.w,wc:sp.wc,wart:vxWeaponArt(sp.w,sp.wc,sp.s),size:1.55,x,y,face:down,moving:false,atk:false,guard:false,hit:0,dash:-1,dead:false,blink:false,sink:false});
    const card=at(-405+(i%10)*90+38,70+Math.floor(i/10)*150+8),im=frame(n,dirOf(Math.PI/2),'idle',0),fx=card.x,fy=card.y,x0=fx-32*PS,y0=fy-61*PS;W3.cards.push({canvas:im,q:[x0,y0,x0+FS*PS,y0,x0+FS*PS,y0+FS*PS,x0,y0+FS*PS],footY:fy})})}
// for checking in the browser console: DAYRIM_GFX.vx and __vx
window.__vx={FX3,VX,W3};
Object.defineProperty(W3.opts,'vx',{get:()=>({on:VX.on,starting:VX.starting,allowed:vxAllowed(),fx3:FX3.enabled,layer:!!FX3.layer,mod:!!FX3.mod,failed:FX3.failed,w3:w3On(),heroes:(W3.heroes||[]).length,cards:W3.cards.length}),enumerable:false});
setInterval(()=>{if(VX.on){if(!vxAllowed())vxStop('Heroes only for now');else if(!vxOn()&&!VX.starting)vxStop('3D graphics are off')}vxButton()},250);
/* view helpers for the voxel camera (CSS pixels on screen) */
function vxScreen(x,y,z){const f=W3.f||{cx:G.cam.x,cy:G.cam.y,s:vxScale()};return FX3.mod.isoProject(x,y,z||0,f.cx,f.cy,W,H,f.s)}
function vxUnproject(sx,sy){return FX3.mod.isoUnproject(sx,sy,G.cam.x,G.cam.y,W,H,vxScale(),18)}
function vxInView(o){const f=W3.f;return FX3.mod.isoInView(o.x,o.y,f.cx,f.cy,W,H,f.s,90)}
/* HUD markers use the same formula as the classic view, so this keeps their scale */
function vxHud(x,y,z){const P=vxScreen(x,y,z);return{x:W/2+(P.x-W/2)/hudK,y:H/2+(P.y-H/2)/hudK}}
/* Labels drawn in 2D sit above someone's feet: find whose, so the label floats above them in the 3D view */
function vxAnchor(x,y){let best=null,bd=1e9;
  const look=o=>{if(!o||o.dead)return;const dx=Math.abs(o.x-x),up=o.y-y;if(dx<64&&up>=18&&up<230){const d=dx+up*.05;if(d<bd){bd=d;best=o}}};
  G.players.forEach(look);G.enemies.forEach(look);(G.npcs||[]).forEach(look);
  return best?{x,y:best.y,z:best.y-y}:{x,y,z:0}}
/* Voxel stand-in for a player: the Detective in normal form */
/* every hero stands as a block body (Phase 1); the Fire Truck stays a card until Phase 5 */
const vxHero=o=>vxOn()&&isHero(o.char)&&!batForm(o);
/* the Fire Truck under its driver, drawn by drawTruck and turned into voxels */
function vxTruckOf(p){const a=rideAng(p);return{kind:'form',key:'truck',art:vxFormArt('truck',p,0,false),size:1,x:p.x,y:p.y,face:a,hit:0,dash:-1,blink:false,sink:false}}
function vxHeroOf(p){const face=p.dashT>0?Math.atan2(p.dashY,p.dashX):(p.sprint&&p.moving&&p.moveA!==undefined)||(touchMode&&p.moving&&p.moveA!==undefined&&!touchHold.slash)?p.moveA:p.face;
  const wolf=wolfForm(p),det=p.char==='Detective',sp=SPECS[p.char]||{},kind=wolf?'form':det?'det':'rig',wc=p.weapon===sp.w?sp.wc:undefined,ride=riding(p)||!!p.rideWith,tank=p.tankPool>0&&p.abil&&(p.abil.fx==='aegis'||p.abil.fx==='anvil');
  return{kind,key:wolf?'wolf':kind==='rig'?'hero:'+p.char:kind,name:p.char,spec:sp,art:wolf?vxWolfArt(p):{head:vxHeadArt(p.char)},weapon:wolf?undefined:p.weapon,wc,wart:wolf?undefined:vxWeaponArt(p.weapon,wc,sp.s),
    size:wolf?1:1.55*(typeof abilSize==='function'?abilSize(p):1),z:ride?18:0,seated:ride,dome:tank?{r:TANK.r,col:p.abil.fx==='aegis'?0xffe178:0xff963c}:null,x:p.x,y:p.y,face,moving:!!p.moving,sprint:!!p.sprint,atk:p.atkT>0||p.chg>0||!!p.beam,guard:!!p.guard,hit:p.hitT>0?p.hitT:0,dash:p.dashT>0?1-p.dashT/.26:-1,dead:p.deadT>0,
    blink:p.inv>0&&p.dashT<=0&&Math.floor(G.t*22)%2===0,sink:typeof inWater==='function'&&inWater(p)}}
/* Minions and rivals are painted with their bars and markers onto a small picture that stands up as one card */
/* Pixels per world unit for the voxel camera; DAYRIM_GFX.vxZoom enlarges it for close-up screenshots only */
const vxScale=()=>FX3.mod.isoScale(zoom)*Math.min(4,Math.max(1,+W3.opts.vxZoom||1));
/* ---- Chibi art for the voxel builder: the game's own chibi drawings, read as pixels (VOXEL_PLAN.md) ----
   Heads come from drawHead (front, side, back), weapons from drawWeaponSprite, and the code-drawn forms (Wolf Form,
   Fire Truck) from their own drawing functions, so the voxel versions show exactly what the 2D game shows. */
const VXART=new Map(),VXNUL=document.createElement('canvas').getContext('2d');
function vxPixels(w,h,draw){const cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;draw(g);
  // the same light top edge and dark bottom edge the chibi frames get, so the colours match the sprites
  const im=g.getImageData(0,0,w,h),d=im.data,o=new Uint8ClampedArray(d),S=w*4;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(d[i+3]<=200)continue;if(y>0&&d[i-S+3]<40){for(let k=0;k<3;k++)o[i+k]=Math.min(255,d[i+k]*1.14+14)}else if(y<h-1&&d[i+S+3]<40){for(let k=0;k<3;k++)o[i+k]=d[i+k]*.76}}
  return o}
const vxP=g=>(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
const vxE=g=>(cx,cy,rx,ry,c)=>{g.fillStyle=c;for(let y=-ry;y<=ry;y++)for(let x=-rx;x<=rx;x++)if((x*x)/(rx*rx)+(y*y)/(ry*ry)<=1)g.fillRect(Math.round(cx+x),Math.round(cy+y),1,1)};
/* The chibi head: 64 × 40 pixels, chin on row 31, 0.75 model units a pixel (as big as the sprite's head) */
function vxHeadArt(name){const key='head|'+name;let a=VXART.get(key);if(a)return a;const sp=SPECS[name]||{};
  const view=dir=>vxPixels(64,40,g=>drawHead(g,vxP(g),vxE(g),sp,dir,32+(dir===2?1:0),8,false));
  a={w:64,h:40,front:view(0),side:view(2),back:view(1),cx:32,sx:33,top:31,k:.75};VXART.set(key,a);return a}
/* The chibi weapon, drawn hanging from the hand (hand at row 10), for the block arm */
function vxWeaponArt(w,wc,skin){if(!w)return null;const id=w==='fists'?'fist':w,key='wpn|'+id+'|'+(wc||'')+'|'+(skin||'');let a=VXART.get(key);if(a)return a;
  const front=vxPixels(48,48,g=>drawWeaponSprite(g,id,24,10,Math.PI/2,wc,skin||'#f0c8a0',false));let any=false;for(let i=3;i<front.length;i+=4)if(front[i]>100){any=true;break}
  a=any?{w:48,h:48,front,ax:24,ay:10,k:.75,z0:-14.3}:null;VXART.set(key,a);return a}
/* Code-drawn forms: each pose drawn by the game's own function onto a picture (front, side, back) */
function vxFormArt(kind,p,t,moving){const key=kind+'|'+t.toFixed(3)+'|'+(moving?1:0);let a=VXART.get(key);if(a)return a;
  const W=kind==='truck'?240:150,H=kind==='truck'?150:140,FY=H-10;
  const view=ang=>vxPixels(W,H,g=>{const kc=ctx,ks=shadowTo,kt=G.t;ctx=g;shadowTo=VXNUL;G.t=t;
    try{const q=Object.assign({},p,{x:W/2,y:FY,face:ang,moveA:ang,moving,dashT:0,hitT:0,inv:0});if(kind==='wolf')drawWolf(q);else{drawTruck(q,false);drawTruck(q,true)}}catch(e){}finally{ctx=kc;shadowTo=ks;G.t=kt}});
  // the werewolf keeps every pixel (its face is small); the truck samples every second pixel
  a={w:W,h:H,front:view(Math.PI/2),side:view(0),back:view(-Math.PI/2),cx:W/2,sx:W/2,top:FY,k:1,step:kind==='wolf'?1:2};VXART.set(key,a);return a}
/* Wolf Form flipbook: standing, and four steps of its fast stride (the 2D stride runs at 18 radians a second) */
function vxWolfArt(p){const mv=!!p.moving;if(!mv)return vxFormArt('wolf',p,0,false);const i=Math.floor(G.t*18/(Math.PI/2))%4;return vxFormArt('wolf',p,i*(Math.PI/2)/18,true)}
/* NPCs (villagers, scouts, story characters, side-quest givers, lost villagers): the same chibi voxel people, with their
   labels, bubbles and markers on a card above them */
function vxPerson(o,name,face,moving,hit){const sp=SPECS[name]||SPECS.Tourist||{};return{kind:'rig',key:'npc:'+name,name,spec:sp,art:{head:vxHeadArt(SPECS[name]?name:'Tourist')},wart:vxWeaponArt(sp.w,sp.wc,sp.s),weapon:sp.w,wc:sp.wc,
  size:1.55,x:o.x,y:o.y,face,moving:!!moving,atk:false,guard:false,hit:hit||0,dash:-1,dead:false,blink:false,sink:typeof inWater==='function'&&inWater(o)}}
function vxNpc(c){const name=c.art||c.name,a=(c.dx||c.dy)?Math.atan2(c.dy,c.dx):Math.PI/2;W3.heroes.push(vxPerson(c,name,a,c.dx||c.dy,c.flash>0?.2:0));
  W3.skip={char:name};try{vxActor(c,drawNpc)}finally{W3.skip=null}}
/* side-quest people stand as voxels; their "!" and "Help!" stay on a card. Animals keep their drawing. */
function vxQuestPerson(o){const d=sideDef(o.q)||{};let name=null,moving=false;
  if(o.k==='sq_giver')name=d.art||'Tourist';else if(o.k==='sq_lost'&&!/sheep|hound|dog/i.test(d.item||'')){name='Tourist';moving=!!o.by}
  if(!name)return false;W3.heroes.push(vxPerson(o,name,Math.PI/4,moving,0));W3.skip={char:name};try{vxActor(o,drawSideProp)}finally{W3.skip=null}return true}
/* Quest objects and animals as blocks (side-quest items, totems, the guard shrine, the parcel and its flag, lost sheep
   and hounds, the lantern boat, canisters, purifiers, generators). Their flat parts (guard rings, progress arcs) stay on
   the ground layer exactly as in 2D; the standing part becomes the block model. */
const VXLAST=new WeakMap();
function vxFaceOf(o,dflt){const l=VXLAST.get(o);let a=l?l.a:dflt;if(l&&Math.hypot(o.x-l.x,o.y-l.y)>.4)a=Math.atan2(o.y-l.y,o.x-l.x);VXLAST.set(o,{x:o.x,y:o.y,a});return{a,moving:!!(l&&Math.hypot(o.x-l.x,o.y-l.y)>.4)}}
function vxRing(o,col,dash,q,qc){ctx.save();ctx.strokeStyle=col;ctx.lineWidth=2;ctx.setLineDash(dash||[]);ctx.beginPath();ctx.ellipse(o.x,o.y,o.r,o.r*.6,0,0,TAU);ctx.stroke();ctx.setLineDash([]);
  if(q>0){ctx.strokeStyle=qc;ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(o.x,o.y,o.r,o.r*.6,0,-Math.PI/2,-Math.PI/2+TAU*q);ctx.stroke()}ctx.restore()}
const vxPropEntry=(o,prop,extra)=>Object.assign({kind:'prop',key:'prop:'+prop,prop,x:o.x,y:o.y,face:-Math.PI/4,size:1.2},extra||{});
function vxProp(o){const k=o.k,t=G.t,d=k.startsWith('sq_')?sideDef(o.q)||{}:{};
  if(k==='sq_item'){W3.heroes.push(vxPropEntry(o,'item',{size:1.3}));return true}
  if(k==='sq_totem'){vxRing(o,o.d?'#5c7a68':'rgba(160,110,230,.7)',[6,6],clamp((o.t||0)/SIDE_CHANNEL,0,1),'#8fe6b8');shadow(o.x,o.y,10);
    W3.heroes.push(vxPropEntry(o,'totem',{key:'prop:totem'+(o.d?1:0),cols:{rune:o.d?0x8fe6b8:0x9a7ad8}}));return true}
  if(k==='sq_lost'){const sheep=/sheep/i.test(d.item||'');if(!sheep&&!/hound|dog/i.test(d.item||''))return false;shadow(o.x,o.y,9);const f=vxFaceOf(o,-Math.PI/4);
    W3.heroes.push(vxPropEntry(o,sheep?'sheep':'hound',{face:f.a,moving:f.moving||!!o.by}));
    if(!o.by)vxActor(o,e=>{ctx.save();ctx.font='700 12px "Alegreya",serif';ctx.textAlign='center';ctx.fillStyle='#f0e2c4';ctx.strokeStyle='#1a0e04';ctx.lineWidth=3;ctx.strokeText('Help!',e.x,e.y-46);ctx.fillText('Help!',e.x,e.y-46);ctx.restore()});return true}
  if(k==='sq_parcel'){shadow(o.x,o.y,8);W3.heroes.push(vxPropEntry(o,'parcel',{size:1}));return true}
  if(k==='sq_drop'){vxRing(o,'rgba(232,200,142,'+(.5+.3*Math.sin(t*3)).toFixed(2)+')',null,0);W3.heroes.push(vxPropEntry(o,'flag',{size:1}));return true}
  if(k==='sq_shrine'){vxRing(o,'rgba(240,194,60,.55)',[10,8],clamp((o.t||0)/((sideOf(o.q)||{}).need||20),0,1),'#f0c23c');shadow(o.x,o.y,16);W3.heroes.push(vxPropEntry(o,'shrine',{size:1}));return true}
  if(k==='escort'){ctx.fillStyle='rgba(10,18,26,.4)';ctx.beginPath();ctx.ellipse(o.x,o.y+4,o.r+6,o.r*.5,0,0,TAU);ctx.fill();const f=vxFaceOf(o,-Math.PI/4);
    W3.heroes.push(vxPropEntry(o,'boat',{key:'prop:boat'+(o.d?1:0),cols:{lamp:o.d?0x5c7a68:0xffe9a8},face:f.a,size:Math.max(.6,(o.r||22)/22)}));return true}
  if(k==='canister'){if(o.d)return true;shadow(o.x,o.y,o.r||8);W3.heroes.push(vxPropEntry(o,'canister',{z:o.by?4:0,size:1}));return true}
  if(k==='purifier'){W3.heroes.push(vxPropEntry(o,'purifier',{size:1}));return true}
  if(k==='generator'){W3.heroes.push(vxPropEntry(o,'generator',{key:'prop:gen'+(o.d?2:o.by?1:0),cols:{gen:o.d?0x72c995:0x8c826c,genlight:o.d?0xb9ffca:o.by?0xffd080:0x5a4940},size:1}));return true}
  return false}
/* Minions (weak and strong) stand as block bodies built from their rig record; strong ones are larger, as in 2D */
const vxMinion=e=>!!(e.mob&&SPECS[e.name]&&!e.scrapDown);
function vxMinionOf(e){const sp=SPECS[e.name];return{kind:'rig',key:'rig:'+e.name,name:e.name,spec:sp,art:{head:vxHeadArt(e.name)},wart:vxWeaponArt(sp.w,sp.wc,sp.s),weapon:sp.w,wc:sp.wc,size:1.55*(e.mob==='strong'?MINION_SIZE:1),x:e.x,y:e.y,face:e.ang||0,moving:!!e.moving,
  atk:e.wind>0||e.atkShow>0,hit:e.stunT>0?.2:e.flash>0?Math.min(.2,e.flash):0,dash:-1,dead:false,blink:false,sink:typeof inWater==='function'&&inWater(e)}}
/* The upright effect layer: whatever a draw function paints around an actor (its sprite is swallowed when it has a block
   body) lands on one picture that stands up at the actor's feet facing the camera, so arcs, rings and glows stand too. */
function vxActor(e,draw,cw=200,ch=240,fy=200){
  let cv=W3.bossCv.get(e);if(!cv||cv.width!==cw||cv.height!==ch){cv=document.createElement('canvas');cv.width=cw;cv.height=ch;W3.bossCv.set(e,cv)}
  const g=cv.getContext('2d'),keep=ctx,b=W3.baking,sh=shadowTo;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cw,ch);g.imageSmoothingEnabled=false;g.setTransform(1,0,0,1,cw/2-e.x,fy-e.y);ctx=g;W3.baking=true;shadowTo=keep;
  try{draw(e)}finally{ctx=keep;W3.baking=b;shadowTo=sh}
  const l=e.x-cw/2,t=e.y-fy;W3.cards.push({canvas:cv,q:[l,t,l+cw,t,l+cw,t+ch,l,t+ch],footY:e.y,dynamic:true});
}
