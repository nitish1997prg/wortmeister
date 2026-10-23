
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
    <article className="wm-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--wm-muted)]">
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
          className="wm-button-primary px-4 py-2 text-sm font-medium transition"
        >
          {revealed ? "Hide meaning" : "Reveal meaning"}
        </button>
      </div>

      {revealed && (
        <div className="mt-6 border-t border-[var(--wm-border)] pt-5">
          <p className="text-lg font-semibold text-[var(--wm-accent)]">
            {word.english}
          </p>

          <div className="mt-4">
            <p className="text-xs font-medium uppercase text-[var(--wm-muted)]">
              Example sentence
            </p>

            <p className="mt-2 italic">
              {word.example}
            </p>
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium uppercase text-[var(--wm-muted)]">
              Grammar explanation
            </p>

            <p className="mt-2 text-sm text-[var(--wm-text)]">
              {word.explanation}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}
