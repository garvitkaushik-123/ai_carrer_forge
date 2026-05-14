import { useState } from "react";
import { ChevronDown, CheckCircle, ArrowUpCircle, BookOpen, Cpu, FileText, MessageSquare, Layers } from "lucide-react";
import { getScoreBand } from "../../utils/scoreBands";
import useIntersectionObserver from "../../hooks/useIntersectionObserver";

const ICONS = {
  technical_skills: { icon: Cpu, color: "bg-blue-100 text-blue-600" },
  resume_quality: { icon: FileText, color: "bg-purple-100 text-purple-600" },
  communication: { icon: MessageSquare, color: "bg-amber-100 text-amber-600" },
  portfolio: { icon: Layers, color: "bg-green-100 text-green-600" },
};

const LABELS = {
  technical_skills: "Technical Skills",
  resume_quality: "Resume Quality",
  communication: "Communication",
  portfolio: "Portfolio",
};

export default function DimensionCard({ dimension, delay = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const [ref, isVisible] = useIntersectionObserver();
  const band = getScoreBand(dimension.score);
  const iconInfo = ICONS[dimension.dimension] || ICONS.technical_skills;
  const Icon = iconInfo.icon;

  return (
    <div
      ref={ref}
      onClick={() => setExpanded(!expanded)}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconInfo.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-base font-semibold text-gray-900">
              {LABELS[dimension.dimension] || dimension.dimension}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold font-mono px-3 py-1 rounded-lg ${band.bg} ${band.text}`}>
              {dimension.score}
            </span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          </div>
        </div>

        <div className="h-1.5 rounded-full bg-gray-100 mt-4 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: isVisible ? `${dimension.score}%` : "0%",
              backgroundColor: band.fill,
              transitionDelay: `${delay}ms`,
            }}
          />
        </div>

        {!expanded && dimension.strengths?.[0] && (
          <p className="text-sm text-gray-400 mt-3 truncate">{dimension.strengths[0]}</p>
        )}
      </div>

      <div className={`overflow-hidden transition-all duration-400 ${expanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          {dimension.strengths?.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-green-600">Strengths</span>
              </div>
              {dimension.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 flex-shrink-0" />
                  <p className="text-sm text-gray-700 leading-relaxed">{s}</p>
                </div>
              ))}
            </div>
          )}

          {dimension.improvements?.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpCircle className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-orange-600">Areas to Improve</span>
              </div>
              {dimension.improvements.map((s, i) => (
                <div key={i} className="flex items-start gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 flex-shrink-0" />
                  <p className="text-sm text-gray-700 leading-relaxed">{s}</p>
                </div>
              ))}
            </div>
          )}

          {dimension.resources?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-brand-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">Recommended Resources</span>
              </div>
              {dimension.resources.map((r, i) => (
                <p key={i} className="text-sm text-brand-600 mb-2">{r}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
