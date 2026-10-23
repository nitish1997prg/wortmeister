
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const songs = await prisma.song.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        youtubeId: true,
        practiceLevel: true,
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

    return Response.json({
      count: songs.length,
      songs: songs.map((song) => ({
        id: song.id,
        title: song.title,
        slug: song.slug,
        artist: song.artist.name,
        youtubeId: song.youtubeId,
        practiceLevel: song.practiceLevel,
        hasLyrics: song.lyrics !== null,
      })),
    });
  } catch (error) {
    console.error("Database query failed:", error);

    return Response.json(
      { error: "Unable to retrieve songs." },
      { status: 500 }
    );
  }
}
