import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
import { useBoothStore } from '../store/useBoothStore';
import { FRAME_TEMPLATES } from '../assets/frames/frameTemplates';
import { PinPadModal } from '../components/PinPadModal';
import { Colors, Typography, Radii, Shadows } from '../theme/theme';

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
        {/* Top bar with operator lock */}
        <View style={styles.topControlRow}>
          <Pressable
            style={styles.operatorButton}
            onPress={() => setShowPinModal(true)}
          >
            <Text style={styles.operatorButtonText}>OPERATOR LOCK</Text>
          </Pressable>
        </View>

        {/* Editorial Brand Header with Logo */}
        <View style={styles.header}>
          <View style={styles.logoFrame}>
            <Image
              source={require('../assets/logo.jpg')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.goldDivider} />
          <Text style={styles.badge}>THERMAL ATELIER & PHOTOBOOTH</Text>
          <Text style={styles.subtitle}>Select an aesthetic frame to begin your print session</Text>
        </View>

        {/* Frame Selection Gallery */}
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
                  <View>
                    <Text style={styles.cardTitle}>{tmpl.name}</Text>
                    <Text style={styles.cardSubtitle}>{tmpl.subtitle}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>SELECTED</Text>
                    </View>
                  )}
                </View>

                {/* Visual preview dummy representing 384x576 receipt */}
                <View style={styles.miniFramePreview}>
                  <View style={styles.miniHeaderContainer}>
                    <Text style={styles.miniFrameHeader}>{tmpl.headerText}</Text>
                    <View style={styles.miniHeaderLine} />
                  </View>
                  
                  <View style={styles.miniFrameBox}>
                    <View style={styles.miniCornerTL} />
                    <View style={styles.miniCornerTR} />
                    <View style={styles.miniCornerBL} />
                    <View style={styles.miniCornerBR} />
                    <Text style={styles.miniFramePrompt}>PORTRAIT WINDOW</Text>
                    <Text style={styles.miniFrameResolution}>384 × 576 MONOCHROME</Text>
                  </View>

                  <Text style={styles.miniFrameFooter}>{tmpl.footerText}</Text>
                </View>

                <View style={styles.startRow}>
                  <View style={styles.startButton}>
                    <Text style={styles.startButtonText}>BEGIN SESSION</Text>
                    <Text style={styles.startChevron}>→</Text>
                  </View>
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
    backgroundColor: Colors.bgKiosk,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 8,
    alignItems: 'center',
  },
  topControlRow: {
    width: '100%',
    maxWidth: 680,
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  operatorButton: {
    backgroundColor: Colors.surface,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  operatorButtonText: {
    fontSize: 9,
    fontFamily: Typography.sansMedium,
    color: Colors.inkSecondary,
    letterSpacing: Typography.trackingWide,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoFrame: {
    width: 220,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  goldDivider: {
    width: 48,
    height: 1.5,
    backgroundColor: Colors.gold,
    marginVertical: 10,
  },
  badge: {
    fontSize: 10,
    fontFamily: Typography.sansMedium,
    color: Colors.goldDark,
    letterSpacing: Typography.trackingExtraWide,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.inkSecondary,
    textAlign: 'center',
    fontFamily: Typography.serif,
    fontStyle: 'italic',
  },
  cardsContainer: {
    width: '100%',
    maxWidth: 680,
    gap: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  cardSelected: {
    borderColor: Colors.gold,
    borderWidth: 1.5,
    backgroundColor: Colors.surface,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.96,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: Typography.serif,
    color: Colors.inkPrimary,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.inkSecondary,
    marginTop: 3,
    fontFamily: Typography.sans,
    letterSpacing: 0.5,
  },
  activeBadge: {
    backgroundColor: Colors.goldLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  activeBadgeText: {
    color: Colors.goldDark,
    fontSize: 9,
    fontFamily: Typography.sansMedium,
    letterSpacing: Typography.trackingWide,
  },
  miniFramePreview: {
    borderWidth: 1,
    borderColor: Colors.paperBorder,
    borderRadius: Radii.sm,
    padding: 16,
    alignItems: 'center',
    backgroundColor: Colors.paperBg,
    marginBottom: 18,
    ...Shadows.card,
  },
  miniHeaderContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  miniFrameHeader: {
    fontSize: 10,
    fontFamily: Typography.serif,
    fontWeight: '700',
    color: Colors.inkPrimary,
    letterSpacing: 1.5,
  },
  miniHeaderLine: {
    width: 28,
    height: 1,
    backgroundColor: Colors.border,
    marginTop: 4,
  },
  miniFrameBox: {
    width: '100%',
    height: 110,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceWarm,
    position: 'relative',
  },
  miniCornerTL: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 8,
    height: 8,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderColor: Colors.gold,
  },
  miniCornerTR: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: Colors.gold,
  },
  miniCornerBL: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 8,
    height: 8,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderColor: Colors.gold,
  },
  miniCornerBR: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 8,
    height: 8,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: Colors.gold,
  },
  miniFramePrompt: {
    fontSize: 10,
    fontFamily: Typography.sansMedium,
    color: Colors.inkSecondary,
    letterSpacing: 1.5,
  },
  miniFrameResolution: {
    fontSize: 9,
    fontFamily: Typography.mono,
    color: Colors.inkLight,
    marginTop: 4,
    letterSpacing: 1,
  },
  miniFrameFooter: {
    fontSize: 8,
    fontFamily: Typography.sans,
    color: Colors.inkLight,
    letterSpacing: 1,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  startRow: {
    alignItems: 'flex-end',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.inkPrimary,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: Radii.pill,
  },
  startButtonText: {
    fontSize: 10,
    fontFamily: Typography.sansMedium,
    color: Colors.surface,
    letterSpacing: Typography.trackingWide,
  },
  startChevron: {
    fontSize: 12,
    color: Colors.gold,
  },
});
