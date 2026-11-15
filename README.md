# AI Placement Prep Kit

A full-stack web app that helps students prepare for placement season, using generative AI.

<!-- Add after deployment: **Live demo:** https://YOUR-VERCEL-URL -->

## Features

1. **Resume Bullet Improver:** paste a weak resume bullet and get 3 stronger rewrites for a chosen role and tone. Each rewrite has a "Why this works" note and a strength score (1-10). The original and the best rewrite are compared side by side. Placeholders such as `[N users]` mark where the student must add real numbers.
2. **Interview Question Generator:** pick a topic and difficulty and get 5 questions with short hints. Questions can be marked "Got it" or "Revise later", and "Generate New Set" avoids repeating earlier questions.
3. **Answer Checker:** type an answer to an interview question and get a score, what was done well, what to add or fix, and a stronger answer.

Also included: a Home screen with a live before/after demo, a limit of 10 AI requests per day for each browser, history of the last 20 improved bullets, a revision list, light and dark themes, loading skeletons, friendly error messages, Ctrl+Enter to submit, and a responsive layout.

## Tech stack

| Part | Technology |
|---|---|
| Frontend | React (Vite), Bootstrap 5, plain `fetch` |
| Backend | Node.js, Express, cors, dotenv |
| AI | Google Gemini API (all AI calls are in `backend/services/aiService.js`) |
| Storage | No database. Usage counters live in server memory. History, theme and revision list live in the browser's localStorage. |
| Tests | Node's built-in test runner |

## Getting started

You need Node.js 18.11 or newer (`node -v`) and a free Gemini API key from [Google AI Studio](https://aistudio.google.com).

### 1. Backend

```bash
cd backend
npm install
```

Create a `.env` file from the example (`copy .env.example .env` on Windows, `cp .env.example .env` on Mac or Linux) and fill it in:

| Variable | Meaning |
|---|---|
| `AI_API_KEY` | Your Gemini API key |
| `AI_MODEL` | A current Gemini model name that is available on your plan. Check the [model list](https://ai.google.dev/gemini-api/docs/models) and the [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits). |
| `PORT` | Server port (default `5000`) |
| `FRONTEND_URL` | The one frontend address allowed by CORS (default `http://localhost:5173`) |
| `RESET_TIMEZONE` | Optional. Time zone for the daily limit reset (default `Asia/Kolkata`) |

```bash
npm run dev
```

The server prints `Server running on http://localhost:5000`. Check `http://localhost:5000/api/health`.

### 2. Frontend (second terminal)

```bash
cd frontend
npm install
```

Create `frontend/.env` from `.env.example`. It holds `VITE_API_URL`, the address of the backend (default `http://localhost:5000`).

```bash
npm run dev
```

Open `http://localhost:5173`.

> Never commit a `.env` file. `.gitignore` already excludes it, and the API key never reaches the browser.

### 3. Run the tests

```bash
cd backend
npm test
```

21 tests cover the AI-output parser (`utils/parseJson.js`) and the daily rate limiter (`middleware/rateLimiter.js`).

## API

All requests need a header `x-session-id` (a random UUID that the frontend creates once and keeps in localStorage).

| Method | Route | Body | Success response |
|---|---|---|---|
| GET | `/api/health` | - | `{ status, message }` |
| GET | `/api/usage` | - | `{ used, remaining, limit }` |
| POST | `/api/improve-bullet` | `{ original, role, tone }` | `{ originalScore, suggestions[3], remaining }` |
| POST | `/api/interview-questions` | `{ topic, difficulty, previousQuestions }` | `{ questions[5], remaining }` |
| POST | `/api/check-answer` | `{ topic, difficulty, question, answer }` | `{ score, verdict, strengths[], improvements[], modelAnswer, remaining }` |

Errors always look like `{ "error": "message" }` with status 400 (bad input), 429 (daily limit reached), 502 (AI failure) or 500 (other).

Example requests (PowerShell users: use `curl.exe`):

```bash
curl.exe -X POST http://localhost:5000/api/improve-bullet -H "Content-Type: application/json" -H "x-session-id: test-session-12345" -d "{\"original\":\"Made a website for college fest\",\"role\":\"Frontend Developer\",\"tone\":\"Impactful\"}"

curl.exe -X POST http://localhost:5000/api/interview-questions -H "Content-Type: application/json" -H "x-session-id: test-session-12345" -d "{\"topic\":\"React\",\"difficulty\":\"Beginner\",\"previousQuestions\":[]}"

curl.exe -X POST http://localhost:5000/api/check-answer -H "Content-Type: application/json" -H "x-session-id: test-session-12345" -d "{\"topic\":\"JavaScript\",\"difficulty\":\"Beginner\",\"question\":\"What is a closure?\",\"answer\":\"A function that remembers variables from where it was created.\"}"

curl.exe http://localhost:5000/api/usage -H "x-session-id: test-session-12345"
```

## Project structure

```
placement-prep-kit/
  backend/
    server.js                    start-up, CORS, routes, error handler
    routes/                      improveBullet.js, interviewQuestions.js, checkAnswer.js
    services/aiService.js        all AI calls: prompts, provider call, retry
    middleware/rateLimiter.js    session check and daily limit
    utils/parseJson.js           cleans and validates the AI's JSON answer
    test/                        automated tests
  frontend/
    src/
      App.jsx                    shared state: tabs, theme, history, usage
      api.js                     every network call and the session id
      hooks/                     useLocalStorage, useTypewriter
      components/                Navbar, Home, BulletImprover, SuggestionCard,
                                 InterviewGenerator, QuestionAccordion, RevisionList,
                                 AnswerChecker, ScoreBar, HistoryPanel, SkeletonCards,
                                 LoadingSpinner, Toast, ErrorAlert, Icon
      styles.css                 themes, cards and buttons on top of Bootstrap
```

## How it works

1. The browser creates a session UUID once and sends it as `x-session-id` with every request.
2. The frontend calls the Express API. The route checks the session and the daily limit, then validates and trims the input.
3. `aiService.js` sends a system prompt and the data to Gemini in JSON mode. The API key stays on the server.
4. `parseJson.js` strips code fences, extracts the first JSON object, parses it and checks its shape. If the answer is unusable, the AI is called once more, and after a second failure the user gets a 502 message.
5. A request is counted only after a successful AI answer, so failures never cost quota. The remaining count comes back with every response.

## Deployment

- **Backend (Render web service):** root directory `backend`, build command `npm install`, start command `npm start`, health check path `/api/health`. Set `AI_API_KEY`, `AI_MODEL` and `FRONTEND_URL` (the exact frontend address) as environment variables.
- **Frontend (Vercel):** root directory `frontend`, framework preset Vite. Set `VITE_API_URL` to the backend address.

Free Render services sleep after a period without traffic, so the first request after a break can be slow.

<!--
## Screenshots

| Home | Bullet Improver | Interview Questions | Mobile |
|---|---|---|---|
| ![Home](docs/home.png) | ![Bullet Improver](docs/bullets.png) | ![Interview Questions](docs/interview.png) | ![Mobile](docs/mobile.png) |
-->

## Limitations

- Usage counters are kept in server memory, so they reset when the server restarts. The limit belongs to the browser, so clearing browser data gives a fresh count. A production version would use accounts and a database or Redis.
- AI scores are the model's opinion, not an exact measurement, and every rewrite must be checked by the student for accuracy.
- Free-tier AI APIs have their own quotas and can be slow or busy.

## Future scope

User accounts with permanent history in a database, mock interviews with a timer, job-description matching for resume bullets, and resume file upload.
