/* GPU-drawn particles, updated on the CPU (a few thousand at most): weather around the camera for each
   stage, and short bursts (sparks, embers, dust) that combat asks for. Particles are square pixels in the
   low-resolution frame, so they stay crisp through the palette and dither pass. */
import {BufferGeometry,Float32BufferAttribute,Points,ShaderMaterial,Color,CustomBlending,AddEquation,SrcAlphaFactor,OneFactor,OneMinusSrcAlphaFactor,ZeroFactor} from '../vendor/three.module.js';

const VERT=`attribute vec3 color;attribute float size,alpha;varying vec3 vC;varying float vA,vS;
void main(){vC=color;vA=alpha;vS=size;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=size;}`;
// small particles are square pixels; big ones (mist) are round puffs
const FRAG=`varying vec3 vC;varying float vA,vS;
void main(){vec2 d=gl_PointCoord-.5;if(vA<.01||(vS>5.&&dot(d,d)>.25))discard;gl_FragColor=vec4(vC,vA);}`;

/* Weather recipes: count, colours, size, glow, how they move */
export const WEATHER={
  butterflies:{n:26,cols:['#f0e070','#f08ab0','#e8e4d0','#6aa8c8'],size:[2,3],glow:false,z:[8,40],move:'flutter'},
  pollen:{n:120,cols:['#fff6c0','#f0e070'],size:[1,2],glow:true,z:[4,70],move:'drift',alpha:.55},
  fireflies:{n:70,cols:['#f0e070','#a8d060'],size:[2,3],glow:true,z:[4,32],move:'blink',night:true},
  dust:{n:90,cols:['#a89a7c','#c8c4b0'],size:[1,2],glow:false,z:[2,50],move:'drift',alpha:.5},
  spores:{n:130,cols:['#90e040','#a8d060','#c080ff'],size:[1,3],glow:true,z:[0,80],move:'rise',alpha:.7},
  leaves:{n:46,cols:['#2f7a3f','#4f8a3f','#5a9a48'],size:[2,3],glow:false,z:[0,90],move:'fall'},
  autumn:{n:80,cols:['#c88a30','#a8682a','#e8463f','#f0a040'],size:[2,3],glow:false,z:[0,90],move:'fall'},
  mist:{n:34,cols:['#a8dce4','#e8e4d0'],size:[14,22],glow:false,z:[0,10],move:'drift',alpha:.13},
  ash:{n:150,cols:['#6a6574','#8a8678','#c080ff'],size:[1,2],glow:false,z:[0,90],move:'fall',alpha:.75},
  embers:{n:150,cols:['#e8463f','#ff6a5f','#f0a040'],size:[1,3],glow:true,z:[0,90],move:'rise'}
};
const BURST_MAX=900;
const rnd=(a,b)=>a+Math.random()*(b-a);

function makePoints(n,glow){
  const g=new BufferGeometry();
  g.setAttribute('position',new Float32BufferAttribute(new Float32Array(n*3),3));g.setAttribute('color',new Float32BufferAttribute(new Float32Array(n*3),3));
  g.setAttribute('size',new Float32BufferAttribute(new Float32Array(n),1));g.setAttribute('alpha',new Float32BufferAttribute(new Float32Array(n),1));
  // keep the frame's alpha (the post pass reads it as a marker); glow adds light, the rest blends over
  const mat=new ShaderMaterial({vertexShader:VERT,fragmentShader:FRAG,transparent:true,depthWrite:false,blending:CustomBlending,blendEquation:AddEquation,
    blendSrc:SrcAlphaFactor,blendDst:glow?OneFactor:OneMinusSrcAlphaFactor,blendSrcAlpha:ZeroFactor,blendDstAlpha:OneFactor});
  const p=new Points(g,mat);p.frustumCulled=false;p.renderOrder=3;return p;
}

export function createVfx(scene){
  const soft=makePoints(BURST_MAX+260,false),glow=makePoints(BURST_MAX+260,true);scene.add(soft,glow);
  const col=new Color();let weather=null,wx=[],bursts=[];
  const put=(pts,i,x,y,z,c,s,a)=>{const g=pts.geometry.attributes;g.position.array.set([x,y,z],i*3);col.set(c);g.color.array.set([col.r,col.g,col.b],i*3);g.size.array[i]=s;g.alpha.array[i]=a};
  return{
    setWeather(kind){weather=WEATHER[kind]||null;wx=[]},
    /* sparks, embers or dust at a point; dir (radians) biases them, power scales count and speed */
    burst(x,y,z,c,{n=14,power=1,dir,up=60,life=.45,size=2,glow:g=true,grav=220}={}){
      for(let i=0;i<n*power&&bursts.length<BURST_MAX;i++){const a=dir===undefined?rnd(0,Math.PI*2):dir+rnd(-.9,.9),sp=rnd(40,150)*power;
        bursts.push({x,y,z,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*.7,vz:rnd(up*.4,up)*power,t:life*rnd(.6,1.2),m:life,c:Array.isArray(c)?c[i%c.length]:c,s:Math.round(rnd(size*.6,size+.5)),g,grav})}
    },
    update(dt,f){
      const vw=f.vw,vh=f.vh,cx=f.cx,cy=f.cy,tm=f.time,night=f.night||0,reduced=f.reduced;
      let si=0,gi=0;
      // weather lives in a box the size of the view, wrapping around the camera
      if(weather){const W=weather,n=Math.min(260,Math.round(W.n*(reduced?.35:1)*Math.min(1.6,vw*vh/(820*470))));
        while(wx.length<n)wx.push({ox:Math.random(),oy:Math.random(),z:rnd(W.z[0],W.z[1]),ph:Math.random()*6.28,s:Math.round(rnd(W.size[0],W.size[1])),c:W.cols[(Math.random()*W.cols.length)|0],sp:rnd(.6,1.4)});
        for(let k=0;k<n;k++){const p=wx[k];
          const m=reduced?.25:1;let dx=0,dy=0,dz=0,a=W.alpha||1;
          if(W.move==='flutter'){dx=Math.sin(tm*.7*p.sp+p.ph)*60;dy=Math.cos(tm*.5*p.sp+p.ph)*40;dz=Math.sin(tm*6+p.ph)*4}
          else if(W.move==='drift'){p.ox+=dt*.006*p.sp*m;dy=Math.sin(tm*.3+p.ph)*12;dz=Math.sin(tm*.8+p.ph)*3}
          else if(W.move==='blink'){dx=Math.sin(tm*.4+p.ph)*30;dy=Math.cos(tm*.33+p.ph)*24;a=Math.max(0,Math.sin(tm*2*p.sp+p.ph))*(W.night?.25+night:1)}
          else if(W.move==='rise'){p.z+=dt*14*p.sp*m;if(p.z>W.z[1]){p.z=W.z[0];p.ox=Math.random();p.oy=Math.random()}dx=Math.sin(tm+p.ph)*6;a*=Math.min(1,(W.z[1]-p.z)/20)}
          else if(W.move==='fall'){p.z-=dt*22*p.sp*m;p.ox+=dt*.01*m;if(p.z<W.z[0]){p.z=W.z[1];p.ox=Math.random();p.oy=Math.random()}dx=Math.sin(tm*1.5+p.ph)*10}
          const x=cx-vw/2+(((p.ox*vw+dx)%vw)+vw)%vw,y=cy-vh/2+(((p.oy*(vh+120)+dy)%(vh+120))+vh+120)%(vh+120);
          if(W.glow)put(glow,gi++,x,y,p.z+dz,p.c,p.s,a);else put(soft,si++,x,y,p.z+dz,p.c,p.s,a)}
      }
      // bursts fly, fall and fade
      bursts=bursts.filter(b=>(b.t-=dt)>0);
      for(const b of bursts){b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;b.vz-=b.grav*dt;if(b.z<0){b.z=0;b.vz*=-.3;b.vx*=.6;b.vy*=.6}
        const a=Math.min(1,b.t/b.m*1.5);if(b.g)put(glow,gi++,b.x,b.y,b.z,b.c,b.s,a);else put(soft,si++,b.x,b.y,b.z,b.c,b.s,a)}
      for(const [pts,n] of [[soft,si],[glow,gi]]){const g=pts.geometry;g.setDrawRange(0,n);for(const k of ['position','color','size','alpha'])g.attributes[k].needsUpdate=true}
    },
    counts:()=>({weather:wx.length,bursts:bursts.length}),
    dispose(){for(const p of [soft,glow]){p.geometry.dispose();p.material.dispose()}}
  };
}
