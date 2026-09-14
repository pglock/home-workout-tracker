import test from "node:test";
import assert from "node:assert/strict";
import {
  WORKOUT,
  completeSession,
  createSession,
  getProgress,
  setReps,
  toggleSet,
} from "../src/workout.js";

test("createSession creates two editable sets for every poster exercise", () => {
  const session = createSession("session-1", "2026-09-12T08:00:00.000Z");

  assert.equal(WORKOUT.length, 6);
  assert.equal(session.exercises.length, 6);
  assert.deepEqual(
    session.exercises.map((exercise) => exercise.sets.length),
    [2, 2, 2, 2, 2, 2],
  );
  assert.equal(session.exercises[0].sets[0].reps, 8);
  assert.equal(session.exercises[5].sets[0].reps, 12);
  assert.equal(session.completedAt, null);
});

test("set controls update only the selected set without mutating the previous session", () => {
  const original = createSession("session-1", "2026-09-12T08:00:00.000Z");
  const withReps = setReps(original, "chair-squat", "chair-squat-1", 11);
  const completed = toggleSet(withReps, "chair-squat", "chair-squat-1");

  assert.equal(original.exercises[0].sets[0].reps, 8);
  assert.equal(original.exercises[0].sets[0].done, false);
  assert.equal(completed.exercises[0].sets[0].reps, 11);
  assert.equal(completed.exercises[0].sets[0].done, true);
  assert.equal(completed.exercises[0].sets[1].done, false);
});

test("setReps clamps rounded values to the 0 through 99 range", () => {
  const original = createSession("session-1", "2026-09-12T08:00:00.000Z");
  const values = [
    [-1, 0],
    [0, 0],
    [98.6, 99],
    [99, 99],
    [100, 99],
  ];

  for (const [input, expected] of values) {
    const updated = setReps(original, "chair-squat", "chair-squat-1", input);
    assert.equal(updated.exercises[0].sets[0].reps, expected);
  }
});

test("progress and completion summarize the checked sets", () => {
  let session = createSession("session-1", "2026-09-12T08:00:00.000Z");
  session = toggleSet(session, "chair-squat", "chair-squat-1");
  session = toggleSet(session, "one-arm-row", "one-arm-row-1");

  assert.deepEqual(getProgress(session), { done: 2, total: 12, percent: 17 });

  const completed = completeSession(session, "2026-09-12T08:20:00.000Z");
  assert.equal(completed.completedAt, "2026-09-12T08:20:00.000Z");
  assert.deepEqual(completed.summary, { done: 2, total: 12, percent: 17 });
});
