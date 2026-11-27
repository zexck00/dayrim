/* Dayrim's Pixel 3D world: the entry the game loads (bundled into vendor/three-world.js).
   The camera is an oblique 3/4 projection: the ground maps to the screen exactly as in the 2D game
   (so aiming, hit areas and 2D effects line up), and height rises straight up the screen. */
import {WebGLRenderer,Scene,Camera,Matrix4,Mesh,PlaneGeometry,MeshBasicMaterial,CanvasTexture,NearestFilter,NoColorSpace,
  LinearSRGBColorSpace,ColorManagement,BasicShadowMap,CustomBlending,AddEquation,SrcAlphaFactor,OneMinusSrcAlphaFactor,ZeroFactor,OneFactor,Color} from '../vendor/three.module.js';
import {createPost} from './post.js';
import {createLighting} from './lighting.js';
import {buildTerrain} from './geometry.js';
import {createCards} from './characters.js';
import {buildVegetation,scatterExtras,VEG_KINDS} from './vegetation.js';
import {buildWater} from './water.js';
import {createVfx} from './vfx.js';
import {createCombat} from './combat.js';
import {themeFor,STAGE_THEMES} from './stages.js';
import {DAYRIM64,hexToRgb,nearest} from './palette.js';
import {buildVoxel,createHeroes,isoMatrix,isoDepth,BILL_V,ISO_R} from './voxel.js';
export {isoProject,isoUnproject,isoScale,isoSpan,isoInView,isoDepth,ISO_TURN,ISO_ELEV} from './voxel.js';
import {Group} from '../vendor/three.module.js';
export {DAYRIM64,buildLut,nearest,lutLookup} from './palette.js';
export {STAGE_THEMES,themeFor,THEME_KEYS} from './stages.js';
export {VEG_KINDS,EXTRA_KINDS,TREE_KINDS,scatterExtras} from './vegetation.js';
export {WEATHER} from './vfx.js';
/* Palette weights that favour a theme's own colours, so each stage keeps its character after reduction */
export function themeWeights(th){const w=new Array(DAYRIM64.length).fill(1),add=h=>{w[nearest(hexToRgb(h))]=1.15};
  [...th.canopy,...th.shrub,...th.grass,...th.flower,th.trunk,th.gnd,th.glow,th.water.deep,th.water.shallow].forEach(add);return w}

export const DEPTH_R=4000,SHEAR=1;
/* Oblique projection: world (x,y,z) → clip. Exported so the tests can check the 2D mapping. */
export function obliqueMatrix(cx,cy,vw,vh,S=SHEAR,R=DEPTH_R){
  return[2/vw,0,0,-2*cx/vw, 0,-2/vh,2*S/vh,2*cy/vh, 0,-1/R,-.01/R,cy/R, 0,0,0,1];
}
/* Where a world point lands on screen (CSS pixels), given the same view as the 2D game */
export function project(x,y,z,cx,cy,W,H,zoom){return{x:W/2+(x-cx)*zoom,y:H/2+(y-z*SHEAR-cy)*zoom}}

export function createWorld(canvas){
  ColorManagement.enabled=false;
  const renderer=new WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance',stencil:false});
  renderer.outputColorSpace=LinearSRGBColorSpace;renderer.setPixelRatio(1);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=BasicShadowMap;
  const scene=new Scene(),cam=new Camera();cam.matrixAutoUpdate=false;cam.matrixWorldAutoUpdate=false;
  const post=createPost(renderer),light=createLighting(scene),cards=createCards(scene),vfx=createVfx(scene),combat=createCombat(scene,vfx);let lastT=null;
  // ground decals (the 2D layer drawn under actors): a plane over the view, just above the ground
  const underCanvas=document.createElement('canvas');underCanvas.width=underCanvas.height=4;
  const underTex=new CanvasTexture(underCanvas);underTex.minFilter=underTex.magFilter=NearestFilter;underTex.colorSpace=NoColorSpace;underTex.flipY=false;underTex.generateMipmaps=false;
  const underGeo=new PlaneGeometry(1,1);{const ix=underGeo.index.array;for(let i=0;i<ix.length;i+=3){const t=ix[i+1];ix[i+1]=ix[i+2];ix[i+2]=t}}
  const underMat=new MeshBasicMaterial({map:underTex,transparent:true,depthWrite:false,blending:CustomBlending,blendEquation:AddEquation,
    blendSrc:SrcAlphaFactor,blendDst:OneMinusSrcAlphaFactor,blendSrcAlpha:ZeroFactor,blendDstAlpha:OneFactor});
  const under=new Mesh(underGeo,underMat);under.frustumCulled=false;under.renderOrder=1;scene.add(under);
  let terrain=null,veg=null,water=null,theme=STAGE_THEMES[0],lastSt=null,vox=null,voxOn=false;
  // voxel preview: block stage built on demand, block heroes
  const heroRoot=new Group();scene.add(heroRoot);const heroes=createHeroes(heroRoot);
  const showVox=()=>{if(voxOn&&!vox&&lastSt){vox=buildVoxel(lastSt,theme);scene.add(vox)}if(vox)vox.visible=voxOn;if(terrain)terrain.visible=!voxOn;if(veg)veg.visible=!voxOn;heroRoot.visible=voxOn};const M=new Matrix4(),clear=new Color(),wind={value:0},tc=new Color(),tc2=new Color();
  const mixHex=(a,b,k)=>'#'+tc.set(a).lerp(tc2.set(b),k).getHexString();
  return{
    underCanvas,underCtx:underCanvas.getContext('2d'),overCanvas:post.overCanvas,overCtx:post.overCtx,post,vegKinds:VEG_KINDS,
    /* stage: {map,ground,MW,MH,T,groundCanvas,front,wallH,edge,stage,story,ci,props,avoid} */
    setStage(st){
      for(const o of [terrain,veg,water,vox])if(o){scene.remove(o);o.userData.dispose()}vox=null;lastSt=st;
      theme=st.story?STAGE_THEMES[[0,2,5][st.ci||0]||0]:themeFor(st.stage);
      terrain=buildTerrain(st);scene.add(terrain);clear.set(st.edge);
      const baseZ=(x,y)=>{const tx=Math.floor(x/st.T),ty=Math.floor(y/st.T);return tx>=0&&ty>=0&&tx<st.MW&&ty<st.MH&&st.map[ty*st.MW+tx]?st.wallH:0};
      veg=buildVegetation({theme,props:st.props.filter(p=>VEG_KINDS.includes(p.t)),extras:scatterExtras(theme,st,st.avoid),baseZ,wind});scene.add(veg);
      water=buildWater(st,theme,1.2);if(water)scene.add(water);else water=null;
      vfx.setWeather(theme.weather);
      const u=post.uniforms;u.grade.value.set(...theme.grade);u.lift.value.set(...theme.lift);u.sat.value=theme.sat;u.ink.value.set(...tc.set(theme.ink).toArray());
      post.setLut(themeWeights(theme));showVox();
      return theme;
    },
    theme:()=>theme,
    setVoxel(on){voxOn=!!on;showVox();return voxOn},
    debug:()=>({scene,vox,light,heroRoot,renderer}),
    refreshGround(){if(terrain)terrain.userData.refreshGround()},
    /* f: {W,H,iw,ih,cx,cy,vw,vh,sun,amb,lights,tint,cardLight,cards:[{canvas,q,footY,dynamic}]} */
    frame(f){
      const sw=Math.round(f.W*f.dpr),sh=Math.round(f.H*f.dpr);
      if(canvas.width!==sw||canvas.height!==sh)renderer.setSize(sw,sh,false);
      const iso=!!(f.iso&&voxOn&&vox);post.size(iso?f.rw:f.iw,iso?f.rh:f.ih);
      if(underCanvas.width!==f.iw||underCanvas.height!==f.ih){underCanvas.width=f.iw;underCanvas.height=f.ih;underTex.dispose()}
      M.set(...(iso?isoMatrix(f.cx,f.cy,f.W,f.H,f.s,DEPTH_R):obliqueMatrix(f.cx,f.cy,f.vw,f.vh)));cam.projectionMatrix.copy(M);cam.projectionMatrixInverse.copy(M).invert();
      // combat glows and weather move first; their flashes join the point lights below
      const dt=lastT===null?0:Math.min(.1,Math.max(0,(f.time||0)-lastT));lastT=f.time||0;
      const fight=combat.update(dt,f);vfx.update(dt,f);
      // the stage colours the sun and sky; glowing scenery near the view joins the point lights
      const glows=(veg&&veg.userData.glows||[]).filter(g=>Math.abs(g.x-f.cx)<f.vw*.7&&Math.abs(g.y-f.cy)<f.vh*.7).map(g=>({x:g.x,y:g.y,z:g.z,col:g.col,r:120,i:.25+.5*(f.night||0)}));
      light.update({cx:f.cx,cy:f.cy,vw:f.vw,vh:f.vh,sun:{dir:f.sun.dir,col:mixHex(f.sun.col,theme.sun,.35),i:f.sun.i},amb:{sky:mixHex(f.amb.sky,theme.sky,.25),ground:mixHex(f.amb.ground,theme.gnd,.5),i:f.amb.i},lights:f.lights.concat(glows,fight)});
      wind.value=f.time||0;if(water)water.userData.update(f.time||0,f.dayLight===undefined?1:f.dayLight);
      under.position.set(f.cx,f.cy,2);under.scale.set(f.vw,f.vh,1);under.updateMatrix();underTex.needsUpdate=true;
      if(iso)heroes.update(f.heroes||[],f.time||0);
      cards.begin(f.cy,DEPTH_R,f.cardLight,iso?{cx:f.cx,cy:f.cy,R:ISO_R,V:BILL_V,depth:isoDepth}:null);for(const c of f.cards)cards.add(c.canvas,c.q,c.footY,c.dynamic,c.sink);cards.end();
      const u=post.uniforms;u.tint.value.set(f.tint[0],f.tint[1],f.tint[2],f.tint[3]);
      // ink edge: a jump of about 14 world rows in depth
      u.edge.value=14*.5/DEPTH_R;
      if(f.opts){u.usePal.value=f.opts.pal?1:0;u.useInk.value=f.opts.ink?1:0;u.useDither.value=f.opts.dither?1:0}
      renderer.setRenderTarget(post.rt);renderer.setClearColor(clear,1);renderer.clear();renderer.render(scene,cam);
      post.render();
    },
    stats:()=>vfx.counts(),
    dispose(){for(const o of [terrain,veg,water,vox])if(o)o.userData.dispose();heroes.dispose();vfx.dispose();combat.dispose();post.dispose();light.dispose();cards.dispose();underGeo.dispose();underMat.dispose();underTex.dispose();renderer.dispose()}
  };
}
