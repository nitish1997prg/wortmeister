
export type GermanLevel = "A1" | "A2" | "B1" | "B2";

export interface VocabularyItem {
  german: string;
  english: string;
  example: string;
  explanation: string;
}

export interface Song {
  slug: string;
  title: string;
  artist: string;
  practiceLevel: GermanLevel;
  difficultyNote: string;
  youtubeId: string;
  grammarTopics: string[];
  vocabulary: VocabularyItem[];
  listeningPrompts: string[];
  quiz: QuizQuestion[];
  annotations: SongAnnotation[];
}


export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}



export interface ExampleSentence {
  german: string;
  english: string;
}

export interface SongAnnotation {
  id: string;
  seconds: number;
  title: string;
  topic: string;
  explanation: string;

  // What should the learner understand?
  learningObjective: string;

  // Detailed grammatical explanation.
  grammarExplanation: string;

  // Original example sentences, not song lyrics.
  examples: ExampleSentence[];

  // Corresponding words in song.vocabulary.
  relatedVocabulary: string[];

  // A listening activity for this moment.
  listeningTask: string;

  // Whether we personally verified the timestamp.
  timestampVerified: boolean;
}



export const songs: Song[] = [
  {
    slug: "ich-will",
    title: "Ich will",
    artist: "Rammstein",
    practiceLevel: "A2",
    difficultyNote:
      "Selected vocabulary is suitable for A2 practice. The full song contains more complex language.",
    youtubeId: "EOnSh3QlpbQ",
    grammarTopics: [
      "Modal verbs",
      "Present tense",
      "Verb conjugation",
    ],
  vocabulary: [
    {
      german: "wollen",
      english: "to want",
      example: "Ich will Deutsch lernen.",
      explanation:
        "Wollen is a modal verb. Its present-tense forms include ich will, du willst, er/sie/es will, and wir wollen.",
    },
    {
      german: "hören",
      english: "to hear / listen",
      example: "Hörst du die Musik?",
      explanation:
        "Hören is a regular verb. Ich höre, du hörst, and ihr hört are present-tense forms.",
    },
    {
      german: "verstehen",
      english: "to understand",
      example: "Ich verstehe diese Frage.",
      explanation:
        "Verstehen means to understand. Some forms are ich verstehe, du verstehst, and ihr versteht.",
    },
  ],
  
  listeningPrompts: [
    "Listen for the first-person form of wollen.",
    "Try to recognize the verbs hören and verstehen.",
    "Notice how often the same grammatical structures repeat.",
  ],
  
  quiz: [
    {
      id: "q1",
      question: "What does 'wollen' mean?",
      options: [
        "To hear",
        "To want",
        "To understand",
      ],
      correctOptionIndex: 1,
      explanation:
        "Wollen means 'to want'. Ich will means 'I want'.",
    },
    {
      id: "q2",
      question: "Complete: Wir ___ Deutsch lernen.",
      options: [
        "will",
        "wollt",
        "wollen",
      ],
      correctOptionIndex: 2,
      explanation:
        "Wir takes the plural verb form wollen.",
    },
    {
      id: "q3",
      question: "What does 'Hörst du die Musik?' mean?",
      options: [
        "Do you hear the music?",
        "Do you understand the music?",
        "Do you like the music?",
      ],
      correctOptionIndex: 0,
      explanation:
        "Hörst is the du form of hören, meaning 'to hear'.",
    },
  ],
  
  
  annotations: [
    {
      id: "wollen-introduction",
      seconds: 0,
      title: "Understanding wollen",
      topic: "Modal verbs",
      explanation:
        "Recognize how wollen expresses a wish or intention.",

      learningObjective:
        "Understand the present-tense forms of wollen.",

      grammarExplanation:
        "Wollen means 'to want'. It is a modal verb. "
        + "With ich, it becomes will. "
        + "When used with another verb, the second verb "
        + "normally appears at the end in the infinitive.",

      examples: [
        {
          german: "Ich will heute Deutsch üben.",
          english: "I want to practice German today.",
        },
        {
          german: "Wir wollen nach Berlin fahren.",
          english: "We want to travel to Berlin.",
        },
      ],

      relatedVocabulary: ["wollen"],

      listeningTask:
        "Listen for the forms of wollen. "
        + "Can you recognize the speaker's intentions?",

      timestampVerified: false,
    },
    {
      id: "hearing-understanding",
      seconds: 30,
      title: "Hören and verstehen",
      topic: "Present-tense conjugation",
      explanation:
        "Pay attention to the verbs used when addressing other people.",

      learningObjective:
        "Recognize hört and versteht as forms "
        + "of hören and verstehen.",

      grammarExplanation:
        "Hören means 'to hear' and verstehen "
        + "means 'to understand'. "
        + "When speaking to a group using ihr, "
        + "these verbs become hört and versteht.",

      examples: [
        {
          german: "Ihr hört die Musik.",
          english: "You all hear the music.",
        },
        {
          german: "Ihr versteht die Frage.",
          english: "You all understand the question.",
        },
      ],

      relatedVocabulary: [
        "hören",
        "verstehen",
      ],

      listeningTask:
        "Listen for different forms of hören "
        + "and verstehen. Try identifying who "
        + "the singer is addressing.",

      timestampVerified: false,
    },
  ],



  },
];
