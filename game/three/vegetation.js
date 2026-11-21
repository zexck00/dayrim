/* Low-poly vegetation and scenery, one kit per stage, drawn with instancing (one draw per kind and variant).
   Shapes are built y-up like any Three.js primitive, then turned into the game's axes (x east, y south, z up).
   Canopies sway in the wind in the vertex shader; glowing parts (mushroom caps, crystals, lava) are unlit. */
import {BufferGeometry,Float32BufferAttribute,InstancedMesh,Matrix4,Quaternion,Vector3,Euler,Color,Group,MeshBasicMaterial,
  CylinderGeometry,ConeGeometry,IcosahedronGeometry,DodecahedronGeometry,SphereGeometry,BoxGeometry,OctahedronGeometry,TorusGeometry} from '../vendor/three.module.js';
import {toonMaterial} from './lighting.js';

/* y-up → game axes: swap y and z (a mirror, which also matches the camera's mirrored screen) */
const TO_GAME=new Matrix4().set(1,0,0,0, 0,0,1,0, 0,1,0,0, 0,0,0,1);
const tmpC=new Color();
/* one part: a primitive, a colour, a place, optional rotation/scale; glow parts skip lighting */
const P=(geo,col,x=0,y=0,z=0,o={})=>{
  if(o.sx||o.sy||o.sz)geo.scale(o.sx||1,o.sy||1,o.sz||1);
  if(o.rx||o.ry||o.rz)geo.applyMatrix4(new Matrix4().makeRotationFromEuler(new Euler(o.rx||0,o.ry||0,o.rz||0)));
  geo.translate(x,y,z);return{geo,col,glow:!!o.glow,sway:o.sway!==undefined?o.sway:1};
};
const cyl=(r1,r2,h,s=5)=>new CylinderGeometry(r1,r2,h,s,1),cone=(r,h,s=6)=>new ConeGeometry(r,h,s,1),ico=(r,d=0)=>new IcosahedronGeometry(r,d),box=(x,y,z)=>new BoxGeometry(x,y,z);
const hemi=r=>new SphereGeometry(r,7,3,0,Math.PI*2,0,Math.PI/2);

/* Merge parts into one flat-shaded geometry with vertex colours and a sway weight */
function merge(parts){
  if(!parts.length)return null;
  const pos=[],nor=[],col=[],sw=[];
  for(const p of parts){// flat normals first, then the mirror (which also turns the normals the right way)
    const g=(p.geo.index?p.geo.toNonIndexed():p.geo);g.computeVertexNormals();g.applyMatrix4(TO_GAME);
    const a=g.attributes.position.array,n=g.attributes.normal.array;tmpC.set(p.col);
    for(let i=0;i<a.length;i+=3){pos.push(a[i],a[i+1],a[i+2]);nor.push(n[i],n[i+1],n[i+2]);col.push(tmpC.r,tmpC.g,tmpC.b);sw.push(p.sway)}
    p.geo.dispose()}
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(pos,3));g.setAttribute('normal',new Float32BufferAttribute(nor,3));
  g.setAttribute('color',new Float32BufferAttribute(col,3));g.setAttribute('sway',new Float32BufferAttribute(sw,1));return g;
}

/* ---- kits: (theme, variant) → parts ---- */
const TREES={
  oak:(t,v)=>[P(cyl(4,5.5,26),t.trunk,0,13,0,{sway:0}),P(ico(21),t.canopy[v],0,44,0),P(ico(15),t.canopy[(v+1)%3],-14,36,4),P(ico(14),t.canopy[(v+2)%3],13,38,-4),P(ico(11),t.canopy[(v+1)%3],2,58,0)],
  pine:(t,v)=>[P(cyl(3,4,16),t.trunk,0,8,0,{sway:0}),P(cone(19,24),t.canopy[v],0,26,0),P(cone(15,20),t.canopy[(v+1)%3],0,40,0),P(cone(10,17),t.canopy[v],0,53,0),P(cone(5,11),t.canopy[(v+2)%3],0,63,0)],
  willow:(t,v)=>{const p=[P(cyl(5,7,26),t.trunk,0,13,0,{sway:0,rz:.08}),P(ico(23),t.canopy[v],0,42,0,{sy:.55})];for(let i=0;i<9;i++){const a=i/9*Math.PI*2;p.push(P(box(2.4,24,2.4),t.canopy[(v+i)%3],Math.cos(a)*19,30,Math.sin(a)*15))}return p},
  dead:(t,v)=>[P(cyl(2.6,5,42),t.trunk,0,21,0,{sway:0}),P(cyl(1.3,2,20),t.canopy[v],-7,34,0,{rz:.9,sway:.3}),P(cyl(1.2,1.8,16),t.canopy[(v+1)%3],7,40,1,{rz:-.8,sway:.3}),P(cyl(1,1.5,12),t.trunk,2,48,-3,{rx:.6,sway:.3})],
  shroom:(t,v)=>{const p=[P(cyl(5,7,34,7),t.trunk,0,17,0,{sway:0}),P(hemi(24),t.canopy[v],0,33,0,{sway:.25})];for(let i=0;i<6;i++){const a=i/6*Math.PI*2+v;p.push(P(ico(2.6),t.glow,Math.cos(a)*15,40,Math.sin(a)*15,{glow:true,sway:.25}))}return p},
  cypress:(t,v)=>[P(cyl(2.5,3.5,10),t.trunk,0,5,0,{sway:0}),P(cone(11,58,6),t.canopy[v],0,38,0,{sway:.6}),P(cone(8,34,6),t.canopy[(v+1)%3],2,52,1,{sway:.6})],
  maple:(t,v)=>[P(cyl(3.5,5,26),t.trunk,0,13,0,{sway:0}),P(box(1.6,3,1.6),'#2a211a',2,10,4,{sway:0}),P(box(1.6,2,1.6),'#2a211a',-3,18,4,{sway:0}),P(ico(22,1),t.canopy[v],0,44,0),P(ico(14,1),t.canopy[(v+1)%3],-15,36,3),P(ico(13,1),t.canopy[(v+2)%3],14,38,-3)],
  root:(t,v)=>{const p=[P(cyl(6,9,20,6),t.trunk,0,10,0,{sway:0}),P(ico(18),t.canopy[v],0,30,0,{sy:.6,sway:.3})];for(let i=0;i<4;i++){const a=i/4*Math.PI*2+.4;p.push(P(box(3,3,16),t.trunk,Math.cos(a)*9,2,Math.sin(a)*9,{ry:-a,sway:0}))}p.push(P(ico(3),t.glow,0,36,0,{glow:true,sway:.3}));return p},
  thorn:(t,v)=>{const p=[P(cyl(2.5,4,22),t.trunk,0,11,0,{sway:0,rz:.2}),P(cyl(2,2.5,20),t.trunk,3,29,0,{sway:.2,rz:-.3}),P(cyl(1.5,2,16),t.trunk,-1,44,0,{sway:.4,rz:.25})];for(let i=0;i<9;i++){const a=i*2.1;p.push(P(cone(1.6,10,4),t.canopy[(v+i)%3],Math.cos(a)*5,18+i*3.5,Math.sin(a)*5,{rz:Math.cos(a)*1.3,rx:Math.sin(a)*1.3,sway:.3}))}return p},
  spire:(t,v)=>[P(cone(10,72,5),t.canopy[v],0,36,0,{sway:0}),P(cone(6,40,5),t.canopy[(v+1)%3],9,20,3,{sway:0,rz:-.15}),P(box(1.6,30,1.6),t.glow,-3,30,7,{glow:true,sway:0,rz:.05})]
};
const SMALL={
  shrub:(t,v)=>[P(ico(9),t.shrub[v],0,8,0,{sway:.4}),P(ico(7),t.shrub[(v+1)%3],-7,6,3,{sway:.4}),P(ico(7),t.shrub[(v+2)%3],7,7,-2,{sway:.4})],
  thicket:(t,v)=>{const p=[];for(let i=-3;i<=3;i++){const h=30+((i+4)*(v+2))%14;p.push(P(box(3,h,3),t.canopy[(i+4+v)%3],i*5,h/2,(i*7)%5-2))}return p},
  grass:(t,v)=>[-3,0,3].map((x,i)=>P(cone(1.4,8+((i+v)%3)*2,3),t.grass[(v+i)%3],x,4,0,{rz:-x*.08})),
  fern:(t,v)=>[0,1,2,3,4].map(i=>{const a=i/5*Math.PI*2;return P(box(10,1,2.4),t.grass[v],Math.cos(a)*5,3,Math.sin(a)*5,{ry:-a,rz:.35})}),
  flower:(t,v)=>[P(cyl(.6,.6,8,3),t.grass[0],0,4,0),P(ico(2.6),t.flower[v],0,9,0)],
  mush:(t,v)=>[P(cyl(1.2,1.5,5,4),'#e8e4d0',0,2.5,0,{sway:0}),P(hemi(5),['#a8302a','#c88a30','#6a4c9a'][v],0,5,0,{sway:0})],
  rock:(t,v)=>[P(new DodecahedronGeometry(9,0),['#6a6574','#8a8678','#4e4a5a'][v],0,3,0,{sy:.6,sz:.85,sway:0})],
  reed:(t,v)=>[-2.5,0,2.5].map((x,i)=>P(cyl(.7,.9,20+i*3,3),t.grass[(v+i)%3],x,10+i*1.5,(i%2)*2,{rz:x*.05})).concat([P(cyl(1.6,1.6,5,4),'#5c4c3c',0,23,1)]),
  lily:(t,v)=>[P(cyl(6,6,.8,7),t.grass[v],0,.6,0,{sway:0}),P(ico(1.8),t.flower[v],2,1.8,1,{sway:0})],
  house:null
};
const EXTRAS={
  stone:(t,v)=>[P(box(10,26+v*4,6),['#6a6574','#8a8678','#4e4a5a'][v],0,13,0,{rz:(v-1)*.08,sway:0})],
  flowerbed:(t,v)=>[0,1,2,3,4].flatMap(i=>{const a=i*1.3;return[P(cyl(.6,.6,7,3),t.grass[0],Math.cos(a)*6,3.5,Math.sin(a)*5),P(ico(2.4),t.flower[(v+i)%3],Math.cos(a)*6,8,Math.sin(a)*5)]}),
  stump:(t,v)=>[P(cyl(7,8,8,7),t.trunk,0,4,0,{sway:0}),P(cyl(6.4,6.4,.6,7),'#c88a30',0,8.2,0,{sway:0})],
  fernbed:(t,v)=>[-8,0,8].flatMap((x,j)=>[0,1,2,3].map(i=>{const a=i/4*Math.PI*2+j;return P(box(9,1,2.2),t.grass[(v+j)%3],x+Math.cos(a)*4,3,Math.sin(a)*4+j*3,{ry:-a,rz:.35})})),
  mound:(t,v)=>[P(new SphereGeometry(26,8,4,0,Math.PI*2,0,Math.PI/2),t.gnd,0,0,0,{sy:.35,sway:0}),P(box(4,10,4),'#6a6574',4,10,0,{sway:0})],
  web:(t,v)=>[P(box(1.4,24,1.4),'#4a3524',-13,12,0,{sway:0}),P(box(1.4,24,1.4),'#4a3524',13,12,0,{sway:0})].concat([0,1,2,3].map(i=>P(box(28,.8,.8),'#e8e4d0',0,16,0,{rz:i*Math.PI/4,sway:.2}))),
  bones:(t,v)=>[P(ico(3.2),'#e8e4d0',0,3,0,{sway:0}),P(box(9,1.4,1.4),'#c8c4b0',6,1,2,{ry:.5+v,sway:0}),P(box(7,1.4,1.4),'#c8c4b0',-5,1,-2,{ry:-.4,sway:0})],
  glowshroom:(t,v)=>[P(cyl(1.4,1.8,7,4),'#e8e4d0',0,3.5,0,{sway:0}),P(hemi(6),t.glow,0,7,0,{glow:true,sway:0}),P(cyl(1,1.2,4,4),'#e8e4d0',6,2,3,{sway:0}),P(hemi(3.5),t.flower[v],6,4,3,{glow:true,sway:0})],
  column:(t,v)=>{const h=v===2?40:v===1?28:18;return[P(cyl(6,6.5,h,8),'#a89a7c',0,h/2,0,{sway:0}),P(box(16,4,16),'#c8c4b0',0,h+2,0,{sway:0,ry:.3*v}),P(box(9,3,9),'#8a8678',8,1.5,6,{ry:.7,sway:0})]},
  rubble:(t,v)=>[0,1,2].map(i=>P(box(7-i,5-i,6),['#8a8678','#a89a7c','#6a6574'][(v+i)%3],(i-1)*7,2.5,(i%2)*4,{ry:i+v,sway:0})),
  ivy:(t,v)=>[P(ico(8),t.shrub[v],0,3,0,{sy:.4,sway:.2}),P(ico(6),t.shrub[(v+1)%3],7,2,2,{sy:.4,sway:.2})],
  leafpile:(t,v)=>[P(ico(10,1),t.canopy[v],0,1,0,{sy:.3,sway:0}),P(ico(6,1),t.canopy[(v+1)%3],7,1,3,{sy:.35,sway:0})],
  gear:(t,v)=>[P(cyl(8,8,2.5,8),'#a8682a',0,8,0,{rx:Math.PI/2,sway:0}),P(cyl(3,3,3.5,6),'#7a5a38',0,8,0,{rx:Math.PI/2,sway:0}),P(box(12,3,7),'#5c4c3c',2,1.5,4,{sway:0})],
  crystal:(t,v)=>[0,1,2].map(i=>P(new OctahedronGeometry(4+i),[t.glow,'#a8dce4',t.flower[v]][i],(i-1)*6,9+i*3,(i%2)*3,{sy:2.4,rz:(i-1)*.3,glow:true,sway:0})),
  burrow:(t,v)=>[P(new SphereGeometry(20,8,4,0,Math.PI*2,0,Math.PI/2),t.gnd,0,0,0,{sy:.45,sway:0}),P(cyl(8,8,.6,8),'#0d0b14',0,1,12,{sway:0})],
  voidpool:(t,v)=>[P(cyl(16,16,.8,10),'#2a2438',0,.5,0,{sway:0}),P(cyl(13,13,.9,10),t.glow,0,.9,0,{glow:true,sway:0})],
  thornbush:(t,v)=>[P(ico(8),t.shrub[v],0,7,0,{sway:.3})].concat([0,1,2,3,4,5].map(i=>{const a=i*1.05;return P(cone(1.2,9,4),t.canopy[(v+i)%3],Math.cos(a)*7,8,Math.sin(a)*7,{rz:Math.cos(a)*1.2,rx:Math.sin(a)*1.2,sway:.3})})),
  lava:(t,v)=>[0,1,2].map(i=>P(box(22-i*5,.6,2.4),i?'#f0a040':t.glow,(i-1)*5,.7,(i%2)*5-2,{ry:i*.9+v,glow:true,sway:0})),
  spike:(t,v)=>[P(cone(4,20,5),t.canopy[v],0,10,0,{sway:0,rz:(v-1)*.12}),P(cone(2.5,11,5),t.canopy[(v+1)%3],6,5,2,{sway:0})]
};
/* Which 2D prop kinds become 3D (everything else stays a card) */
export const VEG_KINDS=['tree','shrub','thicket','grass','fern','flower','mush','rock','reed','lily'];
export const EXTRA_KINDS=[...Object.keys(EXTRAS),'reed','lily'];
export const TREE_KINDS=Object.keys(TREES);

const hash=(x,y,k)=>{let h=(x*374761393+y*668265263+k*2246822519)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};

/* opts: {theme, props:[{t,x,y,v}], extras:[{t,x,y,v}], baseZ(x,y), wind:{value}} → Group with instanced kinds, plus glow points */
export function buildVegetation(o){
  const th=o.theme,g=new Group(),buckets=new Map(),glows=[];
  const add=(kind,v,x,y,builder)=>{const k=kind+'|'+v;let b=buckets.get(k);if(!b){b={kind,v,builder,list:[]};buckets.set(k,b)}b.list.push([x,y])};
  for(const p of o.props){const v=((p.v|0)%3+3)%3;
    if(p.t==='tree')add('tree',v,p.x,p.y,()=>TREES[th.tree](th,v));
    else if(SMALL[p.t])add(p.t,v,p.x,p.y,()=>SMALL[p.t](th,v));}
  for(const p of o.extras||[]){const v=((p.v|0)%3+3)%3;const b=EXTRAS[p.t]||SMALL[p.t];if(b)add(p.t,v,p.x,p.y,()=>b(th,v))}
  const m=new Matrix4(),q=new Quaternion(),s=new Vector3(),pos=new Vector3(),zAxis=new Vector3(0,0,1);
  const solidMat=toonMaterial({vertexColors:true,shadowSide:2}),glowMat=new MeshBasicMaterial({vertexColors:true});
  for(const mat of [solidMat,glowMat])mat.onBeforeCompile=sh=>{sh.uniforms.uWind=o.wind;
    sh.vertexShader='attribute float sway;uniform float uWind;\n'+sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n#ifdef USE_INSTANCING\nvec2 wp=instanceMatrix[3].xy;\n#else\nvec2 wp=vec2(0.);\n#endif\nfloat wh=max(transformed.z,0.)/60.;transformed.x+=sin(uWind*1.7+wp.x*.031+wp.y*.023)*wh*wh*3.*sway;')};
  for(const b of buckets.values()){
    const parts=b.builder(),solid=merge(parts.filter(p=>!p.glow)),glow=merge(parts.filter(p=>p.glow));
    b.list.forEach(([x,y],i)=>{if(b.kind==='tree'&&(th.tree==='shroom'||th.tree==='root'||th.tree==='spire'))glows.push({x,y,z:30,col:th.glow})
      else if(b.kind==='glowshroom'||b.kind==='crystal'||b.kind==='voidpool'||b.kind==='lava')if(i%2===0)glows.push({x,y,z:12,col:th.glow})});
    for(const [geo,mat] of [[solid,solidMat],[glow,glowMat]]){if(!geo)continue;
      const im=new InstancedMesh(geo,mat,b.list.length);im.castShadow=mat===solidMat&&b.kind!=='grass'&&b.kind!=='flower'&&b.kind!=='lily';im.receiveShadow=mat===solidMat;im.frustumCulled=false;
      b.list.forEach(([x,y],i)=>{const r=hash(x|0,y|0,7),sc=.85+hash(x|0,y|0,3)*.3;q.setFromAxisAngle(zAxis,r*Math.PI*2);s.set(sc,sc,sc);pos.set(x,y,o.baseZ(x,y));m.compose(pos,q,s);im.setMatrixAt(i,m)});
      im.instanceMatrix.needsUpdate=true;g.add(im)}
  }
  g.userData.glows=glows;
  g.userData.dispose=()=>{g.traverse(c=>{if(c.geometry)c.geometry.dispose()});solidMat.dispose();glowMat.dispose()};
  return g;
}

/* Deterministic scatter of a theme's extras over open ground (and water edges for reeds and lilies).
   map/ground/MW/MH/T from the stage; avoid: [{x,y,r}] keeps the safehouse and gate clear. */
export function scatterExtras(th,st,avoid=[]){
  const out=[],{map,ground,MW,MH,T}=st,N=MW*MH;
  const water=i=>ground&&(ground[i]===3);
  const clear=(x,y)=>avoid.every(a=>Math.hypot(a.x-x,a.y-y)>a.r);
  th.extras.forEach(([kind,count],k)=>{
    const wet=kind==='reed'||kind==='lily';let placed=0;
    for(let tries=0;tries<count*30&&placed<count;tries++){
      const i=Math.floor(hash(tries,k,MW)*N),tx=i%MW,ty=(i/MW)|0;
      if(map[i])continue;
      if(wet){if(kind==='lily'?!water(i):!(water(i)||[i-1,i+1,i-MW,i+MW].some(j=>j>=0&&j<N&&water(j))))continue}
      else if(water(i)||(ground&&(ground[i]===2||ground[i]===4||ground[i]>=5)))continue;
      const x=(tx+.2+hash(tx,ty,k+11)*.6)*T,y=(ty+.2+hash(tx,ty,k+13)*.6)*T;if(!clear(x,y))continue;
      out.push({t:kind,x,y,v:Math.floor(hash(tx,ty,k)*3)});placed++}
  });
  return out;
}

/* Shape helpers, reusable for other low-poly models */
export {P,merge,cyl,cone,ico,box,hemi,hash};
