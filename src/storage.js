import { WORKOUT } from "./workout.js";

const ACTIVE_KEY = "workout.active";
const HISTORY_KEY = "workout.history";

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isDateString(value) {
  return typeof value === "string" && value !== "" && !Number.isNaN(Date.parse(value));
}

function isSet(value, expectedId) {
  return (
    isRecord(value) &&
    value.id === expectedId &&
    Number.isInteger(value.reps) &&
    value.reps >= 0 &&
    value.reps <= 99 &&
    typeof value.done === "boolean"
  );
}

function hasValidExercises(exercises) {
  return (
    Array.isArray(exercises) &&
    exercises.length === WORKOUT.length &&
    exercises.every(
      (exercise, index) =>
        isRecord(exercise) &&
        exercise.id === WORKOUT[index].id &&
        Array.isArray(exercise.sets) &&
        exercise.sets.length === 2 &&
        exercise.sets.every((set, setIndex) =>
          isSet(set, `${exercise.id}-${setIndex + 1}`),
        ),
    )
  );
}

function isSummary(value) {
  return (
    isRecord(value) &&
    Number.isInteger(value.done) &&
    Number.isInteger(value.total) &&
    Number.isInteger(value.percent) &&
    value.done >= 0 &&
    value.total >= value.done &&
    value.percent >= 0 &&
    value.percent <= 100
  );
}

function isSession(value, completed) {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id !== "" &&
    isDateString(value.startedAt) &&
    (completed ? isDateString(value.completedAt) : value.completedAt === null) &&
    hasValidExercises(value.exercises) &&
    (value.summary === undefined || isSummary(value.summary))
  );
}

export function createWorkoutStore(storage) {
  return {
    loadActive() {
      const value = parseJson(storage.getItem(ACTIVE_KEY), null);
      return isSession(value, false) ? value : null;
    },

    saveActive(session) {
      storage.setItem(ACTIVE_KEY, JSON.stringify(session));
    },

    loadHistory() {
      const value = parseJson(storage.getItem(HISTORY_KEY), []);
      return Array.isArray(value)
        ? value.filter((session) => isSession(session, true))
        : [];
    },

    archive(session) {
      const history = this.loadHistory();
      storage.setItem(HISTORY_KEY, JSON.stringify([session, ...history]));
      storage.removeItem(ACTIVE_KEY);
    },
  };
}
