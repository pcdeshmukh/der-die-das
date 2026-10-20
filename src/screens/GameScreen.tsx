import { useMemo, useState } from 'preact/hooks';
import type { Level } from '../data/types';
import { ArticleGame } from '../games/ArticleGame';
import { MatchGame } from '../games/MatchGame';
import { t } from '../lib/i18n';
import { MODES, poolFor, starKey, type ModeId } from '../lib/modes';
import { href, navigate } from '../lib/router';
import { progress } from '../lib/store';
import { NotFound } from './NotFound';

const GAMES = { articles: ArticleGame, match: MatchGame };

export function GameScreen({ level, topicId, modeId }: { level: Level; topicId: string; modeId: string }) {
  // Bumping the round remounts the game, which picks a fresh set of words.
  const [round, setRound] = useState(0);
  const mode = MODES.find((m) => m.id === modeId);
  // Computed once per round: answers recorded mid-game must not change the pool (e.g. in Review).
  const pool = useMemo(
    () => (mode ? poolFor(level, topicId, mode.skill, progress.peek().words) : null),
    [round, level, topicId, mode],
  );
  if (!mode || !pool) return <NotFound />;
  if (pool.length < mode.min) {
    return (
      <div class="screen center">
        <p>{t('tooFew')}</p>
        <a class="btn primary" href={href(level.slug, topicId)}>
          {t('back')}
        </a>
      </div>
    );
  }
  const Game = GAMES[mode.id as ModeId];
  return (
    <Game
      key={round}
      pool={pool}
      starKey={starKey(level, topicId, mode.id)}
      onRetry={() => setRound((r) => r + 1)}
      onExit={() => navigate(level.slug, topicId)}
    />
  );
}
