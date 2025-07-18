import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React from "react";
import {
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
  const itemId = selectedItem?.mbid || `${itemType}:${selectedItem?.name}`;

  const { user } = useUser();
  const [isLiked, setIsLiked] = React.useState(false);
  const [loadingLike, setLoadingLike] = React.useState(false);

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

  if (!selectedItem || !itemType) return null;

  return (
    <Modal
      visible={!!selectedItem}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.detailContainer}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="#FF0000" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ position: "relative" }}>
              <Image
                source={{ uri: getImageUrl(selectedItem.image) }}
                style={styles.detailImage}
              />
              {/* Heart button at top right of poster */}
              <TouchableOpacity
                style={styles.posterHeartButton}
                onPress={isLiked ? handleUnlike : handleLike}
                activeOpacity={0.7}
                disabled={loadingLike}
              >
                <Text style={{ fontSize: 28, opacity: loadingLike ? 0.5 : 1 }}>
                  {isLiked ? "❤️" : "🤍"}
                </Text>
              </TouchableOpacity>
            </View>
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
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  detailContainer: {
    flex: 1,
    padding: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButtonText: {
    color: "#FF0000",
    fontSize: 16,
    marginLeft: 8,
  },
  detailImage: {
    width: "100%",
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  detailSubtitle: {
    fontSize: 18,
    color: "#FF0000",
    marginBottom: 8,
  },
  detailStats: {
    fontSize: 14,
    color: "#888",
    marginBottom: 16,
  },
  detailText: {
    fontSize: 16,
    color: "#fff",
    lineHeight: 24,
  },
  posterHeartButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1,
  },
});

export default MusicDetailsViewer;
