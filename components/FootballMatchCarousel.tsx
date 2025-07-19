import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    AppState,
    Dimensions,
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { getTeamWithCrest, useFootballData } from '../app/(tabs)/sport/footballdatafetcher';
import { onGlobalScrollBeginDrag, onGlobalScrollEndDrag, registerCarousel, unregisterCarousel } from '../utils/carouselSync';

const { width } = Dimensions.get('window');

interface FootballMatchCarouselProps {
  cardWidth: number;
  cardMargin: number;
}

const FootballMatchCard = ({ match }: { match: any }) => {
  const { homeTeam, awayTeam, score, utcDate, status, competition, matchday } = match;
  const home = getTeamWithCrest(homeTeam);
  const away = getTeamWithCrest(awayTeam);
  const matchDate = new Date(utcDate);
  matchDate.setHours(matchDate.getHours() + 6);
  const timeString = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = matchDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const isPlayed = status === "FINISHED" || status === "IN_PLAY" || status === "PAUSED";

  return (
    <View style={styles.matchCard}>
      <Text style={styles.metaText}>
        {(competition?.name === "Primera Division" ? "La Liga" : competition?.name) ?? 'Unknown'} - R{matchday} - {dateString}
      </Text>
      <View style={styles.teamRow}>
        {/* Centered time/score */}
        <View style={styles.centerTimeContainer}>
          {isPlayed ? (
            <Text style={styles.scoreText}>
              {score?.fullTime?.home ?? '-'} - {score?.fullTime?.away ?? '-'}
            </Text>
          ) : (
            <Text style={styles.matchTime}>{timeString}</Text>
          )}
        </View>
        
        {/* Left team - positioned at fixed distance from center */}
        <View style={styles.leftTeamContainer}>
          <Text style={styles.teamName} numberOfLines={1}>{home.name}</Text>
          {home.crest && <Image source={{ uri: home.crest }} style={styles.crest} />}
        </View>
        
        {/* Right team - positioned at fixed distance from center */}
        <View style={styles.rightTeamContainer}>
          {away.crest && <Image source={{ uri: away.crest }} style={styles.crest} />}
          <Text style={styles.teamName} numberOfLines={1}>{away.name}</Text>
        </View>
      </View>
    </View>
  );
};

// Global cache for home matches - persists for entire app lifetime
let globalHomeMatches: any[] = [];
let hasGloballyFetched = false;
let globalFetchPromise: Promise<void> | null = null;

export default function FootballMatchCarousel({ cardWidth, cardMargin }: FootballMatchCarouselProps) {
  const { homeMatches, loadingHome, fetchHomeMatches } = useFootballData();
  
  const matchCardWidth = width - 15; 
  const matchCardMargin = 0; 
  const matchCardWidthWithMargin = matchCardWidth;
  
  // Carousel state
  const scrollRef = useRef<ScrollView>(null);
  const scrollIndex = useRef<number>(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  
  // Local state for matches
  const [localMatches, setLocalMatches] = React.useState<any[]>(globalHomeMatches);
  const [localLoading, setLocalLoading] = React.useState<boolean>(!hasGloballyFetched);
  
  // Tab focus state
  const [isTabFocused, setIsTabFocused] = React.useState<boolean>(true);
  const [appStateVisible, setAppStateVisible] = React.useState<boolean>(AppState.currentState === 'active');

  // One-time global fetch function
  const performGlobalFetch = async () => {
    if (hasGloballyFetched || globalFetchPromise) {
      return globalFetchPromise || Promise.resolve();
    }
    
    setLocalLoading(true);
    
    globalFetchPromise = fetchHomeMatches().then(() => {
      globalHomeMatches = [...homeMatches];
      hasGloballyFetched = true;
      setLocalMatches(globalHomeMatches);
      setLocalLoading(false);
    }).catch((error) => {
      console.error("🏈 Global fetch failed:", error);
      setLocalLoading(false);
    });
    
    return globalFetchPromise;
  };

  // One-time fetch when component first mounts
  useEffect(() => {
    if (!hasGloballyFetched) {
      performGlobalFetch();
    } else {
      setLocalMatches(globalHomeMatches);
      setLocalLoading(false);
    }
  }, []);

  // Update local matches when global homeMatches updates (only during initial fetch)
  useEffect(() => {
    if (hasGloballyFetched && homeMatches.length > 0 && globalHomeMatches.length === 0) {
      globalHomeMatches = [...homeMatches];
      setLocalMatches(globalHomeMatches);
    }
  }, [homeMatches]);

  // Tab focus detection
  useFocusEffect(
    React.useCallback(() => {
      setIsTabFocused(true);
      return () => {
        setIsTabFocused(false);
      };
    }, [])
  );

  // App state detection
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      setAppStateVisible(nextAppState === 'active');
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Register with global carousel synchronization when matches are loaded
  useEffect(() => {
    if (localMatches.length > 0) {
      registerCarousel({
        ref: scrollRef,
        index: scrollIndex,
        itemCount: localMatches.length,
        cardWidthWithMargin: matchCardWidthWithMargin
      });
      
      // Initialize scroll position
      const offset = localMatches.length * matchCardWidthWithMargin;
      scrollRef.current?.scrollTo({ x: offset, animated: false });
      scrollIndex.current = localMatches.length;
    }
    
    return () => {
      if (localMatches.length > 0) {
        unregisterCarousel(scrollRef);
      }
    };
  }, [localMatches, matchCardWidthWithMargin]);

  // Manual scroll handlers using global synchronization
  const onScrollBeginDrag = () => {
    onGlobalScrollBeginDrag();
  };

  const onScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(offsetX / matchCardWidthWithMargin);
    scrollIndex.current = currentIndex;
    onGlobalScrollEndDrag();
  };

  if (localLoading) {
    return (
      <View style={[styles.loadingContainer, { width: matchCardWidth, height: 120 }]}>
        <Text style={styles.loadingText}>Loading matches...</Text>
      </View>
    );
  }

  if (localMatches.length === 0) {
    return (
      <View style={[styles.loadingContainer, { width: matchCardWidth, height: 120 }]}>
        <Text style={styles.loadingText}>No matches available</Text>
      </View>
    );
  }

  // Triple the matches for infinite scroll using local cached matches
  const tripledMatches = [...localMatches, ...localMatches, ...localMatches];

  return (
    <View style={[styles.container, { width: matchCardWidth }]}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        snapToInterval={matchCardWidthWithMargin}
        decelerationRate="fast"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
      >
        {tripledMatches.map((match, index) => (
          <View
            key={`${match.id}_${index}`}
            style={[styles.cardWrapper, { width: matchCardWidth }]}
          >
            <FootballMatchCard match={match} />
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 120,
    backgroundColor: 'transparent',
  },
  cardWrapper: {
    paddingHorizontal: 0, // No horizontal padding to match transfer cards
  },
  matchCard: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    height: 100,
    marginBottom: 8,
  },
  loadingContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  metaText: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    justifyContent: 'center',
    minHeight: 30,
  },
  centerTimeContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    left: '50%',
    transform: [{ translateX: -35 }],
    zIndex: 2,
  },
  leftTeamContainer: {
    position: 'absolute',
    right: '50%',
    marginRight: 50, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    minWidth: 80,
  },
  rightTeamContainer: {
    position: 'absolute',
    left: '50%',
    marginLeft: 50, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    minWidth: 80,
  },
  teamName: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 90,
  },
  crest: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
    marginHorizontal: 6,
  },
  scoreText: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: 'bold',
  },
  matchTime: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
