// App.js
import React, { useEffect, useState } from 'react';
import { Platform, View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigator from './navigation/StackNavigator';

export default function App() {
  const [ready, setReady] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    try {
      
      const { worker } = require('./src/mocks/browser');

      worker
        .start({
          onUnhandledRequest: 'bypass',
          serviceWorker: { url: '/mockServiceWorker.js' }, 
        })
        .then(() => setReady(true))
        .catch((e) => {
          console.error('MSW failed to start', e);
          setReady(true); 
        });
    } catch (e) {
      console.error('demo bootstrap failed', e);
      setReady(true);
    }
  }, []);

  if (!ready) {
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
