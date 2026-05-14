const BASE = `${import.meta.env.VITE_API_URL || "https://ai-carrer-forge-1.onrender.com"}/api`;

export async function uploadResume(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE}/upload-resume`, { method: "POST", body: formData });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function generateQuestions(sessionId) {
  const res = await fetch(`${BASE}/generate-questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!res.ok) throw new Error("Failed to generate questions");
  return res.json();
}

export async function submitAnswers(sessionId, answers) {
  const res = await fetch(`${BASE}/submit-answers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, answers }),
  });
  if (!res.ok) throw new Error("Failed to submit answers");
  return res.json();
}

export async function getResults(sessionId) {
  const res = await fetch(`${BASE}/results/${sessionId}`);
  if (!res.ok) throw new Error("Results not found");
  return res.json();
}
