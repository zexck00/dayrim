'use strict';
/* Saved progress. Each player holds a secret token in their browser. Only its hash reaches the disk. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');

class Profiles{
  constructor(dir){this.dir=dir;fs.mkdirSync(dir,{recursive:true})}
  newToken(){return crypto.randomBytes(24).toString('base64url')}
  file(token){return path.join(this.dir,crypto.createHash('sha256').update(token).digest('hex')+'.json')}
  load(token){try{const o=JSON.parse(fs.readFileSync(this.file(token),'utf8'));return o&&typeof o.chars==='object'&&o.chars?o:{chars:{}}}catch(e){if(e.code!=='ENOENT')console.error('profile read failed:',e.message);return{chars:{}}}}
  /* Written to a temporary file first, so a crash can never leave half a save */
  saveSync(token,profile){const f=this.file(token),tmp=f+'.'+process.pid+'.tmp';profile.updated=new Date().toISOString();fs.writeFileSync(tmp,JSON.stringify(profile));fs.renameSync(tmp,f)}
  save(token,profile){try{this.saveSync(token,profile)}catch(e){console.error('profile save failed:',e.message)}}
}
module.exports={Profiles};
