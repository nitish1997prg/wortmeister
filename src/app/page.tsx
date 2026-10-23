
import Link from "next/link";
import { Suspense } from "react";
import prisma from "@/lib/prisma";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-10">
        <p className="text-sm font-medium text-teal-700">
          WortMeister
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Learn German through music
        </h1>

        <p className="mt-4 max-w-2xl text-gray-600">
          Explore Rammstein songs, follow synchronized
          German lyrics, and learn vocabulary and
          grammar with your AI tutor.
        </p>
      </div>

      <Suspense fallback={<SongLibrarySkeleton />}>
        <SongLibrary />
      </Suspense>
    </main>
  );
}

function SongLibrarySkeleton() {
  return (
    <div
      role="status"
      className="rounded-xl border border-gray-200 bg-white p-6 text-gray-500"
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
      <div className="rounded-xl border p-6">
        <p className="text-gray-600">
          No songs have been added yet.
        </p>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          Rammstein Song Library
        </h2>

        <span className="text-sm text-gray-500">
          {songs.length} songs
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {songs.map((song) => (
          <Link
            key={song.id}
            href={`/songs/${song.slug}`}
            className="rounded-xl border border-gray-200 bg-white p-6 transition hover:border-teal-500 hover:shadow-md"
          >
            <p className="text-sm text-gray-500">
              {song.artist.name}
            </p>

            <h3 className="mt-2 text-2xl font-semibold">
              {song.title}
            </h3>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs text-teal-800">
                {song.practiceLevel} practice
              </span>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                {song.lyrics
                  ? "Lyrics ready"
                  : "Lyrics not added"}
              </span>
            </div>

            {song.difficultyNote && (
              <p className="mt-4 text-sm leading-6 text-gray-600">
                {song.difficultyNote}
              </p>
            )}

            <p className="mt-5 text-sm font-medium text-teal-700">
              Explore song →
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
