/* Checks the story script: every beat is written for both sides, every speaker exists, every quest giver is in the chapter. */
const fs=require('fs'),path=require('path'),vm=require('vm');
const src=fs.readFileSync(path.join(__dirname,'../src/story-data.js'),'utf8');
const ctx={};vm.createContext(ctx);vm.runInContext(src+';this.out={STORY,STORY_CAST,STORY_VOICE,STORY_PICK};',ctx);
const {STORY,STORY_CAST,STORY_VOICE,STORY_PICK}=ctx.out;
let n=0;const ok=(c,m)=>{if(!c){console.error('FAIL '+m);process.exit(1)}n++};
const KINDS=['talk','go','kill','collect','defend','hold','elite','boss'],SIDES=['hero','villain'];
const lines=(a,where)=>{for(const l of a||[]){const s=typeof l==='object'?l.ask:l,k=s.indexOf(': ');ok(k>=0,where+': line has no speaker: '+s);const who=s.slice(0,k);ok(who===''||who==='me'||STORY_CAST[who],where+': unknown speaker '+who);ok(s.slice(k+2).trim().length>0,where+': empty line');
  if(typeof l==='object'){ok(l.opts.length===3,where+': a choice has three options');for(const [kind,[lab,reply]] of l.opts)ok(['sp','supplies','gold'].includes(kind)&&lab&&reply,where+': choice option')}}};
ok(STORY.length===3,'three chapters');
for(const side of SIDES){ok(STORY_PICK[side].length===5,'five '+side+' leads');for(const c of STORY_PICK[side])ok(STORY_VOICE[c]&&STORY_VOICE[c].length===STORY.length,c+' has a line for every chapter')}
STORY.forEach((ch,ci)=>{const at='chapter '+(ci+1);
  ok(ch.n&&ch.boss&&ch.hour>=0,at+' has a name, boss and hour');ok(ch.beats[ch.beats.length-1].k==='boss',at+' ends with its boss');ok(ch.beats[0].k==='talk',at+' opens with a conversation');
  for(const c of ch.npcs)ok(STORY_CAST[c.id]&&STORY_CAST[c.id].art,at+' cast '+c.id);
  for(const side of SIDES){ok(ch.title[side]&&ch.safe[side],at+' title and safehouse for '+side);lines(ch.intro[side],at+' intro');lines(ch.outro[side],at+' outro');
    const here=new Set(ch.npcs.filter(c=>!c.f||c.f===side).map(c=>c.id));
    ch.beats.forEach((b,bi)=>{const w=at+' beat '+(bi+1)+' ('+side+')',f=b[side];ok(KINDS.includes(b.k),w+' kind');ok(f&&f.l,w+' has a label');lines(f.in,w);lines(f.out,w);lines(f.pre,w);
      if(b.k==='talk'){ok(here.has(f.npc),w+' talks to someone in the chapter: '+f.npc);ok(f.t&&f.t.length,w+' has a conversation');lines(f.t,w)}
      if(b.k==='elite')ok(f.name&&Object.values(STORY_CAST).some(c=>c.art===f.name),w+' names a lieutenant with a speaker');
      if(b.k==='collect')ok(f.item&&b.items.length>=3,w+' items');
      if(b.k==='kill')ok(b.n>0&&b.at,w+' count and place');if(b.k==='defend')ok(b.t>0&&b.at,w+' time and place');if(b.k==='hold')ok(b.pts.length>=2&&b.t>0,w+' zones')})}
  for(const c of ch.npcs)for(const side of SIDES)if(!c.f||c.f===side)lines((c.chat&&c.chat[side]||[]).map(t=>c.id+': '+t),at+' chat');
});
console.log('\n'+n+' story checks passed');
