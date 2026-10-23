import { createContext } from 'preact';

/** Link that starts a challenge of the round just played; null where challenges aren't offered. */
export const ChallengeLink = createContext<string | null>(null);
