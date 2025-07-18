import { useUser } from "@clerk/clerk-expo";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from "../firebase";
import { getImageUrl, getTrackDetails, Track } from '../services/music_API';
import MusicDetailsViewer from './MusicDetailsViewer';

const sortOptions = [
  { option: 'Title', key: 'title' },
  { option: 'Listeners', key: 'listeners' },
];

interface LikedMusicTracksProps {
  visible: boolean;
  onClose: () => void;
}

export default function LikedMusicTracks({ visible, onClose }: LikedMusicTracksProps) {
  const { user } = useUser();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [sortBy, setSortBy] = useState(sortOptions[0]);

  useEffect(() => {
    if (!visible) return;
    const fetchLikedTracks = async () => {
      setLoading(true);
      try {
        if (!user?.primaryEmailAddress?.emailAddress) {
          setTracks([]);
          return;
        }
        const docRef = doc(db, user.primaryEmailAddress.emailAddress, "musicTracks");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const likedKeys = Object.entries(data)
            .filter(([_, v]) => v === true)
            .map(([key]) => key);
          // key format: trackName:artistName
          const detailsArr = await Promise.all(
            likedKeys.map(async (key) => {
              const match = key.match(/^(.+?):(.+)$/);
              if (!match) return null;
              const [, trackName, artistName] = match;
              try {
                return await getTrackDetails(trackName, artistName);
              } catch {
                return null;
              }
            })
          );
          setTracks(detailsArr.filter((t): t is Track => t !== null));
        } else {
          setTracks([]);
        }
      } catch (err) {
        setTracks([]);
      }
      setLoading(false);
    };
    fetchLikedTracks();
  }, [visible, user?.primaryEmailAddress?.emailAddress]);

  const sortTracks = (tracks: Track[]) => {
    return [...tracks].sort((a, b) => {
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

  const renderTrack = ({ item }: { item: Track }) => {
    const title = item.name || 'Unknown Title';
    const imageUrl = getImageUrl(item.image);
    const listeners = item.listeners || null;
    return (
      <TouchableOpacity style={styles.cardWrapper} onPress={() => setSelectedTrack(item)}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.infoText}>{title}</Text>
        {listeners && <Text style={styles.infoText}>👂 {listeners}</Text>}
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.fullscreenContainer}>
        <View style={styles.sortSection}>
          <Text style={styles.sortLabel}>Sort By:</Text>
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
          </View>
        ) : (
          <FlatList
            data={sortTracks(tracks)}
            renderItem={renderTrack}
            keyExtractor={(item, idx) => item.name + (item.artist?.name || '') + idx}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
          />
        )}
        <MusicDetailsViewer
          selectedItem={selectedTrack}
          itemType={selectedTrack ? 'track' : null}
          onClose={() => setSelectedTrack(null)}
          getImageUrl={getImageUrl}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "#1e272e",
    paddingTop: 10,
  },
  sortSection: {
    backgroundColor: "#000",
    paddingBottom: 10,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#485460",
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  row: {
    justifyContent: "space-between",
  },
  cardWrapper: {
    flex: 1 / 2,
    marginVertical: 8,
    marginHorizontal: 14,
    alignItems: 'center',
  },
  imageContainer: {
    marginBottom: 8,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#222',
    overflow: 'hidden',
  },
  infoText: {
    color: "#d2dae2",
    fontWeight: "bold",
    fontSize: 12,
    textAlign: 'center',
  },
}); 