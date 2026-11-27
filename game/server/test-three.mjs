/* Pixel 3D maths that runs without a browser: palette, colour lookup, projection, wall faces.
   Run with: node test-three.mjs */
import assert from 'node:assert';
import {DAYRIM64,buildLut,lutLookup,nearest,hexToRgb} from '../three/palette.js';
import {obliqueMatrix,project,SHEAR} from '../three/world.js';
import {wallFaces} from '../three/geometry.js';
import {STAGE_THEMES,THEME_KEYS,themeFor} from '../three/stages.js';
import {TREE_KINDS,EXTRA_KINDS,scatterExtras,buildVegetation} from '../three/vegetation.js';
import {WEATHER} from '../three/vfx.js';
import {isoMatrix,isoProject,isoUnproject,isoScale,isoSpan,isoInView,ISO_TURN,ISO_ELEV,hullVoxels} from '../three/voxel.js';
let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;console.log('  ok  '+m)};

ok(DAYRIM64.length===64&&new Set(DAYRIM64).size===64,'DAYRIM-64 has 64 different colours');
ok(DAYRIM64.every((h,i)=>nearest(hexToRgb(h))===i),'every palette colour is its own nearest colour');
const lut=buildLut(),inPal=new Set(DAYRIM64.map(h=>hexToRgb(h).join(',')));
ok(DAYRIM64.every(h=>inPal.has(lutLookup(lut,hexToRgb(h)).join(','))),'the lookup table only ever returns palette colours');
const self=DAYRIM64.filter(h=>lutLookup(lut,hexToRgb(h)).join(',')===hexToRgb(h).join(',')).length;
ok(self>=56,'the lookup table keeps at least 56 of 64 palette colours exactly ('+self+')');

// The oblique camera must put ground points exactly where the 2D game draws them
const mul=(m,x,y,z)=>[m[0]*x+m[1]*y+m[2]*z+m[3],m[4]*x+m[5]*y+m[6]*z+m[7],m[8]*x+m[9]*y+m[10]*z+m[11]];
const W=980,H=560,zoom=1.5,cx=1200,cy=900,vw=W/zoom,vh=H/zoom,m=obliqueMatrix(cx,cy,vw,vh);
let worst=0;for(const [x,y] of [[cx,cy],[cx-300,cy+120],[cx+250,cy-160],[cx+10,cy+170]]){
  const c=mul(m,x,y,0),sx=(c[0]+1)/2*W,sy=(1-c[1])/2*H,p=project(x,y,0,cx,cy,W,H,zoom),q2d={x:W/2+(x-cx)*zoom,y:H/2+(y-cy)*zoom};
  worst=Math.max(worst,Math.hypot(sx-q2d.x,sy-q2d.y),Math.hypot(p.x-q2d.x,p.y-q2d.y))}
ok(worst<1,'ground points land on the same screen pixel as in 2D (within '+worst.toFixed(3)+' px)');
{const a=mul(m,cx,cy,0),b=mul(m,cx,cy,40);ok(Math.abs((b[1]-a[1])/2*H-40*SHEAR*zoom)<1e-6&&Math.abs(b[0]-a[0])<1e-9,'height rises straight up the screen at full size')}
{const back=mul(m,cx,cy-40,0)[2],front=mul(m,cx,cy+40,0)[2],high=mul(m,cx,cy,30)[2],low=mul(m,cx,cy,0)[2];
 ok(front<back,'things further south are nearer the camera');ok(high<low&&low-high<(back-front)/50,'height only nudges depth, so tall walls do not cover what stands in front')}

// Voxel preview (Stage 1 proof of concept): the isometric camera, aim and movement must agree with each other
{const s=isoScale(zoom),im=isoMatrix(cx,cy,W,H,s);let bad=0,back=0;
 for(const [x,y,z] of [[cx,cy,0],[cx-300,cy+120,0],[cx+250,cy-160,30],[cx+10,cy+170,60]]){const c=mul(im,x,y,z),p=isoProject(x,y,z,cx,cy,W,H,s);bad=Math.max(bad,Math.hypot((c[0]+1)/2*W-p.x,(1-c[1])/2*H-p.y))}
 ok(bad<1e-6,'the voxel camera draws points where its own screen maths says ('+bad.toExponential(1)+' px)');
 for(const [x,y,h] of [[cx+90,cy-40,0],[cx-200,cy+150,18],[cx+5,cy+5,40]]){const p=isoProject(x,y,h,cx,cy,W,H,s),q=isoUnproject(p.x,p.y,cx,cy,W,H,s,h);back=Math.max(back,Math.hypot(q.x-x,q.y-y))}
 ok(back<1e-6,'aiming at a screen point finds the same ground point back ('+back.toExponential(1)+')');
 const turn=(x,y)=>{const c=Math.cos(ISO_TURN),sn=Math.sin(ISO_TURN);return[x*c-y*sn,x*sn+y*c]},dirOn=(x,y)=>{const a=isoProject(cx,cy,0,cx,cy,W,H,s),b=isoProject(cx+x*50,cy+y*50,0,cx,cy,W,H,s);return Math.atan2(b.y-a.y,b.x-a.x)};
 const up=dirOn(...turn(0,-1)),right=dirOn(...turn(1,0)),down=dirOn(...turn(0,1)),left=dirOn(...turn(-1,0));
 ok(Math.abs(up+Math.PI/2)<1e-9&&Math.abs(right)<1e-9&&Math.abs(down-Math.PI/2)<1e-9&&Math.abs(Math.abs(left)-Math.PI)<1e-9,'with the voxel camera, W, D, S and A move up, right, down and left on screen');
 const area=(W/s)*(H/s)/Math.sin(ISO_ELEV);ok(Math.abs(area-vw*vh)/(vw*vh)<1e-9,'the voxel view shows the same ground area as the classic view');
 ok(mul(im,cx-30,cy-30,0)[2]>mul(im,cx+30,cy+30,0)[2]&&mul(im,cx,cy,40)[2]<mul(im,cx,cy,0)[2],'in the voxel view, things up the screen are farther and tall things are nearer');
 const span=isoSpan(W,H,s);let cover=true;for(const [px,py] of [[0,0],[W,0],[0,H],[W,H]]){const q=isoUnproject(px,py,cx,cy,W,H,s,0);if(Math.abs(q.x-cx)>span+1e-6||Math.abs(q.y-cy)>span+1e-6)cover=false}
 ok(cover&&isoInView(cx,cy,cx,cy,W,H,s)&&!isoInView(cx+span*2,cy,cx,cy,W,H,s),'the voxel ground layer covers every screen corner, and far things are culled')}

// Chibi art to voxels: a 4×4 square seen from the front (red) and side (green) becomes a 4×4×4 block, front red
{const w=8,h=8,img=(r,g,b)=>{const d=new Uint8ClampedArray(w*h*4);for(let y=2;y<6;y++)for(let x=2;x<6;x++){const i=(y*w+x)*4;d[i]=r;d[i+1]=g;d[i+2]=b;d[i+3]=255}return d};
 const v=hullVoxels({w,h,front:img(255,0,0),side:img(0,255,0),back:img(0,0,255),cx:4,sx:4,top:6,k:1}),n=v.list.length/4,cols=new Set();let front=0;
 for(let i=0;i<n;i++){const x=v.list[i*4],c=v.list[i*4+3];cols.add(c);if(x===1&&c===0xff0000)front++}
 ok(n===56,'the voxel builder keeps only the outside blocks of a solid shape ('+n+' of 64)');
 ok(front===16&&cols.has(0x0000ff)&&cols.has(0x00ff00),'front blocks take the front drawing, back and sides their own drawings')}

const map=new Uint8Array([0,1,1,0, 0,1,0,0, 0,0,0,1]);
const f=wallFaces(map,4,3);ok(f.tops===4&&f.fronts===3,'walls get a top on every tile and a south face only above open ground');

// Every stage has a complete, different look
ok(STAGE_THEMES.length===10&&STAGE_THEMES.every(t=>THEME_KEYS.every(k=>t[k]!==undefined)),'all 10 stages have a complete theme');
ok(new Set(STAGE_THEMES.map(t=>t.tree)).size===10,'each stage grows its own kind of tree');
ok(STAGE_THEMES.every(t=>TREE_KINDS.includes(t.tree)&&t.extras.every(([k])=>EXTRA_KINDS.includes(k))),'every tree and scenery kind a theme names exists');
const colours=STAGE_THEMES.flatMap(t=>[...t.canopy,...t.shrub,...t.grass,...t.flower,t.trunk,t.gnd,t.glow,t.ink,t.sun,t.sky,...Object.values(t.water)]);
ok(colours.every(h=>DAYRIM64.includes(h)),'theme colours are all DAYRIM-64 entries, so the palette keeps them exact');
ok(themeFor(1)===STAGE_THEMES[0]&&themeFor(10)===STAGE_THEMES[9]&&themeFor(99)===STAGE_THEMES[9],'stage numbers pick their theme');
{const MW=20,MH=20,N=MW*MH,map=new Uint8Array(N),ground=new Uint8Array(N);for(let i=0;i<N;i++){if(i%7===0)map[i]=1;if(i%MW>14)ground[i]=3}
 const st={map,ground,MW,MH,T:40},ex=scatterExtras(STAGE_THEMES[2],st,[{x:400,y:400,r:120}]);
 const tile=o=>(Math.floor(o.y/40))*MW+Math.floor(o.x/40);
 ok(ex.length>0&&ex.every(o=>!map[tile(o)]),'scattered scenery never lands on a wall');
 ok(ex.every(o=>Math.hypot(o.x-400,o.y-400)>120),'scattered scenery keeps the safehouse clear');
 ok(ex.filter(o=>o.t==='lily').every(o=>ground[tile(o)]===3),'lily pads only float on water');
 ok(JSON.stringify(ex)===JSON.stringify(scatterExtras(STAGE_THEMES[2],st,[{x:400,y:400,r:120}])),'scenery is placed the same way every time');
 for(const th of STAGE_THEMES){const g=buildVegetation({theme:th,props:[{t:'tree',x:100,y:100,v:0},{t:'shrub',x:140,y:100,v:1},{t:'grass',x:180,y:100,v:2}],extras:th.extras.map(([k],i)=>({t:k,x:60+i*30,y:200,v:i%3})),baseZ:()=>0,wind:{value:0}});
   if(g.children.length<3)throw new Error(th.n+' built too little');g.userData.dispose()}
 ok(true,'every stage kit builds its trees, shrubs, grass and scenery')}

// Weather
ok(STAGE_THEMES.every(t=>WEATHER[t.weather]),'every stage has a weather recipe');
ok(new Set(STAGE_THEMES.map(t=>t.weather)).size===10,'each stage has its own weather');
console.log('\n'+n+' checks passed');
