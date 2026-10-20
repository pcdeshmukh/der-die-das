// Tiny synthesized sound effects: no audio files to download.
import { progress } from './store';

let ctx: AudioContext | null = null;

function play(notes: [freq: number, start: number, dur: number][], type: OscillatorType = 'sine') {
  if (!progress.value.settings.sound) return;
  try {
    ctx ??= new AudioContext();
    const t0 = ctx.currentTime;
    for (const [freq, start, dur] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0 + start);
      gain.gain.exponentialRampToValueAtTime(0.15, t0 + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0 + start);
      osc.stop(t0 + start + dur + 0.02);
    }
  } catch {
    // audio unavailable
  }
}

export const playCorrect = () => play([[660, 0, 0.12], [880, 0.08, 0.18]]);
export const playWrong = () => play([[220, 0, 0.25]], 'triangle');
export const playFinish = () => play([[523, 0, 0.15], [659, 0.12, 0.15], [784, 0.24, 0.3]]);
