#!/bin/sh
# Converts the owner's sound files in ../ASSETS/audio into small copies the game embeds (macOS afconvert).
# The originals are never changed. Run from the game folder: sh tools/make_sfx.sh
set -e
A=../ASSETS/audio; O=sprites/sfx; mkdir -p "$O"
afconvert -f m4af -d aac -b 96000 "$A/menu.ogg" "$O/menu.m4a"
afconvert -f m4af -d aac -s 0 -b 128000 "$A/heroes browse.wav" "$O/hero-browse.m4a"
cp "$A/villians browse.mp3" "$O/villain-browse.mp3"
ls -l "$O"
