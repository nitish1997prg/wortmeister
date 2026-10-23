
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
        className="wm-tabs"
      >
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className="wm-tab"
            data-active={
              activeSection === section.id
            }
            aria-pressed={
              activeSection === section.id
            }
            onClick={() =>
              setActiveSection(section.id)
            }
          >
            {section.label}
          </button>
        ))}
      </nav>


      {/* Lyrics:
          Keep mounted to preserve playback
          and vocabulary interactions. */}
      <div hidden={activeSection !== "lyrics"}>
        <SongPlayer
          editorEnabled={false}
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
                <h2 className="wm-section-title">
                  Suggested Vocabulary
                </h2>

                <p className="mt-2 text-sm text-[var(--wm-muted)]">
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
              <h2 className="wm-section-title">
                Suggested Grammar Topics
              </h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {grammarTopics.map((topic) => (
                  <span
                    key={topic}
                    className="wm-badge"
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
              <h2 className="wm-section-title">
                Listening Challenges
              </h2>

              <ul className="mt-5 list-disc space-y-3 pl-6 text-[var(--wm-text)]">
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
              <h2 className="mb-5 wm-section-title">
                Practice Quiz
              </h2>

              <SongQuiz questions={quiz} />
            </section>
          )}

          {quiz.length === 0 &&
            listeningPrompts.length === 0 && (
              <div className="wm-card border-dashed p-6">
                <h2 className="font-semibold">
                  Practice activities coming soon
                </h2>

                <p className="mt-2 text-sm text-[var(--wm-muted)]">
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
