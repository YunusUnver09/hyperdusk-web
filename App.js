import React, { useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { gameBundleHtml } from './gameBundle';

export default function App() {
  useEffect(() => {
    async function lockOrientation() {
      try {
        if (Platform.OS !== 'web') {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
      } catch (e) {
        // ignore
      }
    }
    lockOrientation();
  }, []);

  return (
    <View style={styles.container}>
      <ExpoStatusBar style="light" hidden={true} />
      <WebView
        source={{ html: gameBundleHtml }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        androidHardwareAccelerationDisabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070913',
  },
  webview: {
    flex: 1,
    backgroundColor: '#070913',
  },
});
