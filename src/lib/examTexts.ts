import type { ExamSet, Titled } from '../data/types';
import type { ModuleId } from './exam';

/*
 * The fixed wording of the model tests: instructions per Teil, worded like the exam papers, and the
 * marking scales for self-marking. Everything in German with English and Spanish translations.
 */

type Format = ExamSet['format'];

export const INSTRUCTIONS: Record<Format, Record<ModuleId, Titled[]>> = {
  sd1: {
    hoeren: [
      {
        de: 'Sie hören sechs kurze Gespräche. Sie hören jeden Text zweimal. Wählen Sie die richtige Lösung: a, b oder c.',
        en: 'You will hear six short conversations. You will hear each one twice. Choose the right answer: a, b or c.',
        es: 'Vas a oír seis conversaciones breves. Oirás cada una dos veces. Elige la respuesta correcta: a, b o c.',
      },
      {
        de: 'Sie hören vier Durchsagen. Sie hören jeden Text einmal. Ist der Satz richtig oder falsch?',
        en: 'You will hear four announcements. You will hear each one once. Is the sentence right or wrong?',
        es: 'Vas a oír cuatro anuncios. Oirás cada uno una sola vez. ¿La frase es verdadera o falsa?',
      },
      {
        de: 'Sie hören fünf Nachrichten am Telefon. Sie hören jeden Text zweimal. Wählen Sie die richtige Lösung: a, b oder c.',
        en: 'You will hear five telephone messages. You will hear each one twice. Choose the right answer: a, b or c.',
        es: 'Vas a oír cinco mensajes de teléfono. Oirás cada uno dos veces. Elige la respuesta correcta: a, b o c.',
      },
    ],
    lesen: [
      {
        de: 'Lesen Sie die zwei Texte. Sind die Sätze richtig oder falsch?',
        en: 'Read the two texts. Are the sentences right or wrong?',
        es: 'Lee los dos textos. ¿Las frases son verdaderas o falsas?',
      },
      {
        de: 'Lesen Sie die Situationen und die Anzeigen. Wo finden Sie die Information? Wählen Sie a oder b.',
        en: 'Read the situations and the ads. Where do you find the information? Choose a or b.',
        es: 'Lee las situaciones y los anuncios. ¿Dónde encuentras la información? Elige a o b.',
      },
      {
        de: 'Lesen Sie die Schilder und Aushänge. Ist der Satz richtig oder falsch?',
        en: 'Read the signs and notices. Is the sentence right or wrong?',
        es: 'Lee los carteles y avisos. ¿La frase es verdadera o falsa?',
      },
    ],
    schreiben: [
      {
        de: 'Lesen Sie den Text. Im Formular fehlen fünf Informationen. Schreiben Sie sie in das Formular.',
        en: 'Read the text. Five pieces of information are missing from the form. Write them in.',
        es: 'Lee el texto. En el formulario faltan cinco datos. Escríbelos en el formulario.',
      },
      {
        de: 'Schreiben Sie eine kurze Nachricht (circa 30 Wörter). Schreiben Sie zu allen drei Punkten. Denken Sie an Anrede und Gruß.',
        en: 'Write a short message (about 30 words). Write about all three points. Remember a greeting and a sign-off.',
        es: 'Escribe un mensaje breve (unas 30 palabras). Escribe sobre los tres puntos. No olvides el saludo y la despedida.',
      },
    ],
    sprechen: [
      {
        de: 'Stellen Sie sich vor. Danach buchstabieren Sie etwas und nennen eine Nummer.',
        en: 'Introduce yourself. Then spell something and give a number.',
        es: 'Preséntate. Después deletrea algo y di un número.',
      },
      {
        de: 'Sie und Ihr Partner sprechen über ein Thema. Stellen Sie eine Frage zu Ihrer Karte. Antworten Sie auf eine Frage.',
        en: 'You and your partner talk about a topic. Ask a question about your card. Answer a question.',
        es: 'Tú y tu compañero habláis de un tema. Haz una pregunta sobre tu tarjeta. Responde a una pregunta.',
      },
      {
        de: 'Sehen Sie die Karte an und bitten Sie Ihren Partner um etwas. Reagieren Sie auf eine Bitte.',
        en: 'Look at the card and ask your partner for something. React to a request.',
        es: 'Mira la tarjeta y pide algo a tu compañero. Reacciona a una petición.',
      },
    ],
  },
  a2: {
    lesen: [
      {
        de: 'Sie lesen diesen Text in einer Zeitung. Wählen Sie für jede Aufgabe die richtige Lösung: a, b oder c.',
        en: 'You read this text in a newspaper. Choose the right answer for each task: a, b or c.',
        es: 'Lees este texto en un periódico. Elige la respuesta correcta para cada tarea: a, b o c.',
      },
      {
        de: 'Sie lesen eine Informationstafel. Wohin gehen Sie? Wählen Sie die richtige Lösung: a, b oder c.',
        en: 'You read an information board. Where do you go? Choose the right answer: a, b or c.',
        es: 'Lees un panel informativo. ¿Adónde vas? Elige la respuesta correcta: a, b o c.',
      },
      {
        de: 'Sie lesen eine E-Mail. Wählen Sie für jede Aufgabe die richtige Lösung: a, b oder c.',
        en: 'You read an email. Choose the right answer for each task: a, b or c.',
        es: 'Lees un correo electrónico. Elige la respuesta correcta para cada tarea: a, b o c.',
      },
      {
        de: 'Fünf Personen suchen etwas im Internet. Welche Anzeige passt zu welcher Person? Jede Anzeige passt nur einmal. Für eine Person gibt es keine Anzeige: Wählen Sie dann X.',
        en: 'Five people are looking for something online. Which ad suits which person? Each ad fits only once. For one person there is no ad: then choose X.',
        es: 'Cinco personas buscan algo en internet. ¿Qué anuncio corresponde a cada persona? Cada anuncio vale solo una vez. Para una persona no hay anuncio: en ese caso elige X.',
      },
    ],
    hoeren: [
      {
        de: 'Sie hören fünf kurze Texte. Sie hören jeden Text zweimal. Wählen Sie die richtige Lösung: a, b oder c.',
        en: 'You will hear five short texts. You will hear each one twice. Choose the right answer: a, b or c.',
        es: 'Vas a oír cinco textos breves. Oirás cada uno dos veces. Elige la respuesta correcta: a, b o c.',
      },
      {
        de: 'Sie hören ein Gespräch. Sie hören den Text einmal. Wählen Sie für jede Aufgabe ein passendes Bild. Jedes Bild passt nur einmal.',
        en: 'You will hear a conversation. You will hear it once. Choose a matching picture for each task. Each picture fits only once.',
        es: 'Vas a oír una conversación. La oirás una sola vez. Elige una imagen adecuada para cada tarea. Cada imagen vale solo una vez.',
      },
      {
        de: 'Sie hören fünf kurze Gespräche. Sie hören jeden Text einmal. Wählen Sie die richtige Lösung: a, b oder c.',
        en: 'You will hear five short conversations. You will hear each one once. Choose the right answer: a, b or c.',
        es: 'Vas a oír cinco conversaciones breves. Oirás cada una una sola vez. Elige la respuesta correcta: a, b o c.',
      },
      {
        de: 'Sie hören ein Interview. Sie hören den Text zweimal. Wählen Sie: Ja oder Nein?',
        en: 'You will hear an interview. You will hear it twice. Choose: yes or no?',
        es: 'Vas a oír una entrevista. La oirás dos veces. Elige: ¿sí o no?',
      },
    ],
    schreiben: [
      {
        de: 'Schreiben Sie eine kurze Nachricht (20–30 Wörter). Schreiben Sie zu allen drei Punkten.',
        en: 'Write a short message (20–30 words). Write about all three points.',
        es: 'Escribe un mensaje breve (20–30 palabras). Escribe sobre los tres puntos.',
      },
      {
        de: 'Schreiben Sie eine E-Mail (30–40 Wörter). Schreiben Sie zu allen drei Punkten. Denken Sie an Anrede und Gruß.',
        en: 'Write an email (30–40 words). Write about all three points. Remember a greeting and a sign-off.',
        es: 'Escribe un correo electrónico (30–40 palabras). Escribe sobre los tres puntos. No olvides el saludo y la despedida.',
      },
    ],
    sprechen: [
      {
        de: 'Sie bekommen vier Karten und stellen mit diesen Karten vier Fragen. Dann stellt Ihr Partner vier Fragen und Sie antworten.',
        en: 'You get four cards and ask four questions with them. Then your partner asks four questions and you answer.',
        es: 'Recibes cuatro tarjetas y haces cuatro preguntas con ellas. Después tu compañero te hace cuatro preguntas y tú respondes.',
      },
      {
        de: 'Sie bekommen eine Karte und erzählen etwas über Ihr Leben. Danach bekommen Sie eine Frage.',
        en: 'You get a card and talk about your life. Then you are asked a question.',
        es: 'Recibes una tarjeta y hablas de tu vida. Después te hacen una pregunta.',
      },
      {
        de: 'Sie möchten mit Ihrem Partner etwas zusammen machen. Sehen Sie in Ihren Kalender und finden Sie einen Termin.',
        en: 'You want to do something together with your partner. Look at your calendar and find a time.',
        es: 'Quieres hacer algo con tu compañero. Mira tu agenda y encuentra un momento.',
      },
    ],
  },
};

/** What the self-marking criteria are called. */
export const CRITERIA = {
  form: { de: 'Anrede und Gruß', en: 'Greeting and sign-off', es: 'Saludo y despedida' },
  task: { de: 'Aufgabenerfüllung', en: 'Task', es: 'Cumplimiento de la tarea' },
  language: { de: 'Sprache', en: 'Language', es: 'Lengua' },
  pronunciation: { de: 'Aussprache', en: 'Pronunciation', es: 'Pronunciación' },
} satisfies Record<string, Titled>;

/** What A to E mean, for each scale (best first). */
export const HINTS = {
  writingTask: [
    {
      de: 'Alle drei Punkte ganz erfüllt, passend zur Situation und zum Leser.',
      en: 'All three points fully covered, in a tone that fits the situation and the reader.',
      es: 'Los tres puntos tratados del todo, con un tono adecuado a la situación y al lector.',
    },
    {
      de: 'Zwei Punkte erfüllt, oder einer erfüllt und zwei teilweise.',
      en: 'Two points covered, or one covered and two partly.',
      es: 'Dos puntos tratados, o uno tratado y dos en parte.',
    },
    {
      de: 'Ein Punkt erfüllt und einer teilweise, oder alle nur teilweise.',
      en: 'One point covered and one partly, or all only partly.',
      es: 'Un punto tratado y otro en parte, o todos solo en parte.',
    },
    {
      de: 'Nur ein Punkt erfüllt oder teilweise erfüllt.',
      en: 'Only one point covered, fully or partly.',
      es: 'Solo un punto tratado, del todo o en parte.',
    },
    {
      de: 'Weniger als die Hälfte der Wörter oder Thema verfehlt. Dann gibt es für diesen Teil 0 Punkte.',
      en: 'Under half the words, or off topic. Then this part scores 0.',
      es: 'Menos de la mitad de las palabras o fuera de tema. Entonces esta parte vale 0.',
    },
  ],
  speakingTask: [
    {
      de: 'Aufgabe ganz erfüllt, passend zur Situation und zum Partner.',
      en: 'Task fully done, fitting the situation and the partner.',
      es: 'Tarea cumplida del todo, adecuada a la situación y al compañero.',
    },
    { de: 'Aufgabe überwiegend erfüllt.', en: 'Task mostly done.', es: 'Tarea cumplida en su mayor parte.' },
    { de: 'Aufgabe teilweise erfüllt.', en: 'Task partly done.', es: 'Tarea cumplida en parte.' },
    { de: 'Aufgabe kaum erfüllt.', en: 'Task hardly done.', es: 'Tarea apenas cumplida.' },
    {
      de: 'Zu wenig gesagt, um es zu bewerten. Dann gibt es für diesen Teil 0 Punkte.',
      en: 'Too little said to mark. Then this part scores 0.',
      es: 'Demasiado poco para evaluar. Entonces esta parte vale 0.',
    },
  ],
  language: [
    {
      de: 'Passend und abwechslungsreich; einzelne Fehler stören das Verständnis nicht.',
      en: 'Fitting and varied; the odd mistake doesn’t get in the way.',
      es: 'Adecuada y variada; algún error suelto no impide entender.',
    },
    {
      de: 'Überwiegend passend; mehrere Fehler, aber alles verständlich.',
      en: 'Mostly fitting; several mistakes, but everything is clear.',
      es: 'Casi siempre adecuada; varios errores, pero todo se entiende.',
    },
    {
      de: 'Teilweise passend; Fehler machen manches schwer verständlich.',
      en: 'Partly fitting; mistakes make some things hard to follow.',
      es: 'Adecuada en parte; los errores dificultan entender algunas cosas.',
    },
    {
      de: 'Kaum passend; Fehler machen vieles unverständlich.',
      en: 'Hardly fitting; mistakes make much of it unclear.',
      es: 'Poco adecuada; por los errores mucho no se entiende.',
    },
    { de: 'Durchgehend unpassend.', en: 'Unsuitable throughout.', es: 'Inadecuada en todo momento.' },
  ],
  pronunciation: [
    {
      de: 'Einzelne Abweichungen, alles gut verständlich.',
      en: 'The odd slip; everything is easy to understand.',
      es: 'Alguna desviación suelta; todo se entiende bien.',
    },
    {
      de: 'Häufige Abweichungen, aber gut verständlich.',
      en: 'Frequent slips, but still easy to understand.',
      es: 'Desviaciones frecuentes, pero se entiende bien.',
    },
    {
      de: 'Abweichungen stören stellenweise das Verständnis.',
      en: 'Slips get in the way in places.',
      es: 'Las desviaciones dificultan entender en algunos momentos.',
    },
    {
      de: 'Starke Abweichungen stören das Verständnis sehr.',
      en: 'Strong slips make it very hard to follow.',
      es: 'Desviaciones fuertes dificultan mucho entender.',
    },
    { de: 'Nicht mehr verständlich.', en: 'No longer understandable.', es: 'Ya no se entiende.' },
  ],
} satisfies Record<string, Titled[]>;

/** The heading of Sprechen Teil 1 cards in A2. */
export const PERSON_QUESTIONS: Titled = { de: 'Fragen zur Person', en: 'Questions about you', es: 'Preguntas personales' };

/** "keine Anzeige": the choice for the person no ad fits (Lesen Teil 4 of A2). */
export const NO_AD: Titled = { de: 'keine passende Anzeige', en: 'no suitable ad', es: 'ningún anuncio adecuado' };
