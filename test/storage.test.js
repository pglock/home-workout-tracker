import test from "node:test";
import assert from "node:assert/strict";
import { createWorkoutStore } from "../src/storage.js";
import { completeSession, createSession } from "../src/workout.js";

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

test("store restores an active workout and archives completed workouts", () => {
  const storage = memoryStorage();
  const store = createWorkoutStore(storage);
  const active = createSession("one", "2026-09-12T08:00:00.000Z");
  const completed = completeSession(active, "2026-09-12T08:20:00.000Z");

  store.saveActive(active);
  assert.deepEqual(createWorkoutStore(storage).loadActive(), active);

  store.archive(completed);
  assert.equal(store.loadActive(), null);
  assert.deepEqual(store.loadHistory(), [completed]);
});

test("store treats malformed browser data as empty", () => {
  const store = createWorkoutStore(
    memoryStorage({ "workout.active": "broken", "workout.history": "{}" }),
  );

  assert.equal(store.loadActive(), null);
  assert.deepEqual(store.loadHistory(), []);
});

test("store discards structurally invalid active sessions", () => {
  const malformedSessions = [
    {},
    { id: "one", startedAt: "2026-09-12T08:00:00.000Z", completedAt: null },
    {
      ...createSession("one", "2026-09-12T08:00:00.000Z"),
      exercises: [{ id: "chair-squat", sets: [{}] }],
    },
  ];

  for (const session of malformedSessions) {
    const store = createWorkoutStore(
      memoryStorage({ "workout.active": JSON.stringify(session) }),
    );
    assert.equal(store.loadActive(), null);
  }
});

test("store keeps valid history sessions and discards malformed entries", () => {
  const completed = completeSession(
    createSession("valid", "2026-09-12T08:00:00.000Z"),
    "2026-09-12T08:20:00.000Z",
  );
  const malformedSets = {
    ...completed,
    id: "invalid",
    exercises: [{ id: "chair-squat", sets: "not-an-array" }],
  };
  const malformedSummary = { ...completed, id: "invalid-summary", summary: {} };
  const store = createWorkoutStore(
    memoryStorage({
      "workout.history": JSON.stringify([
        {},
        completed,
        malformedSets,
        malformedSummary,
        null,
      ]),
    }),
  );

  assert.deepEqual(store.loadHistory(), [completed]);
});
