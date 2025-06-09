import {
  getGenreContent,
  getImageUrl,
  type Album,
  type Artist,
  type GenreContent,
  type Track
} from "@/services/music_API";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MusicDetailsViewer from "../../../components/MusicDetailsViewer";
import MusicGenre from "../../../components/MusicGenre";

const GENRES = [
  { name: "Rock", color: "#FF0000", icon: "rocket" },
  { name: "Pop", color: "#CC0000", icon: "musical-notes" },
  { name: "Hip Hop", color: "#990000", icon: "mic" },
  { name: "Electronic", color: "#660000", icon: "radio" },
  { name: "Jazz", color: "#330000", icon: "musical-note" },
  { name: "Classical", color: "#1a0000", icon: "piano" },
];

export default function Music() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [genreContent, setGenreContent] = useState<GenreContent | null>(null);
  const [selectedItem, setSelectedItem] = useState<Artist | Album | Track | null>(null);
  const [itemType, setItemType] = useState<"artist" | "album" | "track" | null>(null);

  const handleGenreSelect = async (genre: string) => {
    setSelectedGenre(genre);
    const content = await getGenreContent(genre);
    if (content) {
      setGenreContent(content);
    }
  };

  if (selectedItem) {
    return (
      <MusicDetailsViewer
        selectedItem={selectedItem}
        itemType={itemType}
        onClose={() => setSelectedItem(null)}
        getImageUrl={getImageUrl}
      />
    );
  }

  if (selectedGenre && genreContent) {
    return (
      <MusicGenre
        genre={selectedGenre}
        onBack={() => {
          setSelectedGenre(null);
          setGenreContent(null);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.genresContainer}>
          <Text style={styles.sectionTitle}>Explore Genres</Text>
          <View style={styles.genreGrid}>
            {GENRES.map((genre, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.genreCard, { backgroundColor: genre.color }]}
                onPress={() => handleGenreSelect(genre.name)}
              >
                <Ionicons name={genre.icon as any} size={32} color="#fff" />
                <Text style={styles.genreName}>{genre.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B2631",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#1B2631",
    borderBottomWidth: 1,
    borderBottomColor: "#1B2631",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FF0000",
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C2741",
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
    color: "#fff",
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF0000",
    marginBottom: 15,
  },
  subsectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
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
    width: (Dimensions.get("window").width ) / 2 + 140,
    height: 120,
    borderRadius: 16,
    marginBottom: 15,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF0000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  genreName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginTop: 8,
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
  horizontalScroll: {
    marginBottom: 20,
  },
  artistCard: {
    width: 150,
    marginRight: 15,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#FF0000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  artistImage: {
    width: 126,
    height: 126,
    borderRadius: 63,
    marginBottom: 10,
    backgroundColor: "#1B2631",
  },
  artistCardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  listeners: {
    fontSize: 12,
    color: "#FF0000",
    textAlign: "center",
    marginTop: 4,
  },
  albumCard: {
    width: 150,
    marginRight: 15,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#FF0000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  albumImage: {
    width: 126,
    height: 126,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#1B2631",
  },
  albumName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  albumArtist: {
    fontSize: 14,
    color: "#FF0000",
    textAlign: "center",
    marginTop: 4,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: "#1B2631",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1B2631",
  },
  backButtonText: {
    fontSize: 16,
    color: "#FF0000",
    marginLeft: 8,
  },
  detailImage: {
    width: "100%",
    height: 300,
    marginBottom: 20,
    backgroundColor: "#333",
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  detailSubtitle: {
    fontSize: 18,
    color: "#FF0000",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  detailStats: {
    fontSize: 14,
    color: "#FF0000",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  detailText: {
    fontSize: 16,
    color: "#fff",
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
});
