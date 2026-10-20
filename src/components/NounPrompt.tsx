import type { ComponentChildren } from 'preact';
import type { WordRef } from '../data/types';
import { speak } from '../lib/speech';
import { progress } from '../lib/store';
import { NounLabel } from './NounLabel';

export function SpeakButton({ text }: { text: string }) {
  return (
    <button class="icon-btn speak-btn" aria-label="🔊" onClick={() => speak(text, true)}>
      🔊
    </button>
  );
}

/** Emoji, the noun (article optionally hidden), English hint, and a speak button. */
export function NounPrompt({ word, hideArticle = false, children }: { word: WordRef; hideArticle?: boolean; children?: ComponentChildren }) {
  return (
    <>
      <div class="noun-emoji" aria-hidden="true">
        {word.emoji ?? '❔'}
      </div>
      <div class="noun-word">
        <NounLabel noun={word} hideArticle={hideArticle} />
      </div>
      {children}
      {progress.value.settings.showHint && <div class="noun-hint">{word.en}</div>}
      <SpeakButton text={hideArticle ? word.de : `${word.article} ${word.de}`} />
    </>
  );
}
