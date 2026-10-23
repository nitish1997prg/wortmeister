
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
      <p role="alert" className="text-[var(--wm-danger)]">
        {error}
      </p>
    );
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="wm-section-title">
          Grammar
        </h2>

        <p className="mt-2 text-sm text-[var(--wm-muted)]">
          Review grammatical concepts encountered
          in your saved song vocabulary.
        </p>
      </div>

      <p className="text-sm text-[var(--wm-muted)]">
        {topics.length} grammar topics
      </p>

      {topics.length === 0 ? (
        <div className="wm-card border-dashed p-6">
          <p className="font-medium">
            No grammar notes yet
          </p>

          <p className="mt-2 text-sm text-[var(--wm-muted)]">
            Save some German words from the lyrics
            to build your grammar collection.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {topics.map(([topic, entries]) => (
            <details
              key={topic}
              className="wm-card p-5"
            >
              <summary className="cursor-pointer font-semibold">
                {topic}

                <span className="ml-2 text-xs font-normal text-[var(--wm-muted)]">
                  ({entries.length})
                </span>
              </summary>

              <div className="mt-4 space-y-4 border-t pt-4">
                {entries.map((entry) => (
                  <article
                    key={entry.id}
                    className="wm-subtle p-4"
                  >
                    <h3 className="font-semibold text-[var(--wm-accent)]">
                      {entry.explanation.lemma}
                    </h3>

                    <p className="mt-1 text-sm text-[var(--wm-muted)]">
                      {entry.explanation.english}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-[var(--wm-text)]">
                      {entry.explanation.grammar}
                    </p>

                    <p className="mt-3 text-sm font-medium">
                      {entry.explanation.exampleGerman}
                    </p>

                    <p className="mt-1 text-sm text-[var(--wm-muted)]">
                      {entry.explanation.exampleEnglish}
                    </p>
                  </article>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}

      <p className="text-xs text-[var(--wm-muted)]">
        Topics are grouped heuristically from
        saved AI explanations. Review grammatical
        claims before treating them as authoritative.
      </p>
    </section>
  );
}
