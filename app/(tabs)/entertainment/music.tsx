import {
  getGenreContent,
  getImageUrl,
  getItemDetails,
  type Album,
  type Artist,
  type GenreContent,
  type Track
} from "@/services/music_API";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MusicDetailsViewer from "../../../components/MusicDetailsViewer";

export default function Music() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [genreContent, setGenreContent] = useState<GenreContent | null>(null);
  const [selectedItem, setSelectedItem] = useState<Artist | Album | Track | null>(null);
  const [itemType, setItemType] = useState<"artist" | "album" | "track" | null>(null);
  const [latestReleases, setLatestReleases] = useState<Album[]>([]);
  const [hotTracks, setHotTracks] = useState<Track[]>([]);
  const [upcomingAlbums, setUpcomingAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMusicData();
  }, []);

  const fetchMusicData = async () => {
    setIsLoading(true);
    try {
      // Fetch latest releases (using top albums from various genres)
      const latestContent = await getGenreContent("rock");
      if (latestContent) {
        setLatestReleases(latestContent.topAlbums);
      }

      // Fetch hot tracks (using top tracks from various genres)
      const hotContent = await getGenreContent("pop");
      if (hotContent) {
        setHotTracks(hotContent.topTracks);
      }

      // Fetch upcoming albums (using top albums from electronic genre)
      const upcomingContent = await getGenreContent("electronic");
      if (upcomingContent) {
        setUpcomingAlbums(upcomingContent.topAlbums);
      }
    } catch (error) {
      console.error("Error fetching music data:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleItemPress = async (item: Album | Track, type: "album" | "track") => {
    console.log("Item pressed:", item, type);
    const details = await getItemDetails(type, item.name, item.artist.name);
    if (details) {
      setSelectedItem(details);
      setItemType(type);
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



  const renderSection = (title: string, items: (Album | Track)[], type: "album" | "track") => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.itemCard}
            onPress={() => handleItemPress(item, type)}
          >
            <Image
              source={{ uri: getImageUrl(item.image) }}
              style={styles.itemImage}
            />
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemArtist}>{item.artist.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderSection("Latest Releases", latestReleases, "album")}
        {renderSection("Hot Right Now", hotTracks, "track")}
        {renderSection("Coming Soon", upcomingAlbums, "album")}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B2631",
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF0000",
    marginBottom: 15,
  },
  horizontalScroll: {
    marginBottom: 10,
  },
  itemCard: {
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
  itemImage: {
    width: 126,
    height: 126,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#1B2631",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  itemArtist: {
    fontSize: 14,
    color: "#FF0000",
    textAlign: "center",
    marginTop: 4,
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
});
