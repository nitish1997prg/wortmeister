
import prisma from "@/lib/prisma";
import { parseLrc } from "@/lib/lrc";
import { z } from "zod";

type Context = {
  params: Promise<{ slug: string }>;
};

const SaveLyricsSchema = z.object({
  lrcContent: z.string().min(1).max(250_000),
  syncedVideoId: z.string().min(1).max(100),
});

const noStore = {
  "Cache-Control": "private, no-store",
};

// Temporary safeguard for this private prototype.
// Authentication is required before public deployment.
function isLocalDevelopment() {
  return process.env.NODE_ENV === "development";
}

export async function GET(
  _request: Request,
  { params }: Context
) {
  if (!isLocalDevelopment()) {
    return Response.json(
      { error: "Private lyrics endpoint is disabled." },
      { status: 403 }
    );
  }

  const { slug } = await params;

  try {
    const song = await prisma.song.findUnique({
      where: { slug },
      select: {
        youtubeId: true,
        lyrics: {
          select: {
            lrcContent: true,
            syncedVideoId: true,
            version: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!song) {
      return Response.json(
        { error: "Song not found." },
        { status: 404 }
      );
    }

    return Response.json(
      {
        lrcContent: song.lyrics?.lrcContent ?? null,
        syncedVideoId:
          song.lyrics?.syncedVideoId ?? null,
        version: song.lyrics?.version ?? null,
        updatedAt: song.lyrics?.updatedAt ?? null,
      },
      { headers: noStore }
    );
  } catch (error) {
    console.error("Load lyrics failed:", error);

    return Response.json(
      { error: "Unable to load lyrics." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: Context
) {
  if (!isLocalDevelopment()) {
    return Response.json(
      { error: "Private lyrics endpoint is disabled." },
      { status: 403 }
    );
  }

  const { slug } = await params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const validated = SaveLyricsSchema.safeParse(body);

  if (!validated.success) {
    return Response.json(
      { error: "Invalid LRC data." },
      { status: 400 }
    );
  }

  const { lrcContent, syncedVideoId } = validated.data;

  if (parseLrc(lrcContent).length === 0) {
    return Response.json(
      { error: "No valid LRC timestamps found." },
      { status: 400 }
    );
  }

  try {
    const song = await prisma.song.findUnique({
      where: { slug },
      select: {
        id: true,
        youtubeId: true,
      },
    });

    if (!song) {
      return Response.json(
        { error: "Song not found." },
        { status: 404 }
      );
    }

    // Prevent saving timestamps for the wrong video.
    if (song.youtubeId !== syncedVideoId) {
      return Response.json(
        {
          error:
            "The synchronized video does not match this song.",
        },
        { status: 409 }
      );
    }

    const saved = await prisma.songLyrics.upsert({
      where: {
        songId: song.id,
      },
      create: {
        songId: song.id,
        lrcContent,
        syncedVideoId,
      },
      update: {
        lrcContent,
        syncedVideoId,
        version: {
          increment: 1,
        },
      },
      select: {
        version: true,
        updatedAt: true,
      },
    });

    return Response.json(
      {
        saved: true,
        version: saved.version,
        updatedAt: saved.updatedAt,
      },
      { headers: noStore }
    );
  } catch (error) {
    console.error("Save lyrics failed:", error);

    return Response.json(
      { error: "Unable to save lyrics." },
      { status: 500 }
    );
  }
}
