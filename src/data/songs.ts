
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


export interface SongAnnotation {
  id: string;
  seconds: number;
  title: string;
  topic: string;
  explanation: string;
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
      id: "intro",
      seconds: 0,
      title: "Listening introduction",
      topic: "Modal verbs",
      explanation:
        "Listen for different forms of the verb wollen, meaning 'to want'.",
    },
    {
      id: "checkpoint",
      seconds: 30,
      title: "Listening checkpoint",
      topic: "Listening comprehension",
      explanation:
        "Pause here and identify any German words you recognize.",
    },
  ],


  },
];
