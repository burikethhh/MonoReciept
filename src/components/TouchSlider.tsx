import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';

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
          <Text style={styles.stepButtonText}>-</Text>
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

            {/* Active Fill from center or from left */}
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
    fontSize: 12,
    fontWeight: '800',
    color: '#1E1E24',
    letterSpacing: 1.2,
  },
  badge: {
    backgroundColor: '#1E1E24',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8E8E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonPressed: {
    backgroundColor: '#D0D0CC',
    transform: [{ scale: 0.95 }],
  },
  stepButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E1E24',
    lineHeight: 22,
  },
  trackContainer: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBackground: {
    height: 8,
    backgroundColor: '#E5E5E0',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  centerMark: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#B5B5B0',
    zIndex: 1,
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#E06D53', // Warm terracotta / coral accent
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute',
    top: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E1E24',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
});
