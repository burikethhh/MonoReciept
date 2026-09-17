import { create } from 'zustand';
import { StorageService } from '../services/StorageService';

export type Phase = 'idle' | 'capturing' | 'preview' | 'printing' | 'settings';
export type CameraPosition = 'front' | 'back';

export interface DiscoveredPrinter {
  id: string;
  name: string;
  rssi?: number;
}

interface BoothState {
  phase: Phase;
  frameId: string;
  photoUri: string | null;
  cameraPosition: CameraPosition;
  brightness: number;
  contrast: number;
  copies: number;
  density: 'Low' | 'Medium' | 'High';

  // Kiosk settings
  keepAwakeEnabled: boolean;
  immersiveEnabled: boolean;

  // BLE Printer State
  printerConnected: boolean;
  printerDeviceName: string;
  printerBattery: number;
  isBleScanning: boolean;
  discoveredPrinters: DiscoveredPrinter[];

  set: (p: Partial<BoothState>) => void;
  reset: () => void;
}

export const useBoothStore = create<BoothState>(set => ({
  phase: 'idle',
  frameId: 'event01',
  photoUri: null,
  cameraPosition: 'front',
  brightness: 0,
  contrast: 0,
  copies: StorageService.getDefaultCopies(),
  density: StorageService.getDefaultDensity(),

  // Kiosk defaults
  keepAwakeEnabled: StorageService.getKeepAwakeEnabled(),
  immersiveEnabled: StorageService.getImmersiveEnabled(),

  // BLE defaults
  printerConnected: false,
  printerDeviceName: 'MXW01',
  printerBattery: 100,
  isBleScanning: false,
  discoveredPrinters: [],

  set: p => set(p),
  reset: () => set({ phase: 'idle', photoUri: null }),
}));
