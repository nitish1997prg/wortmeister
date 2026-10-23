
"use client";

import {
  useSavedVocabulary,
  type SavedWordEntry,
} from "@/hooks/useSavedVocabulary";

interface Props {
  songSlug: string;
}

export default function SongVerbsSection({
  songSlug,
}: Props) {
  const { words, loading, error } =
    useSavedVocabulary(songSlug);

  // Group different appearances of a verb
  // under the same dictionary form.
  const groups = new Map<string, SavedWordEntry[]>();

  for (const word of words) {
    const part = word.explanation.partOfSpeech;

    if (!/\bverb\b/i.test(part)) continue;

    const lemma = word.explanation.lemma
      .trim()
      .toLocaleLowerCase("de-DE");

    const existing = groups.get(lemma) ?? [];
    groups.set(lemma, [...existing, word]);
  }

  const verbs = Array.from(groups.entries()).sort(
    ([a], [b]) => a.localeCompare(b, "de")
  );

  if (loading) {
    return <p role="status">Loading verbs...</p>;
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
          Verbs
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          Explore verbs discovered and saved
          while learning this song.
        </p>
      </div>

      <p className="text-sm text-gray-500">
        {verbs.length} unique saved verbs
      </p>

      {verbs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6">
          <p className="font-medium">
            No saved verbs yet
          </p>

          <p className="mt-2 text-sm text-gray-600">
            Return to Lyrics and save a verb
            to start building this section.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {verbs.map(([lemma, entries]) => {
            const primary = entries[0].explanation;

            const forms = Array.from(
              new Set(
                entries.flatMap(
                  (entry) =>
                    entry.explanation.forms
                )
              )
            ).filter(Boolean);

            return (
              <details
                key={lemma}
                className="rounded-xl border border-gray-200 bg-white p-5"
              >
                <summary className="cursor-pointer">
                  <h3 className="inline text-xl font-semibold">
                    {primary.lemma}
                  </h3>

                  <p className="mt-2 text-sm text-gray-600">
                    {primary.english}
                  </p>

                  <p className="mt-2 text-xs text-teal-700">
                    {entries.length} saved context(s)
                  </p>
                </summary>

                <div className="mt-5 space-y-5 border-t pt-4">
                  {forms.length > 0 && (
                    <div>
                      <h4 className="font-semibold">
                        Related forms
                      </h4>

                      <p className="mt-2 text-sm text-gray-600">
                        {forms.join(" · ")}
                      </p>
                    </div>
                  )}

                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-lg bg-gray-50 p-4"
                    >
                      <p className="text-sm font-medium text-teal-800">
                        Encountered: {entry.word}
                      </p>

                      <h4 className="mt-3 text-sm font-semibold">
                        Grammar explanation
                      </h4>

                      <p className="mt-2 text-sm leading-6 text-gray-700">
                        {entry.explanation.grammar}
                      </p>

                      <h4 className="mt-4 text-sm font-semibold">
                        Example
                      </h4>

                      <p className="mt-2 text-sm">
                        {entry.explanation.exampleGerman}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {entry.explanation.exampleEnglish}
                      </p>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Related forms come from saved AI explanations.
        They are not yet verified conjugation tables.
      </p>
    </section>
  );
}
