
"use client";

import { useEffect, useRef, useState } from "react";
import { parseLrc, type LrcLine } from "@/lib/lrc";

interface LyricsPanelProps {
  currentTime: number;
  ready: boolean;
  onSeek: (seconds: number) => void;
}

export default function LyricsPanel({
  currentTime,
  ready,
  onSeek,
}: LyricsPanelProps) {
  const [lyrics, setLyrics] = useState<LrcLine[]>([]);
  const [fileName, setFileName] = useState("");
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState("");

  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Positive offset means display lyrics later.
  const lyricTime = currentTime - offset;

  let activeIndex = -1;

  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].seconds <= lyricTime) {
      activeIndex = i;
    } else {
      break;
    }
  }

  useEffect(() => {
    const container = listRef.current;
    const active = activeRef.current;

    if (!container || !active) return;

    container.scrollTo({
      top:
        active.offsetTop -
        container.clientHeight / 2 +
        active.clientHeight / 2,
      behavior: "smooth",
    });
  }, [activeIndex]);

  async function importLyrics(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    event.target.value = "";
    setError("");

    if (!file.name.toLowerCase().endsWith(".lrc")) {
      setError("Please select an .lrc file.");
      return;
    }

    if (file.size > 1024 * 1024) {
      setError("The lyrics file must be under 1 MB.");
      return;
    }

    try {
      const content = await file.text();
      const parsed = parseLrc(content);

      if (parsed.length === 0) {
        setError("No valid timestamped lyrics found.");
        return;
      }

      setLyrics(parsed);
      setFileName(file.name);
      setOffset(0);
    } catch {
      setError("Unable to read the selected file.");
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-xl font-semibold">
        Synchronized German Lyrics
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        Import your local LRC file to follow the song.
      </p>

      <input
        type="file"
        accept=".lrc,text/plain"
        onChange={importLyrics}
        aria-label="Import synchronized lyrics"
        className="mt-4 block w-full text-sm"
      />

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {lyrics.length > 0 && (
        <>
          <p className="mt-4 text-xs text-gray-500">
            {fileName} · {lyrics.length} timed entries
          </p>

          <label className="mt-4 block text-sm font-medium">
            Timing offset (seconds)
            <input
              type="number"
              step="0.5"
              value={offset}
              onChange={(e) =>
                setOffset(Number(e.target.value) || 0)
              }
              className="mt-2 w-full rounded-lg border border-gray-300 p-2"
            />
          </label>

          <p className="mt-2 text-xs text-gray-500">
            Positive values delay the lyrics.
            Negative values show them earlier.
          </p>

          <div
            ref={listRef}
            className="relative mt-5 h-[440px] space-y-2 overflow-y-auto rounded-xl bg-gray-50 p-4"
          >
            {lyrics.map((line, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={`${line.seconds}-${index}`}
                  ref={isActive ? activeRef : null}
                  type="button"
                  disabled={!ready}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() =>
                    onSeek(Math.max(0, line.seconds + offset))
                  }
                  className={`block w-full rounded-lg p-3 text-center transition-colors ${
                    isActive
                      ? "bg-teal-100 font-semibold text-teal-900"
                      : "text-gray-600 hover:bg-gray-200"
                  } disabled:cursor-not-allowed`}
                >
                  {line.text || (
                    <span className="text-xs italic text-gray-400">
                      ♪ Pause
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Click a lyric line to jump to that moment.
            The selected file stays in this browser session.
          </p>
        </>
      )}
    </section>
  );
}
