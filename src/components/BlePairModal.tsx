import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useBoothStore, DiscoveredPrinter } from '../store/useBoothStore';
import { printerService } from '../services/PrinterService';
import { StorageService } from '../services/StorageService';
import { Colors, Typography, Radii, Shadows } from '../theme/theme';

interface BlePairModalProps {
  visible: boolean;
  onClose: () => void;
}

export function BlePairModal({ visible, onClose }: BlePairModalProps) {
  const {
    printerConnected,
    printerDeviceName,
    printerBattery,
    isBleScanning,
    discoveredPrinters,
  } = useBoothStore();

  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStartScan = async () => {
    setErrorMsg(null);
    try {
      await printerService.scan(10000);
    } catch (err) {
      setErrorMsg('Failed to start scan. Check Bluetooth permissions.');
    }
  };

  const handleConnect = async (device: DiscoveredPrinter) => {
    setConnectingId(device.id);
    setErrorMsg(null);
    try {
      await printerService.connect(device.id);
      setConnectingId(null);
      onClose();
    } catch (err) {
      setErrorMsg(`Failed to connect to ${device.name}. Ensure printer is turned on.`);
      setConnectingId(null);
    }
  };

  const handleDisconnect = async () => {
    await printerService.disconnect();
  };

  const handleForget = async () => {
    await printerService.disconnect();
    StorageService.clearLastPrinter();
  };

  const lastMac = StorageService.getLastPrinterMac();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Bluetooth Printer</Text>
              <Text style={styles.subtitle}>
                {printerConnected
                  ? 'Active connection with MXW01'
                  : 'Pair with your thermal receipt printer'}
              </Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          {/* Connected Device Status Card */}
          {printerConnected ? (
            <View style={styles.connectedCard}>
              <View style={styles.connectedRow}>
                <View style={styles.greenDot} />
                <View style={styles.connectedInfo}>
                  <Text style={styles.connectedName}>{printerDeviceName}</Text>
                  <Text style={styles.connectedMac}>{lastMac ?? 'GATT Service 0xAE30'}</Text>
                </View>
                <View style={styles.batteryPill}>
                  <Text style={styles.batteryPillText}>{printerBattery}%</Text>
                </View>
              </View>

              <View style={styles.connectedActions}>
                <Pressable
                  style={styles.disconnectButton}
                  onPress={handleDisconnect}
                >
                  <Text style={styles.disconnectButtonText}>DISCONNECT</Text>
                </Pressable>
                <Pressable
                  style={styles.forgetButton}
                  onPress={handleForget}
                >
                  <Text style={styles.forgetButtonText}>FORGET</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.scanSection}>
              {/* Scan Trigger Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.scanButton,
                  isBleScanning && styles.scanButtonActive,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleStartScan}
                disabled={isBleScanning}
              >
                {isBleScanning && (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text style={styles.scanButtonText}>
                  {isBleScanning ? 'SCANNING FOR MXW01...' : 'SEARCH FOR PRINTERS'}
                </Text>
              </Pressable>

              {errorMsg && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Discovered Devices List */}
              <Text style={styles.listHeader}>
                DISCOVERED DEVICES ({discoveredPrinters.length})
              </Text>

              {discoveredPrinters.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {isBleScanning
                      ? 'Looking for nearby BLE thermal printers...'
                      : 'No printers found. Make sure printer power is ON.'}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={discoveredPrinters}
                  keyExtractor={item => item.id}
                  contentContainerStyle={styles.listContent}
                  renderItem={({ item }) => {
                    const isConnecting = connectingId === item.id;
                    return (
                      <View style={styles.deviceRow}>
                        <View style={styles.deviceInfo}>
                          <Text style={styles.deviceName}>{item.name}</Text>
                          <Text style={styles.deviceId}>{item.id}</Text>
                          {item.rssi && (
                            <Text style={styles.deviceRssi}>RSSI: {item.rssi} dBm</Text>
                          )}
                        </View>

                        <Pressable
                          style={({ pressed }) => [
                            styles.connectButton,
                            isConnecting && styles.connectButtonDisabled,
                            pressed && styles.buttonPressed,
                          ]}
                          onPress={() => handleConnect(item)}
                          disabled={isConnecting}
                        >
                          {isConnecting ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.connectButtonText}>CONNECT</Text>
                          )}
                        </Pressable>
                      </View>
                    );
                  }}
                />
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: 26,
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    ...Shadows.cardFloating,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontFamily: Typography.serif,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.inkPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.inkSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surfaceWarm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.inkSecondary,
  },
  connectedCard: {
    backgroundColor: Colors.surfaceWarm,
    borderRadius: Radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  connectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.statusConnected,
    marginRight: 12,
  },
  connectedInfo: {
    flex: 1,
  },
  connectedName: {
    fontFamily: Typography.serif,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.inkPrimary,
  },
  connectedMac: {
    fontSize: 12,
    color: Colors.inkSecondary,
    marginTop: 2,
  },
  batteryPill: {
    backgroundColor: Colors.inkPrimary,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  batteryPillText: {
    color: Colors.surface,
    fontSize: 11,
    fontWeight: '800',
  },
  connectedActions: {
    flexDirection: 'row',
    gap: 10,
  },
  disconnectButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    borderRadius: Radii.pill,
    alignItems: 'center',
  },
  disconnectButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.inkPrimary,
    letterSpacing: Typography.trackingNormal,
  },
  forgetButton: {
    flex: 1,
    backgroundColor: Colors.surfaceWarm,
    borderWidth: 1,
    borderColor: Colors.statusDisconnected,
    paddingVertical: 10,
    borderRadius: Radii.pill,
    alignItems: 'center',
  },
  forgetButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.statusDisconnected,
    letterSpacing: Typography.trackingNormal,
  },
  scanSection: {
    gap: 14,
  },
  scanButton: {
    backgroundColor: Colors.inkPrimary,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    paddingVertical: 14,
    borderRadius: Radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonActive: {
    backgroundColor: Colors.inkSecondary,
  },
  scanButtonText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: Typography.trackingWide,
  },
  errorBox: {
    backgroundColor: Colors.surfaceWarm,
    borderWidth: 1,
    borderColor: Colors.statusDisconnected,
    padding: 10,
    borderRadius: Radii.sm,
  },
  errorText: {
    color: Colors.statusDisconnected,
    fontSize: 12,
    fontWeight: '600',
  },
  listHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.inkSecondary,
    letterSpacing: Typography.trackingWide,
    marginTop: 6,
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.inkLight,
    fontSize: 13,
    textAlign: 'center',
  },
  listContent: {
    gap: 10,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceWarm,
    padding: 14,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.inkPrimary,
  },
  deviceId: {
    fontSize: 11,
    color: Colors.inkSecondary,
    marginTop: 2,
    fontFamily: Typography.mono,
  },
  deviceRssi: {
    fontSize: 10,
    color: Colors.goldDark,
    fontWeight: '700',
    marginTop: 2,
  },
  connectButton: {
    backgroundColor: Colors.inkPrimary,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radii.pill,
    minWidth: 90,
    alignItems: 'center',
  },
  connectButtonDisabled: {
    backgroundColor: Colors.inkLight,
    borderColor: Colors.border,
  },
  connectButtonText: {
    color: Colors.surface,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: Typography.trackingNormal,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});
