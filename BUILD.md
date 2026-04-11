# RunOut — Build Guide

How to build and deploy all versions of RunOut.

## Project structure

```
(repo root)
├── index.html        Web app / PWA (the source of truth)
├── sw.js             Service worker
├── manifest.json     PWA manifest
├── BUILD.md          This file
└── native/           Capacitor wrapper for iOS & Android
    ├── android/      Android Studio project
    ├── ios/          Xcode project
    └── capacitor.config.ts
```

All versions share the same web code in the repo root. Edit there, then deploy/sync.

---

## 1. Web / PWA

The PWA has no build step — it's plain HTML/CSS/JS served as static files.

### Deploy to any static host

Copy these files to your web server or hosting service:

```
index.html
sw.js
manifest.json
icon-192.png
icon-512.png
```

Works with: GitHub Pages, Netlify, Vercel, Cloudflare Pages, any Apache/Nginx,
or even `python -m http.server 8080` for local testing.

### HTTPS required

Service worker and PWA install require HTTPS (or localhost).

### Update the service worker cache version

When you change `index.html`, bump the cache version in `sw.js`:

```js
const CACHE_NAME = 'runout-v15';  // increment this
```

---

## 2. Android

### Prerequisites

- Node.js (LTS)
- Android Studio (with SDK 34+)
- A physical device or emulator

### Build steps

```bash
cd native

# Install dependencies (first time only)
npm install

# Sync PWA code into the Android project
npm run cap:sync

# Open in Android Studio
npm run cap:open:android
```

In Android Studio:

1. Wait for Gradle sync to finish
2. Select a device/emulator
3. Click **Run** (green play button) to test
4. For a release build: **Build > Generate Signed Bundle / APK**
   - Choose **Android App Bundle (.aab)** for Google Play
   - Choose **APK** for direct distribution

### Signing

Before uploading to Google Play, you need a signing key:

```bash
keytool -genkey -v -keystore runout-release.keystore \
  -alias runout -keyalg RSA -keysize 2048 -validity 10000
```

Keep `runout-release.keystore` safe — you need the same key for all future updates.

### Google Play submission

1. Create an app in [Google Play Console](https://play.google.com/console)
2. Upload the signed `.aab` file
3. Fill in store listing, screenshots, privacy policy
4. Submit for review

---

## 3. iOS

### Prerequisites

- macOS (required — cannot build iOS on Windows/Linux)
- Xcode 15+
- An Apple Developer account ($99/year for App Store distribution)

### Build steps

```bash
cd native

# Install dependencies (first time only)
npm install

# Sync PWA code into the iOS project
npm run cap:sync

# Open in Xcode
npm run cap:open:ios
```

In Xcode:

1. Select the **App** target
2. Under **Signing & Capabilities**, select your team/provisioning profile
3. Select a simulator or connected device
4. Click **Run** to test
5. For a release build: **Product > Archive**, then **Distribute App**

### App Store submission

1. Create an app in [App Store Connect](https://appstoreconnect.apple.com)
2. Archive and upload from Xcode
3. Fill in store listing, screenshots, privacy policy
4. Submit for review

---

## 4. Quick reference

| Action                        | Command / Location                        |
|-------------------------------|-------------------------------------------|
| Edit the app                  | `index.html`                              |
| Serve PWA locally             | `python -m http.server 8080`              |
| Sync changes to native        | `cd native && npm run cap:sync`           |
| Open Android Studio           | `cd native && npm run cap:open:android`   |
| Open Xcode                    | `cd native && npm run cap:open:ios`       |
| Run on Android device         | `cd native && npm run cap:run:android`    |
| Run on iOS simulator          | `cd native && npm run cap:run:ios`        |
| Bump service worker cache     | Edit `CACHE_NAME` in `sw.js`              |

---

## App identity

| Field        | Value              |
|--------------|--------------------|
| App ID       | `se.linri.runout`  |
| App name     | RunOut             |
| Config file  | `native/capacitor.config.ts` |

---

## Common workflow

1. Edit code in `index.html`
2. Test in browser (PWA version)
3. `cd native && npm run cap:sync`
4. Test in Android Studio / Xcode
5. Build release and submit to stores
