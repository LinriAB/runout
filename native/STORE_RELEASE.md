# Publishing RunOut to the app stores

Three targets, three workflows. The PWA at `app.runout.io` stays the source of
truth; these artifacts wrap or reference it.

---

## Prerequisites

- **App ID**: `se.linri.runout` (configured in `capacitor.config.ts`)
- **Assets needed for all stores**:
  - App icon 512×512 PNG
  - Feature graphic / hero image
  - At least 2–3 screenshots per target device class
  - Short description (≤80 chars) and full description (≤4000 chars)
  - Privacy policy URL: `https://app.runout.io/privacy.html` (the file lives
    in the PWA directory and is deployed alongside the app)

---

## 1. Google Play Store (Android)

### Tools required
- Android Studio (latest)
- Java JDK 17+
- Google Play Console account (one-time $25)

### Signing key (first time only)

Keep this key safe — losing it means you can never update the app.

```powershell
keytool -genkey -v -keystore runout-release.keystore `
  -alias runout -keyalg RSA -keysize 2048 -validity 10000
```

Store `runout-release.keystore` outside the repo (e.g. `~/keys/`). Back it up.

Add `native/android/key.properties` (gitignored):

```properties
storeFile=C:/path/to/runout-release.keystore
storePassword=...
keyAlias=runout
keyPassword=...
```

And reference it in `native/android/app/build.gradle` (under `android { ... }`):

```gradle
signingConfigs {
    release {
        def keyProps = new Properties()
        file(rootProject.file('key.properties')).withInputStream { keyProps.load(it) }
        storeFile file(keyProps['storeFile'])
        storePassword keyProps['storePassword']
        keyAlias keyProps['keyAlias']
        keyPassword keyProps['keyPassword']
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
    }
}
```

### Build the release bundle

```bash
cd native
npm run cap:sync
npm run cap:open:android
```

In Android Studio: **Build → Generate Signed App Bundle → AAB**. Output is
`native/android/app/release/app-release.aab`.

### Submit

1. Play Console → Create app → fill in store listing.
2. Production → Create new release → upload the AAB.
3. Complete data-safety form (disclose camera permission and localStorage).
4. Submit for review. First review can take 1–7 days.

---

## 2. Apple App Store (iOS)

### Tools required
- macOS machine
- Xcode 15+
- Apple Developer Program account ($99/year)

### Why we added the barcode scanner

Apple's Guideline 4.2 rejects "minimum functionality" apps, including pure
webview wrappers. The native barcode scanner (via `@capacitor-mlkit/barcode-scanning`)
gives the app a camera-driven feature that couldn't exist in a plain browser —
that's the argument to make in the review notes.

### First-time setup

1. Open the iOS project: `npm run cap:open:ios`
2. In Xcode, select the App target → Signing & Capabilities → set your Team.
3. Verify bundle ID `se.linri.runout` is registered on
   [developer.apple.com](https://developer.apple.com/account/resources/identifiers/list).
4. Confirm `NSCameraUsageDescription` exists in `Info.plist` (already added).

### Build and upload

1. In Xcode: **Product → Archive**.
2. Organizer opens → **Distribute App → App Store Connect → Upload**.
3. Go to [App Store Connect](https://appstoreconnect.apple.com), pick the
   build, fill store listing.
4. **Review notes**: explicitly mention the barcode scanner as a native
   camera feature unique to the app.
5. Submit.

### Expected review feedback

If 4.2 gets cited anyway, point to:
- The camera permission prompt (live capture, not just a web-loaded page)
- The barcode-to-search flow (OS-level capability surfaced in the app)

---

## 3. Microsoft Store (Windows)

No local build required — Microsoft's PWABuilder packages the live PWA.

1. Go to [pwabuilder.com](https://www.pwabuilder.com/).
2. Enter `https://app.runout.io` → analyse.
3. Fix any reported manifest / service worker issues.
4. **Package for Stores → Windows** → download the `.msixbundle` + classic
   `.appxupload`.
5. In [Microsoft Partner Center](https://partner.microsoft.com/dashboard),
   reserve the app name, create a new submission, upload the package, fill
   listing, submit.

Microsoft Store review is typically 24–48 hours.

---

## Release checklist

When shipping a new version across all stores:

- [ ] Bump `"version"` in `native/package.json`
- [ ] Bump `MARKETING_VERSION` in `native/ios/App/App.xcodeproj`
- [ ] Bump `versionName` + `versionCode` in `native/android/app/build.gradle`
- [ ] Bump `sw.js` cache name so existing users pick up new assets
- [ ] `npm run cap:sync`
- [ ] Rebuild AAB and IPA, re-run PWABuilder for Windows
- [ ] Update screenshots if the UI changed materially
