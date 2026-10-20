let source: () => number = Math.random;

/** Like Math.random, but can be made deterministic with withSeed. */
export const random = () => source();

export const randInt = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));

export function shuffle<T>(items: readonly T[]): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** mulberry32: small, fast, good enough for picking questions. */
function seeded(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Runs `fn` with a deterministic random source, so everyone gets the same daily challenge. */
export function withSeed<T>(seed: string, fn: () => T): T {
  const previous = source;
  source = seeded(hash(seed));
  try {
    return fn();
  } finally {
    source = previous;
  }
}
