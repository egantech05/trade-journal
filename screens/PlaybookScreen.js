import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, Entypo, MaterialIcons } from '@expo/vector-icons';
import AddPlaybookModal from '../components/AddPlaybookModal';
import TradeModal from '../components/TradeModal'; 

export default function PlaybookScreen({ navigation }) {
  const [playbooks, setPlaybooks] = useState([
    {
      name: 'Order Block',
      description: `Wait for MACD 12,26,9 cross and MA 2 cross MA 7 in RSI 14.\nExit when MACD crossed.\nTP at 30 pip.`,
    },
  ]);

  const [playbookModalVisible, setPlaybookModalVisible] = useState(false);
  const [tradeModalVisible, setTradeModalVisible] = useState(false); 

  const handleAddPlaybook = (newPlaybook) => {
    setPlaybooks((prev) => [...prev, newPlaybook]);
  };

  return (
    <View style={styles.container}>
    
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.logo}>tbuuk.</Text>
        </TouchableOpacity>
      </View>

    
      <View style={styles.sidebar}>
        <TouchableOpacity onPress={() => navigation.navigate('History')}>
          <Ionicons name="time-outline" size={28} color="#fff" style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Playbook')}>
          <Entypo name="open-book" size={28} color="#fff" style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTradeModalVisible(true)}>
          <MaterialIcons name="add-circle-outline" size={30} color="#fff" style={styles.icon} />
        </TouchableOpacity>
      </View>

     
      <View style={styles.mainContent}>
        <Text style={styles.pageTitle}>Playbook</Text>

        <ScrollView contentContainerStyle={styles.cardContainer}>
          
          <TouchableOpacity style={styles.addCard} onPress={() => setPlaybookModalVisible(true)}>
            <Ionicons name="add" size={40} color="#fff" />
          </TouchableOpacity>

          
          {playbooks.map((pb, index) => (
            <View key={index} style={styles.playbookCard}>
              <Text style={styles.playbookLabel}>Name</Text>
              <Text style={styles.playbookTitle}>{pb.name}</Text>
              <Text style={styles.playbookLabel}>Description</Text>
              <Text style={styles.playbookDescription}>{pb.description}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

    
      <AddPlaybookModal
        visible={playbookModalVisible}
        onClose={() => setPlaybookModalVisible(false)}
        onSubmit={handleAddPlaybook}
      />

      <TradeModal
        visible={tradeModalVisible}
        onClose={() => setTradeModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#1e1e1e',
  },
  topBar: {
    height: 50,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sidebar: {
    position: 'absolute',
    top: 50, 
    left: 0,
    width: 60,
    bottom: 0,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    paddingTop: 10,
    zIndex: 1000,
  },
  icon: {
    marginVertical: 20,
  },
  mainContent: {
    marginLeft: 60,
    padding: 20,
    flex: 1,
  },
  pageTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  addCard: {
    width: 150,
    height: 180,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playbookCard: {
    width: 150,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
  },
  playbookLabel: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 2,
  },
  playbookTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  playbookDescription: {
    color: '#fff',
    fontSize: 13,
    whiteSpace: 'pre-line',
  },
});
