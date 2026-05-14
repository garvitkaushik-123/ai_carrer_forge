import { useState, useRef } from "react";
import { Upload, CheckCircle } from "lucide-react";

export default function UploadZone({ onFileSelect, selectedFile }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  }

  function handleChange(e) {
    const file = e.target.files[0];
    if (file) onFileSelect(file);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group
        ${dragOver ? "border-brand-500 bg-brand-50 scale-[1.01]" : "border-brand-300 bg-brand-50/50 hover:bg-brand-50 hover:border-brand-500"}
        ${selectedFile ? "border-green-400 bg-green-50" : ""}`}
    >
      <input ref={inputRef} type="file" accept=".pdf,.docx" onChange={handleChange} className="hidden" />

      {selectedFile ? (
        <div className="flex flex-col items-center gap-2">
          <CheckCircle className="w-10 h-10 text-green-500" />
          <p className="text-green-700 font-semibold">{selectedFile.name}</p>
          <p className="text-green-600 text-sm">Resume uploaded successfully</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-10 h-10 text-brand-400 group-hover:text-brand-600 group-hover:-translate-y-1 transition-all" />
          <p className="text-gray-700 font-semibold mt-1">Drop your resume here</p>
          <p className="text-gray-400 text-sm">or click to browse</p>
          <p className="text-xs text-gray-400 mt-1">PDF or DOCX — max 5MB</p>
        </div>
      )}
    </div>
  );
}
