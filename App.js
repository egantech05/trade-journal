// App.js
import React, { useEffect, useState } from 'react';
import { Platform, View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigator from './navigation/StackNavigator';

export default function App() {
  const [ready, setReady] = useState(Platform.OS !== 'web');
  const [fontsReady, setFontsReady] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    (async () => {
      // 1) Start MSW
      try {
        const { worker } = require('./src/mocks/browser');
        await worker.start({
          onUnhandledRequest: 'bypass',
          serviceWorker: { url: './mockServiceWorker.js' },
        });
        setReady(true);
      } catch (e) {
        console.error('MSW failed to start', e);
        setReady(true);
      }

      // 2) Load icon fonts
      try {
        const Font = await import('expo-font');
        const icons = await import('@expo/vector-icons');
        await Font.loadAsync({
 
          ...icons.MaterialIcons.font,
        });
      } catch (e) {
        console.warn('Icon font load failed:', e);
      }
      setFontsReady(true);
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
