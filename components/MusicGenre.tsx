import { getGenreContent, getImageUrl, getItemDetails, type Album, type Artist, type GenreContent, type Track } from "@/services/music_API";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MusicDetailsViewer from "./MusicDetailsViewer";
import { SafeAreaView } from "react-native-safe-area-context";


interface MusicGenreProps {
  genre: string;
  onBack?: () => void;
}

export default function MusicGenre({ genre, onBack }: MusicGenreProps) {
  const [genreContent, setGenreContent] = useState<GenreContent | null>(null);
  const [selectedItem, setSelectedItem] = useState<Artist | Album | Track | null>(null);
  const [itemType, setItemType] = useState<"artist" | "album" | "track" | null>(null);

  useEffect(() => {
    const loadGenreContent = async () => {
      const content = await getGenreContent(genre);
      if (content) {
        setGenreContent(content);
      }
    };
    loadGenreContent();
  }, [genre]);

  const handleItemPress = async (item: Artist | Album | Track, type: "artist" | "album" | "track") => {
    const details = await getItemDetails(type, item.name, "artist" in item ? item.artist.name : undefined);
    if (details) {
      setSelectedItem(details);
      setItemType(type);
    }
  };

  const renderDetailView = () => {
    return (
      <MusicDetailsViewer
        selectedItem={selectedItem}
        itemType={itemType}
        onClose={() => setSelectedItem(null)}
        getImageUrl={getImageUrl}
      />
    );
  };

  if (selectedItem) {
    return renderDetailView();
  }

  if (!genreContent) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={24} color="#FF0000" />
        </TouchableOpacity>
        <Text style={styles.title}>{genre}</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B2631",
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  header: {
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
  scrollView: {
    flex: 1,
    padding: 20,
  },
  subsectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginTop: 20,
    marginBottom: 10,
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
  backButton: {
  position: "absolute",
  top: -25,
  left: 0,
  zIndex: 10,
  backgroundColor: "#1B2631",
  borderRadius: 20,
  padding: 10,
},

});
