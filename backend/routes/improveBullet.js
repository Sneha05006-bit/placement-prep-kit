import { Router } from "express";
import { validateSession, enforceLimit, recordUse } from "../middleware/rateLimiter.js";
import { improveBullet } from "../services/aiService.js";

const router = Router();

const ROLES = ["Frontend Developer", "Backend Developer", "Full-Stack Developer", "Data Analyst"];
const TONES = ["Concise", "Impactful", "Technical"];
const MAX_LENGTH = 300;

// POST /api/improve-bullet   body: { original, role, tone }
router.post("/", validateSession, enforceLimit, async (req, res, next) => {
  try {
    const body = req.body || {};
    const original = typeof body.original === "string" ? body.original.trim() : "";
    const role = typeof body.role === "string" ? body.role.trim() : "";
    const tone = typeof body.tone === "string" ? body.tone.trim() : "";

    if (!original) {
      return res.status(400).json({ error: "Please enter a resume bullet point." });
    }
    if (original.length > MAX_LENGTH) {
      return res
        .status(400)
        .json({ error: `The bullet must be at most ${MAX_LENGTH} characters.` });
    }
    if (!ROLES.includes(role)) {
      return res.status(400).json({ error: "Please choose a valid target role." });
    }
    if (!TONES.includes(tone)) {
      return res.status(400).json({ error: "Please choose a valid tone." });
    }

    const result = await improveBullet({ original, role, tone });

    // Count the request only now, because the AI call succeeded
    const remaining = recordUse(req.sessionId);
    res.json({ ...result, remaining });
  } catch (err) {
    next(err);
  }
});

export default router;
