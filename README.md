# Zuhause stark

Ein kleiner, mobiler Workout-Tracker für ein Ganzkörpertraining zuhause.

## Funktionen

- sechs Übungen aus dem Workout-Plan
- zwei Sätze pro Übung
- Wiederholungen anpassen und Sätze abhaken
- laufendes Training automatisch fortsetzen
- abgeschlossene Einheiten im Verlauf speichern
- offline nutzbar und als PWA installierbar
- keine Cloud, kein Konto, kein Tracking

Alle Trainingsdaten bleiben im `localStorage` des jeweiligen Browsers. Werden Browserdaten gelöscht, verschwindet auch der Trainingsverlauf.

## Lokal starten

```bash
npm run serve
```

Danach `http://localhost:4173` öffnen.

## Tests

```bash
npm test
```

## Stack

HTML, CSS und Vanilla JavaScript. Keine Laufzeit-Abhängigkeiten und kein Build-Schritt.
