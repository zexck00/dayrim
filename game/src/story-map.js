/* Story mode maps. Each chapter has one hand-laid map on the same grid as the stage maps:
   a town with streets and houses, wild country around it, and the boss ground at the far end.
   Ground kinds added for story: 5 cobbled street, 6 forest floor, 7 tilled soil. Houses and other
   solid things mark their tiles in `bld`, so the tile is drawn as floor and the prop is drawn over it. */
const STORY_BIOMES=[
 {g:['#6f9a45','#7daa4e','#638c3d'],d:'#a88a5c',w:['#5a5346','#6e6656','#2e2a22'],leaf:['#3f8a3a','#58a244','#2f7332'],wa:['#3d7486','#4a879a','#a8dce4'],flower:['#f0e070','#f08ab0','#fff4e0'],stone:['#8d8a84','#7f7c76','#5f5c57']},
 {g:['#3f7a35','#4a8a3e','#356b2d'],d:'#7a6642',w:['#3a3a2c','#4a4a38','#1e2018'],leaf:['#1f5c2c','#2c7036','#174a24'],wa:['#2f6f7e','#3f8392','#a4d8dc'],flower:['#f8d048','#ff8a50','#e0f0b0'],stone:['#7c7a66','#6e6c5a','#4e4c40']},
 {g:['#3a6650','#44745a','#315846'],d:'#5a5644',w:['#2a3438','#38454a','#161e22'],leaf:['#2a5a50','#387464','#1e463e'],wa:['#27506a','#31607c','#8ab8d8'],flower:['#a0e0d0','#d0a0e8','#e8e8a0'],stone:['#6f7880','#626b73','#454c53']}];
/* Runs fn with a repeatable random stream, so a chapter's map is the same every time it is entered. */
function storySeeded(seed,fn){const real=Math.random;let a=seed|0;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};try{return fn()}finally{Math.random=real}}
const tilePx=(x,y)=>({x:(x+.5)*T,y:(y+.5)*T});

function storyMap(ci){return storySeeded(7919+ci*131,()=>{
  const N=MW*MH,map=new Uint8Array(N).fill(1),ground=new Uint8Array(N),deco=new Uint8Array(N),bld=new Uint8Array(N),thicket=new Uint8Array(N),cover=[],props=[],lamps=[],biome=STORY_BIOMES[ci];
  for(let i=0;i<N;i++)deco[i]=Math.random()*255;
  const ok=(x,y)=>x>1&&y>1&&x<MW-2&&y<MH-2;
  const m={
    /* open one tile; a street or path laid over water becomes a bridge */
    cut(x,y,g=0){x=Math.round(x);y=Math.round(y);if(!ok(x,y))return;const i=idx(x,y);if(bld[i])return;map[i]=0;ground[i]=(g===1||g===5)&&(ground[i]===3||ground[i]===4)?4:g},
    blob(cx,cy,rx,ry,g=0){for(let y=cy-ry-1;y<=cy+ry+1;y++)for(let x=cx-rx-1;x<=cx+rx+1;x++)if(((x-cx)/rx)**2+((y-cy)/ry)**2+rnd(-.1,.1)<1)m.cut(x,y,g)},
    rect(x,y,w,h,g=0){for(let b=0;b<h;b++)for(let a=0;a<w;a++)m.cut(x+a,y+b,g)},
    wet(cx,cy,rx,ry){m.blob(cx,cy,rx,ry,3)},
    road(pts,wd,g){for(let k=1;k<pts.length;k++){const [ax,ay]=pts[k-1],[bx,by]=pts[k],n=Math.ceil(Math.hypot(bx-ax,by-ay)*2);for(let s=0;s<=n;s++){const x=ax+(bx-ax)*s/n,y=ay+(by-ay)*s/n;for(let b=0;b<wd;b++)for(let a=0;a<wd;a++)m.cut(x-(wd-1)/2+a,y-(wd-1)/2+b,g)}}},
    solid(x,y,w,h){for(let b=0;b<h;b++)for(let a=0;a<w;a++)if(ok(x+a,y+b)){const i=idx(x+a,y+b);map[i]=1;bld[i]=1;ground[i]=0}},
    house(x,y,w,h,v){m.solid(x,y,w,h);props.push({t:'house',x:(x+w/2)*T,y:(y+h)*T-2,w,h,v})},
    put(t,x,y,v=0,extra){const o=Object.assign({t,x:(x+.5)*T,y:(y+.5)*T,v},extra);props.push(o);return o},
    block(t,x,y,v=0,extra){m.solid(Math.round(x),Math.round(y),1,1);return m.put(t,Math.round(x),Math.round(y)+.45,v,extra)},
    lamp(x,y){const l=m.put('lamp',x,y);lamps.push(l)},
    /* drop n of a prop on free tiles of a kind of ground inside a box */
    scatter(t,x,y,w,h,n,on=0,vs=3){for(let k=0,tries=0;k<n&&tries<n*12;tries++){const tx=irnd(x,x+w-1),ty=irnd(y,y+h-1);if(!ok(tx,ty))continue;const i=idx(tx,ty);if(map[i]||ground[i]!==on)continue;props.push({t,x:(tx+rnd(.15,.85))*T,y:(ty+rnd(.15,.85))*T,v:irnd(0,vs-1)});k++}},
    thick(cx,cy,rx,ry){for(let y=cy-ry;y<=cy+ry;y++)for(let x=cx-rx;x<=cx+rx;x++){if(!ok(x,y))continue;const i=idx(x,y);if(map[i]||ground[i]||thicket[i]||((x-cx)/rx)**2+((y-cy)/ry)**2+rnd(-.2,.2)>=1)continue;thicket[i]=1;cover.push(i);for(let b=0;b<3;b++)props.push({t:'thicket',x:(x+rnd(.1,.9))*T,y:(y+rnd(.1,.9))*T,v:b})}},
    chest(x,y,id){m.put('chest',x,y,0,{id})}
  };
  const def=STORY_MAPS[ci];def.build(m);
  /* anything that cannot be walked to from the start is closed off again */
  const [sx,sy]=def.start,[bx,by]=def.boss,seen=new Uint8Array(N),q=[idx(sx,sy)];seen[q[0]]=1;
  for(let h=0;h<q.length;h++){const c=q[h];for(const n of[c-1,c+1,c-MW,c+MW])if(n>=0&&n<N&&!map[n]&&!seen[n]){seen[n]=1;q.push(n)}}
  for(let i=0;i<N;i++)if(!map[i]&&!seen[i])map[i]=1;
  /* forest on the closed ground, small plants on open grass */
  for(let y=1;y<MH-1;y++)for(let x=1;x<MW-1;x++){const i=idx(x,y),d=deco[i];
    if(map[i]){if(!bld[i]&&map[idx(x,y+1)]===1&&!bld[idx(x,y+1)]&&d<def.forest)props.push({t:def.trees[d%def.trees.length],x:(x+rnd(.2,.8))*T,y:(y+rnd(.3,.9))*T,v:d%3});continue}
    if(ground[i]===3&&d<def.reeds)props.push({t:d%4?'reed':'lily',x:(x+rnd(.1,.9))*T,y:(y+rnd(.1,.9))*T,v:d%3});
    if(ground[i]!==0&&ground[i]!==6)continue;
    for(const [lim,t] of def.flora)if(d<lim){props.push({t,x:(x+rnd(.1,.9))*T,y:(y+rnd(.1,.9))*T,v:d%3});break}}
  const openList=[];for(let i=0;i<N;i++)if(!map[i])openList.push(i);
  mctx.fillStyle='#14181c';mctx.fillRect(0,0,MW,MH);
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const i=idx(x,y),g=ground[i];if(bld[i]){mctx.fillStyle='#c9a26a';mctx.fillRect(x,y,1,1);continue}if(map[i])continue;
    mctx.fillStyle=thicket[i]?biome.leaf[0]:g===1?biome.d:g===2?'#a89a7c':g===3?biome.wa[1]:g===4?'#7a5a38':g===5?biome.stone[0]:g===6?'#4d5a34':g===7?'#6b4a2e':biome.g[0];mctx.fillRect(x,y,1,1)}
  return{map,ground,deco,bld,props,lamps,thicket,cover,isle:null,cars:[],open:openList,biome,story:ci+1,start:{x:sx-6,y:sy-5},boss:{x:bx-6,y:by-5},flow:new Int16Array(N),queue:new Int32Array(N)};
})}

/* ---------- The three maps ---------- */
const STORY_MAPS=[
 /* 1. Sunrise Hollow: a farming village, its fields and orchard, and the crystal quarry to the east */
 {start:[10,28],boss:[64,38],forest:95,trees:['tree','appletree','tree'],reeds:40,flora:[[20,'grass'],[30,'flower'],[36,'sunflower'],[42,'shrub'],[46,'rock']],
  build(m){
   m.blob(9,27,5,4);m.blob(23,27,13,9);m.blob(22,12,13,6);m.blob(22,43,13,6);m.blob(44,27,4,3);m.blob(46,11,6,4);m.blob(46,43,7,5);
   m.blob(61,19,8,6,1);m.blob(64,38,10,8,1);m.blob(64,38,4,3,2);
   m.wet(33,45,3,2);m.wet(47,46,5,2);m.wet(41,44,2,1);
   m.road([[4,27],[34,27]],3,5);m.rect(18,23,11,9,5);
   m.road([[34,27],[44,27],[49,23],[55,20]],3,1);m.road([[23,22],[23,10]],2,1);m.road([[23,32],[23,44]],2,1);
   m.road([[44,27],[45,17],[46,12]],2,1);m.road([[44,27],[45,37],[46,42]],2,1);m.road([[61,19],[63,28],[64,33]],3,1);m.road([[30,43],[41,44],[46,43]],2,1);
   m.rect(11,9,9,5,7);m.rect(26,9,9,5,7);
   m.house(5,21,4,3,5);m.house(12,19,3,2,0);m.house(16,19,3,2,1);m.house(26,19,3,2,0);m.house(30,19,4,2,1);
   m.house(13,33,3,2,1);m.house(17,33,3,2,0);m.house(26,33,4,2,0);m.house(31,33,3,2,1);m.house(21,4,5,3,3);m.house(49,39,3,2,0);m.house(11,39,3,2,3);
   for(let y=9;y<14;y++)for(let x=11;x<35;x++){if(x>19&&x<26)continue;m.put('wheat',x-.25,y,x%3);m.put('wheat',x+.25,y+.3,(x+1)%3)}
   m.block('well',23,27);m.put('stall',20,24,0);m.put('stall',27,24,1);m.put('stall',20,30,2);m.put('cart',27,30);
   [[18,23],[28,23],[18,31],[28,31],[8,26],[34,26],[44,26],[55,21]].forEach(([x,y])=>m.lamp(x,y));
   for(let x=10;x<36;x++){if(x===23||x===24)continue;m.put('fence',x,15)}for(let x=10;x<35;x++){if(x===23||x===24)continue;m.put('fence',x,37.4)}
   m.scatter('appletree',10,38,26,10,16);m.scatter('hay',10,14,26,4,5);m.scatter('hay',38,24,10,6,3);m.put('sign',42,26,0);
   m.put('crate',10,25);m.put('barrel',11,25.4);m.put('barrel',7,29);m.put('crate',14,41);m.put('barrel',15,41.3);
   m.block('tower',47,9);m.scatter('crystal',54,14,16,11,16,1);m.scatter('crystal',55,31,19,15,18,1);m.scatter('rock',54,14,20,32,14,1);
   m.put('crystal',60,36,2,{big:1});m.put('crystal',68,36,1,{big:1});m.put('crystal',60,41,0,{big:1});m.put('crystal',68,41,2,{big:1});
   m.chest(33,9,0);m.chest(50,44,1);m.chest(49,12,2);m.chest(67,16,3);
  }},
 /* 2. Noonshade Thicket: a logging camp, a river, three old shrines and the heart-grove */
 {start:[10,44],boss:[65,14],forest:120,trees:['pine','pine','tree'],reeds:30,flora:[[22,'fern'],[34,'grass'],[40,'mush'],[45,'bigmush'],[50,'shrub'],[53,'stump']],
  build(m){
   m.blob(11,43,8,6);m.blob(26,40,7,5);m.blob(10,28,5,4);m.blob(14,14,6,5,6);m.blob(24,24,5,4,6);m.blob(52,42,6,5,6);m.blob(56,27,5,4,6);
   m.blob(48,13,6,5);m.blob(65,14,9,8,6);m.blob(65,14,4,3,2);m.blob(40,28,4,3);m.blob(32,47,4,3);m.blob(70,26,4,3,6);
   for(let y=3;y<52;y++)m.wet(Math.round(39+Math.sin(y/6)*2.4),y,2,1);
   m.road([[11,43],[26,40]],3,1);m.road([[26,40],[40,40],[52,42]],3,1);m.road([[11,43],[10,28],[14,16]],2,1);m.road([[26,40],[24,24]],2,1);
   m.road([[24,24],[32,18],[40,15],[48,13]],2,1);m.road([[52,42],[56,27]],2,1);m.road([[56,27],[61,20],[65,15]],2,1);m.road([[48,13],[58,13]],3,1);
   m.road([[24,24],[40,28],[56,27]],2,1);m.road([[26,40],[32,47]],2,1);m.road([[56,27],[70,26]],2,1);m.road([[14,16],[24,24]],2,1);
   m.house(4,37,3,2,3);m.house(9,36,4,2,3);m.house(14,45,4,2,3);m.house(12,9,3,2,0);
   m.scatter('stump',20,36,13,9,14);m.scatter('logs',20,36,13,9,6);m.put('logs',8,45);m.put('logs',13,41,1);m.put('cart',16,42);m.put('crate',7,40);m.put('barrel',12,39);
   [[13,44],[8,41],[26,39],[40,39],[14,15]].forEach(([x,y])=>m.lamp(x,y));
   m.put('shrine',24,23,0);m.put('shrine',52,41,1);m.put('shrine',56,26,2);
   m.scatter('bigmush',8,9,13,11,10,6);m.scatter('bigmush',57,7,17,15,12,6);m.scatter('post',43,9,11,9,7);
   m.thick(46,40,3,2);m.thick(58,38,3,2);m.thick(50,30,3,2);m.thick(30,30,3,2);m.thick(18,30,2,2);m.thick(60,22,2,2);
   m.put('sign',22,41,0);m.put('sign',38,41,0);
   m.chest(8,26,0);m.chest(42,29,1);m.chest(33,48,2);m.chest(71,26,3);
  }},
 /* 3. Duskwater Fen: a canal town, the marsh on its boardwalks, a graveyard and the drowned chapel */
 {start:[12,41],boss:[64,21],forest:80,trees:['willow','deadtree','willow','pine'],reeds:120,flora:[[26,'grass'],[34,'fern'],[38,'shrub'],[41,'mush'],[44,'rock']],
  build(m){
   m.blob(14,40,10,8);m.blob(8,24,5,4);m.wet(36,30,14,12);m.blob(30,25,3,2);m.blob(41,36,3,2);m.blob(37,29,2,2);m.blob(34,10,9,5);
   m.blob(56,43,7,5);m.wet(60,46,5,2);m.blob(64,21,10,8);m.rect(60,18,9,7,2);m.blob(70,31,4,3);m.wet(48,16,4,3);
   m.rect(4,45,22,2,3);m.rect(6,49,17,3,3);
   m.road([[4,40],[24,40]],3,5);m.road([[14,33],[14,48]],2,5);m.rect(9,48,10,1,4);m.road([[14,33],[9,26]],2,1);
   m.road([[24,40],[34,34],[44,30],[52,26]],2,4);m.road([[34,34],[34,15]],2,4);m.road([[44,30],[51,38],[56,42]],2,4);m.road([[52,26],[58,22]],2,4);m.road([[64,27],[70,31]],2,1);
   m.house(5,35,3,2,2);m.house(9,35,3,2,2);m.house(17,34,4,3,5);m.house(18,42,3,2,2);m.house(6,42,3,2,2);m.house(25,6,3,2,2);m.house(62,9,5,3,4);
   m.block('tower',8,22,1);
   [[5,39],[11,39],[17,41],[23,39],[13,47],[15,34],[9,27],[34,33],[34,16],[44,29],[52,25],[58,21]].forEach(([x,y])=>m.lamp(x,y));
   for(let y=8;y<13;y+=2)for(let x=28;x<41;x+=2)if(Math.random()<.8)m.put('grave',x,y,irnd(0,2));for(let x=26;x<43;x++)m.put('fence',x,14.4);
   m.put('boat',8,50,0);m.put('boat',17,50.4,1);m.put('boat',61,46,0);m.put('boat',57,47,1);m.put('crate',10,47.6);m.put('barrel',11,47.4);m.put('barrel',17,47.5);m.put('crate',20,39);m.put('stall',11,38,1);
   m.scatter('grave',58,15,13,3,5);m.put('sign',25,39,0);
   m.chest(41,36,0);m.chest(30,25,1);m.chest(21,43,2);m.chest(71,31,3);
  }}
];

/* ---------- Drawing ---------- */
function drawStoryTile(g,px,py,x,y,d,B){
  if(g===5){ctx.fillStyle=B.stone[2];ctx.fillRect(px,py,T+.5,T+.5);
    for(let r=0;r<4;r++){const off=(r+y)%2?-6:0;for(let c=0;c<3;c++){const sx=px+off+c*14+1,sy=py+r*10+1,w=Math.min(12,px+T-sx),x0=Math.max(sx,px);if(w<=0)continue;ctx.fillStyle=B.stone[(d+r*3+c)%5?0:1];ctx.fillRect(x0,sy,sx+12>px+T?px+T-x0:12-(x0-sx),8)}}
    if(d<26){ctx.fillStyle=B.leaf[d%3];ctx.fillRect(px+(d%30),py+(d*3%32),5,3)}return}
  if(g===6){ctx.fillStyle='#46532f';ctx.fillRect(px,py,T+.5,T+.5);ctx.fillStyle='#53603a';ctx.fillRect(px+(d%26),py+(d*7%28),12,7);ctx.fillStyle='#6a5632';ctx.fillRect(px+(d*3%32),py+(d*5%34),6,2);ctx.fillRect(px+(d*11%30),py+(d%30),2,5);ctx.fillStyle=B.leaf[d%3];ctx.fillRect(px+(d*5%34),py+(d*3%36),4,3);return}
  if(g===7){ctx.fillStyle='#6b4a2e';ctx.fillRect(px,py,T+.5,T+.5);ctx.fillStyle='#573a22';for(let r=4;r<T;r+=10)ctx.fillRect(px,py+r,T+.5,3);ctx.fillStyle='#7c5a3a';ctx.fillRect(px+(d%30),py+(d*3%34),6,2);return}
  /* under a house */
  ctx.fillStyle='#3a332b';ctx.fillRect(px,py,T+.5,T+.5);
}
const HOUSE=[{wall:'#e8dcc0',trim:'#7a5a38',roof:'#c8a04a',roof2:'#a8843a',door:'#6a4426'},{wall:'#efe6d2',trim:'#6a4a30',roof:'#b8493a',roof2:'#96382c',door:'#5a3820'},{wall:'#c8ccd0',trim:'#3e4a54',roof:'#4a6278',roof2:'#3a4e62',door:'#2e3a44'},
 {wall:'#8a5a3c',trim:'#4a2e1c',roof:'#5a4030',roof2:'#463024',door:'#3a2416'},{wall:'#b0b0a8',trim:'#55554e',roof:'#4a4a58',roof2:'#3a3a46',door:'#3a2a20'},{wall:'#e4d2a8',trim:'#6a4426',roof:'#3f7a5a',roof2:'#2f6046',door:'#5a3820'}];
function drawStoryProp(o){
  const B=G.w.biome,t=G.t,sw=Math.sin(t*1.6+o.x*.04)*1.2,R=(c,x,y,w,h)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h)},lit=nightness(G.hour)>.15||G.w.story===3;
  switch(o.t){
   case'house':{const w=o.w*T,h=o.h*T,x0=o.x-w/2,S=HOUSE[o.v]||HOUSE[0],wallH=Math.min(h*.6,50),rb=o.y-wallH+3,ry=o.y-h-18;
     ctx.fillStyle='rgba(10,14,20,.3)';ctx.fillRect(x0-2,o.y-4,w+8,8);
     R(S.wall,x0+3,o.y-wallH,w-6,wallH);R('rgba(0,0,0,.12)',x0+3,o.y-wallH,w-6,7);R(S.trim,x0+3,o.y-4,w-6,4);R(S.trim,x0+3,o.y-wallH,3,wallH);R(S.trim,x0+w-6,o.y-wallH,3,wallH);
     if(o.v===3||o.v===0)for(let bx=x0+22;bx<x0+w-12;bx+=26)R(S.trim,bx,o.y-wallH,2,wallH);
     ctx.fillStyle=S.roof;ctx.beginPath();ctx.moveTo(x0-5,rb);ctx.lineTo(x0+12,ry);ctx.lineTo(x0+w-12,ry);ctx.lineTo(x0+w+5,rb);ctx.closePath();ctx.fill();
     for(let yy=ry+7;yy<rb-2;yy+=8){const k=(yy-ry)/(rb-ry),inx=17*(1-k);R(S.roof2,x0-5+inx,yy,w+10-inx*2,3)}R('rgba(255,255,255,.14)',x0+12,ry,w-24,3);R('rgba(0,0,0,.25)',x0-3,rb-2,w+6,3);
     R(S.door,o.x-8,o.y-26,16,26);R('rgba(0,0,0,.25)',o.x-8,o.y-26,16,3);R('#e8c95c',o.x+3,o.y-13,2,3);
     const win=lit?'#ffd870':'#7fb0c8';for(const wx of[x0+14,x0+w-26]){if(Math.abs(wx+6-o.x)<16)continue;R(S.trim,wx-1,o.y-wallH+11,14,14);R(win,wx+1,o.y-wallH+13,10,10);R(S.trim,wx+5,o.y-wallH+13,2,10)}
     if(o.v===4){R(S.wall,o.x-9,ry-34,18,36);ctx.fillStyle=S.roof;ctx.beginPath();ctx.moveTo(o.x-12,ry-32);ctx.lineTo(o.x,ry-62);ctx.lineTo(o.x+12,ry-32);ctx.closePath();ctx.fill();R(lit?'#9ad8ff':'#56707e',o.x-3,ry-24,6,12);R('#d8d8d0',o.x-1,ry-72,2,12);R('#d8d8d0',o.x-4,ry-68,8,2)}
     else{R('#6a625a',x0+w-28,ry-10,9,16);R('#55504a',x0+w-30,ry-12,13,4);if(!reduced){const q=(t*.5+o.x*.01)%1;ctx.fillStyle='rgba(220,220,220,'+(.3*(1-q)).toFixed(2)+')';ctx.beginPath();ctx.arc(x0+w-23+Math.sin(q*5)*4,ry-16-q*26,4+q*6,0,TAU);ctx.fill()}}
     if(o.v===5){R('#4a2e1c',o.x+16,o.y-44,3,20);R('#e8c95c',o.x+19,o.y-42,18,13);R('#4a2e1c',o.x+22,o.y-38,12,2);R('#4a2e1c',o.x+22,o.y-34,8,2)}
     break}
   case'well':{shadow(o.x,o.y,16);R('#77736c',o.x-15,o.y-14,30,16);R('#5c5852',o.x-15,o.y-6,30,3);R('#2a4a5e',o.x-10,o.y-13,20,6);R('#6a4426',o.x-14,o.y-40,3,28);R('#6a4426',o.x+11,o.y-40,3,28);R('#8a3a2c',o.x-18,o.y-46,36,8);R('#a84a38',o.x-18,o.y-46,36,3);R('#c8b890',o.x-1,o.y-38,2,16);break}
   case'tower':{const lh=o.v===1;shadow(o.x,o.y+6,26);ctx.fillStyle=lh?'#d8d4c8':'#8a8678';ctx.beginPath();ctx.moveTo(o.x-20,o.y+10);ctx.lineTo(o.x-13,o.y-96);ctx.lineTo(o.x+13,o.y-96);ctx.lineTo(o.x+20,o.y+10);ctx.closePath();ctx.fill();
     R('rgba(0,0,0,.18)',o.x+2,o.y-96,13,106);if(lh){R('#b8493a',o.x-17,o.y-34,34,12);R('#b8493a',o.x-15,o.y-70,30,10)}else for(let yy=o.y-84;yy<o.y;yy+=18)R('#6c685c',o.x-14+((yy/18|0)%2)*8,yy,10,6);
     R('#55504a',o.x-18,o.y-102,36,7);R('#3a3630',o.x-12,o.y-122,24,20);R(lh?(Math.sin(t*2)>0||lit?'#ffe9a0':'#c8b060'):'#ffb040',o.x-8,o.y-118,16,13);ctx.fillStyle=lh?'#b8493a':'#5a4030';ctx.beginPath();ctx.moveTo(o.x-15,o.y-122);ctx.lineTo(o.x,o.y-140);ctx.lineTo(o.x+15,o.y-122);ctx.closePath();ctx.fill();R('#3a2a20',o.x-6,o.y-12,12,22);break}
   case'fence':{R('#6a4a2c',o.x-20,o.y-12,40,3);R('#6a4a2c',o.x-20,o.y-5,40,3);R('#7c5a38',o.x-18,o.y-16,4,18);R('#7c5a38',o.x+2,o.y-16,4,18);break}
   case'wheat':{const c=['#e0b84a','#d4a83c','#ecc860'][o.v];for(let i=-2;i<=2;i++){const h=16+((i+3)*(o.v+2))%7;R(c,o.x+i*4+sw*(h/14),o.y-h,2,h);R('#f4dc88',o.x+i*4-1+sw*(h/12),o.y-h-3,4,5)}break}
   case'sunflower':{R('#3f7a34',o.x,o.y-22,2,22);R('#3f7a34',o.x-4,o.y-12,5,2);ctx.fillStyle='#f6c82e';ctx.beginPath();ctx.arc(o.x+1+sw*.6,o.y-25,6,0,TAU);ctx.fill();ctx.fillStyle='#6a4420';ctx.beginPath();ctx.arc(o.x+1+sw*.6,o.y-25,2.6,0,TAU);ctx.fill();break}
   case'appletree':{shadow(o.x,o.y,20);R('#5a3e28',o.x-4,o.y-24,8,26);const c=B.leaf;[[0,-48,22,c[o.v]],[-15,-36,16,c[(o.v+1)%3]],[15,-36,16,c[(o.v+2)%3]],[0,-62,14,c[(o.v+1)%3]]].forEach(([ax,ay,r,col])=>{ctx.fillStyle=col;ctx.beginPath();ctx.arc(o.x+ax+sw,o.y+ay,r,0,TAU);ctx.fill()});
     ctx.fillStyle='#e0483a';[[-12,-40],[6,-52],[14,-34],[-3,-30],[-18,-30],[2,-66]].forEach(([ax,ay])=>{ctx.beginPath();ctx.arc(o.x+ax+sw,o.y+ay,2.6,0,TAU);ctx.fill()});break}
   case'pine':{shadow(o.x,o.y,18);R('#4a3524',o.x-4,o.y-18,8,20);const c=B.leaf;for(let k=0;k<4;k++){const yy=o.y-14-k*18,w=30-k*6;ctx.fillStyle=c[(o.v+k)%3];ctx.beginPath();ctx.moveTo(o.x-w+sw*(k*.4),yy);ctx.lineTo(o.x+sw*(k*.5+.4),yy-30);ctx.lineTo(o.x+w+sw*(k*.4),yy);ctx.closePath();ctx.fill()}break}
   case'willow':{shadow(o.x,o.y,22);R('#3e3428',o.x-5,o.y-34,10,36);const c=B.leaf;ctx.fillStyle=c[o.v];ctx.beginPath();ctx.arc(o.x,o.y-52,26,0,TAU);ctx.fill();for(let i=-5;i<=5;i++){const h=30+((i+6)*(o.v+3))%22;ctx.fillStyle=c[(i+6+o.v)%3];ctx.fillRect(o.x+i*5+sw*(h/22),o.y-56,3,h)}break}
   case'deadtree':{shadow(o.x,o.y,12);ctx.strokeStyle='#3a342c';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(o.x+2,o.y-36);ctx.stroke();ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(o.x+1,o.y-22);ctx.lineTo(o.x-14,o.y-40);ctx.moveTo(o.x+2,o.y-30);ctx.lineTo(o.x+15,o.y-48);ctx.moveTo(o.x+2,o.y-36);ctx.lineTo(o.x-6,o.y-56);ctx.stroke();break}
   case'bigmush':{shadow(o.x,o.y,12);R('#e8e0cc',o.x-4,o.y-24,8,24);R('#c8c0aa',o.x+1,o.y-24,3,24);ctx.fillStyle=['#c0392f','#c88a30','#8a5ac8'][o.v];ctx.beginPath();ctx.ellipse(o.x,o.y-24,20,13,0,Math.PI,0);ctx.fill();ctx.fillStyle='rgba(255,255,255,.75)';[[-10,-29],[4,-33],[11,-27]].forEach(([a,b])=>{ctx.beginPath();ctx.arc(o.x+a,o.y+b,2.4,0,TAU);ctx.fill()});
     if(lit||G.w.story===2){ctx.fillStyle='rgba(180,255,200,'+(.1+.06*Math.sin(t*2+o.x)).toFixed(3)+')';ctx.beginPath();ctx.arc(o.x,o.y-24,26,0,TAU);ctx.fill()}break}
   case'stump':{shadow(o.x,o.y,11);R('#6a4a2c',o.x-10,o.y-10,20,12);ctx.fillStyle='#c8a878';ctx.beginPath();ctx.ellipse(o.x,o.y-10,10,4,0,0,TAU);ctx.fill();ctx.strokeStyle='#8a6a40';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(o.x,o.y-10,5,2,0,0,TAU);ctx.stroke();break}
   case'logs':{shadow(o.x,o.y,20);for(const [a,b] of[[-18,-8],[0,-8],[-9,-18]]){R('#7a5634',o.x+a,o.y+b,26,10);ctx.fillStyle='#d0b080';ctx.beginPath();ctx.ellipse(o.x+a+26,o.y+b+5,3,5,0,0,TAU);ctx.fill()}break}
   case'shrine':{shadow(o.x,o.y,18);R('#8a8678',o.x-14,o.y-8,28,10);R('#a8a494',o.x-10,o.y-40,20,34);R('#6c685c',o.x+3,o.y-40,7,34);R('#a8a494',o.x-16,o.y-46,32,7);const on=o.on;ctx.fillStyle=on?'#ffe9a0':'#4a4a44';ctx.beginPath();ctx.arc(o.x,o.y-26,6,0,TAU);ctx.fill();
     if(on){ctx.fillStyle='rgba(255,233,160,'+(.2+.1*Math.sin(t*4)).toFixed(3)+')';ctx.beginPath();ctx.arc(o.x,o.y-26,22,0,TAU);ctx.fill()}R(B.leaf[0],o.x-14,o.y-30,5,12);break}
   case'post':{R('#4a3524',o.x-2,o.y-54,4,54);R('#4a3524',o.x-14,o.y-52,28,3);ctx.strokeStyle='rgba(240,230,210,.7)';ctx.lineWidth=1;for(const a of[-11,0,11]){ctx.beginPath();ctx.moveTo(o.x+a,o.y-50);ctx.lineTo(o.x+a+sw*2,o.y-26-Math.abs(a));ctx.stroke()}break}
   case'reed':{for(let i=-1;i<=1;i++){const h=16+((i+2)*(o.v+2))%8;R(B.leaf[(i+1+o.v)%3],o.x+i*4+sw*(h/12),o.y-h,2,h);R('#6a4a2c',o.x+i*4-1+sw*(h/10),o.y-h-4,3,6)}break}
   case'lily':{ctx.fillStyle=B.leaf[1];ctx.beginPath();ctx.ellipse(o.x,o.y,8,5,0,.5,TAU);ctx.fill();if(o.v===1){ctx.fillStyle='#f4b8d4';ctx.beginPath();ctx.arc(o.x+1,o.y-1,2.6,0,TAU);ctx.fill()}break}
   case'boat':{const bob=Math.sin(t*1.4+o.x)*1.5;ctx.fillStyle='#5a3e28';ctx.beginPath();ctx.moveTo(o.x-28,o.y-8+bob);ctx.lineTo(o.x+28,o.y-8+bob);ctx.lineTo(o.x+20,o.y+4+bob);ctx.lineTo(o.x-20,o.y+4+bob);ctx.closePath();ctx.fill();R('#7c5a38',o.x-26,o.y-10+bob,52,3);R('#c8b890',o.x-3,o.y-8+bob,6,10);if(o.v){R('#4a3524',o.x-1,o.y-40+bob,2,32);ctx.fillStyle='#d8d0b8';ctx.beginPath();ctx.moveTo(o.x+1,o.y-40+bob);ctx.lineTo(o.x+18,o.y-14+bob);ctx.lineTo(o.x+1,o.y-14+bob);ctx.closePath();ctx.fill()}break}
   case'crystal':{const c=['#8fe0ff','#c8a0ff','#9af0c8'][o.v],k=o.big?2:1;shadow(o.x,o.y,8*k);ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(o.x-6*k,o.y);ctx.lineTo(o.x-3*k,o.y-18*k);ctx.lineTo(o.x+1*k,o.y-22*k);ctx.lineTo(o.x+6*k,o.y);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.moveTo(o.x-3*k,o.y-18*k);ctx.lineTo(o.x+1*k,o.y-22*k);ctx.lineTo(o.x,o.y);ctx.closePath();ctx.fill();
     ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(o.x+4*k,o.y);ctx.lineTo(o.x+9*k,o.y-11*k);ctx.lineTo(o.x+12*k,o.y);ctx.closePath();ctx.fill();if(!reduced){ctx.fillStyle='rgba(255,255,255,'+(.25+.25*Math.sin(t*3+o.x)).toFixed(2)+')';ctx.fillRect(o.x-1,o.y-16*k,2,2)}break}
   case'sign':{R('#5a3e28',o.x-2,o.y-26,4,26);R('#c8a878',o.x-14,o.y-30,28,12);R('#5a3e28',o.x-10,o.y-26,20,2);R('#5a3e28',o.x-10,o.y-22,14,2);break}
   case'crate':{shadow(o.x,o.y,11);R('#8a6238',o.x-10,o.y-18,20,18);R('#6a4a2a',o.x-10,o.y-18,20,3);R('#6a4a2a',o.x-10,o.y-3,20,3);R('#6a4a2a',o.x-2,o.y-18,3,18);break}
   case'barrel':{shadow(o.x,o.y,9);R('#7a5230',o.x-8,o.y-20,16,20);R('#4a4a4e',o.x-9,o.y-16,18,2);R('#4a4a4e',o.x-9,o.y-6,18,2);R('#94683e',o.x-5,o.y-20,3,20);break}
   case'hay':{shadow(o.x,o.y,13);ctx.fillStyle='#d8b450';ctx.beginPath();ctx.ellipse(o.x,o.y-10,14,11,0,0,TAU);ctx.fill();ctx.strokeStyle='#b08c34';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(o.x,o.y-10,8,6,0,0,TAU);ctx.stroke();ctx.beginPath();ctx.ellipse(o.x,o.y-10,3,2,0,0,TAU);ctx.stroke();break}
   case'stall':{const c=['#b8493a','#3f7a5a','#4a6278'][o.v];shadow(o.x,o.y,20);R('#6a4a2c',o.x-20,o.y-14,40,14);R('#5a3e28',o.x-20,o.y-36,3,36);R('#5a3e28',o.x+17,o.y-36,3,36);for(let i=0;i<5;i++)R(i%2?c:'#f0e8d8',o.x-22+i*9,o.y-44,9,10);R('#e0483a',o.x-14,o.y-19,6,5);R('#f0c23c',o.x-5,o.y-19,6,5);R('#58a244',o.x+5,o.y-19,6,5);break}
   case'cart':{shadow(o.x,o.y,18);R('#7a5634',o.x-18,o.y-20,36,12);R('#5a3e28',o.x-18,o.y-10,36,3);R('#5a3e28',o.x+18,o.y-16,14,2);ctx.fillStyle='#3a2a1c';for(const a of[-10,10]){ctx.beginPath();ctx.arc(o.x+a,o.y-5,6,0,TAU);ctx.fill()}ctx.fillStyle='#d8b450';ctx.beginPath();ctx.ellipse(o.x,o.y-22,14,6,0,Math.PI,0);ctx.fill();break}
   case'grave':{shadow(o.x,o.y,8);if(o.v===2){R('#8a8a84',o.x-2,o.y-22,4,22);R('#8a8a84',o.x-8,o.y-16,16,4)}else{ctx.fillStyle='#8a8a84';ctx.beginPath();ctx.moveTo(o.x-8,o.y);ctx.lineTo(o.x-8,o.y-14);ctx.quadraticCurveTo(o.x,o.y-24,o.x+8,o.y-14);ctx.lineTo(o.x+8,o.y);ctx.closePath();ctx.fill();R('#6a6a66',o.x-4,o.y-12,8,2);R('#6a6a66',o.x-4,o.y-8,6,2)}R(B.leaf[0],o.x-9,o.y-3,5,3);break}
   case'chest':{const open=G.story&&G.story.opened.includes(o.id);shadow(o.x,o.y,12);R('#7a4a22',o.x-12,o.y-14,24,14);R('#e8c95c',o.x-12,o.y-9,24,2);R('#e8c95c',o.x-2,o.y-12,4,6);
     if(open){R('#3a2412',o.x-12,o.y-18,24,5);R('#9a6030',o.x-12,o.y-26,24,8)}else{R('#9a6030',o.x-12,o.y-20,24,7);if(!reduced){ctx.fillStyle='rgba(255,220,120,'+(.18+.14*Math.sin(t*3+o.x)).toFixed(2)+')';ctx.beginPath();ctx.arc(o.x,o.y-10,20,0,TAU);ctx.fill()}}break}
  }
}
