import { progress } from './store';

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

let voice: SpeechSynthesisVoice | null = null;

function pickVoice() {
  const voices = speechSynthesis.getVoices();
  const german = voices.filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith('de'));
  voice = german.find((v) => v.lang === 'de-DE' && v.localService) ?? german.find((v) => v.lang === 'de-DE') ?? german[0] ?? null;
}

if (speechSupported) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export const hasGermanVoice = () => voice !== null;

// Chrome drops the end event of an utterance that gets garbage-collected, so hold on to each one until it ends.
const inFlight = new Set<SpeechSynthesisUtterance>();

/** Reads `text` aloud. Resolves once it has been read (or cut off), straight away when nothing is read. */
export function speak(text: string, force = false): Promise<void> {
  if (!speechSupported || (!force && !progress.value.settings.speech)) return Promise.resolve();
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  if (voice) u.voice = voice;
  u.rate = 0.9;
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

/** Calls `then` once `reading` has finished and at least `ms` have passed. Returns a cancel function for effects. */
export function afterReading(reading: Promise<void>, ms: number, then: () => void): () => void {
  let cancelled = false;
  const pause = new Promise((resolve) => setTimeout(resolve, ms));
  Promise.all([reading, pause]).then(() => cancelled || then());
  return () => {
    cancelled = true;
  };
}
