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
          <Text style={styles.cardTitle}>Camera Access</Text>
          <Text style={styles.cardSubtitle}>
            MonoReciept requires camera permission to capture your photobooth memory.
          </Text>
          <Pressable style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Grant Access</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={handleBack}>
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
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
          <Text style={styles.cardTitle}>No Camera Found</Text>
          <Text style={styles.cardSubtitle}>
            No camera device detected for position &quot;{cameraPosition}&quot;.
          </Text>
          <Pressable style={styles.primaryButton} onPress={toggleCamera}>
            <Text style={styles.primaryButtonText}>Switch Camera</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={handleBack}>
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
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
          <Text style={styles.glassButtonText}>BACK</Text>
        </Pressable>

        <View style={styles.framePill}>
          <Text style={styles.framePillText}>{template.name.toUpperCase()}</Text>
        </View>

        <Pressable style={styles.glassButton} onPress={toggleCamera}>
          <Text style={styles.glassButtonText}>
            {cameraPosition === 'front' ? 'FRONT' : 'BACK'}
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
            <Text style={styles.countingLabel}>GET READY...</Text>
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
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Processing Shot...</Text>
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
    backgroundColor: '#1E1E24',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E1E24',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#1E1E24',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 1,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#666666',
    fontWeight: '600',
    fontSize: 14,
  },
  topBar: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  glassButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  glassButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  framePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 16,
  },
  framePillText: {
    color: '#1E1E24',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: {
    color: '#FFFFFF',
    fontSize: 72,
    fontWeight: '900',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 30,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 30,
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
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuterRingPressed: {
    transform: [{ scale: 0.95 }],
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  shutterInnerCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterLabel: {
    color: '#1E1E24',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  countingControls: {
    alignItems: 'center',
    gap: 12,
  },
  countingLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cancelCountdownButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  cancelCountdownText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  loadingBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 40,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
