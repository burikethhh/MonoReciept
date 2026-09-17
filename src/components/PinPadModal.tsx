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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E06D53',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E1E24',
  },
  subtitle: {
    fontSize: 12,
    color: '#777780',
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
    borderWidth: 2,
    borderColor: '#CCCCCC',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    borderColor: '#1E1E24',
    backgroundColor: '#1E1E24',
  },
  dotError: {
    borderColor: '#DC2626',
    backgroundColor: '#DC2626',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 16,
  },
  hintText: {
    fontSize: 11,
    color: '#999990',
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
    borderRadius: 16,
    backgroundColor: '#F5F5F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionKey: {
    backgroundColor: 'transparent',
  },
  keyPressed: {
    backgroundColor: '#E0E0DC',
    transform: [{ scale: 0.96 }],
  },
  keyText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E1E24',
  },
  actionKeyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#777780',
    letterSpacing: 0.8,
  },
});
