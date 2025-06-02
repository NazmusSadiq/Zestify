import { icons } from "@/constants/icons";
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
const DROPDOWN_WIDTH = 220; // dropdown width used for animation

const SearchBar = ({ activeTab }: Props) => {
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMounted, setModalMounted] = useState(false); // control mounting for animation

  const debounceTimeout = useRef<number | null>(null);

  // Animated value for horizontal slide
  const slideAnim = useRef(new Animated.Value(DROPDOWN_WIDTH)).current; // start off shifted right by dropdown width

  const searchHandlers: { [key: string]: (query: string) => Promise<MediaItem[]> } = {
    Movie: (query: string) => fetchMovies({ query }),
    "TV Series": (query: string) => fetchTVSeries({ query }),
  };

  const detailsHandlers: { [key: string]: (id: string) => Promise<any> } = {
    Movie: fetchMovieDetails,
    "TV Series": fetchTVSeriesDetails,
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
    if (searchText.trim() !== "") {
      setSearchText("");
      Keyboard.dismiss();
      setSearchResults([]);
      animateModalOut();
      console.log("Search cleared");
    }
  };

  const handleItemPress = async (item: MediaItem) => {
    setDetailsLoading(true);
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
    } finally {
      setDetailsLoading(false);
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
  }, [searchText, searchResults, selectedItem]);

  // Animate modal sliding in from right (slideAnim from DROPDOWN_WIDTH -> 0)
  const animateModalIn = () => {
    setModalMounted(true);
    setModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Animate modal sliding out to right (slideAnim from 0 -> DROPDOWN_WIDTH)
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

  const renderItem = ({ item }: { item: MediaItem }) => {
    const title = item.title || item.name || "Untitled";
    const date = item.release_date || item.first_air_date || "";

    return (
      <TouchableOpacity onPress={() => handleItemPress(item)} activeOpacity={0.7}>
        <View style={styles.resultItem}>
          {item.poster_path ? (
            <Image
              source={{ uri: POSTER_BASE_URL + item.poster_path }}
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
        <TouchableOpacity onPress={onIconPress} disabled={searchText.trim() === ""}>
          <Image source={icons.search} style={styles.icon} resizeMode="contain" />
        </TouchableOpacity>
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
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
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

      <DetailsViewer
        data={selectedItem}
        visible={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        titleKey={activeTab === "Movie" ? "title" : "name"}
        imageKey="poster_path"
      />
    </View>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  searchContainer: {
    position: "relative",
    zIndex: 1000,
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
