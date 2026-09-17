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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E1E24',
  },
  subtitle: {
    fontSize: 13,
    color: '#777780',
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666670',
  },
  connectedCard: {
    backgroundColor: '#F7F7F4',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2E2DC',
  },
  connectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  greenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    marginRight: 12,
  },
  connectedInfo: {
    flex: 1,
  },
  connectedName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1E24',
  },
  connectedMac: {
    fontSize: 12,
    color: '#777780',
    marginTop: 2,
  },
  batteryPill: {
    backgroundColor: '#1E1E24',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  batteryPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  connectedActions: {
    flexDirection: 'row',
    gap: 10,
  },
  disconnectButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#1E1E24',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  disconnectButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E1E24',
    letterSpacing: 0.8,
  },
  forgetButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  forgetButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.8,
  },
  scanSection: {
    gap: 14,
  },
  scanButton: {
    backgroundColor: '#1E1E24',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonActive: {
    backgroundColor: '#444450',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  listHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#777780',
    letterSpacing: 1,
    marginTop: 6,
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888890',
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
    backgroundColor: '#F7F7F4',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E2',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1E24',
  },
  deviceId: {
    fontSize: 11,
    color: '#888890',
    marginTop: 2,
  },
  deviceRssi: {
    fontSize: 10,
    color: '#E06D53',
    fontWeight: '700',
    marginTop: 2,
  },
  connectButton: {
    backgroundColor: '#E06D53',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  connectButtonDisabled: {
    backgroundColor: '#999999',
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});
