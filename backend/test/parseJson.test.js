import { test } from "node:test";
import assert from "node:assert/strict";
import {
  stripFences,
  extractFirstJsonObject,
  parseAiJson,
  validateBulletResult,
  validateQuestionsResult,
  validateAnswerResult,
} from "../utils/parseJson.js";

const bullet = {
  originalScore: 3,
  suggestions: [
    { text: "Built A", why: "Strong verb", score: 8 },
    { text: "Built B", why: "Has a metric", score: 9 },
    { text: "Built C", why: "Names the tech", score: 7 },
  ],
};

const questions = {
  questions: [1, 2, 3, 4, 5].map((i) => ({ question: `Q${i}`, hint: `H${i}` })),
};

test("stripFences removes ```json fences", () => {
  assert.equal(stripFences('```json\n{"a":1}\n```'), '{"a":1}');
});

test("extractFirstJsonObject ignores text around the object", () => {
  assert.equal(extractFirstJsonObject('Sure! {"a":1} hope it helps'), '{"a":1}');
});

test("extractFirstJsonObject is not fooled by braces inside strings", () => {
  const text = '{"text":"use { and } carefully","n":2}';
  assert.equal(extractFirstJsonObject(text), text);
});

test("extractFirstJsonObject handles nested objects and escaped quotes", () => {
  const text = '{"a":{"b":"say \\"hi\\""},"c":[1,2]}';
  assert.equal(extractFirstJsonObject(text), text);
});

test("extractFirstJsonObject returns null when there is no object or it is cut off", () => {
  assert.equal(extractFirstJsonObject("no json here"), null);
  assert.equal(extractFirstJsonObject('{"a": 1'), null);
});

test("parseAiJson parses fenced answers with extra words", () => {
  const raw = "Here you go:\n```json\n" + JSON.stringify(bullet) + "\n```\nGood luck!";
  assert.deepEqual(parseAiJson(raw), bullet);
});

test("parseAiJson throws on empty, non-string and broken answers", () => {
  assert.throws(() => parseAiJson(""), /empty/);
  assert.throws(() => parseAiJson(undefined), /empty/);
  assert.throws(() => parseAiJson("just words"), /No JSON/);
  assert.throws(() => parseAiJson('{"a": 1,}'), /not valid JSON/);
});

test("validateBulletResult accepts a good answer", () => {
  const result = validateBulletResult(bullet);
  assert.equal(result.originalScore, 3);
  assert.equal(result.suggestions.length, 3);
});

test("validateBulletResult clamps scores to 1-10 and rounds them", () => {
  const messy = structuredClone(bullet);
  messy.originalScore = 0;
  messy.suggestions[0].score = 15;
  messy.suggestions[1].score = 8.6;
  const result = validateBulletResult(messy);
  assert.equal(result.originalScore, 1);
  assert.equal(result.suggestions[0].score, 10);
  assert.equal(result.suggestions[1].score, 9);
});

test("validateBulletResult trims text", () => {
  const spaced = structuredClone(bullet);
  spaced.suggestions[0].text = "   Built A   ";
  assert.equal(validateBulletResult(spaced).suggestions[0].text, "Built A");
});

test("validateBulletResult rejects the wrong number of suggestions", () => {
  assert.throws(() => validateBulletResult({ ...bullet, suggestions: bullet.suggestions.slice(0, 2) }), /exactly 3/);
  assert.throws(() => validateBulletResult({}), /exactly 3/);
  assert.throws(() => validateBulletResult(null), /exactly 3/);
});

test("validateBulletResult rejects empty text or a missing score", () => {
  const noText = structuredClone(bullet);
  noText.suggestions[1].text = "  ";
  assert.throws(() => validateBulletResult(noText), /non-empty string/);

  const noScore = structuredClone(bullet);
  delete noScore.suggestions[2].score;
  assert.throws(() => validateBulletResult(noScore), /must be a number/);
});

test("validateQuestionsResult needs exactly 5 questions with hints", () => {
  assert.equal(validateQuestionsResult(questions).questions.length, 5);
  assert.throws(() => validateQuestionsResult({ questions: questions.questions.slice(0, 4) }), /exactly 5/);

  const noHint = structuredClone(questions);
  noHint.questions[0].hint = "";
  assert.throws(() => validateQuestionsResult(noHint), /non-empty string/);
});

test("validateAnswerResult accepts an empty strengths list but needs improvements", () => {
  const good = { score: 4, verdict: "Needs work", strengths: [], improvements: ["Add an example"], modelAnswer: "A closure is..." };
  assert.equal(validateAnswerResult(good).strengths.length, 0);

  assert.throws(() => validateAnswerResult({ ...good, improvements: [] }), /1 to 5 items/);
  assert.throws(() => validateAnswerResult({ ...good, modelAnswer: "" }), /non-empty string/);
});
