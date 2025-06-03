import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const LASTFM_API_KEY = "230590d668df5533f830cbdf7920f94f";
const LASTFM_SHARED_SECRET = "77ae2d4558ce691378b31d6a7e309fcf";

interface TrackImage {
  "#text": string;
  size: string;
}

interface Track {
  name: string;
  artist: {
    name: string;
  };
  image: TrackImage[];
}

interface SearchResult {
  name: string;
  artist: string;
  image: TrackImage[];
}

export default function Music() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchTopTracks();
  }, []);

  const fetchTopTracks = async () => {
    try {
      const response = await fetch(
        `http://ws.audioscrobbler.com/2.0/?method=chart.gettoptracks&api_key=${LASTFM_API_KEY}&format=json&limit=10`
      );
      const data = await response.json();
      setTopTracks(data.tracks.track);
    } catch (error) {
      console.error("Error fetching top tracks:", error);
    }
  };

  const searchMusic = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `http://ws.audioscrobbler.com/2.0/?method=track.search&track=${encodeURIComponent(
          searchQuery
        )}&api_key=${LASTFM_API_KEY}&format=json`
      );
      const data = await response.json();
      setSearchResults(data.results.trackmatches.track);
    } catch (error) {
      console.error("Error searching music:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Music Explorer</Text>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for songs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchMusic}
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchMusic}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {searchResults.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {searchResults.map((track, index) => (
              <TouchableOpacity key={index} style={styles.trackItem}>
                <Image
                  source={{ uri: track.image[2]["#text"] }}
                  style={styles.trackImage}
                />
                <View style={styles.trackInfo}>
                  <Text style={styles.trackName}>{track.name}</Text>
                  <Text style={styles.artistName}>{track.artist}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>Top Tracks</Text>
            {topTracks.map((track, index) => (
              <TouchableOpacity key={index} style={styles.trackItem}>
                <Image
                  source={{ uri: track.image[2]["#text"] }}
                  style={styles.trackImage}
                />
                <View style={styles.trackInfo}>
                  <Text style={styles.trackName}>{track.name}</Text>
                  <Text style={styles.artistName}>{track.artist.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#3B82F6",
    marginBottom: 20,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  searchButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 20,
    justifyContent: "center",
    borderRadius: 8,
  },
  searchButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  trackItem: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trackImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
  },
  trackInfo: {
    marginLeft: 15,
    justifyContent: "center",
  },
  trackName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  artistName: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
});
