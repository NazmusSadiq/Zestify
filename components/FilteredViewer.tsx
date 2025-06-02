import { fetchMovieDetails, fetchTVSeriesDetails } from "@/services/tmdb_API";
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
import DetailsViewer from "./DetailsViewer";
import MovieCard from "./MovieCard";

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
  if (activeTab === "TV Series") {
    return [
      { option: "Title", key: "name" },
      { option: "Popularity", key: "vote_average" },
      { option: "Release Date", key: "first_air_date" },
    ];
  }

  if (
    activeTab === "Movie" &&
    (caseType === "genre" || caseType === "rating_above" || caseType === "language")
  ) {
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
  titleKey,
  sortOptions,
  activeTab,
  caseType,
}: FilteredViewerProps) => {
  const defaultSortOptions = sortOptions ?? determineSortOptions(activeTab, caseType);
  const [currentSortOptions, setCurrentSortOptions] = useState(defaultSortOptions);
  const [sortBy, setSortBy] = useState(defaultSortOptions[0]);
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

  const handleItemPress = async (item: Record<string, any>) => {
    setDetailsLoading(true);

    try {
      let mediaType = item.media_type?.toLowerCase() || "";
      if (!mediaType) {
        if (item.first_air_date || item.name) {
          mediaType = "tv";
        } else if (item.release_date || item.title) {
          mediaType = "movie";
        } else {
          mediaType = "";
        }
      }

      const fetchFunctionMap: Record<string, (id: string) => Promise<any>> = {
        movie: fetchMovieDetails,
        tv: fetchTVSeriesDetails,
      };

      if (mediaType && fetchFunctionMap[mediaType]) {
        const details = await fetchFunctionMap[mediaType](item.id.toString());
        setSelectedMovie({ ...item, ...details });
      } else {
        setSelectedMovie(item);
      }
    } catch (err) {
      console.error("Failed to fetch details:", err);
      setSelectedMovie(item);
    } finally {
      setDetailsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Record<string, any> }) => {
    const title =
      item[titleKey || ""] ||
      item["title"] ||
      item["name"] ||
      "Unknown Title";

    const posterPath = item.poster_path || item.posterUrl || item.poster;
    const posterUrl = posterPath ? `${IMAGE_BASE_URL}${posterPath}` : undefined;
    const averageScore = item.vote_average ?? item.average_score ?? null;
    const releaseDate = item.release_date ?? item.first_air_date ?? null;

    return (
      <View style={styles.cardWrapper}>
        <MovieCard title={title} posterUrl={posterUrl} onPress={() => handleItemPress(item)} />
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
        <View style={styles.sortSection}>
          <View style={styles.sortHeader}>
            <Text style={styles.sortLabel}>Sort By:</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close ✕</Text>
            </TouchableOpacity>
          </View>

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

export default FilteredViewer;
