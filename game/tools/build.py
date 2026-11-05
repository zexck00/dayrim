#!/usr/bin/env python3
"""Packs src/page.html, the JS sources and the sprite atlas into one playable file: dayrim.html"""
import base64,json,sys
from pathlib import Path
root=Path(__file__).resolve().parent.parent
cast=json.load(open(root/'sprites/cast.json'))
atlas=(root/'sprites/dayrim-cast.webp').read_bytes()
w=int.from_bytes(atlas[24:27],'little')+1 if atlas[12:16]==b'VP8X' else None
h=int.from_bytes(atlas[27:30],'little')+1 if w else None
assert w and h,'expected an extended WebP atlas'
data=f'const ATLAS_URL="data:image/webp;base64,{base64.b64encode(atlas).decode()}";\nconst CAST={json.dumps(cast,separators=(",",":"))},AW={w},AH={h};\n'
mv=root/'sprites'/'moves'
data+='const MOVES='+(mv/'moves.json').read_text()+';\nconst MOVE_URLS={'+','.join(k+':"data:image/webp;base64,'+base64.b64encode((mv/f'{k}.webp').read_bytes()).decode()+'"' for k in ['necro','toxic','void'])+'};\n'
vo=root/'sprites'/'voice'
data+='const VOICE_CLIPS={'+','.join('"'+f.stem+'":"'+base64.b64encode(f.read_bytes()).decode()+'"' for f in sorted(vo.glob('*.wav')))+'};\n'
js=data+''.join((root/'src'/f).read_text()+'\n' for f in ['rig.js','game.js','render.js','net.js','ui.js'])
page=(root/'src/page.html').read_text()
assert '/*GAME*/' in page
out=page.replace('/*GAME*/','(()=>{\n"use strict";\n'+js+'})();')
(root/'dayrim.html').write_text(out)
print('built dayrim.html',len(out)//1024,'KB')
