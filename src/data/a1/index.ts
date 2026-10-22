import type { GrammarLesson, LevelContent, PhraseLesson, Topic } from '../types';
import people from './people.json';
import family from './family.json';
import food from './food.json';
import home from './home.json';
import city from './city.json';
import transport from './transport.json';
import time from './time.json';
import body from './body.json';
import clothes from './clothes.json';
import school from './school.json';
import leisure from './leisure.json';
import nature from './nature.json';
import animals from './animals.json';
import jobs from './jobs.json';
import things from './things.json';
import office from './office.json';
import appliances from './appliances.json';
import festivals from './festivals.json';
import environment from './environment.json';
import a1Verbs from './verbs.json';
import a1Grammar from './grammar.json';
import a1GrammarCh01 from './grammar-ch01-06.json';
import a1GrammarCh07 from './grammar-ch07-12.json';
import a1GrammarCh13 from './grammar-ch13-19.json';
import a1GrammarCh20 from './grammar-ch20-24.json';
import a1PhrasesCh01 from './phrases-ch01-12.json';
import a1PhrasesCh13 from './phrases-ch13-24.json';
import a1Chapters from './chapters.json';

const topics = [
  people,
  family,
  jobs,
  food,
  home,
  appliances,
  things,
  office,
  city,
  transport,
  environment,
  time,
  body,
  clothes,
  school,
  leisure,
  festivals,
  nature,
  animals,
];

const content: LevelContent = {
  topics: topics as unknown as Topic[],
  verbs: a1Verbs as LevelContent['verbs'],
  grammar: [...a1Grammar, ...a1GrammarCh01, ...a1GrammarCh07, ...a1GrammarCh13, ...a1GrammarCh20] as GrammarLesson[],
  phrases: [...a1PhrasesCh01, ...a1PhrasesCh13] as unknown as PhraseLesson[],
  chapters: a1Chapters,
};

export default content;
