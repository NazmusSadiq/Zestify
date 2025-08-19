import { getMusicImageFromWiki } from "@/services/music_API";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { db } from "../firebase";

interface TrackImage {
  "#text": string;
  size: string;
}

interface MusicDetailsViewerProps {
  selectedItem: any;
  itemType: "artist" | "album" | "track" | null;
  onClose: () => void;
  getImageUrl: (images: TrackImage[]) => string;
}

const MusicDetailsViewer = ({
  selectedItem,
  itemType,
  onClose,
  getImageUrl,
}: MusicDetailsViewerProps) => {
  // Use a unique id for like/unlike (e.g., mbid or name+type fallback)
  let itemId = '';
  if (itemType === 'track' && selectedItem?.name && selectedItem?.artist?.name) {
    itemId = `${selectedItem.name}:${selectedItem.artist.name}`;
  } else if (itemType === 'album' && selectedItem?.name && selectedItem?.artist) {
    const artistName = typeof selectedItem.artist === 'string'
      ? selectedItem.artist
      : selectedItem.artist.name;
    if (artistName) {
      itemId = `${selectedItem.name}:${artistName}`;
    }
  } else if (itemType === 'artist' && selectedItem?.name) {
    itemId = selectedItem.name;
  } else if (selectedItem?.mbid) {
    itemId = selectedItem.mbid;
  }

  const { user } = useUser();
  const [isLiked, setIsLiked] = React.useState(false);
  const [loadingLike, setLoadingLike] = React.useState(false);
  const [wikiImage, setWikiImage] = React.useState<string | null>(null);

  // Determine Firestore category based on itemType
  const categoryKey =
    itemType === "artist"
      ? "musicArtists"
      : itemType === "album"
      ? "musicAlbums"
      : "musicTracks";

  // Fetch like state from Firestore when itemId or categoryKey changes
  React.useEffect(() => {
    const fetchLike = async () => {
      if (!user?.primaryEmailAddress?.emailAddress || !itemId) {
        setIsLiked(false);
        return;
      }
      try {
        const musicDocRef = doc(
          db,
          user.primaryEmailAddress.emailAddress,
          categoryKey
        );
        const docSnap = await getDoc(musicDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsLiked(!!data[itemId]);
        } else {
          setIsLiked(false);
        }
      } catch {
        setIsLiked(false);
      }
    };
    fetchLike();
  }, [user?.primaryEmailAddress?.emailAddress, itemId, categoryKey]);

  const handleLike = async () => {
    if (!user?.primaryEmailAddress?.emailAddress || !itemId) return;
    setLoadingLike(true);
    try {
      const musicDocRef = doc(
        db,
        user.primaryEmailAddress.emailAddress,
        categoryKey
      );
      await setDoc(musicDocRef, { [itemId]: true }, { merge: true });
      setIsLiked(true);
    } catch {
      // Optionally show error
    }
    setLoadingLike(false);
  };

  const handleUnlike = async () => {
    if (!user?.primaryEmailAddress?.emailAddress || !itemId) return;
    setLoadingLike(true);
    try {
      const musicDocRef = doc(
        db,
        user.primaryEmailAddress.emailAddress,
        categoryKey
      );
      await setDoc(musicDocRef, { [itemId]: false }, { merge: true });
      setIsLiked(false);
    } catch {
      // Optionally show error
    }
    setLoadingLike(false);
  };

  React.useEffect(() => {
    const fetchWikiImage = async () => {
      if (!selectedItem || !itemType) {
        setWikiImage(null);
        return;
      }
      // let name = selectedItem.name;
      // if (itemType === "track" && selectedItem.artist?.name) {
      //   name = selectedItem.name;
      // }
      // const img = await getMusicImageFromWiki(name);
      let img: string | null = null;
      if (itemType === "track") {
        // Always use the specified image for tracks
        img = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/The_Sounds_of_Earth_-_GPN-2000-001976.jpg/1200px-The_Sounds_of_Earth_-_GPN-2000-001976.jpg";
      } else {
        let name = selectedItem.name;
        img = await getMusicImageFromWiki(name);
      }
      setWikiImage(img);
    };
    fetchWikiImage();
  }, [selectedItem, itemType]);

  if (!selectedItem || !itemType) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={!!selectedItem}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Ionicons name="arrow-back" size={24} color="#FF0000" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <View style={{ position: 'relative' }}>
              <Image
                source={{ uri: wikiImage || getImageUrl(selectedItem.image) }}
                style={styles.image}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.posterHeartButton}
                onPress={isLiked ? handleUnlike : handleLike}
                activeOpacity={0.7}
                disabled={loadingLike}
              >
                <Text style={{ fontSize: 28, opacity: loadingLike ? 0.5 : 1 }}>
                  {isLiked ? '❤️' : '🤍'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.detailsContainer}>
              <Text style={styles.title}>{selectedItem.name}</Text>

              {itemType === 'artist' && 'stats' in selectedItem && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Listeners:</Text>
                  <Text style={styles.value}>{selectedItem.stats?.listeners}</Text>
                </View>
              )}
              {/* {itemType === 'album' && 'artist' in selectedItem && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Artist:</Text>
                  <Text style={styles.value}>{selectedItem.artist.name}</Text>
                </View>
              )} */}
              {itemType === 'track' && 'artist' in selectedItem && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Artist:</Text>
                  <Text style={styles.value}>{selectedItem.artist.name}</Text>
                </View>
              )}
              {(itemType === 'album' || itemType === 'track') && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Listeners:</Text>
                  <Text style={styles.value}>{selectedItem.listeners}</Text>
                </View>
              )}
              {(itemType === 'album' || itemType === 'track') && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Plays:</Text>
                  <Text style={styles.value}>{selectedItem.playcount}</Text>
                </View>
              )}

              {itemType === 'artist' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Bio</Text>
                  <Text style={styles.description}>{selectedItem.bio?.summary.replace(/<[^>]*>/g, "")}</Text>
                </View>
              )}
              {itemType === 'album' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Album Info</Text>
                  <Text style={styles.description}>{selectedItem.wiki?.summary.replace(/<[^>]*>/g, "")}</Text>
                </View>
              )}
              {itemType === 'track' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Track Info</Text>
                  <Text style={styles.description}>{selectedItem.wiki?.summary.replace(/<[^>]*>/g, "")}</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 15,
  },
  posterHeartButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 20,
    padding: 2,
  },
  detailsContainer: {
    padding: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#252525',
    padding: 10,
    borderRadius: 8,
  },
  label: {
    fontWeight: 'bold',
    width: 100,
    color: '#3B82F6',
  },
  value: {
    flex: 1,
    color: '#FFFFFF',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#252525',
    padding: 15,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#3B82F6',
  },
  description: {
    color: '#CCCCCC',
    lineHeight: 22,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    color: '#FF0000',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default MusicDetailsViewer;
