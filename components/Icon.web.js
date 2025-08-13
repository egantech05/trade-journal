// components/Icon.web.js
import * as React from 'react';
import { Asset } from 'expo-asset';

// Import the SVG modules
import AddCircle from '../assets/add-circle-outline.svg';
import TimeOutline from '../assets/time-outline.svg';

// Map the names you use in screens -> modules
const sources = {
  'add-circle-outline': AddCircle,
  'time-outline': TimeOutline,
};

// turn whatever Metro/Webpack gives us into a URL string
function toUrl(mod) {
  if (!mod) return null;
  if (typeof mod === 'string') return mod;            // already a URL
  if (mod.default && typeof mod.default === 'string') // ESM default export is URL
    return mod.default;
  if (mod.src && typeof mod.src === 'string')         // some bundlers export {src}
    return mod.src;

  // Expo/Metro asset module -> resolve real URL
  try {
    return Asset.fromModule(mod).uri;
  } catch {
    return null;
  }
}

export default function Icon({ name, size = 28, style, alt }) {
  const src = toUrl(sources[name]);
  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt || name}
      style={{ width: size, height: size, display: 'inline-block', ...style }}
      draggable={false}
    />
  );
}
