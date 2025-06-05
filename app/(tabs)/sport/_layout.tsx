import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Cricket from './cricket';
import Football from './football';
const tabs = ['Football', 'Cricket'];

export default function EntertainmentLayout() {
  const [activeTab, setActiveTab] = useState('Football');

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => handleTabPress(tab)}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {activeTab === 'Football' && <Football />}
        {activeTab === 'Cricket' && <Cricket />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
    flex: 1,
    backgroundColor: '#000',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#000', 
  },
  tabButton: {
    minWidth: 50,
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#888',
    backgroundColor: '#1B2631',
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  tabText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 15,
  },
  activeTabText: {
    color: '#000',
    fontWeight: '700',
  },
  content: {
    marginTop: 5,
    flex: 1,
    backgroundColor: '#1B2631', 
  },
});
