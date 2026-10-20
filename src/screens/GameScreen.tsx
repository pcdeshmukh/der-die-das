import type { FunctionComponent } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import type { Level } from '../data/types';
import { AlphabetGame } from '../games/AlphabetGame';
import { ArticleGame } from '../games/ArticleGame';
import { ConjugationGame } from '../games/ConjugationGame';
import { GrammarGame } from '../games/GrammarGame';
import { ListenGame } from '../games/ListenGame';
import { MatchGame } from '../games/MatchGame';
import { NumbersGame } from '../games/NumbersGame';
import { PhraseGame } from '../games/PhraseGame';
import { PluralGame } from '../games/PluralGame';
import { SentenceGame } from '../games/SentenceGame';
import { TimeGame } from '../games/TimeGame';
import type { GameProps } from '../games/types';
import { t } from '../lib/i18n';
import { MODES, isPlayable, poolFor, starKey, type ModeId } from '../lib/modes';
import { href, navigate } from '../lib/router';
import { progress } from '../lib/store';
import { NotFound } from './NotFound';

// Each game narrows the pool's item type; the registry guarantees the pairing.
const GAMES = {
  articles: ArticleGame,
  match: MatchGame,
  plural: PluralGame,
  listen: ListenGame,
  sentences: SentenceGame,
  conjugate: ConjugationGame,
  numbers: NumbersGame,
  time: TimeGame,
  grammar: GrammarGame,
  phrases: PhraseGame,
  alphabet: AlphabetGame,
} as unknown as Record<ModeId, FunctionComponent<GameProps>>;

export function GameScreen({ level, topicId, modeId }: { level: Level; topicId: string; modeId: string }) {
  // Bumping the round remounts the game, which picks a fresh set of questions.
  const [round, setRound] = useState(0);
  const mode = MODES.find((m) => m.id === modeId);
  // Computed once per round: answers recorded mid-game must not change the pool (e.g. in Review).
  const pool = useMemo(
    () => (mode ? poolFor(level, topicId, mode, progress.peek().words) : null),
    [round, level, topicId, mode],
  );
  if (!mode || !pool) return <NotFound />;
  if (!isPlayable(mode, pool)) {
    return (
      <div class="screen center">
        <p>{t('tooFew')}</p>
        <a class="btn primary" href={href(level.slug, topicId)}>
          {t('back')}
        </a>
      </div>
    );
  }
  const Game = GAMES[mode.id];
  return (
    <Game
      key={round}
      level={level}
      pool={pool}
      starKey={starKey(level, topicId, mode.id)}
      onRetry={() => setRound((r) => r + 1)}
      onExit={() => navigate(level.slug, topicId)}
    />
  );
}
