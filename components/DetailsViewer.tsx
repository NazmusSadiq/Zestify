import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
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

interface DetailsViewerProps {
  data: Record<string, any> | null;
  visible: boolean;
  onClose: () => void;
  titleKey?: string;
  imageKey?: string;
}

const DetailsViewer = ({
  data,
  visible,
  onClose,
  titleKey = "title",
  imageKey = "poster_path",
}: DetailsViewerProps) => {
  // Use the TMDB id for like/unlike
  const itemId = data?.id;
  // Determine type: movie or tvseries
  const type = data?.media_type === "tv" || data?.seasons ? "tvseries" : "movies";
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);

  // Fetch like state from Firestore when itemId/type changes
  useEffect(() => {
    const fetchLike = async () => {
      if (!user?.primaryEmailAddress?.emailAddress || !itemId || !type) {
        setIsLiked(false);
        return;
      }
      try {
        const docRef = doc(db, user.primaryEmailAddress.emailAddress, type);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsLiked(!!data[itemId]);
        } else {
          setIsLiked(false);
        }
      } catch (e) {
        setIsLiked(false);
      }
    };
    fetchLike();
  }, [user?.primaryEmailAddress?.emailAddress, itemId, type]);

  const handleLike = async () => {
    if (!user?.primaryEmailAddress?.emailAddress || !itemId || !type) return;
    setLoadingLike(true);
    try {
      const docRef = doc(db, user.primaryEmailAddress.emailAddress, type);
      await setDoc(docRef, { [itemId]: true }, { merge: true });
      setIsLiked(true);
    } catch (e) {
      // Optionally show error
    }
    setLoadingLike(false);
  };

  const handleUnlike = async () => {
    if (!user?.primaryEmailAddress?.emailAddress || !itemId || !type) return;
    setLoadingLike(true);
    try {
      const docRef = doc(db, user.primaryEmailAddress.emailAddress, type);
      await setDoc(docRef, { [itemId]: false }, { merge: true });
      setIsLiked(false);
    } catch (e) {
      // Optionally show error
    }
    setLoadingLike(false);
  };

  if (!data) return null;

  const excludedFields = [
    "backdrop_path",
    "id",
    "imdb_id",
    "genre_ids",
    "vote_count",
    "popularity",
    "homepage",
    "tagline",
    "poster_path",
  ];

  const renderFields = () =>
    Object.entries(data).map(([key, value]) => {
      if (
        excludedFields.includes(key) ||
        key === titleKey ||
        key === imageKey
      )
        return null;

      const label = (
        <View style={styles.labelWithIcon}>
          <Text style={styles.fieldKey}>{formatKey(key)}</Text>
          <Image
            source={require("../assets/icons/arrow.png")}
            style={styles.icon}
          />
        </View>
      );

      if (key === "seasons" && Array.isArray(value)) {
        return (
          <View key={key} style={styles.fieldContainer}>
            {label}
            {value.map((season: any) => (
              <View key={season.id || season.season_number} style={{ marginBottom: 12 }}>
                <Text style={[styles.fieldValue, { fontWeight: "700" }]}>
                  Season {season.season_number}:
                </Text>
                {season.episodes && season.episodes.length > 0 ? (
                  <View style={{ paddingLeft: 12, marginTop: 4 }}>
                    {season.episodes.map((ep: any) => (
                      <Text key={ep.id} style={styles.fieldValue}>
                        Ep {ep.episode_number}: {ep.name}{" "}
                        {ep.vote_average ? `★ ${ep.vote_average.toFixed(1)}` : ""}
                      </Text>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.fieldValue}>No episodes data</Text>
                )}
              </View>
            ))}
          </View>
        );
      }

      if (typeof value === "string" || typeof value === "number") {
        return (
          <View key={key} style={styles.fieldContainer}>
            <Text style={styles.fieldKey}>{formatKey(key)}:</Text>
            <Text style={styles.fieldValue}>{value.toString()}</Text>
          </View>
        );
      }

      if (Array.isArray(value)) {
        return (
          <View key={key} style={styles.fieldContainer}>
            {label}
            <Text style={styles.fieldValue}>
              {value
                .map((item) =>
                  typeof item === "object" ? item.name || item.title : item
                )
                .join(", ")}
            </Text>
          </View>
        );
      }

      if (typeof value === "object" && value !== null) {
        return (
          <View key={key} style={styles.fieldContainer}>
            {label}
            <Text style={styles.fieldValue}>
              {value.name || value.title || JSON.stringify(value)}
            </Text>
          </View>
        );
      }

      return null;
    });

  const formatKey = (key: string) =>
    key.replace(/_/g, " ").replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.fullscreenContainer}>
        <View style={styles.fullContent}>
          {/* Back button at top left, like in GameDetails */}
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="#FF0000" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {data[titleKey] && <Text style={styles.title}>{data[titleKey]}</Text>}

            {data[imageKey] && (
              <View style={styles.imageContainer}>
                <Image
                  source={{
                    uri: `https://image.tmdb.org/t/p/w342${data[imageKey]}`,
                  }}
                  style={styles.image}
                  resizeMode="cover"
                />
                {/* Heart button on top right of poster */}
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
            )}

            <View style={styles.detailsContainer}>{renderFields()}</View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "#1B2631",
  },
  fullContent: {
    flex: 1,
    padding: 0,
    backgroundColor: "#1B2631",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
    marginTop: 20, // Increased from 4 to make the back button lower
    marginLeft: 4,
    alignSelf: "flex-start",
  },
  backButtonText: {
    color: "#FF0000",
    fontSize: 16,
    marginLeft: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
    marginTop: 4, 
  },
  imageContainer: {
    aspectRatio: 2 / 3,
    height: 400,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#34495e",
    alignSelf: "center",
    marginBottom: 12,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 4,
  },
  posterHeartButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 20,
    padding: 2,
  },
  detailsContainer: {
    marginTop: 8,
    backgroundColor: "#222a34",
    padding: 12,
    borderRadius: 8,
  },
  fieldContainer: {
    marginBottom: 10,
  },
  fieldKey: {
    color: "#bbb",
    fontWeight: "600",
    fontSize: 16,
  },
  fieldValue: {
    color: "#eee",
    fontSize: 15,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  icon: {
    width: 14,
    height: 14,
    marginLeft: 6,
    tintColor: "#ccc",
  },
});

export default DetailsViewer;
