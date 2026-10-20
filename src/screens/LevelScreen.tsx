import { wordsOf } from '../data';
import type { Level } from '../data/types';
import { t, uiLang } from '../lib/i18n';
import { MIXED, MODES, REVIEW, poolFor } from '../lib/modes';
import { href } from '../lib/router';
import { progress } from '../lib/store';

export function LevelScreen({ level }: { level: Level }) {
  const p = progress.value;
  const reviewCount = new Set(MODES.flatMap((m) => poolFor(level, REVIEW, m.skill, p.words)!.map((w) => w.id))).size;
  return (
    <div class="screen">
      <h1 class="screen-title">
        {level.id} · {t(`level_${level.id}`)}
      </h1>

      <h2 class="section-title">{t('practice')}</h2>
      <div class="topic-grid">
        <a class="topic-card special" href={href(level.slug, MIXED)}>
          <span class="topic-emoji">🎲</span>
          <span class="topic-name">{t('mixed')}</span>
          <span class="topic-meta">{t('mixedSub')}</span>
        </a>
        {reviewCount > 0 ? (
          <a class="topic-card special" href={href(level.slug, REVIEW)}>
            <span class="topic-emoji">🔁</span>
            <span class="topic-name">{t('review')}</span>
            <span class="topic-meta">{t('reviewSub', { n: reviewCount })}</span>
          </a>
        ) : (
          <div class="topic-card special locked">
            <span class="topic-emoji">🔁</span>
            <span class="topic-name">{t('review')}</span>
            <span class="topic-meta">{t('reviewEmpty')}</span>
          </div>
        )}
      </div>

      <h2 class="section-title">{t('topics')}</h2>
      <div class="topic-grid">
        {level.topics.map((topic) => {
          const earned = MODES.reduce((sum, m) => sum + (p.stars[`${level.id}/${topic.id}/${m.id}`] ?? 0), 0);
          return (
            <a class="topic-card" href={href(level.slug, topic.id)}>
              <span class="topic-emoji">{topic.emoji}</span>
              <span class="topic-name">{topic.title[uiLang()]}</span>
              <span class="topic-meta">
                {t('words', { n: wordsOf(level, topic).length })} · <span class="star on">★</span> {earned}/{MODES.length * 3}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
