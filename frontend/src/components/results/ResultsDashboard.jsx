import { useAssessment } from "../../context/AssessmentContext";
import { getScoreBand } from "../../utils/scoreBands";
import ScoreGauge from "./ScoreGauge";
import ScoreBandPill from "./ScoreBandPill";
import DimensionCard from "./DimensionCard";
import { STEPS } from "../../utils/constants";

export default function ResultsDashboard() {
  const { results, setStep, setSessionId, setResumeInfo, setQuestions, setAnswers, setResults } = useAssessment();

  if (!results) return null;

  const band = getScoreBand(results.overall_score);

  function handleRetake() {
    setSessionId(null);
    setResumeInfo(null);
    setQuestions([]);
    setAnswers({});
    setResults(null);
    setStep(STEPS.LANDING);
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="sticky top-16 z-40 h-1.5" style={{ backgroundColor: band.fill }} />

      <div className="py-12 px-4 text-center bg-white shadow-sm border-b border-gray-100">
        <ScoreGauge score={results.overall_score} />
        <div className="mt-6">
          <ScoreBandPill score={results.overall_score} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto px-4 py-8">
        {results.dimensions.map((dim, i) => (
          <DimensionCard key={dim.dimension} dimension={dim} delay={i * 100} />
        ))}
      </div>

      <div className="mt-6 mb-12 flex flex-col items-center gap-3">
        <button
          onClick={() => window.print()}
          className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-4 rounded-xl flex items-center gap-2.5 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          Download PDF Report
        </button>
        <button
          onClick={handleRetake}
          className="text-sm text-gray-400 hover:text-gray-600 underline-offset-2 hover:underline"
        >
          Retake Assessment
        </button>
      </div>
    </div>
  );
}
