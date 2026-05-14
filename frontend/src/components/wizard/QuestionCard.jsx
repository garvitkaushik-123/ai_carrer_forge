import MCQOptions from "./MCQOptions";
import ShortAnswerInput from "./ShortAnswerInput";

export default function QuestionCard({ question, answer, onAnswer, animClass }) {
  return (
    <div className={`bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-10 ${animClass}`}>
      <span className="bg-brand-50 text-brand-600 text-xs font-semibold px-3 py-1 rounded-full border border-brand-100 mb-4 inline-block">
        {question.category}
      </span>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-900 leading-snug mb-6 font-display">
        {question.question_text}
      </h2>

      {question.question_type === "mcq" && question.options ? (
        <MCQOptions options={question.options} selected={answer} onSelect={onAnswer} />
      ) : (
        <ShortAnswerInput value={answer || ""} onChange={onAnswer} hint={question.hint} />
      )}
    </div>
  );
}
