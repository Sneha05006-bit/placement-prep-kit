import { Router } from "express";
import { validateSession, enforceLimit, recordUse } from "../middleware/rateLimiter.js";
import { checkAnswer } from "../services/aiService.js";
import { TOPICS, DIFFICULTIES } from "./interviewQuestions.js";

const router = Router();

const MAX_QUESTION = 300;
const MAX_ANSWER = 1000;

// POST /api/check-answer   body: { topic, difficulty, question, answer }
router.post("/", validateSession, enforceLimit, async (req, res, next) => {
  try {
    const body = req.body || {};
    const topic = typeof body.topic === "string" ? body.topic.trim() : "";
    const difficulty = typeof body.difficulty === "string" ? body.difficulty.trim() : "";
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";

    if (!TOPICS.includes(topic)) {
      return res.status(400).json({ error: "Please choose a valid topic." });
    }
    if (!DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({ error: "Please choose a valid difficulty." });
    }
    if (!question) {
      return res.status(400).json({ error: "Please enter the interview question." });
    }
    if (question.length > MAX_QUESTION) {
      return res.status(400).json({ error: `The question must be at most ${MAX_QUESTION} characters.` });
    }
    if (!answer) {
      return res.status(400).json({ error: "Please write your answer first." });
    }
    if (answer.length > MAX_ANSWER) {
      return res.status(400).json({ error: `The answer must be at most ${MAX_ANSWER} characters.` });
    }

    const result = await checkAnswer({ topic, difficulty, question, answer });

    // Count the request only now, because the AI call succeeded
    const remaining = recordUse(req.sessionId);
    res.json({ ...result, remaining });
  } catch (err) {
    next(err);
  }
});

export default router;
