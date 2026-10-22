import { LEVELS } from '../data';
import { DAILY_BONUS_XP } from '../games/DailyGame';
import { dailyLevel } from './DailyScreen';
import { t } from '../lib/i18n';
import { href } from '../lib/router';
import { currentStreak, dailyStreak, progress, today } from '../lib/store';

export function Home() {
  const p = progress.value;
  const practised = new Set(Object.keys(p.words).map((k) => k.split('|')[1])).size;
  const daily = p.daily.results[today()];
  return (
    <div class="screen">
      <section class="hero">
        <h1 class="hero-title">
          <span class="art-der">der</span> <span class="art-die">die</span> <span class="art-das">das</span>
        </h1>
        <p class="muted">{t('tagline')}</p>
      </section>

      <section class="stat-row">
        <div class="stat">
          <div class="stat-value">🔥 {currentStreak(p)}</div>
          <div class="stat-label">{t('streak')}</div>
        </div>
        <div class="stat">
          <div class="stat-value">⭐ {p.xp}</div>
          <div class="stat-label">{t('xp')}</div>
        </div>
        <div class="stat">
          <div class="stat-value">📚 {practised}</div>
          <div class="stat-label">{t('practised')}</div>
        </div>
      </section>

      <a class={daily ? 'daily-card done' : 'daily-card'} href="#/daily">
        <span class="daily-icon">{daily ? '✅' : '⚡'}</span>
        <span class="mode-text">
          <span class="mode-name">{t('daily')}</span>
          <span class="mode-desc">
            {daily ? t('dailyDone', { c: daily.correct, n: daily.total }) : t('dailySub', { n: DAILY_BONUS_XP, level: dailyLevel().id })}
          </span>
        </span>
        <span class="badge" title={t('dailyStreak', { n: dailyStreak(p) })}>
          🔥 {dailyStreak(p)}
        </span>
      </a>

      <h2 class="section-title">{t('chooseLevel')}</h2>
      <div class="level-grid">
        {LEVELS.map((level) => {
          const open = level.topics.length > 0;
          const body = (
            <>
              <span class="level-id">{level.id}</span>
              <span class="level-name">{t(`level_${level.id}`)}</span>
              {!open && <span class="badge">{t('comingSoon')}</span>}
            </>
          );
          return open ? (
            <a class={`level-card level-${level.slug}`} href={href(level.slug)}>
              {body}
            </a>
          ) : (
            <div class="level-card locked" aria-disabled="true">
              {body}
            </div>
          );
        })}
      </div>
      <p class="footnote muted">
        {t('offline')} ·{' '}
        <a href="https://github.com/pcdeshmukh/der-die-das" target="_blank" rel="noopener">
          {t('source')}
        </a>
      </p>
    </div>
  );
}
