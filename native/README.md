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

- `@capacitor/barcode-scanner` — powers the camera button in the Barcode
  search tab. The button only appears when the plugin is registered by the native
  bridge, so it stays hidden in the browser.

  We use the official plugin rather than `@capacitor-mlkit/barcode-scanning`
  because the iOS project is Swift Package Manager based: the ML Kit plugin ships
  no `Package.swift` (its podspec pulls `GoogleMLKit/BarcodeScanning`, which is
  CocoaPods-only), so `cap sync ios` silently left it out of the build and the
  scan button did nothing on iPhone. Android keeps using ML Kit through this
  plugin's `android.scanningLibrary: 'mlkit'` option.

  Because the web app is loaded as plain files (no bundler), it talks to the
  plugin through `window.Capacitor.Plugins.CapacitorBarcodeScanner` instead of the
  plugin's JS wrapper. That wrapper is what normally fills in the default options,
  so `scanBarcode()` in `index.html` has to pass `scanInstructions`, `scanButton`,
  `scanText`, `cameraDirection` and `scanOrientation` itself — iOS rejects the call
  with "Scanning parameters are invalid" if any of them is missing.

## Prerequisites

- **Android**: Android Studio + SDK. `minSdkVersion` is 26 (Android 8.0), the floor
  required by the barcode scanner's Android library.
- **iOS**: macOS with Xcode (cannot build on Windows)

> **Careful:** running `npm run cap:sync` on Windows writes the plugin path in
> `ios/App/CapApp-SPM/Package.swift` with backslashes, which is not valid Swift.
> Either sync on macOS or fix that one path back to forward slashes before building.

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
