import * as React from 'react';
import { MaterialIcons } from '@expo/vector-icons';

export default function Icon(props) {
  // Same API as MaterialIcons so your screens don't change
  return <MaterialIcons {...props} />;
}
