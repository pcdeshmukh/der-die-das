import { effect, signal } from '@preact/signals';
import type { LevelId } from '../data/types';
import { review, statKey, type Skill, type WordStat } from './srs';

export type UiLang = 'en' | 'de' | 'es';
/** Language for meanings and translations of German content. */
export type HintLang = 'en' | 'es';

export const UI_LANGS: UiLang[] = ['en', 'de', 'es'];

export interface Settings {
  uiLang: UiLang;
  hintLang: HintLang;
  sound: boolean;
  speech: boolean;
  showHint: boolean;
}

export interface Streak {
  count: number;
  lastDay: string | null;
}

export interface DailyResult {
  correct: number;
  total: number;
}

export interface Progress {
  xp: number;
  /** the level the player last opened; the daily challenge uses it */
  level: LevelId;
  /** days in a row with at least one finished round */
  streak: Streak;
  daily: { results: Record<string, DailyResult>; streak: Streak };
  /** keyed by statKey(skill, wordId) */
  words: Record<string, WordStat>;
  /** best stars per `${level}/${topic}/${mode}` */
  stars: Record<string, number>;
  settings: Settings;
}

const STORAGE_KEY = 'der-die-das:v1';

function defaults(): Progress {
  const browser = typeof navigator !== 'undefined' ? (navigator.language ?? '').toLowerCase() : '';
  const es = browser.startsWith('es');
  return {
    xp: 0,
    level: 'A1',
    streak: { count: 0, lastDay: null },
    daily: { results: {}, streak: { count: 0, lastDay: null } },
    words: {},
    stars: {},
    settings: {
      uiLang: browser.startsWith('de') ? 'de' : es ? 'es' : 'en',
      hintLang: es ? 'es' : 'en',
      sound: true,
      speech: true,
      showHint: true,
    },
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

/** English and Spanish menus also switch translations; German menus keep the chosen translation language. */
export function setUiLang(uiLang: UiLang) {
  updateSettings(uiLang === 'de' ? { uiLang } : { uiLang, hintLang: uiLang });
}

export function setCurrentLevel(level: LevelId) {
  if (progress.peek().level !== level) progress.value = { ...progress.peek(), level };
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

export const today = () => dayString(new Date());

/** A streak still counts if it was extended today or yesterday. */
function streakCount({ count, lastDay }: Streak): number {
  return lastDay === today() || lastDay === yesterday() ? count : 0;
}

function extend(s: Streak): Streak {
  const day = today();
  return s.lastDay === day ? s : { count: s.lastDay === yesterday() ? s.count + 1 : 1, lastDay: day };
}

export const currentStreak = (p: Progress) => streakCount(p.streak);
export const dailyStreak = (p: Progress) => streakCount(p.daily.streak);

export function finishRound(starKey: string | null, stars: number, xp: number) {
  const p = progress.value;
  const best = { ...p.stars };
  if (starKey) best[starKey] = Math.max(best[starKey] ?? 0, stars);
  progress.value = { ...p, xp: p.xp + xp, streak: extend(p.streak), stars: best };
}

/** Saves today's challenge (first attempt only) and pays the completion bonus. */
export function finishDaily(day: string, result: DailyResult, bonusXp: number) {
  const p = progress.value;
  if (p.daily.results[day]) return;
  progress.value = {
    ...p,
    xp: p.xp + bonusXp,
    daily: { results: { ...p.daily.results, [day]: result }, streak: extend(p.daily.streak) },
  };
}

export function resetProgress() {
  progress.value = { ...defaults(), settings: progress.value.settings };
}
