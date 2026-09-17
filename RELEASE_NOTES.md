# MonoReciept v1.0.0 — Android Kiosk Photobooth

**MonoReciept** is a Bare React Native Android kiosk photobooth for Android tablets that communicates with an **MXW01 thermal mini-printer** over Bluetooth Low Energy (BLE).

## Key Highlights

- **Camera & Viewfinder (Milestone 2)**:
  - VisionCamera v4 integration with front/back camera toggling and permission handling.
  - Locked 384px-wide (2:3 aspect ratio) receipt viewfinder mask and themed corner guides.
  - Interactive 3-2-1 countdown animation and full-screen white shutter flash.

- **Dither Engine & Compositor (Milestone 3)**:
  - Pure-JS Floyd-Steinberg error diffusion dithering (zero DOM / Canvas dependencies).
  - Tone adjustments: real-time brightness and contrast sliders (-50 to +50) with instant recalculation.
  - 1-Bit Windows Bitmap (BMP) data URI generator rendering razor-sharp thermal print dots on mobile.
  - Themed receipt overlays (`Classic Receipt` & `Party Memories`) with timestamps, borders, and barcodes.

- **MXW01 BLE Stack (Milestone 4)**:
  - Automatic GATT discovery on services `0xAE30` / `0xAF30`.
  - V5X HMAC-SHA256 challenge-response handshake engine (`CryptoUtils.ts`).
  - Real-time battery monitoring via `0xAE02` notifications.
  - MMKV persistent storage for auto-reconnection on startup.

- **Kiosk Mode & Operator Controls (Milestone 5)**:
  - 4-digit PIN-gated operator settings modal (default PIN: `1234`).
  - Burn density controls (`Low`, `Medium`, `High`) and multi-copy printing (`1`–`5`).
  - One-tap diagnostic hardware self-test print (`printTestReceipt()`).
  - Kiosk lockdown: Android immersive sticky full-screen mode and `react-native-keep-awake`.

## Hardware Compatibility
- **Printer**: MXW01 (and compatible GB01 / GT01 / WalkPrint mini thermal printers)
- **Paper Width**: 57mm thermal roll (384 dots print width)
- **OS**: Android 10+ (API 29+) tablet or phone

## Quick Install
```bash
adb install -r MonoReciept-v1.0.0.apk
```
