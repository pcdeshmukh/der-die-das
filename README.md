# der die das

German learning games for the browser, level by level (A1 → C2). Play on your phone or desktop:
**https://pcdeshmukh.github.io/der-die-das/**

Works offline and can be added to your home screen. Progress is saved in your browser.

## A1 course

A1 follows a 24-chapter syllabus (*Hallo!* → *Feste*). Each chapter links its vocabulary,
grammar and communication practice. In total: 505 nouns in 19 topics, 114 sentences, 40 verbs,
45 grammar lessons (540 exercises) and 24 "What do you say?" phrase sets (192 situations).

**Games per vocabulary topic:** Der · Die · Das, Word Match, Plural Rush, Listen & Pick
(needs browser speech), Sentence Builder.

**Grammar & skills:** grammar lessons (a short rule plus gap-fill practice), phrase sets
(pick the right German phrase for a situation), Conjugation, Numbers (up to a million, German
digit grouping), Telling the time, Alphabet & spelling.

**Daily challenge**: 12 mixed questions, the same for everyone on a given day, one attempt per day,
with its own streak and a bonus.

**Mixed** draws from every topic, and **Review** collects whatever you last got wrong in any game.
Items you miss come back sooner (Leitner-style spaced repetition).

## A2 course

A2 builds on A1 with its own 24-chapter syllabus (*Familie und Verwandte* → *Träume und Wünsche*):
303 nouns in 12 topics, 72 sentences, 50 verbs, 32 grammar lessons (383 exercises) and 24 phrase
sets (192 situations). The verb page adds **Präteritum** and **Perfekt** (*hat gemacht* or
*ist gegangen*?) next to present-tense conjugation. The daily challenge follows the level you last opened.

All course content is machine-written; corrections from native speakers are welcome.

## Languages

Menus are available in English, German and Spanish. Meanings and translations are shown in English
or Spanish; with German menus you choose which one in Settings.

## Development

```sh
npm install
npm run dev      # local dev server
npm test         # content + logic tests
npm run build    # production build into dist/
```

Pushing to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Adding content

Content lives in `src/data/<level>/`. Each topic file has `nouns` and `sentences`:

```json
{ "de": "Tisch", "article": "der", "plural": "Tische", "en": "table", "es": "mesa", "emoji": "🪑" }
{ "de": "Wo ist der Bahnhof?", "en": "Where is the train station?", "es": "¿Dónde está la estación de tren?" }
```

Verbs are in `verbs.json` with their six present-tense forms (from A2 also `preterite` and `perfect`, e.g. `"ist gegangen"`). Grammar lessons are in `grammar*.json`
(a rule plus gap sentences like `"Ich habe ___ Hund."`), phrase sets in `phrases*.json`
(a situation, the right German phrase and wrong ones), and `chapters.json` maps the syllabus
chapters to all of these. Numbers, times and the alphabet are generated.

Register a new topic file in `src/data/index.ts`. A level with topics becomes playable automatically.
`npm test` checks articles, duplicates, that everything has English and Spanish translations
(unique per topic), sentence punctuation,
verb tables, and the number/time generators.

## Stack

Preact + TypeScript + Vite, `@preact/signals` for state, `vite-plugin-pwa` for offline support.

## License

[Apache License 2.0](LICENSE)
