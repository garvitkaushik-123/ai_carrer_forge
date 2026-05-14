import { useState, useEffect } from "react";

const STATUS_MESSAGES = [
  "Reading work experience...",
  "Extracting skills...",
  "Checking keywords...",
  "Parsing education...",
  "Generating personalized questions...",
];

export default function ProcessingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 relative overflow-hidden">
        <div className="absolute left-2 right-2 h-0.5 bg-white/60 rounded animate-scan" />
      </div>

      <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-2 font-display">
        Analyzing your resume...
      </h2>
      <p className="text-base text-gray-400 text-center max-w-sm">
        Our AI is reading your experience, skills, and keywords
      </p>

      <div className="flex gap-2 mt-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-brand-400 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>

      <p className="text-sm text-gray-400 italic text-center mt-3 h-5 transition-opacity duration-300">
        {STATUS_MESSAGES[msgIndex]}
      </p>
    </div>
  );
}
