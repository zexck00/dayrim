/* Low-poly vehicles: rowing boats moored on water, carts and wagons parked against walls, and a car model
   kept for city maps. They are scenery (the rules know nothing of them), placed the same way every time. */
import {Group,Mesh,MeshBasicMaterial,Matrix4,Quaternion,Vector3} from '../vendor/three.module.js';
import {P,merge,cyl,box,hash} from './vegetation.js';
import {toonMaterial} from './lighting.js';

/* y-up parts, length along x */
export const VEHICLES={
  boat:(th,v)=>[P(box(34,6,14),'#7a5a38',0,3,0),P(box(26,3,10),'#4a3524',0,6.5,0),P(box(8,6,10),'#7a5a38',19,4,0,{sz:.6}),P(box(8,6,10),'#7a5a38',-19,4,0,{sz:.6}),
    P(box(3,1.4,12),'#8a6840',4,7,0),P(box(26,1,1),'#c88a30',-4,9,6,{rz:.25}),P(box(2,2,2),th.flower[v],-12,8,0,{glow:true})],
  cart:(th,v)=>[P(box(30,8,18),'#8a6840',0,12,0),P(box(30,6,1.5),'#7a5a38',0,18,9.5),P(box(30,6,1.5),'#7a5a38',0,18,-9.5),
    ...[[-10,10],[10,10],[-10,-10],[10,-10]].map(([x,z])=>P(cyl(5,5,2.4,8),'#4a3524',x,5,z,{rx:Math.PI/2})),
    P(box(22,1.6,1.6),'#5c4c3c',24,8,5,{rz:-.25}),P(box(22,1.6,1.6),'#5c4c3c',24,8,-5,{rz:-.25}),
    P(box(9,6,9),th.canopy[v],-6,19,0),P(box(7,5,7),th.flower[v],7,18,2)],
  wagon:(th,v)=>[P(box(40,10,20),'#7a5a38',0,14,0),...[[-14,11],[14,11],[-14,-11],[14,-11]].map(([x,z])=>P(cyl(6,6,2.4,8),'#2a211a',x,6,z,{rx:Math.PI/2})),
    P(cyl(11,11,38,8,),'#e8e4d0',0,22,0,{rz:Math.PI/2,sy:1,sz:1}),P(box(26,1.6,1.6),'#5c4c3c',30,9,0,{rz:-.2})],
  mine:(th,v)=>[P(box(28,10,18),'#6a6574',0,11,0),P(box(28,2,18),'#4e4a5a',0,16.5,0),...[[-9,10],[9,10],[-9,-10],[9,-10]].map(([x,z])=>P(cyl(4,4,2.4,8),'#2a2438',x,4,z,{rx:Math.PI/2})),P(box(10,5,10),'#a8dce4',-3,18,0,{glow:true})],
  racer:(th,v)=>[P(box(32,7,16),'#a8302a',0,8,0),P(box(12,6,14),'#e8e4d0',-6,13,0),P(box(4,3,16),'#1a1626',14,9,0),...[[-11,9],[11,9],[-11,-9],[11,-9]].map(([x,z])=>P(cyl(5,5,3,8),'#0d0b14',x,5,z,{rx:Math.PI/2})),P(box(3,10,1),'#f8f4e4',-16,15,0)],
  car:(th,v)=>[P(box(40,9,20),['#a8302a','#2c4470','#e8c95c'][v],0,8,0),P(box(20,8,18),'#1c2a4a',-2,16.5,0),
    ...[[-13,10],[13,10],[-13,-10],[13,-10]].map(([x,z])=>P(cyl(4.5,4.5,3,8),'#0d0b14',x,4.5,z,{rx:Math.PI/2})),
    P(box(1,3,4),'#fff6c0',20.5,9,6,{glow:true}),P(box(1,3,4),'#fff6c0',20.5,9,-6,{glow:true})]
};
/* Pick a few spots: boats on water touching land, carts and wagons on open ground under a wall */
export function placeVehicles(th,st,avoid=[]){
  const {map,ground,MW,MH,T}=st,out=[],N=MW*MH;if(!ground)return out;
  const water=i=>i>=0&&i<N&&!map[i]&&ground[i]===3,clear=(x,y)=>avoid.every(a=>Math.hypot(a.x-x,a.y-y)>a.r)&&out.every(o=>Math.hypot(o.x-x,o.y-y)>160);
  const lava=th.tree==='spire';
  for(let k=0;k<N*2&&out.length<10;k++){const i=Math.floor(hash(k,31,MW)*N),x=(i%MW+.5)*T,y=((i/MW|0)+.5)*T;if(!clear(x,y))continue;
    const nWater=[i-1,i+1,i-MW,i+MW].filter(water).length;
    if(!lava&&water(i)&&nWater>=2&&nWater<4&&out.filter(o=>o.t==='boat').length<4)out.push({t:'boat',x,y,a:nWater&&water(i-1)&&water(i+1)?0:Math.PI/2,v:k%3});
    else if(!map[i]&&ground[i]<=1&&i-MW>=0&&map[i-MW]&&out.filter(o=>o.t!=='boat').length<4)out.push({t:k%3?'cart':'wagon',x,y:y-6,a:k%2?0:Math.PI,v:k%3})}
  return out;
}
export function buildVehicles(th,list){
  const g=new Group(),solidMat=toonMaterial({vertexColors:true,shadowSide:2}),glowMat=new MeshBasicMaterial({vertexColors:true}),m=new Matrix4(),q=new Quaternion(),z=new Vector3(0,0,1),s=new Vector3(1,1,1),p=new Vector3();
  for(const o of list){const parts=VEHICLES[o.t](th,o.v||0);
    for(const [geo,mat] of [[merge(parts.filter(x=>!x.glow)),solidMat],[merge(parts.filter(x=>x.glow)),glowMat]]){if(!geo)continue;
      const mesh=new Mesh(geo,mat);q.setFromAxisAngle(z,o.a||0);p.set(o.x,o.y,0);m.compose(p,q,s);mesh.applyMatrix4(m);
      mesh.castShadow=mat===solidMat;mesh.receiveShadow=mat===solidMat;mesh.frustumCulled=false;g.add(mesh)}}
  g.userData.dispose=()=>{g.traverse(c=>{if(c.geometry)c.geometry.dispose()});solidMat.dispose();glowMat.dispose()};
  return g;
}

/* Live vehicles: one model per game vehicle, moved and turned every frame; boats bob, wheels-on-the-ground ones jolt at speed */
export function createVehicleLayer(scene){
  const g=new Group(),solidMat=toonMaterial({vertexColors:true,shadowSide:2}),glowMat=new MeshBasicMaterial({vertexColors:true}),live=new Map();let theme=null;scene.add(g);
  const build=o=>{const grp=new Group(),parts=VEHICLES[o.kind]?VEHICLES[o.kind](theme,o.id%3):VEHICLES.cart(theme,0);
    for(const [geo,mat] of [[merge(parts.filter(x=>!x.glow)),solidMat],[merge(parts.filter(x=>x.glow)),glowMat]]){if(!geo)continue;const m=new Mesh(geo,mat);m.castShadow=mat===solidMat;m.receiveShadow=mat===solidMat;m.frustumCulled=false;grp.add(m)}
    g.add(grp);return grp};
  return{
    reset(th){theme=th;for(const grp of live.values()){g.remove(grp);grp.traverse(c=>{if(c.geometry)c.geometry.dispose()})}live.clear()},
    /* list: [{id,kind,x,y,a,sp}] */
    update(list,time){const seen=new Set();
      for(const o of list||[]){seen.add(o.id);let grp=live.get(o.id);if(!grp){grp=build(o);live.set(o.id,grp)}
        const bob=o.kind==='boat'?Math.sin(time*2+o.id)*1.2:Math.abs(o.sp||0)>60?Math.sin(time*28+o.id)*.6:0;
        grp.position.set(o.x,o.y,bob);grp.rotation.set(o.kind==='boat'?Math.sin(time*1.6+o.id)*.05:0,0,o.a||0)}
      for(const [id,grp] of live)if(!seen.has(id)){g.remove(grp);grp.traverse(c=>{if(c.geometry)c.geometry.dispose()});live.delete(id)}},
    dispose(){this.reset(theme);solidMat.dispose();glowMat.dispose()}
  };
}
