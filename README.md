# Anki Scribe

A handwriting-based Polish vocabulary trainer with OCR recognition and spaced repetition — built as a Progressive Web App.

**[Try it live →](https://jank84.github.io/vocabtrainer/)**

![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8) ![Offline](https://img.shields.io/badge/offline-supported-brightgreen) ![GitHub Pages](https://img.shields.io/badge/hosted-GitHub%20Pages-222?logo=github)

---

## What It Does

Write Polish vocabulary by hand on a canvas. Tesseract.js reads your handwriting via OCR and gives instant feedback. Rate your confidence (Again / Hard / Good / Easy) to drive a spaced repetition system that surfaces the right words at the right time.

---

## Features

- **Handwriting canvas** with guide lines (baseline, cap height, descender)
- **OCR recognition** via Tesseract.js — supports Polish characters (ą ć ę ł ń ó ś ź ż)
- **Voice pronunciation** via Web Speech Synthesis
- **Spaced repetition** — intervals based on your self-rating
- **4 built-in lessons** — greetings, personal info, colors, numbers (0–1,000,000)
- **Custom vocabulary** — import any semicolon or tab-delimited file
- **Batch learning** — focus on a configurable set of words at a time
- **Achievements** — unlockable milestones with particle celebrations
- **Backup & restore** — export/import your progress as JSON
- **Offline support** — full PWA with service worker caching
- **Installable** — add to home screen as a standalone app

---

## Getting Started

Open **[theheathlee.github.io/vocabtrainer](https://theheathlee.github.io/vocabtrainer/)** in any modern browser — no install or account needed.

> The first load downloads Tesseract language data from CDN (~50–100 MB). Subsequent loads are fully offline.

### Run Locally

Clone the repo and serve it over HTTP (required for service workers):

```bash
git clone https://github.com/theHeathLee/vocabtrainer.git
cd vocabtrainer
python -m http.server 8000
```

Then open `http://localhost:8000`.

---

## Installing as a PWA

Use your browser's "Install app" option to add Anki Scribe to your home screen. It will run as a full-screen standalone app with no browser UI.

---

## Vocabulary File Format

Custom files use semicolon or tab-delimited format, one word pair per line:

```
#separator:semicolon
hello;cześć
goodbye;do widzenia
```

Import via the file picker in the app. Files are stored locally in IndexedDB.

---

## Spaced Repetition Intervals

| Rating | Interval |
|--------|----------|
| Again  | 1 minute |
| Hard   | 6 minutes |
| Good   | 10 minutes |
| Easy   | 3 days |

---

## Project Structure

```
vocabtrainer/
├── index.html          # Entire app (single file)
├── sw.js               # Service worker
├── manifest.json       # PWA manifest
├── lesson-1.txt        # Greetings & common phrases
├── lesson-2.txt        # Personal info & locations
├── lesson-3.txt        # Colors & classroom items
├── numbers.txt         # Numbers 0–1,000,000
└── icons/              # PWA icons
```

---

## Tech Stack

- **Vanilla JS** — no framework
- **Tesseract.js v5** — OCR engine
- **Canvas API** — drawing surface
- **IndexedDB** — vocabulary storage
- **Web Speech API** — pronunciation
- **Service Workers** — offline caching
- **Google Fonts** — Inter typeface
