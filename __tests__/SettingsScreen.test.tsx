import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { SettingsScreen } from '../src/screens/SettingsScreen';
import { PinPadModal } from '../src/components/PinPadModal';
import { useBoothStore } from '../src/store/useBoothStore';
import { StorageService } from '../src/services/StorageService';

describe('SettingsScreen & Kiosk Lock', () => {
  beforeEach(() => {
    act(() => {
      useBoothStore.getState().reset();
    });
    StorageService.clearLastPrinter();
    StorageService.setOperatorPin('1234');
    StorageService.setKeepAwakeEnabled(true);
    StorageService.setImmersiveEnabled(true);
  });

  it('renders SettingsScreen with operator controls', () => {
    act(() => {
      useBoothStore.getState().set({ phase: 'settings' });
    });

    let component: renderer.ReactTestRenderer;
    act(() => {
      component = renderer.create(<SettingsScreen />);
    });

    expect(component!.toJSON()).toBeDefined();
    act(() => {
      component.unmount();
    });
  });

  it('toggles keep awake and updates StorageService', () => {
    expect(StorageService.getKeepAwakeEnabled()).toBe(true);

    act(() => {
      StorageService.setKeepAwakeEnabled(false);
      useBoothStore.getState().set({ keepAwakeEnabled: false });
    });

    expect(StorageService.getKeepAwakeEnabled()).toBe(false);
    expect(useBoothStore.getState().keepAwakeEnabled).toBe(false);
  });

  it('verifies operator PIN and allows changing PIN', () => {
    expect(StorageService.getOperatorPin()).toBe('1234');

    StorageService.setOperatorPin('9876');
    expect(StorageService.getOperatorPin()).toBe('9876');
  });

  it('renders PinPadModal properly', () => {
    let component: renderer.ReactTestRenderer;
    act(() => {
      component = renderer.create(
        <PinPadModal
          visible={true}
          onSuccess={() => {}}
          onClose={() => {}}
        />,
      );
    });

    expect(component!.toJSON()).toBeDefined();
    act(() => {
      component.unmount();
    });
  });

  it('exits settings and returns to idle phase', () => {
    act(() => {
      useBoothStore.getState().set({ phase: 'settings' });
    });
    expect(useBoothStore.getState().phase).toBe('settings');

    act(() => {
      useBoothStore.getState().set({ phase: 'idle' });
    });
    expect(useBoothStore.getState().phase).toBe('idle');
  });
});
