import { Check } from "lucide-react";

const LETTERS = ["A", "B", "C", "D"];

export default function MCQOptions({ options, selected, onSelect }) {
  return (
    <div className="space-y-3">
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => onSelect(opt)}
          className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium text-base flex items-center gap-3 transition-all duration-150 cursor-pointer
            ${selected === opt
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-gray-200 bg-white text-gray-700 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
            }`}
        >
          <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0
            ${selected === opt ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500"}`}>
            {LETTERS[i]}
          </span>
          <span className="flex-1">{opt}</span>
          {selected === opt && <Check className="w-5 h-5 text-brand-500 ml-auto" />}
        </button>
      ))}
    </div>
  );
}
