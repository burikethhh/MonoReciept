declare module 'react-native-keep-awake' {
  import React from 'react';

  export default class KeepAwake extends React.Component<{ children?: React.ReactNode }> {
    static activate(): void;
    static deactivate(): void;
  }
}
