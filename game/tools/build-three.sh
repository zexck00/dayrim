#!/bin/sh
# Bundles the Pixel 3D modules (game/three/*.js + Three.js) into game/vendor/three-world.js.
# Run after changing anything in game/three/, then run python3 game/tools/build.py and commit both.
set -e
cd "$(dirname "$0")/../.."
npx --yes esbuild@0.28.2 game/three/world.js --bundle --format=esm --minify --target=es2020 --legal-comments=none --outfile=game/vendor/three-world.js
