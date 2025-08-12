worker.start({
  onUnhandledRequest: 'bypass',
  serviceWorker: { url: './mockServiceWorker.js' } // <- relative!
})