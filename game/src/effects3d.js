/* Pixel 3D: the world drawn with Three.js (game/three/, bundled as vendor/three-world.js), then reduced to
   the DAYRIM-64 palette with ordered dither and ink outlines. Visual only: rules and hit areas never read it.
   Without WebGL, or when frames run slow, the game falls back to the classic 2D drawing. */
const FX3={enabled:false,layer:null,loading:false,failed:false};
const fx3Canvas=$('fx3'),fx3Button=$('fx3btn');
const W3={seen:new WeakSet(),d3:false,uctx:null,octx:null,base:null,baseInv:null,cards:[],w:null,tide:-1,props:new Map(),bossCv:new Map(),baking:false,slow:0,slowT:0,
  opts:{pal:true,ink:true,dither:true}};
const gfxLabel=()=>FX3.failed?'Graphics: Classic 2D (3D unavailable)':FX3.enabled?'Graphics: Pixel 3D':'Graphics: Classic 2D';
async function setFx3(on){
  FX3.enabled=on;store.set('dayrim-gfx',on?'pixel3d':'classic');fx3Button.textContent=gfxLabel();fx3Button.setAttribute('aria-pressed',String(on));
  if(!on){fx3Canvas.hidden=true;return}if(FX3.layer||FX3.loading)return;FX3.loading=true;
  try{const mod=await import(new URL(THREE_WORLD_URL,document.baseURI).href);FX3.layer=mod.createWorld(fx3Canvas);FX3.failed=false;W3.w=null}
  catch(e){console.warn('Pixel 3D unavailable',e);FX3.failed=true;FX3.enabled=false;fx3Button.textContent=gfxLabel();fx3Button.setAttribute('aria-pressed','false');fx3Canvas.hidden=true}
  finally{FX3.loading=false}
}
function fx3Off(reason){if(FX3.layer)try{FX3.layer.dispose()}catch(e){}FX3.layer=null;FX3.enabled=false;FX3.failed=true;fx3Canvas.hidden=true;fx3Button.textContent=gfxLabel();fx3Button.setAttribute('aria-pressed','false');console.warn('Pixel 3D off:',reason)}
fx3Canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fx3Off('context lost')});
fx3Button.onclick=()=>setFx3(!FX3.enabled);
blitHook=w3Card;
// for checking the look in the browser console: DAYRIM_GFX.pal / .ink / .dither = false
window.DAYRIM_GFX=W3.opts;W3.opts.finalPreview=art=>{G.fx.push({k:'bossult',art,name:art,move:FINAL.names[art]||'Final assault',x:0,y:0,t:FINAL.wind+.5,m:FINAL.wind+.5});return 'ok'};W3.opts.bossSheet=()=>{const c=bossSheet();c.style.cssText='position:fixed;left:0;top:0;z-index:99;width:auto;height:100vh;image-rendering:pixelated';c.id='bosssheet';const old=document.getElementById('bosssheet');if(old)old.remove();document.body.appendChild(c);return c.width+'x'+c.height};Object.defineProperty(W3.opts,'state',{get:()=>({cards:W3.cards.map(c=>[c.canvas.width,Math.round(c.footY)]),slow:W3.slow,fx:FX3.layer&&FX3.layer.stats(),p:G.p&&[Math.round(G.p.x),Math.round(G.p.y)],water:(()=>{const i=G.w.ground.findIndex((g,j)=>g===3&&!G.w.map[j]);return i<0?null:[(i%MW+.5)*T,((i/MW|0)+.5)*T]})(),tree:(G.w.props.find(o=>o.t==='tree')||{}).x}),enumerable:false});
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
    W3.theme=FX3.layer.setStage({map:G.w.map,ground:G.w.ground,MW,MH,T,chunks:b.chunks,front:b.front,wallH:WALL_H,edge:(look?BIOMES[STAGES[look-1].biome]:G.w.biome).w[2],stage:look||G.stage,story:!look&&!!G.story,ci:G.story?G.story.ci:0,props:G.w.props,avoid})}
  W3.w=G.w;W3.tide=tide;W3.look=look;
}

/* ---- the frame: 2D layers under and over the 3D world, plus sprite cards ---- */
function w3Begin(cam,sx,sy){
  w3Stage();
  // DAYRIM_GFX.peek={x,y} moves only the picture (for screenshots); the game camera is unchanged
  if(W3.opts.peek)cam=W3.opts.peek;
  const L=FX3.layer,vw=W/zoom,vh=H/zoom,iw=Math.max(16,Math.round(vw/PS)),ih=Math.max(16,Math.round(vh/PS));
  W3.f={iw,ih,vw,vh,cx:cam.x+sx,cy:cam.y+sy};
  for(const cv of [L.underCanvas,L.overCanvas])if(cv.width!==iw||cv.height!==ih){cv.width=iw;cv.height=ih}
  W3.base=new DOMMatrix([iw/vw,0,0,ih/vh,iw/2-(cam.x+sx)*iw/vw,ih/2-(cam.y+sy)*ih/vh]);W3.baseInv=W3.base.inverse();
  for(const c of [L.underCtx,L.overCtx]){c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,iw,ih);c.imageSmoothingEnabled=false;c.setTransform(W3.base)}
  W3.uctx=L.underCtx;W3.octx=L.overCtx;W3.cards.length=0;W3.d3=true;ctx=W3.uctx;shadowTo=W3.uctx;
}
/* blit() hands its sprite here when it would draw on the over layer at full opacity */
function w3Card(c2,name,x,y,dir,anim,f,flip,rot,alpha,wpn,size,mo){
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
  W3.frame=Object.assign({W,H,dpr,cards:W3.cards,opts:W3.opts},W3.f,lt);
}
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
