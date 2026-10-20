import type { Level } from '../data/types';
import type { Item } from '../lib/modes';

export interface GameProps<T extends Item = Item> {
  level: Level;
  pool: T[];
  /** where to record best stars; null for review rounds */
  starKey: string | null;
  onRetry: () => void;
  onExit: () => void;
}
