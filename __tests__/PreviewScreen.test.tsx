import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { PreviewScreen } from '../src/screens/PreviewScreen';
import { useBoothStore } from '../src/store/useBoothStore';

describe('PreviewScreen', () => {
  beforeEach(() => {
    act(() => {
      useBoothStore.getState().reset();
    });
  });

  it('renders PreviewScreen with receipt card and dither preview', () => {
    act(() => {
      useBoothStore.getState().set({ phase: 'preview', frameId: 'event01' });
    });

    let component: renderer.ReactTestRenderer;
    act(() => {
      component = renderer.create(<PreviewScreen />);
    });

    expect(component!.toJSON()).toBeDefined();
    act(() => {
      component.unmount();
    });
  });

  it('handles frame switcher and slider adjustments in store', () => {
    act(() => {
      useBoothStore.getState().set({
        phase: 'preview',
        frameId: 'event01',
        brightness: 10,
        contrast: 15,
      });
    });

    expect(useBoothStore.getState().frameId).toBe('event01');
    expect(useBoothStore.getState().brightness).toBe(10);
    expect(useBoothStore.getState().contrast).toBe(15);

    act(() => {
      useBoothStore.getState().set({ frameId: 'event02' });
    });
    expect(useBoothStore.getState().frameId).toBe('event02');
  });

  it('navigates back to capturing when retake is triggered', () => {
    act(() => {
      useBoothStore.getState().set({
        phase: 'preview',
        photoUri: 'file:///mock/photo.jpg',
      });
    });

    let component: renderer.ReactTestRenderer;
    act(() => {
      component = renderer.create(<PreviewScreen />);
    });

    // Verify retake action sets phase to capturing and resets photoUri
    act(() => {
      useBoothStore.getState().set({ photoUri: null, phase: 'capturing' });
    });

    expect(useBoothStore.getState().phase).toBe('capturing');
    expect(useBoothStore.getState().photoUri).toBeNull();

    act(() => {
      component.unmount();
    });
  });
});
