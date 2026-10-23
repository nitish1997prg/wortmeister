
"use client";

import { useRef, useState, useEffect } from "react";
import YouTube, {
  type YouTubeProps,
} from "react-youtube";

import type { SongAnnotation } from "@/data/songs";
import LyricsPanel from "@/components/LyricsPanel";

interface SongPlayerProps {
  songSlug: string;
  videoId: string;
  annotations: SongAnnotation[];
  active?: boolean;
  onOpenVocabulary?: () => void;
}

type Player = Parameters<
  NonNullable<YouTubeProps["onReady"]>
>[0]["target"];

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);

  return (
    `${String(minutes).padStart(2, "0")}:` +
    `${String(remaining).padStart(2, "0")}`
  );
}

export default function SongPlayer({
  songSlug,
  videoId,
  annotations,
  active = true,
  onOpenVocabulary,
}: SongPlayerProps) {
  const playerRef = useRef<Player | null>(null);

  const [ready, setReady] = useState(false);
  const [capturedTime, setCapturedTime] =
    useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const handleReady: NonNullable<
    YouTubeProps["onReady"]
  > = (event) => {
    playerRef.current = event.target;
    setReady(true);
  };

  function playFrom(seconds: number) {
  if (!playerRef.current) return;

  setCurrentTime(seconds);

  void playerRef.current.seekTo(seconds, true);
  void playerRef.current.playVideo();
  }

  async function captureCurrentTime() {
    if (!playerRef.current) return;

    const seconds =
      await playerRef.current.getCurrentTime();

    setCapturedTime(Math.floor(seconds));
  }


async function getVideoTime(): Promise<number | null> {
  const player = playerRef.current;

  if (!player) return null;

  try {
    const seconds = await player.getCurrentTime();

    return Number.isFinite(seconds) ? seconds : null;
  } catch {
    return null;
  }
}



    useEffect(() => {
      if (!ready) return;

      let cancelled = false;
      let checking = false;

      async function updateTime() {
        const player = playerRef.current;

        if (!player || checking) return;

        checking = true;

        try {
          const seconds = await player.getCurrentTime();

          if (!cancelled && Number.isFinite(seconds)) {
            setCurrentTime(seconds);
          }
        } catch {
          // Ignore temporary player errors.
        } finally {
          checking = false;
        }
      }

      void updateTime();

      const interval = window.setInterval(() => {
        void updateTime();
      }, 300);

      return () => {
        cancelled = true;
        window.clearInterval(interval);
      };
    }, [ready, videoId]);


    useEffect(() => {
      if (!active && ready) {
        void playerRef.current?.pauseVideo();
      }
    }, [active, ready]);



  return (
    <section className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
      {/* Left side: video */}
      <div className="min-w-0 space-y-4 xl:sticky xl:top-6">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
          <YouTube
            videoId={videoId}
            className="absolute inset-0 h-full w-full"
            iframeClassName="h-full w-full"
            opts={{
              playerVars: {
                playsinline: 1,
              },
            }}
            onReady={handleReady}
            onError={() => setReady(false)}
          />
        </div>

        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-[var(--wm-accent)] underline"
        >
          Watch on YouTube
        </a>

        {/* Timestamp capture */}
        <div className="wm-card p-4">
          <h3 className="font-semibold">
            Timestamp capture
          </h3>

          <p className="mt-2 text-sm text-[var(--wm-muted)]">
            Capture the current position while
            listening to build accurate annotations.
          </p>

          <button
            type="button"
            disabled={!ready}
            onClick={captureCurrentTime}
            className="wm-button-primary mt-4 px-4 py-2 text-sm disabled:opacity-50"
          >
            Capture current time
          </button>

          {capturedTime !== null && (
            <p role="status" className="mt-3 text-sm">
              Captured:{" "}
              <strong>
                {formatTime(capturedTime)}
              </strong>
              {" "}({capturedTime} seconds)
            </p>
          )}
        </div>
      </div>

      {/* Right side: lyrics and annotations */}
      <div className="min-w-0 space-y-6">

       {/* Synchronized lyrics */}
      <LyricsPanel
        key={songSlug}
        songSlug={songSlug}
        videoId={videoId}
        currentTime={currentTime}
        ready={ready}
        onSeek={playFrom}
        getVideoTime={getVideoTime}
      />

      {/* Right side: annotations */}
      <div className="space-y-4">
        <div>
          <h2 className="wm-section-title">
            Explore the song
          </h2>

          <p className="mt-2 text-sm text-[var(--wm-muted)]">
            Expand a learning moment to explore
            its vocabulary and grammar.
          </p>
        </div>

        {annotations.map((annotation) => (
          <details
            key={annotation.id}
            className="group overflow-hidden wm-card"
          >
            <summary className="cursor-pointer p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-[var(--wm-accent)]">
                    {annotation.topic}
                  </p>

                  <h3 className="mt-1 font-semibold">
                    {annotation.title}
                  </h3>

                  <p className="mt-2 text-sm text-[var(--wm-muted)]">
                    {annotation.explanation}
                  </p>
                </div>

                <span
                  aria-hidden="true"
                  className="text-xl text-[var(--wm-muted)]"
                >
                  +
                </span>
              </div>
            </summary>

            <div className="space-y-5 border-t border-[var(--wm-border)] p-5">
              {/* Video timestamp */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!ready}
                  onClick={() =>
                    playFrom(annotation.seconds)
                  }
                  className="wm-button-primary px-4 py-2 text-sm disabled:opacity-50"
                >
                  ▶ Play from{" "}
                  {formatTime(annotation.seconds)}
                </button>

                <span className="text-xs text-[var(--wm-muted)]">
                  {annotation.timestampVerified
                    ? "Verified timestamp"
                    : "Sample timestamp - verify before publishing"}
                </span>
              </div>

              {/* Learning objective */}
              <div>
                <h4 className="text-sm font-semibold text-[var(--wm-text)]">
                  Learning objective
                </h4>

                <p className="mt-2 text-sm text-[var(--wm-muted)]">
                  {annotation.learningObjective}
                </p>
              </div>

              {/* Grammar explanation */}
              <div>
                <h4 className="text-sm font-semibold text-[var(--wm-text)]">
                  Grammar breakdown
                </h4>

                <p className="mt-2 text-sm leading-6 text-[var(--wm-text)]">
                  {annotation.grammarExplanation}
                </p>
              </div>

              {/* Original examples */}
              <div>
                <h4 className="text-sm font-semibold text-[var(--wm-text)]">
                  Example sentences
                </h4>

                <div className="mt-3 space-y-3">
                  {annotation.examples.map(
                    (example, index) => (
                      <div
                        key={index}
                        className="wm-subtle p-3"
                      >
                        <p className="font-medium">
                          {example.german}
                        </p>

                        <p className="mt-1 text-sm text-[var(--wm-muted)]">
                          {example.english}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Related vocabulary */}
              {annotation.relatedVocabulary.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[var(--wm-text)]">
                    Related vocabulary
                  </h4>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {annotation.relatedVocabulary.map(
                      (word) => (
                        <a
                          key={word}
                          href={`#vocab-${word}`}
                          className="wm-badge"
                          onClick={(event) => {
                                if (onOpenVocabulary) {
                                  event.preventDefault();
                                  onOpenVocabulary();
                                }
                              }}
                        >
                          {word} ↗
                        </a>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Listening activity */}
              <div className="rounded-lg border border-[var(--wm-accent)] bg-[rgb(var(--wm-accent-rgb)/0.13)] p-4">
                <h4 className="font-semibold text-[var(--wm-accent)]">
                  Listening challenge
                </h4>

                <p className="mt-2 text-sm text-[var(--wm-text)]">
                  {annotation.listeningTask}
                </p>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
    </section>
  );
}
