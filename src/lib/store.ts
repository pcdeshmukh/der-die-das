import { effect, signal } from '@preact/signals';
import { review, statKey, type Skill, type WordStat } from './srs';

export type UiLang = 'en' | 'de';

export interface Settings {
  uiLang: UiLang;
  sound: boolean;
  speech: boolean;
  showHint: boolean;
}

export interface Progress {
  xp: number;
  streak: { count: number; lastDay: string | null };
  /** keyed by statKey(skill, wordId) */
  words: Record<string, WordStat>;
  /** best stars per `${level}/${topic}/${mode}` */
  stars: Record<string, number>;
  settings: Settings;
}

const STORAGE_KEY = 'der-die-das:v1';

function defaults(): Progress {
  const de = typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('de');
  return {
    xp: 0,
    streak: { count: 0, lastDay: null },
    words: {},
    stars: {},
    settings: { uiLang: de ? 'de' : 'en', sound: true, speech: true, showHint: true },
  };
}

function load(): Progress {
  const base = defaults();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Progress>;
      return { ...base, ...saved, settings: { ...base.settings, ...saved.settings } };
    }
  } catch {
    // private mode or corrupt data: start fresh
  }
  return base;
}

export const progress = signal<Progress>(load());

effect(() => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress.value));
  } catch {
    // storage unavailable: progress lasts for this session only
  }
});

export function updateSettings(patch: Partial<Settings>) {
  progress.value = { ...progress.value, settings: { ...progress.value.settings, ...patch } };
}

export function recordAnswer(skill: Skill, wordId: string, correct: boolean) {
  const p = progress.value;
  const key = statKey(skill, wordId);
  progress.value = { ...p, words: { ...p.words, [key]: review(p.words[key], correct) } };
}

function dayString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayString(d);
}

/** Streak still counts if the last round was played today or yesterday. */
export function currentStreak(p: Progress): number {
  const { count, lastDay } = p.streak;
  return lastDay === dayString(new Date()) || lastDay === yesterday() ? count : 0;
}

export function finishRound(starKey: string | null, stars: number, xp: number) {
  const p = progress.value;
  const today = dayString(new Date());
  const streak =
    p.streak.lastDay === today
      ? p.streak
      : { count: p.streak.lastDay === yesterday() ? p.streak.count + 1 : 1, lastDay: today };
  const best = { ...p.stars };
  if (starKey) best[starKey] = Math.max(best[starKey] ?? 0, stars);
  progress.value = { ...p, xp: p.xp + xp, streak, stars: best };
}

export function resetProgress() {
  progress.value = { ...defaults(), settings: progress.value.settings };
}
