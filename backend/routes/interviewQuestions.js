import { Router } from "express";
import { validateSession, enforceLimit, recordUse } from "../middleware/rateLimiter.js";
import { generateQuestions } from "../services/aiService.js";

const router = Router();

export const TOPICS = [
  "React",
  "JavaScript",
  "Node.js",
  "HTML/CSS",
  "DBMS",
  "Operating Systems",
  "Data Structures",
  "Computer Networks",
];
export const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const MAX_PREVIOUS = 15; // only the most recent questions are sent to the AI
const MAX_QUESTION_LENGTH = 300;

// POST /api/interview-questions   body: { topic, difficulty, previousQuestions: [] }
router.post("/", validateSession, enforceLimit, async (req, res, next) => {
  try {
    const body = req.body || {};
    const topic = typeof body.topic === "string" ? body.topic.trim() : "";
    const difficulty = typeof body.difficulty === "string" ? body.difficulty.trim() : "";

    if (!TOPICS.includes(topic)) {
      return res.status(400).json({ error: "Please choose a valid topic." });
    }
    if (!DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({ error: "Please choose a valid difficulty." });
    }

    // previousQuestions is optional, but if present it must be an array of strings
    let previousQuestions = [];
    if (body.previousQuestions !== undefined) {
      if (!Array.isArray(body.previousQuestions)) {
        return res.status(400).json({ error: "previousQuestions must be a list." });
      }
      previousQuestions = body.previousQuestions
        .filter((q) => typeof q === "string" && q.trim())
        .map((q) => q.trim().slice(0, MAX_QUESTION_LENGTH))
        .slice(-MAX_PREVIOUS);
    }

    const result = await generateQuestions({ topic, difficulty, previousQuestions });

    // Count the request only now, because the AI call succeeded
    const remaining = recordUse(req.sessionId);
    res.json({ ...result, remaining });
  } catch (err) {
    next(err);
  }
});

export default router;
