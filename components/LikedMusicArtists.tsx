import { useUser } from "@clerk/clerk-expo";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { db } from "../firebase";
import { Artist, getArtistDetails, getImageUrl, getMusicImageFromWiki } from "../services/music_API";
import MusicDetailsViewer from "./MusicDetailsViewer";

const sortOptions = [
  { option: 'Title', key: 'title' },
  { option: 'Listeners', key: 'listeners' },
];

interface LikedMusicArtistsProps {
  visible: boolean;
  onClose: () => void;
}

export default function LikedMusicArtists({ visible, onClose }: LikedMusicArtistsProps) {
  const { user } = useUser();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [sortBy, setSortBy] = useState(sortOptions[0]);
  const [wikiImages, setWikiImages] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!visible) return;
    const fetchLikedArtists = async () => {
      setLoading(true);
      try {
        if (!user?.primaryEmailAddress?.emailAddress) {
          setArtists([]);
          setWikiImages({});
          return;
        }
        const docRef = doc(db, user.primaryEmailAddress.emailAddress, "musicArtists");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const likedKeys = Object.entries(data)
            .filter(([_, v]) => v === true)
            .map(([key]) => key);
          // key format: artistName
          const detailsArr = await Promise.all(
            likedKeys.map(async (key) => {
              const match = key.match(/^(.+)$/);
              if (!match) return null;
              const [, artistName] = match;
              try {
                return await getArtistDetails(artistName);
              } catch {
                return null;
              }
            })
          );
          const validArtists = detailsArr.filter((a): a is Artist => a !== null);
          setArtists(validArtists);
          // Fetch Wikipedia images for artists and store by key
          const wikiImgs: { [key: string]: string } = {};
          await Promise.all(
            validArtists.map(async (artist) => {
              const key = artist.name;
              wikiImgs[key] = (await getMusicImageFromWiki(artist.name)) || getImageUrl(artist.image);
            })
          );
          setWikiImages(wikiImgs);
        } else {
          setArtists([]);
          setWikiImages({});
        }
      } catch (err) {
        setArtists([]);
        setWikiImages({});
      }
      setLoading(false);
    };
    fetchLikedArtists();
  }, [visible, user?.primaryEmailAddress?.emailAddress]);

  const sortArtists = (artists: Artist[]) => {
    return [...artists].sort((a, b) => {
      if (sortBy.key === 'title') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (sortBy.key === 'listeners') {
        const listenersA = parseInt(a.listeners || '0', 10);
        const listenersB = parseInt(b.listeners || '0', 10);
        return listenersB - listenersA;
      }
      return 0;
    });
  };

  const renderArtist = ({ item }: { item: Artist }) => {
    const title = item.name || "Unknown Artist";
    const key = item.name;
    const imageUrl = wikiImages[key] || getImageUrl(item.image);
    const listeners = item.listeners || null;
    return (
      <TouchableOpacity style={styles.artistCard} onPress={() => setSelectedArtist(item)}>
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.image, { backgroundColor: "#444" }]} />
          )}
        </View>
        <Text style={styles.artistName} numberOfLines={2}>{title}</Text>
        {listeners && <Text style={styles.artistListeners}>👂 {listeners}</Text>}
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sort By: </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close ✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.sortSection}>
          {/* <Text style={styles.sortLabel}>Sort By:</Text> */}
          <View style={styles.dropdown}>
            {sortOptions.map(({ option, key }) => (
              <TouchableOpacity
                key={key}
                onPress={() => setSortBy({ option, key })}
                style={[
                  styles.dropdownItem,
                  sortBy.key === key && styles.dropdownItemSelected,
                ]}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    sortBy.key === key && styles.dropdownItemTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF0000" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <FlatList
            data={sortArtists(artists)}
            renderItem={({ item }) => renderArtist({ item })}
            keyExtractor={(item, idx) => item.name + idx}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
          />
        )}
        <MusicDetailsViewer
          selectedItem={selectedArtist}
          itemType={selectedArtist ? "artist" : null}
          onClose={() => setSelectedArtist(null)}
          getImageUrl={getImageUrl}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e272e",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#000",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#000000ff",
  },
  headerTitle: {
    color: "#f1f2f6",
    fontWeight: "bold",
    fontSize: 20,
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#FF0000",
    borderRadius: 16,
  },
  closeButtonText: {
    color: "#f1f2f6",
    fontSize: 12,
    fontWeight: "600",
  },
  sortSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    paddingBottom: 10,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#485460",
    paddingHorizontal: 16,
  },
  sortLabel: {
    color: "#f1f2f6",
    fontWeight: "bold",
    fontSize: 16,
    marginRight: 10,
  },
  dropdown: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dropdownItem: {
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f1f2f6",
    marginRight: 10,
    marginBottom: 8,
    backgroundColor: "#2f3640",
  },
  dropdownItemSelected: {
    backgroundColor: "#ffffff",
    borderColor: "#ffffff",
  },
  dropdownItemTextSelected: {
    color: "#000000",
    fontWeight: "700",
  },
  dropdownItemText: {
    color: "#f1f2f6",
  },
  listContent: {
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  row: {
    justifyContent: "space-between",
  },
  artistCard: {
    flex: 1,
    margin: 8,
    backgroundColor: "#2f3640",
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    padding: 8,
  },
  imageContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 8,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: "#222",
  },
  artistName: {
    color: "#f1f2f6",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
  },
  artistListeners: {
    color: "#ffd700",
    fontSize: 14,
    marginBottom: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },
});