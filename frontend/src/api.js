// Every network call lives in this file.
const BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const SESSION_KEY = "ppk_session_id";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status; // 0 = network error
  }
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  // Fallback for very old browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

let memoryId = null; // used only if localStorage is blocked

// Create the session id once, then reuse it forever
export function getSessionId() {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = makeId();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    memoryId = memoryId || makeId();
    return memoryId;
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", "x-session-id": getSessionId() },
    });
  } catch {
    throw new ApiError(
      "Can't reach the server. Check your internet connection and that the backend is running.",
      0
    );
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // response had no JSON body
  }

  if (!res.ok) {
    throw new ApiError(data?.error || "Something went wrong. Please try again.", res.status);
  }
  return data;
}

export const getUsage = () => request("/api/usage");

export const improveBullet = ({ original, role, tone }) =>
  request("/api/improve-bullet", {
    method: "POST",
    body: JSON.stringify({ original, role, tone }),
  });

export const generateQuestions = ({ topic, difficulty, previousQuestions }) =>
  request("/api/interview-questions", {
    method: "POST",
    body: JSON.stringify({ topic, difficulty, previousQuestions }),
  });

export const checkAnswer = ({ topic, difficulty, question, answer }) =>
  request("/api/check-answer", {
    method: "POST",
    body: JSON.stringify({ topic, difficulty, question, answer }),
  });
