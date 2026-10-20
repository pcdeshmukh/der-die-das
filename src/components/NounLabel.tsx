import type { Noun } from '../data/types';

/** "der Tisch" with the article colour-coded. */
export function NounLabel({ noun, hideArticle = false }: { noun: Noun; hideArticle?: boolean }) {
  return (
    <span class="noun-label">
      {hideArticle ? <span class="art-blank">___</span> : <span class={`art-${noun.article}`}>{noun.article}</span>} {noun.de}
    </span>
  );
}
