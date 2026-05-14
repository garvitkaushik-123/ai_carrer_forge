import { Lightbulb } from "lucide-react";

const MAX_CHARS = 500;

export default function ShortAnswerInput({ value, onChange, hint }) {
  const pct = (value.length / MAX_CHARS) * 100;

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS))}
        placeholder="Type your answer here..."
        className="w-full rounded-xl border-2 border-gray-200 p-4 text-base text-gray-800 placeholder-gray-400 leading-relaxed resize-none min-h-[120px] focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all duration-150"
      />
      <p className={`text-xs mt-1 text-right ${pct > 80 ? "text-orange-500" : "text-gray-400"}`}>
        {value.length} / {MAX_CHARS}
      </p>
      {hint && (
        <p className="text-sm text-gray-400 italic mt-2 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5" />
          {hint}
        </p>
      )}
    </div>
  );
}
