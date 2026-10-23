
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
      className="space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--wm-accent)]">
            German vocabulary
          </p>

          <h3 className="mt-2 text-xl font-bold text-[var(--wm-text)]">
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
          Close
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="wm-badge">
          {word.partOfSpeech}
        </span>

        <span className="wm-badge">
          {word.level}
        </span>
      </div>

      <div className="mt-3">
        <h4 className="text-sm font-semibold text-[var(--wm-text)]">
          Grammar explanation
        </h4>

        <p className="mt-2 text-sm leading-6 text-[var(--wm-text)]">
          {word.grammar}
        </p>
      </div>

      <div className="mt-3 rounded-lg bg-[var(--wm-surface)] p-4">
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


      {word.forms.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold">Related forms</h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {word.forms.map((form, index) => <span className="wm-badge" key={`${form}-${index}`}>{form}</span>)}
          </div>
        </div>
      )}

    <div className="mt-3 border-t border-[var(--wm-accent)] pt-4">
      <button
        type="button"
        disabled={!canSave || saving}
        onClick={onToggleSave}
        aria-pressed={isSaved}
        className={`wm-save-word w-full ${
          isSaved
            ? "wm-button-secondary"
            : "wm-button-primary"
        }`}
      >
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
          <path d="M6 3h12v18l-6-4-6 4V3Z" />
        </svg>
        {saving ? "Updating..." : isSaved ? "Saved - Remove word" : "Save word"}
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
