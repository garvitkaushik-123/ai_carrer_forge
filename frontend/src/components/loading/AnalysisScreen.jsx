import { useState, useEffect } from "react";
import { Cpu, FileText, MessageSquare, Layers } from "lucide-react";

const DIMENSIONS = [
  { key: "technical_skills", name: "Technical Skills", icon: Cpu, color: "bg-blue-100 text-blue-600" },
  { key: "resume_quality", name: "Resume Quality", icon: FileText, color: "bg-purple-100 text-purple-600" },
  { key: "communication", name: "Communication", icon: MessageSquare, color: "bg-amber-100 text-amber-600" },
  { key: "portfolio", name: "Portfolio", icon: Layers, color: "bg-green-100 text-green-600" },
];

export default function AnalysisScreen() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const timers = DIMENSIONS.map((_, i) =>
      setTimeout(() => setVisibleCount(i + 1), (i + 1) * 2000)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2 font-display">
        Building your readiness profile...
      </h2>
      <p className="text-sm text-gray-400 text-center mb-10">
        Evaluating 4 dimensions of interview readiness
      </p>

      <div className="w-full max-w-lg space-y-4">
        {DIMENSIONS.map((dim, i) => {
          const visible = i < visibleCount;
          const active = i === visibleCount - 1;
          const Icon = dim.icon;

          return (
            <div
              key={dim.key}
              className={`flex items-center gap-4 w-full bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100 transition-all duration-400
                ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${dim.color}
                ${active ? "ring-2 ring-brand-300 animate-pulse" : ""}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{dim.name}</p>
                <div className="h-1.5 rounded-full bg-gray-100 mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-400 transition-all duration-1000 ease-out"
                    style={{ width: visible ? `${50 + i * 8}%` : "0%" }}
                  />
                </div>
              </div>
              <span className="text-lg font-bold text-gray-700 font-mono tabular-nums min-w-[2.5rem] text-right">
                {visible ? "..." : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
