# Mizān — Oud Tuner

A web app for tuning the oud with live microphone pitch detection and presets by geography and genre.

## Features

- **Live tuner** using the device microphone (Web Audio API)
- **Reference tones** for each course
- **Regional / genre presets**: Arabic Standard, Arabic Classical, Modern Arabic, Egyptian Five-Course, Iraqi, Turkish Bolahenk, Turkish Common, Armenian, Persian Barbat
- Tension safety notes on Turkish-family tunings

## Run

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`). Allow microphone access when prompted.

## Build

```bash
npm run build
npm run preview
```

## Notes

- Reference pitch is **A440**.
- Courses are listed **bass → treble**.
- Do not raise an Arabic oud to Turkish pitch without strings rated for that tension.
