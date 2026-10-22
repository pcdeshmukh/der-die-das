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
const PRETERITE_ENDINGS = ['te', 'test', 'te', 'ten', 'tet', 'ten'];

export const spokenPronoun = (pronoun: string) => pronoun.replace(/ \(.*\)$/, '');

/**
 * The form a learner gets by applying the regular rule: "fahrst" for fahren, "gehte" for ging.
 * Separable verbs ("fange an") are skipped; the rule can't place the prefix.
 */
function regularized(infinitive: string, person: number, tense: Tense): string | null {
  const stem = infinitive.replace(/e?n$/, '');
  if (tense === 'preterite') return stem + PRETERITE_ENDINGS[person];
  if (person === 1) return stem + (/[sßzx]$/.test(stem) ? 't' : 'st');
  if (person === 2) return stem + 't';
  return null;
}

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
  const wrong = new Set(forms.filter((f) => f !== form));
  // In the past tense, the present form of the same person is a natural slip.
  if (tense === 'preterite' && verb.present[person] !== form) wrong.add(verb.present[person]);
  // An umlaut stem would turn the regular past into Konjunktiv II (könnte), a real form, so skip it.
  const umlautPast = tense === 'preterite' && /[äöü]/.test(verb.infinitive);
  const reg = form.includes(' ') || umlautPast ? null : regularized(verb.infinitive, person, tense);
  // A plausible-but-wrong regular form is the most useful distractor for irregular verbs.
  const options =
    reg && reg !== form && !wrong.has(reg) ? [reg, ...shuffle([...wrong]).slice(0, 2)] : shuffle([...wrong]).slice(0, 3);
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
  };
}

function TenseGame({ tense, level, pool, starKey, onRetry, onExit }: GameProps<VerbForm> & { tense: Tense }) {
  const [questions] = useState(() =>
    pickWords(pool, progress.peek().words, SKILL[tense], Math.min(ROUND_SIZE, pool.length)).map((f) =>
      conjugationQuestion(level, f),
    ),
  );
  return <ChoiceGame questions={questions} starKey={starKey} onRetry={onRetry} onExit={onExit} />;
}

export const ConjugationGame = (props: GameProps<VerbForm>) => <TenseGame tense="present" {...props} />;
export const PreteriteGame = (props: GameProps<VerbForm>) => <TenseGame tense="preterite" {...props} />;
