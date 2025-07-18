import {
  getGenreContent,
  getImageUrl,
  getItemDetails,
  getMusicImageFromWiki,
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
  const [latestReleases, setLatestReleases] = useState<(Album & { wikiImage?: string })[]>([]);
  const [hotTracks, setHotTracks] = useState<(Track & { wikiImage?: string })[]>([]);
  const [upcomingAlbums, setUpcomingAlbums] = useState<(Album & { wikiImage?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMusicData();
  }, []);

  // Update fetchMusicData to include wiki images
  const fetchMusicData = async () => {
    setIsLoading(true);
    try {
      const latestContent = await getGenreContent("rock");
      if (latestContent) {
        const updatedAlbums = await Promise.all(
          latestContent.topAlbums.map(async (album) => {
            const wikiImage = await getMusicImageFromWiki(album.name);
            return { ...album, wikiImage: wikiImage ?? "" };
          })
        );
        setLatestReleases(updatedAlbums);
      }

      const hotContent = await getGenreContent("pop");
      if (hotContent) {
        const updatedTracks = await Promise.all(
          hotContent.topTracks.map(async (track) => {
            // const wikiImage = await getMusicImageFromWiki(track.name);
            const wikiImage = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/The_Sounds_of_Earth_-_GPN-2000-001976.jpg/1200px-The_Sounds_of_Earth_-_GPN-2000-001976.jpg";
            return { ...track, wikiImage: wikiImage ?? "" };
          })
        );
        setHotTracks(updatedTracks);
      }

      const upcomingContent = await getGenreContent("electronic");
      if (upcomingContent) {
        const updatedUpcomingAlbums = await Promise.all(
          upcomingContent.topAlbums.map(async (album) => {
            const wikiImage = await getMusicImageFromWiki(album.name);
            return { ...album, wikiImage: wikiImage ?? "" };
          })
        );
        setUpcomingAlbums(updatedUpcomingAlbums);
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



  // Update renderSection to use pre-fetched wiki images
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
              source={{ uri: item.wikiImage || getImageUrl(item.image) }}
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
