import React, { useState, useEffect, useRef  } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

function getCurrentDateTime() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export default function ExitEntryModal({
  visible,
  onClose,
  onSubmit,
  entryPrice,
  entrySize,
}) {
  const [price, setPrice] = useState('');
  const [size, setSize] = useState('');
  const [time, setTime] = useState('');
  const [snapshotFile, setSnapshotFile] = useState(null);
  const [snapshotUri, setSnapshotUri] = useState(null);

 
  useEffect(() => {
    if (visible) {
      setPrice(entryPrice ? String(entryPrice) : '');
      setSize(entrySize ? String(entrySize) : '');
      setTime(getCurrentDateTime());
      setSnapshotFile(null);
      setSnapshotUri(null);
    }
  }, [visible, entryPrice, entrySize]);

  useEffect(() => {
  if (!visible) return;

  function handlePaste(event) {
    if (event.clipboardData && event.clipboardData.items) {
      for (const item of event.clipboardData.items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            setSnapshotFile(file);
            setSnapshotUri(URL.createObjectURL(file));
            event.preventDefault();
            break;
          }
        }
      }
    }
  }
  window.addEventListener('paste', handlePaste);
  return () => window.removeEventListener('paste', handlePaste);
}, [visible]);


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSnapshotFile(file);
    setSnapshotUri(URL.createObjectURL(file));
  };

  const handleSubmit = () => {
    if (!price || !size || !time) {
      alert('Please fill in all fields');
      return;
    }
    onSubmit({
      exitPrice: price,
      exitSize: size,
      exitTime: time,
      exitSnapshot: snapshotFile,
    });
    onClose();
    setPrice('');
    setSize('');
    setTime('');
    setSnapshotFile(null);
    setSnapshotUri(null);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Add Exit Details</Text>

          <Text style={styles.label}>Exit Price</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            style={styles.input}
            keyboardType="numeric"
            placeholder="e.g. 3360.50"
            placeholderTextColor="#aaa"
          />

          <Text style={styles.label}>Exit Size</Text>
          <TextInput
            value={size}
            onChangeText={setSize}
            style={styles.input}
            keyboardType="numeric"
            placeholder="e.g. 0.01"
            placeholderTextColor="#aaa"
          />

          <Text style={styles.label}>Exit Time</Text>
          <TextInput
            value={time}
            onChangeText={setTime}
            style={styles.input}
            placeholder="e.g. 2025-07-27 13:45"
            placeholderTextColor="#aaa"
          />

          <Text style={styles.label}>Add Exit Snapshot</Text>
          <input
            type="file"
            accept="image/png,image/jpeg"
            style={{ color: 'white', marginTop: 10, marginBottom: 10 }}
            onChange={handleFileChange}
          />
          {snapshotUri && (
            <img
              src={snapshotUri}
              alt="Exit Snapshot Preview"
              style={{
                height: 200,
                marginTop: 10,
                borderRadius: 8,
                objectFit: 'contain',
              }}
            />
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.cancel]} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.save]} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center',
  },
  modal: {
    backgroundColor: '#1e1e1e',
    width: '90%',
    borderRadius: 12,
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  label: {
    color: '#ccc',
    marginTop: 12,
    marginBottom: 4,
    fontSize: 12,
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 8,
    padding: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  cancel: {
    backgroundColor: '#444',
  },
  save: {
    backgroundColor: '#1ec772',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
