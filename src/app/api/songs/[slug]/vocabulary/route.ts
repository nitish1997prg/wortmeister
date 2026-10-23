
import prisma from "@/lib/prisma";
import { z } from "zod";

type Context = {
  params: Promise<{ slug: string }>;
};

const CacheKeySchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/);

const BodySchema = z.object({
  cacheKey: CacheKeySchema,
});

const headers = {
  "Cache-Control": "private, no-store",
};

// Private local prototype only.
// Replace with real authentication before deployment.
function developmentOnly() {
  return process.env.NODE_ENV === "development";
}

function forbidden() {
  return Response.json(
    { error: "Vocabulary endpoint is private." },
    { status: 403 }
  );
}

async function getSong(slug: string) {
  return prisma.song.findUnique({
    where: { slug },
    select: { id: true },
  });
}

async function parseBody(request: Request) {
  try {
    const json: unknown = await request.json();
    return BodySchema.safeParse(json);
  } catch {
    return BodySchema.safeParse(null);
  }
}

// Check whether this explanation is saved.
export async function GET(
  request: Request,
  { params }: Context
) {
  if (!developmentOnly()) return forbidden();

  const { slug } = await params;

  const url = new URL(request.url);
  const parsed = CacheKeySchema.safeParse(
    url.searchParams.get("cacheKey")
  );

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid cache key." },
      { status: 400 }
    );
  }

  try {
    const song = await getSong(slug);

    if (!song) {
      return Response.json(
        { error: "Song not found." },
        { status: 404 }
      );
    }

    const record = await prisma.savedVocabulary.findFirst({
      where: {
        songId: song.id,
        explanation: {
          cacheKey: parsed.data,
        },
      },
      select: {
        id: true,
      },
    });

    return Response.json(
      { saved: record !== null },
      { headers }
    );
  } catch (error) {
    console.error("Check saved vocabulary failed:", error);

    return Response.json(
      { error: "Unable to check saved vocabulary." },
      { status: 500 }
    );
  }
}

// Save a cached explanation to a song.
export async function POST(
  request: Request,
  { params }: Context
) {
  if (!developmentOnly()) return forbidden();

  const { slug } = await params;
  const parsed = await parseBody(request);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid cache key." },
      { status: 400 }
    );
  }

  try {
    const song = await getSong(slug);

    if (!song) {
      return Response.json(
        { error: "Song not found." },
        { status: 404 }
      );
    }

    const explanation =
      await prisma.vocabularyExplanation.findUnique({
        where: {
          cacheKey: parsed.data.cacheKey,
        },
        select: {
          id: true,
        },
      });

    if (!explanation) {
      return Response.json(
        {
          error:
            "Explanation not found in the database. " +
            "Generate it again before saving.",
        },
        { status: 404 }
      );
    }

    await prisma.savedVocabulary.upsert({
      where: {
        songId_explanationId: {
          songId: song.id,
          explanationId: explanation.id,
        },
      },
      create: {
        songId: song.id,
        explanationId: explanation.id,
      },
      update: {},
    });

    return Response.json(
      { saved: true },
      { headers }
    );
  } catch (error) {
    console.error("Save vocabulary failed:", error);

    return Response.json(
      { error: "Unable to save vocabulary." },
      { status: 500 }
    );
  }
}

// Remove a saved explanation from a song.
export async function DELETE(
  request: Request,
  { params }: Context
) {
  if (!developmentOnly()) return forbidden();

  const { slug } = await params;
  const parsed = await parseBody(request);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid cache key." },
      { status: 400 }
    );
  }

  try {
    const song = await getSong(slug);

    if (!song) {
      return Response.json(
        { error: "Song not found." },
        { status: 404 }
      );
    }

    await prisma.savedVocabulary.deleteMany({
      where: {
        songId: song.id,
        explanation: {
          cacheKey: parsed.data.cacheKey,
        },
      },
    });

    return Response.json(
      { saved: false },
      { headers }
    );
  } catch (error) {
    console.error("Remove vocabulary failed:", error);

    return Response.json(
      { error: "Unable to remove vocabulary." },
      { status: 500 }
    );
  }
}
