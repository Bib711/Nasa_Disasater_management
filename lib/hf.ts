export async function classifyPriority(text: string) {
  const token = process.env.HF_API_TOKEN
  if (!token) {
    return { label: "medium", score: 0, raw: null, note: "HF_API_TOKEN missing" }
  }
  const resp = await fetch("https://api-inference.huggingface.co/models/facebook/bart-large-mnli", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: text,
      parameters: { candidate_labels: ["high priority", "medium priority", "low priority"] },
    }),
    // HF often streams; keep it simple
    cache: "no-store",
  })
  const data = await resp.json()
  const labels: string[] = data?.labels || []
  const scores: number[] = data?.scores || []
  const idx = scores?.length ? scores.indexOf(Math.max(...scores)) : 1
  const best = labels[idx] || "medium priority"
  const label = best.includes("high") ? "high" : best.includes("low") ? "low" : "medium"
  return { label, score: scores[idx] || 0, raw: data }
}
