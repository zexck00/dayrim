/* Built into vendor/three-layer.js with esbuild; uses Three.js r187. */
import {WebGLRenderer,Scene,OrthographicCamera,BufferGeometry,Float32BufferAttribute,PointsMaterial,Points,AdditiveBlending,TorusGeometry,MeshBasicMaterial,Mesh} from '../vendor/three.module.js';
export function createLayer(canvas){
  const renderer=new WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'low-power'});
  renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));
  const scene=new Scene(),camera=new OrthographicCamera(-1,1,1,-1,.1,10);camera.position.z=2;
  const vertices=[];for(let i=0;i<52;i++){const x=((i*71)%197)/98-1,y=((i*109)%193)/96-1;vertices.push(x,y,0)}
  const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(vertices,3));
  const material=new PointsMaterial({color:0x90dfff,size:3.5,transparent:true,opacity:.55,depthTest:false,blending:AdditiveBlending,sizeAttenuation:false});
  const points=new Points(geometry,material);scene.add(points);const ringGeometry=new TorusGeometry(.11,.002,6,48),ringMaterial=new MeshBasicMaterial({color:0x91caff,transparent:true,opacity:.28,depthTest:false,blending:AdditiveBlending});const ring=new Mesh(ringGeometry,ringMaterial);ring.position.set(.82,-.8,0);scene.add(ring);let w=0,h=0;
  return{draw(width,height,time,motion){if(w!==width||h!==height){w=width;h=height;renderer.setSize(width,height,false)}points.rotation.z=motion?Math.sin(time*.00008)*.03:0;ring.rotation.x=motion?time*.00022:.5;ring.rotation.y=motion?time*.00031:.4;renderer.render(scene,camera)},dispose(){geometry.dispose();material.dispose();ringGeometry.dispose();ringMaterial.dispose();renderer.dispose()}};
}
