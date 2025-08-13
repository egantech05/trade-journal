import React from 'react';
import { Text } from 'react-native';

export default function MIcon({ name, size = 28, color = '#fff', style }) {
  return (
    <Text
      // RN Web understands these and converts to CSS
      style={[
        {
          fontFamily: 'Material Symbols Outlined',
          fontSize: size,
          lineHeight: size,
          color,
        },
        style,
      ]}
      // no className needed; we set the variation inline:
      // RN Web passes unknown style keys to CSS, so this works:
      // @ts-ignore (if TS complains)
      fontVariationSettings="'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"
      accessible={false}
      aria-hidden="true"
    >
      {name}
    </Text>
  );
}
