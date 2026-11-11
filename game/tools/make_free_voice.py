"""Free announcer voice: espeak-ng turns text into pronunciation symbols, and the public-domain
LJSpeech Piper voice model turns those into speech. Usage: tts.py OUT_DIR name=text ..."""
import sys,json,subprocess,wave,numpy as np,onnxruntime as ort
import os
S=os.environ.get('PIPER_MODEL','voices/en_US-ljspeech-high.onnx')
cfg=json.load(open(S+'.json'));idmap=cfg['phoneme_id_map'];inf=cfg['inference'];sr=cfg['audio']['sample_rate']
sess=ort.InferenceSession(S)
def ids_for(text):
  ipa=subprocess.run(['espeak-ng','-q','--ipa=3','-v','en-us',text],capture_output=True,text=True).stdout.replace('‍','').strip().replace('\n',' ')
  out=idmap['^']+idmap['_']
  for ch in ipa+'!':
    if ch in idmap:out+=idmap[ch]+idmap['_']
  return out+idmap['$']
def speak(text,length=1.0):
  ids=np.array([ids_for(text)],dtype=np.int64)
  a=sess.run(None,{'input':ids,'input_lengths':np.array([ids.shape[1]],dtype=np.int64),'scales':np.array([inf['noise_scale'],inf['length_scale']*length,inf['noise_w']],dtype=np.float32)})[0].squeeze().astype(np.float32)
  return a
def polish(a):
  nz=np.where(np.abs(a)>0.01*np.abs(a).max())[0];a=a[max(0,nz[0]-200):nz[-1]+800]
  out=a.copy()
  for d,g in [(0.045,.28),(0.09,.16),(0.14,.09)]:
    k=int(sr*d);out[k:]+=a[:-k]*g
  out=np.concatenate([out,np.zeros(int(sr*.15),np.float32)]);return out*0.89/max(1e-6,np.abs(out).max())
od=sys.argv[1]
for arg in sys.argv[2:]:
  name,text=arg.split('=',1);a=polish(speak(text,1.05))
  with wave.open(f'{od}/{name}.wav','wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((a*32767).astype(np.int16).tobytes())
  print(name,round(len(a)/sr,2),'s')
