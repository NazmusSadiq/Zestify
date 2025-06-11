import { Game, fetchFilteredGames } from '@/services/GameAPI';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import GameFilterDetails from './GameFilterDetails';

interface GameFilteredViewerProps {
  data: Game[] | null;
  visible: boolean;
  onClose: () => void;
}

const ORDER_OPTIONS = [
  { label: 'Name', value: 'name' },
  { label: 'Release Date', value: '-released' },
  { label: 'Popularity', value: '-metacritic' },
  { label: 'Average Rating', value: '-rating' },
];

const PLATFORM_OPTIONS = [
  { label: 'PC', value: '4' },
  { label: 'PlayStation', value: '187' },
  { label: 'Xbox', value: '1' },
  { label: 'iOS', value: '3' },
  { label: 'Android', value: '21' },
  { label: 'Apple Macintosh', value: '5' },
  { label: 'Linux', value: '6' },
  { label: 'Nintendo', value: '7' },
  { label: 'Atari', value: '8' },
  { label: 'SEGA', value: '11' },
  { label: '3DO', value: '13' },
  { label: 'Neo Geo', value: '12' },
  { label: 'Web', value: '171' },
];

const GameFilteredViewer = ({ data, visible, onClose }: GameFilteredViewerProps) => {
  const [selectedOrder, setSelectedOrder] = useState(ORDER_OPTIONS[0]);
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORM_OPTIONS[0]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);

  useEffect(() => {
    if (data) {
      setFilteredGames(data);
    }
  }, [data]);

  const handleOrderChange = async (order: typeof ORDER_OPTIONS[0]) => {
    setSelectedOrder(order);
    setShowOrderDropdown(false);
    setIsLoading(true);
    try {
      const response = await fetchFilteredGames({
        ordering: order.value,
        platforms: selectedPlatform.value,
      });
      setFilteredGames(response.results);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlatformChange = async (platform: typeof PLATFORM_OPTIONS[0]) => {
    setSelectedPlatform(platform);
    setShowPlatformDropdown(false);
    setIsLoading(true);
    try {
      const response = await fetchFilteredGames({
        ordering: selectedOrder.value,
        platforms: platform.value,
      });
      setFilteredGames(response.results);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setIsLoading(false);
    }
  };
    // useEffect(() => { 
    //   console.log('Selected Game:', selectedGame);
    // }, [selectedGame]);

  const renderGameItem = ({ item }: { item: Game }) => (
    <TouchableOpacity
      style={styles.gameCard}
      onPress={() => setSelectedGame(item)}
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
        <Text style={styles.gameRating}>⭐ {item.rating.toFixed(1)}</Text>
        <Text style={styles.gameDate}>
          {new Date(item.released).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.filterSection}>
            
            <View style={styles.dropdown}>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowOrderDropdown(!showOrderDropdown)}
              >
                <Text style={styles.dropdownLabel}>{selectedOrder.label}</Text>
              </TouchableOpacity>
              {showOrderDropdown && (
                <View style={styles.dropdownOptions}>
                  {ORDER_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.dropdownItem,
                        selectedOrder.value === option.value && styles.selectedItem,
                      ]}
                      onPress={() => handleOrderChange(option)}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedOrder.value === option.value && styles.selectedItemText,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.dropdown}>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowPlatformDropdown(!showPlatformDropdown)}
              >
                <Text style={styles.dropdownLabel}>{selectedPlatform.label}</Text>
              </TouchableOpacity>
              {showPlatformDropdown && (
                <View style={styles.dropdownOptions}>
                  {PLATFORM_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.dropdownItem,
                        selectedPlatform.value === option.value && styles.selectedItem,
                      ]}
                      onPress={() => handlePlatformChange(option)}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedPlatform.value === option.value && styles.selectedItemText,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>


        </View>

        <FlatList
          data={filteredGames}
          renderItem={renderGameItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />        
        <GameFilterDetails
          game={selectedGame}
          visible={!!selectedGame}
          onClose={() => setSelectedGame(null)}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e272e',
  },
  header: {
    backgroundColor: '#000',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#485460',
  },
  filterSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  dropdown: {
    flex: 1,
    marginHorizontal: 8,
  },
  dropdownButton: {
    backgroundColor: '#2f3640',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  dropdownLabel: {
    color: '#f1f2f6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#2f3640',
    borderRadius: 8,
    padding: 8,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  selectedItem: {
    backgroundColor: '#ffffff',
  },
  dropdownItemText: {
    color: '#f1f2f6',
    fontSize: 14,
  },
  selectedItemText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  closeButton: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FF0000',
    borderRadius: 16,
  },
  closeButtonText: {
    color: '#f1f2f6',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 8,
  },
  row: {
    justifyContent: 'space-between',
  },
  gameCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#2f3640',
    borderRadius: 12,
    overflow: 'hidden',
  },
  gameImage: {
    width: '100%',
    height: 150,
  },
  gameInfo: {
    padding: 12,
  },
  gameTitle: {
    color: '#f1f2f6',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gameRating: {
    color: '#ffd700',
    fontSize: 14,
    marginBottom: 2,
  },
  gameDate: {
    color: '#a4b0be',
    fontSize: 12,
  },
});

export default GameFilteredViewer; 