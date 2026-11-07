'use strict';
/* Exercise every distinct roster pair through the online hit rules. */
const s=require('../server/sim'),T=s.test;
const room={clients:new Map()},a=s.createRoom(room,'Detective',null,'A'),b=s.addPlayer(room,'Inventor',null,'B');
T.enter(room);const G=T.G,names=Object.keys(T.ELEMENT),missing=[];
for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++){
  a.char=names[i];b.char=names[j];a.rage=b.rage=0;G.enemies=[];G.fx=[];
  const e=T.spawnMob(0,{x:a.x+30,y:a.y},false);e.hp=e.maxHp=1e9;e.kx=e.ky=0;
  G.p=a;T.hitEnemy(e,10,0,0);G.p=b;T.hitEnemy(e,10,0,0);
  if(e.statusT!==0||a.rage<12||b.rage<12)missing.push(names[i]+' + '+names[j]);
}
const coverage=T.reactionCoverage();
if(missing.length||coverage.missing.length){console.error('Missing reactions:',missing.concat(coverage.missing.map(p=>p.join(' + '))).join(', '));process.exitCode=1}
else console.log('All '+coverage.covered+' character pairs react ('+coverage.byElement+' named, '+coverage.byResonance+' resonance).');
