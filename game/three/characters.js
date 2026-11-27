/* Chibi sprite cards. Characters keep their hand-drawn rig frames (rig.js); each frame becomes an upright
   card standing at the actor's feet. Cards write depth from the feet, so walls in front hide them and
   they hide what is behind them, and they mark themselves (alpha 0.5) so the post pass keeps their
   colours and skips the extra ink line (rig frames already have one). */
import {BufferGeometry,Float32BufferAttribute,Mesh,ShaderMaterial,CanvasTexture,NearestFilter,NoColorSpace,Vector3,Uniform} from '../vendor/three.module.js';

const VERT=`uniform float footY,bias,camY,depthR;varying vec2 vUv;varying float vZ;
void main(){vUv=uv;vZ=position.z;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);
  // depth comes from the feet, not from each pixel's height
  p.z=(-(footY+bias-camY))/depthR;gl_Position=p;}`;
const FRAG=`uniform sampler2D map;uniform vec3 light;uniform float alpha,sink;varying vec2 vUv;varying float vZ;
// sink: wading actors hide everything under the waterline
void main(){vec4 c=texture2D(map,vUv);if(c.a<.5||vZ<sink)discard;gl_FragColor=vec4(c.rgb*light,.5);}`;

export function createCards(scene){
  const pool=[],tex=new WeakMap(),light=new Vector3(1,1,1);let used=0,camY=0,depthR=4000,iso=null;
  const texOf=(canvas,dynamic)=>{let t=tex.get(canvas);if(!t){t=new CanvasTexture(canvas);t.minFilter=t.magFilter=NearestFilter;t.colorSpace=NoColorSpace;t.generateMipmaps=false;tex.set(canvas,t)}else if(dynamic)t.needsUpdate=true;return t};
  function card(){
    const geo=new BufferGeometry();geo.setAttribute('position',new Float32BufferAttribute(new Float32Array(12),3));geo.setAttribute('uv',new Float32BufferAttribute([0,1,1,1,1,0,0,0],2));geo.setIndex([0,2,1,0,3,2]);
    const mat=new ShaderMaterial({vertexShader:VERT,fragmentShader:FRAG,side:2,uniforms:{map:new Uniform(null),footY:new Uniform(0),bias:new Uniform(8),camY:new Uniform(0),depthR:new Uniform(depthR),light:new Uniform(light),alpha:new Uniform(1),sink:new Uniform(0)}});
    const m=new Mesh(geo,mat);m.frustumCulled=false;m.matrixAutoUpdate=false;scene.add(m);return m;
  }
  return{
    begin(cy,R,l,isoView){used=0;camY=cy;depthR=R;iso=isoView||null;if(l)light.set(l[0],l[1],l[2])},
    /* canvas: the image; q: 4 corners [x0,y0,...] in 2D world space, clockwise from top-left;
       footY: depth row; dynamic: canvas changes every frame (re-upload) */
    add(canvas,q,footY,dynamic,sink){
      const m=pool[used]||(pool[used]=card());used++;m.visible=true;
      const a=m.geometry.attributes.position.array;
      // a 2D point (X,Y) on an upright card at row footY sits at height z = footY - Y
      // voxel preview: the card turns to face the isometric camera and takes its depth from its feet
      let fx=0;if(iso){fx=(q[0]+q[2]+q[4]+q[6])/4;const R=iso.R,V=iso.V;for(let i=0;i<4;i++){const o=q[i*2]-fx,h=footY-q[i*2+1];a[i*3]=fx+o*R[0]+h*V[0];a[i*3+1]=footY+o*R[1]+h*V[1];a[i*3+2]=h*V[2]}}
      else for(let i=0;i<4;i++){a[i*3]=q[i*2];a[i*3+1]=footY;a[i*3+2]=footY-q[i*2+1]}
      m.geometry.attributes.position.needsUpdate=true;
      const u=m.material.uniforms;u.map.value=texOf(canvas,dynamic);u.footY.value=iso?-iso.depth(fx,footY,iso.cx,iso.cy):footY;u.sink.value=sink||0;u.camY.value=iso?0:camY;u.depthR.value=depthR;
    },
    end(){for(let i=used;i<pool.length;i++)pool[i].visible=false},
    dispose(){pool.forEach(m=>{m.geometry.dispose();m.material.dispose()})}
  };
}
