
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const artist = await prisma.artist.upsert({
    where: { slug: "rammstein" },
    update: {},
    create: {
      name: "Rammstein",
      slug: "rammstein",
    },
  });

  const song = await prisma.song.upsert({
    where: { slug: "ich-will" },
    update: {},
    create: {
      title: "Ich will",
      slug: "ich-will",
      youtubeId: "EOnSh3QlpbQ",
      practiceLevel: "A2",
      difficultyNote:
        "Practice recommendation; not a formal CEFR rating.",
      artistId: artist.id,
    },
  });

  
  const sonne = await prisma.song.upsert({
    where: {
      slug: "sonne",
    },
    update: {},
    create: {
      title: "Sonne",
      slug: "sonne",
      youtubeId: "StZcUAPRRac",
      practiceLevel: "A2",
      difficultyNote:
        "Suggested A2 listening practice. " +
        "Contains repetition and useful vocabulary.",
      artistId: artist.id,
    },
  });

  console.log("Seeded song:", sonne.title);


  console.log("Seeded artist:", artist.name);
  console.log("Seeded song:", song.title);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
