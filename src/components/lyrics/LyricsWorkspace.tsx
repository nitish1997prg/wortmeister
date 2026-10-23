
"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  useCallback,
} from "react";
import { parseLrc, type LrcLine } from "@/lib/lrc";

import ClickableLyricLine from "@/components/ClickableLyricLine";
import WordDetails from "@/components/WordDetails";

import type { WordExplanation } from "@/data/germanVocabulary";
import { lookupGermanWord } from "@/data/germanVocabulary";

interface EditableLine extends LrcLine {
  id: number;
}

export interface LyricsWorkspaceProps {
  /** Presentation only; reserved for the future admin editor. */
  editorEnabled?: boolean;
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

export default function LyricsWorkspace({
  editorEnabled = false,
  songSlug,
  videoId,
  currentTime,
  ready,
  onSeek,
  getVideoTime,
}: LyricsWorkspaceProps) {
  const [wordSelection, setWordSelection] = useState<{
    word: string; context: string; lineId: number; tokenIndex: number;
  } | null>(null);
  const wordTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [saveFeedback, setSaveFeedback] = useState("");
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
  const [lyricsLoadError, setLyricsLoadError] = useState(false);
  const [selectedWord, setSelectedWord] =
  useState<WordExplanation | null>(null);
  const [mode, setMode] = useState<"listen" | "edit">(editorEnabled ? "edit" : "listen");

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
  const editRevisionRef = useRef(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  function markEdited() {
    localChangesRef.current = true;
    editRevisionRef.current += 1;
    setHasUnsavedChanges(true);
  }

  useEffect(() => {
    if (!editorEnabled || !hasUnsavedChanges) return;
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [editorEnabled, hasUnsavedChanges]);



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


  function pauseFollowing() {
    setFollowPlayback(false);
    const container = scrollRef.current;
    // Cancel any in-flight smooth scroll as soon as the learner takes over.
    if (container) {
      container.scrollTo({ top: container.scrollTop, behavior: "instant" });
    }
  }

  useEffect(() => {
    if ((editorEnabled && mode !== "listen") || !followPlayback) return;

    const container = scrollRef.current;
    const active = activeRef.current;
    if (!container || !active || container.clientHeight === 0) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const top = activeRect.top - containerRect.top;
    const bottom = activeRect.bottom - containerRect.top;
    const height = container.clientHeight;

    // Leave comfortably visible lines alone instead of centering every verse.
    if (top >= height * 0.2 && bottom <= height * 0.8) return;

    const target = container.scrollTop + top - height * 0.35;
    container.scrollTo({
      top: Math.max(0, Math.min(target, container.scrollHeight - height)),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [activeIndex, followPlayback, mode, lines, editorEnabled]);


    useEffect(() => {
    return () => requestRef.current?.abort();
  }, []);




  const closeExplanation = useCallback(() => {
    requestRef.current?.abort();
    selectionVersionRef.current += 1;
    setWordSelection(null);
    setSelectedWord(null);
    setSelectedExplanationKey(null);
    setIsWordSaved(false);
    setSavedStatusKnown(false);
    setCheckingSaved(false);
    setSavingWord(false);
    setLoadingWord(null);
    setAiError(null);
    setSaveError(null);
    setSaveFeedback("");
    wordTriggerRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!wordSelection || (editorEnabled && mode !== "listen")) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeExplanation();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [wordSelection, mode, closeExplanation, editorEnabled]);

  useEffect(() => {
    if (!saveFeedback) return;
    const timeout = window.setTimeout(() => setSaveFeedback(""), 2500);
    return () => window.clearTimeout(timeout);
  }, [saveFeedback]);

  async function explainWord(
    word: string,
    context: string
  ) {
    // Cancel the previous explanation/status request.
    requestRef.current?.abort();

    const controller = new AbortController();
    requestRef.current = controller;

    const version = ++selectionVersionRef.current;

    setSaveFeedback("");
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
    if (localChangesRef.current && !window.confirm("Discard unsaved changes and replace these lyrics?")) return;

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
      closeExplanation();
      setMessage("Lyrics imported successfully.");
      setSelectedWord(null);
      requestRef.current?.abort();
      explanationCache.current.clear();
      setSelectedWord(null);
      setLoadingWord(null);
      setAiError(null);
      setMode(editorEnabled ? "edit" : "listen");
      markEdited();
    } catch {
      setMessage("Could not read the file.");
    }
  }

  function commit(next: EditableLine[], success: string) {
    markEdited();
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
    markEdited();
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

    const savingRevision = editRevisionRef.current;
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

      if (editRevisionRef.current === savingRevision) {
        localChangesRef.current = false;
        setHasUnsavedChanges(false);
      }

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
        setSaveFeedback(result.saved ? "Saved" : "Removed");
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
      const loadingRevision = editRevisionRef.current;
      setLoadingSavedLyrics(true);
      setLyricsLoadError(false);
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
        if (localChangesRef.current || editRevisionRef.current !== loadingRevision) return;

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
        setMode(editorEnabled ? "edit" : "listen");
        setFollowPlayback(true);

        setMessage("Lyrics loaded from PostgreSQL.");
      } catch {
        if (!controller.signal.aborted) {
          setLyricsLoadError(true);
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
  }, [songSlug, videoId, editorEnabled]);



    return (
      <section className="min-w-0 space-y-4">
        {/* Workspace header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="wm-section-title">
              German Lyrics
            </h2>

            <p className="mt-1 text-sm text-[var(--wm-muted)]">
              {!editorEnabled || mode === "listen"
                ? "Select a word to learn."
                : "Calibrate timestamps against the video."}
            </p>
          </div>

          {/* Retained for the future admin editor; never rendered for learners. */}
          {editorEnabled && <div
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
          </div>}
        </div>

        {editorEnabled && (
          <p role="status" className="wm-badge">
            {hasUnsavedChanges ? "Unsaved changes" : "No unsaved changes"}
          </p>
        )}
        {editorEnabled && message && (
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
            Loading lyrics...
          </div>
        ) :  lines.length === 0 ? (
          !editorEnabled ? (
            <div className="wm-card p-6" role={lyricsLoadError ? "alert" : "status"}>
              <h3 className="font-semibold">
                {lyricsLoadError ? "Lyrics could not be loaded" : "Lyrics are not available yet"}
              </h3>
              <p className="wm-muted mt-2 text-sm">
                {lyricsLoadError
                  ? "Please try again later. You can still listen to the song."
                  : "Enjoy the music while synchronized lyrics are being prepared."}
              </p>
            </div>
          ) : (
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
          )
        ) : !editorEnabled || mode === "listen" ? (
          /* ======================================
            LISTEN & LEARN MODE
            ====================================== */
          <div className="space-y-4">
            {/* Lyrics viewer */}
            <div className="wm-card p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-[var(--wm-text)]">
                  {followPlayback ? "Following playback" : "Explore at your own pace"}
                </p>

                {!followPlayback && (
                  <button
                    type="button"
                    className="wm-button-secondary"
                    onClick={() => setFollowPlayback(true)}
                  >
                    Resume following
                  </button>
                )}
                <label className="flex items-center gap-2 text-sm text-[var(--wm-muted)]">
                  <input
                    type="checkbox"
                    checked={followPlayback}
                    onChange={(event) =>
                      event.target.checked ? setFollowPlayback(true) : pauseFollowing()
                    }
                  />
                  Follow playback
                </label>
              </div>

              <div
                ref={scrollRef}
                className="wm-lyrics-scroll space-y-2 overflow-y-auto wm-subtle p-3"
                tabIndex={0}
                role="region"
                aria-label="Song lyrics; scroll to pause following"
                onWheel={pauseFollowing}
                onTouchMove={pauseFollowing}
                onPointerDown={(event) => {
                  const bounds = event.currentTarget.getBoundingClientRect();
                  // A scrollbar drag should pause following; a word click should not seek.
                  if (event.clientX >= bounds.left + event.currentTarget.clientWidth) {
                    pauseFollowing();
                  }
                }}
                onFocusCapture={(event) => {
                  if (event.target !== event.currentTarget) pauseFollowing();
                }}
                onKeyDown={(event) => {
                  if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)
                    && event.target === event.currentTarget) {
                    pauseFollowing();
                  }
                }}
              >
                {lines.map((line, index) => {
                  const isActive = index === activeIndex;

                  return (
                    <div
                      key={line.id}
                      ref={isActive ? activeRef : null}
                      className="wm-lyric-line flex items-start gap-3 rounded-lg px-3 py-4"
                      data-state={isActive ? "active" : index < activeIndex ? "past" : "upcoming"}
                      aria-current={isActive ? "true" : undefined}
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
                        className="min-w-0 flex-1 whitespace-pre-wrap break-words text-lg leading-8"
                      >
                        {line.text ? (
                          <ClickableLyricLine
                            text={line.text}
                            selectedTokenIndex={wordSelection?.lineId === line.id ? wordSelection.tokenIndex : undefined}
                            onWordSelect={(word, tokenIndex, trigger) => {
                              wordTriggerRef.current = trigger;
                              setWordSelection({ word, context: line.text, lineId: line.id, tokenIndex });
                              pauseFollowing();
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
            {wordSelection && (
              <div id="wm-word-explanation" className="wm-word-panel space-y-3">
                {!selectedWord && (
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">{wordSelection.word}</h3>
                    <button type="button" className="wm-button-secondary" onClick={closeExplanation} aria-label="Close vocabulary explanation">Close</button>
                  </div>
                )}
                {loadingWord && <p role="status" className="wm-muted text-sm"><span className="wm-word-spinner" aria-hidden="true" /> Looking up {loadingWord}...</p>}
                {aiError && <p role="alert" className="text-sm text-[var(--wm-warning)]">{aiError}</p>}
                {saveError && <p role="alert" className="text-sm text-[var(--wm-danger)]">{saveError}</p>}
                {(aiError || saveError) && (
                  <button type="button" className="wm-button-secondary" disabled={savingWord || !!loadingWord || checkingSaved}
                    onClick={() => { void explainWord(wordSelection.word, wordSelection.context); }}>Retry</button>
                )}
                {checkingSaved && <p role="status" className="wm-muted text-xs">Checking saved vocabulary...</p>}
                {selectedWord && (
                  <WordDetails word={selectedWord} isSaved={isWordSaved}
                    canSave={selectedExplanationKey !== null && savedStatusKnown && !checkingSaved}
                    saving={savingWord} onToggleSave={() => { void toggleSavedWord(); }} onClose={closeExplanation} />
                )}
                <p role="status" aria-live="polite" className="wm-accent-text min-h-5 text-sm">{saveFeedback}</p>
              </div>
            )}
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
              {lines.map((line, index) => {
                const isSelected = line.id === selectedId;

                return (
                  <div
                    key={line.id}
                    className="flex items-center gap-2"
                  >
                    <button
                      type="button"
                      aria-current={index === activeIndex ? "true" : undefined}
                      data-state={index === activeIndex ? "active" : "upcoming"}
                      aria-pressed={isSelected}
                      onClick={() => { setSelectedId(line.id); if (ready) onSeek(line.seconds); }}
                      className={`wm-lyric-line min-w-0 flex-1 rounded-lg border p-3 text-left text-sm ${
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
              Changes remain local until you save to the database.
              Export downloads a separate LRC copy.
            </p>
          </div>
        )}
      </section>
    );

}
