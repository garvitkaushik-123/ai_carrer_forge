import { createContext, useContext, useState } from "react";
import { STEPS } from "../utils/constants";

const AssessmentContext = createContext(null);

export function AssessmentProvider({ children }) {
  const [step, setStep] = useState(STEPS.LANDING);
  const [sessionId, setSessionId] = useState(null);
  const [resumeInfo, setResumeInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const value = {
    step, setStep,
    sessionId, setSessionId,
    resumeInfo, setResumeInfo,
    questions, setQuestions,
    answers, setAnswers,
    results, setResults,
    error, setError,
  };

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error("useAssessment must be used within AssessmentProvider");
  return ctx;
}
