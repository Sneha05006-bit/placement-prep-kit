import { test } from "node:test";
import assert from "node:assert/strict";

// Control the clock so we can test the daily reset without waiting
const RealDate = Date;
let fakeNow = new RealDate("2026-11-15T10:00:00+05:30").getTime();
globalThis.Date = class extends RealDate {
  constructor(...args) {
    args.length ? super(...args) : super(fakeNow);
  }
  static now() {
    return fakeNow;
  }
};
process.env.RESET_TIMEZONE = "Asia/Kolkata";

const { getUsage, recordUse, enforceLimit, validateSession, LIMIT } = await import(
  "../middleware/rateLimiter.js"
);

// A tiny fake of Express's res object
function fakeRes() {
  return {
    code: null,
    body: null,
    status(c) {
      this.code = c;
      return this;
    },
    json(b) {
      this.body = b;
      return this;
    },
  };
}

test("a new session has the full limit", () => {
  assert.deepEqual(getUsage("session-new-0001"), { used: 0, remaining: LIMIT, limit: LIMIT });
});

test("recordUse counts down the remaining requests", () => {
  const id = "session-count-001";
  assert.equal(recordUse(id), LIMIT - 1);
  assert.equal(recordUse(id), LIMIT - 2);
  assert.equal(getUsage(id).used, 2);
});

test("enforceLimit lets a request through until the limit is used", () => {
  const id = "session-block-001";
  let passed = false;
  enforceLimit({ sessionId: id }, fakeRes(), () => (passed = true));
  assert.equal(passed, true);

  for (let i = 0; i < LIMIT; i++) recordUse(id);
  const res = fakeRes();
  let nextCalled = false;
  enforceLimit({ sessionId: id }, res, () => (nextCalled = true));
  assert.equal(nextCalled, false);
  assert.equal(res.code, 429);
  assert.match(res.body.error, /for today/);
});

test("sessions are counted separately", () => {
  for (let i = 0; i < LIMIT; i++) recordUse("session-user-aaaa");
  assert.equal(getUsage("session-user-aaaa").remaining, 0);
  assert.equal(getUsage("session-user-bbbb").remaining, LIMIT);
});

test("the count resets on the next day (Asia/Kolkata)", () => {
  const id = "session-daily-001";
  for (let i = 0; i < LIMIT; i++) recordUse(id);
  assert.equal(getUsage(id).remaining, 0);

  fakeNow = new RealDate("2026-11-15T23:59:00+05:30").getTime();
  assert.equal(getUsage(id).remaining, 0, "still the same day at 23:59");

  fakeNow = new RealDate("2026-11-16T00:01:00+05:30").getTime();
  assert.equal(getUsage(id).remaining, LIMIT, "new day, fresh limit");
  assert.equal(recordUse(id), LIMIT - 1);
});

test("validateSession rejects a missing or malformed session id", () => {
  for (const header of [undefined, "short", "has spaces in it!!", "x".repeat(65)]) {
    const res = fakeRes();
    let nextCalled = false;
    validateSession({ get: () => header }, res, () => (nextCalled = true));
    assert.equal(nextCalled, false, `header ${header} should be rejected`);
    assert.equal(res.code, 400);
  }
});

test("validateSession accepts a UUID and stores it on the request", () => {
  const req = { get: () => "3f2b8c1e-9a4d-4e7b-8f60-1c2d3e4f5a6b" };
  let nextCalled = false;
  validateSession(req, fakeRes(), () => (nextCalled = true));
  assert.equal(nextCalled, true);
  assert.equal(req.sessionId, "3f2b8c1e-9a4d-4e7b-8f60-1c2d3e4f5a6b");
});
