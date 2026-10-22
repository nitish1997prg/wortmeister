
"use client";

import {
  lookupGermanWord,
  type WordExplanation,
} from "@/data/germanVocabulary";

interface ClickableLyricLineProps {
  text: string;
  onWordSelect: (word: WordExplanation) => void;
}

export default function ClickableLyricLine({
  text,
  onWordSelect,
}: ClickableLyricLineProps) {
  // Preserve words, spaces, punctuation and contractions.
  const tokens =
    text.match(
      /\p{L}+(?:['’]\p{L}+)*|\s+|[^\p{L}\s]+/gu
    ) ?? [];

  return (
    <>
      {tokens.map((token, index) => {
        const explanation = lookupGermanWord(token);

        if (!explanation) {
          return <span key={index}>{token}</span>;
        }

        return (
          <button
            key={index}
            type="button"
            onClick={() => onWordSelect(explanation)}
            title={`Explain ${token}`}
            className="rounded px-0.5 font-medium text-teal-700 underline decoration-teal-400 decoration-dotted underline-offset-4 hover:bg-teal-100 focus-visible:outline-2 focus-visible:outline-teal-700"
          >
            {token}
          </button>
        );
      })}
    </>
  );
}
