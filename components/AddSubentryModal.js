import React, { useState,useRef,useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

function getCurrentDateTime() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export default function AddSubentryModal({ visible, onClose, onSubmit, mainEntryPrice  }) {
  const [entryTime, setEntryTime] = useState(getCurrentDateTime());
  const [entryPrice, setEntryPrice] = useState('');
  const [entrySize, setEntrySize] = useState('');
  const [remarks, setRemarks] = useState('');
  const [snapshotFile, setSnapshotFile] = useState(null);
  const [snapshotUri, setSnapshotUri] = useState(null);
  const fileInputRef = useRef(null);
  const [position, setPosition] = useState('Buy'); 

useEffect(() => {
  if (visible) {
    setEntryTime(getCurrentDateTime());
    setEntryPrice(mainEntryPrice ? String(mainEntryPrice) : '');
    setEntrySize('');
    setRemarks('');
    setSnapshotFile(null);
    setSnapshotUri(null);
    setPosition('Buy');
  }

}, [visible, mainEntryPrice]);

useEffect(() => {
  if (!visible) return;

  function handlePaste(event) {
    if (event.clipboardData && event.clipboardData.items) {
      for (const item of event.clipboardData.items) {
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            setSnapshotFile(blob);
            setSnapshotUri(URL.createObjectURL(blob));
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
    if (!entryTime || !entryPrice || !entrySize) {
      alert('Please fill all required fields.');
      return;
    }
    onSubmit({
      entry_time: entryTime,
      entry_price: entryPrice,
      entry_size: entrySize,
      remarks,
      entry_snapshot: snapshotFile,
      position,
    });
    setEntryTime(getCurrentDateTime());
    setEntryPrice('');
    setEntrySize('');
    setRemarks('');
    setSnapshotFile(null);
    setSnapshotUri(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Add Subentry</Text>
          <Text style={styles.label}>Position</Text>
                <select
                value={position}
                onChange={e => setPosition(e.target.value)}
                style={{
                    backgroundColor: '#1e1e1e',
                    color: 'white',
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 10,
                    width: '100%',
                    border: 'none',
                    fontSize: 16,
                }}
                >
                <option value="Buy">Buy</option>
                <option value="Sell">Sell</option>
</select>

          <Text style={styles.label}>Entry Time</Text>
          <TextInput value={entryTime} onChangeText={setEntryTime} style={styles.input} />
          <Text style={styles.label}>Entry Price</Text>
          <TextInput value={entryPrice} onChangeText={setEntryPrice} style={styles.input} keyboardType="numeric" />
          <Text style={styles.label}>Entry Size</Text>
          <TextInput value={entrySize} onChangeText={setEntrySize} style={styles.input} keyboardType="numeric" />
          <Text style={styles.label}>Remarks</Text>
          <TextInput value={remarks} onChangeText={setRemarks} style={styles.input} />

          <Text style={styles.label}>Add Snapshot</Text>
          <input
            type="file"
            accept="image/png,image/jpeg"
            style={{ color: 'white', marginTop: 10, marginBottom: 10 }}
            onChange={handleFileChange}
          />
          {snapshotUri && (
            <img
              src={snapshotUri}
              alt="Snapshot Preview"
              style={{ height: 200, marginTop: 10, borderRadius: 8, objectFit: 'contain' }}
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
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 10,
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
