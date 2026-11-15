// In-memory rate limiter: max 10 successful AI requests per session PER DAY.
// "Session" = the UUID the frontend creates once and sends in x-session-id.
// The count resets automatically at midnight (default time zone: Asia/Kolkata).
// Counters live in memory, so they also reset when the server restarts.

export const LIMIT = 10;

const SESSION_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

// sessionId -> { count, day }   (day looks like "2026-11-07")
const sessions = new Map();

// Today's date in the reset time zone. When this text changes, a new day has started.
// Change the zone with RESET_TIMEZONE in .env (for example "UTC" or "America/New_York").
function today() {
  const timeZone = process.env.RESET_TIMEZONE || "Asia/Kolkata";
  try {
    return new Date().toLocaleDateString("en-CA", { timeZone }); // en-CA gives YYYY-MM-DD
  } catch {
    return new Date().toLocaleDateString("en-CA"); // unknown zone name: use the server's own zone
  }
}

// Every hour, forget sessions from earlier days so memory cannot grow forever
setInterval(() => {
  const day = today();
  for (const [id, entry] of sessions) {
    if (entry.day !== day) sessions.delete(id);
  }
}, 60 * 60 * 1000).unref();

// How many requests this session has used TODAY
function usedToday(sessionId) {
  const entry = sessions.get(sessionId);
  return entry && entry.day === today() ? entry.count : 0;
}

export function getUsage(sessionId) {
  const used = usedToday(sessionId);
  return { used, remaining: Math.max(0, LIMIT - used), limit: LIMIT };
}

// Step 1: make sure a usable session id was sent
export function validateSession(req, res, next) {
  const id = req.get("x-session-id");
  if (!id || !SESSION_ID_PATTERN.test(id)) {
    return res
      .status(400)
      .json({ error: "Missing or invalid x-session-id header" });
  }
  req.sessionId = id;
  next();
}

// Step 2: block the request if the session has no requests left today
export function enforceLimit(req, res, next) {
  if (getUsage(req.sessionId).remaining <= 0) {
    return res.status(429).json({
      error: `You have used all ${LIMIT} AI requests for today. Your limit resets at midnight, so please come back tomorrow.`,
    });
  }
  next();
}

// Step 3: called by the routes ONLY after a successful AI response.
// Returns how many requests are left today.
export function recordUse(sessionId) {
  const day = today();
  let entry = sessions.get(sessionId);
  if (!entry || entry.day !== day) entry = { count: 0, day }; // new day = fresh count
  entry.count += 1;
  sessions.set(sessionId, entry);
  return Math.max(0, LIMIT - entry.count);
}