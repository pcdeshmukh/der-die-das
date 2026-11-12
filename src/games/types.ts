import type { ExamSet, Level } from '../data/types';
import type { Run } from '../lib/exam';
import type { Item } from '../lib/modes';

export interface GameProps<T extends Item = Item> {
  level: Level;
  pool: T[];
  /** where to record best stars; null for review rounds */
  starKey: string | null;
  onRetry: () => void;
  onExit: () => void;
  /** type answers instead of picking them (games whose mode is `typeable`) */
  typing?: boolean;
}

/** A part of a model test, run as in the exam or to practise one Teil. */
export interface ExamGameProps {
  level: Level;
  exam: ExamSet;
  run: Run;
  onRetry: () => void;
  onExit: () => void;
}
