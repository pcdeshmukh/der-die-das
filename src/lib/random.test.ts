import { describe, expect, it } from 'vitest';
import { random, shuffle, withSeed } from './random';

describe('withSeed', () => {
  it('repeats the same sequence for the same seed', () => {
    const run = () => withSeed('2026-10-20', () => [random(), random(), shuffle([1, 2, 3, 4, 5])]);
    expect(run()).toEqual(run());
  });

  it('differs between seeds', () => {
    const a = withSeed('2026-10-20', () => shuffle([...Array(20).keys()]));
    const b = withSeed('2026-10-21', () => shuffle([...Array(20).keys()]));
    expect(a).not.toEqual(b);
  });

  it('restores normal randomness afterwards', () => {
    withSeed('x', () => random());
    const values = new Set(Array.from({ length: 5 }, () => random()));
    expect(values.size).toBe(5);
  });
});
