import { useState } from "react";
import UploadZone from "./UploadZone";
import { useAssessment } from "../../context/AssessmentContext";
import { uploadResume, generateQuestions } from "../../utils/api";
import { STEPS } from "../../utils/constants";

export default function HeroSection() {
  const { setStep, setSessionId, setResumeInfo, setQuestions, setError } = useAssessment();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setStep(STEPS.PROCESSING);

    try {
      const uploadResult = await uploadResume(file);
      setSessionId(uploadResult.session_id);
      setResumeInfo(uploadResult);

      const questionsResult = await generateQuestions(uploadResult.session_id);
      setQuestions(questionsResult.questions);
      setStep(STEPS.WIZARD);
    } catch (err) {
      setError(err.message);
      setStep(STEPS.LANDING);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-h-screen flex items-center pt-16">
      <div className="max-w-6xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
        <div className="md:col-span-3 flex flex-col">
          <span className="bg-brand-50 text-brand-700 text-xs font-medium px-3 py-1 rounded-full border border-brand-200 inline-flex items-center gap-1.5 mb-6 self-start">
            AI-Powered &middot; 2 Minutes &middot; Free
          </span>

          <h1 className="text-4xl md:text-6xl font-bold leading-[1.1] tracking-tight text-gray-950 mb-4 font-display">
            Know if you're<br />interview-ready<br />before the call.
          </h1>

          <p className="text-lg text-gray-600 leading-relaxed mb-10 max-w-lg">
            Upload your resume. Answer 4 questions. Get a scored breakdown across Technical Skills, Resume Quality, Communication, and Portfolio.
          </p>

          <UploadZone onFileSelect={setFile} selectedFile={file} />

          <button
            onClick={handleAnalyze}
            disabled={!file || loading}
            className="bg-brand-700 hover:bg-brand-800 text-white font-semibold text-base px-8 py-4 rounded-xl w-full mt-4 shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing..." : "Analyze My Readiness →"}
          </button>
        </div>

        <div className="md:col-span-2 hidden md:flex justify-center">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 rotate-3 scale-95 ring-1 ring-black/5 w-72">
            <div className="text-center mb-4">
              <div className="text-5xl font-bold font-mono text-yellow-700">73</div>
              <div className="text-xs font-semibold uppercase tracking-widest text-yellow-600 mt-1">Almost There</div>
            </div>
            <div className="space-y-3">
              {["Technical Skills", "Resume Quality", "Communication", "Portfolio"].map((dim, i) => (
                <div key={dim}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{dim}</span>
                    <span className="font-mono font-bold">{[78, 65, 74, 68][i]}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100">
                    <div className="h-1.5 rounded-full bg-brand-400" style={{ width: `${[78, 65, 74, 68][i]}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
