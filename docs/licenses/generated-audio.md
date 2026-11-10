# Generated sounds and the free announcer voice

Recorded 2026-11-10.

## Sound effects made from scratch

`game/tools/make_audio.py` builds every file in `ASSETS/audio/generated/` (and its copy `game/sprites/sfx/sfx-*.m4a`) from tones, noise and envelopes in code. No samples, loops or recordings from anyone else are used, so the files are original to Dayrim and need no outside license.

Files: downed, revive start, revive tick, revive done, ping, link open, Duo, Trio and Full Party links, and the ten reactions (Inferno, Shatter, Overload, Freeze, Rot, Collapse, Purge, Eclipse, Cauterise, Frostbite).

## Free announcer voice

The voice lines in `game/sprites/voice/` and `ASSETS/audio/free-voice/` (and the spoken calls inside the link sounds) are made with `game/tools/make_free_voice.py`:

| Part | Source | License |
|---|---|---|
| Voice model | Piper voice `en_US-ljspeech-high` (huggingface.co/rhasspy/piper-voices) | Trained only on the LJ Speech dataset, which is **public domain** (keithito.com/LJ-Speech-Dataset) |
| Model runner | onnxruntime | MIT |
| Pronunciation | espeak-ng, run as a separate tool | GPL-3.0 for the program; the speech it helps produce is not covered by the GPL |

These replace the earlier macOS voice lines, which were not cleared for commercial use.
