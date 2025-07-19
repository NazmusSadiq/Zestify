
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, Image, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DetailsViewer from "../../components/DetailsViewer";
import MovieCard from "../../components/MovieCard";
import MusicDetailsViewer from "../../components/MusicDetailsViewer";
import { fetchPersonalizedMusicRecommendations } from "../../components/musicRecommender";
import { fetchPersonalizedRecommendations } from "../../components/tmdbRecommender";
import { getImageUrl } from "../../services/music_API";

const { height, width } = Dimensions.get("window");

interface MovieItem {
  id: number;
  title: string;
  poster_path?: string | null;
  release_date: string;
  [key: string]: any;
}

export default function Index() {
  const [recommended, setRecommended] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<MovieItem | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [musicRecommended, setMusicRecommended] = useState<any[]>([]);
  const [musicLoading, setMusicLoading] = useState(true);
  const [musicError, setMusicError] = useState<Error | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<any | null>(null);

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

  // For music carousel logic
  const musicCardMargin = 8;
  const musicCardsPerRow = 3;
  const musicTotalMargin = musicCardMargin * (musicCardsPerRow - 1);
  const musicCardWidth = (width - musicTotalMargin - 16) / musicCardsPerRow;
  const musicCardWidthWithMargin = musicCardWidth + musicCardMargin;

  const musicScrollRef = React.useRef<ScrollView>(null);
  const musicScrollIndex = React.useRef<number>(0);
  const musicIsManualScrolling = React.useRef<boolean>(false);
  const musicManualScrollTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const musicScrollX = React.useMemo(() => new Animated.Value(0), []);

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

  useEffect(() => {
    (async () => {
      try {
        const rec = await fetchPersonalizedMusicRecommendations();
        setMusicRecommended(rec);
      } catch (err: any) {
        setMusicError(err);
      } finally {
        setMusicLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (musicScrollRef.current && musicRecommended.length > 0) {
      const offset = musicRecommended.length * musicCardWidthWithMargin;
      musicScrollRef.current.scrollTo({ x: offset, animated: false });
      musicScrollIndex.current = musicRecommended.length;
    }
  }, [musicRecommended]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!musicRecommended.length || musicIsManualScrolling.current) return;
      musicScrollIndex.current++;
      if (musicScrollIndex.current >= musicRecommended.length * 2) {
        musicScrollIndex.current = musicRecommended.length;
        musicScrollRef.current?.scrollTo({ x: musicRecommended.length * musicCardWidthWithMargin, animated: false });
      }
      musicScrollRef.current?.scrollTo({ x: musicScrollIndex.current * musicCardWidthWithMargin, animated: true });
    }, 2000);
    return () => clearInterval(interval);
  }, [musicRecommended]);

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

  const onMusicScrollBeginDrag = () => {
    musicIsManualScrolling.current = true;
    if (musicManualScrollTimeout.current) {
      clearTimeout(musicManualScrollTimeout.current);
      musicManualScrollTimeout.current = null;
    }
  };

  const onMusicScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(offsetX / musicCardWidthWithMargin);
    musicScrollIndex.current = currentIndex;
    musicManualScrollTimeout.current = setTimeout(() => {
      musicIsManualScrolling.current = false;
    }, 2000);
  };

  const getPosterUrl = (path?: string | null) =>
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

  const renderMusicSection = () => {
    if (musicLoading) {
      return (
        <View style={styles.section}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      );
    }
    if (musicError) {
      return (
        <View style={styles.section}>
          <Text style={styles.errorText}>Error: {musicError.message}</Text>
        </View>
      );
    }
    const tripledAlbums = [...musicRecommended, ...musicRecommended, ...musicRecommended];
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended Albums</Text>
        <Animated.ScrollView
          ref={musicScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
          scrollEventThrottle={16}
          onScroll={({ nativeEvent }) => {
            Animated.event(
              [{ nativeEvent: { contentOffset: { x: musicScrollX } } }],
              { useNativeDriver: false }
            )({ nativeEvent });
          }}
          onScrollBeginDrag={onMusicScrollBeginDrag}
          onScrollEndDrag={onMusicScrollEndDrag}
        >
          {tripledAlbums.map((album, index) => {
            const cardCenter = index * musicCardWidthWithMargin + musicCardWidth / 2;
            const scrollXWithOffset = Animated.add(musicScrollX, width / 2);
            const inputRange = [
              cardCenter - musicCardWidthWithMargin * 2,
              cardCenter - musicCardWidthWithMargin,
              cardCenter,
              cardCenter + musicCardWidthWithMargin,
              cardCenter + musicCardWidthWithMargin * 2,
            ];
            const scale = scrollXWithOffset.interpolate({
              inputRange,
              outputRange: [0.75, 0.8, 1, 0.8, 0.75],
              extrapolate: "clamp",
            });
            return (
              <Animated.View
                key={`${album.name}_${album.artist?.name || ""}_${index}`}
                style={[
                  styles.musicCardWrapper,
                  {
                    width: musicCardWidth,
                    transform: [{ scale }],
                  },
                ]}
              >
                <TouchableOpacity onPress={() => setSelectedAlbum(album)}>
                  <View style={styles.musicCardImageWrapper}>
                    <Image
                      source={{ uri: getImageUrl(album.image) }}
                      style={styles.musicCardImage}
                      resizeMode="cover"
                    />
                  </View>
                  <Text style={styles.musicCardTitle} numberOfLines={2}>{album.name}</Text>
                  <Text style={styles.musicCardArtist} numberOfLines={1}>{album.artist?.name}</Text>
                </TouchableOpacity>
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
      {renderMusicSection()}
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
      <MusicDetailsViewer
        selectedItem={selectedAlbum}
        itemType={selectedAlbum ? "album" : null}
        onClose={() => setSelectedAlbum(null)}
        getImageUrl={getImageUrl}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B2631",
    paddingHorizontal: 8,
    paddingTop: 70, // Increased from 4 to 32 for more space below the top bar
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
  musicCardWrapper: {
    marginRight: 8,
    width: 110,
    alignItems: "center",
    backgroundColor: "#222b36",
    borderRadius: 10,
    padding: 8,
  },
  musicCardImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    marginBottom: 6,
    backgroundColor: "#444",
  },
  musicCardImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  musicCardTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 2,
  },
  musicCardArtist: {
    color: "#aaa",
    fontSize: 12,
    textAlign: "center",
  },
});
