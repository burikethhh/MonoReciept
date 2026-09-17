import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useBoothStore } from '../store/useBoothStore';
import { printerService } from '../services/PrinterService';
import { BlePairModal } from './BlePairModal';
import { Colors, Typography, Radii } from '../theme/theme';

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
      return `MXW01: ${printerDeviceName || 'Connected'}`;
    }
    if (isBleScanning) {
      return 'SEARCHING FOR PRINTER...';
    }
    return 'PRINTER DISCONNECTED — TAP TO PAIR';
  };

  const getDotColor = () => {
    if (printerConnected) return Colors.statusConnected;
    if (isBleScanning) return Colors.gold;
    return Colors.statusDisconnected;
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
                    backgroundColor: printerBattery < 20 ? Colors.statusDisconnected : Colors.statusConnected,
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
    paddingVertical: 9,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: Radii.pill,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: Colors.inkPrimary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  text: {
    fontFamily: Typography.sansMedium,
    fontSize: 11,
    letterSpacing: Typography.trackingTight,
    color: Colors.inkPrimary,
    flex: 1,
    textTransform: 'uppercase',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceWarm,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  batteryIcon: {
    width: 18,
    height: 9,
    borderRadius: 2,
    borderWidth: 1.2,
    borderColor: Colors.inkSecondary,
    padding: 1,
    justifyContent: 'center',
  },
  batteryFill: {
    height: '100%',
    borderRadius: 1,
  },
  batt: {
    fontFamily: Typography.mono,
    fontWeight: '700',
    fontSize: 10,
    color: Colors.inkPrimary,
  },
});

