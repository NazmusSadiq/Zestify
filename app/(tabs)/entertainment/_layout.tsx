import SearchBar from '@/components/SearchBar';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Book from './book';
import Game from './game';
import Movie from './movie';
import Music from './music';
import TV_Series from './tv_series';

const tabs = ['Movie', 'TV Series', 'Music', 'Game', 'Book'];

export default function EntertainmentLayout() {
  const [activeTab, setActiveTab] = useState('Movie');

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
        <View style={styles.searchContainer}>
          <SearchBar activeTab={activeTab} />
        </View>

        {activeTab === 'Movie' && <Movie />}
        {activeTab === 'TV Series' && <TV_Series />}
        {activeTab === 'Music' && <Music />}
        {activeTab === 'Game' && <Game />}
        {activeTab === 'Book' && <Book />}
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
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 0,
    marginTop: -5,
  },
});
