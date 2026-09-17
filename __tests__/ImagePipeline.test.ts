import { describe, it, expect } from '@jest/globals';
import {
  toGrayscale,
  adjustGray,
  floydSteinberg,
  packMSBFirst,
  padToMinRows,
  processForPrint,
  rasterToBmpDataUri,
  PRINT_WIDTH,
  BYTES_PER_ROW,
} from '../src/services/ImagePipeline';
import {
  compositeFrame,
  generateSyntheticPhoto,
  decodeJpegBytes,
} from '../src/services/FrameCompositor';
import jpeg from 'jpeg-js';
import { Buffer } from 'buffer';

describe('ImagePipeline', () => {
  it('converts RGBA to grayscale correctly', () => {
    // 2x2 RGBA: Red, Green, Blue, White
    const rgba = new Uint8Array([
      255, 0, 0, 255,   // Red
      0, 255, 0, 255,   // Green
      0, 0, 255, 255,   // Blue
      255, 255, 255, 255, // White
    ]);
    const gray = toGrayscale(rgba, 2, 2);
    expect(gray.length).toBe(4);
    expect(Math.round(gray[0])).toBe(76);
    expect(Math.round(gray[1])).toBe(150);
    expect(Math.round(gray[2])).toBe(29);
    expect(Math.round(gray[3])).toBe(255);
  });

  it('adjusts brightness and contrast', () => {
    const gray = new Float32Array([128, 128]);
    const bright = adjustGray(gray, 20, 0);
    expect(bright[0]).toBeGreaterThan(128);

    const contrasted = adjustGray(new Float32Array([100, 150]), 0, 50);
    expect(contrasted[0]).toBeLessThan(100);
    expect(contrasted[1]).toBeGreaterThan(150);
  });

  it('runs serpentine Floyd-Steinberg dithering', () => {
    const gray = new Float32Array(PRINT_WIDTH * 10).fill(128);
    const dithered = floydSteinberg(gray, PRINT_WIDTH, 10);
    expect(dithered.length).toBe(PRINT_WIDTH * 10);
    const hasZero = dithered.some(v => v === 0);
    const hasOne = dithered.some(v => v === 1);
    expect(hasZero).toBe(true);
    expect(hasOne).toBe(true);
  });

  it('packs binary bitmap MSB-first', () => {
    const bin = new Uint8Array([1, 0, 0, 0, 0, 0, 0, 1]);
    const packed = packMSBFirst(bin, 8, 1);
    expect(packed.length).toBe(1);
    expect(packed[0]).toBe(0x81);
  });

  it('pads raster to minimum rows', () => {
    const raster = new Uint8Array(50 * BYTES_PER_ROW);
    const { out, totalRows } = padToMinRows(raster, 50, 10);
    expect(totalRows).toBe(90);
    expect(out.length).toBe(90 * BYTES_PER_ROW);
  });

  it('executes full processForPrint', () => {
    const rgba = new Uint8Array(PRINT_WIDTH * 100 * 4).fill(180);
    const raster = processForPrint(rgba, PRINT_WIDTH, 100, { brightness: 10, contrast: 10 });
    expect(raster.length).toBe(100 * BYTES_PER_ROW);
  });

  it('generates a valid 1-bit monochrome BMP data URI', () => {
    const raster = new Uint8Array(48 * 20).fill(0xAA);
    const dataUri = rasterToBmpDataUri(raster, 384, 20);

    expect(dataUri.startsWith('data:image/bmp;base64,')).toBe(true);
    const base64Part = dataUri.replace('data:image/bmp;base64,', '');
    const decoded = Buffer.from(base64Part, 'base64');

    // Expected size: 14 + 40 + 8 + (48 * 20) = 1022 bytes
    expect(decoded.length).toBe(62 + 48 * 20);
    // Header magic 'BM'
    expect(decoded[0]).toBe(0x42);
    expect(decoded[1]).toBe(0x4D);
    // Data offset = 62
    expect(decoded.readUInt32LE(10)).toBe(62);
  });

  it('composites synthetic photo into 384x576 frame template', () => {
    const photo = generateSyntheticPhoto(200, 200);
    const frameBuffer = compositeFrame(photo, 'event01');

    // Width 384 * Height 576 * 4 RGBA bytes = 884736
    expect(frameBuffer.length).toBe(384 * 576 * 4);
  });

  it('decodes JPEG bytes correctly', () => {
    const rawRgba = Buffer.alloc(16 * 16 * 4, 128);
    const encoded = jpeg.encode({ width: 16, height: 16, data: rawRgba }, 50);
    const decoded = decodeJpegBytes(encoded.data);

    expect(decoded.width).toBe(16);
    expect(decoded.height).toBe(16);
    expect(decoded.data.length).toBe(16 * 16 * 4);
  });
});
