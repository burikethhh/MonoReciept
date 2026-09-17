import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { StorageService } from '../services/StorageService';
import { Colors, Typography, Radii, Shadows } from '../theme/theme';

interface PinPadModalProps {
  visible: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export function PinPadModal({ visible, onSuccess, onClose }: PinPadModalProps) {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const handleKeyPress = (digit: string) => {
    if (pin.length >= 4) return;
    setErrorMsg(null);

    const nextPin = pin + digit;
    setPin(nextPin);

    if (nextPin.length === 4) {
      verifyPin(nextPin);
    }
  };

  const handleBackspace = () => {
    setErrorMsg(null);
    setPin(prev => prev.slice(0, -1));
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const verifyPin = (candidate: string) => {
    const correctPin = StorageService.getOperatorPin();
    if (candidate === correctPin) {
      setPin('');
      setErrorMsg(null);
      onSuccess();
    } else {
      triggerShake();
      setErrorMsg('Incorrect PIN');
      setTimeout(() => {
        setPin('');
      }, 500);
    }
  };

  const handleClose = () => {
    setPin('');
    setErrorMsg(null);
    onClose();
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CANCEL', '0', '⌫'];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          <Text style={styles.badge}>OPERATOR ACCESS</Text>
          <Text style={styles.title}>Enter Passcode</Text>
          <Text style={styles.subtitle}>Protected kiosk settings</Text>

          {/* 4 Pin Indicator Dots */}
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map(idx => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  pin.length > idx && styles.dotFilled,
                  errorMsg !== null && styles.dotError,
                ]}
              />
            ))}
          </View>

          {errorMsg ? (
            <Text style={styles.errorText}>{errorMsg}</Text>
          ) : (
            <Text style={styles.hintText}>Default PIN: 1234</Text>
          )}

          {/* Numeric Keypad Grid */}
          <View style={styles.keypad}>
            {keys.map((k, index) => {
              const isAction = k === 'CANCEL' || k === '⌫';
              return (
                <Pressable
                  key={index}
                  style={({ pressed }) => [
                    styles.key,
                    isAction && styles.actionKey,
                    pressed && styles.keyPressed,
                  ]}
                  onPress={() => {
                    if (k === 'CANCEL') handleClose();
                    else if (k === '⌫') handleBackspace();
                    else handleKeyPress(k);
                  }}
                >
                  <Text
                    style={[
                      styles.keyText,
                      isAction && styles.actionKeyText,
                    ]}
                  >
                    {k}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlayDark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    ...Shadows.cardFloating,
  },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.goldDark,
    letterSpacing: Typography.trackingWide,
    marginBottom: 4,
  },
  title: {
    fontFamily: Typography.serif,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.inkPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.inkSecondary,
    marginTop: 2,
    marginBottom: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    borderColor: Colors.inkPrimary,
    backgroundColor: Colors.inkPrimary,
  },
  dotError: {
    borderColor: Colors.statusDisconnected,
    backgroundColor: Colors.statusDisconnected,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.statusDisconnected,
    marginBottom: 16,
  },
  hintText: {
    fontSize: 11,
    color: Colors.inkLight,
    marginBottom: 16,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  key: {
    width: '30%',
    aspectRatio: 1.2,
    borderRadius: Radii.lg,
    backgroundColor: Colors.surfaceWarm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionKey: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  keyPressed: {
    backgroundColor: Colors.goldLight,
    borderColor: Colors.goldBorder,
    transform: [{ scale: 0.96 }],
  },
  keyText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.inkPrimary,
  },
  actionKeyText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.inkSecondary,
    letterSpacing: Typography.trackingNormal,
  },
});
