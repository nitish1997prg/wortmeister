
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import prisma from "@/lib/prisma";
import SongLearningWorkspace from "@/components/SongLearningWorkspace";

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
    <main className="mx-auto max-w-7xl px-6 py-10">
      <p role="status" className="text-gray-500">
        Loading song...
      </p>
    </main>
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
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* Navigation */}
      <Link
        href="/"
        className="text-sm text-teal-700 hover:underline"
      >
        ← Back to song library
      </Link>

      {/* Database-backed song metadata */}
      <header className="mt-8 mb-10">
        <p className="text-sm font-medium text-teal-700">
          {song.artist.name}
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          {song.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-800">
            {song.practiceLevel} practice
          </span>

          <span className="text-sm text-gray-500">
            {song.lyrics
              ? "Synchronized lyrics saved"
              : "Lyrics not added yet"}
          </span>
        </div>

        {song.difficultyNote && (
          <p className="mt-4 max-w-2xl text-gray-600">
            {song.difficultyNote}
          </p>
        )}
      </header>

      
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
  );
}
