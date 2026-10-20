import { useState } from 'preact/hooks';
import { SpeakButton } from '../components/NounPrompt';
import type { Level, VerbForm } from '../data/types';
import { meaning } from '../lib/i18n';
import { shuffle } from '../lib/random';
import { pickWords } from '../lib/srs';
import { progress } from '../lib/store';
import { ChoiceGame, type ChoiceQuestion } from './ChoiceGame';
import type { GameProps } from './types';

const ROUND_SIZE = 12;

const spoken = (pronoun: string) => pronoun.replace(/ \(.*\)$/, '');

/** The form a learner gets by applying the regular rule, e.g. "fahrst" for fahren. */
function regularized(infinitive: string, person: number): string | null {
  const stem = infinitive.replace(/e?n$/, '');
  if (person === 1) return stem + (/[sßzx]$/.test(stem) ? 't' : 'st');
  if (person === 2) return stem + 't';
  return null;
}

export function conjugationQuestion(level: Level, { id, verb, person }: VerbForm): ChoiceQuestion {
  // One concrete pronoun per prompt (not "er/sie/es") so it reads like real German.
  const pronoun = shuffle(level.verbs!.prompts[person])[0];
  const form = verb.present[person];
  const wrong = new Set(verb.present.filter((f) => f !== form));
  const reg = regularized(verb.infinitive, person);
  // A plausible-but-wrong regular form is the most useful distractor for stem-changing verbs.
  const options = reg && reg !== form && !wrong.has(reg) ? [reg, ...shuffle([...wrong]).slice(0, 2)] : shuffle([...wrong]).slice(0, 3);
  const phrase = `${spoken(pronoun)} ${form}`;
  const note = pronoun.match(/\((.*)\)/)?.[1];
  return {
    key: `conjugation:${id}`,
    statId: id,
    skill: 'conjugation',
    prompt: (answered) => (
      <>
        <div class="noun-word">
          {spoken(pronoun)} <span class={answered ? 'art-das' : 'art-blank'}>{answered ? form : '___'}</span>
        </div>
        {note && <div class="pronoun-note">({note})</div>}
        <div class="noun-hint">
          <b>{verb.infinitive}</b> · {meaning(verb)}
        </div>
        <SpeakButton text={answered ? phrase : verb.infinitive} />
      </>
    ),
    options: shuffle([form, ...options]),
    answer: form,
    sayAfter: phrase,
    solution: <b>{phrase}</b>,
    review: { label: <b>{phrase}</b>, sub: `${verb.infinitive} · ${meaning(verb)}`, say: phrase },
  };
}

export function ConjugationGame({ level, pool, starKey, onRetry, onExit }: GameProps<VerbForm>) {
  const [questions] = useState(() =>
    pickWords(pool, progress.peek().words, 'conjugation', Math.min(ROUND_SIZE, pool.length)).map((f) =>
      conjugationQuestion(level, f),
    ),
  );
  return <ChoiceGame questions={questions} starKey={starKey} onRetry={onRetry} onExit={onExit} />;
}
