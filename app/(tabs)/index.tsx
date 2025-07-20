
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, Image, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CricketMatchCarousel from "../../components/CricketMatchCarousel";
import DetailsViewer from "../../components/DetailsViewer";
import FootballMatchCarousel from "../../components/FootballMatchCarousel";
import MovieCard from "../../components/MovieCard";
import MusicDetailsViewer from "../../components/MusicDetailsViewer";
import { fetchPersonalizedMusicRecommendations } from "../../components/musicRecommender";
import { fetchPersonalizedRecommendations } from "../../components/tmdbRecommender";
import { getAlbumDetails, getImageUrl } from "../../services/music_API";
import { fetchMovieDetails } from "../../services/tmdb_API";
import { onGlobalScrollBeginDrag, onGlobalScrollEndDrag, registerCarousel, startGlobalAutoScroll, stopGlobalAutoScroll, unregisterCarousel } from "../../utils/carouselSync";

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
  const [albumDetailsLoading, setAlbumDetailsLoading] = useState(false);
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
  const scrollX = React.useMemo(() => new Animated.Value(0), []);

  // For music carousel logic
  const musicCardMargin = 8;
  const musicCardsPerRow = 3;
  const musicTotalMargin = musicCardMargin * (musicCardsPerRow - 1);
  const musicCardWidth = (width - musicTotalMargin - 16) / musicCardsPerRow;
  const musicCardWidthWithMargin = musicCardWidth + musicCardMargin;

  const musicScrollRef = React.useRef<ScrollView>(null);
  const musicScrollIndex = React.useRef<number>(0);
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

  // Register carousels when data is loaded and start global auto-scroll
  useEffect(() => {
    if (recommended.length > 0) {
      registerCarousel({
        ref: scrollRef,
        index: scrollIndex,
        itemCount: recommended.length,
        cardWidthWithMargin: cardWidthWithMargin
      });
      
      // Initialize scroll position
      const offset = recommended.length * cardWidthWithMargin;
      scrollRef.current?.scrollTo({ x: offset, animated: false });
      scrollIndex.current = recommended.length;
    }
    
    return () => {
      if (recommended.length > 0) {
        unregisterCarousel(scrollRef);
      }
    };
  }, [recommended, cardWidthWithMargin]);

  useEffect(() => {
    if (musicRecommended.length > 0) {
      registerCarousel({
        ref: musicScrollRef,
        index: musicScrollIndex,
        itemCount: musicRecommended.length,
        cardWidthWithMargin: musicCardWidthWithMargin
      });
      
      // Initialize scroll position
      const offset = musicRecommended.length * musicCardWidthWithMargin;
      musicScrollRef.current?.scrollTo({ x: offset, animated: false });
      musicScrollIndex.current = musicRecommended.length;
    }
    
    return () => {
      if (musicRecommended.length > 0) {
        unregisterCarousel(musicScrollRef);
      }
    };
  }, [musicRecommended, musicCardWidthWithMargin]);

  // Start global auto-scroll when any carousel is ready
  useEffect(() => {
    const hasContent = recommended.length > 0 || musicRecommended.length > 0;
    if (hasContent) {
      startGlobalAutoScroll();
    } else {
      stopGlobalAutoScroll();
    }
    
    return () => {
      stopGlobalAutoScroll();
    };
  }, [recommended.length, musicRecommended.length]);

  const onScrollBeginDrag = () => {
    onGlobalScrollBeginDrag();
  };

  const onScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(offsetX / cardWidthWithMargin);
    scrollIndex.current = currentIndex;
    onGlobalScrollEndDrag();
  };

  const onMusicScrollBeginDrag = () => {
    onGlobalScrollBeginDrag();
  };

  const onMusicScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(offsetX / musicCardWidthWithMargin);
    musicScrollIndex.current = currentIndex;
    onGlobalScrollEndDrag();
  };

  const getPosterUrl = (path?: string | null) =>
    path ? `https://image.tmdb.org/t/p/w500${path}` : undefined;

  // Fetch full details for a movie by ID using local API wrapper
  const handleMoviePress = async (movie: MovieItem) => {
    setDetailsLoading(true);
    try {
      const fullDetails = await fetchMovieDetails(String(movie.id));
      setSelectedMovie({ ...movie, ...fullDetails });
    } catch (err) {
      setSelectedMovie(movie);
    }
    setDetailsLoading(false);
  };

  const renderRecommendedSection = () => {
    const tripledMovies = [...recommended, ...recommended, ...recommended];
    return (
      <View style={[styles.section, { marginBottom: -2 }]}> 
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

  // Fetch full details for an album using local API wrapper
  const handleAlbumPress = async (album: any) => {
    setAlbumDetailsLoading(true);
    try {
      const fullDetails = await getAlbumDetails(album.name, album.artist?.name);
      setSelectedAlbum({ ...album, ...fullDetails });
    } catch (err) {
      setSelectedAlbum(album);
    }
    setAlbumDetailsLoading(false);
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
      <View style={[styles.section, { marginTop: 15 }]}> 
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
                <TouchableOpacity onPress={() => handleAlbumPress(album)}>
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
      {/* Sports Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sports</Text>
        <FootballMatchCarousel 
          cardWidth={cardWidth} 
          cardMargin={cardMargin}
        />
        <View style={{ marginTop: -15 }}>
          <CricketMatchCarousel 
            cardWidth={cardWidth} 
            cardMargin={cardMargin}
          />
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
    height: height * 0.22,
    marginBottom: 1,
    overflow: 'visible',
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
