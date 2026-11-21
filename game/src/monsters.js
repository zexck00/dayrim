/* ---------- Chibi stage bosses (drawing only; the server never loads this file) ----------
   Each of the ten stage bosses is painted in code as full-chibi pixel art on a 112×112 grid: a big readable head
   with a detailed face, a small body, gore (blood, wounds, bone), a dark ink outline and three tones per colour.
   Frames are cached per boss, pose and step. Each boss also has its own animated aura, drawn in the world. */
const CB_N=112,CB_FOOT=108,CB_FRAMES=new Map(),CB={};
const CB_INK='#0d0b14',BLOOD=['#3a1418','#6e1219','#a8302a','#e8463f'],BONE=['#8a8678','#c8c4b0','#e8e4d0'];
/* A small pixel brush over one frame canvas. Ellipses are filled row by row so edges stay hard. */
function cbBrush(g){
  const R=(c,x,y,w,h)=>{if(w<=0||h<=0)return;g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
  const E=(c,cx,cy,rx,ry)=>{if(rx<=0||ry<=0)return;g.fillStyle=c;for(let y=-Math.ceil(ry);y<=Math.ceil(ry);y++){const k=1-(y/ry)**2;if(k<0)continue;const w=Math.round(rx*Math.sqrt(k));g.fillRect(Math.round(cx-w),Math.round(cy+y),w*2,1)}};
  const B=(cols,cx,cy,rx,ry)=>{E(cols[0],cx,cy,rx,ry);E(cols[1],cx-1,cy-1,rx-1.5,ry-1.5);E(cols[2],cx-rx*.32,cy-ry*.38,rx*.38,ry*.3)};
  const Pg=(c,pts)=>{g.fillStyle=c;g.beginPath();g.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)g.lineTo(pts[i],pts[i+1]);g.closePath();g.fill()};
  const L=(c,x0,y0,x1,y1,w=1)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))|0||1;for(let i=0;i<=n;i++){const q=i/n;R(c,x0+(x1-x0)*q-w/2+.5,y0+(y1-y0)*q-w/2+.5,w,w)}};
  /* eye: white, iris, slit or round pupil, a shine pixel; glow tints the white; red adds bloodshot veins */
  const Eye=(x,y,r,iris,{slit=false,glow=null,red=true}={})=>{E(CB_INK,x,y,r+1,r+1);E(glow||'#f8f4e4',x,y,r,r);if(red&&r>=4){L('#e8463f',x-r+1,y-1,x-r*.4,y);L('#e8463f',x+r-1,y+1,x+r*.5,y-1)}E(iris,x,y,r*.55,r*.55);if(slit)R(CB_INK,x-.5,y-r*.5,1.5,r);else E(CB_INK,x,y,r*.25,r*.25);R('#ffffff',x-r*.35,y-r*.45,1.5,1.5)};
  const Glow=(x,y,r,c)=>{E(CB_INK,x,y,r+1,r+.6);E(c,x,y,r,r*.7);R('#ffffff',x-1,y-1,2,1)};
  /* a row of teeth from y (down, or up from the jaw), with blood on some tips */
  const Teeth=(x,y,w,h,{up=false,blood=true}={})=>{for(let i=0;i<w;i+=3){const th=h*(.6+.4*((i*7)%5)/4);Pg(BONE[2],up?[x+i,y,x+i+3,y,x+i+1.5,y-th]:[x+i,y,x+i+3,y,x+i+1.5,y+th]);if(blood&&(i*5)%9<3)R(BLOOD[2],x+i+1,up?y-th:y+th-1,1,2)}};
  /* blood drips from a line; their length shifts with the frame so they seem to run */
  const Drips=(x,y,w,f,seed=1)=>{for(let i=0;i<w;i+=2){const k=((i*13+seed*7)%11);if(k>4)continue;const len=2+k+((f+i)%3);R(BLOOD[1],x+i,y,1,len);R(BLOOD[3],x+i,y,1,1);R(BLOOD[2],x+i,y+len,1,1)}};
  const Wound=(x,y,w,h)=>{E(BLOOD[0],x,y,w,h);E(BLOOD[2],x,y,w-1,h-1);R(BLOOD[3],x-w*.4,y-h*.4,1,1);R(BONE[1],x-1,y-.5,2,1)};
  const Ribs=(x,y,w,n)=>{E(BLOOD[0],x+w/2,y+n*2,w/2+2,n*2+2);E(BLOOD[1],x+w/2,y+n*2,w/2+1,n*2+1);for(let i=0;i<n;i++){R(BONE[2],x+1,y+1+i*4,w-2,1);R(BONE[0],x+1,y+2+i*4,w-2,1)}R(BONE[1],x+w/2-.5,y,1,n*4+1)};
  return{R,E,B,Pg,L,Eye,Glow,Teeth,Drips,Wound,Ribs,g};
}
/* Ink outline and hard alpha on a finished frame */
function cbFinish(c){const g=c.getContext('2d'),im=g.getImageData(0,0,CB_N,CB_N),d=im.data,src=new Uint8ClampedArray(d);
  for(let i=3;i<d.length;i+=4)d[i]=src[i]>110?255:0;
  for(let y=0;y<CB_N;y++)for(let x=0;x<CB_N;x++){const o=(y*CB_N+x)*4;if(d[o+3])continue;let edge=false;for(const [ax,ay] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+ax,ny=y+ay;if(nx<0||ny<0||nx>=CB_N||ny>=CB_N)continue;if(src[(ny*CB_N+nx)*4+3]>110){edge=true;break}}
    if(edge){d[o]=13;d[o+1]=11;d[o+2]=20;d[o+3]=255}}
  g.putImageData(im,0,0);return c}
/* pose: 'idle' (2 breathing steps), 'walk' (4 steps), 'atk' (wind-up), 'hit' */
function chibiFrame(art,pose,f){const k=art+'|'+pose+'|'+f;let c=CB_FRAMES.get(k);if(c)return c;
  c=document.createElement('canvas');c.width=c.height=CB_N;const P=cbBrush(c.getContext('2d'));try{CB[art](P,f,pose)}catch(e){console.warn('boss frame',art,e)}CB_FRAMES.set(k,cbFinish(c));return c}
const stepOf=(pose,f)=>pose==='walk'?[0,1,0,-1][f%4]:pose==='idle'?(f%2):0;

/* 1 · Crystal Scurrier: a violet crystal spider, all head, with four eyes and bloody fangs */
CB['Crystal Scurrier']=(P,f,pose)=>{const s=stepOf(pose,f),up=pose==='atk'?-4:0,V=['#2c2448','#6a4c9a','#c080ff'],D=['#1a1626','#3a2f5a','#6a4c9a'];
  for(let i=0;i<3;i++){const lx=24+i*8,ly=86,k=(i%2?s:-s);P.L(D[1],lx,ly,lx-14-i*2,ly+14+k*2,3);P.L(V[2],lx-14-i*2,ly+14+k*2,lx-16-i*2,ly+20+k*2,2);P.L(D[1],112-lx,ly,112-lx+14+i*2,ly+14-k*2,3);P.L(V[2],112-lx+14+i*2,ly+14-k*2,112-lx+16+i*2,ly+20-k*2,2)}
  P.B(D,56,84+s*.5,24,13);
  for(const [x,h,w] of [[38,30,7],[48,40,8],[58,46,9],[68,38,8],[78,28,7],[30,20,6],[86,18,6]]){P.Pg(V[0],[x-w,52+up,x+w,52+up,x+1,52-h+up]);P.Pg(V[1],[x-w+2,52+up,x+w-3,52+up,x,52-h+4+up]);P.L(V[2],x-1,50+up,x-1,54-h+up+6,1)}
  P.B(V,56,62+up+s*.5,30,22);P.L(BLOOD[1],40,54+up,47,66+up,1);P.L(BLOOD[1],70,52+up,64,62+up,1);
  P.Eye(46,58+up,6,'#c080ff',{slit:true,glow:'#ffd0e8'});P.Eye(66,58+up,6,'#c080ff',{slit:true,glow:'#ffd0e8'});P.Pg(D[0],[37,49+up,53,54+up,53,51+up,38,46+up]);P.Pg(D[0],[75,49+up,59,54+up,59,51+up,74,46+up]);P.Glow(38,50+up,2.5,'#ff70a0');P.Glow(74,50+up,2.5,'#ff70a0');
  P.E(BLOOD[0],56,76+up,13,6);P.E('#1a0810',56,76+up,11,4);P.Teeth(45,72+up,22,6);P.Teeth(46,80+up,20,4,{up:true});
  P.Pg(BONE[2],[42,72+up,46,72+up,40,86+up]);P.Pg(BONE[2],[70,72+up,66,72+up,72,86+up]);P.Drips(40,84+up,34,f,3)};

/* 2 · Gloom Eye: one huge bloodshot eye, a maw of teeth, small eyes and writhing tentacles */
CB['Gloom Eye']=(P,f,pose)=>{const s=stepOf(pose,f),W=['#1a1626','#3a2f5a','#6a4c9a'],t=f*.8;
  for(let i=0;i<5;i++){let x=28+i*14,y=86;for(let k=0;k<6;k++){const nx=x+Math.sin(t+i+k*.9)*3,ny=y+4;P.L(W[1],x,y,nx,ny,5-k*.6);x=nx;y=ny}P.R('#9a7ad8',x-1,y,2,2)}
  P.B(W,56,52+s,40,38);
  for(const [x,y] of [[22,34],[28,22],[40,14],[88,30],[92,46],[20,52]])P.Eye(x,y+s,3,'#c25a66',{red:false});
  P.Eye(60,42+s,17,'#6a4c9a',{glow:'#f8f0e8'});P.L('#e8463f',44,36+s,50,40+s);P.L('#e8463f',74,34+s,70,40+s);P.L('#e8463f',62,58+s,61,52+s);
  const open=pose==='atk'?6:pose==='hit'?2:3;P.E(BLOOD[0],56,72+s,26,8+open);P.E('#1a0810',56,73+s,24,6+open);P.Teeth(32,66+s,48,8);P.Teeth(34,80+s+open,44,6,{up:true});
  P.R(BLOOD[2],48,76+s,10,3);P.Drips(36,82+s+open,40,f,5);P.Wound(30,58+s,3,2)};

/* 3 · Banshee Phantasm: a screaming skull face in a pale shroud, hollow eyes weeping blood, clawed hands */
CB['Banshee Phantasm']=(P,f,pose)=>{const s=[0,-1,-2,-1][f%4],G2=['#2c4470','#6a6574','#a8dce4'],F=['#8a8678','#c8c4b0','#f8f4e4'];
  for(let i=0;i<7;i++){const x=30+i*8,len=18+((i*5)%7)+((f+i)%3)*2;P.Pg(G2[0],[x-5,76,x+5,76,x+1,76+len]);P.Pg(G2[1],[x-3,76,x+3,76,x,72+len])}
  P.B(G2,56,74+s,22,16);
  const raise=pose==='atk'?-10:0;for(const sx of [-1,1]){const hx=56+sx*26,hy=66+s+raise;P.L(G2[1],56+sx*16,72+s,hx,hy,4);for(let k=-1;k<=1;k++)P.L(F[1],hx+sx,hy,hx+sx*(4+k),hy-5+k*3,1);P.R(BLOOD[2],hx+sx*4,hy-6,1,1)}
  P.Pg(G2[0],[26,46+s,40,46+s,36,88+s,16,96+s]);P.Pg(G2[0],[72,46+s,86,46+s,96,96+s,76,88+s]);P.E(G2[0],56,40+s,33,34);P.E(G2[1],55,38+s,30,31);P.E(G2[2],46,22+s,10,5);
  P.B(F,56,42+s,24,26);P.E('#c8c4b0',56,58+s,16,8);
  P.E(CB_INK,45,38+s,7,9);P.E(CB_INK,67,38+s,7,9);P.Glow(45,40+s,1.5,'#a8dce4');P.Glow(67,40+s,1.5,'#a8dce4');
  P.R(BLOOD[1],44,46+s,1,10+(f%3));P.R(BLOOD[1],68,46+s,1,9+((f+1)%3));
  const m=pose==='atk'?16:12;P.E(CB_INK,56,58+s+m*.2,7,m*.7);P.E('#3a1418',56,60+s+m*.2,5,m*.5);P.Teeth(51,52+s,10,3);
  for(let i=0;i<6;i++)P.L(G2[2],34+i*9,20+s,30+i*9+((i%2)?-3:3),34+s,1)};

/* 4 · Chitin Horror: a grey armoured spider head with a cluster of red eyes and bloody mandibles */
CB['Chitin Horror']=(P,f,pose)=>{const s=stepOf(pose,f),A=['#2a2438','#4e4a5a','#8a8678'],up=pose==='atk'?-3:0;
  for(let i=0;i<4;i++){const k=(i%2?s:-s);for(const sx of [-1,1]){const x0=56+sx*(18+i*3),y0=78,x1=56+sx*(36+i*7),y1=60+i*6+k*2,x2=56+sx*(42+i*6),y2=96+k;P.L(A[1],x0,y0,x1,y1,4);P.L(A[1],x1,y1,x2,y2,3);P.R('#a8302a',x1-1,y1-1,3,3);P.L('#e8463f',x2,y2-3,x2,y2,1)}}
  P.B(A,56,82+s*.5,22,12);for(let i=0;i<3;i++)P.R(A[2],44+i*8,74,6,2);
  P.B(A,56,52+up,30,26);P.Pg(A[2],[30,40+up,40,20+up,46,34+up]);P.Pg(A[2],[82,40+up,72,20+up,66,34+up]);P.Pg('#a8302a',[40,22+up,44,14+up,46,26+up]);P.Pg('#a8302a',[72,22+up,68,14+up,66,26+up]);
  P.R(A[0],34,46+up,44,2);P.Wound(76,44+up,3,2);
  for(const [x,y,r] of [[48,50,5],[64,50,5],[42,42,3],[70,42,3],[56,40,3.5],[50,60,2.5],[62,60,2.5]])P.Glow(x,y+up,r,'#e8463f');
  P.Pg('#6a6574',[44,66+up,50,66+up,44,84+up]);P.Pg('#6a6574',[68,66+up,62,66+up,68,84+up]);P.Pg('#a8302a',[44,78+up,47,78+up,44,86+up]);P.Pg('#a8302a',[68,78+up,65,78+up,68,86+up]);
  P.E(BLOOD[0],56,72+up,8,4);P.Teeth(50,70+up,12,4);P.Drips(46,86+up,22,f,2)};

/* 5 · Spore Brute: a roaring dark ape crowned with glowing mushrooms, moss and rotting wounds */
CB['Spore Brute']=(P,f,pose)=>{const s=stepOf(pose,f),K=['#1a1626','#3a2f5a','#6a4c9a'],M=['#2a5f38','#3f9048','#90e040'],raise=pose==='atk'?-10:0;
  P.L(K[1],46,96,44+s*3,106,7);P.L(K[1],66,96,68-s*3,106,7);P.R(K[0],38+s*3,104,12,4);P.R(K[0],62-s*3,104,12,4);
  P.B(K,56,86,22,14);P.Ribs(48,78,16,3);
  for(const sx of [-1,1]){P.L(K[1],56+sx*20,72,56+sx*32,88+raise,9);P.B(K,56+sx*33,92+raise,8,7);P.R(M[1],56+sx*24,66,8,6)}
  P.B(M,40,60,12,8);P.B(M,72,60,12,8);P.B(K,56,48,30,26);
  P.E('#e8e4d0',56,36,18,7);P.E('#c8c4b0',56,38,16,5);
  P.Glow(46,42,3,'#f0a040');P.Glow(66,42,3,'#f0a040');P.Pg(CB_INK,[38,35,52,39,52,41,38,38]);P.Pg(CB_INK,[74,35,60,39,60,41,74,38]);
  const m=pose==='atk'?16:12;P.E(BLOOD[0],56,58,13,m*.6);P.E('#c25a66',56,59,11,m*.45);P.E('#1a0810',56,61,8,m*.35);P.Teeth(45,53,22,5);P.Teeth(46,64+m*.2,20,4,{up:true});P.Pg(BONE[2],[44,52,48,52,45,64]);P.Pg(BONE[2],[68,52,64,52,67,64]);
  P.Wound(78,70,3,2);P.R(M[2],77,73,2,3);P.Drips(46,66+m*.2,20,f,4);
  for(const [x,y,r,c] of [[38,24,10,'#c88a30'],[60,16,12,'#f0a040'],[80,26,8,'#c88a30'],[48,14,6,'#a8682a']]){P.R('#e8e4d0',x-2,y,4,10);P.E('#7a4a34',x,y+1,r,r*.5);P.E(c,x,y,r,r*.45);for(let i=-1;i<=1;i++)P.R('#fff6c0',x+i*r*.45,y-r*.15,2,2)}};

/* 6 · Flesh Amalgam: a lump of flesh with a screaming face, a gaping belly maw and dripping slime */
CB['Flesh Amalgam']=(P,f,pose)=>{const s=stepOf(pose,f),F=['#6e1219','#c25a66','#f08ab0'],S=['#3f9048','#90e040','#a8d060'],pul=f%2,arm=pose==='atk'?-8:0;
  P.L(F[0],46,94,42+s*3,106,7);P.L(F[0],66,94,70-s*3,106,7);P.R(F[0],36+s*3,104,12,4);P.R(F[0],64-s*3,104,12,4);
  for(const sx of [-1,1]){P.L(F[1],56+sx*20,72,56+sx*34,86+arm,7);P.E(F[0],56+sx*35,88+arm,6,5)}
  P.B(F,56,84,24,16);P.E(BLOOD[0],56,86,12,8+pul);P.E('#1a0810',56,87,10,6+pul);P.Teeth(47,80,18,5);P.Teeth(47,93+pul,18,4,{up:true});P.Drips(46,95+pul,20,f,6);
  P.B(F,56,46,34,30);P.B(F,84,22,13,12);P.B(F,26,62,8,7);P.B(F,40,18,6,5);P.Eye(86,20,4,'#90e040',{red:false});P.Glow(26,62,2.5,'#90e040');P.Teeth(80,28,10,3);P.R(BONE[2],42,14,2,6);P.R(BONE[2],46,13,2,5);
  P.Eye(46,44,6,'#c25a66',{glow:'#f2e0c8'});P.Eye(66,40,7,'#c25a66',{glow:'#f2e0c8'});P.Eye(58,30,3,'#90e040',{red:false});
  P.E(BLOOD[0],56,62,10,6+(pose==='atk'?3:0));P.E('#1a0810',56,63,8,4+(pose==='atk'?3:0));P.Teeth(48,58,16,4);
  P.L('#3a1418',34,52,44,56,1);P.L('#3a1418',72,56,80,50,1);for(let i=0;i<4;i++){P.R('#3a1418',36+i*3,53+(i%2),1,2);P.R('#3a1418',73+i*2,51+(i%2),1,2)}
  P.Ribs(70,62,12,2);P.Wound(32,64,3,2);
  for(const [x,y] of [[40,22],[76,32],[30,70],[84,74],[60,100]]){P.E(S[1],x,y,2.5,2);P.R(S[0],x,y+2,1,4+((f+x)%3))}};

/* 7 · Rusted Ghoul: a rust-eaten knight with a blazing visor, spiked pauldrons and a bloodied greatsword */
CB['Rusted Ghoul']=(P,f,pose)=>{const s=stepOf(pose,f),A=['#2a211a','#7a4a34','#a8682a'],D=['#3a1418','#6e1219','#a8302a'],sw=pose==='atk'?-28:0;
  P.L(A[1],48,92,46+s*3,106,7);P.L(A[1],64,92,66-s*3,106,7);P.R(A[0],40+s*3,104,12,4);P.R(A[0],60-s*3,104,12,4);
  P.Pg(D[1],[44,74,68,74,70,98,42,98]);P.Pg(D[2],[47,74,65,74,66,94,46,94]);P.B(A,56,78,16,10);
  for(const sx of [-1,1]){P.B(A,56+sx*20,62,10,8);P.Pg(A[2],[56+sx*22,56,56+sx*28,44,56+sx*26,58])}
  P.L(A[1],78,68,86,82,5);
  {const g=P.g;g.save();g.translate(86,82);g.rotate((sw-35)*Math.PI/180);P.R('#5c4c3c',-2,-2,4,10);P.R('#c88a30',-6,-4,12,3);P.Pg('#8a8678',[-3,-4,3,-4,2,-42,0,-46,-2,-42]);P.Pg('#c8c4b0',[0,-4,3,-4,2,-42,0,-46]);P.R(BLOOD[2],-2,-30,4,8);P.R(BLOOD[1],1,-24,2,6);g.restore()}
  P.B(A,56,42,26,24);P.R(A[0],32,34,48,4);P.R('#7a5a38',30,30,52,3);
  const fl=f%3;P.Pg('#ff6a5f',[44,22,50,4-fl*2,56,18,62,2+fl,68,22]);P.Pg('#f0a040',[48,22,53,10-fl,58,20,63,12,66,22]);P.Pg('#fff6c0',[52,22,56,14,60,22]);
  P.R(CB_INK,38,40,36,6);P.R(CB_INK,53,40,6,18);P.R('#f0a040',40,41,32,4);P.R('#fff6c0',44,42,24,2);P.R('#f0a040',54,44,4,12);P.R('#fff6c0',55,46,2,8);
  P.Drips(36,48,10,f,7);P.Drips(66,50,10,f,8);P.Wound(40,80,3,2)};

/* 8 · Cyber Dread: a crouching war-machine skull with red eyes, cables, torn flesh and bloody claws */
CB['Cyber Dread']=(P,f,pose)=>{const s=stepOf(pose,f),M=['#1a1626','#4e4a5a','#8a8678'],up=pose==='atk'?-6:0;
  P.L(M[1],48,90,40+s*3,106,6);P.L(M[1],64,90,72-s*3,106,6);P.R(M[0],34+s*3,104,12,4);P.R(M[0],66-s*3,104,12,4);
  P.B(M,56,80,22,13);P.Ribs(50,74,12,3);P.L('#a8302a',36,72,24,58,2);P.L('#a8302a',76,72,88,60,2);
  for(const sx of [-1,1]){const x1=56+sx*30,y1=78+up;P.L(M[1],56+sx*18,70,x1,y1,6);P.R('#c25a66',56+sx*24-2,73,4,3);
    for(let k=0;k<3;k++){P.Pg('#8a8678',[x1,y1,x1+sx*(6+k*2),y1+4+k*3,x1+sx*(2+k),y1+12+k*2]);P.R(BLOOD[2],x1+sx*(3+k),y1+10+k*2,2,2)}}
  P.B(M,56,46+up,28,26);P.R(M[0],30,38+up,52,3);P.R(M[2],34,30+up,12,3);
  P.E(CB_INK,44,46+up,8,6);P.E(CB_INK,68,46+up,8,6);P.Glow(44,46+up,4.5,'#e8463f');P.Glow(68,46+up,4.5,'#e8463f');P.R('#ff6a5f',36,45+up,6,1);P.R('#ff6a5f',70,45+up,6,1);
  P.R(CB_INK,42,60+up,28,10);for(let i=0;i<6;i++)P.R(M[2],44+i*4.5,61+up,2,8);P.R(BLOOD[2],46,68+up,8,2);P.Drips(44,70+up,24,f,9);
  P.L('#a8302a',30,30+up,22,10,2);P.L('#e8463f',22,10,18,4,1);P.Wound(76,34+up,3,2)};

/* 9 · Void Weaver: a pale violet alien with vast black eyes, a forehead gem, four long hands and a starry robe */
CB['Void Weaver']=(P,f,pose)=>{const s=[0,-1,-2,-1][f%4],R2=['#1a1626','#2c2448','#4c3a70'],S=['#4c3a70','#9a7ad8','#c8b8ff'];
  P.Pg(R2[0],[30,58+s,82,58+s,92,104,20,104]);P.Pg(R2[1],[34,58+s,78,58+s,86,100,26,100]);for(let i=0;i<9;i++)P.R(i%3?'#c080ff':'#f8f4e4',30+((i*17)%50),66+((i*23)%30)+s,1,1);
  for(let i=0;i<5;i++)P.Pg(R2[1],[24+i*14,98,34+i*14,98,28+i*14,106+((f+i)%3)]);
  const lift=pose==='atk'?-8:0;for(const [sx,y] of [[-1,64],[1,64],[-1,76],[1,76]]){const hx=56+sx*34,hy=y+s+lift*(y<70?1:.5);P.L(S[0],56+sx*16,y-4+s,hx,hy,3);for(let k=-1;k<=1;k++)P.L(S[1],hx,hy,hx+sx*4,hy-4+k*3,1)}
  P.Pg(R2[2],[28,30+s,40,58+s,72,58+s,84,30+s,76,56+s,36,56+s]);
  P.B(S,56,36+s,24,26);P.Pg(S[0],[44,58+s,68,58+s,60,66+s,52,66+s]);
  P.Pg(CB_INK,[36,36+s,52,40+s,50,48+s,38,44+s]);P.Pg(CB_INK,[76,36+s,60,40+s,62,48+s,74,44+s]);P.R('#c080ff',41,40+s,3,2);P.R('#c080ff',68,40+s,3,2);
  P.R(BLOOD[1],44,47+s,1,8+(f%3));P.R(BLOOD[1],68,47+s,1,7+((f+1)%3));
  P.Glow(56,24+s,3.5,'#c080ff');P.R('#f8f4e4',55,22+s,2,1);P.L(CB_INK,56,52+s,56,55+s,1);P.R(CB_INK,51,56+s,10,1);
  P.L('#3a1418',64,26+s,72,40+s,1);P.L('#6a4c9a',66,30+s,70,36+s,1)};

/* 10 · Nameless King: a crowned void with three burning eyes and eyes all over a starfield robe, bleeding light */
CB['Nameless King']=(P,f,pose)=>{const s=[0,-1,-1,0][f%4],K=['#0d0b14','#1a1626','#3a2f5a'],up=pose==='atk'?-4:0;
  P.Pg(K[0],[16,52+s,96,52+s,108,106,4,106]);P.Pg(K[1],[22,52+s,90,52+s,100,102,12,102]);for(let i=0;i<14;i++)P.R(i%4?'#9a7ad8':'#f8f4e4',18+((i*29)%74),58+((i*17)%40),1,1);
  for(let i=0;i<7;i++)P.Pg(K[1],[10+i*15,100,20+i*15,100,14+i*15,108+((f+i)%3)]);
  for(const [x,y,r] of [[34,72,3],[78,70,3.5],[46,88,2.5],[66,90,3],[56,76,3],[26,90,2],[88,88,2.5]]){P.Glow(x,y+s,r,'#e8463f');P.R(BLOOD[1],x,y+s+r,1,3+((f+x)%3))}
  for(const sx of [-1,1]){P.L(K[2],56+sx*22,60+s,56+sx*38,72+s+up*2,5);for(let k=-1;k<=1;k++)P.L('#4c3a70',56+sx*38,72+s+up*2,56+sx*(42+k),80+s+up*2,1)}
  P.Pg(K[2],[26,24+s+up,86,24+s+up,92,62+s,20,62+s]);P.B(K,56,40+s+up,26,24);P.E(K[0],56,42+s+up,20,18);
  for(const [x,y,r] of [[46,40,4.5],[66,40,4.5],[56,30,3.5]]){P.Glow(x,y+s+up,r,'#ff6a5f');P.R(BLOOD[2],x-.5,y+s+up+r,1,6+((f+x)%3))}
  P.E('#3a1418',56,54+s+up,8,3);P.Teeth(50,52+s+up,12,3);
  for(let i=0;i<5;i++){const x=34+i*11,h=i===2?20:i%2?12:16;P.Pg('#8a8678',[x-4,20+s+up,x+4,20+s+up,x,20-h+s+up]);P.Pg('#c8c4b0',[x-2,20+s+up,x+2,20+s+up,x,22-h+s+up])}
  P.R('#8a8678',30,18+s+up,52,4);P.R('#c8c4b0',30,18+s+up,52,1);P.Glow(56,19+s+up,2,'#c080ff')};

/* ---------- Auras: each boss's own animated glow, behind (front=false) and in front ---------- */
const AURA={
  'Crystal Scurrier':{c:'192,128,255',draw:(c,e,t,h,front)=>{for(let i=0;i<7;i++){const a=t*1.6+i/7*TAU,x=Math.cos(a)*h*.55,y=-h*.4+Math.sin(a)*h*.18;if((Math.sin(a)>0)!==front)continue;c.fillStyle=i%2?'#c080ff':'#ff70a0';c.beginPath();c.moveTo(x,y-7);c.lineTo(x+3,y);c.lineTo(x,y+7);c.lineTo(x-3,y);c.closePath();c.fill()}}},
  'Gloom Eye':{c:'106,76,154',draw:(c,e,t,h,front)=>{if(front){for(let i=0;i<4;i++){const a=t*.7+i*1.6,x=Math.cos(a)*h*.6,y=-h*.5+Math.sin(a*1.3)*h*.3,bl=Math.sin(t*3+i)>.85;c.fillStyle='#f8f4e4';c.fillRect(x-3,y-(bl?.5:3),6,bl?1:6);if(!bl){c.fillStyle='#c25a66';c.fillRect(x-1,y-1,2,2)}}}else for(let k=0;k<3;k++){const q=(t*.4+k/3)%1;c.strokeStyle='rgba(58,47,90,'+(.7*(1-q)).toFixed(2)+')';c.lineWidth=6;c.beginPath();c.ellipse(0,-h*.45,h*(.4+q*.5),h*(.3+q*.35),0,0,TAU);c.stroke()}}},
  'Banshee Phantasm':{c:'168,220,228',draw:(c,e,t,h,front)=>{for(let i=0;i<8;i++){const q=(t*.5+i/8)%1,x=Math.sin(i*2.1+t)*h*.45,y=-q*h*1.1;if((i%2===0)!==front)continue;c.fillStyle='rgba(200,240,255,'+(.5*(1-q)).toFixed(2)+')';c.fillRect(x-2,y-6,4,12)}if(!front){const q=(t*.9)%1;c.strokeStyle='rgba(168,220,228,'+(.5*(1-q)).toFixed(2)+')';c.lineWidth=2;c.beginPath();c.ellipse(0,-h*.6,h*.3+q*h*.5,h*.2+q*h*.3,0,0,TAU);c.stroke()}}},
  'Chitin Horror':{c:'232,70,63',draw:(c,e,t,h,front)=>{if(!front){c.fillStyle='rgba(10,6,10,.45)';for(let i=0;i<8;i++){const a=i/8*TAU+Math.sin(t*4+i)*.15;c.fillRect(Math.cos(a)*h*.5-2,Math.sin(a)*h*.18-2,Math.cos(a)*h*.25,3)}}else for(let i=0;i<6;i++){const q=(t*.7+i/6)%1;c.fillStyle='rgba(255,106,95,'+(1-q).toFixed(2)+')';c.fillRect(Math.sin(i*2.3+t*2)*h*.5,-q*h*.9,2,2)}}},
  'Spore Brute':{c:'144,224,64',draw:(c,e,t,h,front)=>{for(let i=0;i<10;i++){const q=(t*.35+i/10)%1,x=Math.sin(i*1.7+t*.6)*h*(.4+q*.3),y=-h*.2-q*h*.9,r=3+q*7;if((i%2===0)!==front)continue;c.fillStyle='rgba(144,224,64,'+(.35*(1-q)).toFixed(2)+')';c.beginPath();c.arc(x,y,r,0,TAU);c.fill()}}},
  'Flesh Amalgam':{c:'168,48,42',draw:(c,e,t,h,front)=>{if(!front){const p=.5+.5*Math.sin(t*5);c.fillStyle='rgba(110,18,25,'+(.25+.15*p).toFixed(2)+')';c.beginPath();c.ellipse(0,-h*.4,h*.62,h*.55,0,0,TAU);c.fill();c.strokeStyle='rgba(232,70,63,'+(.35+.3*p).toFixed(2)+')';c.lineWidth=2;for(let i=0;i<6;i++){const a=i/6*TAU;c.beginPath();c.moveTo(Math.cos(a)*h*.3,-h*.4+Math.sin(a)*h*.3);c.quadraticCurveTo(Math.cos(a+.4)*h*.5,-h*.4+Math.sin(a+.4)*h*.45,Math.cos(a+.2)*h*.62,-h*.4+Math.sin(a+.2)*h*.55);c.stroke()}}else for(let i=0;i<5;i++){const q=(t*.8+i/5)%1;c.fillStyle='rgba(168,48,42,'+(1-q).toFixed(2)+')';c.fillRect(Math.sin(i*3+t)*h*.4,-h*.2+q*h*.25,2,3)}}},
  'Rusted Ghoul':{c:'240,160,64',draw:(c,e,t,h,front)=>{for(let i=0;i<9;i++){const q=(t*.9+i/9)%1,x=Math.sin(i*2.7+t*3)*h*.35,y=-h*.3-q*h*.9;if((i%2===0)!==front)continue;c.fillStyle=i%3?'rgba(240,160,64,'+(1-q).toFixed(2)+')':'rgba(255,106,95,'+(1-q).toFixed(2)+')';c.fillRect(x,y,2,2)}if(!front){c.fillStyle='rgba(168,104,42,.18)';c.beginPath();c.ellipse(0,0,h*.5,h*.16,0,0,TAU);c.fill()}}},
  'Cyber Dread':{c:'232,70,63',draw:(c,e,t,h,front)=>{if((Math.sin(t*9)>.2)===front)return;for(let k=0;k<3;k++){const a=t*4+k*2.1,r=h*.55;let x=Math.cos(a)*r,y=-h*.45+Math.sin(a)*r*.6;c.strokeStyle=k%2?'rgba(112,224,192,.85)':'rgba(255,106,95,.85)';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y);for(let s=0;s<4;s++){x+=(-x)*.25+Math.sin(t*20+s+k)*6;y+=(-h*.45-y)*.25+Math.cos(t*17+s)*6;c.lineTo(x,y)}c.stroke()}}},
  'Void Weaver':{c:'192,128,255',draw:(c,e,t,h,front)=>{if(!front){for(let k=0;k<5;k++){const a=t*.6+k/5*TAU;c.strokeStyle='rgba(106,76,154,.55)';c.lineWidth=4;c.beginPath();c.moveTo(0,-h*.35);c.quadraticCurveTo(Math.cos(a)*h*.6,-h*.35+Math.sin(a)*h*.5,Math.cos(a+1)*h*.7,-h*.35+Math.sin(a+1)*h*.55);c.stroke()}}else for(let i=0;i<8;i++){const a=t*1.2+i/8*TAU;c.fillStyle=i%2?'#c080ff':'#f8f4e4';c.fillRect(Math.cos(a)*h*.6,-h*.45+Math.sin(a)*h*.4,1.5,1.5)}}},
  'Nameless King':{c:'232,70,63',draw:(c,e,t,h,front)=>{if(!front){const g=c.createRadialGradient(0,-h*.45,h*.1,0,-h*.45,h*.8);g.addColorStop(0,'rgba(0,0,0,.6)');g.addColorStop(.7,'rgba(58,20,24,.35)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.arc(0,-h*.45,h*.8,0,TAU);c.fill();
    for(let i=0;i<12;i++){const a=i/12*TAU,fl=Math.sin(t*6+i*1.7)*.5+.5,r=h*.62;c.fillStyle='rgba(232,70,63,'+(.35+.4*fl).toFixed(2)+')';c.beginPath();c.moveTo(Math.cos(a-.12)*r,-h*.45+Math.sin(a-.12)*r*.85);c.lineTo(Math.cos(a)*(r+10+fl*12),-h*.45+Math.sin(a)*(r+10+fl*12)*.85);c.lineTo(Math.cos(a+.12)*r,-h*.45+Math.sin(a+.12)*r*.85);c.fill()}}
    else for(let i=0;i<5;i++){const a=t*.5+i*1.3,x=Math.cos(a)*h*.75,y=-h*.5+Math.sin(a*1.4)*h*.4;if(Math.sin(t*2+i)>.3){c.fillStyle='#ff6a5f';c.fillRect(x-2,y-1,4,2)}}}}
};
/* Behind or in front of the boss, around its feet (the front layer adds light) */
function drawBossAura(c,e,front){const a=AURA[e.art];if(!a||(reduced&&front))return;const t=G.t+(e.ph||0),h=e.ah||100;c.save();c.translate(e.x,e.y);if(front)c.globalCompositeOperation='lighter';try{a.draw(c,e,t,h,front)}finally{c.restore()}}
/* Which frame to show for a boss pose */
function chibiPose(e,P,t){if(e.flash>0||P.recoil>0)return['hit',0];if(P.arm>0||e.wind>0)return['atk',0];if(P.walk)return['walk',Math.floor((e.walk||0)*.5)%4];return['idle',Math.floor(t*2.2)%2]}
/* For checking the art: DAYRIM_GFX.bossSheet() shows every boss with its aura in each pose (debug view only) */
function bossSheet(){const arts=Object.keys(CB),poses=[['idle',0],['walk',1],['atk',0],['hit',0]],C=200,c=document.createElement('canvas');c.width=poses.length*C;c.height=arts.length*C;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#2a2a24';g.fillRect(0,0,c.width,c.height);
  arts.forEach((a,r)=>poses.forEach(([p,f],i)=>{const e={art:a,x:i*C+C/2,y:r*C+C*.86,ah:120,ph:i};drawBossAura(g,e,false);const k=e.ah/CHIBI_SCALE;g.imageSmoothingEnabled=false;g.drawImage(chibiFrame(a,p,f),e.x-CB_N/2*k,e.y-CB_FOOT*k,CB_N*k,CB_N*k);drawBossAura(g,e,true)}));return c}
/* ---------- The final attack scene: the boss's portrait slashes across a darkened screen, then a flash ---------- */
function drawBossUlt(f){const a=AURA[f.art],col=a?a.c:'255,90,80',q=1-f.t/f.m,inn=clamp(q/.14,0,1),out=clamp((q-.78)/.22,0,1),fade=1-out;
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.save();
  ctx.fillStyle='rgba(6,2,10,'+(.72*inn*fade).toFixed(3)+')';ctx.fillRect(0,0,W,H);
  const cx=W/2,cy=H/2,R=Math.hypot(W,H)*.6,v=ctx.createRadialGradient(cx,cy,R*.3,cx,cy,R);v.addColorStop(0,'rgba('+col+',0)');v.addColorStop(1,'rgba('+col+','+(.5*fade).toFixed(2)+')');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
  if(!reduced){ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba('+col+','+(.45*fade).toFixed(2)+')';ctx.lineWidth=2;for(let i=0;i<28;i++){const an=i/28*TAU+q*.6,r0=R*(.25+((i*7)%5)*.05);ctx.beginPath();ctx.moveTo(cx+Math.cos(an)*r0,cy+Math.sin(an)*r0);ctx.lineTo(cx+Math.cos(an)*R,cy+Math.sin(an)*R);ctx.stroke()}ctx.globalCompositeOperation='source-over'}
  const ease=1-Math.pow(1-inn,3),sl=(ease-1)*W*1.2+out*W*1.2,bh=Math.min(H*.5,240,W*.42),by=cy-bh/2;
  ctx.translate(sl,0);ctx.beginPath();ctx.moveTo(-40,by+36);ctx.lineTo(W+40,by-36);ctx.lineTo(W+40,by+bh-36);ctx.lineTo(-40,by+bh+36);ctx.closePath();
  const g=ctx.createLinearGradient(0,0,W,0);g.addColorStop(0,'rgba('+col+',.95)');g.addColorStop(.5,'rgba(24,8,12,.97)');g.addColorStop(1,'rgba(8,2,6,.97)');ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#c9a26a';ctx.lineWidth=3;ctx.stroke();
  // the portrait breaks out of the banner, head and all
  const im=chibiFrame(f.art,'atk',0),ph=Math.min(bh*1.45,H*.62),pw=ph,shake=reduced?0:Math.sin(q*90)*3;ctx.imageSmoothingEnabled=false;ctx.drawImage(im,W*.03+shake,cy-ph*.6,pw,ph);
  const tx=W*.04+pw*.9,maxW=W-tx-24,sz=Math.min(58,Math.max(22,maxW/Math.max(8,f.move.length)*1.5));ctx.textAlign='left';
  ctx.font='900 '+Math.round(sz*.38)+'px "Cinzel",serif';ctx.fillStyle='#ff8f80';ctx.fillText('FINAL ATTACK',tx,cy-sz*.75,maxW);
  ctx.font='900 '+Math.round(sz)+'px "Cinzel",serif';ctx.lineWidth=6;ctx.strokeStyle='rgba(12,4,4,.9)';ctx.strokeText(f.move,tx,cy+sz*.2,maxW);const tg=ctx.createLinearGradient(0,cy-sz*.6,0,cy+sz*.3);tg.addColorStop(0,'#fff6e2');tg.addColorStop(1,'#d8bf96');ctx.fillStyle=tg;ctx.fillText(f.move,tx,cy+sz*.2,maxW);
  ctx.font='700 '+Math.round(sz*.36)+'px "Alegreya",serif';ctx.fillStyle='#e0b878';ctx.fillText(f.name,tx,cy+sz*.75,maxW);ctx.restore();
  if(q>.74&&q<.9){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='rgba(255,'+(reduced?200:240)+',220,'+((reduced?.25:.8)*(1-(q-.74)/.16)).toFixed(2)+')';ctx.fillRect(0,0,W,H)}}
