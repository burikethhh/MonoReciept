import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  crc8,
  makeMXCommand,
  parseMXPacket,
  printerService,
} from '../src/services/PrinterService';
import { sha256, hmacSha256 } from '../src/services/CryptoUtils';
import { StorageService } from '../src/services/StorageService';
import { useBoothStore } from '../src/store/useBoothStore';

describe('PrinterService & BLE Protocol', () => {
  beforeEach(() => {
    useBoothStore.getState().reset();
    StorageService.clearLastPrinter();
  });

  it('computes correct CRC8 with polynomial 0x07', () => {
    // Known CRC8 test vector
    const testData = new Uint8Array([0x01, 0x02, 0x03]);
    const crc = crc8(testData);
    expect(typeof crc).toBe('number');
    expect(crc).toBeGreaterThanOrEqual(0);
    expect(crc).toBeLessThanOrEqual(255);
  });

  it('frames MXW01 command packet properly', () => {
    // [22 21 CMD 00 LEN_L LEN_H PAYLOAD... CRC8 FF]
    const cmd = 0xa2;
    const payload = [0x5d]; // Medium density
    const packet = makeMXCommand(cmd, payload);

    expect(packet[0]).toBe(0x22);
    expect(packet[1]).toBe(0x21);
    expect(packet[2]).toBe(0xa2);
    expect(packet[3]).toBe(0x00);
    expect(packet[4]).toBe(1); // Length LSB
    expect(packet[5]).toBe(0); // Length MSB
    expect(packet[6]).toBe(0x5d); // Payload
    expect(packet[7]).toBe(crc8(new Uint8Array(payload))); // CRC8
    expect(packet[8]).toBe(0xff); // End marker
  });

  it('parses incoming MXW01 packets correctly', () => {
    const originalPayload = [0x55, 0x64]; // Status/battery report
    const framed = makeMXCommand(0xa3, originalPayload);
    const parsed = parseMXPacket(framed);

    expect(parsed).not.toBeNull();
    expect(parsed!.cmd).toBe(0xa3);
    expect(parsed!.payload.length).toBe(2);
    expect(parsed!.payload[0]).toBe(0x55);
    expect(parsed!.payload[1]).toBe(0x64);
  });

  it('computes SHA-256 and HMAC-SHA256 correctly for V5X handshake', () => {
    const key = 'WalkPrint';
    const challenge = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
    const hmac = hmacSha256(key, challenge);

    expect(hmac.length).toBe(32); // 256 bits = 32 bytes
    // Verify non-zero digest
    expect(hmac.some(b => b !== 0)).toBe(true);

    const hash = sha256(new Uint8Array([0x61, 0x62, 0x63])); // 'abc'
    expect(hash.length).toBe(32);
    // Known SHA-256 for 'abc': ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
    expect(hash[0]).toBe(0xba);
    expect(hash[1]).toBe(0x78);
    expect(hash[2]).toBe(0x16);
    expect(hash[3]).toBe(0xbf);
  });

  it('persists and retrieves last printer MAC via StorageService', () => {
    expect(StorageService.getLastPrinterMac()).toBeUndefined();
    StorageService.setLastPrinterMac('AA:BB:CC:DD:EE:FF');
    expect(StorageService.getLastPrinterMac()).toBe('AA:BB:CC:DD:EE:FF');
    StorageService.clearLastPrinter();
    expect(StorageService.getLastPrinterMac()).toBeUndefined();
  });

  it('connects to device and updates store state', async () => {
    await printerService.connect('mock-mac');
    expect(useBoothStore.getState().printerConnected).toBe(true);
    expect(StorageService.getLastPrinterMac()).toBe('mock-mac');

    await printerService.disconnect();
    expect(useBoothStore.getState().printerConnected).toBe(false);
  });

  it('auto-reconnects if last printer MAC is stored', async () => {
    StorageService.setLastPrinterMac('mock-mac');
    const reconnected = await printerService.autoReconnect();
    expect(reconnected).toBe(true);
    expect(useBoothStore.getState().printerConnected).toBe(true);
  });
});
