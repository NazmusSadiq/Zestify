import { fetchMovieDetails } from "@/services/tmdb_API"; // Adjust import if needed
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DetailsViewer from "./DetailsViewer"; // Make sure this path is correct
import MovieCard from "./MovieCard"; // Adjust path if needed

interface FilteredViewerProps {
  data: Record<string, any>[] | null;
  visible: boolean;
  onClose: () => void;
  titleKey?: string;
  filterKeys?: string[];
  sortOptions?: { option: string; key: string }[];
  activeTab?: string;
  caseType?: string;
}

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const determineSortOptions = (
  activeTab?: string,
  caseType?: string
): { option: string; key: string }[] => {

  if (activeTab === "Movie" && (caseType === "genre" || caseType === "rating_above")) {
    return [
      { option: "Title", key: "title" },
      { option: "Popularity", key: "vote_average" },
      { option: "Release Date", key: "release_date" },
    ];
  }
  if (activeTab === "Movie" && caseType === "release_year") {
    return [
      { option: "Title", key: "title" },
      { option: "Popularity", key: "vote_average" },
    ];
  }

  // fallback default:
  return [
    { option: "Title", key: "title" },
    { option: "Popularity", key: "vote_average" },
    { option: "Release Date", key: "release_date" },
  ];
};

const FilteredViewer = ({
  data,
  visible,
  onClose,
  titleKey = "title",
  filterKeys,
  sortOptions,
  activeTab,
  caseType,
}: FilteredViewerProps) => {
  // Default to first option of provided sortOptions or determineSortOptions
  const defaultSortOptions = sortOptions ?? determineSortOptions(activeTab, caseType);
  const [currentSortOptions, setCurrentSortOptions] = useState<{ option: string; key: string }[]>(defaultSortOptions);
  const [sortBy, setSortBy] = useState<{ option: string; key: string }>(defaultSortOptions[0]);
  const [sortedData, setSortedData] = useState<Record<string, any>[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Record<string, any> | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const options = sortOptions ?? determineSortOptions(activeTab, caseType);
    setCurrentSortOptions(options);
    setSortBy(options[0]);
  }, [activeTab, caseType, sortOptions]);

  useEffect(() => {
    if (!data) {
      setSortedData([]);
      return;
    }

    const key = sortBy.key;

    const sorted = [...data].sort((a, b) => {
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

    setSortedData(sorted);
  }, [data, sortBy]);

  const handleMoviePress = async (movie: Record<string, any>) => {
    setDetailsLoading(true);
    try {
      const details = await fetchMovieDetails(movie.id.toString());
      setSelectedMovie({ ...movie, ...details });
    } catch (err) {
      console.error("Failed to fetch movie details:", err);
      setSelectedMovie(movie);
    } finally {
      setDetailsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Record<string, any> }) => {
    const title = item[titleKey] || item["title"] || item["name"] || "Unknown Title";
    const posterPath = item.poster_path || item.posterUrl || item.poster;
    const posterUrl = posterPath ? `${IMAGE_BASE_URL}${posterPath}` : undefined;
    const averageScore = item.vote_average ?? item.average_score ?? null;
    const releaseDate = item.release_date ?? item.first_air_date ?? null;

    return (
      <View style={styles.cardWrapper}>
        <MovieCard
          title={title}
          posterUrl={posterUrl}
          onPress={() => handleMoviePress(item)}
        />
        <View style={styles.infoContainer}>
          {averageScore !== null && (
            <Text style={styles.infoText}>⭐ {averageScore.toFixed(1)}</Text>
          )}
          {releaseDate && (
            <Text style={styles.infoText}>
              {new Date(releaseDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.fullscreenContainer}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close ✕</Text>
        </TouchableOpacity>

        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort By:</Text>
          <View style={styles.dropdown}>
            {currentSortOptions.map(({ option, key }) => (
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
        visible={selectedMovie !== null}
        data={selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "#2c3e50",
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 10,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  sortContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sortLabel: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 6,
  },
  infoContainer: {
    marginTop: 4,
  },
  infoText: {
    color: "#ddd",
    fontSize: 10,
  },
  dropdown: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dropdownItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#888",
    marginRight: 8,
    marginBottom: 6,
  },
  dropdownItemSelected: {
    backgroundColor: "#3498db",
    borderColor: "#3498db",
  },
  dropdownItemText: {
    color: "#fff",
    fontSize: 14,
  },
  dropdownItemTextSelected: {
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 40,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardWrapper: {
    flex: 1 / 3,
    marginHorizontal: 4,
  },
});

export default FilteredViewer;
