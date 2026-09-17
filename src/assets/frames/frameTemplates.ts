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
    name: 'Classic Receipt',
    subtitle: 'Timeless mono print with receipt header & barcode',
    width: 384,
    height: 576,
    aspectRatio: 384 / 576, // 2:3
    headerText: 'MONORECIEPT ★ OFFICIAL',
    footerText: 'THANK YOU FOR VISITING',
    barcode: true,
  },
  event02: {
    id: 'event02',
    name: 'Party Memories',
    subtitle: 'Celebration edition with star ornaments & timestamp',
    width: 384,
    height: 576,
    aspectRatio: 384 / 576, // 2:3
    headerText: '★ PARTY PHOTOBOOTH ★',
    footerText: 'MEMORIES LAST FOREVER',
    barcode: false,
  },
};

export const DEFAULT_FRAME_ID = 'event01';

export function getFrameTemplate(id: string): FrameTemplate {
  return FRAME_TEMPLATES[id] ?? FRAME_TEMPLATES[DEFAULT_FRAME_ID];
}
