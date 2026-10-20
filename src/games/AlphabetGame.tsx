import { useState } from 'preact/hooks';
import { t } from '../lib/i18n';
import { shuffle } from '../lib/random';
import { speak } from '../lib/speech';
import { ChoiceGame, type ChoiceQuestion } from './ChoiceGame';
import type { GameProps } from './types';

const ROUND_SIZE = 10;

/** How Germans say each letter; speaking the name is clearer than a bare letter for most voices. */
const LETTER_NAMES: Record<string, string> = {
  A: 'a', B: 'be', C: 'ce', D: 'de', E: 'e', F: 'eff', G: 'ge', H: 'ha', I: 'i', J: 'jott', K: 'ka', L: 'ell', M: 'emm',
  N: 'enn', O: 'o', P: 'pe', Q: 'ku', R: 'err', S: 'ess', T: 'te', U: 'u', V: 'vau', W: 'we', X: 'ix', Y: 'üpsilon',
  Z: 'zett', Ä: 'ä', Ö: 'ö', Ü: 'ü', ß: 'eszett',
};

/** Letters learners mix up, because their German names sound like other letters in English or Spanish. */
const CONFUSABLE = [
  ['E', 'I', 'Ä'], ['G', 'J', 'K'], ['V', 'W', 'F'], ['B', 'P', 'D'], ['U', 'Ü', 'Y'], ['O', 'Ö', 'U'],
  ['H', 'A', 'R'], ['Q', 'K', 'C'], ['S', 'Z', 'ß', 'X'], ['M', 'N', 'L'], ['I', 'E', 'Y'],
];

/** Names and places Germans often have to spell, with spellings that sound alike. */
const SPELLINGS = [
  ['Maier', 'Meyer', 'Meier', 'Mayer'], ['Schmidt', 'Schmitt', 'Schmid'], ['Weber', 'Veber', 'Wever'],
  ['Jakob', 'Jacob', 'Yakob'], ['Köln', 'Koln', 'Kölln'], ['Müller', 'Müler', 'Muller'], ['Fischer', 'Vischer', 'Fisher'],
  ['Zürich', 'Zurich', 'Sürich'], ['Becker', 'Bäcker', 'Bekker'], ['Wagner', 'Vagner', 'Wakner'],
  ['Hoffmann', 'Hofmann', 'Hofman'], ['Jonas', 'Yonas', 'Jonaß'],
];

const spell = (word: string) => [...word].map((c) => LETTER_NAMES[c.toUpperCase()] ?? c).join(', ');

function letterQuestion(i: number): ChoiceQuestion {
  const group = shuffle(CONFUSABLE)[0];
  const letter = shuffle(group)[0];
  const say = LETTER_NAMES[letter];
  return {
    key: `letter:${i}:${letter}`,
    prompt: (answered) => (
      <>
        <button class="listen-btn" onClick={() => speak(say, true)} aria-label={t('play')}>
          {answered ? letter : '🔊'}
        </button>
        <div class="noun-hint">{answered ? `${letter} = „${say}“` : t('whichLetter')}</div>
      </>
    ),
    options: shuffle(group),
    answer: letter,
    sayFirst: say,
    solution: <b>{letter}</b>,
    review: { label: <b>{letter}</b>, sub: say, say },
  };
}

function spellingQuestion(i: number): ChoiceQuestion {
  const set = shuffle(SPELLINGS)[0];
  const word = set[0];
  const spelled = spell(word);
  return {
    key: `spell:${i}:${word}`,
    prompt: (answered) => (
      <>
        <button class="listen-btn" onClick={() => speak(spelled, true)} aria-label={t('play')}>
          {answered ? '✅' : '🔊'}
        </button>
        <div class="noun-hint">{answered ? spelled : t('whichSpelling')}</div>
      </>
    ),
    options: shuffle(set),
    answer: word,
    sayFirst: spelled,
    solution: <b>{word}</b>,
    review: { label: <b>{word}</b>, sub: spelled, say: spelled },
  };
}

export function AlphabetGame({ starKey, onRetry, onExit }: GameProps) {
  const [questions] = useState(() => {
    // Distinct prompts: no letter or name twice in a round.
    const seen = new Set<string>();
    const out: ChoiceQuestion[] = [];
    for (let i = 0; out.length < ROUND_SIZE && i < 200; i++) {
      const q = i % 2 ? spellingQuestion(i) : letterQuestion(i);
      if (seen.has(q.answer)) continue;
      seen.add(q.answer);
      out.push(q);
    }
    return out;
  });
  return <ChoiceGame questions={questions} starKey={starKey} onRetry={onRetry} onExit={onExit} />;
}
