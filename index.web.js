// index.web.js
import { registerRootComponent } from 'expo';
import App from './App';

// Force-load vector icon fonts on web
import { Ionicons, Entypo, MaterialIcons } from '@expo/vector-icons';

async function bootstrap() {
  try {
    // These calls bundle the TTFs and load them via expo-font
    await Promise.all([
      Ionicons.loadFont(),
      Entypo.loadFont(),
      MaterialIcons.loadFont(),
    ]);
  } catch (e) {
    console.warn('Icon font load failed:', e);
  }

  registerRootComponent(App);
}

bootstrap();
