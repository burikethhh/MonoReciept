import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({
  id: 'monoreciept-storage',
});

const KEY_LAST_PRINTER_MAC = 'printer_last_mac';
const KEY_LAST_PRINTER_NAME = 'printer_last_name';
const KEY_V5X_SECRET_KEY = 'printer_v5x_secret';
const KEY_OPERATOR_PIN = 'kiosk_operator_pin';
const KEY_KEEP_AWAKE = 'kiosk_keep_awake';
const KEY_IMMERSIVE = 'kiosk_immersive';
const KEY_DEFAULT_DENSITY = 'printer_default_density';
const KEY_DEFAULT_COPIES = 'printer_default_copies';

export const StorageService = {
  getLastPrinterMac(): string | undefined {
    return storage.getString(KEY_LAST_PRINTER_MAC);
  },

  setLastPrinterMac(mac: string): void {
    storage.set(KEY_LAST_PRINTER_MAC, mac);
  },

  getLastPrinterName(): string | undefined {
    return storage.getString(KEY_LAST_PRINTER_NAME) ?? 'MXW01';
  },

  setLastPrinterName(name: string): void {
    storage.set(KEY_LAST_PRINTER_NAME, name);
  },

  clearLastPrinter(): void {
    storage.delete(KEY_LAST_PRINTER_MAC);
    storage.delete(KEY_LAST_PRINTER_NAME);
  },

  getV5XSecretKey(): string {
    return storage.getString(KEY_V5X_SECRET_KEY) ?? 'WalkPrint';
  },

  setV5XSecretKey(key: string): void {
    storage.set(KEY_V5X_SECRET_KEY, key);
  },

  getOperatorPin(): string {
    return storage.getString(KEY_OPERATOR_PIN) ?? '1234';
  },

  setOperatorPin(pin: string): void {
    storage.set(KEY_OPERATOR_PIN, pin);
  },

  getKeepAwakeEnabled(): boolean {
    return storage.getBoolean(KEY_KEEP_AWAKE) ?? true;
  },

  setKeepAwakeEnabled(enabled: boolean): void {
    storage.set(KEY_KEEP_AWAKE, enabled);
  },

  getImmersiveEnabled(): boolean {
    return storage.getBoolean(KEY_IMMERSIVE) ?? true;
  },

  setImmersiveEnabled(enabled: boolean): void {
    storage.set(KEY_IMMERSIVE, enabled);
  },

  getDefaultDensity(): 'Low' | 'Medium' | 'High' {
    const val = storage.getString(KEY_DEFAULT_DENSITY);
    if (val === 'Low' || val === 'Medium' || val === 'High') return val;
    return 'Medium';
  },

  setDefaultDensity(density: 'Low' | 'Medium' | 'High'): void {
    storage.set(KEY_DEFAULT_DENSITY, density);
  },

  getDefaultCopies(): number {
    return storage.getNumber(KEY_DEFAULT_COPIES) ?? 1;
  },

  setDefaultCopies(copies: number): void {
    storage.set(KEY_DEFAULT_COPIES, copies);
  },
};
