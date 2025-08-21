import DetailsViewer from "@/components/DetailsViewer";
import MovieCard from "@/components/MovieCard";
import {
  fetchLatestMovies,
  fetchMovieDetails,
  fetchTopRatedMovies,
  fetchUpcomingMovies,
} from "@/services/tmdb_API";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { height, width } = Dimensions.get("window");

interface MovieItem {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  [key: string]: any;
}

export default function Movie() {
  const [latest, setLatest] = useState<MovieItem[]>([]);
  const [upcoming, setUpcoming] = useState<MovieItem[]>([]);
  const [topRated, setTopRated] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<MovieItem | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [l, u, t] = await Promise.all([
          fetchLatestMovies(),
          fetchUpcomingMovies(),
          fetchTopRatedMovies(),
        ]);
        setLatest(l);
        setUpcoming(u);
        setTopRated(t);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getPosterUrl = (path: string | null) =>
    path ? `https://image.tmdb.org/t/p/w500${path}` : undefined;

  const sectionKeys = ["Latest", "Upcoming", "TopRated"] as const;

  const scrollRefs = React.useMemo(() => {  //Memoizes the computation so it only runs once
    return Object.fromEntries(  //Converts the array of key-value pairs into an object
      sectionKeys.map((key) => [key, React.createRef<ScrollView>()])
    ) as Record<string, React.RefObject<ScrollView>>;
  }, []);

  const scrollIndices = React.useRef<Record<string, number>>({
    Latest: 0,
    Upcoming: 0,
    TopRated: 0,
  });

  const isManualScrolling = React.useRef<Record<string, boolean>>({
    Latest: false,
    Upcoming: false,
    TopRated: false,
  });

  const manualScrollTimeouts = React.useRef<Record<string, ReturnType<typeof setTimeout> | null>>({
    Latest: null,
    Upcoming: null,
    TopRated: null,
  });

  const scrollXValues = React.useMemo(() => {
    return Object.fromEntries(
      sectionKeys.map((key) => [key, new Animated.Value(0)])
    ) as Record<string, Animated.Value>;
  }, []);

  const cardMargin = 8;
  const cardsPerRow = 3;
  const totalMargin = cardMargin * (cardsPerRow - 1);
  const cardWidth = (width - totalMargin - 16) / cardsPerRow;
  const cardWidthWithMargin = cardWidth + cardMargin;

  useEffect(() => {
    const movieGroups = { Latest: latest, Upcoming: upcoming, TopRated: topRated };

    Object.entries(movieGroups).forEach(([section, data]) => {  //initializes the scroll position for each movie carousel section to create the infinite scrolling
      const scrollRef = scrollRefs[section];
      if (scrollRef?.current && data.length > 0) {
        const offset = data.length * cardWidthWithMargin;
        scrollRef.current.scrollTo({ x: offset, animated: false });
        scrollIndices.current[section] = data.length;
      }
    });
  }, [latest, upcoming, topRated, scrollRefs]);

  useEffect(() => {
    const interval = setInterval(() => {
      sectionKeys.forEach((section) => {
        const movies = getSectionData(section);
        if (!movies.length || isManualScrolling.current[section]) return;

        scrollIndices.current[section]++;

        if (scrollIndices.current[section] >= movies.length * 2) {
          scrollIndices.current[section] = movies.length;
          scrollRefs[section]?.current?.scrollTo({
            x: movies.length * cardWidthWithMargin,
            animated: false,
          });
        }

        scrollRefs[section]?.current?.scrollTo({
          x: scrollIndices.current[section] * cardWidthWithMargin,
          animated: true,
        });
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [latest, upcoming, topRated]);

  const onScrollBeginDrag = (section: string) => {
    isManualScrolling.current[section] = true;
    if (manualScrollTimeouts.current[section]) {
      clearTimeout(manualScrollTimeouts.current[section]!);
      manualScrollTimeouts.current[section] = null;
    }
  };

  const onScrollEndDrag = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
    section: string
  ) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(offsetX / cardWidthWithMargin);
    scrollIndices.current[section] = currentIndex;

    manualScrollTimeouts.current[section] = setTimeout(() => {
      isManualScrolling.current[section] = false;
    }, 2000);
  };

  const getSectionData = (section: string) => {
    switch (section) {
      case "Latest":
        return latest;
      case "Upcoming":
        return upcoming;
      case "TopRated":
        return topRated;
      default:
        return [];
    }
  };

  const handleMoviePress = async (movie: MovieItem) => {
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

  const renderSection = (title: string, movies: MovieItem[]) => {
    const tripledMovies = [...movies, ...movies, ...movies];

    let sectionKey: string;
    if (title.startsWith("Latest")) sectionKey = "Latest";
    else if (title.startsWith("Upcoming")) sectionKey = "Upcoming";
    else if (title.startsWith("Top")) sectionKey = "TopRated";
    else sectionKey = "";

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
          onScroll={({ nativeEvent }) => {
            Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )({ nativeEvent });
          }}
          onScrollBeginDrag={() => onScrollBeginDrag(sectionKey)}
          onScrollEndDrag={(e) => onScrollEndDrag(e, sectionKey)}
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
      {renderSection("Latest Movies", latest)}
      {renderSection("Upcoming Movies", upcoming)}
      {renderSection("Top Rated Movies", topRated)}
      
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
});