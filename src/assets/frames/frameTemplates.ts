export interface FrameTemplate {
  id: string;
  name: string;
  subtitle: string;
  width: number;
  height: number;
  headerText: string;
  footerText: string;
  barcode: boolean;
  aspectRatio: number; // width / height
}

export const FRAME_TEMPLATES: Record<string, FrameTemplate> = {
  event01: {
    id: 'event01',
    name: 'Classic Atelier',
    subtitle: 'Timeless Didone typography with formal receipt header & barcode',
    width: 384,
    height: 576,
    aspectRatio: 384 / 576, // 2:3
    headerText: 'MONORECEIPT • ATELIER EDITION',
    footerText: 'MEMORIES PRESERVED IN INK',
    barcode: true,
  },
  event02: {
    id: 'event02',
    name: 'Botanical Gala',
    subtitle: 'Formal gala edition with fine-line floral ornaments & date stamp',
    width: 384,
    height: 576,
    aspectRatio: 384 / 576, // 2:3
    headerText: '✦ BOTANICAL GALA ✦',
    footerText: 'MONORECEIPT • SPECIAL COMMEMORATIVE',
    barcode: false,
  },
};

export const DEFAULT_FRAME_ID = 'event01';

export function getFrameTemplate(id: string): FrameTemplate {
  return FRAME_TEMPLATES[id] ?? FRAME_TEMPLATES[DEFAULT_FRAME_ID];
}
