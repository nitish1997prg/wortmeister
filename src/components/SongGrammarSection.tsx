
"use client";

import {
  useSavedVocabulary,
  type SavedWordEntry,
} from "@/hooks/useSavedVocabulary";

interface Props {
  songSlug: string;
}

function getGrammarTopics(
  entry: SavedWordEntry
): string[] {
  const grammar = entry.explanation.grammar;
  const part = entry.explanation.partOfSpeech;
  const topics: string[] = [];

  if (
    /subordinate|word order|verb.*end|nebensatz|hauptsatz|conjugated verb.*end/i
      .test(grammar)
  ) {
    topics.push("Sentence structure & word order");
  }

  if (
    /dative|accusative|nominative|genitive|\bcase\b/i
      .test(grammar)
  ) {
    topics.push("Grammatical cases");
  }

  if (/modal verb/i.test(part)) {
    topics.push("Modal verbs");
  }

  if (/pronoun/i.test(part)) {
    topics.push("Pronouns");
  }

  if (/\bverb\b/i.test(part)) {
    topics.push("Verb forms & conjugation");
  }

  if (
    /noun|article|determiner/i.test(part)
  ) {
    topics.push("Nouns & articles");
  }

  if (/adjective/i.test(part)) {
    topics.push("Adjectives");
  }

  if (/preposition/i.test(part)) {
    topics.push("Prepositions");
  }

  if (
    /conjunction/i.test(part) &&
    topics.length === 0
  ) {
    topics.push("Conjunctions");
  }

  return topics.length > 0
    ? topics
    : ["Other grammar notes"];
}

export default function SongGrammarSection({
  songSlug,
}: Props) {
  const { words, loading, error } =
    useSavedVocabulary(songSlug);

  const groups = new Map<
    string,
    SavedWordEntry[]
  >();

  for (const word of words) {
    for (const topic of getGrammarTopics(word)) {
      const current = groups.get(topic) ?? [];

      groups.set(topic, [...current, word]);
    }
  }

  const topics = Array.from(groups.entries()).sort(
    ([a], [b]) => a.localeCompare(b)
  );

  if (loading) {
    return <p role="status">Loading grammar...</p>;
  }

  if (error) {
    return (
      <p role="alert" className="text-red-700">
        {error}
      </p>
    );
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">
          Grammar
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          Review grammatical concepts encountered
          in your saved song vocabulary.
        </p>
      </div>

      <p className="text-sm text-gray-500">
        {topics.length} grammar topics
      </p>

      {topics.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6">
          <p className="font-medium">
            No grammar notes yet
          </p>

          <p className="mt-2 text-sm text-gray-600">
            Save some German words from the lyrics
            to build your grammar collection.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {topics.map(([topic, entries]) => (
            <details
              key={topic}
              className="rounded-xl border border-gray-200 bg-white p-5"
            >
              <summary className="cursor-pointer font-semibold">
                {topic}

                <span className="ml-2 text-xs font-normal text-gray-500">
                  ({entries.length})
                </span>
              </summary>

              <div className="mt-4 space-y-4 border-t pt-4">
                {entries.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-lg bg-gray-50 p-4"
                  >
                    <h3 className="font-semibold text-teal-800">
                      {entry.explanation.lemma}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {entry.explanation.english}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-gray-700">
                      {entry.explanation.grammar}
                    </p>

                    <p className="mt-3 text-sm font-medium">
                      {entry.explanation.exampleGerman}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {entry.explanation.exampleEnglish}
                    </p>
                  </article>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Topics are grouped heuristically from
        saved AI explanations. Review grammatical
        claims before treating them as authoritative.
      </p>
    </section>
  );
}
