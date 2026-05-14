import { useEffect, useState } from "react";
import useCountUp from "../../hooks/useCountUp";
import { getScoreBand } from "../../utils/scoreBands";

export default function ScoreGauge({ score }) {
  const [animated, setAnimated] = useState(false);
  const count = useCountUp(score);
  const band = getScoreBand(score);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const radius = 80;
  const circumference = Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="220" height="130" viewBox="0 0 200 120">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#F3F4F6"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={band.fill}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        />
      </svg>
      <div className="text-center -mt-16">
        <span className={`text-7xl font-bold font-mono ${band.text}`}>{count}</span>
        <span className="text-xl text-gray-400 font-medium ml-1">/100</span>
      </div>
    </div>
  );
}
