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

export function speak(text: string, force = false) {
  if (!speechSupported || (!force && !progress.value.settings.speech)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  if (voice) u.voice = voice;
  u.rate = 0.9;
  speechSynthesis.speak(u);
}
