import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getFrameTemplate } from '../assets/frames/frameTemplates';
import { Colors, Typography } from '../theme/theme';

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
            <Text style={styles.ornamentText}>✦  LILY ATELIER  ✦</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const CORNER_SIZE = 18;
const CORNER_BORDER = 2;

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18, 18, 18, 0.45)', // Dims outside the print frame
  },
  frameBox: {
    width: '85%',
    maxHeight: '88%',
    borderWidth: 1.5,
    borderColor: 'rgba(197, 168, 128, 0.65)', // Elegant champagne border
    borderRadius: 8,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 12,
  },
  headerArea: {
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: 'rgba(18, 18, 18, 0.35)',
    borderRadius: 4,
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: Typography.serif,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  dashLine: {
    width: '85%',
    height: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(197, 168, 128, 0.4)',
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  dateText: {
    color: Colors.goldLight,
    fontSize: 9,
    fontFamily: Typography.mono,
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
    borderColor: Colors.gold,
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
    backgroundColor: 'rgba(18, 18, 18, 0.35)',
    borderRadius: 4,
  },
  footerText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: Typography.sansMedium,
    letterSpacing: 1.5,
    marginVertical: 2,
  },
  barcodeBox: {
    alignItems: 'center',
    marginTop: 2,
  },
  barcodeLines: {
    width: 84,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 2,
  },
  barcodeText: {
    color: Colors.goldLight,
    fontSize: 7,
    fontFamily: Typography.mono,
    letterSpacing: 1,
    marginTop: 2,
  },
  ornamentText: {
    color: Colors.gold,
    fontSize: 8,
    fontFamily: Typography.sansMedium,
    letterSpacing: 2,
    marginTop: 2,
  },
});
