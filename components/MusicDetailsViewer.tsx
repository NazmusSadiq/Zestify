import { Ionicons } from "@expo/vector-icons";
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
  const [likedIds, setLikedIds] = React.useState<{ [id: string]: boolean }>({});
  const isLiked = !!itemId && likedIds[itemId];

  const handleLike = () => {
    if (itemId) {
      setLikedIds((prev) => ({ ...prev, [itemId]: true }));
      // TODO: Integrate with DB
    }
  };

  const handleUnlike = () => {
    if (itemId) {
      setLikedIds((prev) => {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      });
      // TODO: Integrate with DB
    }
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
              >
                <Text style={{ fontSize: 28 }}>
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
