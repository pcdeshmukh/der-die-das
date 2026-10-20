import { LEVELS } from '../data';
import { t } from '../lib/i18n';
import { href } from '../lib/router';
import { currentStreak, progress } from '../lib/store';

export function Home() {
  const p = progress.value;
  const practised = new Set(Object.keys(p.words).map((k) => k.split('|')[1])).size;
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
