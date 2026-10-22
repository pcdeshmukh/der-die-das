import { useState } from 'preact/hooks';
import { Stars } from '../components/Stars';
import { LEVELS } from '../data';
import { DailyGame } from '../games/DailyGame';
import { t } from '../lib/i18n';
import { navigate } from '../lib/router';
import { starsFor } from '../lib/srs';
import { dailyStreak, progress, today } from '../lib/store';

/** The challenge draws on the level the player is working on (the last one they opened). */
export function dailyLevel() {
  const playable = LEVELS.filter((l) => l.topics.length);
  return playable.find((l) => l.id === progress.peek().level) ?? playable[0];
}

function untilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const minutes = Math.ceil((midnight.getTime() - now.getTime()) / 60_000);
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

export function DailyScreen() {
  // Decided once: finishing today's round must not swap its results screen for this summary.
  const [doneEarlier] = useState(() => progress.peek().daily.results[today()]);
  if (!doneEarlier) return <DailyGame level={dailyLevel()} onExit={() => navigate()} />;

  return (
    <div class="screen center">
      <p class="results-emoji">⚡</p>
      <h1>{t('daily')}</h1>
      <Stars value={starsFor(doneEarlier.correct, doneEarlier.total)} />
      <p>{t('dailyDone', { c: doneEarlier.correct, n: doneEarlier.total })}</p>
      <p class="muted">
        🔥 {t('dailyStreak', { n: dailyStreak(progress.value) })} · {t('dailyNext', { t: untilMidnight() })}
      </p>
      <a class="btn primary" href="#/">
        {t('goHome')}
      </a>
    </div>
  );
}
