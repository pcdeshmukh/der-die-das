import type { Level } from '../data/types';
import { t } from '../lib/i18n';
import { GRAMMAR_PREFIX, PHRASE_PREFIX, describeTopic } from '../lib/modes';
import { TopicCard } from './TopicCard';

/** All grammar lessons, or all phrase sets, of a level. */
export function ListScreen({ level, kind }: { level: Level; kind: 'grammar' | 'phrases' }) {
  const ids =
    kind === 'grammar'
      ? level.grammar.map((l) => GRAMMAR_PREFIX + l.id)
      : level.phrases.map((l) => PHRASE_PREFIX + l.id);
  return (
    <div class="screen">
      <h1 class="screen-title">
        <span class="title-emoji">{kind === 'grammar' ? '✏️' : '💬'}</span>{' '}
        {t(kind === 'grammar' ? 'grammarLessons' : 'phraseSets')}
      </h1>
      <div class="topic-grid">
        {ids.map((id) => {
          const info = describeTopic(level, id);
          return info && <TopicCard level={level} info={info} />;
        })}
      </div>
    </div>
  );
}
