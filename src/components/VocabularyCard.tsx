
"use client";

import { useState } from "react";
import type { VocabularyItem } from "@/data/songs";

interface VocabularyCardProps {
  word: VocabularyItem;
}

export default function VocabularyCard({
  word,
}: VocabularyCardProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            German vocabulary
          </p>

          <h3 className="text-2xl font-semibold">
            {word.german}
          </h3>
        </div>

        <button
          type="button"
          aria-expanded={revealed}
          onClick={() => setRevealed((previous) => !previous)}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
        >
          {revealed ? "Hide meaning" : "Reveal meaning"}
        </button>
      </div>

      {revealed && (
        <div className="mt-6 border-t border-gray-200 pt-5">
          <p className="text-lg font-semibold text-teal-700">
            {word.english}
          </p>

          <div className="mt-4">
            <p className="text-xs font-medium uppercase text-gray-500">
              Example sentence
            </p>

            <p className="mt-2 italic">
              {word.example}
            </p>
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium uppercase text-gray-500">
              Grammar explanation
            </p>

            <p className="mt-2 text-sm text-gray-700">
              {word.explanation}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}
