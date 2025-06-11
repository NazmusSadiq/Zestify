import { icons } from "@/constants/icons";
import { fetchGameDetails, searchGames, type Game } from "@/services/GameAPI";
import {
  getTrackDetails,
  searchTracks,
  type SearchResult
} from "@/services/music_API";
import {
  fetchMovieDetails,
  fetchMovies,
  fetchTVSeries,
  fetchTVSeriesDetails,
} from "@/services/tmdb_API";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import DetailsViewer from "./DetailsViewer";
import GameDetails from "./GameDetails";
import MusicDetailsViewer from "./MusicDetailsViewer";

type SearchItem = MediaItem | SearchResult | Game;

interface Props {
  activeTab: string;
}

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  [key: string]: any;
}

const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w92";
const DROPDOWN_WIDTH = 220;
const DEFAULT_IMAGE = "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png";

const SearchBar = ({ activeTab }: Props) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<(MediaItem | SearchResult | Game)[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | SearchResult | Game | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMounted, setModalMounted] = useState(false);

  const debounceTimeout = useRef<number | null>(null);
  const slideAnim = useRef(new Animated.Value(DROPDOWN_WIDTH)).current;

  const searchHandlers: { [key: string]: (query: string) => Promise<MediaItem[] | Game[]> } = {
    Movie: (query: string) => fetchMovies({ query }),
    "TV Series": (query: string) => fetchTVSeries({ query }),
    Game: (query: string) => searchGames(query).then(response => response.results),
  };

  const detailsHandlers: { [key: string]: (id: string) => Promise<any> } = {
    Movie: fetchMovieDetails,
    "TV Series": fetchTVSeriesDetails,
    Game: (id: string) => fetchGameDetails(parseInt(id)),
  };

  const searchMedia = async (query: string) => {
    try {
      if (!query.trim()) {
        setSearchResults([]);
        animateModalOut();
        return;
      }
      const searchFn = searchHandlers[activeTab];
      if (!searchFn) return;

      setLoading(true);
      const results = await searchFn(query);
      setSearchResults(results ?? []);
      setLoading(false);

      if ((results ?? []).length > 0) {
        animateModalIn();
      } else {
        animateModalOut();
      }
    } catch (error) {
      setLoading(false);
      animateModalOut();
      console.error(`Error searching ${activeTab}:`, error);
    }
  };  const searchMusic = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const tracks = await searchTracks(searchQuery);
      setSearchResults(tracks);
      setLoading(false);
      if (tracks.length > 0) {
        animateModalIn();
      }
    } catch (error) {
      console.error("Error searching music:", error);
      setLoading(false);
    }
  };

  const onChangeText = (text: string) => {
    setSearchText(text);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      searchMedia(text);
    }, 400);
  };

  const onIconPress = () => {
    if (searchText.trim() !== "" || searchQuery.trim() !== "") {
      setSearchText("");
      setSearchQuery("");
      Keyboard.dismiss();
      setSearchResults([]);
      animateModalOut();
    }
  };

    const handleMusicItemPress = async (item: SearchResult) => {
    try {
      console.log("Selected music track:", item);
      const trackDetails = await getTrackDetails(item.name, item.artist);
      if (trackDetails) {
        setSelectedItem({
          ...item,
          ...trackDetails,
          artist: { name: item.artist },  // Ensure artist is in the correct format
          listeners: trackDetails.listeners || "0",
          playcount: trackDetails.playcount || "0",
        });
      } else {
        setSelectedItem(item);
      }
      animateModalOut();
    } catch (error) {
      console.error("Error handling music item press:", error);
      setSelectedItem(item);
      animateModalOut();
    }
  };

  const handleItemPress = async (item: MediaItem) => {
    try {
      const detailsFn = detailsHandlers[activeTab];
      const details = detailsFn ? await detailsFn(item.id.toString()) : {};
      setSelectedItem({ ...item, ...details });
      setSearchText("");
      setSearchResults([]);
      animateModalOut();
      Keyboard.dismiss();
    } catch (err) {
      console.error(`Failed to fetch ${activeTab} details:`, err);
      setSelectedItem(item);
      setSearchText("");
      setSearchResults([]);
      animateModalOut();
      Keyboard.dismiss();
    }
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (selectedItem) {
        setSelectedItem(null);
        return true;
      }
      if (searchText.length > 0 || searchResults.length > 0) {
        onIconPress();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [searchText, searchResults, selectedItem, onIconPress]);

  const animateModalIn = () => {
    setModalMounted(true);
    setModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const animateModalOut = () => {
    Animated.timing(slideAnim, {
      toValue: DROPDOWN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalMounted(false);
      setModalVisible(false);
    });
  };

  const getPlaceholder = () => `Search for a ${activeTab}`;

  const renderItem = (item: MediaItem | SearchResult | Game) => {
    if (activeTab === "Music") {
      const musicItem = item as SearchResult;
      return (
        <TouchableOpacity onPress={() => handleMusicItemPress(musicItem)} activeOpacity={0.7}>
          <View style={styles.trackItem}>
            <Image
              source={{ uri: musicItem.image?.[2]?.["#text"] || DEFAULT_IMAGE }}
              style={styles.trackImage}
            />
            <View style={styles.trackInfo}>
              <Text style={styles.trackName}>{musicItem.name}</Text>
              <Text style={styles.artistName}>{musicItem.artist}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    if (activeTab === "Game") {
      const gameItem = item as Game;
      return (
        <TouchableOpacity onPress={() => handleItemPress(gameItem)} activeOpacity={0.7}>
          <View style={styles.resultItem}>
            {gameItem.background_image ? (
              <Image
                source={{ uri: gameItem.background_image }}
                style={styles.poster}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.poster, styles.posterPlaceholder]}>
                <Text style={styles.posterPlaceholderText}>N/A</Text>
              </View>
            )}
            <View style={styles.movieInfo}>
              <Text style={styles.resultTitle} numberOfLines={1}>
                {gameItem.name}
              </Text>
              {gameItem.released ? <Text style={styles.resultDate}>{gameItem.released}</Text> : null}
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    const mediaItem = item as MediaItem;
    const title = mediaItem.title || mediaItem.name || "Untitled";
    const date = mediaItem.release_date || mediaItem.first_air_date || "";

    return (
      <TouchableOpacity onPress={() => handleItemPress(mediaItem)} activeOpacity={0.7}>
        <View style={styles.resultItem}>
          {mediaItem.poster_path ? (
            <Image
              source={{ uri: POSTER_BASE_URL + mediaItem.poster_path }}
              style={styles.poster}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.poster, styles.posterPlaceholder]}>
              <Text style={styles.posterPlaceholderText}>N/A</Text>
            </View>
          )}
          <View style={styles.movieInfo}>
            <Text style={styles.resultTitle} numberOfLines={1}>
              {title}
            </Text>
            {date ? <Text style={styles.resultDate}>{date}</Text> : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.searchContainer}>
      <View style={styles.wrapper}>
        <TouchableOpacity onPress={onIconPress} disabled={searchText.trim() === "" && searchQuery.trim() === ""}>
          <Image source={icons.search} style={styles.icon} resizeMode="contain" />
        </TouchableOpacity>
        
        {activeTab === "Music" ? (
          <TextInput
            style={styles.input}
            placeholder="Search for songs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchMusic}
            placeholderTextColor="#666"
            returnKeyType="search"
          />
        ) : (
          <TextInput
            placeholder={getPlaceholder()}
            value={searchText}
            onChangeText={onChangeText}
            placeholderTextColor="#ccc"
            style={styles.input}
            clearButtonMode="while-editing"
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => searchMedia(searchText)}
          />
        )}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="none" // no default animation, we handle it ourselves
        onRequestClose={() => animateModalOut()}
      >
        <TouchableWithoutFeedback onPress={() => animateModalOut()}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalOverlay}
          >
            <TouchableWithoutFeedback>
              {modalMounted && (
                <Animated.View
                  style={[
                    styles.modalDropdown,
                    {
                      transform: [{ translateX: slideAnim }],
                    },
                  ]}
                >
                  <FlatList
                    data={searchResults}
                    keyExtractor={(item, index) =>
                      'id' in item ? item.id.toString() : `${(item as SearchResult).name}-${(item as SearchResult).artist}-${index}`
                    }
                    renderItem={({ item }) => renderItem(item)}
                    keyboardShouldPersistTaps="always"
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  />
                </Animated.View>
              )}
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {loading && <Text style={styles.loadingText}>Loading...</Text>}

      
        {activeTab === "Music" ? (
        <MusicDetailsViewer
          selectedItem={selectedItem as SearchResult}
          itemType="track"
          onClose={() => setSelectedItem(null)}
          getImageUrl={(images) => images?.[2]?.["#text"] || DEFAULT_IMAGE}
        />
      ) : activeTab === "Game" ? (
        <GameDetails
          game={selectedItem as Game}
          visible={!!selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      ) : (
        <DetailsViewer
          data={selectedItem}
          visible={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          titleKey={activeTab === "Movie" ? "title" : "name"}
          imageKey="poster_path"
        />
      )}
    </View>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  searchContainer: {
    position: "relative",
    zIndex: 1000,
  },sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF0000",
    marginBottom: 15,
  },
  trackItem: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#FF0000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
   trackImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#1B2631",
  },
  trackInfo: {
    marginLeft: 15,
    justifyContent: "center",
  },
  trackName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  artistName: {
    fontSize: 14,
    color: "#FF0000",
    marginTop: 4,
  },
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2c3e50",
    borderRadius: 8,
    height: 40,
    width: 220,
    paddingHorizontal: 10,
    zIndex: 1001,
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: "#ccc",
    marginRight: 8,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    color: "#fff",
    height: "100%",
    textAlignVertical: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 8,
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
    justifyContent: "flex-start",
    paddingTop: 110,
    paddingLeft: 147,
  },

  modalDropdown: {
    backgroundColor: "#34495e",
    borderRadius: 8,
    maxHeight: 200,
    width: DROPDOWN_WIDTH,
    elevation: 10,
    // Keep position relative inside modalOverlay; no position absolute here so it stays where it is
  },

  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2c3e50",
  },
  poster: {
    width: 50,
    height: 75,
    borderRadius: 4,
    backgroundColor: "#222",
  },
  posterPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  posterPlaceholderText: {
    color: "#666",
    fontSize: 12,
  },
  movieInfo: {
    marginLeft: 10,
    flexShrink: 1,
  },
  resultTitle: {
    color: "#fff",
    fontWeight: "600",
  },
  resultDate: {
    color: "#bbb",
    fontSize: 12,
  },
});
