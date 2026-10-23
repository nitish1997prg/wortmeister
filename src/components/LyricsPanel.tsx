
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
import { lookupGermanWord } from "@/data/germanVocabulary";

interface EditableLine extends LrcLine {
  id: number;
}

interface LyricsPanelProps {
  songSlug: string;
  videoId: string;
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
  songSlug,
  videoId,
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
  const [mode, setMode] = useState<"listen" | "edit">("listen");

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  const [loadingWord, setLoadingWord] =
  useState<string | null>(null);

  const [aiError, setAiError] =
    useState<string | null>(null);

  const requestRef = useRef<AbortController | null>(null);


  const [loadingSavedLyrics, setLoadingSavedLyrics] =
    useState(true);

  const [savingLyrics, setSavingLyrics] =
    useState(false);

  const localChangesRef = useRef(false);



  interface CachedExplanation {
    explanation: WordExplanation;
    cacheKey: string | null;
  }

  const explanationCache = useRef(
    new Map<string, CachedExplanation>()
  );



  const [selectedExplanationKey, setSelectedExplanationKey] =
    useState<string | null>(null);

  const [isWordSaved, setIsWordSaved] = useState(false);

  const [savedStatusKnown, setSavedStatusKnown] =
    useState(false);

  const [checkingSaved, setCheckingSaved] =
    useState(false);

  const [savingWord, setSavingWord] = useState(false);

  const [saveError, setSaveError] =
    useState<string | null>(null);

  const selectionVersionRef = useRef(0);


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


    useEffect(() => {
      if (mode !== "listen" || !followPlayback) return;

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
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    }, [activeIndex, followPlayback, mode]);


    useEffect(() => {
    return () => requestRef.current?.abort();
  }, []);




  async function explainWord(
    word: string,
    context: string
  ) {
    // Cancel the previous explanation/status request.
    requestRef.current?.abort();

    const controller = new AbortController();
    requestRef.current = controller;

    const version = ++selectionVersionRef.current;

    // Reset the saved-word UI for the new selection.
    setAiError(null);
    setSaveError(null);
    setSelectedExplanationKey(null);
    setIsWordSaved(false);
    setSavedStatusKnown(false);
    setCheckingSaved(false);
    setSavingWord(false);
    setLoadingWord(null);

    // Show our local glossary entry immediately,
    // if one exists.
    setSelectedWord(lookupGermanWord(word) ?? null);

    const localKey = JSON.stringify([
      word.toLocaleLowerCase("de-DE"),
      context,
    ]);

    const cached = explanationCache.current.get(localKey);

    // Reuse the explanation from browser memory.
    if (cached) {
      setSelectedWord(cached.explanation);
      setSelectedExplanationKey(cached.cacheKey);

      if (cached.cacheKey) {
        void checkSavedStatus(
          cached.cacheKey,
          controller.signal,
          version
        );
      }

      return;
    }

    setLoadingWord(word);

    try {
      const response = await fetch(
        "/api/vocabulary/explain",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            word,
            context,
            level: "A2",
          }),
          signal: controller.signal,
        }
      );

      const data: {
        explanation?: WordExplanation;
        cacheKey?: string | null;
        error?: string;
      } = await response.json();

      if (!response.ok || !data.explanation) {
        throw new Error(
          data.error ?? "AI explanation failed."
        );
      }

      if (
        controller.signal.aborted ||
        version !== selectionVersionRef.current
      ) {
        return;
      }

      const databaseKey =
        typeof data.cacheKey === "string" &&
        /^[a-f0-9]{64}$/.test(data.cacheKey)
          ? data.cacheKey
          : null;

      explanationCache.current.set(localKey, {
        explanation: data.explanation,
        cacheKey: databaseKey,
      });

      setSelectedWord(data.explanation);
      setSelectedExplanationKey(databaseKey);

      if (databaseKey) {
        void checkSavedStatus(
          databaseKey,
          controller.signal,
          version
        );
      }
    } catch {
      if (
        !controller.signal.aborted &&
        version === selectionVersionRef.current
      ) {
        setAiError(
          "AI explanation unavailable. " +
          "Showing local vocabulary if available."
        );
      }
    } finally {
      if (
        !controller.signal.aborted &&
        version === selectionVersionRef.current
      ) {
        setLoadingWord(null);
      }
    }
  }



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
      requestRef.current?.abort();
      explanationCache.current.clear();
      setSelectedWord(null);
      setLoadingWord(null);
      setAiError(null);
      setMode("listen");
      localChangesRef.current = true;
    } catch {
      setMessage("Could not read the file.");
    }
  }

  function commit(next: EditableLine[], success: string) {
    localChangesRef.current = true;
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
    localChangesRef.current = true;
  }

  function exportLrc() {
    if (lines.length === 0) return;

    const output = serializeCurrentLrc();

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


  function serializeCurrentLrc(): string {
    return [
      ...metadata,
      ...lines.map(
        (line) =>
          `[${formatTime(line.seconds)}]${line.text}`
      ),
    ].join("\n") + "\n";
  }


  async function saveLyricsToDatabase() {
    if (lines.length === 0 || savingLyrics) return;

    setSavingLyrics(true);
    setMessage("Saving lyrics...");

    try {
      const response = await fetch(
        `/api/songs/${encodeURIComponent(songSlug)}/lyrics`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lrcContent: serializeCurrentLrc(),
            syncedVideoId: videoId,
          }),
        }
      );

      const result: {
        saved?: boolean;
        version?: number;
        error?: string;
      } = await response.json();

      if (!response.ok || !result.saved) {
        throw new Error(
          result.error ?? "Database save failed."
        );
      }

      localChangesRef.current = false;

      setMessage(
        `Lyrics saved successfully (version ${result.version}).`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save lyrics."
      );
    } finally {
      setSavingLyrics(false);
    }
  }


  async function checkSavedStatus(
    cacheKey: string,
    signal: AbortSignal,
    version: number
  ) {
    setCheckingSaved(true);

    try {
      const response = await fetch(
        `/api/songs/${encodeURIComponent(songSlug)}` +
          `/vocabulary?cacheKey=${cacheKey}`,
        {
          signal,
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Saved status request failed.");
      }

      const data: { saved: boolean } =
        await response.json();

      if (
        signal.aborted ||
        version !== selectionVersionRef.current
      ) {
        return;
      }

      setIsWordSaved(data.saved);
      setSavedStatusKnown(true);
    } catch {
      if (
        !signal.aborted &&
        version === selectionVersionRef.current
      ) {
        setSaveError(
          "Could not check whether this word is saved."
        );
      }
    } finally {
      if (
        !signal.aborted &&
        version === selectionVersionRef.current
      ) {
        setCheckingSaved(false);
      }
    }
  }


  async function toggleSavedWord() {
    const cacheKey = selectedExplanationKey;

    if (
      !cacheKey ||
      !savedStatusKnown ||
      savingWord
    ) {
      return;
    }

    const version = selectionVersionRef.current;
    const shouldRemove = isWordSaved;

    setSavingWord(true);
    setSaveError(null);

    try {
      const response = await fetch(
        `/api/songs/${encodeURIComponent(songSlug)}/vocabulary`,
        {
          method: shouldRemove ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cacheKey }),
        }
      );

      const result: {
        saved?: boolean;
        error?: string;
      } = await response.json();

      if (!response.ok || typeof result.saved !== "boolean") {
        throw new Error(
          result.error ?? "Unable to update saved vocabulary."
        );
      }


      window.dispatchEvent(
        new CustomEvent("wortmeister:vocabulary-changed", {
          detail: {
            songSlug,
            cacheKey,
            saved: result.saved,
          },
        })
      );

      if (version === selectionVersionRef.current) {
        setIsWordSaved(result.saved);
      }


      if (version === selectionVersionRef.current) {
        setIsWordSaved(result.saved);
      }
    } catch (error) {
      if (version === selectionVersionRef.current) {
        setSaveError(
          error instanceof Error
            ? error.message
            : "Unable to update saved vocabulary."
        );
      }
    } finally {
      if (version === selectionVersionRef.current) {
        setSavingWord(false);
      }
    }
  }



  useEffect(() => {
    function handleVocabularyChange(event: Event) {
      const customEvent = event as CustomEvent<{
        songSlug: string;
        cacheKey: string;
        saved: boolean;
      }>;

      const change = customEvent.detail;

      if (
        change?.songSlug === songSlug &&
        change.cacheKey === selectedExplanationKey
      ) {
        setIsWordSaved(change.saved);
        setSavedStatusKnown(true);
      }
    }

    window.addEventListener(
      "wortmeister:vocabulary-changed",
      handleVocabularyChange
    );

    return () => {
      window.removeEventListener(
        "wortmeister:vocabulary-changed",
        handleVocabularyChange
      );
    };
  }, [songSlug, selectedExplanationKey]);







  useEffect(() => {
    const controller = new AbortController();

    async function loadSavedLyrics() {
      try {
        const response = await fetch(
          `/api/songs/${encodeURIComponent(songSlug)}/lyrics`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error("Database request failed.");
        }

        const data: {
          lrcContent: string | null;
          syncedVideoId: string | null;
        } = await response.json();

        if (controller.signal.aborted) return;

        // Never overwrite lyrics imported or edited
        // while the database request was running.
        if (localChangesRef.current) return;

        if (!data.lrcContent) {
          setMessage(
            "No saved lyrics yet. Import your LRC file once."
          );
          return;
        }

        if (data.syncedVideoId !== videoId) {
          setMessage(
            "Saved lyrics belong to a different video. " +
            "Import lyrics synchronized for this video."
          );
          return;
        }

        const parsed = parseLrc(data.lrcContent);

        if (parsed.length === 0) {
          setMessage("Saved lyrics contain no valid timestamps.");
          return;
        }

        const headers = data.lrcContent
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) =>
            /^\[(ar|ti|al|by):.*\]$/i.test(line)
          );

        setLines(
          parsed.map((line, id) => ({
            ...line,
            id,
          }))
        );

        setMetadata(headers);
        setFilename(`${songSlug}-saved.lrc`);
        setSelectedId(0);
        setHistory([]);
        setMode("listen");
        setFollowPlayback(true);

        setMessage("Lyrics loaded from PostgreSQL.");
      } catch {
        if (!controller.signal.aborted) {
          setMessage(
            "Unable to load saved lyrics. " +
            "You can still import an LRC file."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSavedLyrics(false);
        }
      }
    }

    void loadSavedLyrics();

    return () => controller.abort();
  }, [songSlug, videoId]);



    return (
      <section className="min-w-0 space-y-4">
        {/* Workspace header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="wm-section-title">
              German Lyrics
            </h2>

            <p className="mt-1 text-sm text-[var(--wm-muted)]">
              {mode === "listen"
                ? "Follow the song and click words to learn German."
                : "Calibrate timestamps against the video."}
            </p>
          </div>

          {/* Mode selector */}
          <div
            role="group"
            aria-label="Lyrics mode"
            className="wm-tabs"
          >
            <button
              type="button"
              aria-pressed={mode === "listen"}
              onClick={() => {
                setMode("listen");
                setFollowPlayback(true);
              }}
              className="wm-tab"
              data-active={mode === "listen"}
            >
              Listen & Learn
            </button>

            <button
              type="button"
              aria-pressed={mode === "edit"}
              onClick={() => setMode("edit")}
              className="wm-tab"
              data-active={mode === "edit"}
            >
              Edit Timing
            </button>
          </div>
        </div>

        {message && (
          <p role="status" className="text-sm text-[var(--wm-accent)]">
            {message}
          </p>
        )}

        {/* First-time import */}

        {
        loadingSavedLyrics ? (
          <div
            role="status"
            className="wm-card p-6 text-sm text-[var(--wm-muted)]"
          >
            Loading saved lyrics...
          </div>
        ) :  lines.length === 0 ? (
          <div className="wm-card border-dashed p-6">
            <h3 className="font-semibold">
              Import synchronized lyrics
            </h3>

            <p className="mt-2 text-sm text-[var(--wm-muted)]">
              Select your corrected LRC file to start
              following the lyrics.
            </p>

            <input
              type="file"
              accept=".lrc"
              aria-label="Import LRC file"
              onChange={importFile}
              className="mt-4 block w-full text-sm"
            />
          </div>
        ) : mode === "listen" ? (
          /* ======================================
            LISTEN & LEARN MODE
            ====================================== */
          <div className="space-y-4">
            {/* AI vocabulary explanation */}
            {(selectedWord || loadingWord || aiError) && (
              <div className="space-y-3">
                      {loadingWord && (

                      <p role="status" className="text-sm text-[var(--wm-accent)]">
                        Generating AI explanation for &quot;{loadingWord}&quot;...
                      </p>

                      )}

                {aiError && (
                  <p role="alert" className="text-sm text-[var(--wm-warning)]">
                    {aiError}
                  </p>
                )}


                {saveError && (
                  <p role="alert" className="text-sm text-[var(--wm-danger)]">
                    {saveError}
                  </p>
                )}

                {checkingSaved && (
                  <p role="status" className="text-xs text-[var(--wm-muted)]">
                    Checking saved vocabulary...
                  </p>
                )}

                {selectedWord && (
                  <WordDetails
                    word={selectedWord}
                    isSaved={isWordSaved}
                    canSave={
                      selectedExplanationKey !== null &&
                      savedStatusKnown &&
                      !checkingSaved
                    }
                    saving={savingWord}
                    onToggleSave={() => {
                      void toggleSavedWord();
                    }}
                    onClose={() => {
                      requestRef.current?.abort();
                      selectionVersionRef.current += 1;

                      setSelectedWord(null);
                      setSelectedExplanationKey(null);
                      setIsWordSaved(false);
                      setSavedStatusKnown(false);
                      setLoadingWord(null);
                      setAiError(null);
                      setSaveError(null);
                    }}
                  />
                )}


                {!selectedWord && aiError && (
                  <button
                    type="button"
                    onClick={() => setAiError(null)}
                    className="text-sm text-[var(--wm-accent)] underline"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            )}

            {/* Lyrics viewer */}
            <div className="wm-card p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-[var(--wm-text)]">
                  {filename}
                </p>

                <label className="flex items-center gap-2 text-sm text-[var(--wm-muted)]">
                  <input
                    type="checkbox"
                    checked={followPlayback}
                    onChange={(event) =>
                      setFollowPlayback(event.target.checked)
                    }
                  />
                  Follow playback
                </label>
              </div>

              <div
                ref={scrollRef}
                className="h-[520px] space-y-2 overflow-y-auto wm-subtle p-3"
              >
                {lines.map((line, index) => {
                  const isActive = index === activeIndex;

                  return (
                    <div
                      key={line.id}
                      ref={isActive ? activeRef : null}
                      className={`flex items-start gap-3 rounded-lg px-3 py-4 transition-colors ${
                        isActive
                          ? "bg-[rgb(var(--wm-accent-rgb)/0.13)] text-[var(--wm-text)]"
                          : "text-[var(--wm-muted)]"
                      }`}
                    >
                      {/* Seek without showing editing controls */}
                      <button
                        type="button"
                        disabled={!ready}
                        aria-label={`Play from ${formatTime(line.seconds)}`}
                        onClick={() => onSeek(line.seconds)}
                        className="mt-1 shrink-0 rounded-md px-2 py-1 text-xs text-[var(--wm-accent)] hover:bg-[rgb(var(--wm-accent-rgb)/0.13)] disabled:opacity-40"
                      >
                        ▶
                      </button>

                      <p
                        className={`min-w-0 flex-1 whitespace-pre-wrap break-words leading-8 ${
                          isActive
                            ? "text-lg font-medium"
                            : "text-base"
                        }`}
                      >
                        {line.text ? (
                          <ClickableLyricLine
                            text={line.text}
                            onWordSelect={(word) => {
                              void explainWord(word, line.text);
                            }}
                          />
                        ) : (
                          <span className="text-sm italic text-[var(--wm-muted)]">
                            ♪ Instrumental
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>

              <p className="mt-3 text-xs text-[var(--wm-muted)]">
                Click an underlined word for its meaning
                and grammar explanation.
              </p>
            </div>
          </div>
        ) : (
          /* ======================================
            EDIT TIMING MODE
            ====================================== */
          <div className="space-y-4">
            {/* Import / replace source file */}
            <div className="wm-card p-4">
              <h3 className="font-semibold">
                LRC file
              </h3>

              <p className="mt-1 break-all text-sm text-[var(--wm-muted)]">
                Currently loaded: {filename}
              </p>

              <input
                type="file"
                accept=".lrc"
                aria-label="Replace LRC file"
                onChange={importFile}
                className="mt-3 block w-full text-sm"
              />
            </div>

            {/* Video position */}
            <div className="rounded-xl bg-[var(--wm-surface-raised)] p-4">
              <p className="text-xs font-medium text-[var(--wm-muted)]">
                CURRENT VIDEO POSITION
              </p>

              <p className="mt-1 font-mono text-2xl font-semibold">
                {formatTime(currentTime)}
              </p>
            </div>

            {/* Selected lyric editing controls */}
            {selectedLine && (
              <div className="space-y-4 rounded-xl border border-[var(--wm-warning)] bg-[var(--wm-warning-surface)] p-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-[var(--wm-warning)]">
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
                      changeSelectedTime(
                        selectedLine.seconds - 0.1
                      )
                    }
                    className="wm-button-secondary flex-1 rounded-lg border bg-[var(--wm-surface)] p-2 text-sm"
                  >
                    − 0.1s
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      changeSelectedTime(
                        selectedLine.seconds + 0.1
                      )
                    }
                    className="wm-button-secondary flex-1 rounded-lg border bg-[var(--wm-surface)] p-2 text-sm"
                  >
                    + 0.1s
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!ready}
                  onClick={() => void syncToVideo(false)}
                  className="wm-button-primary w-full p-3 text-sm disabled:opacity-50"
                >
                  Set selected line to video time
                </button>

                <button
                  type="button"
                  disabled={!ready}
                  onClick={() => void syncToVideo(true)}
                  className="wm-button-secondary w-full rounded-lg border border-[var(--wm-accent)] bg-[var(--wm-surface)] p-3 text-sm text-[var(--wm-accent)] disabled:opacity-50"
                >
                  Shift selected line and later lyrics
                </button>
              </div>
            )}

            {/* Global shift */}
            <div className="wm-card p-4">
              <h3 className="font-semibold">
                Shift entire song
              </h3>

              <p className="mt-1 text-xs text-[var(--wm-muted)]">
                Positive seconds delay lyrics.
                Negative seconds move them earlier.
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
                  className="wm-input flex-1"
                />

                <button
                  type="button"
                  onClick={applyGlobalShift}
                  className="wm-button-primary px-4 py-2 text-sm"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Editing actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={history.length === 0}
                onClick={undo}
                className="text-sm text-[var(--wm-accent)] disabled:opacity-40"
              >
                Undo last change
              </button>

              <button
                type="button"
                onClick={exportLrc}
                className="wm-button-primary px-4 py-2 text-sm font-medium"
              >
                Export corrected LRC
              </button>


            <button
              type="button"
              onClick={() => void saveLyricsToDatabase()}
              disabled={savingLyrics || lines.length === 0}
              className="wm-button-primary px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {savingLyrics
                ? "Saving..."
                : "Save to Database"}
            </button>

            </div>

            {/* Editor timeline: text is not clickable vocabulary */}
            <div className="h-[430px] space-y-2 overflow-y-auto rounded-xl bg-[var(--wm-surface-raised)] p-3">
              {lines.map((line) => {
                const isSelected = line.id === selectedId;

                return (
                  <div
                    key={line.id}
                    className="flex items-center gap-2"
                  >
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedId(line.id)}
                      className={`min-w-0 flex-1 rounded-lg border p-3 text-left text-sm ${
                        isSelected
                          ? "border-[var(--wm-warning)] bg-[var(--wm-warning-surface)]"
                          : "border-[var(--wm-border)] bg-[var(--wm-surface)]"
                      }`}
                    >
                      <span className="mr-2 font-mono text-xs text-[var(--wm-muted)]">
                        {formatTime(line.seconds)}
                      </span>

                      <span className="break-words">
                        {line.text || "♪ Pause"}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={!ready}
                      onClick={() => onSeek(line.seconds)}
                      aria-label={`Play from ${formatTime(line.seconds)}`}
                      className="wm-button-secondary rounded-lg border bg-[var(--wm-surface)] px-3 py-3 text-sm disabled:opacity-40"
                    >
                      ▶
                    </button>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-[var(--wm-muted)]">
              Editing changes remain local until you
              export the corrected LRC file.
            </p>
          </div>
        )}
      </section>
    );

}
