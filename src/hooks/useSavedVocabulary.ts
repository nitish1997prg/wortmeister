
"use client";

import { useEffect, useState } from "react";

import type { WordExplanation } from "@/data/germanVocabulary";

export interface SavedWordEntry {
  id: string;
  cacheKey: string;
  word: string;
  context: string;
  explanation: WordExplanation;
  savedAt: string;
}

export function useSavedVocabulary(songSlug: string) {
  const [words, setWords] = useState<SavedWordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadWords() {
      try {
        const response = await fetch(
          `/api/songs/${encodeURIComponent(songSlug)}/vocabulary`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data: {
          words?: SavedWordEntry[];
          error?: string;
        } = await response.json();

        if (!response.ok || !Array.isArray(data.words)) {
          throw new Error(
            data.error ?? "Unable to load vocabulary."
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
              : "Vocabulary request failed."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadWords();

    return () => controller.abort();
  }, [songSlug, refreshKey]);

  useEffect(() => {
    function handleChange(event: Event) {
      const change = (
        event as CustomEvent<{ songSlug: string }>
      ).detail;

      if (change?.songSlug === songSlug) {
        setRefreshKey((value) => value + 1);
      }
    }

    window.addEventListener(
      "wortmeister:vocabulary-changed",
      handleChange
    );

    return () => {
      window.removeEventListener(
        "wortmeister:vocabulary-changed",
        handleChange
      );
    };
  }, [songSlug]);

  return { words, loading, error };
}
