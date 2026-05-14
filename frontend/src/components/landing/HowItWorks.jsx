import { Upload, MessageSquare, BarChart3 } from "lucide-react";

const steps = [
  { icon: Upload, title: "Upload Resume", desc: "Drop your PDF or DOCX resume" },
  { icon: MessageSquare, title: "Answer 4 Questions", desc: "Quick adaptive questions about your profile" },
  { icon: BarChart3, title: "Get Your Score", desc: "Detailed breakdown with improvement plan" },
];

export default function HowItWorks() {
  return (
    <section className="py-16 px-6 md:px-12 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-4">
        {steps.map((s, i) => (
          <div key={s.title} className="flex md:flex-col items-center md:items-center gap-4 md:gap-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
              {i + 1}
            </div>
            <div className="md:text-center md:mt-3">
              <p className="font-semibold text-gray-900 text-base">{s.title}</p>
              <p className="text-sm text-gray-500 leading-relaxed mt-1">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
