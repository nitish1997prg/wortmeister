-- CreateTable
CREATE TABLE "VocabularyExplanation" (
    "id" TEXT NOT NULL,
    "cacheKey" VARCHAR(64) NOT NULL,
    "word" VARCHAR(100) NOT NULL,
    "context" TEXT NOT NULL,
    "level" VARCHAR(5) NOT NULL,
    "modelId" TEXT NOT NULL,
    "promptVersion" INTEGER NOT NULL DEFAULT 1,
    "explanation" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocabularyExplanation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VocabularyExplanation_cacheKey_key" ON "VocabularyExplanation"("cacheKey");
