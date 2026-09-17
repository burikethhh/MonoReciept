import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useBoothStore } from '../store/useBoothStore';
import { FrameGhost } from '../components/FrameGhost';
import { getFrameTemplate } from '../assets/frames/frameTemplates';
import { Colors, Typography, Radii } from '../theme/theme';

export function CaptureScreen() {
  const { phase, frameId, cameraPosition, set } = useBoothStore();
  const { hasPermission, requestPermission } = useCameraPermission();

  const cameraRef = useRef<Camera>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Animations
  const countdownScale = useRef(new Animated.Value(1)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;

  const template = getFrameTemplate(frameId);

  // Camera device selection with fallback
  const frontDevice = useCameraDevice('front');
  const backDevice = useCameraDevice('back');
  const device = cameraPosition === 'front' ? (frontDevice ?? backDevice) : (backDevice ?? frontDevice);

  // Request permission automatically on mount if needed
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // Handle countdown animation pulse
  const triggerCountdownPulse = useCallback(() => {
    countdownScale.setValue(1.5);
    Animated.spring(countdownScale, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [countdownScale]);

  // Execute shutter flash and photo capture
  const executeCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);

    // Trigger screen flash animation
    Animated.sequence([
      Animated.timing(flashOpacity, {
        toValue: 1,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: 360,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const photo = await cameraRef.current.takePhoto({
        enableShutterSound: false,
      });

      const photoUri = photo.path.startsWith('file://')
        ? photo.path
        : `file://${photo.path}`;

      // Transition store to preview phase
      set({ photoUri, phase: 'preview' });
    } catch (err) {
      console.error('[CaptureScreen] Failed to take photo:', err);
    } finally {
      setIsCapturing(false);
      setCountdown(null);
    }
  }, [flashOpacity, isCapturing, set]);

  // Countdown timer effect (3 -> 2 -> 1 -> capture)
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      triggerCountdownPulse();
      const timer = setTimeout(() => {
        setCountdown(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (countdown === 0) {
      executeCapture();
    }
  }, [countdown, triggerCountdownPulse, executeCapture]);

  const handleStartCountdown = () => {
    if (isCapturing || countdown !== null) return;
    setCountdown(3);
  };

  const handleCancelCountdown = () => {
    setCountdown(null);
    setIsCapturing(false);
  };

  const toggleCamera = () => {
    set({
      cameraPosition: cameraPosition === 'front' ? 'back' : 'front',
    });
  };

  const handleBack = () => {
    setCountdown(null);
    set({ phase: 'idle' });
  };

  // Permission Request View
  if (!hasPermission) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.permissionCard}>
          <Text style={styles.cardTitle}>Camera Authorization</Text>
          <View style={styles.goldDivider} />
          <Text style={styles.cardSubtitle}>
            MonoReceipt requires camera access to capture high-definition portrait prints.
          </Text>
          <Pressable style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>GRANT ACCESS</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={handleBack}>
            <Text style={styles.secondaryButtonText}>RETURN TO GALLERY</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Device Unavailable View
  if (!device) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.permissionCard}>
          <Text style={styles.cardTitle}>No Camera Detected</Text>
          <View style={styles.goldDivider} />
          <Text style={styles.cardSubtitle}>
            No active optical sensor found for &quot;{cameraPosition}&quot; orientation.
          </Text>
          <Pressable style={styles.primaryButton} onPress={toggleCamera}>
            <Text style={styles.primaryButtonText}>TOGGLE SENSOR</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={handleBack}>
            <Text style={styles.secondaryButtonText}>RETURN TO GALLERY</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Native VisionCamera Viewfinder */}
      <Camera
        ref={cameraRef}
        device={device}
        isActive={phase === 'capturing'}
        photo={true}
        style={StyleSheet.absoluteFill}
      />

      {/* Frame Ghost Overlay */}
      <FrameGhost frameId={frameId} />

      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.glassButton} onPress={handleBack}>
          <Text style={styles.glassButtonText}>← BACK</Text>
        </Pressable>

        <View style={styles.framePill}>
          <Text style={styles.framePillText}>{template.name.toUpperCase()}</Text>
        </View>

        <Pressable style={styles.glassButton} onPress={toggleCamera}>
          <Text style={styles.glassButtonText}>
            {cameraPosition === 'front' ? 'FRONT SENSOR' : 'REAR SENSOR'}
          </Text>
        </Pressable>
      </View>

      {/* Big Animated 3-2-1 Countdown Indicator */}
      {countdown !== null && countdown > 0 && (
        <View style={styles.countdownContainer} pointerEvents="none">
          <Animated.View
            style={[
              styles.countdownCircle,
              { transform: [{ scale: countdownScale }] },
            ]}
          >
            <Text style={styles.countdownNumber}>{countdown}</Text>
          </Animated.View>
        </View>
      )}

      {/* Screen Flash Overlay */}
      <Animated.View
        style={[styles.flashOverlay, { opacity: flashOpacity }]}
        pointerEvents="none"
      />

      {/* Bottom Controls Bar */}
      <View style={styles.bottomBar}>
        {countdown === null ? (
          <View style={styles.shutterContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.shutterOuterRing,
                pressed && styles.shutterOuterRingPressed,
              ]}
              onPress={handleStartCountdown}
              disabled={isCapturing}
            >
              <View style={styles.shutterInnerCircle}>
                <Text style={styles.shutterLabel}>CAPTURE</Text>
              </View>
            </Pressable>
          </View>
        ) : (
          <View style={styles.countingControls}>
            <Text style={styles.countingLabel}>PREPARE YOUR POSE...</Text>
            <Pressable
              style={styles.cancelCountdownButton}
              onPress={handleCancelCountdown}
            >
              <Text style={styles.cancelCountdownText}>CANCEL</Text>
            </Pressable>
          </View>
        )}

        {isCapturing && (
          <View style={styles.loadingBackdrop}>
            <ActivityIndicator size="large" color={Colors.gold} />
            <Text style={styles.loadingText}>DEVELOPING PORTRAIT...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: 32,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: Typography.serif,
    fontWeight: '700',
    color: Colors.inkPrimary,
    letterSpacing: 0.5,
  },
  goldDivider: {
    width: 36,
    height: 1.5,
    backgroundColor: Colors.gold,
    marginVertical: 12,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    fontFamily: Typography.sans,
  },
  primaryButton: {
    backgroundColor: Colors.inkPrimary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: Radii.pill,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: Colors.surface,
    fontSize: 11,
    fontFamily: Typography.sansMedium,
    letterSpacing: Typography.trackingWide,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: Radii.pill,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.inkSecondary,
    fontSize: 11,
    fontFamily: Typography.sansMedium,
    letterSpacing: Typography.trackingWide,
  },
  topBar: {
    position: 'absolute',
    top: 24,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  glassButton: {
    backgroundColor: 'rgba(18, 18, 18, 0.65)',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(197, 168, 128, 0.4)', // subtle gold border
  },
  glassButtonText: {
    color: Colors.surface,
    fontSize: 10,
    fontFamily: Typography.sansMedium,
    letterSpacing: Typography.trackingWide,
  },
  framePill: {
    backgroundColor: Colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  framePillText: {
    color: Colors.inkPrimary,
    fontSize: 10,
    fontFamily: Typography.sansMedium,
    letterSpacing: Typography.trackingExtraWide,
  },
  countdownContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  countdownCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(18, 18, 18, 0.8)',
    borderWidth: 3,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: {
    color: Colors.surface,
    fontSize: 72,
    fontFamily: Typography.serif,
    fontWeight: '700',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 30,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 34,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  shutterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuterRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: Colors.gold,
    backgroundColor: 'rgba(197, 168, 128, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuterRingPressed: {
    transform: [{ scale: 0.95 }],
    backgroundColor: 'rgba(197, 168, 128, 0.4)',
  },
  shutterInnerCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterLabel: {
    color: Colors.inkPrimary,
    fontSize: 10,
    fontFamily: Typography.sansMedium,
    letterSpacing: Typography.trackingWide,
  },
  countingControls: {
    alignItems: 'center',
    gap: 12,
  },
  countingLabel: {
    color: Colors.surface,
    fontSize: 14,
    fontFamily: Typography.sansMedium,
    letterSpacing: Typography.trackingWide,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cancelCountdownButton: {
    backgroundColor: 'rgba(18, 18, 18, 0.65)',
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    paddingVertical: 9,
    paddingHorizontal: 22,
    borderRadius: Radii.pill,
  },
  cancelCountdownText: {
    color: Colors.surface,
    fontSize: 10,
    fontFamily: Typography.sansMedium,
    letterSpacing: Typography.trackingWide,
  },
  loadingBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 18, 18, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 40,
  },
  loadingText: {
    color: Colors.goldLight,
    fontSize: 11,
    fontFamily: Typography.sansMedium,
    letterSpacing: Typography.trackingWide,
  },
});
