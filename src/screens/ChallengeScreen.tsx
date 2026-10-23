import { useMemo, useState } from 'preact/hooks';
import type { Level } from '../data/types';
import { ChoiceGame } from '../games/ChoiceGame';
import {
  LAYOUT,
  challengeHref,
  challengeQuestions,
  compare,
  parseResult,
  type ChallengeResult,
} from '../games/challenge';
import { formatDuration } from '../lib/duration';
import { t } from '../lib/i18n';
import { describeTopic, type ModeId } from '../lib/modes';
import { navigate } from '../lib/router';
import { progress, updateSettings } from '../lib/store';
import { NotFound } from './NotFound';

const shownName = (r: ChallengeResult) => r.name || t('aFriend');
const resultLine = (r: ChallengeResult) => `${r.correct}/${r.total} · ⏱ ${formatDuration(r.seconds * 1000)}`;

/** `parts`: level, topic, mode, seed, then optionally the challenger's name, score, total and seconds. */
export function ChallengeScreen({ level, parts }: { level: Level; parts: string[] }) {
  const [, topicId, modeId, seed, ...tail] = parts;
  const questions = useMemo(() => challengeQuestions(level, topicId, modeId, seed), [level, topicId, modeId, seed]);
  const opponent = parseResult(tail);
  const [phase, setPhase] = useState<'intro' | 'play'>('intro');
  const [mine, setMine] = useState<ChallengeResult | null>(null);
  const [name, setName] = useState(progress.peek().settings.name);
  const [copied, setCopied] = useState(false);
  const topic = describeTopic(level, topicId);
  if (!questions || !topic) return <NotFound />;

  // Grammar lessons and phrase sets have one game, so their title says enough.
  const lesson = topic.kind === 'grammar' || topic.kind === 'phrases';
  const title = [level.id, topic.title, !lesson && t(`mode_${modeId as ModeId}`)].filter(Boolean).join(' · ');
  const exit = () => navigate(level.slug, topicId);

  if (phase === 'intro') {
    return (
      <div class="screen center challenge-intro">
        <p class="results-emoji">⚔️</p>
        <h1>{opponent ? t('challengedBy', { name: shownName(opponent) }) : t('challenge')}</h1>
        <p class="muted">{title}</p>
        {opponent && <p class="challenge-score">{resultLine(opponent)}</p>}
        <p>{t('challengeIntro', { n: questions.length })}</p>
        <button class="btn primary" onClick={() => setPhase('play')}>
          {t('start')}
        </button>
        <button class="btn" onClick={exit}>
          {t('back')}
        </button>
      </div>
    );
  }

  async function share(result: ChallengeResult) {
    updateSettings({ name: name.trim() });
    const link = location.origin + location.pathname + challengeHref(level, topicId, modeId, seed, result);
    const text = t('shareText', { c: result.correct, n: result.total, t: formatDuration(result.seconds * 1000), topic: topic!.title });
    // The share sheet is the natural way on a phone; elsewhere the link goes to the clipboard.
    try {
      if (navigator.share) return await navigator.share({ text, url: link });
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(`${text} ${link}`);
      setCopied(true);
    } catch {
      prompt(t('copyLink'), link);
    }
  }

  return (
    <ChoiceGame
      questions={questions}
      starKey={null}
      layout={LAYOUT[modeId as ModeId]}
      timed
      onExit={exit}
      onFinish={(correct, total, ms) => setMine({ name: '', correct, total, seconds: Math.round(ms / 1000) })}
      resultsExtra={() => {
        if (!mine) return null;
        const me = { ...mine, name };
        const outcome = opponent && compare(me, opponent);
        return (
          <div class="challenge-result">
            <p class="challenge-score">⏱ {formatDuration(mine.seconds * 1000)}</p>
            {opponent && outcome && (
              <>
                <table class="challenge-table">
                  <tbody>
                    <tr>
                      <td>{shownName(opponent)}</td>
                      <td>{resultLine(opponent)}</td>
                    </tr>
                    <tr class="me">
                      <td>{t('you')}</td>
                      <td>{resultLine(mine)}</td>
                    </tr>
                  </tbody>
                </table>
                <p class="challenge-outcome">
                  {outcome === 'win' ? t('youWin') : outcome === 'lose' ? t('theyWin', { name: shownName(opponent) }) : t('draw')}
                </p>
              </>
            )}
            <label class="challenge-name">
              <span class="muted small">{t('yourName')}</span>
              <input value={name} maxLength={20} onInput={(e) => setName(e.currentTarget.value)} />
            </label>
            <button class="btn primary" onClick={() => share(me)}>
              ⚔️ {opponent ? t('challengeBack') : t('sendChallenge')}
            </button>
            {copied && <p class="muted small">{t('linkCopied')}</p>}
          </div>
        );
      }}
    />
  );
}
