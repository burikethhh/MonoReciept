# GEMINI.md — MonoReciept Agent Handoff

You are working on **MonoReciept**, a Bare React Native kiosk photobooth for Android tablets that prints to an MXW01 thermal mini-printer over BLE. Follow this file as source of truth.

## 1. Locked scope (do not change without asking)
- Platform: **Android only** (kiosk, immersive mode, keep-awake)
- Printer: **MXW01 only**, GATT service `0xAE30` (fallback `0xAF30`)
- Template MVP: **Themed Frames only** (single shot + 384px-wide overlay)
- Stack: Bare RN 0.76.5 + VisionCamera + react-native-ble-plx + MMKV + Zustand + Gorhom bottom-sheet v5

## 2. Portable toolchain (no admin on this machine — always set env first)
```powershell
$nodeDir = "C:\Users\ketha\AppData\Local\Temp\opencode\nodejs\node-v20.19.0-win-x64"
$jdk = "C:\Users\ketha\AppData\Local\Temp\opencode\jdk17\jdk-17.0.20.1+1"
$sdk = "C:\Users\ketha\AppData\Local\Android\Sdk"
$env:JAVA_HOME = $jdk
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:Path = "$nodeDir;$jdk\bin;$sdk\cmdline-tools\latest\bin;$sdk\platform-tools;" + $env:Path
```
- Verify: `node --version` (v20.19.0), `npm --version`, `java -version` (17.0.20), `sdkmanager --version`, `gradlew -p android --version` (Gradle 8.10.2)
- Install JS deps: `npm install --no-audit --no-fund` (uses portable npm via `$nodeDir\npm.cmd`)
- Typecheck: `npx tsc --noEmit` (must be clean; tsconfig extends `@react-native/typescript-config`)
- Build: `.\android\gradlew.bat -p android assembleDebug --console=plain` (first run is slow; run in background, log to `build.log`)
- Git: `C:\Program Files\Git\bin\git.exe` (upstream `https://github.com/burikethhh/MonoReciept.git`, currently empty)

## 3. Project layout
```
App.tsx                          # StatusBar + HomeScreen shell
index.js / app.json              # app name: MonoReciept
src/store/useBoothStore.ts       # FSM: idle|capturing|preview|printing + frameId, brightness, contrast, copies, density
src/services/ImagePipeline.ts    # grayscale -> adjust -> serpentine Floyd-Steinberg -> MSB-first pack (no DOM deps)
src/services/PrinterService.ts   # MXW01 BLE: scan/connect/writeControl/print (see §4)
src/components/StatusBar.tsx     # BLE pill + battery (wire to notify char in M4)
src/components/PrintSheet.tsx    # copies + density + print loop with progress
src/screens/HomeScreen.tsx       # frame picker + booth launcher + settings gear
src/screens/CaptureScreen.tsx    # VisionCamera capture + frame ghost + 3-2-1 countdown + flash (M2)
src/screens/PreviewScreen.tsx    # dither preview + sliders + frame switcher + print sheet (M3)
src/screens/SettingsScreen.tsx   # PIN-gated operator settings + diagnostic print + kiosk lock (M5)
src/assets/frames/               # 384px-wide PNG overlays & FrameTemplates (e.g. 384x576)
android/app/src/main/AndroidManifest.xml  # CAMERA + BLUETOOTH_SCAN/CONNECT + FINE_LOCATION + LE feature
```

## 4. Printer protocol (MXW01 — do not invent values)
- Chars: control `AE01`, notify `AE02`, data `AE03` (full UUIDs in `PrinterService.ts`)
- Frame: `[22 21 CMD 00 LEN_L LEN_H PAYLOAD... CRC8 FF]`, CRC8 poly `0x07`
- Sequence: `0xA2 [intensity]` → sleep 50 → `0xA1 [00]` → sleep 50 → `0xA9 [rowsL rowsH 30 00]` → sleep 100 → rows of 48B via `AE03` @15ms → `0xAD [00]`
- Density map: Low `0x30` / Medium `0x5D` (default) / High `0x80`
- Raster: 384px wide, MSB-first (bit7 = left pixel), 48 bytes/row, pad to 90-row min + 10 feed lines
- **V5X Handshake:** Implemented via CryptoUtils HMAC-SHA256 engine with configurable secret key in StorageService (defaults to WalkPrint).

## 5. Conventions
- TypeScript strict, no emojis in UI (bold type + vector icons, pastel Fun Print style)
- Keep `ImagePipeline.ts` DOM-free so logic is testable in Jest
- Isolate all BLE in `PrinterService.ts` — screens call it, never ble-plx directly
- Small PR-style edits; run `tsc --noEmit` after touching TS

## 6. Milestones / task list
- [x] M1 scaffold (JS + android/ + perms + tsc clean)
- [x] M2 camera: mount VisionCamera in CaptureScreen + frame ghost + 3-2-1 countdown + flash → sets `photoUri`, phase `preview`
- [x] M3 preview: `processForPrint()` live dither + brightness/contrast sliders + frame switcher
- [x] M4 BLE: scan/connect MXW01, V5X handshake, battery notify, auto-reconnect last MAC
- [x] M5 print+settings: chunked print + progress, copies/density, PIN-gated settings, immersive kiosk lock
- [ ] Push scaffold to `MonoReciept` remote

## 7. Definition of done per task
1. `npx tsc --noEmit` passes with no new errors
2. Relevant screen/service updated with no placeholder TODO left for that milestone
3. Report: files changed + how verified + remaining risk

Start with the earliest unchecked milestone unless told otherwise.
