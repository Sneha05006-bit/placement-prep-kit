// Safely turn the AI's text answer into a trusted JavaScript object.
// AI models sometimes add ```json fences or extra sentences, so we clean first.

// Remove ```json ... ``` fences
export function stripFences(text) {
  return text.replace(/```(?:json)?/gi, "").trim();
}

// Find the first complete { ... } block, ignoring braces inside strings
export function extractFirstJsonObject(text) {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null; // never closed: the answer was cut off
}

// Raw AI text -> object. Throws an Error if anything is wrong.
export function parseAiJson(raw) {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new Error("AI answer was empty");
  }
  const candidate = extractFirstJsonObject(stripFences(raw));
  if (!candidate) throw new Error("No JSON object found in AI answer");

  try {
    return JSON.parse(candidate);
  } catch {
    throw new Error("AI answer was not valid JSON");
  }
}

function cleanText(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} must be a non-empty string`);
  }
  return value.trim();
}

function cleanScore(value, name) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) throw new Error(`${name} must be a number`);
  return Math.min(10, Math.max(1, n)); // keep scores between 1 and 10
}

// Check the shape for /api/improve-bullet: 3 suggestions + original score
export function validateBulletResult(obj) {
  if (!obj || !Array.isArray(obj.suggestions) || obj.suggestions.length !== 3) {
    throw new Error("Expected exactly 3 suggestions");
  }
  return {
    originalScore: cleanScore(obj.originalScore, "originalScore"),
    suggestions: obj.suggestions.map((s, i) => ({
      text: cleanText(s?.text, `suggestions[${i}].text`),
      why: cleanText(s?.why, `suggestions[${i}].why`),
      score: cleanScore(s?.score, `suggestions[${i}].score`),
    })),
  };
}

// Check the shape for /api/interview-questions: exactly 5 questions
export function validateQuestionsResult(obj) {
  if (!obj || !Array.isArray(obj.questions) || obj.questions.length !== 5) {
    throw new Error("Expected exactly 5 questions");
  }
  return {
    questions: obj.questions.map((q, i) => ({
      question: cleanText(q?.question, `questions[${i}].question`),
      hint: cleanText(q?.hint, `questions[${i}].hint`),
    })),
  };
}

function cleanList(arr, name, min, max) {
  if (!Array.isArray(arr) || arr.length < min || arr.length > max) {
    throw new Error(`${name} must have ${min} to ${max} items`);
  }
  return arr.map((item, i) => cleanText(item, `${name}[${i}]`));
}

// Check the shape for /api/check-answer
export function validateAnswerResult(obj) {
  if (!obj || typeof obj !== "object") throw new Error("Expected an object");
  return {
    score: cleanScore(obj.score, "score"),
    verdict: cleanText(obj.verdict, "verdict"),
    strengths: cleanList(obj.strengths ?? [], "strengths", 0, 5),
    improvements: cleanList(obj.improvements, "improvements", 1, 5),
    modelAnswer: cleanText(obj.modelAnswer, "modelAnswer"),
  };
}
