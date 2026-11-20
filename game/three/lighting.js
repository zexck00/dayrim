/* Lighting shared by every stage: a sun (or moon) with a small shadow map, sky/ground ambient, a pool of
   point lights for lamps, shots and glows, and a 3-step toon ramp so surfaces read as flat cel bands. */
import {DirectionalLight,HemisphereLight,PointLight,Object3D,DataTexture,RedFormat,UnsignedByteType,NearestFilter,MeshToonMaterial,Color} from '../vendor/three.module.js';

export const MAX_POINT_LIGHTS=8;
let ramp=null;
/* Three bands: shade, mid, lit */
export function toonRamp(){
  if(ramp)return ramp;
  ramp=new DataTexture(new Uint8Array([90,170,255]),3,1,RedFormat,UnsignedByteType);ramp.minFilter=ramp.magFilter=NearestFilter;ramp.needsUpdate=true;return ramp;
}
export function toonMaterial(opts={}){return new MeshToonMaterial(Object.assign({gradientMap:toonRamp()},opts))}

export function createLighting(scene,{shadowSize=1024}={}){
  const hemi=new HemisphereLight(0xdfe8ff,0x4a4030,1.15);hemi.position.set(0,0,1);scene.add(hemi);
  const sun=new DirectionalLight(0xfff0d0,1.6),target=new Object3D();scene.add(target);sun.target=target;
  sun.castShadow=true;sun.shadow.mapSize.set(shadowSize,shadowSize);sun.shadow.bias=-.0015;sun.shadow.normalBias=1;
  Object.assign(sun.shadow.camera,{near:1,far:4000});scene.add(sun);
  const points=[];for(let i=0;i<MAX_POINT_LIGHTS;i++){const p=new PointLight(0xffd090,0,160,2);scene.add(p);points.push(p)}
  const tmp=new Color();
  return{sun,hemi,points,
    /* state: {cx,cy,vw,vh, sun:{dir:[x,y,z],col,i}, amb:{sky,ground,i}, lights:[{x,y,z,col,r,i}]} */
    update(s){
      const d=s.sun.dir,L=Math.hypot(d[0],d[1],d[2])||1;
      target.position.set(s.cx,s.cy,0);sun.position.set(s.cx+d[0]/L*1500,s.cy+d[1]/L*1500,d[2]/L*1500);
      const half=Math.max(s.vw,s.vh)*.75,c=sun.shadow.camera;
      if(c.right!==half){c.left=-half;c.right=half;c.top=half;c.bottom=-half;c.updateProjectionMatrix()}
      sun.color.set(s.sun.col);sun.intensity=s.sun.i;
      hemi.color.set(s.amb.sky);hemi.groundColor.set(s.amb.ground);hemi.intensity=s.amb.i;
      // brightest and nearest lights win the pool
      const ls=(s.lights||[]).slice().sort((a,b)=>(b.i/(1+Math.hypot(b.x-s.cx,b.y-s.cy)*.004))-(a.i/(1+Math.hypot(a.x-s.cx,a.y-s.cy)*.004)));
      for(let i=0;i<MAX_POINT_LIGHTS;i++){const p=points[i],l=ls[i];
        // lights stay in the scene at zero so shaders never recompile
        if(!l){p.intensity=0;continue}
        p.position.set(l.x,l.y,l.z||30);p.color.copy(tmp.set(l.col));p.distance=l.r||160;p.intensity=l.i*90}
    },
    dispose(){sun.dispose();hemi.dispose();points.forEach(p=>p.dispose())}
  };
}
