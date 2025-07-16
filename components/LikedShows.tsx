import { useUser } from "@clerk/clerk-expo";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FlatList, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { db } from "../firebase";
import DetailsViewer from "./DetailsViewer";
import MovieCard from "./MovieCard";

interface LikedShowsProps {
  visible: boolean;
  onClose: () => void;
  activeTab: "Movie" | "TV Series";
}

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const sortOptions = [
  { option: "Title", key: "title" },
  { option: "Popularity", key: "vote_average" },
  { option: "Release Date", key: "release_date" },
];

const LikedShows = ({ visible, onClose, activeTab }: LikedShowsProps) => {
  const { user } = useUser();
  const [likedData, setLikedData] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState(sortOptions[0]);
  const [selectedShow, setSelectedShow] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const fetchLiked = async () => {
      setLoading(true);
      try {
        if (!user?.primaryEmailAddress?.emailAddress) {
          setLikedData([]);
          return;
        }
        const docRef = doc(db, user.primaryEmailAddress.emailAddress, activeTab === "Movie" ? "movies" : "tvseries");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Only keep those with value true
          const likedIds = Object.entries(data)
            .filter(([_, v]) => v === true)
            .map(([id]) => id);
          // Fetch details for each liked id
          const fetchDetails = async (id: string) => {
            const endpoint = activeTab === "Movie"
              ? `https://api.themoviedb.org/3/movie/${id}?language=en-US`
              : `https://api.themoviedb.org/3/tv/${id}?language=en-US`;
            const res = await fetch(endpoint, {
              headers: {
                accept: "application/json",
                Authorization: `Bearer ${process.env.EXPO_PUBLIC_MOVIE_API_KEY}`,
              },
            });
            return res.ok ? await res.json() : null;
          };
          const detailsArr = await Promise.all(likedIds.map(fetchDetails));
          setLikedData(detailsArr.filter(Boolean));
        } else {
          setLikedData([]);
        }
      } catch (err) {
        setLikedData([]);
      }
      setLoading(false);
    };
    fetchLiked();
  }, [visible, user?.primaryEmailAddress?.emailAddress, activeTab]);

  // Sorting
  const sortedData = [...likedData].sort((a, b) => {
    const key = sortBy.key;
    const valA = a[key];
    const valB = b[key];
    if (valA === undefined || valB === undefined) return 0;
    if (key.includes("date")) {
      return new Date(valB).getTime() - new Date(valA).getTime();
    }
    if (typeof valA === "string" && typeof valB === "string") {
      return valA.localeCompare(valB);
    }
    if (typeof valA === "number" && typeof valB === "number") {
      return valB - valA;
    }
    return 0;
  });

  const renderItem = ({ item }: { item: any }) => {
    const title = item.title || item.name || "Unknown Title";
    const posterPath = item.poster_path || item.posterUrl || item.poster;
    const posterUrl = posterPath ? `${IMAGE_BASE_URL}${posterPath}` : undefined;
    const averageScore = item.vote_average ?? item.average_score ?? null;
    const releaseDate = item.release_date ?? item.first_air_date ?? null;
    return (
      <View style={styles.cardWrapper}>
        <MovieCard title={title} posterUrl={posterUrl} onPress={() => setSelectedShow(item)} />
        <View style={styles.infoContainer}>
          {averageScore !== null && (
            <Text style={styles.infoText}>⭐ {averageScore.toFixed(1)}</Text>
          )}
          {releaseDate && (
            <Text style={styles.infoText}>{new Date(releaseDate).toLocaleDateString()}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.fullscreenContainer}>
        <View style={styles.sortSection}>
          <View style={styles.sortHeader}>
            <Text style={styles.sortLabel}>Sort By:</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close ✕</Text>
            </TouchableOpacity>
          </View>
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
        <FlatList
          data={sortedData}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          numColumns={3}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
      <DetailsViewer
        visible={selectedShow !== null}
        data={selectedShow}
        onClose={() => setSelectedShow(null)}
      />
    </Modal>
  );
};

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
    marginTop: -10,
    borderBottomWidth: 1,
    borderBottomColor: "#485460",
  },
  sortHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: -10,
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
  sortLabel: {
    color: "#f1f2f6",
    fontWeight: "bold",
    fontSize: 16,
  },
  dropdown: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: -10,
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
  cardWrapper: {
    flex: 1 / 3,
    marginVertical: 8,
    marginHorizontal: 14,
  },
  infoContainer: {
    marginTop: 6,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  infoText: {
    color: "#d2dae2",
    fontWeight: "bold",
    fontSize: 12,
  },
});

export default LikedShows;
