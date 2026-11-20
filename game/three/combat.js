/* Combat light and impact on top of the 2D attack art: every shot carries a glow, charged beams become a
   blazing ray with a hot core, and hits throw sparks and a brief flash of light. Visual only. */
import {BufferGeometry,Float32BufferAttribute,Points,Mesh,ShaderMaterial,Color,Vector3,Uniform,CustomBlending,AddEquation,SrcAlphaFactor,OneFactor,ZeroFactor} from '../vendor/three.module.js';

const ADD={transparent:true,depthWrite:false,blending:CustomBlending,blendEquation:AddEquation,blendSrc:SrcAlphaFactor,blendDst:OneFactor,blendSrcAlpha:ZeroFactor,blendDstAlpha:OneFactor};
const HALO_V=`attribute vec3 color;attribute float size;varying vec3 vC;void main(){vC=color;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=size;}`;
// stepped falloff (3 rings) instead of a smooth gradient, so it reads as pixel art
const HALO_F=`varying vec3 vC;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;float a=r<.3?.9:r<.6?.45:.18;gl_FragColor=vec4(mix(vec3(1.),vC,smoothstep(.0,.35,r)),a);}`;
const BEAM_V=`attribute vec2 st;varying vec2 vSt;void main(){vSt=st;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const BEAM_F=`uniform vec3 col;uniform float t,power;varying vec2 vSt;
void main(){float w=abs(vSt.y),flick=.85+.15*sin(vSt.x*40.-t*50.);
  float core=step(w,.18),mid=step(w,.5),edge=step(w,1.);
  vec3 c=mix(col,vec3(1.),core);float a=(core*.9+mid*.35+edge*.15)*flick*power*smoothstep(0.,.04,vSt.x)*(1.-smoothstep(.92,1.,vSt.x));
  if(a<.02)discard;gl_FragColor=vec4(c,a);}`;
const MAX_HALO=160,MAX_BEAM=6;

export function createCombat(scene,vfx){
  const hg=new BufferGeometry();hg.setAttribute('position',new Float32BufferAttribute(new Float32Array(MAX_HALO*3),3));hg.setAttribute('color',new Float32BufferAttribute(new Float32Array(MAX_HALO*3),3));hg.setAttribute('size',new Float32BufferAttribute(new Float32Array(MAX_HALO),1));
  const halos=new Points(hg,new ShaderMaterial(Object.assign({vertexShader:HALO_V,fragmentShader:HALO_F},ADD)));halos.frustumCulled=false;halos.renderOrder=4;scene.add(halos);
  const beams=[];for(let i=0;i<MAX_BEAM;i++){const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(new Float32Array(18),3));
    g.setAttribute('st',new Float32BufferAttribute([0,-1,1,1,1,-1, 0,-1,0,1,1,1],2));
    const m=new Mesh(g,new ShaderMaterial(Object.assign({vertexShader:BEAM_V,fragmentShader:BEAM_F,side:2,uniforms:{col:new Uniform(new Vector3(1,1,1)),t:new Uniform(0),power:new Uniform(1)}},ADD)));
    m.frustumCulled=false;m.renderOrder=5;m.visible=false;scene.add(m);beams.push(m)}
  const col=new Color();let flashes=[];
  const rgb=c=>typeof c==='string'&&c[0]!=='#'&&c.indexOf(',')>0&&!c.startsWith('rgb')?'rgb('+c+')':c;
  return{
    /* f.shots:[{x,y,z,col,big}], f.beams:[{x,y,z,a,len,col,full}], f.hits:[{k,x,y,col,power}] → extra lights for this frame */
    update(dt,f){
      const tm=f.time||0;
      // shot glows
      const a=hg.attributes;let n=0;
      for(const s of f.shots||[]){if(n>=MAX_HALO)break;col.set(rgb(s.col||'255,200,120'));a.position.array.set([s.x,s.y,s.z||18],n*3);a.color.array.set([col.r,col.g,col.b],n*3);a.size.array[n]=s.big?26:13;n++}
      hg.setDrawRange(0,n);a.position.needsUpdate=a.color.needsUpdate=a.size.needsUpdate=true;
      // beams: a flat ray at hand height along the aim
      const bl=f.beams||[];
      beams.forEach((m,i)=>{const b=bl[i];m.visible=!!b;if(!b)return;
        const z=b.z||24,dx=Math.cos(b.a),dy=Math.sin(b.a),w=b.full?16:11,nx=-dy*w,ny=dx*w,ex=b.x+dx*b.len,ey=b.y+dy*b.len,p=m.geometry.attributes.position.array;
        p.set([b.x+nx,b.y+ny,z, ex-nx,ey-ny,z, ex+nx,ey+ny,z, b.x+nx,b.y+ny,z, b.x-nx,b.y-ny,z, ex-nx,ey-ny,z]);
        // st: x along the beam 0..1, y across -1..1
        m.geometry.attributes.st.array.set([0,1,1,-1,1,1, 0,1,0,-1,1,-1]);m.geometry.attributes.st.needsUpdate=true;
        m.geometry.attributes.position.needsUpdate=true;const u=m.material.uniforms;col.set(rgb(b.col||'170,255,210'));u.col.value.set(col.r,col.g,col.b);u.t.value=tm;u.power.value=b.full?1:.8;
        if(Math.random()<.5&&vfx)vfx.burst(ex,ey,z,[rgb(b.col||'170,255,210'),'#fff6c0'],{n:2,power:.6,up:40,life:.3,size:2})});
      // hits: sparks and a short flash of light
      for(const h of f.hits||[]){const c=rgb(h.col||'255,220,150'),p=h.power||1;
        if(vfx)vfx.burst(h.x,h.y,h.z||22,[c,'#fff6c0'],{n:h.k==='bossdie'?60:h.k==='gib'?20:10,power:Math.min(2,p),up:h.k==='bossdie'?160:70,life:h.k==='bossdie'?1:.4,size:h.k==='bossdie'?3:2});
        flashes.push({x:h.x,y:h.y,z:30,col:c,r:h.k==='bossdie'?320:120,i:h.k==='bossdie'?2:.7,t:h.k==='bossdie'?.6:.14,m:h.k==='bossdie'?.6:.14})}
      flashes=flashes.filter(l=>(l.t-=dt)>0);
      const lights=flashes.map(l=>({x:l.x,y:l.y,z:l.z,col:l.col,r:l.r,i:l.i*l.t/l.m}));
      for(const b of bl)lights.push({x:b.x+Math.cos(b.a)*b.len*.5,y:b.y+Math.sin(b.a)*b.len*.5,z:30,col:rgb(b.col||'170,255,210'),r:Math.max(140,b.len*.6),i:b.full?1.4:.9});
      return lights;
    },
    dispose(){hg.dispose();halos.material.dispose();beams.forEach(m=>{m.geometry.dispose();m.material.dispose()})}
  };
}
