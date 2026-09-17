import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useBoothStore } from '../store/useBoothStore';
import { processForPrint, rasterToBmpDataUri, PRINT_WIDTH } from '../services/ImagePipeline';
import {
  compositeFrame,
  decodeJpegBytes,
  generateSyntheticPhoto,
  RgbaImage,
} from '../services/FrameCompositor';
import { FRAME_TEMPLATES, getFrameTemplate } from '../assets/frames/frameTemplates';
import { TouchSlider } from '../components/TouchSlider';
import { PrintSheet } from '../components/PrintSheet';
import { Colors, Typography, Radii, Shadows } from '../theme/theme';

export function PreviewScreen() {
  const { photoUri, frameId, brightness, contrast, set } = useBoothStore();

  const [photo, setPhoto] = useState<RgbaImage | null>(null);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(true);
  const [showPrintSheet, setShowPrintSheet] = useState(false);

  // Load photo from photoUri (or synthetic fallback)
  useEffect(() => {
    let isCancelled = false;

    async function loadPhoto() {
      setIsLoadingPhoto(true);

      if (!photoUri) {
        if (!isCancelled) {
          setPhoto(generateSyntheticPhoto());
          setIsLoadingPhoto(false);
        }
        return;
      }

      try {
        const response = await fetch(photoUri);
        const arrayBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const decoded = decodeJpegBytes(bytes);

        if (!isCancelled) {
          setPhoto(decoded);
          setIsLoadingPhoto(false);
        }
      } catch (err) {
        console.warn('[PreviewScreen] Failed to decode photoUri, using fallback synthetic photo:', err);
        if (!isCancelled) {
          setPhoto(generateSyntheticPhoto());
          setIsLoadingPhoto(false);
        }
      }
    }

    loadPhoto();

    return () => {
      isCancelled = true;
    };
  }, [photoUri]);

  // Live composite & Floyd-Steinberg dithering
  const { raster, bmpUri } = useMemo(() => {
    const currentPhoto = photo ?? generateSyntheticPhoto();
    const frameRgba = compositeFrame(currentPhoto, frameId);
    const height = 576;

    const packedRaster = processForPrint(frameRgba, PRINT_WIDTH, height, {
      brightness,
      contrast,
    });

    const dataUri = rasterToBmpDataUri(packedRaster, PRINT_WIDTH, height);

    return {
      raster: packedRaster,
      bmpUri: dataUri,
    };
  }, [photo, frameId, brightness, contrast]);

  const handleRetake = useCallback(() => {
    set({ photoUri: null, phase: 'capturing' });
  }, [set]);

  const handleResetAdjustments = useCallback(() => {
    set({ brightness: 0, contrast: 0 });
  }, [set]);

  const handleSelectFrame = (id: string) => {
    set({ frameId: id });
  };

  const currentTemplate = getFrameTemplate(frameId);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Screen Header */}
        <View style={styles.header}>
          <Text style={styles.headerBadge}>MONOCHROME PRINT PREVIEW</Text>
          <Text style={styles.headerTitle}>Review Your Portrait</Text>
          <View style={styles.goldDivider} />
          <Text style={styles.headerSubtitle}>
            1-bit Floyd-Steinberg error diffusion simulated for MXW01 thermal roll
          </Text>
        </View>

        {/* Frame Switcher Tabs */}
        <View style={styles.frameSwitcher}>
          {Object.values(FRAME_TEMPLATES).map(tmpl => {
            const isSelected = frameId === tmpl.id;
            return (
              <Pressable
                key={tmpl.id}
                style={[
                  styles.frameTab,
                  isSelected && styles.frameTabSelected,
                ]}
                onPress={() => handleSelectFrame(tmpl.id)}
              >
                <Text
                  style={[
                    styles.frameTabText,
                    isSelected && styles.frameTabTextSelected,
                  ]}
                >
                  {tmpl.name.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Dithered Paper Receipt Preview */}
        <View style={styles.receiptContainer}>
          <View style={styles.receiptPaper}>
            {/* Top Zig-Zag or Cut Header Bar */}
            <View style={styles.receiptEdgeTop} />

            {isLoadingPhoto ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.inkPrimary} />
                <Text style={styles.loadingText}>RENDERING DITHER...</Text>
              </View>
            ) : (
              <Image
                source={{ uri: bmpUri }}
                style={styles.receiptImage}
                resizeMode="contain"
              />
            )}

            {/* Bottom Edge */}
            <View style={styles.receiptEdgeBottom} />
          </View>
        </View>

        {/* Adjustment Sliders Card */}
        <View style={styles.adjustmentsCard}>
          <View style={styles.adjustmentsHeader}>
            <Text style={styles.cardTitle}>PRINT TONE ADJUSTMENTS</Text>
            {(brightness !== 0 || contrast !== 0) && (
              <Pressable onPress={handleResetAdjustments}>
                <Text style={styles.resetButtonText}>RESET</Text>
              </Pressable>
            )}
          </View>

          {/* Brightness Slider */}
          <TouchSlider
            label="Brightness"
            value={brightness}
            min={-50}
            max={50}
            step={5}
            onChange={val => set({ brightness: val })}
          />

          {/* Contrast Slider */}
          <TouchSlider
            label="Contrast"
            value={contrast}
            min={-50}
            max={50}
            step={5}
            onChange={val => set({ contrast: val })}
          />
        </View>

        {/* Primary Action Buttons */}
        <View style={styles.actionsContainer}>
          <Pressable
            style={styles.retakeButton}
            onPress={handleRetake}
          >
            <Text style={styles.retakeButtonText}>← RETAKE</Text>
          </Pressable>

          <Pressable
            style={styles.printButton}
            onPress={() => setShowPrintSheet(true)}
          >
            <Text style={styles.printButtonText}>PRINT RECEIPT</Text>
            <Text style={styles.printChevron}>›</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Print Confirmation Bottom Sheet / Modal */}
      <Modal
        visible={showPrintSheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPrintSheet(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalBadge}>DISPATCH TO MXW01</Text>
                <Text style={styles.modalTitle}>Print Configuration</Text>
              </View>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowPrintSheet(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <PrintSheet raster={raster} height={576} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgKiosk,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
  },
  headerBadge: {
    fontSize: 9,
    fontFamily: Typography.sansMedium,
    color: Colors.goldDark,
    letterSpacing: Typography.trackingExtraWide,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: Typography.serif,
    fontWeight: '700',
    color: Colors.inkPrimary,
  },
  goldDivider: {
    width: 36,
    height: 1.5,
    backgroundColor: Colors.gold,
    marginVertical: 8,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.inkSecondary,
    textAlign: 'center',
    fontFamily: Typography.serif,
    fontStyle: 'italic',
  },
  frameSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceWarm,
    borderRadius: Radii.pill,
    padding: 4,
    marginBottom: 20,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  frameTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: Radii.pill,
  },
  frameTabSelected: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    shadowColor: Colors.inkPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  frameTabText: {
    fontSize: 10,
    fontFamily: Typography.sansMedium,
    color: Colors.inkSecondary,
    letterSpacing: Typography.trackingWide,
  },
  frameTabTextSelected: {
    color: Colors.inkPrimary,
    fontWeight: '700',
  },
  receiptContainer: {
    width: '100%',
    maxWidth: 384,
    alignItems: 'center',
    marginBottom: 20,
  },
  receiptPaper: {
    width: '100%',
    backgroundColor: Colors.paperBg,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.paperBorder,
    ...Shadows.cardFloating,
    overflow: 'hidden',
  },
  receiptEdgeTop: {
    height: 6,
    backgroundColor: Colors.borderLight,
  },
  receiptEdgeBottom: {
    height: 6,
    backgroundColor: Colors.borderLight,
  },
  receiptImage: {
    width: '100%',
    aspectRatio: 384 / 576,
    backgroundColor: Colors.paperBg,
  },
  loadingContainer: {
    width: '100%',
    aspectRatio: 384 / 576,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.paperBg,
  },
  loadingText: {
    fontSize: 10,
    fontFamily: Typography.sansMedium,
    color: Colors.inkSecondary,
    letterSpacing: 1.5,
  },
  adjustmentsCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    ...Shadows.card,
  },
  adjustmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 10,
    fontFamily: Typography.sansMedium,
    color: Colors.inkSecondary,
    letterSpacing: Typography.trackingWide,
  },
  resetButtonText: {
    fontSize: 10,
    fontFamily: Typography.sansMedium,
    color: Colors.goldDark,
    letterSpacing: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 420,
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.inkPrimary,
    paddingVertical: 14,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeButtonText: {
    fontSize: 11,
    fontFamily: Typography.sansMedium,
    color: Colors.inkPrimary,
    letterSpacing: Typography.trackingWide,
  },
  printButton: {
    flex: 1.4,
    backgroundColor: Colors.inkPrimary,
    paddingVertical: 14,
    borderRadius: Radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.inkPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  printButtonText: {
    fontSize: 11,
    fontFamily: Typography.sansMedium,
    color: Colors.surface,
    letterSpacing: Typography.trackingWide,
  },
  printChevron: {
    fontSize: 14,
    color: Colors.gold,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlayDark,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
    ...Shadows.sheet,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalBadge: {
    fontSize: 9,
    fontFamily: Typography.sansMedium,
    color: Colors.goldDark,
    letterSpacing: Typography.trackingExtraWide,
    marginBottom: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Typography.serif,
    fontWeight: '700',
    color: Colors.inkPrimary,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceWarm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkSecondary,
  },
});
