// 384px thermal pipeline: grayscale -> brightness/contrast -> Floyd-Steinberg (serpentine) -> MSB-first pack.
// Ported from clementvp/mxw01-thermal-printer + tomLadder/thermoprint concepts for RN (no DOM dependency).

import { Buffer } from 'buffer';

export const PRINT_WIDTH = 384;
export const BYTES_PER_ROW = PRINT_WIDTH / 8; // 48
export const MIN_ROWS = 90;
export const FEED_LINES_DEFAULT = 10;

export function toGrayscale(rgba: Uint8Array, width: number, height: number): Float32Array {
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = rgba[i * 4];
    const g = rgba[i * 4 + 1];
    const b = rgba[i * 4 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return gray;
}

export function adjustGray(
  gray: Float32Array,
  brightness: number, // -100..100
  contrast: number, // -100..100
): Float32Array {
  const b = brightness * 1.27; // -> ~ -127..127
  const c = (contrast + 100) / 100;
  const out = new Float32Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    let v = (gray[i] - 128) * c + 128 + b;
    out[i] = v < 0 ? 0 : v > 255 ? 255 : v;
  }
  return out;
}

// Serpentine Floyd-Steinberg, threshold 128. Returns 0=white,1=black.
export function floydSteinberg(gray: Float32Array, width: number, height: number): Uint8Array {
  const buf = Float32Array.from(gray);
  const bin = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    const ltr = y % 2 === 0;
    for (let xi = 0; xi < width; xi++) {
      const x = ltr ? xi : width - 1 - xi;
      const idx = y * width + x;
      const old = buf[idx];
      const next = old < 128 ? 0 : 255;
      bin[idx] = next === 0 ? 0 : 1;
      const err = old - next;
      if (ltr) {
        if (x + 1 < width) buf[idx + 1] += (err * 7) / 16;
        if (y + 1 < height) {
          if (x > 0) buf[idx + width - 1] += (err * 3) / 16;
          buf[idx + width] += (err * 5) / 16;
          if (x + 1 < width) buf[idx + width + 1] += err / 16;
        }
      } else {
        if (x > 0) buf[idx - 1] += (err * 7) / 16;
        if (y + 1 < height) {
          if (x + 1 < width) buf[idx + width + 1] += (err * 3) / 16;
          buf[idx + width] += (err * 5) / 16;
          if (x > 0) buf[idx + width - 1] += err / 16;
        }
      }
    }
  }
  return bin;
}

// MSB-first pack: bit7 = leftmost pixel. Matches MXW01 expectation.
export function packMSBFirst(bin: Uint8Array, width: number, height: number): Uint8Array {
  const out = new Uint8Array((width / 8) * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (bin[y * width + x]) out[y * (width / 8) + (x >> 3)] |= 0x80 >> (x & 7);
    }
  }
  return out;
}

export function padToMinRows(raster: Uint8Array, height: number, feedLines = FEED_LINES_DEFAULT): { out: Uint8Array; totalRows: number } {
  const totalRows = Math.max(MIN_ROWS, height + feedLines);
  const out = new Uint8Array(totalRows * BYTES_PER_ROW);
  out.set(raster);
  return { out, totalRows };
}

// Full pipeline entry: caller supplies 384-wide RGBA (resized + frame composited upstream).
export function processForPrint(
  rgba384: Uint8Array,
  width: number,
  height: number,
  opts: { brightness?: number; contrast?: number } = {},
): Uint8Array {
  if (width !== PRINT_WIDTH) throw new Error(`width must be ${PRINT_WIDTH}, got ${width}`);
  const gray = toGrayscale(rgba384, width, height);
  const adj = adjustGray(gray, opts.brightness ?? 0, opts.contrast ?? 0);
  const bin = floydSteinberg(adj, width, height);
  return packMSBFirst(bin, width, height);
}

/**
 * Converts a 1-bit packed MSB-first raster into a standard monochrome BMP data URI.
 * Enables zero-latency, razor-sharp 1-bit dot preview in React Native Image.
 */
export function rasterToBmpDataUri(raster: Uint8Array, width: number, height: number): string {
  const rowBytes = width / 8;
  const fileSize = 62 + rowBytes * height;
  const buf = Buffer.alloc(fileSize);

  // BITMAPFILEHEADER (14 bytes)
  buf.write('BM', 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(62, 10); // Offset to image raster

  // BITMAPINFOHEADER (40 bytes)
  buf.writeUInt32LE(40, 14); // Header size
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(height, 22); // Positive height = bottom-up
  buf.writeUInt16LE(1, 26); // Planes
  buf.writeUInt16LE(1, 28); // 1-bit monochrome
  buf.writeUInt32LE(0, 30); // BI_RGB uncompressed
  buf.writeUInt32LE(rowBytes * height, 34); // Image data size
  buf.writeInt32LE(2835, 38); // ~72 DPI
  buf.writeInt32LE(2835, 42);
  buf.writeUInt32LE(2, 46); // 2 colors
  buf.writeUInt32LE(2, 50);

  // Palette: Color 0 = White (unburned), Color 1 = Black (burned dot)
  buf[54] = 0xFF;
  buf[55] = 0xFF;
  buf[56] = 0xFF;
  buf[57] = 0x00;

  buf[58] = 0x00;
  buf[59] = 0x00;
  buf[60] = 0x00;
  buf[61] = 0x00;

  // Copy scanlines in standard bottom-up BMP order
  for (let y = 0; y < height; y++) {
    const srcRow = height - 1 - y;
    const srcOffset = srcRow * rowBytes;
    const destOffset = 62 + y * rowBytes;
    buf.set(raster.subarray(srcOffset, srcOffset + rowBytes), destOffset);
  }

  return `data:image/bmp;base64,${buf.toString('base64')}`;
}

