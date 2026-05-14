import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useAssessment } from "../../context/AssessmentContext";
import { submitAnswers } from "../../utils/api";
import { STEPS } from "../../utils/constants";
import ProgressBar from "./ProgressBar";
import QuestionCard from "./QuestionCard";

export default function WizardView() {
  const { questions, answers, setAnswers, sessionId, setStep, setResults, setError } = useAssessment();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [animClass, setAnimClass] = useState("question-enter");
  const [submitting, setSubmitting] = useState(false);

  const question = questions[currentIdx];
  const answer = answers[question?.id];
  const isLast = currentIdx === questions.length - 1;

  function transition(direction, callback) {
    setAnimClass("question-exit");
    setTimeout(() => {
      callback();
      setAnimClass("question-enter");
    }, 280);
  }

  function handleNext() {
    if (isLast) {
      handleSubmit();
      return;
    }
    transition("forward", () => setCurrentIdx((i) => i + 1));
  }

  function handleBack() {
    if (currentIdx === 0) return;
    transition("back", () => setCurrentIdx((i) => i - 1));
  }

  function handleAnswer(value) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setStep(STEPS.ANALYZING);
    try {
      const formatted = Object.entries(answers).map(([qId, ans]) => ({
        question_id: parseInt(qId),
        answer: ans,
      }));
      const result = await submitAnswers(sessionId, formatted);
      setResults(result);
      setStep(STEPS.RESULTS);
    } catch (err) {
      setError(err.message);
      setStep(STEPS.LANDING);
    } finally {
      setSubmitting(false);
    }
  }

  if (!question) return null;

  return (
    <div className="min-h-screen flex flex-col pt-24 pb-8 px-4 max-w-2xl mx-auto">
      <ProgressBar current={currentIdx} total={questions.length} />

      <QuestionCard
        question={question}
        answer={answer}
        onAnswer={handleAnswer}
        animClass={animClass}
      />

      <div className="flex justify-between items-center mt-8">
        {currentIdx > 0 ? (
          <button onClick={handleBack} className="text-gray-400 hover:text-gray-600 text-sm font-medium flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        ) : <div />}

        <button
          onClick={handleNext}
          disabled={!answer || submitting}
          className="bg-brand-700 hover:bg-brand-800 text-white font-semibold px-6 py-3 rounded-xl shadow-md shadow-brand-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.99]"
        >
          {submitting ? "Submitting..." : isLast ? "See My Results →" : "Next Question →"}
        </button>
      </div>
    </div>
  );
}
