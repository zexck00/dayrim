/* Tile map → 3D. World axes match the 2D game: x east, y south, z up (one unit = one 2D pixel).
   The ground is one plane carrying the baked 2D tile art; wall tiles rise as blocks whose top shows the
   same art and whose south face gets a stone texture. Pure helpers are exported for the tests. */
import {BufferGeometry,Float32BufferAttribute,Mesh,Group,PlaneGeometry,CanvasTexture,NearestFilter,NoColorSpace,MeshBasicMaterial,RepeatWrapping} from '../vendor/three.module.js';
import {toonMaterial} from './lighting.js';

/* Which faces a wall map needs: a top on every wall tile, a south face where the tile below is open. */
export function wallFaces(map,MW,MH){
  let tops=0,fronts=0;
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){if(!map[y*MW+x])continue;tops++;if(y+1>=MH||!map[(y+1)*MW+x])fronts++}
  return{tops,fronts};
}

export function texFromCanvas(c,repeat){const t=new CanvasTexture(c);t.minFilter=t.magFilter=NearestFilter;t.colorSpace=NoColorSpace;t.generateMipmaps=false;if(repeat){t.wrapS=t.wrapT=RepeatWrapping}return t}

/* opts: {map,MW,MH,T,chunks:[{canvas,tx0,ty0,tx1,ty1}] (ground art per block of tiles; or ground: one canvas for
   the whole map), front: canvas (one tile wide, wallH tall), wallH, edge:'#rrggbb'}
   Big maps arrive in chunks so no texture is larger than phones allow. */
export function buildTerrain(o){
  const {map,MW,MH,T,wallH}=o,W=MW*T,H=MH*T,g=new Group(),texs=[];
  const chunks=o.chunks||[{canvas:o.ground,tx0:0,ty0:0,tx1:MW,ty1:MH}];
  const frontTex=texFromCanvas(o.front,true);texs.push(frontTex);
  const quad=(P,U,N,a,b,c,d,ua,ub,uc,ud,n)=>{P.push(...a,...c,...b,...a,...d,...c);U.push(...ua,...uc,...ub,...ua,...ud,...uc);for(let k=0;k<6;k++)N.push(...n)};
  const mk=(P,U,N,mat)=>{const geo=new BufferGeometry();geo.setAttribute('position',new Float32BufferAttribute(P,3));geo.setAttribute('uv',new Float32BufferAttribute(U,2));geo.setAttribute('normal',new Float32BufferAttribute(N,3));const m=new Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;return m};
  for(const c of chunks){
    const tex=texFromCanvas(c.canvas);texs.push(tex);c.tex=tex;
    const X0=c.tx0*T,Y0=c.ty0*T,X1=c.tx1*T,Y1=c.ty1*T,CW=X1-X0,CH=Y1-Y0,u=x=>(x-X0)/CW,v=y=>1-(y-Y0)/CH;
    // ground piece at z=0 (y grows south, so the mirrored screen needs reversed winding)
    const gp=[],gu=[],gn=[];quad(gp,gu,gn,[X0,Y0,0],[X1,Y0,0],[X1,Y1,0],[X0,Y1,0],[0,1],[1,1],[1,0],[0,0],[0,0,1]);
    const gm=mk(gp,gu,gn,toonMaterial({map:tex,shadowSide:2}));gm.castShadow=false;g.add(gm);
    // wall tops in this chunk sample the same art
    const tp=[],tu=[],tn=[];
    for(let y=c.ty0;y<c.ty1;y++)for(let x=c.tx0;x<c.tx1;x++){if(!map[y*MW+x])continue;const x0=x*T,x1=x0+T,y0=y*T,y1=y0+T;
      quad(tp,tu,tn,[x0,y0,wallH],[x1,y0,wallH],[x1,y1,wallH],[x0,y1,wallH],[u(x0),v(y0)],[u(x1),v(y0)],[u(x1),v(y1)],[u(x0),v(y1)],[0,0,1])}
    if(tp.length)g.add(mk(tp,tu,tn,toonMaterial({map:tex,shadowSide:2})));
  }
  // beyond the map edge: a wide flat border in the darkest wall colour
  const border=new Mesh(new PlaneGeometry(W*3,H*3).translate(W/2,H/2,-.5),new MeshBasicMaterial({color:o.edge,side:2}));border.frustumCulled=false;g.add(border);
  // south faces of walls repeat the stone texture
  const fp=[],fu=[],fn=[];
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){if(!map[y*MW+x]||(y+1<MH&&map[(y+1)*MW+x]))continue;const x0=x*T,x1=x0+T,y1=y*T+T,vv=(x*7+y*3)%4/4;
    quad(fp,fu,fn,[x0,y1,wallH],[x1,y1,wallH],[x1,y1,0],[x0,y1,0],[vv,1],[vv+1,1],[vv+1,0],[vv,0],[0,1,0])}
  if(fp.length)g.add(mk(fp,fu,fn,toonMaterial({map:frontTex,shadowSide:2})));
  g.userData.dispose=()=>{g.traverse(m=>{if(m.geometry)m.geometry.dispose();if(m.material)m.material.dispose()});texs.forEach(t=>t.dispose())};
  g.userData.refreshGround=()=>{chunks.forEach(c=>{c.tex.needsUpdate=true})};
  return g;
}
