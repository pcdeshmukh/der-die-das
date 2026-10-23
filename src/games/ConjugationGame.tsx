import { useState } from 'preact/hooks';
import { SpeakButton } from '../components/NounPrompt';
import type { Level, Tense, VerbForm } from '../data/types';
import { meaning, t } from '../lib/i18n';
import { shuffle } from '../lib/random';
import { pickWords, type Skill } from '../lib/srs';
import { progress } from '../lib/store';
import { ChoiceGame, type ChoiceQuestion } from './ChoiceGame';
import type { GameProps } from './types';

const ROUND_SIZE = 12;

const SKILL: Record<Tense, Skill> = { present: 'conjugation', preterite: 'preterite' };

export const spokenPronoun = (pronoun: string) => pronoun.replace(/ \(.*\)$/, '');

/** The person's pronoun as shown in a prompt, plus an optional hint such as "(formal)". */
export function promptPronoun(level: Level, person: number) {
  // One concrete pronoun per prompt (not "er/sie/es") so it reads like real German.
  const pronoun = shuffle(level.verbs!.prompts[person])[0];
  return { pronoun: spokenPronoun(pronoun), note: pronoun.match(/\((.*)\)/)?.[1] };
}

export function conjugationQuestion(level: Level, { id, verb, person, tense }: VerbForm): ChoiceQuestion {
  const { pronoun, note } = promptPronoun(level, person);
  const forms = verb[tense]!;
  const form = forms[person];
  // Every option is a real form of the verb: the other persons, and in the past the present.
  const wrong = new Set(forms.filter((f) => f !== form));
  if (tense === 'preterite' && verb.present[person] !== form) wrong.add(verb.present[person]);
  const options = shuffle([...wrong]).slice(0, 3);
  const phrase = `${pronoun} ${form}`;
  return {
    key: `${tense}:${id}`,
    statId: id,
    skill: SKILL[tense],
    prompt: (answered) => (
      <>
        {tense !== 'present' && <div class="tense-badge">{t(`mode_${tense}`)}</div>}
        <div class="noun-word">
          {pronoun} <span class={answered ? 'art-das' : 'art-blank'}>{answered ? form : '___'}</span>
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
    typed: { accepted: [form, phrase] },
  };
}

function TenseGame({ tense, level, pool, starKey, onRetry, onExit, typing }: GameProps<VerbForm> & { tense: Tense }) {
  const [questions] = useState(() =>
    pickWords(pool, progress.peek().words, SKILL[tense], Math.min(ROUND_SIZE, pool.length)).map((f) =>
      conjugationQuestion(level, f),
    ),
  );
  return <ChoiceGame questions={questions} starKey={starKey} typing={typing} onRetry={onRetry} onExit={onExit} />;
}

export const ConjugationGame = (props: GameProps<VerbForm>) => <TenseGame tense="present" {...props} />;
export const PreteriteGame = (props: GameProps<VerbForm>) => <TenseGame tense="preterite" {...props} />;
