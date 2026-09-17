import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import KeepAwake from 'react-native-keep-awake';
import { StatusBar } from './src/components/StatusBar';
import { HomeScreen } from './src/screens/HomeScreen';
import { CaptureScreen } from './src/screens/CaptureScreen';
import { PreviewScreen } from './src/screens/PreviewScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { useBoothStore } from './src/store/useBoothStore';

export default function App() {
  const { phase, keepAwakeEnabled } = useBoothStore();

  return (
    <SafeAreaView style={styles.root}>
      {/* Tablet Kiosk Display Sleep Prevention */}
      {keepAwakeEnabled && <KeepAwake />}

      {/* Hide status pill during fullscreen capture or operator settings */}
      {phase !== 'capturing' && phase !== 'settings' && <StatusBar />}

      <View style={styles.content}>
        {phase === 'idle' && <HomeScreen />}
        {phase === 'capturing' && <CaptureScreen />}
        {(phase === 'preview' || phase === 'printing') && <PreviewScreen />}
        {phase === 'settings' && <SettingsScreen />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF7F0',
  },
  content: {
    flex: 1,
  },
});
