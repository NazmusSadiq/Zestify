import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const LASTFM_API_KEY = "230590d668df5533f830cbdf7920f94f";
const LASTFM_SHARED_SECRET = "77ae2d4558ce691378b31d6a7e309fcf";

interface TrackImage {
  "#text": string;
  size: string;
}

interface BaseItem {
  name: string;
  image: TrackImage[];
}

interface Track extends BaseItem {
  artist: {
    name: string;
  };
  listeners?: string;
  playcount?: string;
  duration?: string;
  wiki?: {
    summary: string;
  };
}

interface SearchResult {
  name: string;
  artist: string;
  image: TrackImage[];
}

interface Artist extends BaseItem {
  listeners: string;
  bio?: {
    summary: string;
  };
  stats?: {
    listeners: string;
    playcount: string;
  };
}

interface Album extends BaseItem {
  artist: {
    name: string;
  };
  playcount?: string;
  listeners?: string;
  wiki?: {
    summary: string;
  };
}

interface GenreContent {
  topArtists: Artist[];
  topTracks: Track[];
  topAlbums: Album[];
}

const GENRES = [
  { name: "Rock", color: "#FF6B6B", icon: "rocket" },
  { name: "Pop", color: "#4ECDC4", icon: "musical-notes" },
  { name: "Hip Hop", color: "#45B7D1", icon: "mic" },
  { name: "Electronic", color: "#96CEB4", icon: "radio" },
  { name: "Jazz", color: "#FFEEAD", icon: "musical-note" },
  { name: "Classical", color: "#D4A5A5", icon: "piano" },
];

const DEFAULT_IMAGE = "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png";

export default function Music() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [genreContent, setGenreContent] = useState<GenreContent | null>(null);
  const [selectedItem, setSelectedItem] = useState<Artist | Album | Track | null>(null);
  const [itemType, setItemType] = useState<"artist" | "album" | "track" | null>(null);
  const router = useRouter();

  const fetchItemDetails = async (type: "artist" | "album" | "track", name: string, artist?: string) => {
    try {
      let url = "";
      switch (type) {
        case "artist":
          url = `http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(name)}&api_key=${LASTFM_API_KEY}&format=json`;
          break;
        case "album":
          url = `http://ws.audioscrobbler.com/2.0/?method=album.getinfo&album=${encodeURIComponent(name)}&artist=${encodeURIComponent(artist || "")}&api_key=${LASTFM_API_KEY}&format=json`;
          break;
        case "track":
          url = `http://ws.audioscrobbler.com/2.0/?method=track.getinfo&track=${encodeURIComponent(name)}&artist=${encodeURIComponent(artist || "")}&api_key=${LASTFM_API_KEY}&format=json`;
          break;
      }
      const response = await fetch(url);
      const data = await response.json();
      setSelectedItem(data[type]);
      setItemType(type);
    } catch (error) {
      console.error("Error fetching item details:", error);
    }
  };

  const handleItemPress = (item: Artist | Album | Track, type: "artist" | "album" | "track") => {
    if (type === "artist") {
      fetchItemDetails("artist", item.name);
    } else if (type === "album" && "artist" in item) {
      fetchItemDetails("album", item.name, item.artist.name);
    } else if (type === "track" && "artist" in item) {
      fetchItemDetails("track", item.name, item.artist.name);
    }
  };

  const getImageUrl = (images: TrackImage[]) => {
    if (!images || images.length === 0) return DEFAULT_IMAGE;
    const image = images.find(img => img.size === "large") || images[0];
    return image["#text"] || DEFAULT_IMAGE;
  };

  const fetchGenreContent = async (genre: string) => {
    try {
      // Fetch top artists
      const artistsResponse = await fetch(
        `http://ws.audioscrobbler.com/2.0/?method=tag.gettopartists&tag=${genre}&api_key=${LASTFM_API_KEY}&format=json&limit=5`
      );
      const artistsData = await artistsResponse.json();

      // Fetch top tracks
      const tracksResponse = await fetch(
        `http://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag=${genre}&api_key=${LASTFM_API_KEY}&format=json&limit=5`
      );
      const tracksData = await tracksResponse.json();

      // Fetch top albums
      const albumsResponse = await fetch(
        `http://ws.audioscrobbler.com/2.0/?method=tag.gettopalbums&tag=${genre}&api_key=${LASTFM_API_KEY}&format=json&limit=5`
      );
      const albumsData = await albumsResponse.json();

      setGenreContent({
        topArtists: artistsData.topartists.artist,
        topTracks: tracksData.tracks.track,
        topAlbums: albumsData.albums.album,
      });
    } catch (error) {
      console.error("Error fetching genre content:", error);
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
      setSelectedGenre(null);
    } catch (error) {
      console.error("Error searching music:", error);
    }
  };

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre);
    setSearchResults([]);
    fetchGenreContent(genre);
  };

  const renderDetailView = () => {
    if (!selectedItem || !itemType) return null;

    return (
      <View style={styles.detailContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedItem(null)}
        >
          <Ionicons name="arrow-back" size={24} color="#666" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Image
            source={{ uri: getImageUrl(selectedItem.image) }}
            style={styles.detailImage}
          />
          <Text style={styles.detailTitle}>{selectedItem.name}</Text>
          
          {itemType === "artist" && "stats" in selectedItem && (
            <>
              <Text style={styles.detailSubtitle}>
                {selectedItem.stats?.listeners} listeners
              </Text>
              <Text style={styles.detailText}>
                {selectedItem.bio?.summary.replace(/<[^>]*>/g, "")}
              </Text>
            </>
          )}

          {itemType === "album" && "artist" in selectedItem && (
            <>
              <Text style={styles.detailSubtitle}>
                By {selectedItem.artist.name}
              </Text>
              <Text style={styles.detailStats}>
                {selectedItem.listeners} listeners • {selectedItem.playcount} plays
              </Text>
              <Text style={styles.detailText}>
                {selectedItem.wiki?.summary.replace(/<[^>]*>/g, "")}
              </Text>
            </>
          )}

          {itemType === "track" && "artist" in selectedItem && (
            <>
              <Text style={styles.detailSubtitle}>
                By {selectedItem.artist.name}
              </Text>
              <Text style={styles.detailStats}>
                {selectedItem.listeners} listeners • {selectedItem.playcount} plays
              </Text>
              <Text style={styles.detailText}>
                {selectedItem.wiki?.summary.replace(/<[^>]*>/g, "")}
              </Text>
            </>
          )}
        </ScrollView>
      </View>
    );
  };

  if (selectedItem) {
    return renderDetailView();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Music Explorer</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for songs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchMusic}
            placeholderTextColor="#666"
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {!selectedGenre && searchResults.length === 0 && (
          <View style={styles.genresContainer}>
            <Text style={styles.sectionTitle}>Explore Genres</Text>
            <View style={styles.genreGrid}>
              {GENRES.map((genre, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.genreCard, { backgroundColor: genre.color }]}
                  onPress={() => handleGenreSelect(genre.name)}
                >
                  <Ionicons name={genre.icon as any} size={32} color="#333" />
                  <Text style={styles.genreName}>{genre.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {searchResults.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {searchResults.map((track, index) => (
              <TouchableOpacity
                key={index}
                style={styles.trackItem}
                onPress={() => handleItemPress({
                  name: track.name,
                  artist: { name: track.artist },
                  image: track.image
                } as Track, "track")}
              >
                <Image
                  source={{ uri: getImageUrl(track.image) }}
                  style={styles.trackImage}
                />
                <View style={styles.trackInfo}>
                  <Text style={styles.trackName}>{track.name}</Text>
                  <Text style={styles.artistName}>{track.artist}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : selectedGenre && genreContent ? (
          <View>
            <Text style={styles.sectionTitle}>{selectedGenre}</Text>
            
            <Text style={styles.subsectionTitle}>Top Artists</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {genreContent.topArtists.map((artist, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.artistCard}
                  onPress={() => handleItemPress(artist, "artist")}
                >
                  <Image
                    source={{ uri: getImageUrl(artist.image) }}
                    style={styles.artistImage}
                  />
                  <Text style={styles.artistCardName}>{artist.name}</Text>
                  <Text style={styles.listeners}>{artist.listeners} listeners</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.subsectionTitle}>Top Tracks</Text>
            {genreContent.topTracks.map((track, index) => (
              <TouchableOpacity
                key={index}
                style={styles.trackItem}
                onPress={() => handleItemPress(track, "track")}
              >
                <Image
                  source={{ uri: getImageUrl(track.image) }}
                  style={styles.trackImage}
                />
                <View style={styles.trackInfo}>
                  <Text style={styles.trackName}>{track.name}</Text>
                  <Text style={styles.artistName}>{track.artist.name}</Text>
                </View>
              </TouchableOpacity>
            ))}

            <Text style={styles.subsectionTitle}>Top Albums</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {genreContent.topAlbums.map((album, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.albumCard}
                  onPress={() => handleItemPress(album, "album")}
                >
                  <Image
                    source={{ uri: getImageUrl(album.image) }}
                    style={styles.albumImage}
                  />
                  <Text style={styles.albumName}>{album.name}</Text>
                  <Text style={styles.albumArtist}>{album.artist.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: "#333",
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 15,
  },
  subsectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  genresContainer: {
    marginBottom: 20,
  },
  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  genreCard: {
    width: (Dimensions.get("window").width - 60) / 2,
    height: 120,
    borderRadius: 16,
    marginBottom: 15,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  genreName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 8,
  },
  trackItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  trackImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  trackInfo: {
    marginLeft: 15,
    justifyContent: "center",
  },
  trackName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  artistName: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  horizontalScroll: {
    marginBottom: 20,
  },
  artistCard: {
    width: 150,
    marginRight: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  artistImage: {
    width: 126,
    height: 126,
    borderRadius: 63,
    marginBottom: 10,
  },
  artistCardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
  },
  listeners: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },
  albumCard: {
    width: 150,
    marginRight: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  albumImage: {
    width: 126,
    height: 126,
    borderRadius: 8,
    marginBottom: 10,
  },
  albumName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
  },
  albumArtist: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButtonText: {
    fontSize: 16,
    color: "#666",
    marginLeft: 8,
  },
  detailImage: {
    width: "100%",
    height: 300,
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  detailSubtitle: {
    fontSize: 18,
    color: "#666",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  detailStats: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  detailText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
});
