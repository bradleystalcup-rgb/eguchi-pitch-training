export type ChordQuality = "major" | "minor" | "dominant7" | "major7" | "minor7";
export type SoundEngineKind = "tone" | "native-synth" | "sampled";

export type ChordPlaybackOptions = {
  root: string;
  quality?: ChordQuality;
  duration?: string;
  velocity?: number;
};

export type NoteChordPlaybackOptions = {
  notes: string[];
  duration?: string;
  velocity?: number;
};

export type SoundEngine = {
  kind: SoundEngineKind;
  playNotesChord(options: NoteChordPlaybackOptions): Promise<void>;
  playChord(options: ChordPlaybackOptions): Promise<void>;
  dispose?(): void;
};

type ToneModule = typeof import("tone");
type TonePolySynth = InstanceType<ToneModule["PolySynth"]>;

const chordIntervals: Record<ChordQuality, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dominant7: [0, 4, 7, 10],
  major7: [0, 4, 7, 11],
  minor7: [0, 3, 7, 10],
};

const DEFAULT_DURATION = "1.2n";
const DEFAULT_DURATION_MS = 1200;
const DEFAULT_RELEASE_MS = 900;
const DEFAULT_VELOCITY = 0.72;
const pitchOffsets: Record<string, number> = {
  C: 0,
  "C#": 1,
  DB: 1,
  D: 2,
  "D#": 3,
  EB: 3,
  E: 4,
  F: 5,
  "F#": 6,
  GB: 6,
  G: 7,
  "G#": 8,
  AB: 8,
  A: 9,
  "A#": 10,
  BB: 10,
  B: 11,
};

let defaultEngineKind: SoundEngineKind = "tone";
let activeEngine: SoundEngine | undefined;

function requireBrowser() {
  if (typeof window === "undefined") {
    throw new Error("Chord playback is only available in the browser.");
  }
}

function playbackMs(duration = DEFAULT_DURATION) {
  if (duration.endsWith("ms")) return Number.parseFloat(duration);
  if (duration.endsWith("s")) return Number.parseFloat(duration) * 1000;
  return DEFAULT_DURATION_MS;
}

function waitForPlayback(duration = DEFAULT_DURATION) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, Math.max(500, playbackMs(duration) + DEFAULT_RELEASE_MS));
  });
}

function normalizeNote(note: string) {
  return note.trim().replace("♯", "#").replace("♭", "b").toUpperCase();
}

function noteToMidi(note: string) {
  const match = normalizeNote(note).match(/^([A-G](?:#|B)?)(-?\d+)$/);
  if (!match) return undefined;

  const [, pitch, octave] = match;
  const offset = pitchOffsets[pitch];
  if (offset === undefined) return undefined;

  return (Number(octave) + 1) * 12 + offset;
}

function midiToFrequency(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12);
}

function transposeNote(root: string, interval: number) {
  const midi = noteToMidi(root);
  if (midi === undefined) return root;
  return midiToNote(midi + interval);
}

function midiToNote(midi: number) {
  const pitchNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return `${pitchNames[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

function notesForChord(root: string, quality: ChordQuality) {
  return chordIntervals[quality].map((interval) => transposeNote(root, interval));
}

function createNativeSynthEngine(): SoundEngine {
  let audioContext: AudioContext | undefined;

  function getAudioContext() {
    requireBrowser();
    audioContext ??= new AudioContext();
    return audioContext;
  }

  async function playNotesChord({
    notes,
    duration = DEFAULT_DURATION,
    velocity = DEFAULT_VELOCITY,
  }: NoteChordPlaybackOptions) {
    const context = getAudioContext();
    await context.resume();

    const start = context.currentTime;
    const playSeconds = playbackMs(duration) / 1000;
    const releaseSeconds = DEFAULT_RELEASE_MS / 1000;

    for (const note of notes) {
      const midi = noteToMidi(note);
      if (midi === undefined) continue;

      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.value = midiToFrequency(midi);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, velocity * 0.08), start + 0.03);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, velocity * 0.04), start + playSeconds);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + playSeconds + releaseSeconds);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + playSeconds + releaseSeconds);
    }

    await waitForPlayback(duration);
  }

  return {
    kind: "native-synth",
    playNotesChord,
    playChord({ root, quality = "major", duration, velocity }: ChordPlaybackOptions) {
      return playNotesChord({ notes: notesForChord(root, quality), duration, velocity });
    },
    dispose() {
      void audioContext?.close();
      audioContext = undefined;
    },
  };
}

function createSampledEngine(): SoundEngine {
  const fallbackEngine = createNativeSynthEngine();
  let audioContext: AudioContext | undefined;
  const samplePromises = new Map<string, Promise<AudioBuffer>>();

  function getAudioContext() {
    requireBrowser();
    audioContext ??= new AudioContext();
    return audioContext;
  }

  function sampleUrl(note: string) {
    return `/audio/piano/${encodeURIComponent(note.replace("#", "sharp"))}.mp3`;
  }

  async function loadSample(note: string) {
    const context = getAudioContext();
    const normalized = note.replace("♯", "#");
    const existing = samplePromises.get(normalized);
    if (existing) return existing;

    const nextPromise = fetch(sampleUrl(normalized))
      .then((response) => {
        if (!response.ok) throw new Error(`Missing sample for ${normalized}`);
        return response.arrayBuffer();
      })
      .then((buffer) => context.decodeAudioData(buffer));

    samplePromises.set(normalized, nextPromise);
    return nextPromise;
  }

  async function playNotesChord(options: NoteChordPlaybackOptions) {
    const context = getAudioContext();
    await context.resume();

    try {
      const buffers = await Promise.all(options.notes.map(loadSample));
      const start = context.currentTime;

      for (const buffer of buffers) {
        const source = context.createBufferSource();
        const gain = context.createGain();

        source.buffer = buffer;
        gain.gain.value = options.velocity ?? DEFAULT_VELOCITY;
        source.connect(gain);
        gain.connect(context.destination);
        source.start(start);
        source.stop(start + playbackMs(options.duration) / 1000);
      }

      await waitForPlayback(options.duration);
    } catch {
      await fallbackEngine.playNotesChord(options);
    }
  }

  return {
    kind: "sampled",
    playNotesChord,
    playChord({ root, quality = "major", duration, velocity }: ChordPlaybackOptions) {
      return playNotesChord({ notes: notesForChord(root, quality), duration, velocity });
    },
    dispose() {
      void audioContext?.close();
      audioContext = undefined;
      fallbackEngine.dispose?.();
      samplePromises.clear();
    },
  };
}

function createToneEngine(): SoundEngine {
  let toneModulePromise: Promise<ToneModule> | undefined;
  let synth: TonePolySynth | undefined;

  async function loadTone() {
    requireBrowser();
    toneModulePromise ??= import("tone");
    return toneModulePromise;
  }

  async function getSynth() {
    const Tone = await loadTone();
    await Tone.start();

    if (!synth) {
      synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle8" },
        envelope: {
          attack: 0.03,
          decay: 0.18,
          sustain: 0.42,
          release: 0.9,
        },
      }).toDestination();

      synth.volume.value = -10;
    }

    return { Tone, synth };
  }

  return {
    kind: "tone",
    async playChord({
      root,
      quality = "major",
      duration = DEFAULT_DURATION,
      velocity = DEFAULT_VELOCITY,
    }: ChordPlaybackOptions) {
      const { Tone, synth: playableSynth } = await getSynth();
      const notes = chordIntervals[quality].map((interval) =>
        Tone.Frequency(root).transpose(interval).toNote(),
      );

      playableSynth.triggerAttackRelease(notes, duration, Tone.now(), velocity);
      await waitForPlayback(duration);
    },
    async playNotesChord({
      notes,
      duration = DEFAULT_DURATION,
      velocity = DEFAULT_VELOCITY,
    }: NoteChordPlaybackOptions) {
      const { Tone, synth: playableSynth } = await getSynth();
      playableSynth.triggerAttackRelease(notes, duration, Tone.now(), velocity);
      await waitForPlayback(duration);
    },
    dispose() {
      synth?.dispose();
      synth = undefined;
    },
  };
}

export function createSoundEngine(kind: SoundEngineKind): SoundEngine {
  if (kind === "native-synth") return createNativeSynthEngine();
  if (kind === "sampled") return createSampledEngine();
  return createToneEngine();
}

export function setDefaultSoundEngine(kind: SoundEngineKind) {
  if (defaultEngineKind === kind) return;
  defaultEngineKind = kind;
  activeEngine?.dispose?.();
  activeEngine = undefined;
}

export function getDefaultSoundEngine() {
  activeEngine ??= createSoundEngine(defaultEngineKind);
  return activeEngine;
}

export async function playChord(options: ChordPlaybackOptions) {
  await getDefaultSoundEngine().playChord(options);
}

export async function playNotesChord(options: NoteChordPlaybackOptions) {
  await getDefaultSoundEngine().playNotesChord(options);
}

export function getChordNotes(root: string, quality: ChordQuality = "major") {
  return chordIntervals[quality].map((interval) => ({ root, interval }));
}

export function disposeChordPlayer() {
  activeEngine?.dispose?.();
  activeEngine = undefined;
}
