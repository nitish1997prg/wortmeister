
"use client";

import { useRef, useState } from "react";
import YouTube, { type YouTubeProps } from "react-youtube";

import type { SongAnnotation } from "@/data/songs";

interface SongPlayerProps {
  videoId: string;
  annotations: SongAnnotation[];
}

// Derive the player type from react-youtube's onReady event.
type Player = Parameters<
  NonNullable<YouTubeProps["onReady"]>
>[0]["target"];

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

export default function SongPlayer({
  videoId,
  annotations,
}: SongPlayerProps) {
  const playerRef = useRef<Player | null>(null);

  const [ready, setReady] = useState(false);
  const [capturedTime, setCapturedTime] = useState<number | null>(
    null
  );

  const handleReady: NonNullable<YouTubeProps["onReady"]> = (
    event
  ) => {
    playerRef.current = event.target;
    setReady(true);
  };

  function jumpToAnnotation(seconds: number) {
    if (!playerRef.current) return;

    // Seek without recreating the YouTube iframe.
    void playerRef.current.seekTo(seconds, true);
  }

  async function captureCurrentTime() {
    if (!playerRef.current) return;

    const seconds = await playerRef.current.getCurrentTime();

    setCapturedTime(Math.floor(seconds));
  }

  return (
    <section className="space-y-6">
      {/* Video player */}
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
        className="inline-block text-sm text-teal-700 underline"
      >
        Watch on YouTube
      </a>

      {/* Timestamp capture utility */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="font-semibold">
          Create learning timestamps
        </h3>

        <p className="mt-2 text-sm text-gray-600">
          While listening, capture the position of an
          interesting word or grammatical concept.
        </p>

        <button
          type="button"
          onClick={captureCurrentTime}
          disabled={!ready}
          className="mt-4 rounded-lg bg-teal-700 px-4 py-2 text-white hover:bg-teal-800 disabled:opacity-50"
        >
          Capture current time
        </button>

        {capturedTime !== null && (
          <p role="status" className="mt-3 text-sm">
            Captured: <strong>{formatTime(capturedTime)}</strong>
            {" "}({capturedTime} seconds)
          </p>
        )}
      </div>

      {/* Interactive annotations */}
      <div>
        <h2 className="text-2xl font-semibold">
          Explore the song
        </h2>

        <p className="mt-2 text-gray-600">
          Select an annotation to jump to that moment.
        </p>

        <div className="mt-5 space-y-3">
          {annotations.map((annotation) => (
            <article
              key={annotation.id}
              className="rounded-xl border border-gray-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-teal-700">
                    {annotation.topic}
                  </p>

                  <h3 className="mt-1 font-semibold">
                    {annotation.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    jumpToAnnotation(annotation.seconds)
                  }
                  disabled={!ready}
                  className="rounded-lg border border-teal-700 px-4 py-2 text-sm text-teal-700 hover:bg-teal-50 disabled:opacity-50"
                >
                  ▶ {formatTime(annotation.seconds)}
                </button>
              </div>

              <p className="mt-3 text-sm text-gray-600">
                {annotation.explanation}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
