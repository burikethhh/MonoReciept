/* eslint-env jest */

jest.mock('react-native-vision-camera', () => {
  const React = require('react');
  const { View } = require('react-native');

  class MockCamera extends React.Component {
    takePhoto = jest.fn().mockResolvedValue({
      path: '/mock/path/to/photo.jpg',
      width: 1080,
      height: 1920,
    });
    render() {
      return React.createElement(View, this.props, this.props.children);
    }
  }

  return {
    Camera: MockCamera,
    useCameraDevice: jest.fn((position = 'front') => ({
      id: `mock-camera-${position}`,
      position,
      hasFlash: true,
      hasTorch: true,
      devices: ['wide-angle-camera'],
    })),
    useCameraPermission: jest.fn(() => ({
      hasPermission: true,
      requestPermission: jest.fn().mockResolvedValue(true),
    })),
    useCameraDevices: jest.fn(() => []),
    useFrameProcessor: jest.fn(),
  };
});

jest.mock('react-native-ble-plx', () => {
  class MockBleManager {
    startDeviceScan = jest.fn();
    stopDeviceScan = jest.fn();
    onStateChange = jest.fn(callback => {
      callback('PoweredOn');
      return { remove: jest.fn() };
    });
    connectToDevice = jest.fn().mockResolvedValue({
      id: 'mock-mac',
      name: 'MXW01',
      discoverAllServicesAndCharacteristics: jest.fn().mockResolvedValue(null),
      services: jest.fn().mockResolvedValue([{ uuid: '0000ae30-0000-1000-8000-00805f9b34fb' }]),
      monitorCharacteristicForService: jest.fn(),
      writeCharacteristicWithResponseForService: jest.fn().mockResolvedValue(null),
      writeCharacteristicWithoutResponseForService: jest.fn().mockResolvedValue(null),
      onDisconnected: jest.fn(),
      cancelConnection: jest.fn().mockResolvedValue(null),
    });
    destroy = jest.fn();
  }

  return {
    BleManager: MockBleManager,
    Device: jest.fn(),
    BleError: class extends Error {},
    BleErrorCode: {},
  };
});

jest.mock('react-native-mmkv', () => {
  const map = new Map();
  return {
    MMKV: jest.fn().mockImplementation(() => ({
      set: jest.fn((k, v) => map.set(k, v)),
      getString: jest.fn(k => map.get(k)),
      getNumber: jest.fn(k => map.get(k)),
      getBoolean: jest.fn(k => map.get(k)),
      delete: jest.fn(k => map.delete(k)),
      clearAll: jest.fn(() => map.clear()),
    })),
  };
});

jest.mock('react-native-keep-awake', () => {
  const React = require('react');
  class MockKeepAwake extends React.Component {
    static activate = jest.fn();
    static deactivate = jest.fn();
    render() {
      return null;
    }
  }
  return {
    __esModule: true,
    default: MockKeepAwake,
    activate: jest.fn(),
    deactivate: jest.fn(),
  };
});
