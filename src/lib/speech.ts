import { progress } from './store';

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

let voice: SpeechSynthesisVoice | null = null;
/** A second German voice for the other speaker in a dialogue, if the device has one. */
let otherVoice: SpeechSynthesisVoice | null = null;

// Apple's character voices ("Grandpa", "Rocko"…) exist for German too; they make odd dialogue partners.
const NOVELTY = /\b(Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley)\b/;

function pickVoice() {
  const voices = speechSynthesis.getVoices();
  const german = voices.filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith('de'));
  voice = german.find((v) => v.lang === 'de-DE' && v.localService) ?? german.find((v) => v.lang === 'de-DE') ?? german[0] ?? null;
  const others = german.filter((v) => v !== voice && !NOVELTY.test(v.name));
  otherVoice = others.find((v) => v.localService) ?? others[0] ?? null;
}

if (speechSupported) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export const hasGermanVoice = () => voice !== null;

// Chrome drops the end event of an utterance that gets garbage-collected, so hold on to each one until it ends.
const inFlight = new Set<SpeechSynthesisUtterance>();

/** Queues one utterance; resolves once it has been read or cut off. */
function utter(text: string, speaker: 1 | 2): Promise<void> {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  const v = speaker === 2 ? (otherVoice ?? voice) : voice;
  if (v) u.voice = v;
  u.rate = 0.9;
  // With a single voice, the second speaker still sounds like someone else.
  if (speaker === 2 && !otherVoice) u.pitch = 0.7;
  inFlight.add(u);
  return new Promise((resolve) => {
    const done = () => {
      inFlight.delete(u);
      resolve();
    };
    u.onend = u.onerror = done;
    // Some engines never report the end; don't keep a game waiting on them for ever.
    setTimeout(done, 1000 + text.length * 100);
    speechSynthesis.speak(u);
  });
}

/** Reads `text` aloud. Resolves once it has been read (or cut off), straight away when nothing is read. */
export function speak(text: string, force = false): Promise<void> {
  if (!speechSupported || (!force && !progress.value.settings.speech)) return Promise.resolve();
  speechSynthesis.cancel();
  return utter(text, 1);
}

export interface Playback {
  /** resolves when the last line has been read, or after stop() */
  done: Promise<void>;
  stop: () => void;
}

/**
 * Reads a recording line by line, speaker 2 in a second voice. Exam recordings are read even when
 * "Read German words aloud" is off, since the task is to listen.
 */
export function speakLines(lines: { de: string; who?: 1 | 2 }[]): Playback {
  let stopped = !speechSupported;
  const done = (async () => {
    if (stopped) return;
    speechSynthesis.cancel();
    for (const line of lines) {
      if (stopped) return;
      await utter(line.de, line.who ?? 1);
      await new Promise((resolve) => setTimeout(resolve, 450));
    }
  })();
  return {
    done,
    stop() {
      stopped = true;
      if (speechSupported) speechSynthesis.cancel();
    },
  };
}

/** Calls `then` once `reading` has finished and at least `ms` have passed. Returns a cancel function for effects. */
export function afterReading(reading: Promise<void>, ms: number, then: () => void): () => void {
  let cancelled = false;
  const pause = new Promise((resolve) => setTimeout(resolve, ms));
  Promise.all([reading, pause]).then(() => cancelled || then());
  return () => {
    cancelled = true;
  };
}
