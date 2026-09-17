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

export function PreviewScreen() {
  const { photoUri, frameId, brightness, contrast, set, reset } = useBoothStore();

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
          <Text style={styles.headerBadge}>THERMAL RECEIPT PREVIEW</Text>
          <Text style={styles.headerTitle}>Review Your Print</Text>
          <Text style={styles.headerSubtitle}>
            1-bit Floyd-Steinberg dither simulated for MXW01 thermal paper
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
                <ActivityIndicator size="large" color="#1E1E24" />
                <Text style={styles.loadingText}>Rendering Dither...</Text>
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
            <Text style={styles.cardTitle}>Print Tone Adjustments</Text>
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
            <Text style={styles.retakeButtonText}>← RETAKE PHOTO</Text>
          </Pressable>

          <Pressable
            style={styles.printButton}
            onPress={() => setShowPrintSheet(true)}
          >
            <Text style={styles.printButtonText}>PRINT MEMORY ➔</Text>
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
              <Text style={styles.modalTitle}>Print Settings</Text>
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
    backgroundColor: '#FFF7F0',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E06D53',
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E1E24',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666670',
    marginTop: 4,
    textAlign: 'center',
  },
  frameSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#EAEAE6',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    width: '100%',
    maxWidth: 420,
  },
  frameTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  frameTabSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  frameTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#77777E',
    letterSpacing: 1,
  },
  frameTabTextSelected: {
    color: '#1E1E24',
    fontWeight: '800',
  },
  receiptContainer: {
    width: '100%',
    maxWidth: 384,
    alignItems: 'center',
    marginBottom: 20,
  },
  receiptPaper: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E2DC',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },
  receiptEdgeTop: {
    height: 6,
    backgroundColor: '#EAEAE4',
  },
  receiptEdgeBottom: {
    height: 8,
    backgroundColor: '#EAEAE4',
  },
  receiptImage: {
    width: '100%',
    aspectRatio: 384 / 576,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    width: '100%',
    aspectRatio: 384 / 576,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666670',
    letterSpacing: 0.5,
  },
  adjustmentsCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  adjustmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1E24',
    letterSpacing: 0.5,
  },
  resetButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E06D53',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1E1E24',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E1E24',
    letterSpacing: 1,
  },
  printButton: {
    flex: 1.3,
    backgroundColor: '#1E1E24',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  printButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E1E24',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666670',
  },
});
