
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { songs } from "@/data/songs";
import VocabularyCard from "@/components/VocabularyCard";
import SongQuiz from "@/components/SongQuiz";
import SongPlayer from "@/components/SongPlayer";

// NEW: Tell Next.js which song pages to prerender.
export function generateStaticParams() {
  return songs.map((song) => ({
    slug: song.slug,
  }));
}

interface SongPageProps {
  params: Promise<{ slug: string }>;
}

// Parent component: Does not await params.
export default function SongPage({
  params,
}: SongPageProps) {
  return (
    <Suspense fallback={<p>Loading song...</p>}>
      <SongContent params={params} />
    </Suspense>
  );
}

// Child component: Reads params inside Suspense.
async function SongContent({
  params,
}: SongPageProps) {
  const { slug } = await params;

  const song = songs.find(
    (item) => item.slug === slug
  );

  if (!song) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#F7F7F4] px-6 py-10 text-[#171717]">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="text-sm font-medium text-teal-700 hover:underline"
        >
          ← All songs
        </Link>

        <header className="my-8">
          <h1 className="text-4xl font-bold">
            {song.title}
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            {song.artist}
          </p>
          <p className="mt-3 text-sm text-gray-500">
            Recommended practice: {song.practiceLevel}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {song.difficultyNote}
          </p>
        </header>

        
        <SongPlayer
          videoId={song.youtubeId}
          annotations={song.annotations}
        />


        <a
          href={`https://www.youtube.com/watch?v=${song.youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm text-teal-700 underline"
        >
          Watch on YouTube
        </a>

        
      <section className="mt-8 rounded-xl border border-teal-100 bg-teal-50 p-6">
        <h2 className="text-xl font-semibold text-teal-900">
          Your listening challenge
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          Play the song and see whether you can recognize
          these words and grammatical structures.
        </p>

        <ol className="mt-5 space-y-3">
          {song.listeningPrompts.map((prompt, index) => (
            <li
              key={index}
              className="flex items-start gap-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-semibold text-white">
                {index + 1}
              </span>

              <span className="pt-1 text-sm text-gray-800">
                {prompt}
              </span>
            </li>
          ))}
        </ol>
      </section>


        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            Grammar topics
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {song.grammarTopics.map((topic) => (
              <span
                key={topic}
                className="rounded-full bg-teal-50 px-4 py-2 text-sm text-teal-800"
              >
                {topic}
              </span>
            ))}
          </div>
        </section>

          <div className="mt-5 space-y-4">
            
          <section className="mt-10">
            <h2 className="text-2xl font-semibold">
              Learn vocabulary
            </h2>

            <p className="mt-2 text-gray-600">
              Try to remember the meaning before revealing it.
            </p>

            <div className="mt-5 space-y-4">
              {song.vocabulary.map((word) => (
                <VocabularyCard
                  key={word.german}
                  word={word}
                />
              ))}
            </div>
          </section>

          </div>
        
        
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">
          Test your knowledge
        </h2>

        <p className="mb-6 mt-2 text-gray-600">
          Answer a few questions based on what you&apos;ve learned.
        </p>

        <SongQuiz questions={song.quiz} />
      </section>

      </div>
    </main>
  );

  
}