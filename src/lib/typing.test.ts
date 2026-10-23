import { describe, expect, it } from 'vitest';
import { grade } from './typing';

describe('grading typed answers', () => {
  it('ignores extra spaces and final punctuation', () => {
    expect(grade('  die   Lampe ', ['die Lampe'])).toBe('exact');
    expect(grade('bin gegangen.', ['bin gegangen'])).toBe('exact');
  });

  it('accepts lower case and ae/oe/ue/ss, with a spelling note', () => {
    expect(grade('die lampe', ['die Lampe'])).toBe('close');
    expect(grade('Aepfel', ['Äpfel'])).toBe('close');
    expect(grade('fuhr', ['fuhr'])).toBe('exact');
    expect(grade('strasse', ['Straße'])).toBe('close');
  });

  it('rejects a wrong article, ending or form', () => {
    expect(grade('der Lampe', ['die Lampe'])).toBe('wrong');
    expect(grade('Lampe', ['die Lampe'])).toBe('wrong');
    expect(grade('Apfel', ['Äpfel'])).toBe('wrong');
    expect(grade('hat gegangen', ['bin gegangen'])).toBe('wrong');
    expect(grade('', ['ja'])).toBe('wrong');
  });

  it('accepts any of several answers', () => {
    expect(grade('du fährst', ['fährst', 'du fährst'])).toBe('exact');
  });
});
