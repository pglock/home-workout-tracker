import {
  WORKOUT,
  completeSession,
  createSession,
  getProgress,
  setReps,
  toggleSet,
} from "./workout.js";
import { createWorkoutStore } from "./storage.js";

const store = createWorkoutStore(window.localStorage);
const trainingRoot = document.querySelector("#training-root");
const historyRoot = document.querySelector("#history-root");
const historyCount = document.querySelector("#history-count");
const toast = document.querySelector("#toast");
let activeSession = store.loadActive();
let toastTimer;

function sessionId() {
  return globalThis.crypto?.randomUUID?.() ?? `workout-${Date.now()}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatDuration(session) {
  if (!session.completedAt) return "läuft";
  const minutes = Math.max(
    1,
    Math.round((new Date(session.completedAt) - new Date(session.startedAt)) / 60000),
  );
  return `${minutes} Min.`;
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function readyMarkup() {
  return `
    <article class="hero">
      <p class="eyebrow">Bereit wenn du es bist</p>
      <h2>Einfach anfangen.<br>Den Rest abhaken.</h2>
      <p class="hero-copy">Sechs Übungen für den ganzen Körper. Ohne Konto, ohne Cloud, ohne Fitness-Goblin.</p>
      <div class="metrics" aria-label="Trainingsumfang">
        <span class="metric">2 Runden</span>
        <span class="metric">ca. 20 Minuten</span>
        <span class="metric">2× pro Woche</span>
      </div>
      <button class="primary-button" data-action="start">Training starten</button>
    </article>
    <aside class="notice">
      <span class="notice-icon" aria-hidden="true">↗</span>
      <div><strong>2–3 Minuten aufwärmen</strong>Gehen, Armkreisen und lockere Kniebeugen. Zwischen Übungen 20–40 Sekunden Pause.</div>
    </aside>
  `;
}

function setMarkup(exercise, set, index) {
  return `
    <div class="set-row">
      <span class="set-label">Satz ${index + 1}</span>
      <button class="rep-button" data-action="reps" data-direction="-1" data-exercise="${exercise.id}" data-set="${set.id}" aria-label="Wiederholung reduzieren">−</button>
      <input class="rep-input" type="number" min="0" max="99" inputmode="numeric" value="${set.reps}" data-action="reps-input" data-exercise="${exercise.id}" data-set="${set.id}" aria-label="Wiederholungen für ${exercise.name}, Satz ${index + 1}">
      <button class="rep-button" data-action="reps" data-direction="1" data-exercise="${exercise.id}" data-set="${set.id}" aria-label="Wiederholung erhöhen">+</button>
      <button class="check-button ${set.done ? "is-done" : ""}" data-action="toggle" data-exercise="${exercise.id}" data-set="${set.id}" aria-label="Satz ${index + 1} ${set.done ? "als offen markieren" : "abhaken"}" aria-pressed="${set.done}">${set.done ? "✓" : "○"}</button>
    </div>
  `;
}

function exerciseMarkup(exercise, state, index) {
  const complete = state.sets.every((set) => set.done);
  return `
    <article class="exercise-card ${complete ? "is-complete" : ""}">
      <div class="exercise-head">
        <span class="exercise-number" aria-hidden="true">${index + 1}</span>
        <div class="exercise-title">
          <h3>${exercise.name}</h3>
          <span class="target-pill">${exercise.reps.min}–${exercise.reps.max} ${exercise.reps.unit}</span>
        </div>
      </div>
      <p class="cue">${exercise.cue}</p>
      <div class="set-list">${state.sets.map((set, setIndex) => setMarkup(exercise, set, setIndex)).join("")}</div>
      <details class="technique">
        <summary>Technik & Steigerung</summary>
        <p>${exercise.progression}</p>
        ${exercise.note ? `<p class="warning">${exercise.note}</p>` : ""}
      </details>
    </article>
  `;
}

function activeMarkup(session) {
  const progress = getProgress(session);
  return `
    <div class="progress-card">
      <div class="progress-top">
        <span class="progress-label">Dein Fortschritt</span>
        <span class="progress-value">${progress.done} von ${progress.total} Sätzen · ${progress.percent}%</span>
      </div>
      <div class="progress-track" role="progressbar" aria-label="Trainingsfortschritt" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.percent}">
        <div class="progress-fill" style="width: ${progress.percent}%"></div>
      </div>
    </div>
    <aside class="notice">
      <span class="notice-icon" aria-hidden="true">⏱</span>
      <div><strong>20–40 Sekunden Pause</strong>Saubere Wiederholungen schlagen Tempo. Bei stechenden oder stärker werdenden Schmerzen stoppen.</div>
    </aside>
    <div class="exercise-list">
      ${WORKOUT.map((exercise, index) => exerciseMarkup(exercise, session.exercises[index], index)).join("")}
    </div>
    <div class="finish-panel">
      <button class="primary-button full-width" data-action="finish">Einheit speichern</button>
      <button class="danger-button full-width" data-action="discard">Training verwerfen</button>
    </div>
  `;
}

function renderTraining() {
  trainingRoot.innerHTML = activeSession ? activeMarkup(activeSession) : readyMarkup();
}

function historyMarkup(history) {
  if (history.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon" aria-hidden="true">◌</div>
        <h3>Noch keine Einheit</h3>
        <p>Dein erstes gespeichertes Training erscheint hier. Die Daten bleiben nur in diesem Browser.</p>
      </div>
    `;
  }
  return `<div class="history-list">${history
    .map((session) => {
      const summary = session.summary ?? getProgress(session);
      return `
        <article class="history-card">
          <div class="history-card-top">
            <div>
              <div class="history-date">${formatDate(session.completedAt)}</div>
              <div class="history-meta">${formatDuration(session)} · ${summary.done}/${summary.total} Sätze</div>
            </div>
            <div class="history-score">${summary.percent}%</div>
          </div>
          <div class="history-bar" aria-hidden="true"><span style="width: ${summary.percent}%"></span></div>
        </article>
      `;
    })
    .join("")}</div>`;
}

function renderHistory() {
  const history = store.loadHistory();
  historyCount.textContent = String(history.length);
  historyRoot.innerHTML = historyMarkup(history);
}

function persistAndRender(session) {
  activeSession = session;
  store.saveActive(activeSession);
  renderTraining();
}

trainingRoot.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, exercise, set, direction } = button.dataset;

  if (action === "start") {
    activeSession = createSession(sessionId());
    store.saveActive(activeSession);
    renderTraining();
    showToast("Training gestartet");
    return;
  }
  if (!activeSession) return;

  if (action === "toggle") {
    persistAndRender(toggleSet(activeSession, exercise, set));
  } else if (action === "reps") {
    const current = activeSession.exercises
      .find((item) => item.id === exercise)
      ?.sets.find((item) => item.id === set)?.reps;
    persistAndRender(setReps(activeSession, exercise, set, current + Number(direction)));
  } else if (action === "finish") {
    const progress = getProgress(activeSession);
    if (progress.done < progress.total && !window.confirm("Einheit unvollständig speichern?")) return;
    const completed = completeSession(activeSession);
    store.archive(completed);
    activeSession = null;
    renderTraining();
    renderHistory();
    showToast("Einheit gespeichert");
  } else if (action === "discard") {
    if (!window.confirm("Aktuelles Training wirklich verwerfen?")) return;
    window.localStorage.removeItem("workout.active");
    activeSession = null;
    renderTraining();
    showToast("Training verworfen");
  }
});

trainingRoot.addEventListener("change", (event) => {
  const input = event.target.closest('input[data-action="reps-input"]');
  if (!input || !activeSession) return;
  persistAndRender(setReps(activeSession, input.dataset.exercise, input.dataset.set, input.value));
});

document.querySelector(".tabs").addEventListener("click", (event) => {
  const tab = event.target.closest("button[data-view]");
  if (!tab) return;
  document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("is-active", item === tab));
  document.querySelectorAll(".view").forEach((view) => {
    view.hidden = view.id !== `${tab.dataset.view}-view`;
  });
  if (tab.dataset.view === "history") renderHistory();
});

renderTraining();
renderHistory();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
}
