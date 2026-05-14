import { getScoreBand } from "../../utils/scoreBands";

export default function ScoreBandPill({ score }) {
  const band = getScoreBand(score);

  return (
    <div className={`rounded-full px-6 py-2.5 inline-flex items-center gap-2 ${band.bg} ${band.border} border`}>
      <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: band.fill }} />
      <span className={`text-sm font-medium ${band.text}`}>
        {band.label} — {band.message}
      </span>
    </div>
  );
}
