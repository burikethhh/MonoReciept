import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useBoothStore } from '../store/useBoothStore';
import { StorageService } from '../services/StorageService';
import { printerService } from '../services/PrinterService';
import { Colors, Typography, Radii, Shadows } from '../theme/theme';

export function SettingsScreen() {
  const {
    density,
    copies,
    keepAwakeEnabled,
    immersiveEnabled,
    printerConnected,
    printerDeviceName,
    printerBattery,
    set,
  } = useBoothStore();

  const [v5xKey, setV5xKey] = useState(StorageService.getV5XSecretKey());
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [isTestPrinting, setIsTestPrinting] = useState(false);
  const [testProgress, setTestProgress] = useState<string | null>(null);

  // PIN Change State
  const [showPinChange, setShowPinChange] = useState(false);
  const [newPin, setNewPin] = useState('');

  const densities: Array<'Low' | 'Medium' | 'High'> = ['Low', 'Medium', 'High'];

  const handleDensityChange = (d: 'Low' | 'Medium' | 'High') => {
    StorageService.setDefaultDensity(d);
    set({ density: d });
  };

  const handleCopiesChange = (delta: number) => {
    const next = Math.max(1, Math.min(5, copies + delta));
    StorageService.setDefaultCopies(next);
    set({ copies: next });
  };

  const handleToggleKeepAwake = (val: boolean) => {
    StorageService.setKeepAwakeEnabled(val);
    set({ keepAwakeEnabled: val });
  };

  const handleToggleImmersive = (val: boolean) => {
    StorageService.setImmersiveEnabled(val);
    set({ immersiveEnabled: val });
  };

  const handleSaveV5xKey = () => {
    StorageService.setV5XSecretKey(v5xKey);
    setIsEditingKey(false);
    Alert.alert('V5X Key Updated', `Secret key set to "${v5xKey}"`);
  };

  const handleSaveNewPin = () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      Alert.alert('Invalid PIN', 'Passcode must be exactly 4 digits.');
      return;
    }
    StorageService.setOperatorPin(newPin);
    setShowPinChange(false);
    setNewPin('');
    Alert.alert('Passcode Updated', 'Operator PIN successfully changed.');
  };

  const handleTestPrint = async () => {
    if (!printerConnected) {
      Alert.alert('Printer Disconnected', 'Please connect an MXW01 printer first.');
      return;
    }

    setIsTestPrinting(true);
    setTestProgress('Generating diagnostic pattern...');

    try {
      await printerService.printTestReceipt((i, n) => {
        setTestProgress(`Printing diagnostic • ${Math.round((i / n) * 100)}%`);
      });
      setTestProgress('Test print complete!');
    } catch (err) {
      console.warn('[SettingsScreen] Test print failed:', err);
      setTestProgress('Test print failed.');
    } finally {
      setIsTestPrinting(false);
    }
  };

  const handleExit = () => {
    set({ phase: 'idle' });
  };

  const lastMac = StorageService.getLastPrinterMac();

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerBadge}>ADMINISTRATION</Text>
            <Text style={styles.headerTitle}>Operator Settings</Text>
          </View>
          <Pressable style={styles.exitButton} onPress={handleExit}>
            <Text style={styles.exitButtonText}>EXIT TO BOOTH ➔</Text>
          </Pressable>
        </View>

        {/* Printer Hardware Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>THERMAL PRINTER HARDWARE</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: printerConnected ? Colors.statusConnected : Colors.statusScanning },
                ]}
              />
              <Text style={styles.statusText}>
                {printerConnected ? `Connected (${printerDeviceName})` : 'Disconnected'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Paired MAC</Text>
            <Text style={styles.infoValue}>{lastMac ?? 'None'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Battery Level</Text>
            <Text style={styles.infoValue}>{printerConnected ? `${printerBattery}%` : 'N/A'}</Text>
          </View>

          {/* Default Print Density */}
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>Default Heat Density</Text>
            <View style={styles.segmentedRow}>
              {densities.map(d => {
                const isSelected = density === d;
                return (
                  <Pressable
                    key={d}
                    style={[styles.segmentTab, isSelected && styles.segmentTabSelected]}
                    onPress={() => handleDensityChange(d)}
                  >
                    <Text
                      style={[
                        styles.segmentTabText,
                        isSelected && styles.segmentTabTextSelected,
                      ]}
                    >
                      {d.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Default Copies */}
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>Default Copy Count</Text>
            <View style={styles.counterRow}>
              <Pressable
                style={styles.stepButton}
                onPress={() => handleCopiesChange(-1)}
                disabled={copies <= 1}
              >
                <Text style={styles.stepButtonText}>-</Text>
              </Pressable>
              <View style={styles.counterBox}>
                <Text style={styles.counterText}>{copies}</Text>
              </View>
              <Pressable
                style={styles.stepButton}
                onPress={() => handleCopiesChange(1)}
                disabled={copies >= 5}
              >
                <Text style={styles.stepButtonText}>+</Text>
              </Pressable>
            </View>
          </View>

          {/* V5X Secret Key Editor */}
          <View style={styles.controlGroup}>
            <View style={styles.subHeaderRow}>
              <Text style={styles.controlLabel}>V5X HMAC Secret Key</Text>
              <Pressable onPress={() => setIsEditingKey(!isEditingKey)}>
                <Text style={styles.linkText}>{isEditingKey ? 'CANCEL' : 'EDIT'}</Text>
              </Pressable>
            </View>
            {isEditingKey ? (
              <View style={styles.keyEditRow}>
                <TextInput
                  style={styles.keyInput}
                  value={v5xKey}
                  onChangeText={setV5xKey}
                  placeholder="Enter V5X Secret"
                  autoCapitalize="none"
                />
                <Pressable style={styles.saveKeyButton} onPress={handleSaveV5xKey}>
                  <Text style={styles.saveKeyButtonText}>SAVE</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.keyValueText}>{v5xKey}</Text>
            )}
          </View>

          {/* Test Print Button */}
          <View style={styles.testPrintArea}>
            <Pressable
              style={({ pressed }) => [
                styles.testPrintButton,
                isTestPrinting && styles.testPrintButtonDisabled,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleTestPrint}
              disabled={isTestPrinting}
            >
              {isTestPrinting ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
              ) : null}
              <Text style={styles.testPrintButtonText}>
                {isTestPrinting ? 'PRINTING TEST...' : 'PRINT DIAGNOSTIC RECEIPT'}
              </Text>
            </Pressable>
            {testProgress && <Text style={styles.testProgressText}>{testProgress}</Text>}
          </View>
        </View>

        {/* Kiosk Lock & Display Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>KIOSK DISPLAY & LOCK</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchTitle}>Keep Display Awake</Text>
              <Text style={styles.switchSubtitle}>
                Prevents tablet screen from sleeping during photobooth operation
              </Text>
            </View>
            <Switch
              value={keepAwakeEnabled}
              onValueChange={handleToggleKeepAwake}
              trackColor={{ false: Colors.border, true: Colors.gold }}
              thumbColor={Colors.surface}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchTitle}>Immersive Fullscreen</Text>
              <Text style={styles.switchSubtitle}>
                Hides Android navigation bar for locked guest experience
              </Text>
            </View>
            <Switch
              value={immersiveEnabled}
              onValueChange={handleToggleImmersive}
              trackColor={{ false: Colors.border, true: Colors.gold }}
              thumbColor={Colors.surface}
            />
          </View>

          <View style={styles.divider} />

          {/* PIN Changer */}
          <View style={styles.pinSection}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchTitle}>Operator Passcode</Text>
              <Text style={styles.switchSubtitle}>4-digit PIN required to open this screen</Text>
            </View>

            {showPinChange ? (
              <View style={styles.pinChangeBox}>
                <TextInput
                  style={styles.pinInput}
                  value={newPin}
                  onChangeText={setNewPin}
                  placeholder="4-digit PIN"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
                <View style={styles.pinActionRow}>
                  <Pressable
                    style={styles.pinSaveButton}
                    onPress={handleSaveNewPin}
                  >
                    <Text style={styles.pinSaveButtonText}>SAVE NEW PIN</Text>
                  </Pressable>
                  <Pressable
                    style={styles.pinCancelButton}
                    onPress={() => setShowPinChange(false)}
                  >
                    <Text style={styles.pinCancelButtonText}>CANCEL</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                style={styles.changePinButton}
                onPress={() => setShowPinChange(true)}
              >
                <Text style={styles.changePinButtonText}>CHANGE PIN</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Technical Specs Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>SYSTEM SPECIFICATIONS</Text>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Print Width</Text>
            <Text style={styles.specValue}>384 dots (48 bytes/row • 57mm)</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Dithering Engine</Text>
            <Text style={styles.specValue}>Serpentine Floyd-Steinberg</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>GATT Service</Text>
            <Text style={styles.specValue}>0xAE30 / 0xAF30</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>MonoReciept Build</Text>
            <Text style={styles.specValue}>v1.1.0 (Bare RN 0.76.5)</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgKiosk,
  },
  scrollContent: {
    padding: 28,
    paddingBottom: 56,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 640,
    marginBottom: 24,
  },
  headerBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.goldDark,
    letterSpacing: Typography.trackingWide,
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: Typography.serif,
    fontSize: 28,
    fontWeight: '700',
    color: Colors.inkPrimary,
    letterSpacing: -0.5,
  },
  exitButton: {
    backgroundColor: Colors.inkPrimary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  exitButtonText: {
    color: Colors.surface,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: Typography.trackingWide,
  },
  sectionCard: {
    width: '100%',
    maxWidth: 640,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    ...Shadows.card,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.inkSecondary,
    letterSpacing: Typography.trackingWide,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.inkSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: Colors.inkPrimary,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkPrimary,
  },
  controlGroup: {
    marginTop: 18,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkPrimary,
    marginBottom: 8,
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.goldDark,
    letterSpacing: Typography.trackingNormal,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceWarm,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 4,
    gap: 4,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radii.sm,
  },
  segmentTabSelected: {
    backgroundColor: Colors.inkPrimary,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  segmentTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkSecondary,
    letterSpacing: Typography.trackingNormal,
  },
  segmentTabTextSelected: {
    color: Colors.surface,
    fontWeight: '800',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepButton: {
    width: 42,
    height: 42,
    borderRadius: Radii.md,
    backgroundColor: Colors.surfaceWarm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.inkPrimary,
    lineHeight: 24,
  },
  counterBox: {
    minWidth: 64,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.surfaceWarm,
    borderRadius: Radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  counterText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.inkPrimary,
  },
  keyValueText: {
    fontSize: 13,
    fontFamily: Typography.mono,
    color: Colors.inkPrimary,
    backgroundColor: Colors.surfaceWarm,
    padding: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  keyEditRow: {
    flexDirection: 'row',
    gap: 10,
  },
  keyInput: {
    flex: 1,
    backgroundColor: Colors.surfaceWarm,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: Typography.mono,
    color: Colors.inkPrimary,
  },
  saveKeyButton: {
    backgroundColor: Colors.inkPrimary,
    paddingHorizontal: 18,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveKeyButtonText: {
    color: Colors.surface,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: Typography.trackingNormal,
  },
  testPrintArea: {
    marginTop: 22,
    alignItems: 'center',
  },
  testPrintButton: {
    backgroundColor: Colors.inkPrimary,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Radii.pill,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  testPrintButtonDisabled: {
    backgroundColor: Colors.inkLight,
    borderColor: Colors.border,
  },
  testPrintButtonText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: Typography.trackingWide,
  },
  testProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.goldDark,
    marginTop: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  switchInfo: {
    flex: 1,
    paddingRight: 16,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.inkPrimary,
  },
  switchSubtitle: {
    fontSize: 12,
    color: Colors.inkSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 8,
  },
  pinSection: {
    paddingTop: 8,
  },
  changePinButton: {
    marginTop: 12,
    backgroundColor: Colors.surfaceWarm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    borderRadius: Radii.pill,
    alignItems: 'center',
  },
  changePinButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.inkPrimary,
    letterSpacing: Typography.trackingWide,
  },
  pinChangeBox: {
    marginTop: 12,
    gap: 10,
  },
  pinInput: {
    backgroundColor: Colors.surfaceWarm,
    borderWidth: 1.5,
    borderColor: Colors.goldBorder,
    borderRadius: Radii.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
    color: Colors.inkPrimary,
  },
  pinActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pinSaveButton: {
    flex: 1,
    backgroundColor: Colors.inkPrimary,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    paddingVertical: 12,
    borderRadius: Radii.pill,
    alignItems: 'center',
  },
  pinSaveButtonText: {
    color: Colors.surface,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: Typography.trackingNormal,
  },
  pinCancelButton: {
    flex: 1,
    backgroundColor: Colors.surfaceWarm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    borderRadius: Radii.pill,
    alignItems: 'center',
  },
  pinCancelButtonText: {
    color: Colors.inkPrimary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: Typography.trackingNormal,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  specLabel: {
    fontSize: 12,
    color: Colors.inkSecondary,
  },
  specValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkPrimary,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});
