# RunOut — Native (Capacitor)

Native iOS/Android wrapper for the RunOut PWA.

## Structure

```
(repo root)
├── index.html, sw.js, ...   ← The web app (standalone PWA)
└── native/                  ← This directory (Capacitor wrapper)
    ├── android/             ← Android Studio project
    ├── ios/                 ← Xcode project
    └── capacitor.config.ts
```

Capacitor requires `webDir` to live inside this folder, so `copy-web.js` mirrors
the PWA files from the parent directory into `./www` before sync. The web app
and the native apps share the **same source code** — just run `npm run cap:sync`
after editing the PWA to update both platforms.

## Plugins

- `@capacitor-mlkit/barcode-scanning` — powers the camera button in the Barcode
  search tab. The button only appears when running inside the native app.

## Prerequisites

- **Android**: Android Studio + SDK
- **iOS**: macOS with Xcode (cannot build on Windows)

## Workflow

After editing code in the repo root:

```bash
cd native/

# Sync web assets into native projects
npm run cap:sync

# Open in IDE
npm run cap:open:android   # Opens Android Studio
npm run cap:open:ios       # Opens Xcode (macOS only)

# Or run directly on device/emulator
npm run cap:run:android
npm run cap:run:ios
```

## App ID

`se.linri.runout` — configured in `capacitor.config.ts` and in the native projects.
