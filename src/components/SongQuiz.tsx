
"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/data/songs";

interface SongQuizProps {
  questions: QuizQuestion[];
}

export default function SongQuiz({
  questions,
}: SongQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (questions.length === 0) {
    return <p>No quiz available for this song yet.</p>;
  }

  const currentQuestion = questions[currentIndex];

  function checkAnswer() {
    if (selected === null || submitted) return;

    if (selected === currentQuestion.correctOptionIndex) {
      setScore((previous) => previous + 1);
    }

    setSubmitted(true);
  }

  function nextQuestion() {
    if (currentIndex === questions.length - 1) {
      setFinished(true);
      return;
    }

    setCurrentIndex((previous) => previous + 1);
    setSelected(null);
    setSubmitted(false);
  }

  function retryQuiz() {
    setCurrentIndex(0);
    setSelected(null);
    setSubmitted(false);
    setScore(0);
    setFinished(false);
  }

  if (finished) {
    return (
      <div className="wm-card p-6 text-center">
        <h3 className="text-2xl font-bold">
          Quiz complete!
        </h3>

        <p className="mt-4 text-xl">
          Score: {score}/{questions.length}
        </p>

        <button
          onClick={retryQuiz}
          className="wm-button-primary mt-6 px-6 py-3"
        >
          Retry quiz
        </button>
      </div>
    );
  }

  const isCorrect =
    selected === currentQuestion.correctOptionIndex;

  return (
    <div className="wm-card p-6">
      <div className="mb-5 flex justify-between text-sm text-[var(--wm-muted)]">
        <span>
          Question {currentIndex + 1}/{questions.length}
        </span>

        <span>Score: {score}</span>
      </div>

      <h3 className="mb-6 text-xl font-semibold">
        {currentQuestion.question}
      </h3>

      <div className="space-y-3">
        {currentQuestion.options.map((option, index) => (
          <button
            key={`${currentQuestion.id}-${index}`}
            type="button"
            disabled={submitted}
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
            className={`w-full rounded-lg border p-4 text-left transition ${
              selected === index
                ? "border-[var(--wm-accent)] bg-[rgb(var(--wm-accent-rgb)/0.13)]"
                : "border-[var(--wm-border)] hover:bg-[var(--wm-surface-raised)]"
            } disabled:cursor-default`}
          >
            {option}
          </button>
        ))}
      </div>

      {submitted && (
        <div
          role="status"
          className="mt-6 wm-subtle p-4"
        >
          <p className="font-semibold">
            {isCorrect ? "Correct!" : "Not quite."}
          </p>

          <p className="mt-2 text-sm text-[var(--wm-text)]">
            {currentQuestion.explanation}
          </p>
        </div>
      )}

      <div className="mt-6">
        {!submitted ? (
          <button
            type="button"
            disabled={selected === null}
            onClick={checkAnswer}
            className="wm-button-primary px-6 py-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Check answer
          </button>
        ) : (
          <button
            type="button"
            onClick={nextQuestion}
            className="wm-button-primary px-6 py-3"
          >
            {currentIndex === questions.length - 1
              ? "See results"
              : "Next question"}
          </button>
        )}
      </div>
    </div>
  );
}
