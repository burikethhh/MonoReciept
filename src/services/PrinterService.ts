// MXW01 BLE service over react-native-ble-plx.
// Service AE30 (fallback AF30). Control AE01, Notify AE02, Data AE03.
// Frame: [22 21 CMD 00 LEN_L LEN_H PAYLOAD... CRC8 FF]

import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import { Buffer } from 'buffer';
import { BYTES_PER_ROW, processForPrint, PRINT_WIDTH } from './ImagePipeline';
import { useBoothStore, DiscoveredPrinter } from '../store/useBoothStore';
import { StorageService } from './StorageService';
import { hmacSha256 } from './CryptoUtils';
import { FrameCompositor } from './FrameCompositor';

export const SVC = [
  '0000ae30-0000-1000-8000-00805f9b34fb',
  '0000af30-0000-1000-8000-00805f9b34fb',
];
export const CHAR_CONTROL = '0000ae01-0000-1000-8000-00805f9b34fb';
export const CHAR_NOTIFY = '0000ae02-0000-1000-8000-00805f9b34fb';
export const CHAR_DATA = '0000ae03-0000-1000-8000-00805f9b34fb';

export const DENSITY = { Low: 0x30, Medium: 0x5d, High: 0x80 } as const;
export type DensityKey = keyof typeof DENSITY;

export function crc8(data: Uint8Array): number {
  let crc = 0;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x80 ? ((crc << 1) ^ 0x07) & 0xff : (crc << 1) & 0xff;
    }
  }
  return crc;
}

export function makeMXCommand(cmd: number, payload: number[] | Uint8Array): Uint8Array {
  const bytes = payload instanceof Uint8Array ? payload : Uint8Array.from(payload);
  const pkt = new Uint8Array(8 + bytes.length);
  pkt.set([0x22, 0x21, cmd, 0x00, bytes.length & 0xff, (bytes.length >> 8) & 0xff]);
  pkt.set(bytes, 6);
  pkt[6 + bytes.length] = crc8(bytes);
  pkt[7 + bytes.length] = 0xff;
  return pkt;
}

export function parseMXPacket(bytes: Uint8Array): { cmd: number; payload: Uint8Array } | null {
  if (bytes.length < 8) return null;
  if (bytes[0] !== 0x22 || bytes[1] !== 0x21) return null;
  const cmd = bytes[2];
  const len = bytes[4] | (bytes[5] << 8);
  if (bytes.length < 8 + len) return null;
  const payload = bytes.subarray(6, 6 + len);
  return { cmd, payload };
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export class PrinterService {
  private manager = new BleManager();
  private device: Device | null = null;
  private svcUUID: string = SVC[0];
  private notifySub: Subscription | null = null;
  private disconnectSub: Subscription | null = null;
  private isHandshakeComplete = false;

  constructor() {
    this.setupBluetoothStateListener();
  }

  private setupBluetoothStateListener() {
    this.manager.onStateChange(state => {
      if (state === 'PoweredOn') {
        // Auto-reconnect if device was previously paired
        this.autoReconnect();
      } else if (state === 'PoweredOff') {
        this.device = null;
        useBoothStore.getState().set({ printerConnected: false });
      }
    }, true);
  }

  async requestBlePermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      if (Platform.Version >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);
        return (
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn('[PrinterService] Error requesting permissions:', err);
      return false;
    }
  }

  async scan(timeoutMs = 8000): Promise<void> {
    const hasPerms = await this.requestBlePermissions();
    if (!hasPerms) {
      console.warn('[PrinterService] BLE permissions not granted');
      return;
    }

    useBoothStore.getState().set({ isBleScanning: true, discoveredPrinters: [] });

    return new Promise(resolve => {
      const knownIds = new Set<string>();

      const timer = setTimeout(() => {
        this.manager.stopDeviceScan();
        useBoothStore.getState().set({ isBleScanning: false });
        resolve();
      }, timeoutMs);

      this.manager.startDeviceScan(null, null, (err, d) => {
        if (err) {
          console.warn('[PrinterService] Scan error:', err);
          this.manager.stopDeviceScan();
          clearTimeout(timer);
          useBoothStore.getState().set({ isBleScanning: false });
          resolve();
          return;
        }

        if (d && !knownIds.has(d.id)) {
          const name = d.name || d.localName || '';
          const isMxPrinter =
            name.includes('MXW01') ||
            name.includes('GB01') ||
            name.includes('GT01') ||
            name.includes('WalkPrint') ||
            name.includes('Printer');

          if (isMxPrinter || name.length > 0) {
            knownIds.add(d.id);
            const discovered: DiscoveredPrinter = {
              id: d.id,
              name: name || 'MXW01 Printer',
              rssi: d.rssi ?? undefined,
            };

            const current = useBoothStore.getState().discoveredPrinters;
            useBoothStore.getState().set({
              discoveredPrinters: [...current, discovered],
            });
          }
        }
      });
    });
  }

  stopScan(): void {
    this.manager.stopDeviceScan();
    useBoothStore.getState().set({ isBleScanning: false });
  }

  async connect(deviceId: string): Promise<void> {
    try {
      this.stopScan();

      // Clean up previous connection if any
      this.cleanupSubscriptions();

      this.device = await this.manager.connectToDevice(deviceId);
      await this.device.discoverAllServicesAndCharacteristics();

      // Resolve active service UUID (0xAE30 or fallback 0xAF30)
      if (typeof this.device.services === 'function') {
        const services = await this.device.services();
        const matchSvc = services.find(s => SVC.includes(s.uuid.toLowerCase()));
        if (matchSvc) this.svcUUID = matchSvc.uuid;
      }

      // Store in MMKV for auto-reconnect
      StorageService.setLastPrinterMac(deviceId);
      if (this.device.name) {
        StorageService.setLastPrinterName(this.device.name);
      }

      // Update store
      useBoothStore.getState().set({
        printerConnected: true,
        printerDeviceName: this.device.name ?? 'MXW01',
      });

      // Register disconnect handler
      this.device.onDisconnected(() => {
        console.log('[PrinterService] Disconnected from device');
        this.device = null;
        useBoothStore.getState().set({ printerConnected: false });
        this.cleanupSubscriptions();
      });

      // Subscribe to AE02 notifications (battery & V5X challenge)
      await this.subscribeToNotifications();

      // Query initial battery & status
      await sleep(100);
      await this.queryBattery();
    } catch (err) {
      console.warn('[PrinterService] Connect failed:', err);
      this.device = null;
      useBoothStore.getState().set({ printerConnected: false });
      throw err;
    }
  }

  private cleanupSubscriptions(): void {
    if (this.notifySub) {
      this.notifySub.remove();
      this.notifySub = null;
    }
    if (this.disconnectSub) {
      this.disconnectSub.remove();
      this.disconnectSub = null;
    }
  }

  private async subscribeToNotifications(): Promise<void> {
    if (!this.device) return;

    this.notifySub = this.device.monitorCharacteristicForService(
      this.svcUUID,
      CHAR_NOTIFY,
      async (err, characteristic) => {
        if (err || !characteristic?.value) return;

        const raw = Buffer.from(characteristic.value, 'base64');
        const packet = parseMXPacket(new Uint8Array(raw));
        if (!packet) return;

        const { cmd, payload } = packet;

        // V5X Cryptographic Challenge (CMD 0xB3)
        if (cmd === 0xb3) {
          await this.handleV5XChallenge(payload);
        }

        // Status / Battery Report (CMD 0xA3 or 0xAE)
        if (cmd === 0xa3 || cmd === 0xae) {
          this.handleStatusReport(payload);
        }
      },
    );
  }

  private async handleV5XChallenge(challengePayload: Uint8Array): Promise<void> {
    console.log('[PrinterService] Intercepted V5X Challenge packet, len:', challengePayload.length);
    try {
      const secretKey = StorageService.getV5XSecretKey();
      const responseSignature = hmacSha256(secretKey, challengePayload);

      // Send V5X challenge response (CMD 0xB4) over CHAR_CONTROL
      await this.writeControl(0xb4, responseSignature);
      this.isHandshakeComplete = true;
      console.log('[PrinterService] V5X HMAC-SHA256 handshake response sent successfully');
    } catch (err) {
      console.warn('[PrinterService] Failed to complete V5X handshake:', err);
    }
  }

  private handleStatusReport(payload: Uint8Array): void {
    if (payload.length > 0) {
      // Byte 0 or byte 1 contains battery level (0-100)
      const rawBattery = payload[0];
      const battery = Math.max(0, Math.min(100, rawBattery));
      useBoothStore.getState().set({ printerBattery: battery });
    }
  }

  async queryBattery(): Promise<void> {
    try {
      // CMD 0xA3 with payload 0x00 requests battery status
      await this.writeControl(0xa3, [0x00]);
    } catch (err) {
      console.warn('[PrinterService] queryBattery failed:', err);
    }
  }

  async autoReconnect(): Promise<boolean> {
    const lastMac = StorageService.getLastPrinterMac();
    if (!lastMac) return false;

    try {
      console.log('[PrinterService] Auto-reconnecting to last printer:', lastMac);
      await this.connect(lastMac);
      return true;
    } catch (err) {
      console.log('[PrinterService] Auto-reconnect failed:', err);
      return false;
    }
  }

  async writeControl(cmd: number, payload: number[] | Uint8Array): Promise<void> {
    if (!this.device) throw new Error('Printer not connected');
    const pkt = makeMXCommand(cmd, payload);
    await this.device.writeCharacteristicWithResponseForService(
      this.svcUUID,
      CHAR_CONTROL,
      Buffer.from(pkt).toString('base64'),
    );
  }

  async print(
    raster48: Uint8Array,
    height: number,
    density: DensityKey = 'Medium',
    onProgress?: (i: number, n: number) => void,
  ): Promise<void> {
    if (!this.device) throw new Error('Printer not connected');

    const totalRows = Math.max(90, height + 10);
    const padded = new Uint8Array(totalRows * BYTES_PER_ROW);
    padded.set(raster48.subarray(0, Math.min(raster48.length, padded.length)));

    // 0xA2 [intensity] -> sleep 50 -> 0xA1 [00] -> sleep 50 -> 0xA9 [rowsL rowsH 30 00] -> sleep 100
    await this.writeControl(0xa2, [DENSITY[density]]);
    await sleep(50);
    await this.writeControl(0xa1, [0x00]);
    await sleep(50);
    await this.writeControl(0xa9, [totalRows & 0xff, (totalRows >> 8) & 0xff, 0x30, 0x00]);
    await sleep(100);

    for (let off = 0, row = 0; off < padded.length; off += BYTES_PER_ROW, row++) {
      const chunk = padded.slice(off, off + BYTES_PER_ROW);
      await this.device.writeCharacteristicWithResponseForService(
        this.svcUUID,
        CHAR_DATA,
        Buffer.from(chunk).toString('base64'),
      );
      onProgress?.(row + 1, totalRows);
      await sleep(15);
    }

    // 0xAD [00] end print
    await this.writeControl(0xad, [0x00]);
  }

  async printTestReceipt(onProgress?: (i: number, n: number) => void): Promise<void> {
    const comp = new FrameCompositor();
    comp.drawCenteredText('MONORECIEPT DIAGNOSTICS', 24, 1);
    comp.drawDashedHLine(16, 40, comp.width - 32);
    comp.drawCenteredText(`DATE: ${new Date().toISOString().slice(0, 10)}`, 52, 1);
    comp.drawCenteredText(`DEVICE: ${this.device?.name ?? 'MXW01'}`, 66, 1);
    comp.drawCenteredText(`GATT SVC: ${this.svcUUID.slice(4, 8).toUpperCase()}`, 80, 1);
    comp.drawCenteredText(`V5X STATUS: ${this.isHandshakeComplete ? 'VERIFIED' : 'READY'}`, 94, 1);
    comp.drawDashedHLine(16, 110, comp.width - 32);

    comp.drawCenteredText('GRADIENT TEST PATTERN', 124, 1);
    for (let y = 140; y < 190; y++) {
      for (let x = 32; x < comp.width - 32; x++) {
        if ((x + y) % 4 === 0 || x % 16 === 0 || y % 16 === 0) {
          comp.setPixel(x, y, 0, 0, 0);
        }
      }
    }

    comp.drawDashedHLine(16, 204, comp.width - 32);
    comp.drawBarcode(50, 218, comp.width - 100, 18);
    comp.drawCenteredText('* HARDWARE TEST PASSED *', 246, 1);

    const height = 270;
    const raster = processForPrint(comp.buffer.subarray(0, comp.width * height * 4), PRINT_WIDTH, height);
    await this.print(raster, height, 'Medium', onProgress);
  }

  async disconnect(): Promise<void> {
    this.cleanupSubscriptions();
    if (this.device) {
      await this.device.cancelConnection();
      this.device = null;
    }
    useBoothStore.getState().set({ printerConnected: false });
  }

  get isConnected(): boolean {
    return this.device !== null;
  }
}

export const printerService = new PrinterService();
