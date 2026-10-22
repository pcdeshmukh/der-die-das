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
import a2Childhood from './childhood.json';
import a2Landscape from './landscape.json';
import a2Sports from './sports.json';
import a2Company from './company.json';
import a2Objects from './objects.json';
import a2Traffic from './traffic.json';
import a2Luggage from './luggage.json';
import a2Tableware from './tableware.json';
import a2House from './house.json';
import a2Online from './online.json';
import a2Sustainability from './sustainability.json';
import a2Education from './education.json';
import a2Officetasks from './officetasks.json';
import a2Verbs from './verbs.json';
import a2GrammarCh01 from './grammar-ch01-06.json';
import a2GrammarCh07 from './grammar-ch07-14.json';
import a2GrammarCh15 from './grammar-ch15-24.json';
import a2GrammarBook from './grammar-book.json';
import a2PhrasesCh01 from './phrases-ch01-12.json';
import a2PhrasesBookCh01 from './phrases-book-ch01-12.json';
import a2PhrasesCh13 from './phrases-ch13-24.json';
import a2PhrasesBookCh13 from './phrases-book-ch13-24.json';
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
  a2Childhood,
  a2Landscape,
  a2Officetasks,
  a2Sports,
  a2Company,
  a2Objects,
  a2Traffic,
  a2Luggage,
  a2Tableware,
  a2House,
  a2Online,
  a2Sustainability,
  a2Education,
];

const content: LevelContent = {
  topics: topics as unknown as Topic[],
  verbs: a2Verbs as LevelContent['verbs'],
  grammar: [...a2GrammarCh01, ...a2GrammarCh07, ...a2GrammarCh15, ...a2GrammarBook] as GrammarLesson[],
  phrases: [...a2PhrasesCh01, ...a2PhrasesCh13, ...a2PhrasesBookCh01, ...a2PhrasesBookCh13] as unknown as PhraseLesson[],
  chapters: a2Chapters,
};

export default content;
