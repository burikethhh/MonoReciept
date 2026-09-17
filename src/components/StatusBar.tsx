import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useBoothStore } from '../store/useBoothStore';
import { printerService } from '../services/PrinterService';
import { BlePairModal } from './BlePairModal';

export function StatusBar() {
  const {
    printerConnected,
    printerDeviceName,
    printerBattery,
    isBleScanning,
  } = useBoothStore();

  const [showPairModal, setShowPairModal] = useState(false);

  // Attempt auto-reconnect to last printer on startup
  useEffect(() => {
    printerService.autoReconnect();
  }, []);

  const getStatusText = () => {
    if (printerConnected) {
      return `Connected: ${printerDeviceName}`;
    }
    if (isBleScanning) {
      return 'Scanning for Printer...';
    }
    return 'Disconnected: Tap to Pair';
  };

  const getDotColor = () => {
    if (printerConnected) return '#22C55E'; // Green
    if (isBleScanning) return '#3B82F6'; // Blue
    return '#F59E0B'; // Amber
  };

  return (
    <>
      <Pressable onPress={() => setShowPairModal(true)} style={styles.bar}>
        <View style={[styles.dot, { backgroundColor: getDotColor() }]} />
        <Text style={styles.text} numberOfLines={1}>
          {getStatusText()}
        </Text>

        {printerConnected && (
          <View style={styles.batteryContainer}>
            <View style={styles.batteryIcon}>
              <View
                style={[
                  styles.batteryFill,
                  {
                    width: `${Math.max(10, Math.min(100, printerBattery))}%`,
                    backgroundColor: printerBattery < 20 ? '#EF4444' : '#22C55E',
                  },
                ]}
              />
            </View>
            <Text style={styles.batt}>{printerBattery}%</Text>
          </View>
        )}
      </Pressable>

      <BlePairModal
        visible={showPairModal}
        onClose={() => setShowPairModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ECECE8',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  text: {
    fontWeight: '700',
    fontSize: 13,
    color: '#1E1E24',
    flex: 1,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F7F7F4',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  batteryIcon: {
    width: 20,
    height: 10,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: '#1E1E24',
    padding: 1,
    justifyContent: 'center',
  },
  batteryFill: {
    height: '100%',
    borderRadius: 1,
  },
  batt: {
    fontWeight: '800',
    fontSize: 11,
    color: '#1E1E24',
  },
});
