import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useBoothStore } from '../store/useBoothStore';
import { printerService } from '../services/PrinterService';
import { Colors, Typography, Radii, Shadows } from '../theme/theme';

export function PrintSheet({
  raster,
  height,
}: {
  raster: Uint8Array;
  height: number;
}) {
  const { copies, density, set } = useBoothStore();
  const [progress, setProgress] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handleStepCopies = (delta: number) => {
    const next = Math.max(1, Math.min(5, copies + delta));
    set({ copies: next });
  };

  const densities: Array<'Low' | 'Medium' | 'High'> = ['Low', 'Medium', 'High'];

  const handlePrint = async () => {
    if (isPrinting) return;
    setIsPrinting(true);
    setProgress('Preparing thermal printer...');

    try {
      for (let c = 0; c < copies; c++) {
        await printerService.print(raster, height, density, (i, n) => {
          setProgress(`Printing ${c + 1} of ${copies} • ${Math.round((i / n) * 100)}%`);
        });
      }
      setProgress('Print dispatched successfully!');
    } catch (err) {
      console.warn('[PrintSheet] Print error:', err);
      setProgress('Print failed. Verify printer connection.');
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <View style={styles.sheetContent}>
      {/* Copies Selector */}
      <View style={styles.controlSection}>
        <Text style={styles.sectionLabel}>PRINT QUANTITY</Text>
        <View style={styles.counterRow}>
          <Pressable
            style={({ pressed }) => [styles.counterButton, pressed && styles.buttonPressed]}
            onPress={() => handleStepCopies(-1)}
            disabled={isPrinting || copies <= 1}
          >
            <Text style={styles.counterButtonText}>−</Text>
          </Pressable>

          <View style={styles.counterValueBox}>
            <Text style={styles.counterValueText}>{copies}</Text>
            <Text style={styles.counterUnitText}>{copies === 1 ? 'COPY' : 'COPIES'}</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.counterButton, pressed && styles.buttonPressed]}
            onPress={() => handleStepCopies(1)}
            disabled={isPrinting || copies >= 5}
          >
            <Text style={styles.counterButtonText}>+</Text>
          </Pressable>
        </View>
      </View>

      {/* Density Segmented Control */}
      <View style={styles.controlSection}>
        <Text style={styles.sectionLabel}>THERMAL HEAT DENSITY</Text>
        <View style={styles.densityRow}>
          {densities.map(d => {
            const isSelected = density === d;
            return (
              <Pressable
                key={d}
                style={[styles.densityTab, isSelected && styles.densityTabSelected]}
                onPress={() => set({ density: d })}
                disabled={isPrinting}
              >
                <Text
                  style={[
                    styles.densityTabText,
                    isSelected && styles.densityTabTextSelected,
                  ]}
                >
                  {d.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Progress Status */}
      {progress !== null && (
        <View style={styles.progressContainer}>
          {isPrinting && <ActivityIndicator size="small" color={Colors.gold} style={styles.spinner} />}
          <Text style={styles.progressText}>{progress}</Text>
        </View>
      )}

      {/* Print Trigger Button */}
      <Pressable
        style={({ pressed }) => [
          styles.printActionButton,
          isPrinting && styles.printActionButtonDisabled,
          pressed && !isPrinting && styles.buttonPressed,
        ]}
        onPress={handlePrint}
        disabled={isPrinting}
      >
        <Text style={styles.printActionText}>
          {isPrinting ? 'PRINTING RECEIPT...' : 'CONFIRM & PRINT RECEIPT'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    gap: 20,
  },
  controlSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: Typography.sansMedium,
    color: Colors.inkSecondary,
    letterSpacing: Typography.trackingWide,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterButton: {
    width: 44,
    height: 44,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surfaceWarm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.inkPrimary,
    lineHeight: 22,
  },
  counterValueBox: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: Colors.surfaceWarm,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValueText: {
    fontSize: 20,
    fontFamily: Typography.mono,
    fontWeight: '700',
    color: Colors.inkPrimary,
  },
  counterUnitText: {
    fontSize: 8,
    fontFamily: Typography.sansMedium,
    color: Colors.inkSecondary,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  densityRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceWarm,
    borderRadius: Radii.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  densityTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radii.pill,
  },
  densityTabSelected: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    shadowColor: Colors.inkPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  densityTabText: {
    fontSize: 10,
    fontFamily: Typography.sansMedium,
    color: Colors.inkSecondary,
    letterSpacing: Typography.trackingWide,
  },
  densityTabTextSelected: {
    color: Colors.inkPrimary,
    fontWeight: '700',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: Colors.goldLight,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    gap: 8,
  },
  spinner: {
    marginRight: 4,
  },
  progressText: {
    fontSize: 11,
    fontFamily: Typography.sansMedium,
    color: Colors.goldDark,
    letterSpacing: 0.5,
  },
  printActionButton: {
    backgroundColor: Colors.inkPrimary,
    paddingVertical: 16,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.inkPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  printActionButtonDisabled: {
    backgroundColor: Colors.inkLight,
    shadowOpacity: 0,
  },
  printActionText: {
    fontSize: 12,
    fontFamily: Typography.sansMedium,
    color: Colors.surface,
    letterSpacing: Typography.trackingWide,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
});
