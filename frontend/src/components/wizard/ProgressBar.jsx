export default function ProgressBar({ current, total }) {
  const pct = ((current + 1) / total) * 100;

  return (
    <div className="w-full mb-8">
      <p className="text-sm text-gray-400 font-medium mb-2 text-right">
        Question {current + 1} of {total}
      </p>
      <div className="h-2 rounded-full bg-gray-100 w-full">
        <div
          className="h-2 rounded-full bg-brand-500 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < current ? "bg-brand-500" : i === current ? "bg-brand-400 ring-2 ring-brand-200" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
