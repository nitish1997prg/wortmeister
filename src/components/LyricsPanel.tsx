
"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { parseLrc, type LrcLine } from "@/lib/lrc";

import ClickableLyricLine from "@/components/ClickableLyricLine";
import WordDetails from "@/components/WordDetails";

import type { WordExplanation } from "@/data/germanVocabulary";

interface EditableLine extends LrcLine {
  id: number;
}

interface LyricsPanelProps {
  currentTime: number;
  ready: boolean;
  onSeek: (seconds: number) => void;
  getVideoTime: () => Promise<number | null>;
}

const round = (n: number) => Math.round(n * 100) / 100;

function formatTime(time: number): string {
  const total = Math.round(time * 100);
  const minutes = Math.floor(total / 6000);
  const seconds = Math.floor((total % 6000) / 100);
  const hundredths = total % 100;

  return (
    `${String(minutes).padStart(2, "0")}:` +
    `${String(seconds).padStart(2, "0")}.` +
    `${String(hundredths).padStart(2, "0")}`
  );
}

export default function LyricsPanel({
  currentTime,
  ready,
  onSeek,
  getVideoTime,
}: LyricsPanelProps) {
  const [lines, setLines] = useState<EditableLine[]>([]);
  const [history, setHistory] = useState<EditableLine[][]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(
    null
  );
  const [filename, setFilename] = useState("");
  const [metadata, setMetadata] = useState<string[]>([]);
  const [globalShift, setGlobalShift] = useState("0");
  const [followPlayback, setFollowPlayback] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedWord, setSelectedWord] =
  useState<WordExplanation | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  const selectedIndex = lines.findIndex(
    (line) => line.id === selectedId
  );

  const selectedLine =
    selectedIndex >= 0 ? lines[selectedIndex] : null;

  // Find the last lyric that has started.
  let activeIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].seconds <= currentTime) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // Automatically scroll only when follow mode is enabled.
  useEffect(() => {
    if (!followPlayback) return;

    const container = scrollRef.current;
    const active = activeRef.current;

    if (!container || !active) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();

    const target =
      container.scrollTop +
      activeRect.top -
      containerRect.top -
      container.clientHeight / 2 +
      active.clientHeight / 2;

    container.scrollTo({
      top: Math.max(0, target),
      behavior: "smooth",
    });
  }, [activeIndex, followPlayback]);

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = "";

    if (!file.name.toLowerCase().endsWith(".lrc")) {
      setMessage("Please select an .lrc file.");
      return;
    }

    if (file.size > 1024 * 1024) {
      setMessage("File must be smaller than 1 MB.");
      return;
    }

    try {
      const content = await file.text();
      const parsed = parseLrc(content);

      if (parsed.length === 0) {
        setMessage("No valid timestamped lyrics found.");
        return;
      }

      setLines(
        parsed.map((line, id) => ({ ...line, id }))
      );

      // Preserve common descriptive LRC metadata.
      const headers = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) =>
          /^\[(ar|ti|al|by):.*\]$/i.test(line)
        );

      setMetadata(headers);
      setFilename(file.name);
      setSelectedId(0);
      setHistory([]);
      setGlobalShift("0");
      setFollowPlayback(true);
      setMessage("Lyrics imported successfully.");
      setSelectedWord(null);
    } catch {
      setMessage("Could not read the file.");
    }
  }

  function commit(next: EditableLine[], success: string) {
    setHistory((previous) =>
      [...previous, lines].slice(-50)
    );
    setLines(next);
    setMessage(success);
  }

  // Adjust one line, preserving chronological order.
  function changeSelectedTime(time: number) {
    if (!selectedLine) return;

    const newTime = round(time);
    const previous = lines[selectedIndex - 1]?.seconds ?? 0;
    const next = lines[selectedIndex + 1]?.seconds ?? Infinity;

    if (
      !Number.isFinite(newTime) ||
      newTime < 0 ||
      newTime < previous ||
      newTime > next
    ) {
      setMessage(
        "That time crosses a neighboring lyric. " +
        "Try shifting this line and later lyrics instead."
      );
      return;
    }

    commit(
      lines.map((line) =>
        line.id === selectedId
          ? { ...line, seconds: newTime }
          : line
      ),
      "Timestamp updated."
    );
  }

  // Shift the selected line AND the remaining lines.
  function shiftFromSelected(delta: number) {
    if (!selectedLine) return;

    const previous = lines[selectedIndex - 1]?.seconds ?? 0;
    const newStart = round(selectedLine.seconds + delta);

    if (!Number.isFinite(delta) || newStart < previous) {
      setMessage("The shift would cross the previous lyric.");
      return;
    }

    commit(
      lines.map((line, index) =>
        index >= selectedIndex
          ? { ...line, seconds: round(line.seconds + delta) }
          : line
      ),
      "Selected line and later lyrics shifted."
    );
  }

  async function syncToVideo(shiftFollowing: boolean) {
    if (!selectedLine || !ready) return;

    // Read the player when the button is clicked.
    const videoTime = await getVideoTime();

    if (videoTime === null) {
      setMessage("Unable to read the video position.");
      return;
    }

    if (shiftFollowing) {
      shiftFromSelected(round(videoTime - selectedLine.seconds));
    } else {
      changeSelectedTime(videoTime);
    }
  }

  function applyGlobalShift() {
    if (globalShift.trim() === "") {
      setMessage("Enter a time adjustment.");
      return;
    }

    const delta = Number(globalShift);

    if (
      !Number.isFinite(delta) ||
      lines.some((line) => line.seconds + delta < 0)
    ) {
      setMessage("Invalid shift or negative timestamps.");
      return;
    }

    commit(
      lines.map((line) => ({
        ...line,
        seconds: round(line.seconds + delta),
      })),
      "Entire song shifted."
    );

    setGlobalShift("0");
  }

  function undo() {
    if (history.length === 0) return;

    setLines(history[history.length - 1]);
    setHistory((previous) => previous.slice(0, -1));
    setMessage("Last change undone.");
  }

  function exportLrc() {
    if (lines.length === 0) return;

    const output = [
      ...metadata,
      ...lines.map(
        (line) => `[${formatTime(line.seconds)}]${line.text}`
      ),
    ].join("\n") + "\n";

    const blob = new Blob([output], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download =
      filename.replace(/\.lrc$/i, "") + "-synced.lrc";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    setMessage("Corrected LRC downloaded.");
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-xl font-semibold">
        Lyrics Synchronization Editor
      </h2>

      <p className="mt-2 text-sm text-gray-600">
        Select a lyric and match its timestamp to
        the YouTube playback position.
      </p>

      <input
        type="file"
        accept=".lrc"
        aria-label="Import LRC file"
        onChange={importFile}
        className="mt-4 block w-full text-sm"
      />

      {message && (
        <p role="status" className="mt-3 text-sm text-teal-700">
          {message}
        </p>
      )}

      {lines.length > 0 && (
        <>
          <div className="mt-5 rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500">
              CURRENT VIDEO POSITION
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold">
              {formatTime(currentTime)}
            </p>
          </div>

          {selectedLine && (
            <div className="mt-5 space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div>
                <p className="text-xs font-semibold uppercase text-amber-800">
                  Selected lyric
                </p>

                <p className="mt-2 font-medium">
                  {selectedLine.text || "♪ Pause"}
                </p>

                <p className="mt-2 font-mono text-sm">
                  {formatTime(selectedLine.seconds)}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    changeSelectedTime(selectedLine.seconds - 0.1)
                  }
                  className="flex-1 rounded-lg border bg-white p-2 text-sm"
                >
                  − 0.1s
                </button>

                <button
                  type="button"
                  onClick={() =>
                    changeSelectedTime(selectedLine.seconds + 0.1)
                  }
                  className="flex-1 rounded-lg border bg-white p-2 text-sm"
                >
                  + 0.1s
                </button>
              </div>

              <button
                type="button"
                disabled={!ready}
                onClick={() => void syncToVideo(false)}
                className="w-full rounded-lg bg-teal-700 p-3 text-sm text-white disabled:opacity-50"
              >
                Set selected line to video time
              </button>

              <button
                type="button"
                disabled={!ready}
                onClick={() => void syncToVideo(true)}
                className="w-full rounded-lg border border-teal-700 bg-white p-3 text-sm text-teal-700 disabled:opacity-50"
              >
                Shift selected line and later lyrics
              </button>
            </div>
          )}

          <div className="mt-5 rounded-lg border p-4">
            <h3 className="font-semibold">
              Shift entire song
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Positive seconds delay lyrics.
              Negative seconds move lyrics earlier.
            </p>

            <div className="mt-3 flex gap-2">
              <input
                type="number"
                step="0.1"
                value={globalShift}
                onChange={(event) =>
                  setGlobalShift(event.target.value)
                }
                aria-label="Global shift in seconds"
                className="min-w-0 flex-1 rounded-lg border p-2"
              />

              <button
                type="button"
                onClick={applyGlobalShift}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={followPlayback}
                onChange={(event) =>
                  setFollowPlayback(event.target.checked)
                }
              />
              Follow playback
            </label>

            <button
              type="button"
              disabled={history.length === 0}
              onClick={undo}
              className="text-sm text-teal-700 disabled:opacity-40"
            >
              Undo last change
            </button>
          </div>

          
          {selectedWord && (
            <div className="mt-4">
              <WordDetails
                word={selectedWord}
                onClose={() => setSelectedWord(null)}
              />
            </div>
          )}


          <div
            ref={scrollRef}
            className="mt-4 h-[430px] space-y-2 overflow-y-auto rounded-xl bg-gray-50 p-3"
          >
            
          {lines.map((line, index) => {
            const isActive = index === activeIndex;
            const isSelected = line.id === selectedId;

            return (
              <div
                key={line.id}
                ref={isActive ? activeRef : null}
                className={`flex items-start gap-2 rounded-lg border p-2 ${
                  isSelected
                    ? "border-amber-500 bg-amber-50"
                    : isActive
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 bg-white"
                }`}
              >
                {/* Select this line for synchronization editing */}
                <button
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`Select lyric at ${formatTime(line.seconds)}`}
                  onClick={() => {
                    setSelectedId(line.id);
                    setFollowPlayback(false);
                  }}
                  className="shrink-0 rounded-md px-1 py-2 font-mono text-xs text-gray-500 hover:bg-gray-100"
                >
                  {formatTime(line.seconds)}
                </button>

                {/* Interactive German words */}
                <p className="min-w-0 flex-1 whitespace-pre-wrap break-words py-2 text-sm leading-7">
                  {line.text ? (
                    <ClickableLyricLine
                      text={line.text}
                      onWordSelect={setSelectedWord}
                    />
                  ) : (
                    <span className="italic text-gray-400">
                      ♪ Pause
                    </span>
                  )}
                </p>

                {/* Seek to the lyric position */}
                <button
                  type="button"
                  disabled={!ready}
                  onClick={() => {
                    onSeek(line.seconds);
                    setFollowPlayback(true);
                  }}
                  aria-label={`Play from ${formatTime(line.seconds)}`}
                  className="shrink-0 rounded-lg border bg-white px-3 py-2 text-sm disabled:opacity-40"
                >
                  ▶
                </button>
              </div>
            );
          })}

            
          </div>

          <button
            type="button"
            onClick={exportLrc}
            className="mt-5 w-full rounded-lg bg-teal-700 p-3 font-medium text-white hover:bg-teal-800"
          >
            Export corrected LRC
          </button>

          <p className="mt-3 text-xs text-gray-500">
            Edits are temporary until exported.
            Keep a backup of your original LRC.
          </p>
        </>
      )}
    </section>
  );
}
