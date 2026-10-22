import type { GrammarLesson, LevelContent, PhraseLesson, Topic } from '../types';
import a2Relatives from './relatives.json';
import a2Moving from './moving.json';
import a2Cooking from './cooking.json';
import a2Health from './health.json';
import a2Work from './work.json';
import a2Media from './media.json';
import a2Travel from './travel.json';
import a2Money from './money.json';
import a2Authorities from './authorities.json';
import a2Culture from './culture.json';
import a2Feelings from './feelings.json';
import a2Tech from './tech.json';
import a2Verbs from './verbs.json';
import a2GrammarCh01 from './grammar-ch01-06.json';
import a2GrammarCh07 from './grammar-ch07-14.json';
import a2GrammarCh15 from './grammar-ch15-24.json';
import a2PhrasesCh01 from './phrases-ch01-12.json';
import a2PhrasesCh13 from './phrases-ch13-24.json';
import a2Chapters from './chapters.json';

const topics = [
  a2Relatives,
  a2Moving,
  a2Cooking,
  a2Health,
  a2Work,
  a2Media,
  a2Travel,
  a2Money,
  a2Authorities,
  a2Culture,
  a2Feelings,
  a2Tech,
];

const content: LevelContent = {
  topics: topics as unknown as Topic[],
  verbs: a2Verbs as LevelContent['verbs'],
  grammar: [...a2GrammarCh01, ...a2GrammarCh07, ...a2GrammarCh15] as GrammarLesson[],
  phrases: [...a2PhrasesCh01, ...a2PhrasesCh13] as unknown as PhraseLesson[],
  chapters: a2Chapters,
};

export default content;
