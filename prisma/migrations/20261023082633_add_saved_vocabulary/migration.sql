-- CreateTable
CREATE TABLE "SavedVocabulary" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "explanationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedVocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedVocabulary_explanationId_idx" ON "SavedVocabulary"("explanationId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedVocabulary_songId_explanationId_key" ON "SavedVocabulary"("songId", "explanationId");

-- AddForeignKey
ALTER TABLE "SavedVocabulary" ADD CONSTRAINT "SavedVocabulary_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedVocabulary" ADD CONSTRAINT "SavedVocabulary_explanationId_fkey" FOREIGN KEY ("explanationId") REFERENCES "VocabularyExplanation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
