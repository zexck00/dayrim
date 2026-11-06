#!/bin/sh
# Converts the owner's sound files in ../ASSETS/audio into small copies the game embeds (macOS afconvert).
# The originals are never changed. Run from the game folder: sh tools/make_sfx.sh
set -e
A=../ASSETS/audio; O=sprites/sfx; mkdir -p "$O"
afconvert -f m4af -d aac -b 96000 "$A/menu.ogg" "$O/menu.m4a"
afconvert -f m4af -d aac -s 0 -b 128000 "$A/heroes browse.wav" "$O/hero-browse.m4a"
cp "$A/villians browse.mp3" "$O/villain-browse.mp3"
ls -l "$O"
# In-game background: two ambience tracks the game layers and loops together
afconvert -f m4af -d aac -b 64000 "$A/game ambience.mp3" "$O/ambience-a.m4a"
afconvert -f m4af -d aac -b 80000 "$A/game ambience half volume.ogg" "$O/ambience-b.m4a"
ls -l "$O"/ambience-*
# Footsteps: one mono copy per take, named step-<surface>-<n>.m4a
for f in "$A"/step*_*.wav; do b=$(basename "$f" .wav); s=${b%_*}; s=${s#step}; n=${b##*_}; afconvert -f m4af -d aac -c 1 -s 0 -b 96000 "$f" "$O/step-$s-$n.m4a"; done
ls "$O"/step-* | wc -l
# Announcer lines (mono), heal and melee effects (mono), and boss music (stereo)
an(){ afconvert -f m4af -d aac -c 1 -s 0 -b 64000 "$A/$1" "$O/an-$2.m4a"; }
an "start game.wav" start; an "boss fight 2.wav" boss-fight; an "boss defeated 1.wav" boss-defeated
an "villian:hero dead.wav" rival-down; an "dead 2.wav" you-down; an "friends down.wav" friend-down
an "all friends dead.wav" friends-all-down; an "all dead.wav" all-down
for i in 1 2 3 4 5 6 7 8 9; do an "kill $i.wav" kill-$i; done
for i in 1 2 3; do afconvert -f m4af -d aac -c 1 -s 0 -b 96000 "$A/heal $i.aif" "$O/sfx-heal-$i.m4a"; done
T=$(mktemp -d)  # FLAC goes through a plain WAV first; afconvert cannot remix it straight to mono AAC
for i in 1 2; do afconvert -f WAVE -d LEI16@44100 -c 1 "$A/melee $i.flac" "$T/m$i.wav"; afconvert -f m4af -d aac -s 0 -b 96000 "$T/m$i.wav" "$O/sfx-melee-$i.m4a"; done
afconvert -f m4af -d aac -c 1 -s 0 -b 96000 "$A/melee 3.wav" "$O/sfx-melee-3.m4a"
afconvert -f m4af -d aac -b 80000 "$A/boss enter.mp3" "$O/mus-boss.m4a"
afconvert -f WAVE -d LEI16@44100 "$A/when boss not defeatede yet 1 minute.flac" "$T/late.wav"; afconvert -f m4af -d aac -b 72000 "$T/late.wav" "$O/mus-boss-late.m4a"; rm -r "$T"
du -ch "$O"/an-* "$O"/sfx-* "$O"/mus-* | tail -1
