// index.web.js (at project root)
import { worker } from './src/mocks/browser.js';

async function boot() {
  if (!worker.listening) {
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: { url: '/mockServiceWorker.js' },
    });
  }
  const { registerRootComponent } = await import('expo');
  const { default: App } = await import('./App.js');
  registerRootComponent(App);
}

boot();
