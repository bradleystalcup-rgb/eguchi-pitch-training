# Salamander Piano Samples

This directory contains the pinned piano sample set used by the `sampled` sound engine.

Source package:

- Package: `@audio-samples/piano-mp3-velocity4`
- Version: `1.0.5`
- CDN: `https://cdn.jsdelivr.net/npm/@audio-samples/piano-mp3-velocity4@1.0.5/audio/`
- Original samples: Salamander Grand Piano by Alexander Holm
- License: Creative Commons Attribution 3.0

Attribution:

```txt
Piano samples are derived from Salamander Grand Piano by Alexander Holm,
used under Creative Commons Attribution 3.0.
```

Run `./download.sh` from this directory to refresh the MP3 files.

The app uses these files as anchor samples and pitch-shifts from the nearest
anchor note at playback time. If a sample is missing or cannot be decoded, the
sampled engine falls back to the native Web Audio synth engine.
