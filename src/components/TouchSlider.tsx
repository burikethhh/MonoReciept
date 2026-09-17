import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';

import { Colors, Typography, Radii } from '../theme/theme';

interface TouchSliderProps {
  label: string;
  value: number; // e.g. -50 to 50
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}

export function TouchSlider({
  label,
  value,
  min = -50,
  max = 50,
  step = 5,
  onChange,
}: TouchSliderProps) {
  const trackWidthRef = useRef(200);

  const clampAndStep = (val: number): number => {
    const clamped = Math.max(min, Math.min(max, val));
    const stepped = Math.round(clamped / step) * step;
    return stepped;
  };

  const handleStepDown = () => {
    onChange(clampAndStep(value - step));
  };

  const handleStepUp = () => {
    onChange(clampAndStep(value + step));
  };

  const calculateValueFromTouch = (locationX: number) => {
    const width = trackWidthRef.current || 200;
    const ratio = Math.max(0, Math.min(1, locationX / width));
    const rawVal = min + ratio * (max - min);
    onChange(clampAndStep(rawVal));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        calculateValueFromTouch(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        calculateValueFromTouch(evt.nativeEvent.locationX);
      },
    }),
  ).current;

  // Position percentage: 0% at min, 100% at max
  const percentage = Math.max(0, Math.min(1, (value - min) / (max - min)));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label.toUpperCase()}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {value > 0 ? `+${value}` : `${value}`}
          </Text>
        </View>
      </View>

      <View style={styles.sliderRow}>
        {/* Nudge Down Button */}
        <Pressable
          style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
          onPress={handleStepDown}
        >
          <Text style={styles.stepButtonText}>−</Text>
        </Pressable>

        {/* Interactive Track */}
        <View
          style={styles.trackContainer}
          onLayout={e => {
            trackWidthRef.current = e.nativeEvent.layout.width;
          }}
          {...panResponder.panHandlers}
        >
          <View style={styles.trackBackground}>
            {/* Center zero mark */}
            <View style={styles.centerMark} />

            {/* Active Fill */}
            <View
              style={[
                styles.trackFill,
                {
                  width: `${percentage * 100}%`,
                },
              ]}
            />
          </View>

          {/* Thumb */}
          <View
            style={[
              styles.thumb,
              {
                left: `${percentage * 100}%`,
                transform: [{ translateX: -12 }],
              },
            ]}
          />
        </View>

        {/* Nudge Up Button */}
        <Pressable
          style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
          onPress={handleStepUp}
        >
          <Text style={styles.stepButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
    fontFamily: Typography.sansMedium,
    color: Colors.inkPrimary,
    letterSpacing: Typography.trackingWide,
  },
  badge: {
    backgroundColor: Colors.goldLight,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  badgeText: {
    color: Colors.goldDark,
    fontSize: 10,
    fontFamily: Typography.mono,
    fontWeight: '700',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepButton: {
    width: 34,
    height: 34,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surfaceWarm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonPressed: {
    backgroundColor: Colors.border,
    transform: [{ scale: 0.96 }],
  },
  stepButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.inkPrimary,
    lineHeight: 18,
  },
  trackContainer: {
    flex: 1,
    height: 34,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBackground: {
    height: 6,
    backgroundColor: Colors.surfaceWarm,
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  centerMark: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: Colors.border,
    zIndex: 1,
  },
  trackFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    top: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.inkPrimary,
    borderWidth: 2,
    borderColor: Colors.gold,
    shadowColor: Colors.inkPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});
