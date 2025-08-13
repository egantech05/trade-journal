// Uses @expo/vector-icons on iOS/Android
import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';

export default function MIcon({ name, size = 28, color = '#fff', style }) {
  return <MaterialIcons name={name} size={size} color={color} style={style} />;
}
