import { Buffer } from 'buffer';
import jpeg from 'jpeg-js';
import { getFrameTemplate } from '../assets/frames/frameTemplates';

export interface RgbaImage {
  width: number;
  height: number;
  data: Uint8Array; // RGBA
}

// 5x7 ASCII bitmap font (ASCII 32 ' ' through 90 'Z', plus common symbols)
// Each char is represented by 5 columns of 7 bits
const FONT_5X7: Record<string, number[]> = {
  ' ': [0x00, 0x00, 0x00, 0x00, 0x00],
  '!': [0x00, 0x00, 0x5f, 0x00, 0x00],
  '"': [0x00, 0x07, 0x00, 0x07, 0x00],
  '#': [0x14, 0x7f, 0x14, 0x7f, 0x14],
  '$': [0x24, 0x2a, 0x7f, 0x2a, 0x12],
  '%': [0x23, 0x13, 0x08, 0x64, 0x62],
  '&': [0x36, 0x49, 0x55, 0x22, 0x50],
  "'": [0x00, 0x05, 0x03, 0x00, 0x00],
  '(': [0x00, 0x1c, 0x22, 0x41, 0x00],
  ')': [0x00, 0x41, 0x22, 0x1c, 0x00],
  '*': [0x14, 0x08, 0x3e, 0x08, 0x14],
  '+': [0x08, 0x08, 0x3e, 0x08, 0x08],
  ',': [0x00, 0x50, 0x30, 0x00, 0x00],
  '-': [0x08, 0x08, 0x08, 0x08, 0x08],
  '.': [0x00, 0x60, 0x60, 0x00, 0x00],
  '/': [0x20, 0x10, 0x08, 0x04, 0x02],
  '0': [0x3e, 0x51, 0x49, 0x45, 0x3e],
  '1': [0x00, 0x42, 0x7f, 0x40, 0x00],
  '2': [0x42, 0x61, 0x51, 0x49, 0x46],
  '3': [0x21, 0x41, 0x45, 0x4b, 0x31],
  '4': [0x18, 0x14, 0x12, 0x7f, 0x10],
  '5': [0x27, 0x45, 0x45, 0x45, 0x39],
  '6': [0x3c, 0x4a, 0x49, 0x49, 0x30],
  '7': [0x01, 0x71, 0x09, 0x05, 0x03],
  '8': [0x36, 0x49, 0x49, 0x49, 0x36],
  '9': [0x06, 0x49, 0x49, 0x29, 0x1e],
  ':': [0x00, 0x36, 0x36, 0x00, 0x00],
  ';': [0x00, 0x56, 0x36, 0x00, 0x00],
  '<': [0x08, 0x14, 0x22, 0x41, 0x00],
  '=': [0x14, 0x14, 0x14, 0x14, 0x14],
  '>': [0x00, 0x41, 0x22, 0x14, 0x08],
  '?': [0x02, 0x01, 0x51, 0x09, 0x06],
  '@': [0x32, 0x49, 0x79, 0x41, 0x3e],
  'A': [0x7e, 0x11, 0x11, 0x11, 0x7e],
  'B': [0x7f, 0x49, 0x49, 0x49, 0x36],
  'C': [0x3e, 0x41, 0x41, 0x41, 0x22],
  'D': [0x7f, 0x41, 0x41, 0x22, 0x1c],
  'E': [0x7f, 0x49, 0x49, 0x49, 0x41],
  'F': [0x7f, 0x09, 0x09, 0x09, 0x01],
  'G': [0x3e, 0x41, 0x49, 0x49, 0x7a],
  'H': [0x7f, 0x08, 0x08, 0x08, 0x7f],
  'I': [0x00, 0x41, 0x7f, 0x41, 0x00],
  'J': [0x20, 0x40, 0x41, 0x3f, 0x01],
  'K': [0x7f, 0x08, 0x14, 0x22, 0x41],
  'L': [0x7f, 0x40, 0x40, 0x40, 0x40],
  'M': [0x7f, 0x02, 0x0c, 0x02, 0x7f],
  'N': [0x7f, 0x04, 0x08, 0x10, 0x7f],
  'O': [0x3e, 0x41, 0x41, 0x41, 0x3e],
  'P': [0x7f, 0x09, 0x09, 0x09, 0x06],
  'Q': [0x3e, 0x41, 0x51, 0x21, 0x5e],
  'R': [0x7f, 0x09, 0x19, 0x29, 0x46],
  'S': [0x46, 0x49, 0x49, 0x49, 0x31],
  'T': [0x01, 0x01, 0x7f, 0x01, 0x01],
  'U': [0x3f, 0x40, 0x40, 0x40, 0x3f],
  'V': [0x1f, 0x20, 0x40, 0x20, 0x1f],
  'W': [0x7f, 0x20, 0x18, 0x20, 0x7f],
  'X': [0x63, 0x14, 0x08, 0x14, 0x63],
  'Y': [0x07, 0x08, 0x70, 0x08, 0x07],
  'Z': [0x61, 0x51, 0x49, 0x45, 0x43],
};

export class FrameCompositor {
  readonly width = 384;
  readonly height = 576;
  readonly buffer: Uint8Array;

  constructor() {
    this.buffer = new Uint8Array(this.width * this.height * 4);
    // Fill with white background (255, 255, 255, 255)
    this.buffer.fill(255);
  }

  setPixel(x: number, y: number, r = 0, g = 0, b = 0, a = 255) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = (y * this.width + x) * 4;
    this.buffer[idx] = r;
    this.buffer[idx + 1] = g;
    this.buffer[idx + 2] = b;
    this.buffer[idx + 3] = a;
  }

  fillRect(x: number, y: number, w: number, h: number, r = 0, g = 0, b = 0) {
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(this.width, Math.floor(x + w));
    const y1 = Math.min(this.height, Math.floor(y + h));

    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        this.setPixel(px, py, r, g, b, 255);
      }
    }
  }

  drawHLine(x: number, y: number, length: number, thickness = 1, r = 0, g = 0, b = 0) {
    this.fillRect(x, y, length, thickness, r, g, b);
  }

  drawDashedHLine(x: number, y: number, length: number, dashLen = 6, gapLen = 4, thickness = 1) {
    let curX = x;
    const endX = x + length;
    while (curX < endX) {
      const len = Math.min(dashLen, endX - curX);
      this.drawHLine(curX, y, len, thickness);
      curX += dashLen + gapLen;
    }
  }

  drawChar(ch: string, x: number, y: number, scale = 1, r = 0, g = 0, b = 0) {
    const glyph = FONT_5X7[ch.toUpperCase()] ?? FONT_5X7['?'] ?? [0, 0, 0, 0, 0];
    for (let col = 0; col < 5; col++) {
      const bits = glyph[col];
      for (let row = 0; row < 7; row++) {
        if ((bits >> row) & 1) {
          if (scale === 1) {
            this.setPixel(x + col, y + row, r, g, b);
          } else {
            this.fillRect(x + col * scale, y + row * scale, scale, scale, r, g, b);
          }
        }
      }
    }
  }

  drawText(text: string, x: number, y: number, scale = 1, r = 0, g = 0, b = 0) {
    const charW = (5 + 1) * scale;
    for (let i = 0; i < text.length; i++) {
      this.drawChar(text[i], x + i * charW, y, scale, r, g, b);
    }
  }

  drawCenteredText(text: string, y: number, scale = 1, r = 0, g = 0, b = 0) {
    const charW = (5 + 1) * scale;
    const totalW = text.length * charW - scale;
    const x = Math.max(0, Math.floor((this.width - totalW) / 2));
    this.drawText(text, x, y, scale, r, g, b);
  }

  drawBarcode(x: number, y: number, width: number, height: number) {
    // Seeded aesthetic barcode pattern
    const pattern = [2, 1, 3, 1, 1, 2, 4, 1, 2, 3, 1, 2, 1, 3, 2, 1, 4, 1, 2, 1, 3, 1, 2, 4, 1, 1, 3, 2];
    let curX = x;
    const maxX = x + width;
    let isBar = true;
    let pIdx = 0;

    while (curX < maxX) {
      const barW = pattern[pIdx % pattern.length];
      const w = Math.min(barW, maxX - curX);
      if (isBar) {
        this.fillRect(curX, y, w, height, 0, 0, 0);
      }
      curX += w;
      isBar = !isBar;
      pIdx++;
    }
  }

  drawPhoto(photo: RgbaImage, destX: number, destY: number, destW: number, destH: number) {
    // Aspect fill / center-crop photo into destination viewport
    const scale = Math.max(destW / photo.width, destH / photo.height);
    const cropW = destW / scale;
    const cropH = destH / scale;
    const srcX0 = (photo.width - cropW) / 2;
    const srcY0 = (photo.height - cropH) / 2;

    for (let dy = 0; dy < destH; dy++) {
      const sy = Math.floor(srcY0 + dy / scale);
      if (sy < 0 || sy >= photo.height) continue;

      for (let dx = 0; dx < destW; dx++) {
        const sx = Math.floor(srcX0 + dx / scale);
        if (sx < 0 || sx >= photo.width) continue;

        const sIdx = (sy * photo.width + sx) * 4;
        this.setPixel(
          destX + dx,
          destY + dy,
          photo.data[sIdx],
          photo.data[sIdx + 1],
          photo.data[sIdx + 2],
          photo.data[sIdx + 3],
        );
      }
    }
  }
}

/**
 * Generate a synthetic placeholder RGBA image if no camera photo is captured yet.
 */
export function generateSyntheticPhoto(width = 384, height = 384): RgbaImage {
  const data = new Uint8Array(width * height * 4);
  const cx = width / 2;
  const cy = height / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Cute photobooth smiley portrait silhouette
      const isHead = dist < 70;
      const isBody = dist < 120 && dy > 40;
      const isEye1 = Math.abs(x - (cx - 24)) < 8 && Math.abs(y - (cy - 10)) < 12;
      const isEye2 = Math.abs(x - (cx + 24)) < 8 && Math.abs(y - (cy - 10)) < 12;
      const isSmile = dy > 15 && dy < 35 && Math.abs(dx) < 32 && (dx * dx) / 900 + (dy - 15) > 10;

      let gray = 220; // light background
      if ((isHead || isBody) && !isEye1 && !isEye2 && !isSmile) {
        gray = 60; // subject silhouette
      } else if (isEye1 || isEye2 || isSmile) {
        gray = 255; // eyes & smile
      }

      data[idx] = gray;
      data[idx + 1] = gray;
      data[idx + 2] = gray;
      data[idx + 3] = 255;
    }
  }

  return { width, height, data };
}

/**
 * Composites photo with the chosen frame layout into a 384x576 RGBA image.
 */
export function compositeFrame(photo: RgbaImage, frameId: string): Uint8Array {
  const comp = new FrameCompositor();
  const template = getFrameTemplate(frameId);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).toUpperCase();
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // Outer border (clean double line)
  comp.drawHLine(8, 8, comp.width - 16, 2);
  comp.drawHLine(8, comp.height - 10, comp.width - 16, 2);
  comp.fillRect(8, 8, 2, comp.height - 16);
  comp.fillRect(comp.width - 10, 8, 2, comp.height - 16);

  // Header
  comp.drawCenteredText(template.headerText, 22, 2);
  comp.drawDashedHLine(16, 44, comp.width - 32, 5, 3, 1);
  comp.drawCenteredText(`${dateStr}  ${timeStr}`, 52, 1);

  // Photo Window Cutout
  const photoX = 18;
  const photoY = 68;
  const photoW = comp.width - 36; // 348px
  const photoH = 390; // 390px

  // Draw Photo
  comp.drawPhoto(photo, photoX, photoY, photoW, photoH);

  // Photo outline border
  comp.fillRect(photoX - 1, photoY - 1, photoW + 2, 1);
  comp.fillRect(photoX - 1, photoY + photoH, photoW + 2, 1);
  comp.fillRect(photoX - 1, photoY - 1, 1, photoH + 2);
  comp.fillRect(photoX + photoW, photoY - 1, 1, photoH + 2);

  // Footer Area
  const footerY = photoY + photoH + 12;
  comp.drawDashedHLine(16, footerY, comp.width - 32, 5, 3, 1);
  comp.drawCenteredText(template.footerText, footerY + 10, 1);

  if (template.barcode) {
    comp.drawBarcode(50, footerY + 24, comp.width - 100, 18);
    comp.drawCenteredText(`* MONO-${template.id.toUpperCase()}-2026 *`, footerY + 46, 1);
  } else {
    comp.drawCenteredText('★ ★ ★ ★ ★', footerY + 24, 2);
    comp.drawCenteredText('* MEMORIES IN PRINT *', footerY + 46, 1);
  }

  return comp.buffer;
}

/**
 * Decodes a JPEG binary buffer into RGBA image.
 */
export function decodeJpegBytes(bytes: Uint8Array): RgbaImage {
  const buf = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoded = jpeg.decode(buf, { useTArray: true });
  return {
    width: decoded.width,
    height: decoded.height,
    data: decoded.data,
  };
}
