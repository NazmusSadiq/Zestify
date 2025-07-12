import CompanyDetailsModal from '@/components/CompanyDetails';
import GameDetails from '@/components/GameDetails';
import type { CompanyDetails } from '@/services/GameAPI';
import {
  fetchDeveloperDetails,
  fetchGameDetails,
  fetchNewReleases,
  fetchPublisherDetails,
  fetchTopDevelopers,
  fetchTopPublishers,
  fetchTopRatedGames,
  fetchTrendingGames,
  fetchUpcomingGames,
  Game
} from '@/services/GameAPI';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Games() {  const [trendingGames, setTrendingGames] = useState<Game[]>([]);
  const [newReleases, setNewReleases] = useState<Game[]>([]);
  const [topRatedGames, setTopRatedGames] = useState<Game[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);  const [topPublishers, setTopPublishers] = useState<CompanyDetails[]>([]);
  const [topDevelopers, setTopDevelopers] = useState<CompanyDetails[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetails | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [companyModalVisible, setCompanyModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadGames = async () => {
    try {
      const [
        trendingData,
        newReleasesData,
        topRatedData,
        upcomingData,
        publishersData,
        developersData
      ] = await Promise.all([
        fetchTrendingGames(),
        fetchNewReleases(),
        fetchTopRatedGames(),
        fetchUpcomingGames(),
        fetchTopPublishers(),
        fetchTopDevelopers(),
      ]);
      
      setTrendingGames(trendingData.results);
      setNewReleases(newReleasesData.results);
      setTopRatedGames(topRatedData.results);
      setUpcomingGames(upcomingData.results);
      setTopPublishers(publishersData.results);
      setTopDevelopers(developersData.results);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadGames();
  };

  const handleGamePress = async (gameId: number) => {
    try {
      const gameDetails = await fetchGameDetails(gameId);
      setSelectedGame(gameDetails);
      setModalVisible(true);
    } catch (error) {
      console.error('Error fetching game details:', error);
    }
  };

  const renderGameItem = ({ item }: { item: Game }) => (
    <TouchableOpacity
      style={styles.gameCard}
      onPress={() => handleGamePress(item.id)}
    >
      <Image
        source={{ uri: item.background_image }}
        style={styles.gameImage}
        resizeMode="cover"
      />
      <View style={styles.gameInfo}>
        <Text style={styles.gameTitle} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.gameRating}>Rating: {item.rating}/5</Text>
        <Text style={styles.gameReleased}>
          Released: {new Date(item.released).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }
  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* <LinearGradient
        colors={['#4c669f', '#3b5998', '#192f6a']}
        style={styles.headerGradient}
      >
        <Text style={styles.title}>Games</Text>
      </LinearGradient> */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trending Games</Text>
        <FlatList
          data={trendingGames}
          renderItem={renderGameItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>New Releases</Text>
        <FlatList
          data={newReleases}
          renderItem={renderGameItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Rated All Time</Text>
        <FlatList
          data={topRatedGames}
          renderItem={renderGameItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Games</Text>
        <FlatList
          data={upcomingGames}
          renderItem={renderGameItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Publishers</Text>
        <FlatList
          data={topPublishers}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.companyCard}
              onPress={async () => {
                const details = await fetchPublisherDetails(item.id);
                setSelectedCompany(details);
                setCompanyModalVisible(true);
              }}
            >
              <Image
                source={{ uri: item.image_background }}
                style={styles.companyImage}
                resizeMode="cover"
              />
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>{item.name}</Text>
                <Text style={styles.companyGames}>Games: {item.games_count}</Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Developers</Text>
        <FlatList
          data={topDevelopers}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.companyCard}
              onPress={async () => {
                const details = await fetchDeveloperDetails(item.id);
                setSelectedCompany(details);
                setCompanyModalVisible(true);
              }}
            >
              <Image
                source={{ uri: item.image_background }}
                style={styles.companyImage}
                resizeMode="cover"
              />
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>{item.name}</Text>
                <Text style={styles.companyGames}>Games: {item.games_count}</Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      <GameDetails
        game={selectedGame}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />

      <CompanyDetailsModal
        company={selectedCompany}
        visible={companyModalVisible}
        onClose={() => setCompanyModalVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B2631",
  },
  headerGradient: {
    padding: 20,
    paddingTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  section: {
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  listContainer: {
    paddingVertical: 5,
  },
  gameCard: {
    width: 250,
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  gameImage: {
    width: '100%',
    height: 140,
  },
  gameInfo: {
    padding: 12,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  gameRating: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 2,
  },
  gameReleased: {
    fontSize: 14,
    color: '#CCCCCC',
  },  companyCard: {
    width: 280,
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  companyImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#2A2A2A',
  },
  companyInfo: {
    padding: 12,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  companyGames: {
    fontSize: 14,
    color: '#CCCCCC',
  },
});
