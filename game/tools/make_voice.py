#!/usr/bin/env python3
"""Records the announcer lines with the macOS 'say' voice into sprites/voice/*.wav (16 kHz mono)."""
import subprocess,sys,re
from pathlib import Path
O=Path(__file__).resolve().parent.parent/'sprites'/'voice';O.mkdir(parents=True,exist_ok=True)
V=sys.argv[1] if len(sys.argv)>1 else 'Daniel'
L=['Double Kill','Triple Kill','Quad Kill','Killing Spree','Rampage','Massacre','Unstoppable','Godlike','Legendary','Ultimate ready','Earthshatter','Bullet Storm','Cataclysm','Aegis Nova','Judgment Light','Army of the Dead','Event Horizon','Plague Bloom']
for t in L:
    s=re.sub(r'\W+','-',t.lower());a=O/(s+'.aiff');w=O/(s+'.wav')
    subprocess.run(['say','-v',V,'-r','165','-o',str(a),'[[pbas 35]] '+t+'!'],check=True)
    subprocess.run(['afconvert','-f','WAVE','-d','LEI16@16000','-c','1',str(a),str(w)],check=True);a.unlink()
print(len(L),'lines',sum(f.stat().st_size for f in O.glob('*.wav'))//1024,'KB')
