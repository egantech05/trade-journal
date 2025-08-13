// components/Icon.web.js
import React from 'react';

// Resolve a URL relative to the page's <base href="./"> (works on GH Pages subpaths)
const rel = (path) => new URL(path.startsWith('./') ? path : `./${path}`, document.baseURI).href;

// Your SVGs live in public/icons/, which are copied to dist/icons/
const ICONS = {
  history: rel('icons/time-outline.svg'),
  'add-circle-outline': rel('icons/add-circle-outline.svg'),
};

export default function Icon({ name, size = 28, color = '#fff', style }) {
  const src = ICONS[name];
  if (!src) return null;

  // If you want tinting, use CSS filters or embed paths; for now render as-is.
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      style={{ display: 'block', ...style }}
      draggable={false}
    />
  );
}
