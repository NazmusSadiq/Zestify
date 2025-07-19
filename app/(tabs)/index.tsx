
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from "react-native";
import DetailsViewer from "../../components/DetailsViewer";
import MovieCard from "../../components/MovieCard";
import { fetchPersonalizedRecommendations } from "../../components/tmdbRecommender";

const { height, width } = Dimensions.get("window");

interface MovieItem {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  [key: string]: any;
}

export default function Index() {
  const [recommended, setRecommended] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<MovieItem | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // For carousel logic
  const cardMargin = 8;
  const cardsPerRow = 3;
  const totalMargin = cardMargin * (cardsPerRow - 1);
  const cardWidth = (width - totalMargin - 16) / cardsPerRow;
  const cardWidthWithMargin = cardWidth + cardMargin;

  const scrollRef = React.useRef<ScrollView>(null);
  const scrollIndex = React.useRef<number>(0);
  const isManualScrolling = React.useRef<boolean>(false);
  const manualScrollTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollX = React.useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    (async () => {
      try {
        const rec = await fetchPersonalizedRecommendations();
        setRecommended(rec);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (scrollRef.current && recommended.length > 0) {
      const offset = recommended.length * cardWidthWithMargin;
      scrollRef.current.scrollTo({ x: offset, animated: false });
      scrollIndex.current = recommended.length;
    }
  }, [recommended]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!recommended.length || isManualScrolling.current) return;
      scrollIndex.current++;
      if (scrollIndex.current >= recommended.length * 2) {
        scrollIndex.current = recommended.length;
        scrollRef.current?.scrollTo({ x: recommended.length * cardWidthWithMargin, animated: false });
      }
      scrollRef.current?.scrollTo({ x: scrollIndex.current * cardWidthWithMargin, animated: true });
    }, 2000);
    return () => clearInterval(interval);
  }, [recommended]);

  const onScrollBeginDrag = () => {
    isManualScrolling.current = true;
    if (manualScrollTimeout.current) {
      clearTimeout(manualScrollTimeout.current);
      manualScrollTimeout.current = null;
    }
  };

  const onScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(offsetX / cardWidthWithMargin);
    scrollIndex.current = currentIndex;
    manualScrollTimeout.current = setTimeout(() => {
      isManualScrolling.current = false;
    }, 2000);
  };

  const getPosterUrl = (path: string | null) =>
    path ? `https://image.tmdb.org/t/p/w500${path}` : undefined;

  const handleMoviePress = (movie: MovieItem) => {
    setDetailsLoading(true);
    setSelectedMovie(movie);
    setDetailsLoading(false);
  };

  const renderRecommendedSection = () => {
    const tripledMovies = [...recommended, ...recommended, ...recommended];
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended Movies</Text>
        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
          scrollEventThrottle={16}
          onScroll={({ nativeEvent }) => {
            Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )({ nativeEvent });
          }}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
        >
          {tripledMovies.map((movie, index) => {
            const cardCenter = index * cardWidthWithMargin + cardWidth / 2;
            const scrollXWithOffset = Animated.add(scrollX, width / 2);
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
                  onPress={() => handleMoviePress(movie)}
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

  return (
    <View style={styles.container}>
      {renderRecommendedSection()}
      {/* Placeholder for Music Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Music (Coming Soon)</Text>
        <View style={styles.placeholderContent}>
          <Text style={styles.placeholderText}>Music recommendations will appear here.</Text>
        </View>
      </View>
      {/* Placeholder for Sport Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sport (Coming Soon)</Text>
        <View style={styles.placeholderContent}>
          <Text style={styles.placeholderText}>Sport recommendations will appear here.</Text>
        </View>
      </View>
      <DetailsViewer
        data={selectedMovie}
        visible={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
        titleKey="title"
        imageKey="poster_path"
      />
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
  placeholderContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#aaa",
    fontSize: 14,
  },
});
