import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useBoothStore } from '../store/useBoothStore';
import { printerService } from '../services/PrinterService';

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
    setProgress('Preparing printer...');

    try {
      for (let c = 0; c < copies; c++) {
        await printerService.print(raster, height, density, (i, n) => {
          setProgress(`Printing ${c + 1}/${copies} • ${Math.round((i / n) * 100)}%`);
        });
      }
      setProgress('Print complete!');
    } catch (err) {
      console.warn('[PrintSheet] Print error:', err);
      setProgress('Print failed. Ensure printer is connected.');
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <View style={styles.sheetContent}>
      {/* Copies Selector */}
      <View style={styles.controlSection}>
        <Text style={styles.sectionLabel}>NUMBER OF COPIES</Text>
        <View style={styles.counterRow}>
          <Pressable
            style={({ pressed }) => [styles.counterButton, pressed && styles.buttonPressed]}
            onPress={() => handleStepCopies(-1)}
            disabled={isPrinting || copies <= 1}
          >
            <Text style={styles.counterButtonText}>-</Text>
          </Pressable>

          <View style={styles.counterValueBox}>
            <Text style={styles.counterValueText}>{copies}</Text>
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
        <Text style={styles.sectionLabel}>PRINT DENSITY (THERMAL HEAT)</Text>
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
          {isPrinting && <ActivityIndicator size="small" color="#1E1E24" style={styles.spinner} />}
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
          {isPrinting ? 'SENDING TO PRINTER...' : 'CONFIRM & PRINT'}
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
    fontSize: 11,
    fontWeight: '800',
    color: '#666670',
    letterSpacing: 1,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EAEAE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E1E24',
    lineHeight: 26,
  },
  counterValueBox: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#F7F7F4',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E2DC',
    minWidth: 70,
    alignItems: 'center',
  },
  counterValueText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E1E24',
  },
  densityRow: {
    flexDirection: 'row',
    backgroundColor: '#EAEAE6',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  densityTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  densityTabSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  densityTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#77777E',
    letterSpacing: 0.8,
  },
  densityTabTextSelected: {
    color: '#1E1E24',
    fontWeight: '800',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  spinner: {
    marginRight: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E1E24',
  },
  printActionButton: {
    backgroundColor: '#E06D53', // Terracotta accent
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E06D53',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  printActionButtonDisabled: {
    backgroundColor: '#999999',
    shadowOpacity: 0,
  },
  printActionText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});
