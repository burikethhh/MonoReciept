import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useBoothStore } from '../store/useBoothStore';
import { FRAME_TEMPLATES } from '../assets/frames/frameTemplates';
import { PinPadModal } from '../components/PinPadModal';

export function HomeScreen() {
  const { frameId, set } = useBoothStore();
  const [showPinModal, setShowPinModal] = useState(false);

  const handleSelectFrame = (id: string) => {
    set({ frameId: id, phase: 'capturing' });
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    set({ phase: 'settings' });
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.root}>
        <View style={styles.topControlRow}>
          <Pressable
            style={styles.operatorButton}
            onPress={() => setShowPinModal(true)}
          >
            <Text style={styles.operatorButtonText}>⚙ OPERATOR</Text>
          </Pressable>
        </View>

        <View style={styles.header}>
          <Text style={styles.badge}>THERMAL PHOTOBOOTH</Text>
          <Text style={styles.title}>MonoReciept</Text>
          <Text style={styles.subtitle}>Select a frame theme to start your photobooth session</Text>
        </View>

      <View style={styles.cardsContainer}>
        {Object.values(FRAME_TEMPLATES).map(tmpl => {
          const isSelected = frameId === tmpl.id;
          return (
            <Pressable
              key={tmpl.id}
              style={({ pressed }) => [
                styles.card,
                isSelected && styles.cardSelected,
                pressed && styles.cardPressed,
              ]}
              onPress={() => handleSelectFrame(tmpl.id)}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{tmpl.name}</Text>
                {isSelected && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>SELECTED</Text>
                  </View>
                )}
              </View>

              <Text style={styles.cardSubtitle}>{tmpl.subtitle}</Text>

              {/* Visual preview dummy representing 384x576 receipt */}
              <View style={styles.miniFramePreview}>
                <Text style={styles.miniFrameHeader}>{tmpl.headerText}</Text>
                <View style={styles.miniFrameBox}>
                  <Text style={styles.miniFramePrompt}>Tap to Capture</Text>
                </View>
                <Text style={styles.miniFrameFooter}>{tmpl.footerText}</Text>
              </View>

              <View style={styles.startRow}>
                <Text style={styles.startButtonText}>START CAPTURE →</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      </ScrollView>

      <PinPadModal
        visible={showPinModal}
        onSuccess={handlePinSuccess}
        onClose={() => setShowPinModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF7F0',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 12,
    alignItems: 'center',
  },
  topControlRow: {
    width: '100%',
    maxWidth: 640,
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  operatorButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  operatorButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#666670',
    letterSpacing: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E06D53',
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#1E1E24',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666670',
    marginTop: 6,
    textAlign: 'center',
  },
  cardsContainer: {
    width: '100%',
    maxWidth: 640,
    gap: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardSelected: {
    borderColor: '#1E1E24',
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E1E24',
  },
  activeBadge: {
    backgroundColor: '#1E1E24',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#777780',
    marginBottom: 16,
  },
  miniFramePreview: {
    borderWidth: 1.5,
    borderColor: '#1E1E24',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#FAFAF8',
    marginBottom: 16,
  },
  miniFrameHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E1E24',
    letterSpacing: 1,
    marginBottom: 8,
  },
  miniFrameBox: {
    width: '100%',
    height: 100,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderStyle: 'dashed',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  miniFramePrompt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999999',
    letterSpacing: 1,
  },
  miniFrameFooter: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1E1E24',
    letterSpacing: 1,
    marginTop: 8,
  },
  startRow: {
    alignItems: 'flex-end',
  },
  startButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E06D53',
    letterSpacing: 1,
  },
});
