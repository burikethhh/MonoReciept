import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getFrameTemplate } from '../assets/frames/frameTemplates';

interface FrameGhostProps {
  frameId: string;
}

export function FrameGhost({ frameId }: FrameGhostProps) {
  const template = getFrameTemplate(frameId);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <View style={styles.overlayContainer} pointerEvents="none">
      {/* Outer frame matching 384x576 aspect ratio */}
      <View style={[styles.frameBox, { aspectRatio: template.aspectRatio }]}>
        {/* Frame Header Ghost */}
        <View style={styles.headerArea}>
          <Text style={styles.headerText}>{template.headerText}</Text>
          <View style={styles.dashLine} />
          <Text style={styles.dateText}>{`${dateStr} • ${timeStr}`}</Text>
        </View>

        {/* Center Live Photo Cutout with Corner Guides */}
        <View style={styles.photoViewport}>
          {/* Top-Left Corner */}
          <View style={[styles.corner, styles.cornerTL]} />
          {/* Top-Right Corner */}
          <View style={[styles.corner, styles.cornerTR]} />
          {/* Bottom-Left Corner */}
          <View style={[styles.corner, styles.cornerBL]} />
          {/* Bottom-Right Corner */}
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        {/* Frame Footer Ghost */}
        <View style={styles.footerArea}>
          <View style={styles.dashLine} />
          <Text style={styles.footerText}>{template.footerText}</Text>
          {template.barcode ? (
            <View style={styles.barcodeBox}>
              <View style={styles.barcodeLines} />
              <Text style={styles.barcodeText}>* MONO - {template.id.toUpperCase()} *</Text>
            </View>
          ) : (
            <Text style={styles.ornamentText}>✦ ✦ ✦</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const CORNER_SIZE = 16;
const CORNER_BORDER = 2.5;

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)', // Dims outside the print frame
  },
  frameBox: {
    width: '85%',
    maxHeight: '88%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 8,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 10,
  },
  headerArea: {
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 4,
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  dashLine: {
    width: '90%',
    height: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  dateText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
  },
  photoViewport: {
    flex: 1,
    position: 'relative',
    marginVertical: 8,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#FFFFFF',
  },
  cornerTL: {
    top: 4,
    left: 4,
    borderTopWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
  },
  cornerTR: {
    top: 4,
    right: 4,
    borderTopWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
  },
  cornerBL: {
    bottom: 4,
    left: 4,
    borderBottomWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
  },
  cornerBR: {
    bottom: 4,
    right: 4,
    borderBottomWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
  },
  footerArea: {
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 4,
  },
  footerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginVertical: 2,
  },
  barcodeBox: {
    alignItems: 'center',
    marginTop: 2,
  },
  barcodeLines: {
    width: 90,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 2,
  },
  barcodeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 8,
    letterSpacing: 1,
    marginTop: 2,
    fontWeight: '600',
  },
  ornamentText: {
    color: '#FFFFFF',
    fontSize: 10,
    letterSpacing: 4,
    marginTop: 2,
  },
});
