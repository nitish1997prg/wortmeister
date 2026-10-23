
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
      className="rounded-xl border border-teal-200 bg-teal-50 p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-teal-700">
            German vocabulary
          </p>

          <h3 className="mt-2 text-2xl font-bold text-gray-900">
            {word.lemma}
          </h3>

          <p className="mt-1 text-lg text-teal-800">
            {word.english}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close vocabulary explanation"
          className="rounded-lg border bg-white px-3 py-2 text-sm"
        >
          ✕
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-white px-3 py-1 text-xs text-gray-700">
          {word.partOfSpeech}
        </span>

        <span className="rounded-full bg-white px-3 py-1 text-xs text-gray-700">
          {word.level}
        </span>
      </div>

      <div className="mt-5">
        <h4 className="text-sm font-semibold text-gray-900">
          Grammar explanation
        </h4>

        <p className="mt-2 text-sm leading-6 text-gray-700">
          {word.grammar}
        </p>
      </div>

      <div className="mt-5 rounded-lg bg-white p-4">
        <p className="text-xs font-semibold uppercase text-gray-500">
          Example sentence
        </p>

        <p className="mt-2 font-medium text-gray-900">
          {word.exampleGerman}
        </p>

        <p className="mt-2 text-sm text-gray-600">
          {word.exampleEnglish}
        </p>
      </div>

      
    <div className="mt-5 border-t border-teal-200 pt-4">
      <button
        type="button"
        disabled={!canSave || saving}
        onClick={onToggleSave}
        className={`w-full rounded-lg px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
          isSaved
            ? "border border-teal-700 bg-white text-teal-700"
            : "bg-teal-700 text-white hover:bg-teal-800"
        }`}
      >
        {saving
          ? "Updating..."
          : isSaved
            ? "✓ Saved — Remove Word"
            : "＋ Save Word"}
      </button>

      {!canSave && (
        <p className="mt-2 text-center text-xs text-gray-500">
          Saving is available once the AI explanation
          and its saved status are ready.
        </p>
      )}
    </div>

    </aside>
  );
}
