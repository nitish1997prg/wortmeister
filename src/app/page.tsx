
import Link from "next/link";
import { songs } from "@/data/songs";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F7F7F4] px-6 py-12 text-[#171717]">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <p className="mb-2 text-sm font-semibold text-teal-700">
            LEARN GERMAN THROUGH MUSIC
          </p>

          <h1 className="text-4xl font-bold">
            WortMeister
          </h1>

          <p className="mt-3 text-gray-600">
            Discover German songs, learn vocabulary,
            and understand the language behind the music.
          </p>
        </div>

        <h2 className="mb-4 text-xl font-semibold">
          Explore songs
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {songs.map((song) => (
            <Link
              key={song.slug}
              href={`/songs/${song.slug}`}
              className="rounded-xl border border-gray-200 bg-white p-6 transition hover:border-teal-600 hover:shadow-md"
            >
              <div className="mb-4 text-3xl">♫</div>

              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold">
                  {song.title}
                </h3>

                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                  {song.practiceLevel}
                </span>
              </div>

              <p className="mt-1 text-gray-500">
                {song.artist}
              </p>

              <p className="mt-4 text-sm text-gray-600">
                {song.grammarTopics.join(" · ")}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
