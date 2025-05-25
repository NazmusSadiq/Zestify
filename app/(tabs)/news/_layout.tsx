import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import News_Sports from './news-sports';
import News_All from './news_all';
import News_Games from './news_games';
import News_Media from './news_media';
import News_Music from './news_music';
const tabs = ['All','Media','Music', 'Game', 'Sports'];

export default function EntertainmentLayout() {
  const [activeTab, setActiveTab] = useState('All');

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
        {activeTab === 'All' && <News_All />}
        {activeTab === 'Media' && <News_Media />}
        {activeTab === 'Music' && <News_Music />}
        {activeTab === 'Game' && <News_Games />}
        {activeTab === 'Sports' && <News_Sports />}
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
    padding: 10,
  },
});
