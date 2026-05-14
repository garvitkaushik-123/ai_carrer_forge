const SCORE_BANDS = [
  { min: 80, max: 100, label: "Interview Ready", color: "green",
    bg: "bg-green-100", border: "border-green-400", text: "text-green-700", fill: "#22C55E",
    message: "You're well-prepared. Fine-tune these areas." },
  { min: 60, max: 79, label: "Almost There", color: "yellow",
    bg: "bg-yellow-100", border: "border-yellow-400", text: "text-yellow-700", fill: "#EAB308",
    message: "Solid foundation, but these gaps could cost you." },
  { min: 40, max: 59, label: "Needs Work", color: "orange",
    bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-700", fill: "#F97316",
    message: "Significant gaps to address before interviewing." },
  { min: 0, max: 39, label: "Not Ready", color: "red",
    bg: "bg-red-100", border: "border-red-400", text: "text-red-700", fill: "#EF4444",
    message: "Focus on building fundamentals first." },
];

export function getScoreBand(score) {
  return SCORE_BANDS.find(b => score >= b.min && score <= b.max) || SCORE_BANDS[3];
}
