import MovieCard from "@/components/MovieCard";
import { fetchMovies } from "@/services/tmdb_API";
import useFetch from "@/services/usefetch";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

const { height, width } = Dimensions.get("window");

interface MovieItem {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
}

export default function Movie() {
  const { data, loading, error } = useFetch<MovieItem[]>(() =>
    fetchMovies({ query: "" })
  );

  const getPosterUrl = (path: string | null) =>
    path ? `https://image.tmdb.org/t/p/w500${path}` : undefined;

  // Scroll refs & indices for auto-scroll (same as before)
  const scrollRefs = {
    Latest: useRef<ScrollView>(null),
    Upcoming: useRef<ScrollView>(null),
    Trending: useRef<ScrollView>(null),
  };

  const scrollIndices = {
    Latest: useRef(0),
    Upcoming: useRef(0),
    Trending: useRef(0),
  };

  const cardMargin = 8;
  const cardsPerRow = 3;
  const totalMargin = cardMargin * (cardsPerRow - 1);
  const cardWidth = (width - totalMargin - 16) / cardsPerRow; // same width you had
  const cardWidthWithMargin = cardWidth + cardMargin;

  // Store scrollX for each section to track scroll position and calculate focused card
  const scrollXValues = {
    Latest: useRef(new Animated.Value(0)).current,
    Upcoming: useRef(new Animated.Value(0)).current,
    Trending: useRef(new Animated.Value(0)).current,
  };

  // UseEffect for auto-scrolling (same as before, but now use Animated.event for better integration)
  useEffect(() => {
    const interval = setInterval(() => {
      Object.entries(scrollRefs).forEach(([section, ref]) => {
        const moviesCount = data?.length || 0;

        if (ref.current && data?.length) {
          const indexRef = scrollIndices[section as keyof typeof scrollIndices];
          indexRef.current += 1;

          if (indexRef.current >= moviesCount + 1) {
            indexRef.current = 1;
            ref.current.scrollTo({ x: 0, animated: false }); // snap back silently
          }

          ref.current.scrollTo({
            x: indexRef.current * cardWidthWithMargin,
            animated: true,
          });
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [data]);

  // Helper function to render each section with scaling effect on cards
  const renderSection = (title: string, movies: MovieItem[]) => {
    const doubledMovies = [...movies, ...movies]; // duplicate for infinite looping
    const sectionKey = title.split(" ")[0] as keyof typeof scrollRefs;

    // scrollX Animated value for this section
    const scrollX = scrollXValues[sectionKey];

    return (
      <View style={styles.section} key={title}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Animated.ScrollView
          ref={scrollRefs[sectionKey]}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
          scrollEventThrottle={16}
          // Connect scrollX animated value to scroll position
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          // Disable auto-scroll while user scrolls manually
          onTouchStart={() => {
            Object.values(scrollIndices).forEach((ref) => (ref.current = 0));
          }}
        >
          {doubledMovies.map((movie, index) => {
            const cardCenter = index * cardWidthWithMargin + cardWidth / 2;

            // shift scrollX by half screen width so that interpolation is based on center
            const scrollXWithOffset = Animated.add(scrollX, width / 2);

            // input range around the card center (left, center, right)
            const inputRange = [
              cardCenter - cardWidthWithMargin * 2,
              cardCenter - cardWidthWithMargin,
              cardCenter,
              cardCenter + cardWidthWithMargin,
              cardCenter + cardWidthWithMargin * 2,
            ];

            const scale = scrollXWithOffset.interpolate({
              inputRange,
              outputRange: [0.75, 0.8, 1, 0.8, 0.75],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                key={`${movie.id}_${index}`}
                style={[
                  styles.movieCardWrapper,
                  {
                    width: cardWidth,
                    transform: [{ scale }],
                  },
                ]}
              >
                <MovieCard
                  title={movie.title}
                  posterUrl={getPosterUrl(movie.poster_path)}
                />
              </Animated.View>
            );
          })}

        </Animated.ScrollView>
      </View>
    );
  };

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
      {renderSection("Latest Movies", data)}
      {renderSection("Upcoming Movies", data)}
      {renderSection("Trending Movies", data)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B2631",
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  section: {
    height: height * 0.235,
    marginBottom: 1,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
    paddingLeft: 2,
  },
  horizontalScroll: {
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  movieCardWrapper: {
    marginRight: 8,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1B2631",
  },
  errorText: {
    color: "red",
    fontSize: 14,
  },
  noResultsText: {
    color: "#fff",
    fontSize: 14,
  },
});
