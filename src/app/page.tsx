
import Link from "next/link";
import { Suspense } from "react";
import prisma from "@/lib/prisma";

export default function HomePage() {
  return (
    <div className="wm-shell">
      <main className="wm-container">
        <div className="wm-song-hero mb-10">
          <p className="wm-eyebrow">
            WortMeister
          </p>

          <h1 className="wm-display wm-page-title mt-4 max-w-4xl">
            Learn German through music
          </h1>

          <p className="mt-4 max-w-2xl text-[var(--wm-muted)]">
            Explore Rammstein songs, follow synchronized
            German lyrics, and learn vocabulary and
            grammar with your AI tutor.
          </p>
        </div>

        <Suspense fallback={<SongLibrarySkeleton />}>
          <SongLibrary />
        </Suspense>
      </main>
    </div>
  );
}

function SongLibrarySkeleton() {
  return (
    <div
      role="status"
      className="wm-card p-6 text-[var(--wm-muted)]"
    >
      Loading songs...
    </div>
  );
}

async function SongLibrary() {
  const songs = await prisma.song.findMany({
    where: {
      artist: {
        is: {
          slug: "rammstein",
        },
      },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      practiceLevel: true,
      difficultyNote: true,
      artist: {
        select: {
          name: true,
        },
      },
      lyrics: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      title: "asc",
    },
  });

  if (songs.length === 0) {
    return (
      <div className="wm-card p-6">
        <p className="text-[var(--wm-muted)]">
          No songs have been added yet.
        </p>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="wm-section-title">
          Rammstein Song Library
        </h2>

        <span className="text-sm text-[var(--wm-muted)]">
          {songs.length} songs
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {songs.map((song) => (
          <Link
            key={song.id}
            href={`/songs/${song.slug}`}
            className="wm-card wm-library-card flex flex-col p-6"
          >
            <p className="text-sm text-[var(--wm-muted)]">
              {song.artist.name}
            </p>

            <h3 className="mt-2 text-2xl font-semibold">
              {song.title}
            </h3>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="wm-badge">
                {song.practiceLevel} practice
              </span>

              <span className="wm-badge">
                {song.lyrics
                  ? "Lyrics ready"
                  : "Lyrics not added"}
              </span>
            </div>

            {song.difficultyNote && (
              <p className="mt-4 text-sm leading-6 text-[var(--wm-muted)]">
                {song.difficultyNote}
              </p>
            )}

            <p className="mt-5 text-sm font-medium text-[var(--wm-accent)]">
              Explore song →
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
