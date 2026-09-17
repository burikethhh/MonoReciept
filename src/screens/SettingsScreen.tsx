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
                  { backgroundColor: printerConnected ? '#22C55E' : '#F59E0B' },
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
              trackColor={{ false: '#CCCCCC', true: '#E06D53' }}
              thumbColor="#FFFFFF"
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
              trackColor={{ false: '#CCCCCC', true: '#E06D53' }}
              thumbColor="#FFFFFF"
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
            <Text style={styles.specValue}>v0.1.0 (Bare RN 0.76.5)</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF7F0',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
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
    fontSize: 11,
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
  exitButton: {
    backgroundColor: '#1E1E24',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  exitButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionCard: {
    width: '100%',
    maxWidth: 640,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#777780',
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0EC',
  },
  infoLabel: {
    fontSize: 13,
    color: '#555560',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    color: '#1E1E24',
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E1E24',
  },
  controlGroup: {
    marginTop: 16,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E1E24',
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
    color: '#E06D53',
    letterSpacing: 0.8,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#EAEAE6',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentTabSelected: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  segmentTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#77777E',
    letterSpacing: 0.8,
  },
  segmentTabTextSelected: {
    color: '#1E1E24',
    fontWeight: '800',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EAEAE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E1E24',
    lineHeight: 24,
  },
  counterBox: {
    minWidth: 60,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F7F7F4',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E2DC',
  },
  counterText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E1E24',
  },
  keyValueText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#1E1E24',
    backgroundColor: '#F7F7F4',
    padding: 10,
    borderRadius: 8,
  },
  keyEditRow: {
    flexDirection: 'row',
    gap: 10,
  },
  keyInput: {
    flex: 1,
    backgroundColor: '#F7F7F4',
    borderWidth: 1.5,
    borderColor: '#E06D53',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  saveKeyButton: {
    backgroundColor: '#1E1E24',
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveKeyButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  testPrintArea: {
    marginTop: 20,
    alignItems: 'center',
  },
  testPrintButton: {
    backgroundColor: '#E06D53',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  testPrintButtonDisabled: {
    backgroundColor: '#999999',
  },
  testPrintButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  testProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E1E24',
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
    color: '#1E1E24',
  },
  switchSubtitle: {
    fontSize: 12,
    color: '#777780',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0EC',
    marginVertical: 6,
  },
  pinSection: {
    paddingTop: 8,
  },
  changePinButton: {
    marginTop: 10,
    backgroundColor: '#EAEAE6',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  changePinButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E1E24',
    letterSpacing: 0.8,
  },
  pinChangeBox: {
    marginTop: 12,
    gap: 10,
  },
  pinInput: {
    backgroundColor: '#F7F7F4',
    borderWidth: 1.5,
    borderColor: '#1E1E24',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
  },
  pinActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pinSaveButton: {
    flex: 1,
    backgroundColor: '#1E1E24',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  pinSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  pinCancelButton: {
    flex: 1,
    backgroundColor: '#EAEAE6',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  pinCancelButtonText: {
    color: '#1E1E24',
    fontSize: 11,
    fontWeight: '800',
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  specLabel: {
    fontSize: 12,
    color: '#777780',
  },
  specValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E1E24',
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});
