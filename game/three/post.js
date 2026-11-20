/* Pixel-art post pass: the 3D scene is drawn small, then this pass adds ink outlines, the 2D effects layer,
   the day/night tint, a 4×4 ordered dither and the DAYRIM-64 palette, and scales up with hard pixels. */
import {WebGLRenderTarget,DepthTexture,NearestFilter,UnsignedIntType,DataTexture,RGBAFormat,UnsignedByteType,
  ShaderMaterial,Mesh,PlaneGeometry,Scene,OrthographicCamera,CanvasTexture,Vector2,Vector3,Vector4,SRGBColorSpace,NoColorSpace} from '../vendor/three.module.js';
import {buildLut,LUT_N} from './palette.js';

const VERT=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const FRAG=`precision highp float;
uniform sampler2D tScene,tDepth,tOver,tLut;uniform vec2 res;uniform vec3 ink,grade,lift;uniform vec4 tint;uniform float spread,edge,usePal,useInk,useDither,sat;
varying vec2 vUv;
// 4x4 Bayer threshold built from the 2x2 one: b2(0,0)=0, (1,0)=2, (0,1)=3, (1,1)=1
float b2(vec2 p){return mod(2.*p.x+3.*p.y,4.);}
float bayer(vec2 p){p=floor(p);return (4.*b2(mod(p,2.))+b2(mod(floor(p/2.),2.))+.5)/16.;}
vec3 lut(vec3 c){c=clamp(c,0.,1.);float n=${LUT_N}.;vec3 i=floor(c*(n-1.)+.5);
  vec2 uv=vec2((i.b*n+i.r+.5)/(n*n),(i.g+.5)/n);return texture2D(tLut,uv).rgb;}
float depthAt(vec2 uv){return texture2D(tDepth,uv).x;}
void main(){
  vec4 s=texture2D(tScene,vUv);vec4 o=texture2D(tOver,vUv);
  bool card=abs(s.a-.5)<.2;
  vec3 col=s.rgb;
  // the stage's colour grade (sprites keep their own colours)
  if(!card)col=mix(vec3(dot(col,vec3(.299,.587,.114))),col,sat)*grade+lift;
  // Ink: this pixel sits just outside something nearer (and not a sprite, which brings its own outline)
  if(useInk>.5&&!card){
    vec2 px=1./res;float d=depthAt(vUv),hit=0.;
    for(int k=0;k<4;k++){vec2 off=k==0?vec2(px.x,0.):k==1?vec2(-px.x,0.):k==2?vec2(0.,px.y):vec2(0.,-px.y);
      float dn=depthAt(vUv+off);vec4 sn=texture2D(tScene,vUv+off);if(d-dn>edge&&abs(sn.a-.5)>.2)hit=1.;}
    col=mix(col,ink,hit*.9);
  }
  col=mix(col,o.rgb,o.a);
  col=mix(col,tint.rgb,tint.a);
  // Sprites keep their hand-picked colours; the world and the effects go through dither and palette
  if(usePal>.5&&!(card&&o.a<.5)){
    if(useDither>.5)col+=(bayer(vUv*res)-.5)*spread;
    col=lut(col);
  }
  gl_FragColor=vec4(col,1.);
}`;

export function createPost(renderer){
  const rt=new WebGLRenderTarget(4,4,{minFilter:NearestFilter,magFilter:NearestFilter,depthBuffer:true});
  rt.depthTexture=new DepthTexture(4,4);rt.depthTexture.type=UnsignedIntType;rt.depthTexture.minFilter=NearestFilter;rt.depthTexture.magFilter=NearestFilter;
  const lutTex=new DataTexture(buildLut(),LUT_N*LUT_N,LUT_N,RGBAFormat,UnsignedByteType);lutTex.minFilter=lutTex.magFilter=NearestFilter;lutTex.needsUpdate=true;
  const overCanvas=document.createElement('canvas');overCanvas.width=overCanvas.height=4;
  const overTex=new CanvasTexture(overCanvas);overTex.minFilter=overTex.magFilter=NearestFilter;overTex.colorSpace=NoColorSpace;overTex.flipY=true;
  const mat=new ShaderMaterial({vertexShader:VERT,fragmentShader:FRAG,depthTest:false,depthWrite:false,uniforms:{
    tScene:{value:rt.texture},tDepth:{value:rt.depthTexture},tOver:{value:overTex},tLut:{value:lutTex},
    res:{value:new Vector2(4,4)},ink:{value:new Vector3(.1,.08,.14)},tint:{value:new Vector4(0,0,0,0)},
    spread:{value:.045},edge:{value:.002},usePal:{value:1},useInk:{value:1},useDither:{value:1},
    grade:{value:new Vector3(1,1,1)},lift:{value:new Vector3(0,0,0)},sat:{value:1}}});
  const quad=new Mesh(new PlaneGeometry(2,2),mat);quad.frustumCulled=false;
  const scene=new Scene();scene.add(quad);const cam=new OrthographicCamera(-1,1,1,-1,0,1);
  let w=0,h=0;
  return{
    rt,overCanvas,overCtx:overCanvas.getContext('2d'),uniforms:mat.uniforms,
    /* Internal pixel size of the low-resolution frame */
    size(iw,ih){if(iw===w&&ih===h)return;w=iw;h=ih;rt.setSize(iw,ih);overCanvas.width=iw;overCanvas.height=ih;mat.uniforms.res.value.set(iw,ih);overTex.dispose()},
    setLut(weights){lutTex.image.data.set(buildLut(weights));lutTex.needsUpdate=true},
    render(){overTex.needsUpdate=true;renderer.setRenderTarget(null);renderer.render(scene,cam)},
    dispose(){rt.dispose();rt.depthTexture.dispose();lutTex.dispose();overTex.dispose();mat.dispose();quad.geometry.dispose()}
  };
}
