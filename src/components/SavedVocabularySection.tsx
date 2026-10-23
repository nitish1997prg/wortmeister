
"use client";

import { useEffect, useMemo, useState } from "react";

import WordDetails from "@/components/WordDetails";

import type { WordExplanation } from "@/data/germanVocabulary";

interface SavedWord {
  id: string;
  cacheKey: string;
  word: string;
  context: string;
  explanation: WordExplanation;
  savedAt: string;
}

interface SavedVocabularySectionProps {
  songSlug: string;
}

function getCategory(partOfSpeech: string): string {
  const value = partOfSpeech.toLowerCase();

  if (value.includes("verb")) return "Verbs";
  if (value.includes("noun")) return "Nouns";
  if (value.includes("pronoun")) return "Pronouns";
  if (value.includes("adjective")) return "Adjectives";
  if (value.includes("conjunction")) return "Conjunctions";
  if (value.includes("preposition")) return "Prepositions";
  if (value.includes("adverb")) return "Adverbs";

  if (
    value.includes("determiner") ||
    value.includes("article")
  ) {
    return "Determiners";
  }

  return "Other";
}

export default function SavedVocabularySection({
  songSlug,
}: SavedVocabularySectionProps) {
  const [words, setWords] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [expandedId, setExpandedId] =
    useState<string | null>(null);

  const [removingId, setRemovingId] =
    useState<string | null>(null);

  const [refreshCount, setRefreshCount] = useState(0);

  // Fetch saved vocabulary from our existing API.
  useEffect(() => {
    const controller = new AbortController();

    async function loadVocabulary() {
      try {
        const response = await fetch(
          `/api/songs/${encodeURIComponent(songSlug)}/vocabulary`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data: {
          words?: SavedWord[];
          error?: string;
        } = await response.json();

        if (!response.ok || !Array.isArray(data.words)) {
          throw new Error(
            data.error ?? "Failed to retrieve saved words."
          );
        }

        if (!controller.signal.aborted) {
          setWords(data.words);
          setError(null);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load saved vocabulary."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadVocabulary();

    return () => controller.abort();
  }, [songSlug, refreshCount]);

  // Refresh when a word is saved or removed
  // from the lyrics explanation panel.
  useEffect(() => {
    function handleVocabularyChange(event: Event) {
      const customEvent = event as CustomEvent<{
        songSlug: string;
      }>;

      if (customEvent.detail?.songSlug === songSlug) {
        setRefreshCount((count) => count + 1);
      }
    }

    window.addEventListener(
      "wortmeister:vocabulary-changed",
      handleVocabularyChange
    );

    return () => {
      window.removeEventListener(
        "wortmeister:vocabulary-changed",
        handleVocabularyChange
      );
    };
  }, [songSlug]);

  // Normalize model-generated grammatical categories.
  const categories = useMemo(() => {
    return Array.from(
      new Set(
        words.map((word) =>
          getCategory(word.explanation.partOfSpeech)
        )
      )
    ).sort();
  }, [words]);

  // Search and filtering happen locally.
  const filteredWords = useMemo(() => {
    const query = search
      .trim()
      .toLocaleLowerCase("de-DE");

    return words.filter((word) => {
      const matchesCategory =
        category === "All" ||
        getCategory(word.explanation.partOfSpeech) ===
          category;

      const searchableText = [
        word.word,
        word.explanation.lemma,
        word.explanation.english,
        word.explanation.partOfSpeech,
        word.context,
      ]
        .join(" ")
        .toLocaleLowerCase("de-DE");

      return (
        matchesCategory &&
        searchableText.includes(query)
      );
    });
  }, [words, search, category]);

  async function removeWord(word: SavedWord) {
    if (removingId !== null) return;

    setRemovingId(word.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/songs/${encodeURIComponent(songSlug)}/vocabulary`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cacheKey: word.cacheKey,
          }),
        }
      );

      const result: {
        saved?: boolean;
        error?: string;
      } = await response.json();

      if (!response.ok || result.saved !== false) {
        throw new Error(
          result.error ?? "Unable to remove word."
        );
      }

      // Update the list without reloading the page.
      setWords((previous) =>
        previous.filter((item) => item.id !== word.id)
      );

      setExpandedId((current) =>
        current === word.id ? null : current
      );

      // Also inform the lyrics panel about the change.
      window.dispatchEvent(
        new CustomEvent("wortmeister:vocabulary-changed", {
          detail: {
            songSlug,
            cacheKey: word.cacheKey,
            saved: false,
          },
        })
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove saved word."
      );
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section
      id="saved-vocabulary"
      className="space-y-5"
    >
      {/* Heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">
            Your Saved Vocabulary
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Review German words you&apos;ve saved
            while listening to this song.
          </p>
        </div>

        <span className="rounded-full bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800">
          {words.length} saved words
        </span>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p role="status" className="text-sm text-gray-500">
          Loading saved vocabulary...
        </p>
      ) : words.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <h3 className="font-semibold">
            No saved vocabulary yet
          </h3>

          <p className="mt-2 text-sm text-gray-600">
            Click a German word in the lyrics,
            read its explanation, and select
            Save Word to add it here.
          </p>
        </div>
      ) : (
        <>
          {/* Search and category filter */}
          <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_200px]">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search vocabulary..."
              aria-label="Search saved vocabulary"
              className="min-w-0 rounded-lg border border-gray-300 px-4 py-3 text-sm"
            />

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              aria-label="Filter by grammatical category"
              className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm"
            >
              <option value="All">All categories</option>

              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <p className="text-sm text-gray-500">
            Showing {filteredWords.length} of{" "}
            {words.length} saved entries
          </p>

          {/* Saved word cards */}
          <div className="grid gap-4">
            {filteredWords.map((word) => {
              const expanded =
                expandedId === word.id;

              return (
                <article
                  key={word.id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                    <div className="min-w-0">
                      <h3 className="text-xl font-semibold">
                        {word.explanation.lemma}
                      </h3>

                      <p className="mt-1 text-sm text-gray-600">
                        {word.explanation.english}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                          {
                            word.explanation
                              .partOfSpeech
                          }
                        </span>

                        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs text-teal-800">
                          {word.explanation.level}
                        </span>

                        {word.word.toLocaleLowerCase(
                          "de-DE"
                        ) !==
                          word.explanation.lemma.toLocaleLowerCase(
                            "de-DE"
                          ) && (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                            Form: {word.word}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() =>
                        setExpandedId(
                          expanded ? null : word.id
                        )
                      }
                      className="rounded-lg border border-teal-700 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
                    >
                      {expanded
                        ? "Hide explanation"
                        : "Review word"}
                    </button>
                  </div>

                  {expanded && (
                    <div className="space-y-4 border-t border-gray-200 p-5">
                      <div>
                        <h4 className="text-sm font-semibold">
                          Original context
                        </h4>

                        <p className="mt-2 text-sm text-gray-600">
                          {word.context}
                        </p>
                      </div>

                      {word.explanation.forms.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold">
                            Related forms
                          </h4>

                          <p className="mt-2 text-sm text-gray-600">
                            {word.explanation.forms.join(
                              " · "
                            )}
                          </p>
                        </div>
                      )}

                      <WordDetails
                        word={word.explanation}
                        isSaved={true}
                        canSave={true}
                        saving={removingId === word.id}
                        onToggleSave={() => {
                          void removeWord(word);
                        }}
                        onClose={() =>
                          setExpandedId(null)
                        }
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {filteredWords.length === 0 && (
            <p className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-600">
              No words match your search or filter.
            </p>
          )}
        </>
      )}
    </section>
  );
}
