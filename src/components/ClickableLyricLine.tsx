
"use client";

interface ClickableLyricLineProps {
  text: string;
  onWordSelect: (word: string, tokenIndex: number, trigger: HTMLButtonElement) => void;
  selectedTokenIndex?: number;
}

export default function ClickableLyricLine({
  text,
  onWordSelect,
  selectedTokenIndex,
}: ClickableLyricLineProps) {
  const tokens =
    text.match(
      /\p{L}+(?:['’]\p{L}+)*|\s+|[^\p{L}\s]+/gu
    ) ?? [];

  const isWord =
    /^\p{L}+(?:['’]\p{L}+)*$/u;

  return (
    <>
      {tokens.map((token, index) => {
        if (!isWord.test(token)) {
          return <span key={index}>{token}</span>;
        }

        return (
          <button
            key={index}
            type="button"
            onClick={(event) => onWordSelect(token, index, event.currentTarget)}
            aria-pressed={selectedTokenIndex === index}
            aria-controls={selectedTokenIndex === index ? "wm-word-explanation" : undefined}
            title={`Explain ${token}`}
            className="wm-lyric-word rounded px-0.5 underline decoration-dotted underline-offset-4"
          >
            {token}
          </button>
        );
      })}
    </>
  );
}
