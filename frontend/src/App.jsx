import { AssessmentProvider, useAssessment } from "./context/AssessmentContext";
import { STEPS } from "./utils/constants";
import Navbar from "./components/layout/Navbar";
import HeroSection from "./components/landing/HeroSection";
import HowItWorks from "./components/landing/HowItWorks";
import ProcessingScreen from "./components/loading/ProcessingScreen";
import WizardView from "./components/wizard/WizardView";
import AnalysisScreen from "./components/loading/AnalysisScreen";
import ResultsDashboard from "./components/results/ResultsDashboard";

function AppContent() {
  const { step, error } = useAssessment();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {error && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-red-50 border-b border-red-200 px-6 py-3 text-red-700 text-sm text-center">
          {error}
        </div>
      )}
      {step === STEPS.LANDING && (
        <>
          <HeroSection />
          <HowItWorks />
        </>
      )}
      {step === STEPS.PROCESSING && <ProcessingScreen />}
      {step === STEPS.WIZARD && <WizardView />}
      {step === STEPS.ANALYZING && <AnalysisScreen />}
      {step === STEPS.RESULTS && <ResultsDashboard />}
    </div>
  );
}

export default function App() {
  return (
    <AssessmentProvider>
      <AppContent />
    </AssessmentProvider>
  );
}
