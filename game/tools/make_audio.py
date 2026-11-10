#!/usr/bin/env python3
"""Makes Dayrim's generated sound effects from scratch: tones, noise and envelopes, no samples.
Everything here is original, so there is nothing to license.

    python3 tools/make_audio.py [VOICE_DIR]

Writes WAV originals to ../ASSETS/audio/generated/ and small AAC copies to sprites/sfx/ (macOS afconvert).
VOICE_DIR, if given, holds call-duo.wav, call-trio.wav, call-full-party.wav and call-link.wav from the
free voice tool (tools/make_free_voice.py); they are mixed into the linked-ultimate sounds.
Needs numpy.
"""
import sys,wave,subprocess
from pathlib import Path
import numpy as np

SR=44100
root=Path(__file__).resolve().parent.parent
RAW=root.parent/'ASSETS'/'audio'/'generated';OUT=root/'sprites'/'sfx'
RAW.mkdir(parents=True,exist_ok=True);OUT.mkdir(exist_ok=True)
VOICE=Path(sys.argv[1]) if len(sys.argv)>1 else None
rng=np.random.default_rng(7)  # fixed seed, so the files come out the same every run

def t(d):return np.arange(int(SR*d))/SR
def env(n,a=.005,r=.3):
    """Fast attack, then an exponential tail; r is roughly the tail length in seconds"""
    x=np.ones(n);k=max(1,min(n,int(SR*a)));x[:k]=np.linspace(0,1,k)
    tail=np.arange(n-k)/SR;x[k:]=np.exp(-tail*5/max(r,1e-3))
    return x
def tone(f0,d,f1=None,wave_='sine',a=.005,r=.3):
    tt=t(d);f=np.full_like(tt,f0) if f1 is None else f0*(f1/f0)**(tt/d)
    ph=2*np.pi*np.cumsum(f)/SR;c=(ph/(2*np.pi))%1
    w={'sine':np.sin(ph),'saw':2*c-1,'square':np.sign(np.sin(ph)),'tri':2*np.abs(2*c-1)-1}[wave_]
    return w*env(len(tt),a,r)
def noise(d,a=.002,r=.3):return rng.uniform(-1,1,int(SR*d))*env(int(SR*d),a,r)
def lowpass(x,cut):
    """One-pole low-pass; cut can be a number or an array that sweeps"""
    c=np.broadcast_to(np.asarray(cut,dtype=float),x.shape);al=1-np.exp(-2*np.pi*c/SR);y=np.zeros_like(x);s=0.
    for i in range(len(x)):s+=al[i]*(x[i]-s);y[i]=s
    return y
def highpass(x,cut):return x-lowpass(x,cut)
def mix(*parts):
    n=max(int(SR*at)+len(p) for at,p in parts);y=np.zeros(n)
    for at,p in parts:k=int(SR*at);y[k:k+len(p)]+=p
    return y
def echo(x,taps=((.06,.3),(.13,.18),(.21,.1))):
    y=np.concatenate([x,np.zeros(int(SR*.3))])
    for d,g in taps:k=int(SR*d);y[k:k+len(x)]+=x*g
    return y
def chord(freqs,d,wave_='sine',r=.5):return sum(tone(f,d,wave_=wave_,r=r) for f in freqs)/len(freqs)
def voice(name):
    if not VOICE or not (VOICE/f'{name}.wav').exists():return np.zeros(1)
    with wave.open(str(VOICE/f'{name}.wav')) as w:
        sr=w.getframerate();a=np.frombuffer(w.readframes(w.getnframes()),np.int16)/32768
    return np.interp(np.arange(int(len(a)*SR/sr))*sr/SR,np.arange(len(a)),a)
N=lambda m:440*2**((m-69)/12)  # MIDI note to Hz
L=lambda d:int(SR*d)
crackle=lambda d,rate:(rng.random(L(d))<rate/SR)*rng.uniform(-1,1,L(d))
rev=lambda x:x[::-1]

S={}
# --- Co-op (Z-13) ---
S['downed']=mix((0,lowpass(tone(440,.7,90,'saw',r=.6),1800)*.7),(0,lowpass(noise(.25,r=.2),500)*.8),(.05,tone(70,.5,40,r=.5)*.6))
S['revive-start']=echo(mix(*[(i*.07,tone(N(n),.35,r=.35)*.5) for i,n in enumerate([72,76,79])]))
S['revive-tick']=tone(N(84),.12,r=.12)*.35
S['revive-done']=echo(mix((0,chord([N(72),N(76),N(79),N(84)],1.1,r=.7)*.8),(0,tone(500,.8,2500,'tri',r=.6)*.25),(0,highpass(noise(.6,r=.5),4000)*.15)))
S['ping']=echo(mix((0,tone(1320,.3,r=.3)*.6),(.09,tone(1760,.4,r=.35)*.6)))
S['link-open']=mix((0,lowpass(noise(.9,a=.3,r=.6),np.linspace(300,6000,L(.9)))*.7),(.1,chord([N(60),N(67),N(72)],1.,'tri',r=.7)*.5),(.15,voice('call-link')*.9))
for name,notes in [('link-duo',[60,67]),('link-trio',[60,64,67]),('link-full-party',[60,64,67,72])]:
    boom=mix((0,tone(110,.7,45,r=.5)*.8),(0,lowpass(noise(.4,r=.3),900)*.6))
    S[name]=echo(mix((0,boom),(0,chord([N(n) for n in notes],1.2,'saw',r=.7)*.25),(0,chord([N(n+12) for n in notes],1.2,r=.7)*.3),(.08,voice('call-'+name[5:]))))
# --- Reactions (Z-13): one big sound for each of the ten ---
S['react-inferno']=mix((0,lowpass(noise(1.1,a=.05,r=.7),1200)*.9),(0,crackle(1.,60)*.6),(0,tone(90,1.,60,'saw',r=.6)*.3))
S['react-shatter']=mix((0,highpass(noise(.5,r=.25),3500)*.8),*[(i*.03,tone(f,.6,r=.35)*.25) for i,f in enumerate([2093,2637,3136,3951,4699])])
S['react-overload']=mix((0,lowpass(tone(110,.8,55,'square',r=.6),3000)*.45),(0,highpass(crackle(.7,900),2000)*.8),(0,tone(1800,.25,300,'saw',r=.25)*.3))
S['react-freeze']=echo(mix(*[(i*.05,tone(f,.8,f*.94,r=.6)*.25) for i,f in enumerate([2349,1976,1568,1319,1047])],(0,highpass(noise(.7,a=.1,r=.6),6000)*.2)))
S['react-rot']=mix((0,lowpass(noise(1.,a=.1,r=.7),400)*.9),*[(i*.11,tone(200+60*i,.15,90,r=.15)*.35) for i in range(8)])
S['react-collapse']=mix((0,tone(70,1.4,28,r=.9)*.9),(0,lowpass(noise(1.3,r=.8),300)*.9),(.25,lowpass(noise(.9,r=.6),180)*.6))
S['react-purge']=echo(mix((0,chord([N(72),N(76),N(79),N(83),N(86)],1.4,r=.9)*.7),(0,tone(400,1.2,3200,'tri',r=.8)*.2),(0,highpass(noise(1.,a=.4,r=.7),5000)*.12)))
S['react-eclipse']=mix((0,rev(lowpass(noise(1.,r=.8),900))*.6),(0,rev(chord([N(48),N(51),N(55)],1.,'saw',r=.9))*.4),(.95,tone(60,.6,35,r=.5)*.8))
S['react-cauterise']=mix((0,highpass(noise(.9,a=.02,r=.6),2500)*.5),(0,crackle(.9,250)*.5),(0,tone(300,.6,80,'saw',r=.5)*.3),(0,lowpass(noise(.3,r=.2),700)*.5))
S['react-frostbite']=mix((0,highpass(noise(.15,r=.08),2500)*.9),(.03,tone(3520,.5,2637,r=.4)*.3),(.05,highpass(noise(.8,a=.1,r=.7),7000)*.25),(0,tone(120,.3,60,r=.25)*.4))

def save(name,x):
    x=x/max(1e-9,np.abs(x).max())*.89  # peak at about -1 dBFS
    fade=int(SR*.01);x[-fade:]*=np.linspace(1,0,fade)
    p=RAW/f'{name}.wav'
    with wave.open(str(p),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((x*32767).astype(np.int16).tobytes())
    subprocess.run(['afconvert','-f','m4af','-d','aac','-b','96000',str(p),str(OUT/f'sfx-{name}.m4a')],check=True)
if __name__=='__main__':
    for k,v in S.items():save(k,v);print(f'sfx-{k}.m4a  {len(v)/SR:.2f}s')
