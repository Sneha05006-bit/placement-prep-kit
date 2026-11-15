// Load variables from .env into process.env (must run before we read them)
import "dotenv/config";
import express from "express";
import cors from "cors";

import improveBulletRouter from "./routes/improveBullet.js";
import interviewQuestionsRouter from "./routes/interviewQuestions.js";
import checkAnswerRouter from "./routes/checkAnswer.js";
import { validateSession, getUsage } from "./middleware/rateLimiter.js";
import { ServiceError } from "./services/aiService.js";

const app = express();

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.disable("x-powered-by");

// CORS: only the frontend dev URL is allowed to call this API
app.use(cors({ origin: FRONTEND_URL }));

// Parse JSON request bodies (with a small size cap for safety)
app.use(express.json({ limit: "20kb" }));

// Health route: used to check that the server is alive
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Placement Prep Kit API is running" });
});

// Usage route: the frontend calls this on page load for "Requests left"
app.get("/api/usage", validateSession, (req, res) => {
  res.json(getUsage(req.sessionId));
});

// The three AI tools
app.use("/api/improve-bullet", improveBulletRouter);
app.use("/api/interview-questions", interviewQuestionsRouter);
app.use("/api/check-answer", checkAnswerRouter);

// 404 handler: any unknown URL ends up here
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Central error handler: errors always look like { error: "message" }
// (4 parameters is how Express recognises an error handler)
app.use((err, req, res, next) => {
  // Errors we threw on purpose (AI failure = 502, bad server config = 500)
  if (err instanceof ServiceError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Bad JSON sent by the client
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Request body is not valid JSON" });
  }
  if (err.type === "entity.too.large") {
    return res.status(400).json({ error: "Request body is too large" });
  }

  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
