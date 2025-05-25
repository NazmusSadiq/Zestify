import { fetchMovies } from "@/services/tmdb_API";
import useFetch from "@/services/usefetch";
import React from "react";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from "react-native";

interface MovieItem {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
}

export default function Movie() {
  // fetchMovies with empty query to get popular movies
  const { data, loading, error } = useFetch<MovieItem[]>(() => fetchMovies({ query: "" }));

  const getPosterUrl = (path: string | null) =>
    path ? `https://image.tmdb.org/t/p/w500${path}` : undefined;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noResultsText}>No movies found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.movieItem}>
            {item.poster_path ? (
              <Image source={{ uri: getPosterUrl(item.poster_path) }} style={styles.poster} />
            ) : (
              <View style={[styles.poster, styles.noPoster]}>
                <Text style={styles.noPosterText}>No Image</Text>
              </View>
            )}
            <View style={styles.movieInfo}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.releaseDate}>{item.release_date}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B2631",
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  movieItem: {
    flexDirection: "row",
    marginBottom: 15,
    backgroundColor: "#2c3e50",
    borderRadius: 8,
    overflow: "hidden",
  },
  poster: {
    width: 100,
    height: 150,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  noPoster: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#34495e",
  },
  noPosterText: {
    color: "#ccc",
    fontSize: 14,
  },
  movieInfo: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  releaseDate: {
    color: "#bbb",
    marginTop: 5,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1B2631",
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
  noResultsText: {
    color: "#fff",
    fontSize: 16,
  },
});
