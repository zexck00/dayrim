#!/usr/bin/env python3
"""Builds the playable page: dayrim.html.

By default pictures and sounds are written as separate files in assets/, each named with a short
content hash, and the page only links to them. The page stays small, the menu appears as soon as the
code arrives, and browsers cache the assets for good (a changed file gets a new name).

    python3 tools/build.py            page + assets/ (what the server and Docker image use)
    python3 tools/build.py --inline   one self-contained file, dayrim-inline.html, everything embedded
"""
import base64,hashlib,json,sys
from pathlib import Path
root=Path(__file__).resolve().parent.parent
INLINE='--inline' in sys.argv
out_dir=root/'assets'
MIME={'.webp':'image/webp','.jpg':'image/jpeg','.mp4':'video/mp4','.m4a':'audio/mp4','.mp3':'audio/mpeg','.wav':'audio/wav','.js':'text/javascript'}
used=set()

def asset(path,name=None):
    """A URL for one file: a data URL when inlining, otherwise a hashed copy in assets/."""
    b=path.read_bytes()
    if INLINE:return f'data:{MIME[path.suffix]};base64,'+base64.b64encode(b).decode()
    safe=''.join(c if c.isalnum() or c in '-_' else '-' for c in (name or path.stem))
    fn=f'{safe}.{hashlib.sha1(b).hexdigest()[:10]}{path.suffix}'
    used.add(fn);t=out_dir/fn
    if not t.exists():t.write_bytes(b)
    return 'assets/'+fn

if not INLINE:out_dir.mkdir(exist_ok=True)
cast=json.load(open(root/'sprites/cast.json'))
atlas_p=root/'sprites/dayrim-cast.webp';atlas=atlas_p.read_bytes()
w=int.from_bytes(atlas[24:27],'little')+1 if atlas[12:16]==b'VP8X' else None
h=int.from_bytes(atlas[27:30],'little')+1 if w else None
assert w and h,'expected an extended WebP atlas'
J=lambda o:json.dumps(o,separators=(',',':'))
data=f'const ATLAS_URL={J(asset(atlas_p,"cast"))};\nconst CAST={J(cast)},AW={w},AH={h};\n'
vo=root/'sprites'/'voice'
data+='const VOICE_CLIPS='+J({f.stem:asset(f,'voice-'+f.stem) for f in sorted(vo.glob('*.wav'))})+';\n'
sx=root/'sprites'/'sfx'
clips=[('menu','menu.m4a'),('titleSong','title-song.m4a'),('heroBrowse','hero-browse.m4a'),('villainBrowse','villain-browse.mp3'),('ambA','ambience-a.m4a'),('ambB','ambience-b.m4a')]+[(f.stem.replace('-','_'),f.name) for p in ('step-','an-','sfx-','mus-') for f in sorted(sx.glob(p+'*.m4a'))]
data+='const SOUND_CLIPS='+J({k:asset(sx/f) for k,f in clips})+';\n'
ti=root/'sprites'/'title'
# poster: the title screen and the modes screen · story, quick: the modes screen behind each mode · warzone: the clip played on Warzone
data+='const TITLE_URLS='+J({k:asset(ti/f,'title-'+k) for k,f in [('poster','poster.jpg'),('words','words.webp'),('stone','stone.webp'),('story','story.jpg'),('quick','quick.jpg'),('warzone','warzone.mp4')]})+';\n'
data+='const CARD_ART='+J({'Patriot':asset(root/'sprites'/'hero-cards'/'falcon-ex.jpg','card-falcon-ex')})+';\n'
data+='const THREE_LAYER_URL='+J(asset(root/'vendor'/'three-layer.js','three-layer'))+';\n'
# The modes screen shows the version and the changelog, both read from the repository root
repo=root.parent
data+='const GAME_VERSION='+J((repo/'VERSION').read_text().strip())+';\n'
data+='const CHANGELOG_MD='+J((repo/'CHANGELOG.md').read_text())+';\n'
js=data+''.join((root/'src'/f).read_text()+'\n' for f in ['rig.js','game.js','render.js','story-map.js','story-data.js','story.js','net.js','effects3d.js','ui.js'])
page=(root/'src/page.html').read_text()
assert '/*GAME*/' in page
out=page.replace('/*GAME*/','(()=>{\n"use strict";\n'+js+'})();')
target=root/('dayrim-inline.html' if INLINE else 'dayrim.html')
target.write_text(out)
if not INLINE:
    # Remove assets the page no longer links to, so old versions don't pile up
    for f in out_dir.iterdir():
        if f.name not in used:f.unlink()
    size=sum((out_dir/f).stat().st_size for f in used)
    print(f'built {target.name} {len(out)//1024} KB, plus {len(used)} files in assets/ ({size//1024} KB, loaded as needed)')
else:print(f'built {target.name} {len(out)//1024} KB (everything inline)')
