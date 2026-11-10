/* Optional, visual-only Three.js layer. Rules and hit detection never read it. */
const FX3={enabled:false,layer:null,loading:false,failed:false};
const fx3Canvas=$('fx3'),fx3Button=$('fx3btn');
async function setFx3(on){
  FX3.enabled=on;store.set('dayrim-fx3',on?'on':'off');fx3Button.textContent=on?'3D effects on':'3D effects off';fx3Button.setAttribute('aria-pressed',String(on));
  if(!on){fx3Canvas.hidden=true;return}if(FX3.layer||FX3.loading)return;FX3.loading=true;
  try{const mod=await import(new URL(THREE_LAYER_URL,document.baseURI).href);FX3.layer=mod.createLayer(fx3Canvas);FX3.failed=false}
  catch(e){FX3.failed=true;FX3.enabled=false;store.set('dayrim-fx3','off');fx3Button.textContent='3D effects unavailable';fx3Button.setAttribute('aria-pressed','false');fx3Canvas.hidden=true}
  finally{FX3.loading=false}
}
fx3Canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(FX3.layer)FX3.layer.dispose();FX3.layer=null;FX3.enabled=false;FX3.failed=true;fx3Canvas.hidden=true;store.set('dayrim-fx3','off');fx3Button.textContent='3D effects unavailable';fx3Button.setAttribute('aria-pressed','false')});
fx3Button.onclick=()=>setFx3(!FX3.enabled);
function drawFx3(now){const show=FX3.enabled&&FX3.layer&&G.mode==='play';fx3Canvas.hidden=!show;if(show)try{FX3.layer.draw(W,H,now,!reduced)}catch(e){setFx3(false)}}
if(store.get('dayrim-fx3')==='on')setFx3(true);
