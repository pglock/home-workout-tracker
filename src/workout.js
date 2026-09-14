export const WORKOUT = [
  {
    id: "chair-squat",
    name: "Kniebeuge zum Stuhl",
    reps: { min: 8, max: 12, unit: "Wiederholungen" },
    cue: "Kontrolliert hinsetzen, wieder aufstehen.",
    progression: "Ohne Gewicht → Hantel seitlich halten → Gewicht erhöhen",
    note: "Der Stuhl darf bleiben. Freie Kniebeugen sind optional.",
  },
  {
    id: "one-arm-row",
    name: "Einarmiges Rudern",
    reps: { min: 8, max: 12, unit: "je Seite" },
    cue: "Hantel zur Hüfte ziehen, Rücken ruhig halten.",
    progression: "Erst Wiederholungen, dann Gewicht erhöhen",
  },
  {
    id: "romanian-deadlift",
    name: "Rumänisches Kreuzheben",
    reps: { min: 8, max: 12, unit: "Wiederholungen" },
    cue: "Po nach hinten, Hanteln nah an den Beinen.",
    progression: "Erst Wiederholungen, dann Gewicht erhöhen",
    note: "Nur so tief, wie der Rücken stabil bleibt.",
  },
  {
    id: "incline-pushup",
    name: "Erhöhte Liegestütze",
    reps: { min: 6, max: 12, unit: "Wiederholungen" },
    cue: "Körper gerade, Brust zur Kante bewegen.",
    progression: "Hohe Auflage → niedrigere stabile Auflage → Boden",
  },
  {
    id: "heel-tap",
    name: "Fersentippen in Rückenlage",
    reps: { min: 6, max: 8, unit: "je Seite" },
    cue: "Abwechselnd eine Ferse absenken, Rücken ruhig halten.",
    progression: "Bein weiter ausstrecken → gegenüberliegenden Arm dazunehmen",
    note: "Kein Hohlkreuz. Armbewegung nur bei schmerzfreier Schulter.",
  },
  {
    id: "calf-raise",
    name: "Wadenheben",
    reps: { min: 12, max: 15, unit: "Wiederholungen" },
    cue: "Fersen anheben und langsam absenken.",
    progression: "Beidbeinig → einbeinig → einbeinig mit Hantel",
    note: "Zum Stabilisieren weiter festhalten.",
  },
];

export function createSession(id, startedAt = new Date().toISOString()) {
  return {
    id,
    startedAt,
    completedAt: null,
    exercises: WORKOUT.map((exercise) => ({
      id: exercise.id,
      sets: [1, 2].map((number) => ({
        id: `${exercise.id}-${number}`,
        reps: exercise.reps.min,
        done: false,
      })),
    })),
  };
}

function updateSet(session, exerciseId, setId, update) {
  return {
    ...session,
    exercises: session.exercises.map((exercise) =>
      exercise.id !== exerciseId
        ? exercise
        : {
            ...exercise,
            sets: exercise.sets.map((set) =>
              set.id === setId ? update(set) : set,
            ),
          },
    ),
  };
}

export function setReps(session, exerciseId, setId, reps) {
  const normalizedReps = Math.min(99, Math.max(0, Math.round(Number(reps) || 0)));
  return updateSet(session, exerciseId, setId, (set) => ({
    ...set,
    reps: normalizedReps,
  }));
}

export function toggleSet(session, exerciseId, setId) {
  return updateSet(session, exerciseId, setId, (set) => ({
    ...set,
    done: !set.done,
  }));
}

export function getProgress(session) {
  const sets = session.exercises.flatMap((exercise) => exercise.sets);
  const done = sets.filter((set) => set.done).length;
  const total = sets.length;
  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}

export function completeSession(session, completedAt = new Date().toISOString()) {
  return {
    ...session,
    completedAt,
    summary: getProgress(session),
  };
}
