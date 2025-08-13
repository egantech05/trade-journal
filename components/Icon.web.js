import * as React from 'react';

// Importing ensures Expo/Metro copies these into the web build and
// returns a correct hashed URL we can use in <img src="...">
import AddCircle from '../assets/add-circle-outline.svg';
import TimeOutline from '../assets/time-outline.svg';

const sources = {
  'add-circle-outline': AddCircle,
  'time-outline': TimeOutline,
};

export default function Icon({ name, size = 28, style, alt }) {
  const src = sources[name];
  if (!src) return null; // Or render a fallback

  return (
    <img
      src={src}
      alt={alt || name}
      style={{ width: size, height: size, display: 'inline-block', ...style }}
      draggable={false}
    />
  );
}
