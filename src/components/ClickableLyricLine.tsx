
"use client";

interface ClickableLyricLineProps {
  text: string;
  onWordSelect: (word: string) => void;
}

export default function ClickableLyricLine({
  text,
  onWordSelect,
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
            onClick={() => onWordSelect(token)}
            title={`Explain ${token}`}
            className="rounded px-0.5 font-medium text-[var(--wm-accent)] underline decoration-[var(--wm-accent)] decoration-dotted underline-offset-4 hover:bg-[rgb(var(--wm-accent-rgb)/0.13)]"
          >
            {token}
          </button>
        );
      })}
    </>
  );
}
