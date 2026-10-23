
"use client";

import { useState, type ComponentProps } from "react";

import SongPlayer from "@/components/SongPlayer";
import SavedVocabularySection from "@/components/SavedVocabularySection";
import SongVerbsSection from "@/components/SongVerbsSection";
import SongGrammarSection from "@/components/SongGrammarSection";
import VocabularyCard from "@/components/VocabularyCard";
import SongQuiz from "@/components/SongQuiz";

type Section =
  | "lyrics"
  | "vocabulary"
  | "verbs"
  | "grammar"
  | "practice";

interface Props {
  songSlug: string;
  videoId: string;
  annotations: ComponentProps<
    typeof SongPlayer
  >["annotations"];
  suggestedVocabulary: ComponentProps<
    typeof VocabularyCard
  >["word"][];
  grammarTopics: string[];
  listeningPrompts: string[];
  quiz: ComponentProps<
    typeof SongQuiz
  >["questions"];
}

const sections: {
  id: Section;
  label: string;
}[] = [
  { id: "lyrics", label: "Lyrics" },
  { id: "vocabulary", label: "Vocabulary" },
  { id: "verbs", label: "Verbs" },
  { id: "grammar", label: "Grammar" },
  { id: "practice", label: "Practice" },
];

export default function SongLearningWorkspace({
  songSlug,
  videoId,
  annotations,
  suggestedVocabulary,
  grammarTopics,
  listeningPrompts,
  quiz,
}: Props) {
  const [activeSection, setActiveSection] =
    useState<Section>("lyrics");

  return (
    <div className="space-y-8">
      {/* Navigation */}
      <nav
        aria-label="Song learning sections"
        className="flex gap-2 overflow-x-auto rounded-xl border border-gray-200 bg-white p-2"
      >
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            aria-pressed={
              activeSection === section.id
            }
            onClick={() =>
              setActiveSection(section.id)
            }
            className={`shrink-0 rounded-lg px-5 py-3 text-sm font-medium transition ${
              activeSection === section.id
                ? "bg-teal-700 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {section.label}
          </button>
        ))}
      </nav>

      {/* Lyrics:
          Keep mounted to preserve playback
          and unsaved synchronization changes. */}
      <div hidden={activeSection !== "lyrics"}>
        <SongPlayer
          songSlug={songSlug}
          videoId={videoId}
          annotations={annotations}
          active={activeSection === "lyrics"}
          onOpenVocabulary={() =>
            setActiveSection("vocabulary")
          }
        />
      </div>

      {/* Vocabulary */}
      {activeSection === "vocabulary" && (
        <div className="space-y-12">
          <SavedVocabularySection
            songSlug={songSlug}
          />

          {suggestedVocabulary.length > 0 && (
            <section className="space-y-5">
              <div>
                <h2 className="text-2xl font-semibold">
                  Suggested Vocabulary
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  Additional words selected for
                  learning this song.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {suggestedVocabulary.map((word) => (
                  <div
                    key={word.german}
                    id={`vocab-${word.german}`}
                  >
                    <VocabularyCard word={word} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Verbs */}
      {activeSection === "verbs" && (
        <SongVerbsSection
          songSlug={songSlug}
        />
      )}

      {/* Grammar */}
      {activeSection === "grammar" && (
        <div className="space-y-10">
          <SongGrammarSection
            songSlug={songSlug}
          />

          {grammarTopics.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold">
                Suggested Grammar Topics
              </h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {grammarTopics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Existing practice activities */}
      {activeSection === "practice" && (
        <div className="space-y-12">
          {listeningPrompts.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold">
                Listening Challenges
              </h2>

              <ul className="mt-5 list-disc space-y-3 pl-6 text-gray-700">
                {listeningPrompts.map(
                  (prompt, index) => (
                    <li key={index}>{prompt}</li>
                  )
                )}
              </ul>
            </section>
          )}

          {quiz.length > 0 && (
            <section>
              <h2 className="mb-5 text-2xl font-semibold">
                Practice Quiz
              </h2>

              <SongQuiz questions={quiz} />
            </section>
          )}

          {quiz.length === 0 &&
            listeningPrompts.length === 0 && (
              <div className="rounded-xl border border-dashed p-6">
                <h2 className="font-semibold">
                  Practice activities coming soon
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  This song does not have
                  prepared exercises yet.
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
