import React, { useState, useEffect,useRef } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, Image, TouchableOpacity, Platform } from 'react-native';
import { addTrade } from '../services/database'; 

const playbookOptions = [ 'Breakout Strategy', 'Reversal Strategy'];
const instrumentOptions = ['XAUUSD.s'];

function getCurrentDateTime() {
  const now = new Date();
  
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export default function TradeModal({ visible, onClose,onSubmitted  }) {
  const [playbook, setPlaybook] = useState('Breakout Strategy');
  const [entryTime, setEntryTime] = useState(getCurrentDateTime());
  const [symbol, setSymbol] = useState('XAUUSD.s');
  const [price, setPrice] = useState('');
  const fileInputRef = useRef(null);
  const [position, setPosition] = useState('Buy'); 





useEffect(() => {
  if (visible) {
    setEntryTime(getCurrentDateTime());
  }
}, [visible]);

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






  const [lotSize, setLotSize] = useState('0.03');
  const [remarks, setRemarks] = useState('');
  const [snapshotUri, setSnapshotUri] = useState(null);
  const [snapshotFile, setSnapshotFile] = useState(null);





const pickImage = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      allowsEditing: true,
      base64: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const mimeType = asset.mimeType || '';

     
      if (!['image/png', 'image/jpeg'].includes(mimeType)) {
        alert('Only PNG or JPEG images are allowed.');
        return;
      }

      const base64 = asset.base64;
      const dataUri = `data:${mimeType};base64,${base64}`;

      setSnapshotUri(dataUri); 
    }
  } catch (err) {
    console.error('Error picking image:', err);
  }
};


const handleSubmit = async () => {
  try {
   
    const sessionRes = await fetch('/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        remarks, 
        entry_time: entryTime,  
      }),
    });
    const sessionResult = await sessionRes.json();
    if (!sessionResult.success || !sessionResult.id) {
      alert('Failed to create session!');
      return;
    }
    const tradeId = sessionResult.id;

   
    const formData = new FormData();
    formData.append('entry_time', entryTime);
    formData.append('entry_price', parseFloat(price));
    formData.append('entry_size', parseFloat(lotSize));
    formData.append('remarks', remarks);
    formData.append('position', position);
    if (snapshotFile) {
      formData.append('entry_snapshot', snapshotFile);
    }

    const subentryRes = await fetch(`/trades/${tradeId}/subentries`, {
      method: 'POST',
      body: formData,
    });
    const subentryResult = await subentryRes.json();
    if (!subentryResult.success) {
      alert('Failed to add subentry!');
      return;
    }

   
    onSubmitted?.();
    setPlaybook('Brian M1');
    setEntryTime(getCurrentDateTime());
    setSymbol('XAUUSD.s');
    setPrice('');
    setLotSize('0.03');
    setRemarks('');
    setSnapshotUri(null);
    setSnapshotFile(null);
    onClose();

  } catch (error) {
    console.error('Error submitting trade:', error);
    alert('Submission failed.');
  }
};







  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={{ color: 'white', fontSize: 18 }}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Playbook</Text>
          <View style={styles.dropdown}>
            <Text style={styles.dropdownText}>{playbook}</Text>
          </View>

          <Text style={styles.label}>Time</Text>
          
      
              <TextInput
                value={entryTime}
                onChangeText={setEntryTime}
                style={styles.input}
                placeholder="YYYY-MM-DD HH:mm"
                placeholderTextColor="#888"
              />
         

          <Text style={styles.label}>Symbol</Text>
          <View style={styles.dropdown}>
            <Text style={styles.dropdownText}>{symbol}</Text>
          </View>
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


          <Text style={styles.label}>Price</Text>
          <TextInput
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              style={styles.input}
          />

          <Text style={styles.label}>Lot Size</Text>
          <TextInput value={lotSize} onChangeText={setLotSize} keyboardType="numeric" style={styles.input} />

          <Text style={styles.label}>Remarks</Text>
          <TextInput value={remarks} onChangeText={setRemarks} multiline style={[styles.input, { height: 70 }]} />

          <Text style={styles.label}>Add Snapshot</Text>
          <input
            type="file"
            accept="image/png,image/jpeg"
            style={{ color: 'white', marginTop: 10, marginBottom: 10 }}
            onChange={e => {
              const file = e.target.files[0];
              if (!file) return;
              setSnapshotFile(file);
              setSnapshotUri(URL.createObjectURL(file));
            }}
          />
          {snapshotUri && (
            <img
              src={snapshotUri}
              style={{ height: 200, marginTop: 10, borderRadius: 8, objectFit: 'contain' }}
            />
          )}



          <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
            <Text style={styles.submitText}>SUBMIT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center',
  },
  modal: {
    backgroundColor: '#2a2a2a',
    width: '90%',
    padding: 20,
    borderRadius: 15,
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    zIndex: 10,
  },
  label: {
    color: 'white',
    marginTop: 10,
    marginBottom: 5,
    fontWeight: '600',
  },
  dropdown: {
    backgroundColor: '#1e1e1e',
    padding: 10,
    borderRadius: 8,
  },
  dropdownText: {
    color: 'white',
  },

  timeInput: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    color: 'white',
    borderRadius: 8,
    padding: 10,
    marginRight: 5,
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: 'white',
    borderRadius: 8,
    padding: 10,
  },
  addSnapshotButton: {
    backgroundColor: '#444',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  addSnapshotText: {
    color: 'white',
  },
  snapshotImage: {
    height: 100,
    width: '100%',
    marginTop: 10,
    borderRadius: 8,
  },
  submitButton: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  submitText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
