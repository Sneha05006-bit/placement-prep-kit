# AI Placement Prep Kit

A web app for placement season with two AI tools:

1. **Resume Bullet Improver**: paste a weak bullet and get 3 stronger rewrites, a "Why this works" note for each, and strength scores (1-10).
2. **Interview Question Generator**: pick a topic and difficulty and get 5 questions with short hints. "Generate New Set" avoids repeating earlier questions.

Extras: 10-request limit per session, history of the last 20 improved bullets, dark/light mode, loading and error states, responsive layout.

**Tech:** React (Vite) + Bootstrap 5 on the frontend, Node.js + Express on the backend, Google Gemini API for the AI. No database.

---

## Setup

You need Node.js 18.11 or newer (`node -v`) and a free Gemini API key from https://aistudio.google.com ("Get API key").

### 1. Backend

```bash
cd backend
npm install
copy .env.example .env      # Windows PowerShell / CMD
# cp .env.example .env      # Mac / Linux
```

Open `backend/.env` and set:

```
AI_API_KEY=your real key
AI_MODEL=a current Gemini flash model name
```

Model names change. Check https://ai.google.dev/gemini-api/docs/models for current names and https://ai.google.dev/gemini-api/docs/rate-limits to confirm the model is on the free tier. If a request fails, the backend terminal prints the real reason (wrong model name, bad key, quota).

```bash
npm run dev
```

You should see `Server running on http://localhost:5000`. Test: http://localhost:5000/api/health

### 2. Frontend (second terminal)

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open http://localhost:5173

> Never commit `.env` and never paste your API key into chat or code. `.gitignore` already excludes it.

---

## Testing the API with curl

Use PowerShell's `curl.exe` (plain `curl` is an alias there) or Git Bash.

```bash
curl.exe -X POST http://localhost:5000/api/improve-bullet -H "Content-Type: application/json" -H "x-session-id: test-session-12345" -d "{\"original\":\"Made a website for college fest\",\"role\":\"Frontend Developer\",\"tone\":\"Impactful\"}"

curl.exe -X POST http://localhost:5000/api/interview-questions -H "Content-Type: application/json" -H "x-session-id: test-session-12345" -d "{\"topic\":\"React\",\"difficulty\":\"Beginner\",\"previousQuestions\":[]}"

curl.exe http://localhost:5000/api/usage -H "x-session-id: test-session-12345"
```

## API

| Method | Route | Body | Success response |
|---|---|---|---|
| GET | `/api/health` | - | `{ status, message }` |
| GET | `/api/usage` | - | `{ used, remaining, limit }` |
| POST | `/api/improve-bullet` | `{ original, role, tone }` | `{ originalScore, suggestions[3], remaining }` |
| POST | `/api/interview-questions` | `{ topic, difficulty, previousQuestions }` | `{ questions[5], remaining }` |

All requests need the header `x-session-id`. Errors are always `{ "error": "message" }` with status 400 (bad input), 429 (limit reached), 502 (AI failure) or 500 (other).

## Folder structure

```
placement-prep-kit/
  backend/
    server.js                  start-up, CORS, routes, error handler
    routes/improveBullet.js    validate -> AI -> count -> respond
    routes/interviewQuestions.js
    services/aiService.js      ALL AI calls (prompts, provider, retry)
    middleware/rateLimiter.js  in-memory session counters
    utils/parseJson.js         clean + validate the AI's JSON
  frontend/src/
    App.jsx                    page state: tabs, theme, history, usage
    api.js                     every fetch call + session id
    hooks/useLocalStorage.js
    components/                Navbar, BulletImprover, SuggestionCard,
                               InterviewGenerator, QuestionAccordion,
                               HistoryPanel, LoadingSpinner, ErrorAlert
    styles.css                 accent colour, cards, dark-mode tweaks
```

## How it works

1. On first visit the browser creates a UUID and stores it in localStorage. It is sent as `x-session-id` with every request.
2. When you click **Improve**, `BulletImprover` calls `api.js`, which calls `POST /api/improve-bullet`.
3. The route checks the session id and the limit, then validates and trims the input (400 if bad).
4. `aiService.js` sends a system prompt and your data to Gemini in JSON mode. The API key stays on the server.
5. `parseJson.js` strips code fences, extracts the first JSON object, parses it and checks the shape (3 suggestions or exactly 5 questions). If anything fails, the AI is called once more. If it fails again the user gets a 502 message.
6. Only after a good answer does `recordUse` add 1 to the session's counter, so failures never cost quota. The new `remaining` value comes back in the response and the navbar badge updates.
7. History and theme are kept in localStorage via the `useLocalStorage` hook.

## Screenshots

_Add your screenshots here before the evaluation._

| Bullet Improver | Interview Questions | Dark mode | Mobile |
|---|---|---|---|
| `docs/bullets.png` | `docs/interview.png` | `docs/dark.png` | `docs/mobile.png` |

## Limitations (good to mention in a viva)

- Rate-limit counters are in memory: they reset when the server restarts, and a user can reset their own limit by clearing localStorage. A real product would use accounts and Redis or a database.
- AI scores are the model's opinion, not an exact measurement.
- Free-tier AI APIs have their own limits and can be slow or busy.

---

## 10 likely viva questions

**1. Why do you have a backend instead of calling the AI from React?**
An API key placed in frontend code can be read by anyone through the browser's dev tools. The backend keeps the key in `.env` and the browser only talks to my API.

**2. Why is all AI code in one file?**
`aiService.js` is the only file that knows which provider, endpoint and prompt format we use. To switch from Gemini to Groq I only change `callModel()` there; routes and frontend stay the same.

**3. How do you stop the AI from breaking your app with bad output?**
Three layers: I request JSON mode and tell the model to return only JSON; `parseJson.js` strips fences and extracts the JSON object; then I validate the shape and clamp scores. If it still fails, I retry once, then return a friendly 502.

**4. How does the rate limiter work?**
The browser sends a UUID in `x-session-id`. The backend keeps a `Map` of sessionId to count. Middleware blocks with 429 when the count reaches 10. The count is incremented only after a successful AI response.

**5. Why count only successful requests?**
If the AI fails because of a provider problem, the user did nothing wrong, so it should not use up their quota.

**6. How do you prevent fake numbers in resume bullets?**
The system prompt forbids inventing metrics and tells the AI to use placeholders like `[X%]`. The UI also shows a note asking the student to replace placeholders with real numbers.

**7. What does CORS do and how did you configure it?**
Browsers block a page on one origin from calling an API on another unless the API allows it. I allow only the frontend's URL (`http://localhost:5173`), not every website.

**8. How does "Generate New Set" avoid repeats?**
The frontend remembers the questions already shown for the current topic and difficulty, and sends them as `previousQuestions`. The prompt tells the AI to avoid them. The backend keeps only the latest 15.

**9. How are theme and history stored?**
In localStorage through my `useLocalStorage` hook, which works like `useState` but reads the saved value on load and saves on every change. The theme is applied with Bootstrap's `data-bs-theme` attribute on `<html>`.

**10. What are the weaknesses of your project and how would you improve it?**
In-memory counters reset on restart and can be bypassed by clearing localStorage; there is no login. I would add authentication, store usage in a database or Redis, add automated tests, and deploy the backend and frontend with environment variables.
