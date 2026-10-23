import { Suspense } from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import SongPlayer from "@/components/SongPlayer";
import { getSongThemeStyles } from "@/lib/songThemes";

type Props = { params: Promise<{ slug: string }> };

export default function AdminLyricsPage({ params }: Props) {
  if (process.env.NODE_ENV !== "development") notFound();
  return <Suspense fallback={<main className="wm-shell"><div className="wm-container" role="status">Loading lyrics editor...</div></main>}>
    <EditorPage params={params} />
  </Suspense>;
}

async function EditorPage({ params }: Props) {
  const { slug } = await params;
  const song = await prisma.song.findUnique({
    where: { slug },
    select: {
      slug: true, title: true, youtubeId: true,
      artist: { select: { name: true } },
      lyrics: { select: { version: true, updatedAt: true, syncedVideoId: true } },
    },
  });
  if (!song) notFound();

  return <main className="wm-shell" style={getSongThemeStyles(song.slug)}>
    <div className="wm-container space-y-6">
      {/* Full navigations allow the editor's beforeunload guard to protect edits. */}
      <nav aria-label="Admin navigation" className="flex flex-wrap gap-3">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Full navigation triggers beforeunload to protect unsaved lyrics; client routing would bypass it. */}
        <a href="/" className="wm-button-secondary">Song library</a>
        <a href={`/songs/${song.slug}`} className="wm-button-secondary">View Learner Page</a>
      </nav>
      <header className="wm-song-hero space-y-3">
        <p className="wm-eyebrow">Admin / Lyrics Editor</p>
        <h1 className="wm-display wm-page-title">{song.title}</h1>
        <p className="wm-muted">{song.artist.name} - Development workspace</p>
        <p className="wm-muted text-sm">{song.lyrics
          ? `Saved version ${song.lyrics.version} - ${song.lyrics.updatedAt.toISOString()}`
          : "No saved lyrics. Import an LRC file to begin."}</p>
        {song.lyrics && song.lyrics.syncedVideoId !== song.youtubeId &&
          <p role="alert" className="text-[var(--wm-warning)]">Saved lyrics reference a different video. Import lyrics for the current video before saving.</p>}
      </header>
      <SongPlayer key={song.slug} songSlug={song.slug} videoId={song.youtubeId} annotations={[]} editorEnabled />
    </div>
  </main>;
}
