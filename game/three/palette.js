/* DAYRIM-64: the one palette every 3D frame is reduced to.
   Built from the 2D biome colours plus skin, metal, magic and UI tones, so the classic look carries over.
   No Three.js import: the maths here also runs in the Node tests. */
export const DAYRIM64=[
  // ink and night
  '#0d0b14','#1a1626','#2a2438','#3b3350',
  // stone and bone
  '#4e4a5a','#6a6574','#8a8678','#a89a7c','#c8c4b0','#e8e4d0','#f8f4e4',
  // greens, dark to light
  '#1f3e2a','#2a5f38','#2f7a3f','#3f9048','#5a9a48','#4f8a3f','#a8d060','#3e6a48',
  // teals
  '#20504c','#2f6a60','#3a8a7a','#70c0a8',
  // blues and water
  '#1c2a4a','#2c4470','#3d7486','#4a879a','#6aa8c8','#a8dce4',
  // purples and void
  '#2c2448','#3a2f5a','#4c3a70','#6a4c9a','#9a7ad8','#c080ff','#443f54',
  // reds
  '#3a1418','#6e1219','#a8302a','#e8463f','#ff6a5f',
  // wood, earth and autumn
  '#2a211a','#4a3524','#5c4c3c','#7a5a38','#8a6840','#a8682a','#c88a30','#f0a040','#8a7650','#9c8e70','#7a7038',
  // gold and light
  '#e8c95c','#f0e070','#fff6c0',
  // skin
  '#f2c9a0','#d9a07a','#b07a58','#7a4a34',
  // flowers and magic glow
  '#f08ab0','#ff70a0','#c25a66','#90e040','#70e0c0'
];

export const hexToRgb=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const lin=c=>{c/=255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4)};
/* OKLab: distances match how different two colours look, so nearest-colour picks feel right */
export function oklab(r,g,b){
  const R=lin(r),G=lin(g),B=lin(b);
  const l=Math.cbrt(.4122214708*R+.5363325363*G+.0514459929*B),m=Math.cbrt(.2119034982*R+.6806995451*G+.1073969566*B),s=Math.cbrt(.0883024619*R+.2817188376*G+.6299787005*B);
  return[.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s];
}
const PAL_LAB=DAYRIM64.map(h=>oklab(...hexToRgb(h)));
/* Index of the palette colour closest to an RGB colour. `weights` (optional, one per entry) favours a
   stage's own colours: a weight above 1 shrinks that entry's distance. */
export function nearest(rgb,weights){
  const q=oklab(rgb[0],rgb[1],rgb[2]);let best=0,bd=1e9;
  for(let i=0;i<PAL_LAB.length;i++){const p=PAL_LAB[i],d=((q[0]-p[0])**2+(q[1]-p[1])**2+(q[2]-p[2])**2)/((weights&&weights[i])||1);if(d<bd){bd=d;best=i}}
  return best;
}
/* LUT_N³ colour cube laid out as LUT_N slices side by side: (LUT_N*LUT_N) wide × LUT_N tall, RGBA.
   Slice = blue, x inside a slice = red, row = green. The post shader looks pixels up here. */
export const LUT_N=32;
export function buildLut(weights){
  const N=LUT_N,data=new Uint8Array(N*N*N*4),rgb=DAYRIM64.map(hexToRgb);
  for(let g=0;g<N;g++)for(let b=0;b<N;b++)for(let r=0;r<N;r++){
    const c=rgb[nearest([r*255/(N-1),g*255/(N-1),b*255/(N-1)],weights)],o=(g*N*N+b*N+r)*4;
    data[o]=c[0];data[o+1]=c[1];data[o+2]=c[2];data[o+3]=255;
  }
  return data;
}
/* Read a colour back through the LUT the way the shader does (used by the tests) */
export function lutLookup(data,rgb){const N=LUT_N,i=v=>Math.round(v/255*(N-1)),o=(i(rgb[1])*N*N+i(rgb[2])*N+i(rgb[0]))*4;return[data[o],data[o+1],data[o+2]]}
