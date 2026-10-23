import { useState } from 'preact/hooks';
import { SpeakButton } from '../components/NounPrompt';
import type { Level, PerfectRef, Verb } from '../data/types';
import { meaning, t } from '../lib/i18n';
import { randInt, shuffle } from '../lib/random';
import { pickWords } from '../lib/srs';
import { progress } from '../lib/store';
import { ChoiceGame, type ChoiceQuestion } from './ChoiceGame';
import { promptPronoun } from './ConjugationGame';
import type { GameProps } from './types';

const ROUND_SIZE = 10;
const AUX = {
  hat: ['habe', 'hast', 'hat', 'haben', 'habt', 'haben'],
  ist: ['bin', 'bist', 'ist', 'sind', 'seid', 'sind'],
};

/**
 * A real verb form that is wrong after haben/sein: the infinitive (hat gehen), or the
 * Präteritum when the participle looks like the infinitive (hat vergaß).
 */
function wrongVerbForm(verb: Verb, participle: string): string {
  return verb.infinitive !== participle ? verb.infinitive : verb.preterite![2];
}

/** "ich ___ (gehen)" → "bin gegangen": the right helper verb and the right participle. */
export function perfectQuestion(level: Level, { id, verb }: PerfectRef): ChoiceQuestion {
  const [aux, participle] = verb.perfect!.split(' ') as ['hat' | 'ist', string];
  const other = aux === 'hat' ? 'ist' : 'hat';
  const person = randInt(0, 5);
  const { pronoun, note } = promptPronoun(level, person);
  const fake = wrongVerbForm(verb, participle);
  const answer = `${AUX[aux][person]} ${participle}`;
  const options = [answer, `${AUX[other][person]} ${participle}`, `${AUX[aux][person]} ${fake}`, `${AUX[other][person]} ${fake}`];
  const phrase = `${pronoun} ${answer}`;
  return {
    key: `perfect:${id}`,
    statId: id,
    skill: 'perfect',
    prompt: (answered) => (
      <>
        <div class="tense-badge">{t('mode_perfect')}</div>
        <div class="noun-word">
          {pronoun} <span class={answered ? 'art-das' : 'art-blank'}>{answered ? answer : '___'}</span>
        </div>
        {note && <div class="pronoun-note">({note})</div>}
        <div class="noun-hint">
          <b>{verb.infinitive}</b> · {meaning(verb)}
        </div>
        <SpeakButton text={answered ? phrase : verb.infinitive} />
      </>
    ),
    options: shuffle([...new Set(options)]),
    answer,
    sayAfter: phrase,
    solution: <b>{phrase}</b>,
    review: { label: <b>{phrase}</b>, sub: `${verb.infinitive} · ${meaning(verb)}`, say: phrase },
    typed: { accepted: [answer, phrase], placeholder: t('typePerfect') },
  };
}

export function PerfectGame({ level, pool, starKey, onRetry, onExit, typing }: GameProps<PerfectRef>) {
  const [questions] = useState(() =>
    pickWords(pool, progress.peek().words, 'perfect', Math.min(ROUND_SIZE, pool.length)).map((item) =>
      perfectQuestion(level, item),
    ),
  );
  return <ChoiceGame questions={questions} starKey={starKey} layout="list" typing={typing} onRetry={onRetry} onExit={onExit} />;
}
