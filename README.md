# MonoReciept — RN Photobooth Kiosk (MXW01 only, Android, Themed Frames MVP)

Bare React Native photobooth for Android kiosk tablets printing to MXW01 thermal mini-printer over BLE.

## Scope (locked)
- Platform: Android only (kiosk, immersive mode, keep-awake)
- Printer: MXW01 only, GATT service `0xAE30` (fallback `0xAF30`)
- Template MVP: Themed Frames only (single shot + 384px-wide overlay)
- Stack: Bare RN + VisionCamera + ble-plx + MMKV + Zustand

## Structure
```
App.tsx
src/navigation/RootNavigator.tsx
src/screens/HomeScreen.tsx CaptureScreen.tsx PreviewScreen.tsx SettingsScreen.tsx
src/components/StatusBar.tsx FramePicker.tsx PrintSheet.tsx
src/services/CameraService.ts ImagePipeline.ts PrinterService.ts SettingsStore.ts
src/assets/frames/ (put 384px-wide PNG overlays here, e.g. 384x600)
src/store/useBoothStore.ts
```

## Bring-up (on dev machine with Git/Node20/JDK17/Android Studio)
1. `npm install`
2. `npx react-native run-android`
3. Grant CAMERA + BLUETOOTH_SCAN/CONNECT + FINE_LOCATION
4. Sniff Fun Print app with nRF Connect to confirm AE01/AE02/AE03 + HMAC key before print testing.

## Print pipeline
`photo -> resize 384w -> overlay frame -> grayscale -> brightness/contrast -> Floyd-Steinberg serpentine -> pack MSB-first (48B/row) -> 0xA2 intensity -> 0xA9 rows -> AE03 rows @15ms -> 0xAD flush`

See `src/services/ImagePipeline.ts` and `PrinterService.ts`.
