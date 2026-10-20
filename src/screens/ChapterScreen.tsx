import type { Level } from '../data/types';
import { t, uiLang } from '../lib/i18n';
import { describeTopic } from '../lib/modes';
import { NotFound } from './NotFound';
import { TopicCard } from './TopicCard';

export function ChapterScreen({ level, n }: { level: Level; n: number }) {
  const chapter = level.chapters.find((c) => c.n === n);
  if (!chapter) return <NotFound />;
  return (
    <div class="screen">
      <p class="muted subtitle">{t('chapter', { n })}</p>
      <h1 class="screen-title">{chapter.title[uiLang()]}</h1>
      {uiLang() !== 'de' && <p class="muted subtitle">{chapter.title.de}</p>}
      <div class="topic-grid chapter-grid">
        {chapter.links.map((id) => {
          const info = describeTopic(level, id);
          return info && <TopicCard level={level} info={info} meta={t(`kind_${info.kind}`)} />;
        })}
      </div>
    </div>
  );
}
