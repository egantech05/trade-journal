// App.js
import React, { useEffect, useState } from 'react';
import { Platform, View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigator from './navigation/StackNavigator';

const isWeb = Platform.OS === 'web';

export default function App() {
  // MSW ready (web) and icon fonts ready (native)
  const [ready, setReady] = useState(!isWeb);
  const [fontsReady, setFontsReady] = useState(!isWeb);

  useEffect(() => {
    // ---- WEB: start MSW only; DO NOT load icon TTFs via expo-font ----
    if (isWeb) {
      (async () => {
        try {
          const { worker } = require('./src/mocks/browser');
          await worker.start({
            onUnhandledRequest: 'bypass',
            serviceWorker: { url: './mockServiceWorker.js' },
          });
        } catch (e) {
          console.warn('MSW failed to start', e);
        } finally {
          setReady(true);
          // Icons on web come from <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
          setFontsReady(true);
        }
      })();
      return;
    }

    // ---- NATIVE: preload vector-icon fonts with expo-font ----
    (async () => {
      try {
        const Font = await import('expo-font');
        const icons = await import('@expo/vector-icons');
        await Font.loadAsync({
          ...icons.MaterialIcons.font,
          // add more if you ever use them natively, e.g. Ionicons/Entypo
          // ...icons.Ionicons.font,
          // ...icons.Entypo.font,
        });
      } catch (e) {
        console.warn('Icon font load failed (native):', e);
      } finally {
        setFontsReady(true);
        setReady(true);
      }
    })();
  }, []);

  if (!ready || !fontsReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <ActivityIndicator />
        <Text>Starting demo…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StackNavigator />
    </NavigationContainer>
  );
}
