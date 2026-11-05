'use strict';
/* Loads the game's own rules (src/rig.js and src/game.js) on the server, with the browser parts stubbed out.
   There is only ever one copy of the rules: the same files the browser plays. */
const vm=require('vm'),fs=require('fs'),path=require('path');
const SRC=path.join(__dirname,'..','src');

const noop=()=>{};
const blank=new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>0:blank,set:()=>true,apply:()=>blank,construct:()=>blank});
const sandbox={
  console,Buffer,
  document:{documentElement:blank,getElementById:()=>blank,createElement:()=>blank,querySelectorAll:()=>[]},
  matchMedia:()=>({matches:false}),
  Image:class{},
  localStorage:{getItem:()=>null,setItem:noop,removeItem:noop},
  window:{}
};
const header='const ATLAS_URL="",CAST={},AW=1,AH=1,MOVES={},MOVE_URLS={},VOICE_CLIPS={};\n';
const code='(()=>{"use strict";\n'+header+
  fs.readFileSync(path.join(SRC,'rig.js'),'utf8')+'\n'+
  fs.readFileSync(path.join(SRC,'game.js'),'utf8')+'\n'+
  fs.readFileSync(path.join(__dirname,'sim-glue.js'),'utf8')+'\n})()';
module.exports=vm.runInNewContext(code,sandbox,{filename:'dayrim-rules.js'});
