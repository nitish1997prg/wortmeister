
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import prisma from "@/lib/prisma";
import SongLearningWorkspace from "@/components/SongLearningWorkspace";
import { getSongThemeStyles } from "@/lib/songThemes";

// Temporary learning content.
// Song metadata now comes from PostgreSQL.
import { songs as localLearningContent } from "@/data/songs";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default function SongPage({ params }: PageProps) {
  return (
    <Suspense fallback={<SongLoading />}>
      <SongContent params={params} />
    </Suspense>
  );
}

function SongLoading() {
  return (
    <div className="wm-shell">
      <main className="wm-container">
        <p role="status" className="wm-muted">
          Loading song...
        </p>
      </main>
    </div>
  );
}

async function SongContent({ params }: PageProps) {
  const { slug } = await params;

  // Source of truth: PostgreSQL
  const song = await prisma.song.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      youtubeId: true,
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
  });

  if (!song) {
    notFound();
  }

  // Temporary compatibility with our older
  // hardcoded learning activities.
  const learningContent = localLearningContent.find(
    (entry) => entry.slug === song.slug
  );

  const annotations = learningContent?.annotations ?? [];
  const vocabulary = learningContent?.vocabulary ?? [];
  const grammarTopics = learningContent?.grammarTopics ?? [];
  const listeningPrompts =
    learningContent?.listeningPrompts ?? [];
  const quiz = learningContent?.quiz ?? [];

  return (
    <div
      className="wm-shell"
      style={getSongThemeStyles(song.slug)}
    >
      <main className="wm-container space-y-8">

        {/* Back navigation */}
        <Link
          href="/"
          className="wm-muted inline-block text-sm transition-colors hover:text-[var(--wm-accent)]"
        >
          ← Back to song library
        </Link>

        {/* Song hero */}
        <header className="wm-song-hero space-y-5">

          {/* Artist name */}
          <p className="wm-eyebrow">
            {song.artist.name}
          </p>

          {/* Song title */}
          <h1 className="wm-display wm-page-title">
            {song.title}
          </h1>

          {/* Song metadata */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="wm-badge">
              {song.practiceLevel} German
            </span>

            <span className="wm-muted text-sm">
              {song.lyrics
                ? "Synchronized lyrics available"
                : "Lyrics not added yet"}
            </span>
          </div>

          {/* Difficulty description */}
          {song.difficultyNote && (
            <p className="wm-muted max-w-2xl text-sm leading-7">
              {song.difficultyNote}
            </p>
          )}

          {/* Learning tagline */}
          <p className="wm-muted text-sm">
            Listen. Understand. Learn.
          </p>

        </header>

        {/* Existing song learning dashboard */}
        <SongLearningWorkspace
          key={song.slug}
          songSlug={song.slug}
          videoId={song.youtubeId}
          annotations={annotations}
          suggestedVocabulary={vocabulary}
          grammarTopics={grammarTopics}
          listeningPrompts={listeningPrompts}
          quiz={quiz}
        />

      </main>
    </div>
  );
}
