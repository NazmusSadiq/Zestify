import { icons } from "@/constants/icons";
import { fetchMovieDetails, fetchMovies } from "@/services/tmdb_API";
import React, { useEffect, useRef, useState } from "react";
import {
  BackHandler,
  FlatList,
  Image,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DetailsViewer from "./DetailsViewer";

interface Props {
  activeTab: string;
}

interface Movie {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string | null;
  [key: string]: any;
}

const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w92";

const SearchBar = ({ activeTab }: Props) => {
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // FIXED: use number instead of NodeJS.Timeout for React Native environment
  const debounceTimeout = useRef<number | null>(null);

  const searchMovie = async (query: string) => {
    try {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      const results = await fetchMovies({ query });
      setSearchResults(results ?? []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error searching movies:", error);
    }
  };

  const onChangeText = (text: string) => {
    setSearchText(text);

    // debounce search for better UX and less API calls
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      switch (activeTab) {
        case "Movie":
          searchMovie(text);
          break;
        case "TV Series":
          // Add other handlers here as needed
          break;
        default:
          break;
      }
    }, 400);
  };

  const onIconPress = () => {
    if (searchText.trim() !== "") {
      setSearchText("");
      Keyboard.dismiss();
      setSearchResults([]);
      console.log("Search cleared");
    }
  };

  const handleMoviePress = async (movie: Movie) => {
    setDetailsLoading(true);
    try {
      const details = await fetchMovieDetails(movie.id.toString());
      setSelectedMovie({ ...movie, ...details });
      setSearchText("");
      setSearchResults([]);
      Keyboard.dismiss();
    } catch (err) {
      console.error("Failed to fetch movie details:", err);
      setSelectedMovie(movie);
      setSearchText("");
      setSearchResults([]);
      Keyboard.dismiss();
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (selectedMovie) {
        setSelectedMovie(null);
        return true;
      }
      if (searchText.length > 0 || searchResults.length > 0) {
        onIconPress();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [searchText, searchResults, selectedMovie]);

  const getPlaceholder = () => `Search for a ${activeTab}`;

  const renderMovieItem = ({ item }: { item: Movie }) => (
    <TouchableOpacity onPress={() => handleMoviePress(item)} activeOpacity={0.7}>
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
            {item.title}
          </Text>
          {item.release_date ? <Text style={styles.resultDate}>{item.release_date}</Text> : null}
        </View>
      </View>
    </TouchableOpacity>
  );

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
        />
      </View>

      {activeTab === "Movie" && searchResults.length > 0 && (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMovieItem}
          style={styles.resultsList}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        />
      )}

      {activeTab === "Movie" && loading && <Text style={styles.loadingText}>Loading...</Text>}

      <DetailsViewer
        data={selectedMovie}
        visible={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
        titleKey="title"
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
  resultsList: {
    position: "absolute",
    top: 45,
    left: 0,
    width: 220,
    maxHeight: 200,
    backgroundColor: "#34495e",
    borderRadius: 8,
    zIndex: 1002,
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
  loadingText: {
    color: "#fff",
    marginTop: 8,
    textAlign: "center",
  },
});
