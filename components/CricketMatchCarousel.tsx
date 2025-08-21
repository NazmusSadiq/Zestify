import { useCricketData } from '@/app/(tabs)/sport/cricketdatafetcher';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useRef } from 'react';
import { Animated, AppState, Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
import { onGlobalScrollBeginDrag, onGlobalScrollEndDrag, registerCarousel, unregisterCarousel } from '../utils/carouselSync';

const { width } = Dimensions.get('window');

interface CricketMatchCarouselProps {
  cardWidth: number;
  cardMargin: number;
}

const CricketMatchCard = ({ match }: { match: any }) => {
  const team1 = match.teams?.[0] || 'Team 1';
  const team2 = match.teams?.[1] || 'Team 2';
  const matchType = match.matchType || match.matchtype || 'Match';
  const series = match.series;
  const status = match.status || 'Scheduled';
  const venue = match.venue;
  
  // Format date
  const matchDate = match.dateTimeGMT ? new Date(match.dateTimeGMT) : new Date();
  const dateString = matchDate.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
  const timeString = matchDate.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const isFinished = status?.toLowerCase().includes('finished') || 
                   status?.toLowerCase().includes('completed') ||
                   match.matchStarted === true;

  return (
    <View style={styles.matchCard}>
      <Text style={styles.metaText}>
        {matchType.toUpperCase()} - {dateString}
      </Text>
      <View style={styles.teamRow}>
        <View style={styles.leftTeamContainer}>
          <Text style={styles.teamName}>{team1}</Text>
        </View>
        
        <View style={styles.centerContainer}>
          {isFinished ? (
            <Text style={styles.scoreText}>
              {match.score || 'Finished'}
            </Text>
          ) : (
            <Text style={styles.matchTime}>{timeString}</Text>
          )}
          <Text style={styles.statusText}>{status}</Text>
        </View>
        
        <View style={styles.rightTeamContainer}>
          <Text style={styles.teamName}>{team2}</Text>
        </View>
      </View>
      {series && (
        <Text style={styles.seriesText} numberOfLines={1}>{series}</Text>
      )}
      {venue && (
        <Text style={styles.venueText} numberOfLines={1}>{venue}</Text>
      )}
    </View>
  );
};

let globalCricketHomeMatches: any[] = [];
let hasCricketGloballyFetched = false;
let globalCricketFetchPromise: Promise<void> | null = null;

export default function CricketMatchCarousel({ cardWidth, cardMargin }: CricketMatchCarouselProps) {
  const { homeMatches, loadingHome, fetchHomeMatches } = useCricketData();
  
  const matchCardWidth = width - 15; 
  const matchCardMargin = 0; 
  const matchCardWidthWithMargin = matchCardWidth;
  
  // Carousel state
  const scrollRef = useRef<ScrollView>(null);
  const scrollIndex = useRef<number>(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  
  // Local state for matches
  const [localMatches, setLocalMatches] = React.useState<any[]>(globalCricketHomeMatches);
  const [localLoading, setLocalLoading] = React.useState<boolean>(!hasCricketGloballyFetched);
  
  // Tab focus state
  const [isTabFocused, setIsTabFocused] = React.useState<boolean>(true);
  const [appStateVisible, setAppStateVisible] = React.useState<boolean>(AppState.currentState === 'active');

  // One-time global fetch function
  const performGlobalFetch = async () => {
    if (hasCricketGloballyFetched || globalCricketFetchPromise) {
      return globalCricketFetchPromise || Promise.resolve();
    }
    
    console.log("🏏 [Carousel] Starting global fetch for cricket matches...");
    setLocalLoading(true);
    
    globalCricketFetchPromise = fetchHomeMatches().then(() => {
      globalCricketHomeMatches = [...homeMatches];
      hasCricketGloballyFetched = true;
      setLocalMatches(globalCricketHomeMatches);
      setLocalLoading(false);
      console.log(`🏏 [Carousel] Global fetch completed. Cached ${globalCricketHomeMatches.length} matches permanently.`);
    }).catch((error) => {
      console.error("🏏 Global fetch failed:", error);
      setLocalLoading(false);
    });
    
    return globalCricketFetchPromise;
  };

  // One-time fetch when component first mounts
  useEffect(() => {
    if (!hasCricketGloballyFetched) {
      performGlobalFetch();
    } else {
      setLocalMatches(globalCricketHomeMatches);
      setLocalLoading(false);
    }
  }, []);

  // Update local matches when global homeMatches updates (only during initial fetch)
  useEffect(() => {
    if (hasCricketGloballyFetched && homeMatches.length > 0 && globalCricketHomeMatches.length === 0) {
      globalCricketHomeMatches = [...homeMatches];
      setLocalMatches(globalCricketHomeMatches);
    }
  }, [homeMatches]);

  // Tab focus detection
  useFocusEffect(
    React.useCallback(() => {
      console.log("🏏 Home tab focused - resuming carousel");
      setIsTabFocused(true);
      return () => {
        console.log("🏏 Home tab unfocused - pausing carousel");
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
      <View style={[styles.loadingContainer, { width: matchCardWidth, height: 140 }]}>
        <Text style={styles.loadingText}>Loading cricket matches...</Text>
      </View>
    );
  }

  if (localMatches.length === 0) {
    return (
      <View style={[styles.loadingContainer, { width: matchCardWidth, height: 140 }]}>
        <Text style={styles.loadingText}>No cricket matches available</Text>
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
          <View key={`${match.id || match.matchId || index}-${Math.floor(index / localMatches.length)}`} style={[styles.cardWrapper, { width: matchCardWidthWithMargin }]}>
            <CricketMatchCard match={match} />
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 140,
    backgroundColor: 'transparent',
  },
  cardWrapper: {
    paddingHorizontal: 0,
  },
  matchCard: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    height: 120,
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
    marginBottom: 6,
    textAlign: 'center',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  leftTeamContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  rightTeamContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  teamName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  scoreText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: 'bold',
  },
  matchTime: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusText: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
  seriesText: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  venueText: {
    color: '#64748b',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
});
