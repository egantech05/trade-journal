import React from 'react';

export default function MIcon({ name, size = 28, color = '#fff', style }) {
  const s = { fontSize: size, color, lineHeight: 1, display: 'inline-block', ...style };
  return <span className="material-symbols-outlined" style={s}>{name}</span>;
}