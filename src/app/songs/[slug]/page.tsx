
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import prisma from "@/lib/prisma";
import SavedVocabularySection from "@/components/SavedVocabularySection";

// Temporary learning content.
// Song metadata now comes from PostgreSQL.
import { songs as localLearningContent } from "@/data/songs";

import SongPlayer from "@/components/SongPlayer";
import VocabularyCard from "@/components/VocabularyCard";
import SongQuiz from "@/components/SongQuiz";

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

      {/* Existing YouTube + lyrics + Bedrock experience */}
      <SongPlayer
        key={song.slug}
        songSlug={song.slug}
        videoId={song.youtubeId}
        annotations={annotations}
      />

      
      {/* Database-backed saved vocabulary */}
      <div className="mt-12">
        <SavedVocabularySection
          key={song.slug}
          songSlug={song.slug}
        />
      </div>


      {/* Learning content */}
      {learningContent ? (
        <div className="mt-12 space-y-12">
          {grammarTopics.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold">
                Grammar topics
              </h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {grammarTopics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </section>
          )}

          {vocabulary.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold">
                Suggested Vocabulary
              </h2>

              <p className="mt-2 text-gray-600">
                Review useful German words from
                this song.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {vocabulary.map((word) => (
                  <div
                    key={word.german}
                    id={`vocab-${word.german}`}
                  >
                    <VocabularyCard word={word} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {listeningPrompts.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold">
                Listening challenges
              </h2>

              <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-700">
                {listeningPrompts.map((prompt, index) => (
                  <li key={index}>{prompt}</li>
                ))}
              </ul>
            </section>
          )}

          {quiz.length > 0 && (
            <section>
              <h2 className="mb-5 text-2xl font-semibold">
                Practice quiz
              </h2>

              <SongQuiz questions={quiz} />
            </section>
          )}
        </div>
      ) : (
        <section className="mt-12 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold">
            Learning activities coming soon
          </h2>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            You can already watch this song, import
            synchronized lyrics, and use the AI
            vocabulary tutor.

            Dedicated vocabulary, grammar, and
            quizzes will be added later.
          </p>
        </section>
      )}
    </main>
  );
}
