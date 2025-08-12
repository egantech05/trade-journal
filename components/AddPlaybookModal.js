import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function AddPlaybookModal({ visible, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a strategy name');
      return;
    }

    const newPlaybook = { name: name.trim(), description: description.trim() };
    onSubmit(newPlaybook);
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
       
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={{ color: '#fff', fontSize: 18 }}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="Enter strategy name"
            placeholderTextColor="#aaa"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
            placeholder="Enter description"
            placeholderTextColor="#aaa"
            multiline
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
            <Text style={styles.submitText}>SUBMIT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    paddingTop: 40,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 10,
  },
  label: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#dcdcdc',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    color: '#000',
  },
  submitButton: {
    backgroundColor: '#000',
    marginTop: 30,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
