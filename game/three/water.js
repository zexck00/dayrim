/* Stylised water over every water tile: drifting wave bands snapped to the pixel grid, bright streaks,
   and a foam line wherever the tile meets land. Colours come from the stage theme (the Last Night's
   "water" is lava, so it glows instead of taking the light). */
import {BufferGeometry,Float32BufferAttribute,Mesh,ShaderMaterial,Color,Vector3,Uniform} from '../vendor/three.module.js';

const VERT=`attribute vec4 edge;attribute vec2 local;varying vec4 vEdge;varying vec2 vLocal,vWorld;
void main(){vEdge=edge;vLocal=local;vWorld=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const FRAG=`uniform vec3 deep,shallow,foam,hi;uniform float t,light,glow,px;varying vec4 vEdge;varying vec2 vLocal,vWorld;
void main(){
  vec2 w=floor(vWorld/px)*px;
  float wave=sin(w.x*.045+t*1.1+sin(w.y*.06+t*.6)*2.)*sin(w.y*.04-t*.8);
  vec3 c=mix(deep,shallow,step(.25,wave));
  float streak=sin(w.x*.11+w.y*.03+t*1.6)*sin(w.y*.17-t*.9);
  c=mix(c,hi,step(.92,streak));
  // distance (in tiles) to the nearest edge that touches land
  float d=9.;vec2 l=floor(vLocal*16.)/16.;
  if(vEdge.x>.5)d=min(d,l.y);if(vEdge.y>.5)d=min(d,1.-l.x);if(vEdge.z>.5)d=min(d,1.-l.y);if(vEdge.w>.5)d=min(d,l.x);
  float lap=.09+.04*sin(t*2.2+(w.x+w.y)*.08);
  c=mix(c,shallow,step(d,.2));c=mix(c,foam,step(d,lap*.7));
  gl_FragColor=vec4(c*mix(light,1.,glow),1.);
}`;

/* st: {map,ground,MW,MH,T}; th: theme; returns a Mesh (or null when the stage has no water) */
export function buildWater(st,th,px){
  const {map,ground,MW,MH,T}=st;if(!ground)return null;
  const isW=(x,y)=>x>=0&&y>=0&&x<MW&&y<MH&&!map[y*MW+x]&&(ground[y*MW+x]===3||ground[y*MW+x]===4);
  const P=[],E=[],L=[],z=.8;
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
    const i=y*MW+x;if(map[i]||ground[i]!==3)continue;
    const x0=x*T,x1=x0+T,y0=y*T,y1=y0+T,e=[isW(x,y-1)?0:1,isW(x+1,y)?0:1,isW(x,y+1)?0:1,isW(x-1,y)?0:1];
    // corners a(NW) b(NE) c(SE) d(SW), wound a,c,b / a,d,c so the mirrored screen sees the front
    const v=[[x0,y0,0,0],[x1,y1,1,1],[x1,y0,1,0],[x0,y0,0,0],[x0,y1,0,1],[x1,y1,1,1]];
    for(const [px_,py_,lu,lv] of v){P.push(px_,py_,z);E.push(...e);L.push(lu,lv)}
  }
  if(!P.length)return null;
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(P,3));g.setAttribute('edge',new Float32BufferAttribute(E,4));g.setAttribute('local',new Float32BufferAttribute(L,2));
  const c=h=>new Vector3(...new Color(h).toArray());
  const lava=th.tree==='spire';
  const mat=new ShaderMaterial({vertexShader:VERT,fragmentShader:FRAG,uniforms:{deep:new Uniform(c(th.water.deep)),shallow:new Uniform(c(th.water.shallow)),
    foam:new Uniform(c(th.water.foam)),hi:new Uniform(c(th.water.hi)),t:new Uniform(0),light:new Uniform(1),glow:new Uniform(lava?1:0),px:new Uniform(px||1.2)}});
  const m=new Mesh(g,mat);m.frustumCulled=false;m.receiveShadow=false;m.renderOrder=0;
  m.userData.update=(time,light)=>{mat.uniforms.t.value=time;mat.uniforms.light.value=light};
  m.userData.dispose=()=>{g.dispose();mat.dispose()};
  return m;
}
