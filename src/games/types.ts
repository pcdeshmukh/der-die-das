import type { WordRef } from '../data/types';

export interface GameProps {
  pool: WordRef[];
  /** where to record best stars; null for review rounds */
  starKey: string | null;
  onRetry: () => void;
  onExit: () => void;
}
