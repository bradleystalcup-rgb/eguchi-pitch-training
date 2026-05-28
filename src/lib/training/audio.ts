export type ChordQuality = "major" | "minor" | "dominant7" | "major7" | "minor7";

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

type ToneModule = typeof import("tone");
type TonePolySynth = InstanceType<ToneModule["PolySynth"]>;

const chordIntervals: Record<ChordQuality, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dominant7: [0, 4, 7, 10],
  major7: [0, 4, 7, 11],
  minor7: [0, 3, 7, 10],
};

let toneModulePromise: Promise<ToneModule> | undefined;
let synth: TonePolySynth | undefined;
const DEFAULT_RELEASE_MS = 900;

async function loadTone() {
  if (typeof window === "undefined") {
    throw new Error("Chord playback is only available in the browser.");
  }

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

function waitForPlayback(Tone: ToneModule, duration: string) {
  const durationMs = Tone.Time(duration).toMilliseconds();
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, Math.max(500, durationMs + DEFAULT_RELEASE_MS));
  });
}

export async function playChord({
  root,
  quality = "major",
  duration = "1.2n",
  velocity = 0.72,
}: ChordPlaybackOptions) {
  const { Tone, synth: playableSynth } = await getSynth();
  const notes = chordIntervals[quality].map((interval) =>
    Tone.Frequency(root).transpose(interval).toNote(),
  );

  playableSynth.triggerAttackRelease(notes, duration, Tone.now(), velocity);
  await waitForPlayback(Tone, duration);
}

export async function playNotesChord({
  notes,
  duration = "1.2n",
  velocity = 0.72,
}: NoteChordPlaybackOptions) {
  const { Tone, synth: playableSynth } = await getSynth();
  playableSynth.triggerAttackRelease(notes, duration, Tone.now(), velocity);
  await waitForPlayback(Tone, duration);
}

export function getChordNotes(root: string, quality: ChordQuality = "major") {
  return chordIntervals[quality].map((interval) => ({ root, interval }));
}

export function disposeChordPlayer() {
  synth?.dispose();
  synth = undefined;
}
