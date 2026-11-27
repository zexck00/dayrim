/* Voxel preview (proof of concept, Stage 1 with the Detective): an isometric camera, block ground and walls,
   block trees and a block-built Detective. Drawing only: the map, collisions and rules are the game's own.
   World axes as everywhere: x east, y south, z up, one unit = one 2D pixel. */
import {kitGeometry,scatterExtras} from './vegetation.js';
import {Group,InstancedMesh,BoxGeometry,IcosahedronGeometry,MeshLambertMaterial,MeshBasicMaterial,Object3D,Color,Mesh,PlaneGeometry,CanvasTexture,NearestFilter,NoColorSpace} from '../vendor/three.module.js';

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

/* Blocks grouped by map area (CHUNK world units square), one instanced mesh per area and per glow, so areas off
   screen are skipped. list: [x,y,z(centre),w,d,h,colour] per block; glow lists draw unlit (crystals, embers, caps). */
const CHUNK=640;
function chunkedBlocks(list,glow){const g=new Group(),parts=[];
  const split=(L,isGlow)=>{const by=new Map();for(let i=0;i<L.length;i+=7){const k=Math.floor(L[i]/CHUNK)+'|'+Math.floor(L[i+1]/CHUNK);let a=by.get(k);if(!a)by.set(k,a=[]);for(let j=0;j<7;j++)a.push(L[i+j])}
    by.forEach(a=>{const m=blocks(a,isGlow);m.frustumCulled=true;m.computeBoundingSphere();if(m.boundingSphere)m.boundingSphere.radius+=60;g.add(m);parts.push(m)})};
  split(list,false);split(glow,true);g.userData.dispose=()=>parts.forEach(m=>m.userData.dispose());g.userData.count=(list.length+glow.length)/7;return g}
/* One instanced cube mesh for a list of blocks. Positions are block centres. */
function blocks(list,glow){
  const geo=flipBox(1,1,1),mat=glow?new MeshBasicMaterial({color:0xffffff}):new MeshLambertMaterial({color:0xffffff}),n=list.length/7,m=new InstancedMesh(geo,mat,Math.max(1,n));
  const o=new Object3D(),c=new Color();
  for(let i=0;i<n;i++){const k=i*7;o.position.set(list[k],list[k+1],list[k+2]);o.scale.set(list[k+3],list[k+4],list[k+5]);o.updateMatrix();m.setMatrixAt(i,o.matrix);c.setHex(list[k+6]);m.setColorAt(i,c)}
  m.count=n;m.castShadow=!glow;m.receiveShadow=!glow;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;
  m.userData.dispose=()=>{geo.dispose();mat.dispose();m.dispose()};return m;
}
/* Sizes of a block when a 3D kit is turned into voxels: trees and big scenery chunky, small plants finer */
const VOX_SIZE={tree:6,ruin:3,shrub:4,thicket:4.5,grass:2,fern:2.5,flower:2,mush:2,lily:2.5,reed:2,rock:4,extra:3};
/* A mesh with vertex colours turned into blocks: triangles are sampled finely and each sample marks the block it
   falls in, with that triangle's colour. Returns [x,y,z,colour,...] block centres (z from the mesh's bottom). */
export function voxelizeGeometry(geo,size){const P=geo.attributes.position.array,C=geo.attributes.color&&geo.attributes.color.array,cells=new Map(),step=size*.45;
  for(let t=0;t<P.length;t+=9){const ax=P[t],ay=P[t+1],az=P[t+2],bx=P[t+3]-ax,by=P[t+4]-ay,bz=P[t+5]-az,cx=P[t+6]-ax,cy=P[t+7]-ay,cz=P[t+8]-az;
    const n=Math.max(1,Math.ceil(Math.max(Math.hypot(bx,by,bz),Math.hypot(cx,cy,cz))/step)),col=C?((Math.round(C[t]*255)<<16)|(Math.round(C[t+1]*255)<<8)|Math.round(C[t+2]*255)):0x888888;
    for(let i=0;i<=n;i++)for(let j=0;i+j<=n;j++){const u=i/n,v=j/n,x=ax+bx*u+cx*v,y=ay+by*u+cy*v,z=az+bz*u+cz*v,k=Math.floor(x/size)+','+Math.floor(y/size)+','+Math.floor(z/size);if(!cells.has(k))cells.set(k,col)}}
  // keep only blocks that touch the outside: flood the empty space from the edges of a padded box, so the hidden
  // shells where parts overlap (canopy inside canopy) are dropped
  let x0=1e9,y0=1e9,z0=1e9,x1=-1e9,y1=-1e9,z1=-1e9;const keys=[];cells.forEach((c,k)=>{const a=k.split(',').map(Number);keys.push(a);x0=Math.min(x0,a[0]);y0=Math.min(y0,a[1]);z0=Math.min(z0,a[2]);x1=Math.max(x1,a[0]);y1=Math.max(y1,a[1]);z1=Math.max(z1,a[2])});
  if(!keys.length)return[];const nx=x1-x0+3,ny=y1-y0+3,nz=z1-z0+3,id=(i,j,l)=>((l-z0+1)*ny+(j-y0+1))*nx+(i-x0+1),solid=new Uint8Array(nx*ny*nz),outside=new Uint8Array(nx*ny*nz);
  for(const a of keys)solid[id(a[0],a[1],a[2])]=1;
  const st=[0];outside[0]=1;while(st.length){const q=st.pop(),i=q%nx,j=((q/nx)|0)%ny,l=(q/(nx*ny))|0;for(const [di,dj,dl] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){const a=i+di,b=j+dj,c=l+dl;if(a<0||b<0||c<0||a>=nx||b>=ny||c>=nz)continue;const r=(c*ny+b)*nx+a;if(outside[r]||solid[r])continue;outside[r]=1;st.push(r)}}
  const out=[],seen=(i,j,l)=>{const a=i-x0+1,b=j-y0+1,c=l-z0+1;return a<0||b<0||c<0||a>=nx||b>=ny||c>=nz||outside[(c*ny+b)*nx+a]};
  for(const a of keys){const [i,j,l]=a;if(!(seen(i+1,j,l)||seen(i-1,j,l)||seen(i,j+1,l)||seen(i,j-1,l)||seen(i,j,l+1)||seen(i,j,l-1)))continue;out.push((i+.5)*size,(j+.5)*size,(l+.5)*size+size/2,cells.get(i+','+j+','+l))}
  return out}
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
  // ---- vegetation: the stage theme's own 3D kit (Pixel 3D), turned into blocks ----
  // Each kind and variant is voxelised once (VOX_SIZE units a block), then placed on every spot the 2D map uses,
  // turned by a quarter step so the block grid stays square to the camera. Trees on wall tiles stand on the wall.
  const GL=[],glowBox=(x,y,z,w,d,h,col)=>GL.push(x,y,z+h/2,w,d,h,col),kits=new Map();
  const kitVox=(kind,v)=>{const k=kind+'|'+v;if(kits.has(k))return kits.get(k);const g=kitGeometry(kind,th,v),size=VOX_SIZE[kind]||VOX_SIZE.extra;
    const out=g?{size,solid:g.solid?voxelizeGeometry(g.solid,size):[],glow:g.glow?voxelizeGeometry(g.glow,size):[]}:null;if(g){g.solid&&g.solid.dispose();g.glow&&g.glow.dispose()}kits.set(k,out);return out};
  const baseZ=(x,y)=>{const tx=Math.floor(x/T),ty=Math.floor(y/T);return tx>=0&&ty>=0&&tx<MW&&ty<MH&&map[ty*MW+tx]?26:0};
  const place=(kind,v,x,y)=>{const kv=kitVox(kind,((v|0)%3+3)%3);if(!kv)return false;const q=(hash(x|0,y|0)*4)|0,z0=baseZ(x,y),sz=kv.size;
    const put=(arr,list)=>{for(let i=0;i<arr.length;i+=4){let a=arr[i],b=arr[i+1];if(q===1){const t=a;a=-b;b=t}else if(q===2){a=-a;b=-b}else if(q===3){const t=a;a=b;b=-t}
      list(x+a,y+b,z0+arr[i+2]-sz/2,sz,sz,sz,arr[i+3])}};put(kv.solid,box);put(kv.glow,glowBox);return true};
  for(const p of st.props){if(p.t==='lamp')continue;if(!place(p.t,p.v,p.x,p.y)&&p.t==='reed')place('reed',p.v,p.x,p.y)}
  // the stage's scattered scenery (stones, stumps, webs, bones, columns, crystals, lava…), placed as in Pixel 3D
  for(const e of scatterExtras(th,st,st.avoid||[]))place(e.t,e.v,e.x,e.y);
  // ---- ground details: grass tufts, pebbles, mud and puddles, plank bridges, stones on the shore, fallen logs ----
  const F=th.flower.map(hex),G=th.grass.map(hex),gnd=st.ground||[],water=i=>gnd[i]===3,open=i=>!map[i];
  for(let ty=1;ty<MH-1;ty++)for(let tx=1;tx<MW-1;tx++){const i=ty*MW+tx;if(!open(i))continue;const gt=gnd[i],x0=tx*T,y0=ty*T,h=hash(tx*7,ty*13);
    if(!gt){// grass: tufts of three blades, a few flowers, now and then a fallen log
      for(let k=0;k<2;k++){const hk=hash(tx*31+k,ty*17-k);if(hk>.55)continue;const x=x0+4+hash(tx,ty+k*9)*32,y=y0+4+hash(ty+k*5,tx)*32,c=G[(hk*G.length*1.9|0)%G.length];
        for(let b=0;b<3;b++)box(x+(b-1)*2.4,y+(b%2)*1.6,0,2,2,3+hash(x+b,y)*5,jit(c,hash(y+b,x)))}
      if(h<.012){const len=26+hash(tx,ty)*14,yy=y0+20;box(x0+20,yy,0,len,6,6,jit(hex(th.trunk),h));box(x0+20+len/2+.6,yy,.5,1.2,5,5,0xc8a070);box(x0+20-len/2-.6,yy,.5,1.2,5,5,0xc8a070)}}
    else if(gt===1){// dirt path: pebbles, and puddles after rain
      if(h<.3)box(x0+6+hash(ty,tx)*28,y0+6+hash(tx+3,ty)*28,0,2.5,2,1.6,jit(0x8a8070,h));
      if(h>.96){const w=10+hash(tx,ty+1)*10;box(x0+20,y0+20,0,w,w*.7,.6,0x7f9cb0);box(x0+18,y0+18,.6,w*.4,w*.25,.2,0xb8d4e4)}}
    else if(gt===2){// bridge: planks across, a post and rail where it meets water
      for(let k=0;k<4;k++)box(x0+5+k*10,y0+20,0,9,40,2.2,k%2?0x8a6a40:0x7a5a34);
      for(const [dx,dy] of [[0,-1],[0,1]])if(water((ty+dy)*MW+tx)){const yy=y0+(dy<0?2:38);box(x0+20,yy,2.2,40,2.4,2.4,0x5a3e24);box(x0+3,yy,0,3,3,12,0x4a3020);box(x0+37,yy,0,3,3,12,0x4a3020)}}
    else if(gt===4){// mud: a darker wet slab with puddles that catch the light
      box(x0+20,y0+20,0,40,40,.5,jit(0x5a3e24,h));for(let k=0;k<2;k++){const hk=hash(tx+k*11,ty-k*3);if(hk<.5){const w=7+hk*12;box(x0+8+hash(tx,k)*24,y0+8+hash(k,ty)*24,.5,w,w*.6,.4,0x6a7a80)}}}
    else if(gt===3){// water edge: a few stones where the shore meets land
      const shore=[i-1,i+1,i-MW,i+MW].some(j=>open(j)&&!water(j)&&gnd[j]!==2);if(shore&&h<.18)box(x0+20+(hash(tx,ty)-.5)*28,y0+20+(hash(ty,tx)-.5)*28,-1,6,5,3,jit(0x7a7a80,h))}}
  // scattered flower blocks on open grass, as decoration only
  for(let i=0;i<gc.grass.length;i+=2){const cx=gc.grass[i],cy=gc.grass[i+1],h=hash(cx*3,cy*7);if(h>.03)continue;
    box(cx*CELL+5,cy*CELL+5,0,3,3,4+h*30,0x3f7a3a);box(cx*CELL+5,cy*CELL+5,4+h*30,4,4,3,F[(hash(cy,cx)*F.length)|0]||F[0])}
  const bm=chunkedBlocks(L,GL);root.add(bm);root.userData.blocks=bm.userData.count;
  root.userData.dispose=()=>{bm.userData.dispose();gg.dispose();gm.dispose();tex.dispose()};
  return root;
}

/* ---- block-built characters ----
   Every model has the same jointed parts (legs, arms, head, a body that can tilt), so one set of poses moves them all:
   the Detective, his Wolf Form, and minions built from their rig record (the same colours and parts as their sprites). */
const DET={skin:0xf0c8a0,hair:0x3a2a20,hat:0x6b5540,band:0x3a2c20,coat:0xd2b486,coatD:0xb89a6c,shirt:0x39404e,tie:0x8a2a2a,legs:0x4a4238,shoe:0x20232c,eye:0x1c2430,gun:0x2a2c34};
const CHAR_GLOW=.28;
/* ---- Chibi art to voxels ----
   art: {w,h,front,side,back (RGBA pixels from the game's own chibi drawings), cx,sx (centre columns of the front and
   side views), top (the row that sits at z 0), k (model units per pixel)}. A block exists where both the front and the
   side view are solid (a visual hull); each outside block takes its colour from the view that faces it, so eyes,
   faces, masks, hats, hair and armour come out exactly as drawn. step>1 samples every step pixels (big forms). */
export function hullVoxels(a,step=1){
  const {w,h,front:F,side:S,back:B,cx,sx,top,k}=a,op=(I,x,y)=>x>=0&&y>=0&&x<w&&y<h&&I[(y*w+x)*4+3]>100,col=(I,x,y)=>{const i=(y*w+x)*4;return(I[i]<<16)|(I[i+1]<<8)|I[i+2]};
  const nx=Math.ceil(w/step),ny=Math.ceil(h/step),grid=new Uint8Array(nx*nx*ny),at=(fx,sz,y)=>grid[(y*nx+sz)*nx+fx],c=q=>q*step+(step>>1);
  for(let y=0;y<ny;y++)for(let fx=0;fx<nx;fx++){if(!op(F,c(fx),c(y)))continue;for(let sz=0;sz<nx;sz++)if(op(S,c(sz),c(y)))grid[(y*nx+sz)*nx+fx]=1}
  const out=[],size=step*k;
  for(let y=0;y<ny;y++)for(let sz=0;sz<nx;sz++)for(let fx=0;fx<nx;fx++){if(!at(fx,sz,y))continue;
    const fr=sz+1>=nx||!at(fx,sz+1,y),bk=sz===0||!at(fx,sz-1,y),sd=fx===0||fx+1>=nx||!at(fx-1,sz,y)||!at(fx+1,sz,y),tp=y===0||!at(fx,sz,y-1),bt=y+1>=ny||!at(fx,sz,y+1);
    if(!fr&&!bk&&!sd&&!tp&&!bt)continue;
    const px=c(fx),py=c(y),pz=c(sz),bx=Math.round(2*cx-px-1);let colour;
    if(fr)colour=col(F,px,py);else if(bk)colour=op(B,bx,py)?col(B,bx,py):col(F,px,py);
    // a face belongs on the front only: the front half of each side takes the front view's edge colour (skin, hair,
    // hat) instead of the profile drawing, whose eye and mouth would otherwise show on both cheeks
    else if(sd&&!tp&&pz>=sx-(a.face||0))colour=col(F,px,py);else colour=col(S,pz,py);
    out.push((pz-sx)*k,(px-cx)*k,(top-py)*k,colour)}
  return{list:out,size};
}
/* A flat chibi drawing (a weapon) given a little thickness: every solid pixel is a block, 3 blocks deep */
export function extrudeVoxels(a){const {w,h,front:F,ax,ay,k,z0}=a,out=[];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(F[i+3]<=100)continue;const colour=(F[i]<<16)|(F[i+1]<<8)|F[i+2];for(let d=-1;d<=1;d++)out.push((x-ax)*k,d*k,z0-(y-ay)*k,colour)}
  return{list:out,size:k}}
/* Voxel material: lit, with more of its own light than the block body (the chibi art already has its shading drawn
   in, and faces turned to the camera are on the sun's far side), and a flash uniform for hits */
const VOX_GLOW=.55,HEAD_TILT=-.3;
function voxMat(){const m=new MeshLambertMaterial({color:0xffffff}),u={value:0};m.userData.flash=u;
  m.onBeforeCompile=sh=>{sh.uniforms.uFlash=u;sh.fragmentShader='uniform float uFlash;\n'+sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n\ttotalEmissiveRadiance+=diffuseColor.rgb*'+VOX_GLOW.toFixed(2)+'+vec3(uFlash);')};return m}
const VOXGEO=flipBox(1,1,1);
function voxMesh(M,v){const n=v.list.length/4,mat=voxMat(),m=new InstancedMesh(VOXGEO,mat,Math.max(1,n)),o=new Object3D(),c=new Color();
  for(let i=0;i<n;i++){const j=i*4;o.position.set(v.list[j],v.list[j+1],v.list[j+2]);o.scale.setScalar(v.size);o.updateMatrix();m.setMatrixAt(i,o.matrix);c.setHex(v.list[j+3]);m.setColorAt(i,c)}
  m.count=n;m.castShadow=true;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;
  if(M){(M.vmats||(M.vmats=[])).push(mat);(M.vmeshes||(M.vmeshes=[])).push(m)}return m}
const HULL=new WeakMap(),hullOf=(a,step)=>{let v=HULL.get(a);if(!v){v=hullVoxels(a,step);HULL.set(a,v)}return v};
function charMat(c){const m=new MeshLambertMaterial({color:c});m.emissive.setHex(c).multiplyScalar(CHAR_GLOW);m.userData.base=m.emissive.clone();return m}
function rigBase(){
  // a little of their own light (CHAR_GLOW) keeps faces turned towards the camera from going dark in the sun's shade
  const mats=new Map(),geos=[],glows=new Map(),mat=c=>{if(!mats.has(c))mats.set(c,charMat(c));return mats.get(c)},
    glowMat=c=>{if(!glows.has(c))glows.set(c,new MeshBasicMaterial({color:c}));return glows.get(c)};
  // glow parts (eyes, orbs, visors) stay bright and are left out of the hit flash
  const part=(parent,w,d,h,c,x,y,z,glow)=>{const g=flipBox(w,d,h);geos.push(g);const m=new Mesh(g,glow?glowMat(c):mat(c));m.position.set(x,y,z);m.castShadow=!glow;parent.add(m);return m};
  const root=new Group(),body=new Group(),inner=new Group();root.add(body);body.position.z=24;body.add(inner);inner.position.z=-24;
  const limb=(x,y,z)=>{const g=new Group();g.position.set(x,y,z);inner.add(g);return g};
  const M={root,body,inner,part,limb,mats,lean:0,wpn:null,wpnG:null,dispose(){geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());glows.forEach(m=>m.dispose());(M.vmeshes||[]).forEach(m=>{m.material.dispose();m.dispose()})}};return M;
}
/* Weapons: every weapon a hero can hold (all 30 pickups plus the heroes' own), as boxes in the right hand's frame:
   the hand is at z -14, the weapon runs down the arm (forward when the arm is raised). The shield goes on the left arm. */
const WD=0x6a4a2a,WD2=0x4a3020,STEEL=0xa8b0b8,GUN=0x2a2c34,GOLD=0xd9a22a;
const WEAPON_BOXES={
  knife:[[1.4,1,8,STEEL,1,0,-19.5],[2,2,3,WD2,1,0,-15.5]],
  cane:[[1.6,1.6,16,0x20222c,1,0,-22],[3,3,2,GOLD,1,0,-14.5]],
  baton:[[2,2,12,0x20222c,1,0,-20]],
  pin:[[3,3,11,0xc8a070,1,0,-20.5],[1.4,1.4,3,WD,1,0,-14],[1.4,1.4,3,WD,1,0,-27.5]],
  wrench:[[2,1.4,12,STEEL,1,0,-20],[2,5,3,STEEL,1,0,-27]],
  hook:[[1.6,1.6,14,0x555a60,1,0,-21],[1.6,4,1.6,0x555a60,1,1.6,-28]],
  torch:[[3,3,8,GUN,1,0,-18],[3.4,3.4,1.2,0xfff6c0,1,0,-22.6,1]],
  money:[[6,6,6,0x8a7a40,1,0,-19],[2,2,2,0x5a4a28,1,0,-15.4]],
  gavel:[[1.6,1.6,10,WD,1,0,-19],[3,7,3,WD2,1,0,-25]],
  bat:[[2.4,2.4,12,0xc89a60,1,0,-20],[3.4,3.4,7,0xc89a60,1,0,-28.5]],
  shovel:[[1.6,1.6,16,WD,1,0,-22],[1,6,7,STEEL,1,0,-32.5]],
  cleaver:[[1.8,1.8,5,WD2,1,0,-16],[1.2,8,10,STEEL,1,2.5,-23]],
  axe:[[2,2,16,0xb02020,1,0,-22],[1.2,8,6,STEEL,1,3,-28]],
  pistol:[[3,2.4,9,GUN,1.2,0,-19],[4,2.4,2.6,GUN,3.4,0,-15.2]],
  wind:[[5.4,5.4,4.4,'wc',0,0,-14.4,1]],
  camera:[[5,4,4,GUN,1.5,0,-17],[1.5,2.5,2.5,0x6fd6ff,4.2,0,-17,1]],
  tommy:[[3,2.4,13,GUN,1.2,0,-21],[4,4,4,GUN,1.2,0,-19],[2,2,3,WD,1.2,0,-14.5]],
  blaster:[[3.4,3,10,0x6a7078,1.2,0,-19.5],[3,3,2,'wc',1.2,0,-25.5,1]],
  candle:[[2.4,2.4,6,0xe8e0d0,1,0,-17],[1.6,1.6,2.4,'wc',1,0,-21.4,1]],
  book:[[6,2,8,'wc',2,0,-16],[6.2,1,7.4,0xe8e0d0,2,1.2,-16]],
  flask:[[4,4,5,'wc',1.5,0,-17.5,1],[1.6,1.6,2.4,0xd8d4c8,1.5,0,-14.6]],
  orb:[[5,5,5,'wc',1.5,0,-17.5,1]],
  sword:[[2.4,1.2,18,'wc',1,0,-23],[2,6,1.4,WD2,1,0,-14.6]],
  scythe:[[1.6,1.6,20,WD2,1,0,-24],[1,10,2,STEEL,1,4,-34]],
  hammer:[[1.8,1.8,14,WD,1,0,-20],[6,9,6,0x7a7a80,1,0,-27]],
  trident:[[1.6,1.6,20,0x4a8aa0,1,0,-24],[1,1,5,STEEL,1,0,-36],[1,1,4,STEEL,1,2.5,-35],[1,1,4,STEEL,1,-2.5,-35]],
  staff:[[2,2,22,WD,1,0,-25],[3.4,3.4,3.4,'wc',1,0,-37.5,1]],
  bow:[[1.2,1.6,22,WD,2.5,0,-15],[1,1,22,0xe8e0d0,1,0,-15]],
  spear:[[1.6,1.6,24,WD,1,0,-26],[2,2,4,STEEL,1,0,-40]],
  censer:[[1,1,6,0x8a8a8a,1,0,-17],[4,4,4,GOLD,1,0,-22]],
  herb:[[2,2,8,0x3f7a3a,1,0,-18],[4,4,3,0x6fbf4a,1,0,-23]],
  cards:[[3,1,4,0xeeeae0,2,0,-16],[3,1,4,0xa01818,2.4,1,-16.4]],
  medkit:[[6,3,5,0xeeeae0,1,0,-17],[1,1.2,3,0xc82828,2.6,0,-17]],
  shield:[[2,12,14,'wc',2.6,0,-10]]
};
const WEAPON_WC={wind:0x6fe8ff,blaster:0x3ac85a,candle:0xa050d8,book:0x5a3a7a,flask:0x3ac85a,orb:0xa050d8,sword:0x5a3a8a,staff:0x6fe0a0,shield:0x6a7488};
function setWeapon(M,w,wc,art){
  if(M.wpn===w&&M.wpnC===wc&&M.wpnA===art)return;M.wpn=w;M.wpnC=wc;M.wpnA=art;
  if(M.wpnG){M.wpnG.parent.remove(M.wpnG);M.wpnG.traverse(o=>{if(o.isMesh&&o.geometry!==VOXGEO)o.geometry.dispose();if(o.isInstancedMesh){o.material.dispose();o.dispose()}})}
  M.wpnG=null;
  // the chibi weapon drawing, given thickness, held in the right hand (the shield on the left arm)
  if(art){const g=new Group();(w==='shield'?M.armL:M.armR).add(g);M.wpnG=g;if(w==='shield'){g.rotation.z=Math.PI/2;g.position.set(3,2,4)}// the shield faces forward on the left arm
    let v=HULL.get(art);if(!v){v=extrudeVoxels(art);HULL.set(art,v)}const m=voxMesh(null,v);g.add(m);M.wpnMat=m.material;return}
  const list=WEAPON_BOXES[w];if(!list)return;
  const g=new Group();(w==='shield'?M.armL:M.armR).add(g);M.wpnG=g;
  const col=wc||WEAPON_WC[w]||0xa8b0b8;
  for(const b of list){const geo=flipBox(b[0],b[1],b[2]),c=b[3]==='wc'?col:b[3],m=new Mesh(geo,b[7]?new MeshBasicMaterial({color:c}):charMat(c));m.position.set(b[4],b[5],b[6]);m.castShadow=!b[7];if(!b[7])M.mats.set('w'+M.mats.size,m.material);g.add(m)}
}
function detectiveModel(art){
  const M=rigBase(),{part,limb,inner}=M;
  M.legL=limb(0,3.6,14);M.legR=limb(0,-3.6,14);
  for(const l of [M.legL,M.legR]){part(l,5.5,5,12,DET.legs,0,0,-6);part(l,8,6,3,DET.shoe,1.2,0,-12.5)}
  part(inner,10,14,7,DET.coatD,0,0,11.5);part(inner,10,14,15,DET.coat,0,0,22.5);// coat skirt and body
  part(inner,1,5,11,DET.shirt,5.2,0,23);part(inner,1.2,1.8,8,DET.tie,5.6,0,22.5);part(inner,10.6,14.6,1.6,DET.band,0,0,16);
  M.armL=limb(0,9,29);M.armR=limb(0,-9,29);
  for(const a of [M.armL,M.armR]){part(a,4.6,4.6,13,DET.coat,0,0,-6.5);part(a,4,4,3,DET.skin,0,0,-14.3)}
  const head=M.head=limb(0,0,30.5);
  if(art&&art.head){head.position.z=29.5;M.headTilt=HEAD_TILT;head.add(voxMesh(M,hullOf(art.head)));setWeapon(M,'pistol');return M}
  part(head,14,14,13,DET.skin,0,0,6.5);part(head,6,14.4,6,DET.hair,-4.4,0,8);part(head,14.4,14.4,2,DET.hair,-.2,0,12.4);
  part(head,1,2.4,2.8,DET.eye,7.1,3.2,6.8);part(head,1,2.4,2.8,DET.eye,7.1,-3.2,6.8);part(head,1,3.2,.8,DET.hair,7.1,3.2,8.9);part(head,1,3.2,.8,DET.hair,7.1,-3.2,8.9);part(head,1,7,2.2,0xc89878,7.1,0,2.2);part(head,1,3,1,0x8a4a3a,7.2,0,3.4);
  const hat=new Group();hat.position.set(-1.5,0,14);hat.rotation.y=-.18;head.add(hat);// tipped back so the face shows
  part(hat,17,17,1.6,DET.hat,0,0,0);part(hat,11.6,11.6,6,DET.hat,0,0,3.6);part(hat,12,12,1.6,DET.band,0,0,1.4);part(hat,11.6,4,1.4,0x5a4632,0,0,6.6);
  setWeapon(M,'pistol');return M;
}
/* Forms drawn in 2D by code (Wolf Form, Fire Truck) become voxels whole: each pose is one frame of a flipbook */
function formModel(){const root=new Group(),M={root,form:1,frames:new Map(),vmats:[],vmeshes:[],dispose(){M.vmeshes.forEach(m=>{m.material.dispose();m.dispose()})}};return M}
function formFrame(M,art){let m=M.frames.get(art);if(!m){m=voxMesh(M,hullOf(art,art.step||2));M.root.add(m);M.frames.set(art,m)}return m}
/* Wolf Form: the Detective as an upright werewolf in his police cap and navy coat, leaning into a fast stride */
const WOLF={navy:0x26304a,navyD:0x18203a,navyL:0x34405e,fur:0x4a3020,furL:0x8a6a4a,furD:0x2a1a10,boot:0x3a2414,claw:0xf0ead8,eye:0xffd040,gold:0xe8c95c,nose:0x101010};
function wolfModel(){
  const M=rigBase(),{part,limb,inner}=M;M.lean=.22;
  M.legL=limb(0,4.2,15);M.legR=limb(0,-4.2,15);
  for(const l of [M.legL,M.legR]){part(l,6.5,6,8,WOLF.navyD,0,0,-4);part(l,5.5,5.5,6,WOLF.navy,-1.5,0,-10);part(l,9,6.5,3,WOLF.boot,1.8,0,-13.6)}
  part(inner,12,16,8,WOLF.navy,0,0,13);part(inner,12,17,16,WOLF.navy,0,0,25);// coat skirt and body
  part(inner,1,7,13,WOLF.furL,6.3,0,25);part(inner,1.3,2,9,0x8a2a2a,6.9,0,25);part(inner,12.6,17.4,1.8,WOLF.navyD,0,0,18.5);// furry chest, tie, belt
  part(inner,4,12,5,WOLF.fur,-6,0,33);// shoulder fur
  const tail=new Group();tail.position.set(-6.5,0,15);tail.rotation.y=.9;inner.add(tail);part(tail,5,5,14,WOLF.fur,0,0,-6);part(tail,4,4,5,WOLF.furL,0,0,-14);
  M.armL=limb(0,11,32);M.armR=limb(0,-11,32);
  for(const a of [M.armL,M.armR]){part(a,5.5,5.5,14,WOLF.navy,0,0,-7);part(a,5.5,5.5,4,WOLF.fur,0,0,-15.5);for(let k=-1;k<=1;k++)part(a,1,1.2,3.5,WOLF.claw,2.6,k*1.8,-19)}
  const head=M.head=limb(1,0,33.5);
  part(head,13,13,12,WOLF.fur,0,0,6);part(head,8,8,6,WOLF.furL,9,0,3.5);part(head,2,3,2,WOLF.nose,13.2,0,5.6);part(head,6,7,1.6,WOLF.claw,9.5,0,1.2);// head, snout, nose, teeth
  part(head,1,2.2,2.2,WOLF.eye,6.6,3.2,8);part(head,1,2.2,2.2,WOLF.eye,6.6,-3.2,8);
  part(head,3,3,6,WOLF.fur,-2,4.6,14);part(head,3,3,6,WOLF.fur,-2,-4.6,14);// ears
  const cap=new Group();cap.position.set(0,0,12.4);cap.rotation.y=-.12;head.add(cap);
  part(cap,13.6,13.6,4,WOLF.navy,-1,0,1.6);part(cap,6,12,1.2,0x101018,6,0,0);part(cap,1,3,3,WOLF.gold,5.9,0,2.4);
  return M;
}
/* Heroes, minions and anyone else with a rig record: s skin, h/hs hair, hat/hc, m/mc mask, o outfit, t/t2 colours,
   b legs, f feet, cp cape, w/wc weapon. Each record becomes the same kind of block body, so a new character needs no
   extra work; HERO_EXTRA adds the details a rig record cannot say (wings, metal limbs, quivers). */
const hx=v=>v?parseInt(String(v).replace('#','').slice(0,6),16):0;
function rigModel(sp,name,art){
  const M=rigBase(),{part,limb,inner}=M,S=hx(sp.s)||0xf0c8a0,Hr=hx(sp.h)||0x3a2a20,T1=hx(sp.t)||0x555566,T2=hx(sp.t2)||0xdddddd,Bl=hx(sp.b)||0x39404e,F=hx(sp.f)||0x20232c,HC=hx(sp.hc)||0x333333,MC=hx(sp.mc),WC=hx(sp.wc);
  const o=sp.o||'shirt',robe=o==='robe'||o==='dress',coat=o==='coat';
  M.legL=limb(0,3.6,13);M.legR=limb(0,-3.6,13);
  for(const l of [M.legL,M.legR]){part(l,5.5,5,11,robe?T1:Bl,0,0,-5.5);part(l,7.5,6,2.6,F,1,0,-11.7)}
  if(robe)part(inner,10,14,9,T1,0,0,8.5);else if(coat)part(inner,10,14,6,T1,0,0,11)// robe or coat skirt
  part(inner,10,13.5,16,T1,0,0,21);// body
  // what the outfit shows on the front
  if(o==='ribs')for(let k=0;k<4;k++)part(inner,1,10,1.4,T2,5.3,0,16+k*3.2);
  else if(o==='hivis'){part(inner,10.4,13.9,2,T2,0,0,19);part(inner,10.4,13.9,2,T2,0,0,24);part(inner,10.4,2,10,T2,0,4,22);part(inner,10.4,2,10,T2,0,-4,22)}
  else if(o==='falcon'){part(inner,1,9,7,T2,5.3,0,23);part(inner,1,3,3,0xf0e8d8,5.6,0,25)}
  else if(o==='suit'){part(inner,1,4,12,0xeeeae0,5.3,0,22);part(inner,1.2,1.6,8,T2,5.7,0,22.5)}
  else if(o==='hoodie'){part(inner,1,8,4,T2,5.3,0,17);part(inner,6,15,4,T1,-3,0,29.5)}
  else if(o==='stripe2'){part(inner,10.4,13.9,2,T2,0,0,20);part(inner,10.4,13.9,2,T2,0,0,24)}
  else if(o==='vest'||o==='open'||coat||robe||o==='belt'||o==='sash')part(inner,1,4.5,13,T2,5.3,0,21.5);
  else part(inner,1,8,4,T2,5.3,0,25);
  part(inner,10.6,14.1,1.6,o==='belt'||o==='sash'?T2:0x2a2420,0,0,14.5);
  if(sp.cp)part(inner,1.6,13,17,hx(sp.cp),-5.8,0,20);
  M.armL=limb(0,8.8,28);M.armR=limb(0,-8.8,28);
  const fist=sp.w==='fist'&&WC;
  for(const a of [M.armL,M.armR]){part(a,4.4,4.4,12,T1,0,0,-6);part(a,4,4,3,fist?WC:S,0,0,-13.4)}
  const head=M.head=limb(0,0,29.5);
  // the full chibi head (big eyes, face, mask, hat) from the game's own drawing; boxes only without it
  if(art&&art.head){M.chibi=1;M.headTilt=HEAD_TILT;head.add(voxMesh(M,hullOf(art.head)))}else{
  const bald=sp.hs==='bald',glowFace=sp.m==='void';
  part(head,13.5,13.5,12.5,glowFace?(S||0x15161e):S,0,0,6.2);
  const covered=sp.hat==='hood'||sp.hat==='helm'||sp.hat==='riot'||sp.hat==='falcon'||sp.hat==='fire';
  if(!bald&&!covered){part(head,13.9,13.9,2.2,Hr,-.2,0,12);part(head,5,13.9,7,Hr,-4.4,0,7.5);if(sp.hs==='long'||sp.hs==='pony'||sp.hs==='bun'||sp.hs==='bob')part(head,4,sp.hs==='bob'?14:9,sp.hs==='long'?11:8,Hr,-7.6,0,sp.hs==='long'?2:3.5)}
  // face: skull sockets, void glow, goggles, glasses, visor or plain eyes
  const eyes=c=>{part(head,1,2.2,2.6,c,6.85,3,7);part(head,1,2.2,2.6,c,6.85,-3,7)};
  if(sp.m==='skull'){part(head,1,3.2,3.2,0x15161e,6.85,3,6.8);part(head,1,3.2,3.2,0x15161e,6.85,-3,6.8);part(head,1,1.6,1.6,0x15161e,6.85,0,3.6);for(let k=-1;k<=1;k++)part(head,1,1.4,1.6,0x2a2a32,6.85,k*2.6,1.2)}
  else if(sp.m==='void'){const g=MC||T2||0xa050d8;part(head,1,2.6,1.8,g,6.85,3,7,1);part(head,1,2.6,1.8,g,6.85,-3,7,1)}
  else if(sp.m==='goggles'){part(head,1.6,13.8,3.2,0x2a2a32,6.4,0,7.4);part(head,1.2,3.4,2.4,MC||0x6fd6ff,7.2,3,7.4,1);part(head,1.2,3.4,2.4,MC||0x6fd6ff,7.2,-3,7.4,1)}
  else if(sp.m==='glasses'){eyes(0x1c2430);part(head,1.2,11,1,0x2a2a32,7.1,0,8.4);part(head,1.2,3.2,3,0x9ad0e8,7.2,3,7,1);part(head,1.2,3.2,3,0x9ad0e8,7.2,-3,7,1)}
  else if(sp.m==='shade'){part(head,1.4,12,2.6,0x101014,7,0,7.2)}
  else if(sp.m==='falcon'){part(head,1.4,12,3,0x15161e,7,0,7.4);part(head,1.2,2.2,2.6,MC||0x6fe8ff,7.6,2.6,7.4,1);part(head,1.2,2.2,2.6,MC||0x6fe8ff,7.6,-2.6,7.4,1);part(head,1.2,2,2,MC||0x6fe8ff,7.6,0,6,1)}
  else if(sp.m==='domino'){part(head,1.2,11,2.6,MC||0x20222c,7,0,7.2);eyes(0xeeeae0)}
  else eyes(0x1c2430);
  if(sp.m==='bandana')part(head,1.2,13.8,4,MC||0x20222c,6.6,0,2.6);
  // headwear
  const hat=sp.hat;
  if(hat==='hood'){part(head,15,15.5,4,HC,-1,0,13.6);part(head,6,15.5,13,HC,-5.4,0,6.4);part(head,9,2,11,HC,1.8,7.3,6.2);part(head,9,2,11,HC,1.8,-7.3,6.2)}
  else if(hat==='helm'||hat==='riot'){part(head,14.8,14.8,8,HC,-.4,0,10.4);part(head,2,14.8,2,HC,7,0,7);if(hat==='riot')part(head,1,12,5,0x6a7488,7.6,0,5.4)}
  else if(hat==='fire'){part(head,15,15,5,HC,-.4,0,14.6);part(head,4,16.4,1.6,HC,-8,0,12.4);part(head,17,17,1.4,HC,-.4,0,12.2);part(head,1,5,4,0xe8b82a,7.6,0,15)}
  else if(hat==='falcon'){part(head,14.8,14.8,9,HC,-.4,0,10.6);part(head,6,2,9,0xeeeae0,-3,7.8,15);part(head,6,2,9,0xeeeae0,-3,-7.8,15);part(head,4,2,5,0xeeeae0,-6.5,8.4,20);part(head,4,2,5,0xeeeae0,-6.5,-8.4,20)}
  else if(hat==='horn'){part(head,3,3,6,HC,0,5.6,15);part(head,3,3,6,HC,0,-5.6,15);part(head,2.2,2.2,4,HC,1.5,6.5,19.5);part(head,2.2,2.2,4,HC,1.5,-6.5,19.5)}
  else if(hat==='antler')for(const sy of [1,-1]){part(head,2,2,7,HC,-1,sy*5,16);part(head,2,4,2,HC,-1,sy*7,19);part(head,2,2,5,HC,-1,sy*8.5,21.5);part(head,2,2,4,HC,1.6,sy*4.8,20)}
  else if(hat==='band')part(head,14.2,14.2,2,HC,0,0,10.6);
  else if(hat==='fedora'||hat==='bowler'||hat==='top'){part(head,17,17,1.6,HC,-1,0,13.2);part(head,11.6,11.6,hat==='top'?10:6,HC,-1,0,hat==='top'?18.8:16.8);if(sp.hb)part(head,12,12,1.6,hx(sp.hb),-1,0,14.8)}
  else if(hat){part(head,14.6,14.6,4,HC,-.5,0,14);if(hat==='cap'||hat==='police'||hat==='flat')part(head,6,12,1.2,HC,6,0,12.4)}
  }
  // extras on the head are left out when the chibi head (which already has them) is used
  if(HERO_EXTRA[name])HERO_EXTRA[name](M,(pa,...a)=>pa===M.head&&M.chibi?null:part(pa,...a),{S,T1,T2,HC,MC,WC});
  setWeapon(M,sp.w,WC);
  return M;
}
/* Details a rig record cannot say, per hero */
const HERO_EXTRA={
  Patriot:(M,part,c)=>{part(M.inner,4,15,3,0xb81e2a,1,0,29.6);part(M.inner,1.4,6,3,0xd82a2a,5.4,0,27)},// scarf, falcon chest
  Cyborg:(M,part)=>{part(M.armR,5,5,6,0x9aa4ae,0,0,-3);part(M.armL,5,5,6,0x9aa4ae,0,0,-3);part(M.inner,1,4,4,0x6fd6ff,5.4,0,24,1);part(M.head,1,2.6,2.6,0xff4040,7.1,-3,7.4,1)},// metal shoulders, core, red eye
  Guardian:(M,part,c)=>{part(M.head,2,2,5,c.T2,-1,0,18.5);part(M.inner,4,16,3,c.T2,0,0,29.6)},// crest, gold pauldrons
  Ranger:(M,part)=>{part(M.inner,3,4,13,0x6a4a2a,-6.4,-3,24);for(let k=0;k<3;k++)part(M.inner,1,1,3,0xe8e0d0,-6.4,-4.4+k*1.4,32)},// quiver and fletching
  Inventor:(M,part)=>{part(M.inner,4,10,10,0x6a4a2a,-7,0,23);part(M.inner,2,2,6,0x9aa4ae,-8,3,31)},// backpack and antenna
  Firefighter:(M,part)=>{part(M.inner,3,8,11,0xb8b0a0,-6.6,0,23)},// air tank
  Exorcist:(M,part)=>{part(M.inner,1,1.6,8,0xe8c95c,5.5,0,23);part(M.inner,1,5,1.6,0xe8c95c,5.5,0,25)},// cross
  Beastmaster:(M,part)=>{part(M.inner,6,15.5,3,0x8a6a4a,0,0,29.5)},// fur mantle
  Sage:(M,part)=>{part(M.head,1.6,9,5,0xb8b8b0,7,0,2)},// beard
  Chronomancer:(M,part)=>{part(M.inner,1,4.4,4.4,0xe8c95c,5.5,0,25);part(M.inner,1.2,.6,1.8,0x20222c,5.8,0,25.6)},// clock
  'Gravity Mage':(M,part)=>{part(M.inner,3,3,3,0xa050d8,0,10,36,1);part(M.inner,3,3,3,0xa050d8,0,-10,34,1)},// floating orbs
  Pyromancer:(M,part)=>{part(M.armL,3,3,3,0xff8a2a,0,0,-16.4,1);part(M.armR,3,3,3,0xff8a2a,0,0,-16.4,1)},// flame hands
  Phantom:(M,part)=>{part(M.inner,1,6,6,0x6fe0a0,5.4,0,23,1)},// spirit glow
  Voidwalker:(M,part)=>{part(M.inner,1,6,6,0x6a4ad8,5.4,0,23,1)},
  Illusionist:(M,part)=>{part(M.inner,1,1.6,3,0xa01818,5.7,0,27)},// red bow tie
  'Hero Shadow':(M,part)=>{part(M.inner,1.4,14,1.4,0x8a2a28,5.4,0,17)}// red sash
};
/* ---- Quest objects and animals: blocks matching their 2D drawings (same colours and proportions) ----
   [w,d,h,colour,x,y,z0,anim,glow]: x faces forward, z0 is the bottom. A colour can be a name filled in per object
   (rune, gen, genlight) so the same model shows done and not done. anim: bob (floats and turns), flame (flickers),
   glow (pulses), walk (legs step). */
const PL=0x2a211a;
const PROP_SHAPES={
  sheep:[[4,3,6,PL,-7,4,0,'walk'],[4,3,6,PL,-7,-4,0,'walk2'],[4,3,6,PL,7,4,0,'walk2'],[4,3,6,PL,7,-4,0,'walk'],[22,13,11,0xf0ece0,0,0,6],[16,11,3,0xe2dccc,-2,0,17],[9,9,8,0xf0ece0,12,0,11],[1,2,2,0x1a1626,16.6,2.4,15],[1,2,2,0x1a1626,16.6,-2.4,15],[3,2,4,0xd8d0c0,10,5.5,15],[3,2,4,0xd8d0c0,10,-5.5,15]],
  hound:[[3,3,7,0x5a3a20,-7,3,0,'walk'],[3,3,7,0x5a3a20,-7,-3,0,'walk2'],[3,3,7,0x5a3a20,7,3,0,'walk2'],[3,3,7,0x5a3a20,7,-3,0,'walk'],[22,9,9,0x8a6840,0,0,6],[9,8,8,0x8a6840,12,0,11],[5,5,4,0x6a4a28,17.5,0,11],[1.6,2,2,0x1a1626,20.2,0,13],[1,1.6,1.6,0x1a1626,15.6,2.4,16],[1,1.6,1.6,0x1a1626,15.6,-2.4,16],[3,2,5,0x5a3a20,10,4,17],[3,2,5,0x5a3a20,10,-4,17],[9,2.5,2.5,0x8a6840,-15,0,13]],
  parcel:[[18,14,14,0x8a6840,0,0,0],[18.4,2,14.4,0xc88a30,0,0,-.2],[2,14.4,14.4,0xc88a30,0,0,-.2],[18.6,14.6,1,0x4a3524,0,0,14]],
  flag:[[3,3,40,0x4a3524,0,0,0],[16,1.6,10,0xa8302a,9.5,0,30,'glow']],
  item:[[10,10,10,0xf0c23c,0,0,6,'bob'],[3.4,10.4,3.4,0xfff6c0,0,0,9,'bob',1]],
  totem:[[18,18,5,0x3a3644,0,0,0],[14,14,34,0x4e4a5a,0,0,0],[5,14.4,34,0x6a6574,-4.6,0,0],[1,6,6,'rune',7.3,0,24,'bob',1],[1,6,6,'rune',-7.3,0,24,'bob',1]],
  shrine:[[32,22,14,0x6a6574,0,0,0],[24,16,16,0x8a8678,0,0,14],[12,12,3,0x3a3030,0,0,30],[7,7,10,0xff8a30,0,0,33,'flame',1],[3,3,7,0xffe080,0,0,35,'flame',1]],
  boat:[[44,18,9,0xb8863f,0,0,1],[48,22,3,0x7a5430,0,0,9],[3,3,16,0x4a3524,0,0,11],[6,6,6,'lamp',0,0,25,'glow',1]],
  brazier:[[6,6,24,0x3a3630,0,0,0],[16,16,5,0x55504a,0,0,24],[12,12,2,0x2a2420,0,0,29],[9,9,8,0xff8a30,0,0,30,'flame',1],[4,4,8,0xffe080,0,0,31,'flame',1]],
  canister:[[12,12,16,0x8fd6ff,0,0,0],[12.4,12.4,3,0x2b4a63,0,0,5],[4,4,3,0xd8f2ff,0,0,16]],
  purifier:[[14,14,19,0xb8ec72,0,0,0],[14.4,14.4,3,0x304b2c,0,0,6],[4,4,3,0xe9ffd8,0,0,19,0,1]],
  generator:[[44,30,30,'gen',0,0,0],[1,14,8,'genlight',22.2,0,12,'glow',1],[46,32,2,0x343c38,0,0,30]]
};
function propModel(name,cols){const M=rigBase(),anims=[];M.prop=1;M.inner.position.z=0;M.body.position.z=0;
  for(const b of PROP_SHAPES[name]||[]){const c=typeof b[3]==='string'?(cols&&cols[b[3]])||0x888888:b[3],m=M.part(M.inner,b[0],b[1],b[2],c,b[4],b[5],b[6]+b[2]/2,b[8]);if(b[7])anims.push([m,b[7],m.position.z,m.rotation.z])}
  M.anims=anims;return M}
function poseProp(M,h,t){M.root.position.set(h.x,h.y,h.z||0);M.root.rotation.z=h.face||0;M.root.scale.setScalar(h.size||1);
  for(const [m,a,z0] of M.anims){if(a==='bob'){m.position.z=z0+Math.sin(t*3+h.x)*2.5;m.rotation.z=t*1.6}else if(a==='flame'){m.scale.set(1,1,.8+.35*Math.abs(Math.sin(t*14+h.x)))}else if(a==='glow'){const k=.85+.15*Math.sin(t*4);m.scale.set(k,k,k)}
    else if(a==='walk'||a==='walk2'){m.rotation.y=h.moving?Math.sin(t*12)*(a==='walk'?.6:-.6):0}}}
/* h: {key,kind,spec,size,x,y,face,moving,sprint,atk,guard,hit,dash,dead,blink,sink} */
/* Block characters stand about as tall as the cast's sprite cards */
const HERO_SIZE=1.55,WHITE=new Color(1,1,1),DOME_GEO=new IcosahedronGeometry(1,1);
function poseHero(M,h,t){
  if(M.prop){poseProp(M,h,t);return}
  if(M.form){M.root.visible=!h.blink;M.root.position.set(h.x,h.y,(h.z||0)+(h.sink?-6:0));M.root.rotation.z=h.face;M.root.scale.setScalar(h.size||1);
    const show=h.art&&formFrame(M,h.art);M.frames.forEach(m=>{m.visible=m===show});
    const f=h.hit>0?Math.min(.9,h.hit*4):0;M.vmats.forEach(m=>{m.userData.flash.value=f});return}
  M.root.visible=!h.blink;M.root.position.set(h.x,h.y,(h.z||0)+(h.sink?-6:0));if(h.weapon!==undefined&&M.armR)setWeapon(M,h.weapon,h.wc,h.wart);M.root.rotation.z=h.face;M.root.scale.setScalar(h.size||HERO_SIZE);
  const ph=t*(h.sprint||M.lean?16:11)+(M.phase||0),sw=h.moving?Math.sin(ph):0;
  M.inner.position.z=-24+(h.moving?Math.abs(Math.sin(ph))*1.6:Math.sin(t*2.4*Math.PI+(M.phase||0))*.5);
  M.legL.rotation.y=sw*.7;M.legR.rotation.y=-sw*.7;
  M.armL.rotation.set(0,-sw*.6,0);M.armR.rotation.set(0,sw*.6,0);M.head.rotation.set(0,M.headTilt||0,0);
  let tilt=(h.sprint&&h.moving?.16:0)+(M.lean||0);
  if(h.atk){if(M.lean){const q=Math.sin(t*18);M.armR.rotation.set(0,-1.2-q*.6,0);M.armL.rotation.set(0,-1.2+q*.6,0);tilt+=.1}else{M.armR.rotation.set(0,-Math.PI/2,0);M.armL.rotation.set(0,-.5,0)}}
  if(h.guard){M.armL.rotation.set(0,-1.3,0);M.armR.rotation.set(0,-1.3,0)}
  if(h.hit>0){const k=Math.min(1,h.hit*5);tilt=-.45*k;M.armL.rotation.set(.9*k,-.6*k,0);M.armR.rotation.set(-.9*k,-.6*k,0);M.head.rotation.y=(M.headTilt||0)-.3*k}
  M.body.position.z=24;
  if(h.dash>=0)tilt=Math.PI*2*h.dash;
  if(h.dead){tilt=-Math.PI/2;M.body.position.z=7}
  M.body.rotation.y=tilt;
  if(h.seated){M.legL.rotation.y=-1.4;M.legR.rotation.y=-1.4}
  // Aegis: a golden dome around the Guardian while it soaks damage (Soul Anvil uses ember orange)
  if(h.dome){if(!M.dome){M.dome=new Mesh(DOME_GEO,new MeshBasicMaterial({color:h.dome.col,transparent:true,opacity:.2,depthWrite:false,side:2}));M.dome.add(new Mesh(DOME_GEO,new MeshBasicMaterial({color:h.dome.col,wireframe:true,transparent:true,opacity:.55,depthWrite:false})));M.root.add(M.dome)}
    M.dome.visible=true;M.dome.material.color.setHex(h.dome.col);M.dome.children[0].material.color.setHex(h.dome.col);const r=h.dome.r/(h.size||1);M.dome.scale.set(r,r,r*.75);M.dome.material.opacity=.1+.05*Math.sin(t*4);M.dome.children[0].material.opacity=.45+.2*Math.sin(t*4)}else if(M.dome)M.dome.visible=false;
  const f=h.hit>0?Math.min(.9,h.hit*4):0;if(f!==M.flash){M.flash=f;M.mats.forEach(m=>{const b=m.userData.base;if(b)m.emissive.copy(b).lerp(WHITE,f);else m.emissive.setRGB(f,f,f)});(M.vmats||[]).forEach(m=>{m.userData.flash.value=f});if(M.wpnMat)M.wpnMat.userData.flash.value=f}
}
/* Models are kept per kind (detective, wolf, or a rig name) and reused from frame to frame */
export function createHeroes(root){
  const pool=new Map();let n=0;
  const build=h=>{const M=h.kind==='prop'?propModel(h.prop,h.cols):h.kind==='form'?formModel():h.kind==='wolf'?wolfModel():h.kind==='rig'?rigModel(h.spec||{},h.name,h.art):detectiveModel(h.art);M.phase=(n++)*1.7;root.add(M.root);return M};
  return{
    update(list,t){const used=new Map();
      for(const h of list){const key=h.key||h.kind||'det',arr=pool.get(key)||(pool.set(key,[]),pool.get(key)),i=used.get(key)||0;used.set(key,i+1);
        const M=arr[i]||(arr[i]=build(h));M.root.visible=true;poseHero(M,h,t)}
      pool.forEach((arr,key)=>{for(let i=used.get(key)||0;i<arr.length;i++)arr[i].root.visible=false})},
    dispose(){pool.forEach(arr=>arr.forEach(M=>{root.remove(M.root);M.dispose()}))}
  };
}
