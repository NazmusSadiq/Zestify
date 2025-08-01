// --- Render Stats Tab ---
import { API_KEY, COMPETITIONS, MATCHES_COMPETITIONS, STATS_OPTIONS } from "@/services/fotball_API";
import { useUser } from "@clerk/clerk-expo";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { db } from "../../../firebase";
import SPORTS_DATA from "../../../sportsdata.json";

import { ActivityIndicator, Animated, Dimensions, Image, Modal, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { getTeamWithCrest, getWikipediaImageUrl, useFootballData } from "./footballdatafetcher";

// Transfer Card Component
const TransferCard = ({ transfer }: { transfer: any }) => {
  const [playerImage, setPlayerImage] = useState<string | null>(null);
  
  React.useEffect(() => {
    const fetchPlayerImage = async () => {
      if (transfer.playerName) {
        try {
          const imageUrl = await getWikipediaImageUrl(transfer.playerName);
          setPlayerImage(imageUrl);
        } catch (error) {
          setPlayerImage(null);
        }
      }
    };
    fetchPlayerImage();
  }, [transfer.playerName]);

  return (
    <View style={styles.transferCard}>
      <View style={styles.compactTransferHeader}>
        <Text style={styles.transferPlayerName}>{transfer.playerName}</Text>
        <Text style={styles.transferDate}>{transfer.date}</Text>
      </View>
      <View style={styles.compactTransferBody}>
        {playerImage && (
          <Image 
            source={{ uri: playerImage }} 
            style={styles.playerImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.compactTransferInfo}>
          <View style={styles.compactTransferTeams}>
            {/* Centered arrow */}
            <View style={styles.centerArrowContainer}>
              <Text style={styles.transferArrow}>→</Text>
            </View>
            
            {/* Left team - positioned at fixed distance from center */}
            <View style={styles.leftTransferTeamContainer}>
              <Text style={styles.transferTeamName}>{transfer.fromTeam}</Text>
              {transfer.fromTeamCrest && (
                <Image 
                  source={{ uri: transfer.fromTeamCrest }} 
                  style={styles.transferTeamCrest}
                  resizeMode="contain"
                />
              )}
            </View>
            
            {/* Right team - positioned at fixed distance from center */}
            <View style={styles.rightTransferTeamContainer}>
              {transfer.toTeamCrest && (
                <Image 
                  source={{ uri: transfer.toTeamCrest }} 
                  style={styles.transferTeamCrest}
                  resizeMode="contain"
                />
              )}
              <Text style={styles.transferTeamName}>{transfer.toTeam}</Text>
            </View>
          </View>
          
          {/* Transfer amount - positioned below the teams */}
          <View style={styles.transferAmountContainer}>
            <Text style={styles.transferAmount}>{transfer.amount}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const tabs = ["Main", "Matches", "Stats", "Favorite"];

export default function Football() {
  const [activeTab, setActiveTab] = useState<"Main" | "Matches" | "Stats" | "Favorite">("Main");
  const [statsLeftTrayOpen, setStatsLeftTrayOpen] = useState(false);
  const [matchesLeftTrayOpen, setMatchesLeftTrayOpen] = useState(false);
  const statsTrayAnim = useRef(new Animated.Value(-220)).current;
  const matchesTrayAnim = useRef(new Animated.Value(-220)).current;
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [allPlayerNames, setAllPlayerNames] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimeout = useRef<number | null>(null);

  // --- Slideshow State Variables ---
  const { width } = Dimensions.get("window");
  const transferScrollRef = useRef<ScrollView>(null);
  const transferScrollIndex = useRef(0);
  const isManualScrolling = useRef(false);
  const manualScrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transferScrollX = useRef(new Animated.Value(0)).current;
  
  // Transfer card dimensions
  const transferCardWidth = width -20; // Full width minus padding
  const transferCardMargin = 0; // No margin between cards now
  const transferCardWidthWithMargin = transferCardWidth;

  // --- Favorite Section Tabs ---
  const [favoriteTab, setFavoriteTab] = useState<'team' | 'player'>('team');
  // --- Favorite Player State ---
  const [favoritePlayer, setFavoritePlayer] = useState<any>(null);
  const [favoritePlayerId, setFavoritePlayerId] = useState<number | null>(null);
  const [loadingFavoritePlayer, setLoadingFavoritePlayer] = useState(false);
  const [nationalityFlag, setNationalityFlag] = useState<string | null>(null);

  // --- Match Subscription State ---
  const [subscribedMatches, setSubscribedMatches] = useState<Set<number>>(new Set());
  const [loadingSubscriptions, setLoadingSubscriptions] = useState<{ [key: number]: boolean }>({});
  const matchesScrollRef = useRef<ScrollView>(null);
  const shouldAutoScroll = useRef(true); 

  // Helper functions for player data processing
  const calculateAge = (dateOfBirth: string): number => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const extractFirstLastName = (fullName: string): { firstName: string; lastName: string } => {
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length === 1) {
      return { firstName: nameParts[0], lastName: "" };
    }
    return {
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' ')
    };
  };

  // Firebase user
  const { user } = useUser();

  // Fetch favoritePlayerId from Firebase on mount
  useEffect(() => {
    const fetchFavoritePlayerId = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) {
        setFavoritePlayerId(44); // fallback default
        return;
      }
      try {
        const userDocRef = doc(db, "users", user.primaryEmailAddress.emailAddress);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.favoritePlayerId) {
            setFavoritePlayerId(data.favoritePlayerId);
          } else {
            setFavoritePlayerId(44); // default if not found
          }
        } else {
          setFavoritePlayerId(44); // default if no doc
        }
      } catch (error) {
        setFavoritePlayerId(44); // fallback on error
      }
    };
    fetchFavoritePlayerId();
  }, [user?.primaryEmailAddress?.emailAddress]);

  // Save favoritePlayerId to Firebase when it changes
  useEffect(() => {
    const saveFavoritePlayerId = async () => {
      if (!user?.primaryEmailAddress?.emailAddress || !favoritePlayerId) return;
      try {
        const userDocRef = doc(db, "users", user.primaryEmailAddress.emailAddress);
        await setDoc(userDocRef, { favoritePlayerId }, { merge: true });
      } catch (error) {
        // Optionally show error
        // Alert.alert("Error", "Failed to save favorite player");
      }
    };
    if (favoritePlayerId) {
      saveFavoritePlayerId();
    }
  }, [favoritePlayerId, user?.primaryEmailAddress?.emailAddress]);

  // --- Match Subscription Functions ---
  // Fetch subscribed matches from Firebase on mount
  useEffect(() => {
    const fetchSubscribedMatches = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) {
        console.log("No user email, setting empty subscribed matches");
        setSubscribedMatches(new Set());
        return;
      }
      try {
        const userDocRef = doc(db, "users", user.primaryEmailAddress.emailAddress);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.subscribedMatches && Array.isArray(data.subscribedMatches)) {
            console.log("Loaded subscribed matches from Firebase:", data.subscribedMatches);
            setSubscribedMatches(new Set(data.subscribedMatches));
          } else {
            console.log("No subscribed matches found in Firebase");
            setSubscribedMatches(new Set());
          }
        } else {
          console.log("No user document found in Firebase");
          setSubscribedMatches(new Set());
        }
      } catch (error) {
        console.error("Error loading subscribed matches:", error);
        setSubscribedMatches(new Set());
      }
    };
    fetchSubscribedMatches();
  }, [user?.primaryEmailAddress?.emailAddress]);

  // Save subscribed matches to Firebase when they change
  const saveSubscribedMatches = async (matchIds: Set<number>) => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    try {
      const userDocRef = doc(db, "users", user.primaryEmailAddress.emailAddress);
      await setDoc(userDocRef, { subscribedMatches: Array.from(matchIds) }, { merge: true });
    } catch (error) {
      console.error("Error saving subscribed matches:", error);
    }
  };

  // Toggle match subscription
  const toggleMatchSubscription = async (matchId: number) => {
    if (!matchId) return;
    
    setLoadingSubscriptions(prev => ({ ...prev, [matchId]: true }));
    
    const newSubscribedMatches = new Set(subscribedMatches);
    const wasSubscribed = subscribedMatches.has(matchId);
    
    if (wasSubscribed) {
      newSubscribedMatches.delete(matchId);
      console.log(`Unsubscribed from match ${matchId}`);
      // If we're in subscribed section and unsubscribing, remove from current view immediately
      if (matchesCompetition.id === "SUBSCRIBED") {
        setMatchesData(prev => prev.filter(match => match.id !== matchId));
      }
    } else {
      newSubscribedMatches.add(matchId);
      console.log(`Subscribed to match ${matchId}`);
    }
    
    setSubscribedMatches(newSubscribedMatches);
    await saveSubscribedMatches(newSubscribedMatches);
    
    setLoadingSubscriptions(prev => ({ ...prev, [matchId]: false }));
  };

  // Fetch player data by id
  async function fetchFavoritePlayer(playerId: number) {
    setLoadingFavoritePlayer(true);
    try {
      const headers = new Headers();
      headers.append('X-Auth-Token', API_KEY!);
      const res = await fetch(`https://api.football-data.org/v4/persons/${playerId}`, {
        headers
      });
      const data = await res.json();
      // Try to fetch Wikipedia image
      let wikiImage = null;
      if (data?.name) {
        wikiImage = await getWikipediaImageUrl(data.name);
      }
      setFavoritePlayer({ ...data, wikiImage });
    } catch (err) {
      setFavoritePlayer(null);
    }
    setLoadingFavoritePlayer(false);
  }

  useEffect(() => {
    if (favoriteTab === 'player' && favoritePlayerId) {
      fetchFavoritePlayer(favoritePlayerId);
    }
  }, [favoriteTab, favoritePlayerId]);

  // Fetch nationality flag when favorite player changes
  useEffect(() => {
    const fetchNationalityFlag = async () => {
      if (favoritePlayer?.nationality) {
        try {
          const flagUrl = await getWikipediaImageUrl(`flag of ${favoritePlayer.nationality}`);
          setNationalityFlag(flagUrl);
        } catch (error) {
          setNationalityFlag(null);
        }
      } else {
        setNationalityFlag(null);
      }
    };

    fetchNationalityFlag();
  }, [favoritePlayer]);


  useEffect(() => {
    try {
      const playerNames = require("../../../player_names.json");
      setAllPlayerNames(playerNames);
    } catch (e) {
      setAllPlayerNames([]);
    }
  }, []);

  const onSearchInputChange = (query: string) => {
    setSearchQuery(query);
    if (favoriteTab === 'player') {
      if (!query || query.length < 2) {
        setSearchResults([]);
        return;
      }
      const lower = query.toLowerCase();
      const filtered = allPlayerNames.filter((p: any) => {
        if (!p || !p.name) return false;
        return (
          p.name.toLowerCase().includes(lower) ||
          (p.firstName && p.firstName.toLowerCase().includes(lower)) ||
          (p.lastName && p.lastName.toLowerCase().includes(lower))
        );
      });
      setSearchResults(filtered.slice(0, 10));
    } else {
      setSearchResults([]); // will be set by debounce effect
    }
  };

  const {
    statsCompetition, setStatsCompetition, statsOption, setStatsOption, statsData, loadingStats, fetchStatsData,
    matchesCompetition, setMatchesCompetition, matchesData, setMatchesData, loadingMatches, fetchMatchesData, homeMatches, loadingHome,
    fetchHomeMatches, fetchFootballHomeMatches, favoriteTeams, setFavoriteTeams, favoriteTeamsStats, loadingFavStats, fetchFavoriteStats, addFavoriteTeam, searchTeams
  } = useFootballData();

  useEffect(() => {
    if (activeTab === "Main") fetchFootballHomeMatches(); // Use football-specific function
    if (activeTab === "Stats") fetchStatsData();
    if (activeTab === "Matches") {
      if (matchesCompetition.id === "SUBSCRIBED") {
        // Only fetch subscribed matches if we have loaded them from Firebase
        // The actual fetching will happen in the separate useEffect below when subscribedMatches changes
        console.log("Switched to subscribed matches view - waiting for Firebase data");
      } else {
        fetchMatchesData();
      }
    }
    if (activeTab === "Favorite") fetchFavoriteStats();
  }, [activeTab, statsCompetition, statsOption, matchesCompetition, favoriteTeams]);

  // Separate effect for subscribed matches that only triggers when subscribedMatches changes
  useEffect(() => {
    if (activeTab === "Matches" && matchesCompetition.id === "SUBSCRIBED") {
      if (subscribedMatches.size > 0) {
        console.log("Fetching subscribed matches data:", Array.from(subscribedMatches));
        fetchMatchesData(Array.from(subscribedMatches));
      } else {
        console.log("No subscribed matches found");
        setMatchesData([]);
      }
    }
  }, [subscribedMatches, activeTab, matchesCompetition]);

  // Auto-scroll to relevant matches when competition changes (not on subscription toggle)
  useEffect(() => {
    if (activeTab === "Matches" && matchesData.length > 0 && shouldAutoScroll.current && matchesCompetition.id !== "SUBSCRIBED") {
      setTimeout(() => {
        if (matchesScrollRef.current) {
          // Find the earliest upcoming match (next match by date)
          const now = new Date();
          const upcomingMatches = matchesData
            .map((match, idx) => ({ match, idx }))
            .filter(({ match }) => {
              const matchDate = new Date(match.utcDate);
              const upcomingStatuses = ["SCHEDULED", "TIMED", "POSTPONED"];
              return upcomingStatuses.includes(match.status) && matchDate > now;
            })
            .sort((a, b) => new Date(a.match.utcDate).getTime() - new Date(b.match.utcDate).getTime());
          
          if (upcomingMatches.length > 0) {
            const earliestUpcomingIndex = upcomingMatches[0].idx;
            matchesScrollRef.current.scrollTo({ y: earliestUpcomingIndex * 110, animated: true });
          } else {
            const finishedIndices = matchesData
              .map((match, idx) => (match.status === "FINISHED" ? idx : -1))
              .filter(idx => idx !== -1);
            if (finishedIndices.length > 0) {
              const lastFinishedIndex = finishedIndices[finishedIndices.length - 1];
              matchesScrollRef.current.scrollTo({ y: lastFinishedIndex * 110, animated: true });
            }
          }
        }
        shouldAutoScroll.current = false; // Prevent auto-scroll until next competition change
      }, 100);
    }
  }, [matchesData, activeTab]);

  // Reset auto-scroll flag when competition changes
  useEffect(() => {
    shouldAutoScroll.current = true;
  }, [matchesCompetition]);

  useEffect(() => {
    if (favoriteTab === 'player') return; // handled in onSearchInputChange
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      const teams = await searchTeams(searchQuery);
      setSearchResults(teams);
      setIsSearching(false);
    }, 500);
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchQuery, favoriteTab]);

  // --- Transfer Slideshow Effects ---
  useEffect(() => {
    const transfers = (SPORTS_DATA as any).football?.transfers || [];
    if (transfers.length > 0 && transferScrollRef.current) {
      // Start from the middle set of transfers
      const offset = transfers.length * transferCardWidthWithMargin;
      transferScrollRef.current.scrollTo({ x: offset, animated: false });
      transferScrollIndex.current = transfers.length;
    }
  }, []);

  useEffect(() => {
    const transfers = (SPORTS_DATA as any).football?.transfers || [];
    if (transfers.length === 0) return;

    const interval = setInterval(() => {
      if (isManualScrolling.current) return;

      transferScrollIndex.current++;

      // Reset to middle when reaching the end
      if (transferScrollIndex.current >= transfers.length * 2) {
        transferScrollIndex.current = transfers.length;
        transferScrollRef.current?.scrollTo({
          x: transfers.length * transferCardWidthWithMargin,
          animated: false,
        });
      }

      transferScrollRef.current?.scrollTo({
        x: transferScrollIndex.current * transferCardWidthWithMargin,
        animated: true,
      });
    }, 3000); // Auto-scroll every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Handle manual scrolling
  const onTransferScrollBeginDrag = () => {
    isManualScrolling.current = true;
    if (manualScrollTimeout.current) {
      clearTimeout(manualScrollTimeout.current);
      manualScrollTimeout.current = null;
    }
  };

  const onTransferScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(offsetX / transferCardWidthWithMargin);
    transferScrollIndex.current = currentIndex;

    manualScrollTimeout.current = setTimeout(() => {
      isManualScrolling.current = false;
    }, 2000);
  };


  const renderHome = () => (
    <View style={styles.tabContent}>
      {loadingHome ? (
        <ActivityIndicator size="large" color="#3B82F6" />
      ) : homeMatches.length === 0 ? (
        <Text style={styles.noDataText}>No matches found</Text>
      ) : (
        <ScrollView style={styles.scrollContainer}>
          {/* Matches Section */}
          {homeMatches.map((match: any) => {
            const { homeTeam, awayTeam, score, utcDate, status, competition, matchday } = match;
            const home = getTeamWithCrest(homeTeam);
            const away = getTeamWithCrest(awayTeam);
            const matchDate = new Date(utcDate);
            matchDate.setHours(matchDate.getHours() + 6);
            const timeString = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateString = matchDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const isPlayed = status === "FINISHED" || status === "IN_PLAY" || status === "PAUSED";
            return (
              <View key={match.id} style={styles.homeMatchCard}>
                <View style={styles.matchHeader}>
                  <Text style={styles.metaText}>
                    {(competition?.name === "Primera Division" ? "La Liga" : competition?.name) ?? 'Unknown'} - R{matchday} - {dateString}
                  </Text>
                  
                  {/* Bell subscription button */}
                  <TouchableOpacity
                    style={styles.bellButton}
                    onPress={() => toggleMatchSubscription(match.id)}
                    disabled={loadingSubscriptions[match.id]}
                  >
                    <Text style={[
                      styles.bellIcon, 
                      subscribedMatches.has(match.id) && styles.bellIconSubscribed,
                      loadingSubscriptions[match.id] && styles.bellIconLoading
                    ]}>
                      {subscribedMatches.has(match.id) ? '🔔' : '🔕'}
                    </Text>
                  </TouchableOpacity>
                </View>
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
                    <Text style={styles.teamName}>{home.name}</Text>
                    {home.crest && <Image source={{ uri: home.crest }} style={styles.crest} />}
                  </View>
                  
                  {/* Right team - positioned at fixed distance from center */}
                  <View style={styles.rightTeamContainer}>
                    {away.crest && <Image source={{ uri: away.crest }} style={styles.crest} />}
                    <Text style={styles.teamName}>{away.name}</Text>
                  </View>
                </View>
              </View>
            );
          })}

          {/* Latest Transfers Section */}
          <View style={[styles.sectionContainer, { marginTop: 2 }]}>
            <Text style={styles.sectionTitle}>Latest Transfers</Text>
            <Animated.ScrollView
              ref={transferScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.transferScrollContainer}
              scrollEventThrottle={16}
              snapToInterval={transferCardWidthWithMargin}
              decelerationRate="fast"
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: transferScrollX } } }],
                { useNativeDriver: false }
              )}
              onScrollBeginDrag={onTransferScrollBeginDrag}
              onScrollEndDrag={onTransferScrollEndDrag}
            >
              {(() => {
                const transfers = (SPORTS_DATA as any).football?.transfers || [];
                const tripledTransfers = [...transfers, ...transfers, ...transfers];
                
                return tripledTransfers.map((transfer, index) => (
                  <View
                    key={`${transfer.id}_${index}`}
                    style={[styles.transferCardWrapper, { width: transferCardWidth }]}
                  >
                    <TransferCard transfer={transfer} />
                  </View>
                ));
              })()}
            </Animated.ScrollView>
          </View>

          {/* Latest Updates Section */}
          <View style={[styles.sectionContainer, { marginTop: -20, marginBottom: 20 }]}>
            <Text style={styles.sectionTitle}>Latest Updates</Text>
            <ScrollView style={styles.updatesBox} showsVerticalScrollIndicator={false}>
              {(SPORTS_DATA as any).football?.headlines?.map((headline: any) => (
                <Text key={headline.id} style={styles.updateTitle}>
                  {headline.title}
                </Text>
              )) || []}
            </ScrollView>
          </View>
        </ScrollView>
      )}
    </View>
  );

  const renderMatches = () => (
    <View style={styles.matchesContainer}>
      <Modal
        visible={matchesLeftTrayOpen}
        transparent={true}
        animationType="none"
        onRequestClose={() => setMatchesLeftTrayOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => {
          Animated.timing(matchesTrayAnim, {
            toValue: -220,
            duration: 250,
            useNativeDriver: false,
          }).start(() => setMatchesLeftTrayOpen(false));
        }}>
          <View style={styles.outlayOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View style={[styles.outlayTray, { transform: [{ translateX: matchesTrayAnim }] }]}>
                <Text style={styles.sectionTitle}>Competitions</Text>
                <View>
                  {MATCHES_COMPETITIONS.map((comp) => (
                    <TouchableOpacity
                      key={comp.id}
                      onPress={() => setMatchesCompetition(comp)}
                      style={[
                        styles.competitionButton,
                        matchesCompetition.id === comp.id && styles.activeCompetitionButton
                      ]}
                    >
                      <Text style={[
                        styles.tabText,
                        matchesCompetition.id === comp.id && styles.activeTabText
                      ]}>
                        {comp.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <View style={styles.matchesContent}>
        {loadingMatches ? (
          <ActivityIndicator size="large" color="#3B82F6" />
        ) : matchesData.length === 0 ? (
          <Text style={styles.noDataText}>No matches found</Text>
        ) : (
          <ScrollView
            style={styles.scrollContainer}
            ref={matchesScrollRef}
          >
            {matchesData.map((match: any) => {
              const { homeTeam, awayTeam, score, utcDate, status, competition, matchday } = match;

              const home = getTeamWithCrest(homeTeam);
              const away = getTeamWithCrest(awayTeam);

              const matchDate = new Date(utcDate);
              matchDate.setHours(matchDate.getHours() + 6);
              const timeString = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const dateString = matchDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
              const isPlayed = status === "FINISHED" || status === "IN_PLAY" || status === "PAUSED";

              return (
                <View key={match.id} style={styles.matchCard}>
                  <View style={styles.matchHeader}>
                    <Text style={styles.metaText}>
                      {(competition?.name === "Primera Division" ? "La Liga" : competition?.name) ?? 'Unknown'} - R{matchday} - {dateString}
                    </Text>
                    
                    {/* Bell subscription button */}
                    <TouchableOpacity
                      style={styles.bellButton}
                      onPress={() => toggleMatchSubscription(match.id)}
                      disabled={loadingSubscriptions[match.id]}
                    >
                      <Text style={[
                        styles.bellIcon, 
                        subscribedMatches.has(match.id) && styles.bellIconSubscribed,
                        loadingSubscriptions[match.id] && styles.bellIconLoading
                      ]}>
                        {subscribedMatches.has(match.id) ? '🔔' : '🔕'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.teamRow}>
                    {/* Centered time/score */}
                    <View style={styles.centerTimeContainer}>
                      {isPlayed ? (
                        <Text style={styles.scoreText}>
                          {score.fullTime.home ?? '-'} - {score.fullTime.away ?? '-'}
                        </Text>
                      ) : (
                        <Text style={styles.matchTime}>{timeString}</Text>
                      )}
                    </View>
                    
                    {/* Left team - positioned at fixed distance from center */}
                    <View style={styles.leftTeamContainer}>
                      <Text style={styles.teamName}>{home.name}</Text>
                      {home.crest && <Image source={{ uri: home.crest }} style={styles.crest} />}
                    </View>
                    
                    {/* Right team - positioned at fixed distance from center */}
                    <View style={styles.rightTeamContainer}>
                      {away.crest && <Image source={{ uri: away.crest }} style={styles.crest} />}
                      <Text style={styles.teamName}>{away.name}</Text>
                    </View>
                  </View>

                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <Modal
        visible={statsLeftTrayOpen}
        transparent={true}
        animationType="none"
        onRequestClose={() => setStatsLeftTrayOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => {
          Animated.timing(statsTrayAnim, {
            toValue: -220,
            duration: 250,
            useNativeDriver: false,
          }).start(() => setStatsLeftTrayOpen(false));
        }}>
          <View style={styles.outlayOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View style={[styles.outlayTray, { transform: [{ translateX: statsTrayAnim }] }]}> 
                <Text style={styles.sectionTitle}>Competitions</Text>
                <View>
                  {COMPETITIONS.map((comp) => (
                    <TouchableOpacity
                      key={comp.id}
                      onPress={() => setStatsCompetition(comp)}
                      style={[
                        styles.competitionButton,
                        statsCompetition.id === comp.id && styles.activeCompetitionButton
                      ]}
                    >
                      <Text style={[
                        styles.tabText,
                        statsCompetition.id === comp.id && styles.activeTabText
                      ]}>
                        {comp.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionTitle}>Options</Text>
                <View>
                  {STATS_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => setStatsOption(opt)}
                      style={[
                        styles.optionButton,
                        statsOption === opt && styles.activeOptionButton
                      ]}
                    >
                      <Text style={[
                        styles.tabText,
                        statsOption === opt && styles.activeTabText
                      ]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <View style={styles.statsContent}>
        {loadingStats ? (
          <ActivityIndicator size="large" color="#3B82F6" />
        ) : statsData ? (
          <ScrollView style={styles.scrollContainer}>
            <Text style={styles.statsHeader}>
              {statsCompetition.name} - {statsOption}
            </Text>

            {statsOption === "Standings" && (
              <View style={styles.table}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableHeader}></Text>
                  <Text style={[styles.tableHeader, { flex: 7 }]}>Team</Text>
                  <Text style={styles.tableHeader}>P</Text>
                  <Text style={styles.tableHeader}>W</Text>
                  <Text style={styles.tableHeader}>D</Text>
                  <Text style={styles.tableHeader}>L</Text>
                  <Text style={[styles.tableHeader, { flex: 2 }]}>GF/A</Text>
                  <Text style={[styles.tableHeader, { flex: 1.25 }]}>Pts</Text>
                </View>
                {statsData.map((item: any, index: number) => {
                  const key = item?.team?.id ?? item.position ?? index;
                  return (
                    <View key={key} style={styles.tableRow}>
                      <Text style={styles.tableCell}>{item.position ?? "-"}</Text>
                      <View style={{ flex: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
                        {item.team?.crest && (
                          <Image
                            source={{ uri: item.team.crest }}
                            style={{ width: 15, height: 15, marginRight: 4 }}
                            resizeMode="contain"
                          />
                        )}
                        <Text style={{ color: 'white', textAlign: 'left', paddingLeft: 0, marginLeft: 5, flexShrink: 1, fontSize: 12 }}>
                          {getTeamWithCrest(item.team).name}
                        </Text>
                      </View>

                      <Text style={styles.tableCell}>{item.played ?? "-"}</Text>
                      <Text style={styles.tableCell}>{item.wins ?? "-"}</Text>
                      <Text style={styles.tableCell}>{item.draws ?? "-"}</Text>
                      <Text style={styles.tableCell}>{item.losses ?? "-"}</Text>
                      <Text style={[styles.tableCell, { flex: 3 }]}>
                        {item.goalsFor ?? "-"} / {item.goalsAgainst ?? "-"}
                      </Text>
                      <Text style={styles.tableCell}>{item.points ?? "-"}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {statsOption === "Team Stats" && (
              statsData
                .slice()
                .sort((a: any, b: any) => {
                  const nameA = (a.name ?? "").toLowerCase();
                  const nameB = (b.name ?? "").toLowerCase();
                  return nameA.localeCompare(nameB);
                })
                .map((team: any, index: number) => {
                  const key = team?.id ?? team?.name ?? index;

                  return (
                    <View key={key} style={styles.teamCard}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        {team.crest ? (
                          <Image
                            source={{ uri: team.crest }}
                            style={{ width: 30, height: 30, marginRight: 8 }}
                            resizeMode="contain"
                          />
                        ) : null}
                        <Text style={styles.teamName}>{team.name ?? "N/A"}</Text>
                      </View>
                      <Text style={styles.teamDetail}>Venue: {team.venue ?? "N/A"}</Text>
                      <Text style={styles.teamDetail}>Matches: {team.played ?? "N/A"}</Text>
                      <Text style={styles.teamDetail}>Wins: {team.wins ?? "N/A"}</Text>
                      <Text style={styles.teamDetail}>Draws: {team.draws ?? "N/A"}</Text>
                      <Text style={styles.teamDetail}>Losses: {team.losses ?? "N/A"}</Text>
                      <Text style={styles.teamDetail}>Goals Scored: {team.goalsScored ?? "N/A"}</Text>
                      <Text style={styles.teamDetail}>Goals Conceded: {team.goalsConceded ?? "N/A"}</Text>
                    </View>
                  );
                })
            )}

            {statsOption === "Top Scorer" && (
              <View style={styles.table}>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableHeader, { flex: 2 }]}>Player</Text>
                  <Text style={[styles.tableHeader, { flex: 3 }]}>Team</Text>
                  <Text style={styles.tableHeader}>Goals</Text>
                </View>
                {statsData.map((player: any, index: number) => {
                  const key = player?.id ?? player?.name ?? index;

                  return (
                    <View key={key} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{player.name ?? "N/A"}</Text>
                      <View style={[styles.tableCell, { flex: 3, flexDirection: 'row', alignItems: 'center' }]}>
                        {player.crest ? (
                          <Image
                            source={{ uri: player.crest }}
                            style={{ width: 20, height: 20, marginRight: 6 }}
                            resizeMode="contain"
                          />
                        ) : null}
                        <Text style={styles.tableCell}>{typeof player.team === 'string' ? player.team : player.team?.name ?? "N/A"}</Text>
                      </View>
                      <Text style={styles.tableCell}>{player.goals ?? "-"}</Text>
                    </View>
                  );
                })}
              </View>
            )}

          </ScrollView>
        ) : (
          <Text style={styles.noDataText}>No stats data available</Text>
        )}
      </View>
    </View>
  );

  const selectPlayer = async (player: any) => {
    setShowSearchModal(false);
    setSearchQuery("");
    setFavoritePlayerId(player.id);
    // favoritePlayerId will be saved to Firebase by the useEffect above
  };

  const selectTeam = (team: any) => {
    setFavoriteTeams([{ id: team.id, name: team.name }]);
    setShowSearchModal(false);
    setSearchQuery("");
  };

  const favoriteTeamName = favoriteTeams[0]?.name;
  const favoriteTeamStats = favoriteTeamsStats?.[favoriteTeamName ?? ""];

  const renderFavorite = () => (
    <View style={styles.tabContent}>
      {/* Tabs for Team/Player with Add/Change button on the right */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
        <TouchableOpacity
          style={[styles.favoriteTabButton, favoriteTab === 'team' && styles.activeFavoriteTabButton]}
          onPress={() => setFavoriteTab('team')}
        >
          <Text style={[styles.favoriteTabText, favoriteTab === 'team' && styles.activeFavoriteTabText]}>Team</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.favoriteTabButton, favoriteTab === 'player' && styles.activeFavoriteTabButton]}
          onPress={() => setFavoriteTab('player')}
        >
          <Text style={[styles.favoriteTabText, favoriteTab === 'player' && styles.activeFavoriteTabText]}>Player</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setSearchQuery("");
            setSearchResults([]);
            setShowSearchModal(true);
          }}
          style={[styles.addFavoriteBtn, { marginLeft: 12 }]}
        >
          <Text style={styles.addButtonText}>
            {favoriteTeams.length > 0 ? (favoriteTab === 'team' ? 'Change Team' : 'Change Player') : (favoriteTab === 'team' ? 'Add Team' : 'Add Player')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {favoriteTab === 'team' ? (
          !favoriteTeamName || !favoriteTeamStats?.details ? (
            <Text style={styles.noDataText}>
              Loading team info or no favorite team selected.
            </Text>
          ) : (
            <View style={styles.favoriteTeamCard}>
              <Image
                source={{ uri: favoriteTeamStats.details.crest || "" }}
                style={{ width: 80, height: 80, marginBottom: 10 }}
                resizeMode="contain"
              />
              <Text style={styles.teamName}>
                {favoriteTeamStats.details.name || "N/A"}
              </Text>
              <Text style={styles.teamDetail}>
                Founded: {favoriteTeamStats.details.founded ?? "N/A"}
              </Text>
              <Text style={styles.teamDetail}>
                Address: {favoriteTeamStats.details.address || "N/A"}
              </Text>
              <Text style={styles.teamDetail}>
                Venue: {favoriteTeamStats.details.venue || "N/A"}
              </Text>
              <Text style={styles.teamDetail}>
                Coach: {favoriteTeamStats.details.coach || "N/A"}
              </Text>

              <Text style={[styles.teamDetail, { marginTop: 10 }]}>
                Competitions:
              </Text>
              {(favoriteTeamStats.details.competitions ?? []).map(
                (comp: string, index: number) => {
                  const displayName = comp === "Primera Division" ? "La Liga" : comp;
                  return (
                    <Text key={index} style={styles.teamDetail}>
                      • {displayName}
                    </Text>
                  );
                }
              )}

              <Text style={[styles.teamDetail, { marginTop: 10 }]}>Squad:</Text>
              {(favoriteTeamStats.details.squad ?? []).map(
                (player: string, index: number) => (
                  <Text key={index} style={styles.teamDetail}>
                    • {player}
                  </Text>
                )
              )}
            </View>
          )
        ) : (
          loadingFavoritePlayer ? (
            <Text style={styles.noDataText}>Loading player info...</Text>
          ) : !favoritePlayer ? (
            <Text style={styles.noDataText}>No favorite player selected.</Text>
          ) : (
            <View style={styles.favoriteTeamCard}>
              <Image
                source={{ uri: favoritePlayer.wikiImage || favoritePlayer.currentTeam?.crest || "https://crests.football-data.org/66.png" }}
                style={{ width: 120, height: 120, borderRadius: 60, marginBottom: 10 }}
                resizeMode="cover"
              />
              <Text style={styles.teamName}>{favoritePlayer.name || "N/A"}</Text>
              <Text style={styles.teamDetail}>First Name: {extractFirstLastName(favoritePlayer.name || "").firstName || "N/A"}</Text>
              <Text style={styles.teamDetail}>Last Name: {extractFirstLastName(favoritePlayer.name || "").lastName || "N/A"}</Text>
              <Text style={styles.teamDetail}>Age: {calculateAge(favoritePlayer.dateOfBirth)} years</Text>

              {/* Nationality with flag */}
              <View style={styles.countryContainer}>
                <Text style={styles.teamDetail}>Nationality: {favoritePlayer.nationality || "N/A"}</Text>
                {nationalityFlag && (
                  <Image
                    source={{ uri: nationalityFlag }}
                    style={styles.countryFlag}
                  />
                )}
              </View>
              
              <Text style={styles.teamDetail}>Position: {favoritePlayer.position || "N/A"}</Text>
              <Text style={styles.teamDetail}>Jersey Number: {favoritePlayer.shirtNumber ?? "N/A"}</Text>
              <Text style={styles.teamDetail}>Date of Birth: {favoritePlayer.dateOfBirth || "N/A"}</Text>
              
              {/* Current Club with crest */}
              <View style={styles.countryContainer}>
                <Text style={styles.teamDetail}>Current Club: {favoritePlayer.currentTeam?.name || "N/A"}</Text>
                {favoritePlayer.currentTeam?.crest && (
                  <Image
                    source={{ uri: favoritePlayer.currentTeam.crest }}
                    style={styles.clubCrest}
                  />
                )}
              </View>
              
              <Text style={styles.teamDetail}>Contract: {favoritePlayer.currentTeam?.contract?.start || "N/A"} - {favoritePlayer.currentTeam?.contract?.until || "N/A"}</Text>
              <Text style={[styles.teamDetail, { marginTop: 10 }]}>Competitions:</Text>
              {(favoritePlayer.currentTeam?.runningCompetitions ?? []).map(
                (comp: any, index: number) => {
                  const displayName = comp.name === "Primera Division" ? "La Liga" : comp.name;
                  return (
                    <Text key={index} style={styles.teamDetail}>
                      • {displayName}
                    </Text>
                  );
                }
              )}
            </View>
          )
        )}
      </ScrollView>

      <Modal visible={showSearchModal} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={favoriteTab === 'team' ? 'Search for a team' : 'Search for a player'}
              placeholderTextColor="gray"
              value={searchQuery}
              onChangeText={onSearchInputChange}
              autoFocus={true}
            />
            <TouchableOpacity
              onPress={() => setShowSearchModal(false)}
              style={styles.closeModalButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {isSearching ? (
            <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
          ) : searchResults.length === 0 && searchQuery.length > 1 ? (
            <Text style={styles.noResultsText}>No {favoriteTab === 'team' ? 'teams' : 'players'} found</Text>
          ) : (
            <ScrollView style={styles.searchResults}>
              {favoriteTab === 'player'
                ? searchResults.map((player) => (
                  <TouchableOpacity
                    key={`${player.id}-${player.name}`}
                    onPress={() => selectPlayer(player)}
                    style={styles.searchResultItem}
                  >
                    <Text style={styles.noDataText}>{player.name}</Text>
                  </TouchableOpacity>
                ))
                : searchResults.map((team) => (
                  <TouchableOpacity
                    key={`${team.id}-${team.name}`}
                    onPress={() => selectTeam(team)}
                    style={styles.searchResultItem}
                  >
                    <Text style={styles.noDataText}>{team.name}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
  // --- Favorite Section Tab Styles ---
  const favoriteTabStyles = {
    favoriteTabButton: {
      flex: 1,
      paddingVertical: 8,
      backgroundColor: '#1B2631',
      borderRadius: 8,
      marginHorizontal: 4,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#334155',
    },
    activeFavoriteTabButton: {
      backgroundColor: '#fff',
      borderColor: '#fff',
    },
    favoriteTabText: {
      color: '#e2e8f0',
      fontWeight: '500',
      fontSize: 14,
    },
    activeFavoriteTabText: {
      color: '#000',
      fontWeight: '700',
    },
  };
  Object.assign(styles, favoriteTabStyles);


  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexGrow: 1 }}>
          {/* Show three lines button only for Stats or Matches tab, now on the left */}
          {(activeTab === 'Stats' || activeTab === 'Matches') && (
            <TouchableOpacity
              style={[styles.openTrayButton, { position: 'relative', left: 0, right: 0, marginLeft: 8, marginRight: 8 }]}
              onPress={() => {
                if (activeTab === 'Stats') {
                  setStatsLeftTrayOpen(true);
                  Animated.timing(statsTrayAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: false,
                  }).start();
                } else if (activeTab === 'Matches') {
                  setMatchesLeftTrayOpen(true);
                  Animated.timing(matchesTrayAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: false,
                  }).start();
                }
              }}
            >
              <Text style={styles.openButtonText}>☰</Text>
            </TouchableOpacity>
          )}
          {/* Tabs */}
          <View style={{ flexDirection: 'row', flex: 1 }}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab as any)}
                style={[
                  styles.tabButton,
                  activeTab === tab && styles.activeTabButton,
                  // Stretch tabs if three lines button is hidden
                  (activeTab !== 'Stats' && activeTab !== 'Matches') && { flex: 1, minWidth: undefined }
                ]}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText
                ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {activeTab === "Main" && renderHome()}
        {activeTab === "Stats" && renderStats()}
        {activeTab === "Matches" && renderMatches()}
        {activeTab === "Favorite" && renderFavorite()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  favoriteTabButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#1B2631',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeFavoriteTabButton: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  favoriteTabText: {
    color: '#e2e8f0',
    fontWeight: '500',
    fontSize: 14,
  },
  activeFavoriteTabText: {
    color: '#000',
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
    height: '92%',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    paddingVertical: 8,
    marginTop: -10,
    backgroundColor: '#000',
  },
  tabButton: {
    minWidth: 70,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1B2631',
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  tabText: {
    color: '#e2e8f0',
    fontWeight: '500',
    fontSize: 12,
  },
  activeTabText: {
    color: '#000',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    backgroundColor: '#1B2631',
    padding: 0,
    height: '92%',
  },
  tabContent: {
    flex: 1,
    padding: 10,
    height: '92%',
  },
  scrollContainer: {
    flex: 1,
    height: '92%',

  },
  noDataText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  matchCard: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  homeMatchCard: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  matchTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  matchDetail: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  metaText: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 8,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bellButton: {
    padding: 4,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    fontSize: 16,
    opacity: 0.6,
  },
  bellIconSubscribed: {
    opacity: 1,
    color: '#22c55e', // Green color for subscribed
  },
  bellIconLoading: {
    opacity: 0.3,
  },

  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    justifyContent: 'center',
    minHeight: 40, // Ensure enough space for positioning
  },

  centerTimeContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    left: '50%',
    transform: [{ translateX: -30 }], // Adjust based on expected width of time/score
    zIndex: 2,
  },

  leftTeamContainer: {
    position: 'absolute',
    right: '50%',
    marginRight: 40, 
    alignItems: 'center',
    flexDirection: 'row',
  },

  rightTeamContainer: {
    position: 'absolute',
    left: '50%',
    marginLeft: 40, 
    alignItems: 'center',
    flexDirection: 'row',
  },

  teamContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },

  crest: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    marginHorizontal: 6,
    transform: [{ translateY: -3 }],
  },

  favoriteTeamCard: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1B2631',
    padding: 15,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#0f172a',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
  },
  closeModalButton: {
    backgroundColor: '#ef4444',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResults: {
    flex: 1,
  },
  searchResultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  loader: {
    marginTop: 20,
  },
  noResultsText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  scoreText: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: 'bold',
    transform: [{ translateY: -3 }],
  },

  matchTime: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: 'bold',
    transform: [{ translateY: -3 }],
  },

  eventsContainer: {
    marginTop: 10,
  },

  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1B2631',
    height: '92%',
  },
  matchesContainer: {
    flex: 1,
    flexDirection: 'row',
    height: '92%',
  },
  leftTray: {
    width: 130,
    height: '92%',
    backgroundColor: '#0d1b2a',
    borderRightWidth: 1,
    borderColor: '#1e293b',
    position: 'relative',
  },
  sectionTitle: {
    color: '#FF0000',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 6,
    marginTop: 5,
    textAlign: 'center',
    alignSelf: 'center',
  },
  competitionButton: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCompetitionButton: {
    backgroundColor: '#fff',
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeOptionButton: {
    backgroundColor: '#fff',
  },
  statsContent: {
    flex: 1,
    padding: 5,
    height: '92%',
  },
  matchesContent: {
    flex: 1,
    padding: 5,
    height: '92%',
  },
  statsHeader: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 15,
    textAlign: 'center',
    marginVertical: 10,
  },
  statsData: {
    color: '#cbd5e1',
    fontSize: 14,
    height: '92%',
  },
  favoriteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addFavoriteBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  teamCard: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  teamName: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    maxWidth: 150,
    textAlign: 'left',
    flexWrap: 'wrap',
  },
  teamStats: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  openTrayButton: {
    position: 'absolute',
    top: 0,
    left: 5,
    zIndex: 10,
    backgroundColor: '#fff',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',

  },
  openButtonText: {
    color: '#000',
    fontSize: 15,
  },
  closeButton: {
    position: 'absolute',
    bottom: 10,
    left: '50%',
    transform: [{ translateX: -17 }],
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },

  closeButtonText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: '700',
    lineHeight: 30,
    marginTop: -5,
  },
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },
  tableHeader: {
    flex: 1,
    padding: 5,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    backgroundColor: '#1e293b',
    fontSize: 12,
  },
  tableCell: {
    flex: 1,
    padding: 5,
    color: '#cbd5e1',
    textAlign: 'center',
    fontSize: 12,
  },
  teamDetail: {
    color: '#cbd5e1',
    fontSize: 14,
    marginBottom: 4,
  },
  outlayOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  outlayTray: {
    width: 200,
    backgroundColor: '#1B2631',
    padding: 16,
    paddingTop: 40,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  // New styles for Latest Transfers and Updates sections
  sectionContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  transferCard: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 8,
  },
  transferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transferPlayerName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  transferDate: {
    color: '#94a3b8',
    fontSize: 12,
  },
  transferDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  transferTeam: {
    flex: 1,
    alignItems: 'center',
  },
  transferFromTo: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  transferTeamName: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 90,
    textAlign: 'center',
  },
  transferArrow: {
    color: '#3B82F6',
    fontSize: 20,
    fontWeight: 'bold',
  },
  transferAmount: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 150, 
  },
  transferAmountContainer: {
    alignItems: 'center',
    marginTop: 1,
    width: '100%',
  },
  // Compact Transfer Card Styles
  compactTransferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactTransferBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#1e293b',
    marginTop: -6,
  },
  compactTransferInfo: {
    flex: 1,
  },
  compactTransferTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    justifyContent: 'center',
    minHeight: 30, // Ensure enough space for positioning
  },
  centerArrowContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    left: '50%',
    transform: [{ translateX: -10 }], // Adjust based on arrow width
    zIndex: 2,
  },
  leftTransferTeamContainer: {
    position: 'absolute',
    right: '50%',
    marginRight: 25, // Fixed distance from center
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align items to the right edge
    minWidth: 80, // Ensure consistent container width
  },
  rightTransferTeamContainer: {
    position: 'absolute',
    left: '50%',
    marginLeft: 25, // Fixed distance from center
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align items to the right edge
    minWidth: 80, // Ensure consistent container width
  },
  transferTeamContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  transferTeamCrest: {
    width: 26,
    height: 26,
    marginLeft: 6, // Fixed gap between team name and crest
  },
  updatesContainer: {
    marginTop: 4,
  },
  updatesBox: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 4,
    marginBottom: 40,
  },
  updateCard: {
    backgroundColor: '#1e293b',
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  updateTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 18,
  },
  updateContent: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  updateTime: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'right',
  },
  transferScrollContainer: {
    height: 120,
    marginBottom: 12,
  },
  transferCardWrapper: {
    // No padding or margins - takes full width
  },
  countryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  countryFlag: {
    width: 20,
    height: 15,
    marginLeft: 8,
    resizeMode: 'contain',
  },
  clubCrest: {
    width: 20,
    height: 20,
    marginLeft: 8,
    resizeMode: 'contain',
  },
});