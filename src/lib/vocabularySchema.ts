
import { z } from "zod";

export const ExplanationSchema = z.object({
  lemma: z.string().min(1),
  english: z.string().min(1),
  level: z.enum(["A1", "A2"]),
  partOfSpeech: z.string().min(1),
  forms: z.array(z.string()).max(10),
  grammar: z.string().min(1),
  exampleGerman: z.string().min(1),
  exampleEnglish: z.string().min(1),
});

export type VocabularyExplanationData =
  z.infer<typeof ExplanationSchema>;
