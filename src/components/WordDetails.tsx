
"use client";

import type { WordExplanation } from "@/data/germanVocabulary";

interface WordDetailsProps {
  word: WordExplanation;
  onClose: () => void;

  isSaved: boolean;
  canSave: boolean;
  saving: boolean;
  onToggleSave: () => void;
}

export default function WordDetails({
  word,
  onClose,
  isSaved,
  canSave,
  saving,
  onToggleSave,
}: WordDetailsProps) {
  return (
    <aside
      aria-label="Vocabulary explanation"
      className="rounded-xl border border-[var(--wm-accent)] bg-[rgb(var(--wm-accent-rgb)/0.13)] p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--wm-accent)]">
            German vocabulary
          </p>

          <h3 className="mt-2 text-2xl font-bold text-[var(--wm-text)]">
            {word.lemma}
          </h3>

          <p className="mt-1 text-lg text-[var(--wm-accent)]">
            {word.english}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close vocabulary explanation"
          className="wm-button-secondary rounded-lg border bg-[var(--wm-surface)] px-3 py-2 text-sm"
        >
          ✕
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="wm-badge">
          {word.partOfSpeech}
        </span>

        <span className="wm-badge">
          {word.level}
        </span>
      </div>

      <div className="mt-5">
        <h4 className="text-sm font-semibold text-[var(--wm-text)]">
          Grammar explanation
        </h4>

        <p className="mt-2 text-sm leading-6 text-[var(--wm-text)]">
          {word.grammar}
        </p>
      </div>

      <div className="mt-5 rounded-lg bg-[var(--wm-surface)] p-4">
        <p className="text-xs font-semibold uppercase text-[var(--wm-muted)]">
          Example sentence
        </p>

        <p className="mt-2 font-medium text-[var(--wm-text)]">
          {word.exampleGerman}
        </p>

        <p className="mt-2 text-sm text-[var(--wm-muted)]">
          {word.exampleEnglish}
        </p>
      </div>


    <div className="mt-5 border-t border-[var(--wm-accent)] pt-4">
      <button
        type="button"
        disabled={!canSave || saving}
        onClick={onToggleSave}
        className={`w-full ${
          isSaved
            ? "wm-button-secondary"
            : "wm-button-primary"
        }`}
      >
        {saving
          ? "Updating..."
          : isSaved
            ? "✓ Saved — Remove Word"
            : "＋ Save Word"}
      </button>

      {!canSave && (
        <p className="mt-2 text-center text-xs text-[var(--wm-muted)]">
          Saving is available once the AI explanation
          and its saved status are ready.
        </p>
      )}
    </div>

    </aside>
  );
}
