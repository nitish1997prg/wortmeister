
export interface WordExplanation {
  lemma: string;
  english: string;
  level: "A1" | "A2";
  partOfSpeech: string;
  forms: string[];
  grammar: string;
  exampleGerman: string;
  exampleEnglish: string;
}

const vocabulary: WordExplanation[] = [
  {
    lemma: "wollen",
    english: "to want",
    level: "A1",
    partOfSpeech: "Modal verb",
    forms: ["wollen", "woll'n", "will"],
    grammar:
      "Wollen is a modal verb. Ich will means I want, " +
      "while wir wollen means we want. " +
      "A second verb normally goes at the end in the infinitive.",
    exampleGerman: "Wir wollen Deutsch lernen.",
    exampleEnglish: "We want to learn German.",
  },
  {
    lemma: "vertrauen",
    english: "to trust",
    level: "A2",
    partOfSpeech: "Verb",
    forms: ["vertrauen", "vertraut"],
    grammar:
      "Vertraut can be the present-tense ihr form of vertrauen. " +
      "When trusting a person, vertrauen takes the dative case: " +
      "ich vertraue dir.",
    exampleGerman: "Ich vertraue meiner Freundin.",
    exampleEnglish: "I trust my friend.",
  },
  {
    lemma: "verstehen",
    english: "to understand",
    level: "A1",
    partOfSpeech: "Verb",
    forms: [
      "verstehen",
      "versteht",
      "versteh",
      "versteh'n",
    ],
    grammar:
      "Versteht can be the present-tense form for ihr " +
      "or er/sie/es. Versteh is a shortened form of verstehe " +
      "in informal or poetic language.",
    exampleGerman: "Versteht ihr die Aufgabe?",
    exampleEnglish: "Do you all understand the task?",
  },
  {
    lemma: "hören",
    english: "to hear",
    level: "A1",
    partOfSpeech: "Verb",
    forms: ["hören", "hör'n", "hört"],
    grammar:
      "Hört can be used with ihr or er/sie/es. " +
      "The infinitive is hören.",
    exampleGerman: "Ihr hört die Musik.",
    exampleEnglish: "You all hear the music.",
  },
  {
    lemma: "spüren",
    english: "to feel or sense",
    level: "A2",
    partOfSpeech: "Verb",
    forms: ["spüren", "spür'n"],
    grammar:
      "Spür'n is a shortened form of spüren, " +
      "often found in songs and informal speech.",
    exampleGerman: "Ich spüre den kalten Wind.",
    exampleEnglish: "I feel the cold wind.",
  },
  {
    lemma: "können",
    english: "can / to be able to",
    level: "A1",
    partOfSpeech: "Modal verb",
    forms: ["können", "könnt"],
    grammar:
      "Könnt is the present-tense ihr form of können. " +
      "It expresses ability or possibility.",
    exampleGerman: "Könnt ihr morgen kommen?",
    exampleEnglish: "Can you all come tomorrow?",
  },
  {
    lemma: "sehen",
    english: "to see",
    level: "A1",
    partOfSpeech: "Verb",
    forms: ["sehen", "seh'n", "seht"],
    grammar:
      "Seht is the present-tense ihr form of sehen. " +
      "Seh'n is a shortened form of sehen.",
    exampleGerman: "Seht ihr das Haus?",
    exampleEnglish: "Do you all see the house?",
  },
  {
    lemma: "fühlen",
    english: "to feel",
    level: "A2",
    partOfSpeech: "Verb",
    forms: ["fühlen", "fühlt"],
    grammar:
      "Fühlt can be the present-tense form for ihr " +
      "or er/sie/es. Fühlen often describes feelings " +
      "or physical sensations.",
    exampleGerman: "Fühlt ihr die Wärme?",
    exampleEnglish: "Do you all feel the warmth?",
  },
  {
    lemma: "glauben",
    english: "to believe",
    level: "A1",
    partOfSpeech: "Verb",
    forms: ["glauben", "glaubt"],
    grammar:
      "Glaubt is used with ihr or er/sie/es. " +
      "When believing a person, glauben can take a dative object.",
    exampleGerman: "Ich glaube dir.",
    exampleEnglish: "I believe you.",
  },
  {
    lemma: "mir",
    english: "me / to me",
    level: "A1",
    partOfSpeech: "Personal pronoun",
    forms: ["mir"],
    grammar:
      "Mir is the dative form of ich. " +
      "It is used with verbs such as helfen and vertrauen.",
    exampleGerman: "Kannst du mir helfen?",
    exampleEnglish: "Can you help me?",
  },
  {
    lemma: "euch",
    english: "you (plural object)",
    level: "A1",
    partOfSpeech: "Personal pronoun",
    forms: ["euch"],
    grammar:
      "Euch is both the accusative and dative form " +
      "of the plural pronoun ihr. " +
      "The grammatical case depends on the verb.",
    exampleGerman: "Ich sehe euch.",
    exampleEnglish: "I see you all.",
  },
  {
    lemma: "euer",
    english: "your (plural)",
    level: "A1",
    partOfSpeech: "Possessive determiner",
    forms: ["euer", "eure"],
    grammar:
      "Euer expresses possession when addressing a group. " +
      "Eure is used with certain feminine and plural noun forms.",
    exampleGerman: "Sind das eure Bücher?",
    exampleEnglish: "Are those your books?",
  },
];

const wordLookup = new Map<string, WordExplanation>();

for (const entry of vocabulary) {
  for (const form of entry.forms) {
    wordLookup.set(form.toLocaleLowerCase("de-DE"), entry);
  }
}

export function lookupGermanWord(
  word: string
): WordExplanation | undefined {
  return wordLookup.get(
    word.normalize("NFC").toLocaleLowerCase("de-DE")
  );
}
