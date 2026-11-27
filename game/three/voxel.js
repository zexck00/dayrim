/* Voxel preview (proof of concept, Stage 1 with the Detective): an isometric camera, block ground and walls,
   block trees and a block-built Detective. Drawing only: the map, collisions and rules are the game's own.
   World axes as everywhere: x east, y south, z up, one unit = one 2D pixel. */
import {Group,InstancedMesh,BoxGeometry,MeshLambertMaterial,Object3D,Color,Mesh,PlaneGeometry,CanvasTexture,NearestFilter,NoColorSpace} from '../vendor/three.module.js';

export const ISO_ELEV=40*Math.PI/180;
const SE=Math.sin(ISO_ELEV),CE=Math.cos(ISO_ELEV),H2=Math.SQRT1_2;
/* Screen right and screen up as ground directions: the map is turned 45° clockwise, so roads run diagonally */
export const ISO_R=[H2,-H2],ISO_U=[-H2,-H2],ISO_TURN=-Math.PI/4;
/* Pixels per world unit. The visible ground area matches the classic view's area, so nobody sees more. */
export const isoScale=zoom=>zoom/Math.sqrt(SE);
/* World (x,y,z) → clip space for an orthographic isometric view centred on (cx,cy) */
export function isoMatrix(cx,cy,W,H,s,R=4000){
  const k1=2*s/W,k2=2*s/H,c0=ISO_R[0]*cx+ISO_R[1]*cy,c1=ISO_U[0]*cx+ISO_U[1]*cy;
  return[k1*ISO_R[0],k1*ISO_R[1],0,-k1*c0, k2*ISO_U[0]*SE,k2*ISO_U[1]*SE,k2*CE,-k2*SE*c1, ISO_U[0]*CE/R,ISO_U[1]*CE/R,-SE/R,-CE*c1/R, 0,0,0,1];
}
/* Where a world point lands on screen (CSS pixels) */
export function isoProject(x,y,z,cx,cy,W,H,s){const dx=x-cx,dy=y-cy;return{x:W/2+s*(dx*ISO_R[0]+dy*ISO_R[1]),y:H/2-s*((dx*ISO_U[0]+dy*ISO_U[1])*SE+z*CE)}}
/* The ground point (at height h) under a screen point */
export function isoUnproject(sx,sy,cx,cy,W,H,s,h=0){const a=(sx-W/2)/s,b=(H/2-sy)/s,u=(b-h*CE)/SE;return{x:cx+a*ISO_R[0]+u*ISO_U[0],y:cy+a*ISO_R[1]+u*ISO_U[1]}}
/* Distance from the camera along its view (larger is farther) */
export function isoDepth(x,y,cx,cy){return((x-cx)*ISO_U[0]+(y-cy)*ISO_U[1])*CE}
/* Half-size of a ground square that covers the whole view */
export function isoSpan(W,H,s){return(W/(2*s)+H/(2*s)/SE)*H2}
export function isoInView(x,y,cx,cy,W,H,s,m=60){const dx=x-cx,dy=y-cy,a=dx*ISO_R[0]+dy*ISO_R[1],b=(dx*ISO_U[0]+dy*ISO_U[1])*SE;return Math.abs(a)<W/(2*s)+m&&b>-H/(2*s)-m-120&&b<H/(2*s)+m}
/* Sprite cards lean back to face the camera: this is "up" on a card */
export const BILL_V=[ISO_U[0]*SE,ISO_U[1]*SE,CE];

/* This view turns the picture like a mirror does, so solid shapes are flipped once (positions, normals and
   winding together) to keep their outside faces towards the camera. A flipped box is the same box. */
const flipBox=(w,d,h)=>new BoxGeometry(w,d,h).scale(1,-1,1);
const hash=(x,y)=>{let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)|0;h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296};
const C255=v=>v<0?0:v>255?255:v;
export const CELL=10;

/* Ground: every 10×10 cell takes the average colour of the stage's own 2D ground art there, with a small
   colour jitter and a light and dark rim, so paths, water edges and details stay where they are */
function groundCanvas(st){
  const {MW,MH,T}=st,K=T/CELL,P=4,cw=MW*K*P,ch=MH*K*P,cv=document.createElement('canvas');cv.width=cw;cv.height=ch;
  const g=cv.getContext('2d'),img=g.createImageData(cw,ch),d=img.data,grass=[];
  for(const c of st.chunks){const w=c.canvas.width,h=c.canvas.height,src=c.canvas.getContext('2d').getImageData(0,0,w,h).data,sc=w/((c.tx1-c.tx0)*T);
    for(let cy=c.ty0*K;cy<c.ty1*K;cy++)for(let cx=c.tx0*K;cx<c.tx1*K;cx++){
      let r=0,gg=0,b=0;
      for(const o of [[2,2],[7,3],[3,7],[7,7],[5,5]]){const px=Math.min(w-1,Math.max(0,Math.floor((cx*CELL+o[0]-c.tx0*T)*sc))),py=Math.min(h-1,Math.max(0,Math.floor((cy*CELL+o[1]-c.ty0*T)*sc))),i=(py*w+px)*4;r+=src[i];gg+=src[i+1];b+=src[i+2]}
      r/=5;gg/=5;b/=5;const j=1+(hash(cx,cy)-.5)*.16;
      const ti=((cy/K)|0)*MW+((cx/K)|0);if(!st.map[ti]&&!st.ground[ti]&&gg>r*1.05&&gg>b)grass.push(cx,cy);
      for(let py=0;py<P;py++)for(let px=0;px<P;px++){const k=(px===0||py===0)?1.09:(px===P-1||py===P-1)?.84:1,o=((cy*P+py)*cw+cx*P+px)*4;
        d[o]=C255(r*j*k);d[o+1]=C255(gg*j*k);d[o+2]=C255(b*j*k);d[o+3]=255}}}
  g.putImageData(img,0,0);return{canvas:cv,grass};
}

/* One instanced cube mesh for every block in the scene (walls, trees, flowers). Positions are block centres. */
function blocks(list){
  const geo=flipBox(1,1,1),mat=new MeshLambertMaterial({color:0xffffff}),n=list.length/7,m=new InstancedMesh(geo,mat,Math.max(1,n));
  const o=new Object3D(),c=new Color();
  for(let i=0;i<n;i++){const k=i*7;o.position.set(list[k],list[k+1],list[k+2]);o.scale.set(list[k+3],list[k+4],list[k+5]);o.updateMatrix();m.setMatrixAt(i,o.matrix);c.setHex(list[k+6]);m.setColorAt(i,c)}
  m.count=n;m.castShadow=m.receiveShadow=true;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;
  m.userData.dispose=()=>{geo.dispose();mat.dispose();m.dispose()};return m;
}
const hex=s=>parseInt(String(s).replace('#','').slice(0,6),16)||0x888888;
function jit(h,k){const c=new Color(h),f=1+(k-.5)*.18;c.r=Math.min(1,c.r*f);c.g=Math.min(1,c.g*f);c.b=Math.min(1,c.b*f);return c.getHex()}

/* st: the same stage record Pixel 3D gets ({map,ground,MW,MH,T,chunks,props,biome}); th: the stage theme */
export function buildVoxel(st,th){
  const {map,MW,MH,T}=st,root=new Group(),L=[];
  const box=(x,y,z,w,d,h,col)=>L.push(x,y,z+h/2,w,d,h,col);
  const gc=groundCanvas(st),tex=new CanvasTexture(gc.canvas);tex.minFilter=tex.magFilter=NearestFilter;tex.colorSpace=NoColorSpace;tex.generateMipmaps=false;
  const gm=new MeshLambertMaterial({map:tex}),gg=new PlaneGeometry(MW*T,MH*T).scale(1,-1,1),ground=new Mesh(gg,gm);ground.position.set(MW*T/2,MH*T/2,0);ground.receiveShadow=true;root.add(ground);
  // walls: 2×2 columns per wall tile, a 14-unit stone course and a 12-unit leafy top (about the 26-unit wall of
  // Pixel 3D, low enough to see over); a few columns grow one more leafy block; inner tiles keep only the top
  const B=st.biome||{w:['#6a6a6a','#5a5a5a','#3a3a3a'],leaf:['#3f9048','#2f7a3f']},isWall=(x,y)=>x<0||y<0||x>=MW||y>=MH||!!map[y*MW+x];
  for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++){if(!map[ty*MW+tx])continue;
    const inner=isWall(tx-1,ty)&&isWall(tx+1,ty)&&isWall(tx,ty-1)&&isWall(tx,ty+1);
    for(let j=0;j<2;j++)for(let i=0;i<2;i++){const x=tx*T+10+i*20,y=ty*T+10+j*20,hh=hash(tx*2+i,ty*2+j),leaf=jit(B.leaf[(hh*7|0)%B.leaf.length],hash(x,y));
      if(!inner)box(x,y,0,20,20,14,jit(B.w[(hh*3|0)%2],hash(y,x)));box(x,y,inner?6:14,20,20,inner?20:12,leaf);if(hh>.86)box(x,y,26,20,20,10,jit(leaf,hh))}}
  // vegetation from the stage's own props, on the same spots
  const C=th.canopy.map(hex),S=th.shrub.map(hex),F=th.flower.map(hex),G=th.grass.map(hex),trunk=hex(th.trunk);
  for(const p of st.props){const h=hash(p.x|0,p.y|0),x=p.x,y=p.y;
    if(p.t==='tree'){const s=1+(p.v||0)*.12;box(x,y,0,9,9,16*s,jit(trunk,h));const col=C[(h*C.length)|0]||C[0];
      for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)box(x+i*13,y+j*13,16*s,13,13,13,jit(col,hash(x+i,y+j)));
      for(let j=0;j<2;j++)for(let i=0;i<2;i++)box(x-6.5+i*13,y-6.5+j*13,29*s,13,13,12,jit(col,hash(x-i,y-j)));box(x,y,41*s,12,12,9,jit(col,h))}
    else if(p.t==='shrub'||p.t==='thicket'){const col=S[(h*S.length)|0]||S[0];for(let i=0;i<3;i++)box(x+(hash(x,i)-.5)*16,y+(hash(i,y)-.5)*12,0,11,11,9+hash(x+i,y)*6,jit(col,hash(x+i,y-i)))}
    else if(p.t==='rock')for(let i=0;i<2;i++)box(x+i*7-3,y+i*3,0,12-i*4,10-i*3,8-i*3,jit(0x8a8a90,hash(x,y+i)));
    else if(p.t==='flower'){box(x,y,0,2,2,6,0x3f7a3a);box(x,y,6,5,5,4,F[(h*F.length)|0]||F[0])}
    else if(p.t==='mush'){box(x,y,0,3,3,6,0xe8e0d0);box(x,y,6,8,8,4,0xc84a3a)}
    else if(p.t==='lily')box(x,y,.5,9,9,1,0x4f8a3f);
    else if(p.t==='grass'||p.t==='fern'||p.t==='reed')for(let i=0;i<3;i++)box(x+(i-1)*4,y+(hash(x,i)-.5)*4,0,3,3,5+hash(i,x)*7,jit(G[(h*G.length)|0]||G[0],hash(x+i,y)))}
  // scattered flower blocks on open grass, as decoration only
  for(let i=0;i<gc.grass.length;i+=2){const cx=gc.grass[i],cy=gc.grass[i+1],h=hash(cx*3,cy*7);if(h>.035)continue;
    box(cx*CELL+5,cy*CELL+5,0,4,4,3+h*40,F[(hash(cy,cx)*F.length)|0]||F[0])}
  const bm=blocks(L);root.add(bm);
  root.userData.dispose=()=>{bm.userData.dispose();gg.dispose();gm.dispose();tex.dispose()};
  return root;
}

/* ---- the block-built Detective ---- */
const DET={skin:0xf0c8a0,hair:0x3a2a20,hat:0x6b5540,band:0x3a2c20,coat:0xd2b486,coatD:0xb89a6c,shirt:0x39404e,tie:0x8a2a2a,legs:0x4a4238,shoe:0x20232c,eye:0x1c2430,gun:0x2a2c34};
function heroModel(){
  const mats=new Map(),mat=c=>{if(!mats.has(c))mats.set(c,new MeshLambertMaterial({color:c}));return mats.get(c)},geos=[];
  const part=(parent,w,d,h,c,x,y,z)=>{const g=flipBox(w,d,h);geos.push(g);const m=new Mesh(g,mat(c));m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m};
  const root=new Group(),body=new Group(),inner=new Group();root.add(body);body.position.z=24;body.add(inner);inner.position.z=-24;
  const limb=(x,y,z)=>{const g=new Group();g.position.set(x,y,z);inner.add(g);return g};
  const legL=limb(0,3.6,14),legR=limb(0,-3.6,14);
  for(const l of [legL,legR]){part(l,5.5,5,12,DET.legs,0,0,-6);part(l,8,6,3,DET.shoe,1.2,0,-12.5)}
  part(inner,10,14,7,DET.coatD,0,0,11.5);// coat skirt
  part(inner,10,14,15,DET.coat,0,0,22.5);// coat body
  part(inner,1,5,11,DET.shirt,5.2,0,23);part(inner,1.2,1.8,8,DET.tie,5.6,0,22.5);
  part(inner,10.6,14.6,1.6,DET.band,0,0,16);// belt
  const armL=limb(0,9,29),armR=limb(0,-9,29);
  for(const a of [armL,armR]){part(a,4.6,4.6,13,DET.coat,0,0,-6.5);part(a,4,4,3,DET.skin,0,0,-14.3)}
  const gun=part(armR,3,2.4,9,DET.gun,1.2,0,-18);part(armR,4,2.4,2.6,DET.gun,3.4,0,-15.2);
  const head=limb(0,0,30.5);
  part(head,14,14,13,DET.skin,0,0,6.5);part(head,6,14.4,6,DET.hair,-4.4,0,8);part(head,14.4,14.4,2,DET.hair,-.2,0,12.4);
  part(head,1,2.4,2.8,DET.eye,7.1,3.2,6.8);part(head,1,2.4,2.8,DET.eye,7.1,-3.2,6.8);part(head,1,3.2,.8,DET.hair,7.1,3.2,8.9);part(head,1,3.2,.8,DET.hair,7.1,-3.2,8.9);part(head,1,7,2.2,0xc89878,7.1,0,2.2);part(head,1,3,1,0x8a4a3a,7.2,0,3.4);// eyes, brows, stubble, mouth
  const hat=new Group();hat.position.set(-1.5,0,14);hat.rotation.y=-.18;head.add(hat);// tipped back so the face shows
  part(hat,17,17,1.6,DET.hat,0,0,0);part(hat,11.6,11.6,6,DET.hat,0,0,3.6);part(hat,12,12,1.6,DET.band,0,0,1.4);part(hat,11.6,4,1.4,0x5a4632,0,0,6.6);
  return{root,body,inner,legL,legR,armL,armR,head,gun,mats,dispose(){geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose())}};
}
/* About the height of the cast's sprite cards, so the Detective stands as tall as everyone else */
const HERO_SIZE=1.3;
/* h: {x,y,face,moving,sprint,atk,guard,hit,dash,dead,blink,sink} */
function poseHero(M,h,t){
  M.root.visible=!h.blink;M.root.position.set(h.x,h.y,h.sink?-6:0);M.root.rotation.z=h.face;M.root.scale.setScalar(HERO_SIZE);
  const ph=t*(h.sprint?16:11),sw=h.moving?Math.sin(ph):0;
  M.inner.position.z=-24+(h.moving?Math.abs(Math.sin(ph))*1.6:Math.sin(t*2.4*Math.PI)*.5);
  M.legL.rotation.y=sw*.7;M.legR.rotation.y=-sw*.7;
  M.armL.rotation.set(0,-sw*.6,0);M.armR.rotation.set(0,sw*.6,0);M.head.rotation.set(0,0,0);
  let tilt=h.sprint&&h.moving?.16:0;
  if(h.atk){M.armR.rotation.set(0,-Math.PI/2,0);M.armL.rotation.set(0,-.5,0)}
  if(h.guard){M.armL.rotation.set(0,-1.3,0);M.armR.rotation.set(0,-1.3,0)}
  if(h.hit>0){const k=Math.min(1,h.hit*5);tilt=-.45*k;M.armL.rotation.set(.9*k,-.6*k,0);M.armR.rotation.set(-.9*k,-.6*k,0);M.head.rotation.y=-.3*k}
  M.body.position.z=24;
  if(h.dash>=0)tilt=Math.PI*2*h.dash;
  if(h.dead){tilt=-Math.PI/2;M.body.position.z=7}
  M.body.rotation.y=tilt;
  const f=h.hit>0?Math.min(.9,h.hit*4):0;M.mats.forEach(m=>m.emissive.setRGB(f,f,f));
}
export function createHeroes(root){
  const pool=[];
  return{
    update(list,t){for(let i=0;i<list.length;i++){const M=pool[i]||(pool[i]=heroModel(),root.add(pool[i].root),pool[i]);M.root.visible=true;poseHero(M,list[i],t)}
      for(let i=list.length;i<pool.length;i++)pool[i].root.visible=false},
    dispose(){pool.forEach(M=>{root.remove(M.root);M.dispose()})}
  };
}
