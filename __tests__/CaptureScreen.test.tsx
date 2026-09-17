import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { CaptureScreen } from '../src/screens/CaptureScreen';
import { useBoothStore } from '../src/store/useBoothStore';
import { FRAME_TEMPLATES } from '../src/assets/frames/frameTemplates';

describe('CaptureScreen & Store', () => {
  beforeEach(() => {
    act(() => {
      useBoothStore.getState().reset();
    });
  });

  it('renders CaptureScreen with frame ghost', () => {
    act(() => {
      useBoothStore.getState().set({ phase: 'capturing', frameId: 'event01' });
    });
    let component: renderer.ReactTestRenderer;
    act(() => {
      component = renderer.create(<CaptureScreen />);
    });
    expect(component!.toJSON()).toBeDefined();
    act(() => {
      component.unmount();
    });
  });

  it('stores frameTemplates correctly', () => {
    expect(FRAME_TEMPLATES.event01).toBeDefined();
    expect(FRAME_TEMPLATES.event01.width).toBe(384);
    expect(FRAME_TEMPLATES.event02).toBeDefined();
  });

  it('transitions phase to idle on cancel/reset', () => {
    act(() => {
      useBoothStore.getState().set({ phase: 'capturing' });
    });
    expect(useBoothStore.getState().phase).toBe('capturing');

    act(() => {
      useBoothStore.getState().reset();
    });

    expect(useBoothStore.getState().phase).toBe('idle');
    expect(useBoothStore.getState().photoUri).toBeNull();
  });
});
