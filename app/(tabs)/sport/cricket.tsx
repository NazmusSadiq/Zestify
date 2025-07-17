import { useUser } from "@clerk/clerk-expo";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { db } from "../../../firebase";
import SPORTS_DATA from "../../../sportsdata.json";
import { useCricketData } from "./cricketdatafetcher";

// Helper function to get team stats by name
const getTeamStatsFromJSON = (teamName: string) => {
  const normalizedName = teamName.toLowerCase().replace(/\s+/g, " ").trim();
  const cricketTeam = SPORTS_DATA.cricket[normalizedName as keyof typeof SPORTS_DATA.cricket];
  // Make sure we're getting a cricket team and not the football section
  if (cricketTeam && typeof cricketTeam === 'object' && 'odi' in cricketTeam) {
    return cricketTeam;
  }
  return null;
};

// Helper function to calculate win percentage

const TABS = ["Series", "Matches", "Teams", "Players"];
const CRICKET_COUNTRIES = Object.keys((SPORTS_DATA as any).cricket);
const MATCH_CATEGORIES = [
  "All Matches",
  "Current Matches",
  "Upcoming Matches",
  "International Matches",
  "Test",
  "ODI",
  "T20"
];



export default function Cricket() {
  const [activeTab, setActiveTab] = useState("Matches");
  const [matchesLeftTrayOpen, setMatchesLeftTrayOpen] = useState(false);
  const matchesTrayAnim = useRef(new Animated.Value(-220)).current;
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [matchDetail, setMatchDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<any>(null);
  const [seriesDetail, setSeriesDetail] = useState<any>(null);
  const [loadingSeriesDetail, setLoadingSeriesDetail] = useState(false);

  // Favorite section state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [allCricketerNames, setAllCricketerNames] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [favoritePlayer, setFavoritePlayer] = useState<any>(null);
  const [favoritePlayerName, setFavoritePlayerName] = useState<string | null>(null);
  const [loadingFavoritePlayer, setLoadingFavoritePlayer] = useState(false);
  const debounceTimeout = useRef<number | null>(null);

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

  // Import the Wikipedia function from football (we'll use the same function)
  const getWikipediaImageUrl = async (searchTerm: string): Promise<string | null> => {
    // Try multiple search variations for cricket players
    const searchVariations = [
      `${searchTerm} cricket`,
      `${searchTerm} cricketer`,
      `${searchTerm} _(cricketer)`,
      searchTerm
    ];

    for (const searchQuery of searchVariations) {
      try {
        const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(searchQuery)}&prop=pageimages&pithumbsize=500&origin=*`;
        const res = await fetch(url);
        const data = await res.json();
        const pages = data?.query?.pages;
        if (pages) {
          for (const pageId in pages) {
            const page = pages[pageId];
            if (page.thumbnail && page.thumbnail.source) {
              return page.thumbnail.source;
            }
          }
        }
      } catch (e) {
        console.log('Error searching for', searchQuery, ':', e);
      }
    }
    return null;
  };

  // Enhanced function specifically for country flags
  const getCountryFlagUrl = async (countryName: string): Promise<string | null> => {
    const searchTerms = [
      `Flag of ${countryName}`,
      `${countryName} flag`,
      `${countryName}`,
      `Flag_of_${countryName.replace(/\s+/g, '_')}`
    ];

    for (const searchTerm of searchTerms) {
      const flagUrl = await getWikipediaImageUrl(searchTerm);
      if (flagUrl) {
        return flagUrl;
      }
    }
    return null;
  };

  // State for country flag and player image
  const [countryFlag, setCountryFlag] = useState<string | null>(null);
  const [playerImage, setPlayerImage] = useState<string | null>(null);

  // Fetch country flag when favorite player changes or component loads
  useEffect(() => {
    const fetchCountryFlag = async () => {
      const currentCountry = favoritePlayer?.country;
      if (currentCountry) {
        const flagUrl = await getCountryFlagUrl(currentCountry);
        setCountryFlag(flagUrl);
      }
    };

    fetchCountryFlag();
  }, [favoritePlayer]);

  // Fetch player image when favorite player changes or component loads
  useEffect(() => {
    const fetchPlayerImage = async () => {
      const currentPlayerName = favoritePlayer?.name;
      if (currentPlayerName) {
        const imageUrl = await getWikipediaImageUrl(currentPlayerName);
        setPlayerImage(imageUrl);
      }
    };

    fetchPlayerImage();
  }, [favoritePlayer]);

  // Stats section state
  const [showStatsSearchModal, setShowStatsSearchModal] = useState(false);
  const [statsSearchQuery, setStatsSearchQuery] = useState("");
  const [statsSearchResults, setStatsSearchResults] = useState<any[]>([]);
  const [selectedStatsTeam, setSelectedStatsTeam] = useState<any>(null);
  const [loadingStatsTeam, setLoadingStatsTeam] = useState(false);
  const [teamImage, setTeamImage] = useState<string | null>(null);

  // Firebase user
  const { user } = useUser();


  const {
    matchesData,
    loadingMatches,
    selectedCompetition,
    setSelectedCompetition,
    getMatchScorecard,
    getSeriesInfo,
    seriesData,
    loadingSeries,
    fetchSeriesData
  } = useCricketData();

  useEffect(() => {
    if (selectedMatch) {
      setLoadingDetail(true);
      getMatchScorecard(selectedMatch.id).then((data) => {
        setMatchDetail(data);
        setLoadingDetail(false);
      });
    }
  }, [selectedMatch]);

  useEffect(() => {
    if (selectedSeries) {
      setLoadingSeriesDetail(true);
      getSeriesInfo(selectedSeries.id || selectedSeries.seriesId).then((data) => {
        setSeriesDetail(data);
        setLoadingSeriesDetail(false);
      }).catch((error) => {
        console.error("Error fetching series detail:", error);
        setLoadingSeriesDetail(false);
      });
    }
  }, [selectedSeries]);

  useEffect(() => {
    if (activeTab === "Series") {
      fetchSeriesData();
    }
  }, [activeTab]);

  // Load cricket player names for search from local JSON file
  useEffect(() => {
    try {
      const cricketerNames = require("../../../cricketer_names.json");
      const playerArray = Array.isArray(cricketerNames) ? cricketerNames : [];
      setAllCricketerNames(playerArray);
      
      // Set default player to "Najmul Hossain Shanto" if no favorite is set
      if (!favoritePlayerName && playerArray.length > 0) {
        const defaultPlayer = playerArray.find((p: any) => p.name === "Najmul Hossain Shanto");
        if (defaultPlayer) {
          setFavoritePlayerName("Najmul Hossain Shanto");
        }
      }
    } catch (e) {
      console.error("Error loading cricketer names:", e);
      setAllCricketerNames([]);
    }
  }, []);

  // Fetch favoritePlayerName from Firebase on mount
  useEffect(() => {
    const fetchFavoritePlayerName = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) {
        setFavoritePlayerName("Najmul Hossain Shanto"); // fallback default
        return;
      }
      try {
        const userDocRef = doc(db, "users", user.primaryEmailAddress.emailAddress);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.favoritePlayerName) {
            setFavoritePlayerName(data.favoritePlayerName);
          } else {
            setFavoritePlayerName("Najmul Hossain Shanto"); // default if not found
          }
        } else {
          setFavoritePlayerName("Najmul Hossain Shanto"); // default if no doc
        }
      } catch (error) {
        setFavoritePlayerName("Najmul Hossain Shanto"); // fallback on error
      }
    };
    fetchFavoritePlayerName();
  }, [user?.primaryEmailAddress?.emailAddress]);

  // Save favoritePlayerName to Firebase when it changes
  useEffect(() => {
    const saveFavoritePlayerName = async () => {
      if (!user?.primaryEmailAddress?.emailAddress || !favoritePlayerName) return;
      try {
        const userDocRef = doc(db, "users", user.primaryEmailAddress.emailAddress);
        await setDoc(userDocRef, { favoritePlayerName }, { merge: true });
      } catch (error) {
        console.error("Error saving favorite player:", error);
      }
    };
    if (favoritePlayerName) {
      saveFavoritePlayerName();
    }
  }, [favoritePlayerName, user?.primaryEmailAddress?.emailAddress]);

  // Fetch player data when favoritePlayerName changes
  useEffect(() => {
    if (favoritePlayerName && allCricketerNames.length > 0) {
      fetchFavoritePlayer(favoritePlayerName);
    }
  }, [favoritePlayerName, allCricketerNames]);

  // Load Bangladesh data by default for stats
  useEffect(() => {
    if (!selectedStatsTeam) {
      selectStatsTeam("bangladesh");
    }
  }, []);

  // Fetch player data from local JSON file
  function fetchFavoritePlayer(playerName: string) {
    setLoadingFavoritePlayer(true);
    try {
      // Find player by name in the local cricketer names JSON
      const player = allCricketerNames.find((p: any) => p.name === playerName);

      if (player) {
        setFavoritePlayer({
          name: player.name || "Unknown",
          country: player.country || "Unknown",
          nationality: player.country || "Unknown",
          battingStyle: player.battingStyle || "Unknown",
          bowlingStyle: player.bowlingStyle || "Unknown",
          role: player.role || "Unknown",
          placeOfBirth: player.placeOfBirth || "Unknown",
          dateOfBirth: player.dateOfBirth || null
        });
      } else {
        setFavoritePlayer(null);
      }
    } catch (err) {
      console.error("Error finding favorite player in local data:", err);
      setFavoritePlayer(null);
    }
    setLoadingFavoritePlayer(false);
  }

  // Handle search input change with local filtering
  const onSearchInputChange = (query: string) => {
    setSearchQuery(query);
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    const lower = query.toLowerCase();
    const filtered = allCricketerNames.filter((p: any) => {
      if (!p || !p.name) return false;
      return p.name.toLowerCase().includes(lower);
    });

    
    setSearchResults(filtered.slice(0, 10));
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  // Select a player from search results
  const selectPlayer = async (player: any) => {
    setShowSearchModal(false);
    setSearchQuery("");
    setFavoritePlayerName(player.name);
  };

  // Stats search functions
  const onStatsSearchInputChange = (query: string) => {
    setStatsSearchQuery(query);
    if (!query || query.length < 1) {
      setStatsSearchResults([]);
      return;
    }
    const lower = query.toLowerCase();
    const filtered = CRICKET_COUNTRIES.filter((country) =>
      country.toLowerCase().includes(lower)
    );
    setStatsSearchResults(filtered.slice(0, 10));
  };

  const selectStatsTeam = async (teamName: string) => {
    setShowStatsSearchModal(false);
    setStatsSearchQuery("");

    // Get real team stats from cricketstats.json
    const teamStats = getTeamStatsFromJSON(teamName);

    if (teamStats) {
      // Calculate aggregate stats
      const totalPlayed = teamStats.odi.played + teamStats.test.played + teamStats.t20.played;
      const totalWon = teamStats.odi.won + teamStats.test.won + teamStats.t20.won;
      const totalLost = teamStats.odi.lost + teamStats.test.lost + teamStats.t20.lost;
      const totalDraws = teamStats.test.draw + (teamStats.odi.noResult || 0) + (teamStats.t20.noResult || 0);

      const realTeamData = {
        name: teamName,
        ranking: Math.min(teamStats.odi.position, teamStats.test.position || 20, teamStats.t20.position),

        // Overall stats
        matches: totalPlayed,
        wins: totalWon,
        losses: totalLost,
        draws: totalDraws,

        // Format-specific stats
        odi: teamStats.odi,
        test: teamStats.test,
        t20: teamStats.t20,

        captain: teamStats.odi.captain, // Use ODI captain as main captain
        viceCaptain: teamStats.odi.viceCaptain,

        // Format-specific captains
        odiCaptain: teamStats.odi.captain,
        odiViceCaptain: teamStats.odi.viceCaptain,
        testCaptain: teamStats.test.captain,
        testViceCaptain: teamStats.test.viceCaptain,
        t20Captain: teamStats.t20.captain,
        t20ViceCaptain: teamStats.t20.viceCaptain,
      };

      setSelectedStatsTeam(realTeamData);

      // Set team image from JSON data
      setTeamImage(teamStats.imageUrl || null);
    }
  };


  const renderSeriesCard = (series: any) => {
    return (
      <TouchableOpacity
        key={series.id || series.seriesId}
        style={styles.matchCard}
        onPress={() => setSelectedSeries(series)}
      >
        <View style={styles.seriesHeader}>
          <Text style={styles.matchTitle}>{series.name || series.seriesName}</Text>
        </View>

        <View style={styles.seriesInfo}>
          <View style={styles.seriesRow}>
            <Text style={styles.seriesLabel}>Start Date:</Text>
            <Text style={styles.seriesValue}>{series.startDate || series.startDateTime || 'N/A'}</Text>
          </View>

          <View style={styles.seriesRow}>
            <Text style={styles.seriesLabel}>End Date:</Text>
            <Text style={styles.seriesValue}>{series.endDate || series.endDateTime || 'N/A'}</Text>
          </View>

          <View style={styles.seriesRow}>
            <Text style={styles.seriesLabel}>Teams:</Text>
            <Text style={styles.seriesValue}>{series.squads || series.teams || 'N/A'}</Text>
          </View>

          <View style={styles.seriesRow}>
            <Text style={styles.seriesLabel}>Matches:</Text>
            <Text style={styles.seriesValue}>{series.matches || 'N/A'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMatchCardInSeries = (match: any) => {
    let matchType = (match.matchType || match.matchtype || '').toString().toUpperCase();
    if (matchType === 'T20') matchType = 'T20';
    else if (matchType === 'ODI') matchType = 'ODI';
    else if (matchType === 'TEST') matchType = 'Test';
    else matchType = '';

    // Determine if match has started
    const notStarted =
      (typeof match.matchStarted === 'boolean' && match.matchStarted === false) ||
      (typeof match.status === 'string' && match.status.toLowerCase().includes('not started'));

    // Disable if not started or fantasyEnabled is false
    const disabled = notStarted || match.fantasyEnabled === false;

    const handleMatchPress = () => {
      if (!disabled) {
        setSelectedSeries(null); // Close series modal
        setSelectedMatch(match); // Open match modal
      }
    };

    return (
      <TouchableOpacity
        key={match.id || match.matchId}
        style={styles.matchCard}
        onPress={handleMatchPress}
        disabled={disabled}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={styles.matchTitle}>{match.name || match.matchTitle || match.teams || 'Unknown Match'}</Text>
          {match.fantasyEnabled === true && (
            <Text style={styles.scorecardAvailable}>scorecard available</Text>
          )}
        </View>
        <Text style={styles.matchStatus}>{match.status || match.matchType || ''}</Text>
        <Text style={styles.matchDetail}>{match.date || match.dateTimeGMT || ''} {match.venue ? `| ${match.venue}` : ''}</Text>
        {match.score?.map?.((s: any, idx: number) => (
          <Text key={idx} style={styles.matchDetail}>
            {s.inning}: {s.r}/{s.w} in {s.o} overs
          </Text>
        ))}
      </TouchableOpacity>
    );
  };

  const renderMatchCard = (match: any) => {
    let matchType = (match.matchType || match.matchtype || '').toString().toUpperCase();
    if (matchType === 'T20') matchType = 'T20';
    else if (matchType === 'ODI') matchType = 'ODI';
    else if (matchType === 'TEST') matchType = 'Test';
    else matchType = '';

    // Determine if match has started
    const notStarted =
      (typeof match.matchStarted === 'boolean' && match.matchStarted === false) ||
      (typeof match.status === 'string' && match.status.toLowerCase().includes('not started'));

    // Disable if not started or fantasyEnabled is false
    const disabled = notStarted || match.fantasyEnabled === false;

    return (
      <TouchableOpacity
        key={match.id || match.matchId}
        style={styles.matchCard}
        onPress={() => {
          if (!disabled) setSelectedMatch(match);
        }}
        disabled={disabled}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={styles.matchTitle}>{match.name || match.matchTitle || match.teams || 'Unknown Match'}</Text>
          {match.fantasyEnabled === true && (
            <Text style={styles.scorecardAvailable}>scorecard available</Text>
          )}
        </View>
        <Text style={styles.matchStatus}>{match.status || match.matchType || ''}</Text>
        <Text style={styles.matchDetail}>{match.date || match.dateTimeGMT || ''} {match.venue ? `| ${match.venue}` : ''}</Text>
        {match.score?.map?.((s: any, idx: number) => (
          <Text key={idx} style={styles.matchDetail}>
            {s.inning}: {s.r}/{s.w} in {s.o} overs
          </Text>
        ))}
      </TouchableOpacity>
    );
  };

  const renderMatchModal = () => (
    <Modal visible={!!selectedMatch} animationType="slide">
      <View style={styles.modalContainer}>
        <TouchableOpacity onPress={() => setSelectedMatch(null)} style={styles.closeButton}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>

        {loadingDetail ? (
          <ActivityIndicator size="large" color="#3B82F6" />
        ) : matchDetail ? (
          <ScrollView>
            <Text style={styles.modalTitle}>{matchDetail.name}</Text>
            <Text style={styles.modalSub}>{matchDetail.status}</Text>
            <Text style={styles.modalSub}>{matchDetail.date} | {matchDetail.venue}</Text>

            {matchDetail.teamInfo?.map((team: any, idx: number) => (
              <View key={idx} style={styles.teamRow}>
                <Image source={{ uri: team.img }} style={styles.flag} />
                <Text style={styles.teamName}>{team.name}</Text>
              </View>
            ))}

            {matchDetail.score?.map((s: any, idx: number) => (
              <Text key={idx} style={styles.scoreLine}>
                {s.inning}: {s.r}/{s.w} ({s.o} overs)
              </Text>
            ))}

            {matchDetail.scorecard?.map((inning: any, idx: number) => (
              <View key={idx} style={styles.inningSection}>
                <Text style={styles.inningTitle}>{inning.inning}</Text>

                <Text style={styles.subHeading}>Batting</Text>
                {inning.batting?.map((b: any, i: number) => (
                  <Text key={i} style={styles.playerStat}>
                    {b.batsman?.name} - {b.r}({b.b}) {b.dismissalText ? `- ${b.dismissalText}` : ""}
                  </Text>
                ))}

                <Text style={styles.subHeading}>Bowling</Text>
                {inning.bowling?.map((b: any, i: number) => (
                  <Text key={i} style={styles.playerStat}>
                    {b.bowler?.name} - {b.o} overs, {b.r} runs, {b.w} wickets
                  </Text>
                ))}
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noDataText}>No match detail found.</Text>
        )}
      </View>
    </Modal>
  );

  const renderSeriesModal = () => {
    if (!selectedSeries) return null;

    return (
      <Modal visible={!!selectedSeries} animationType="slide">
        <View style={styles.modalContainer}>
          <TouchableOpacity onPress={() => setSelectedSeries(null)} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          {loadingSeriesDetail ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : seriesDetail && !seriesDetail.error ? (
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalTitle}>{seriesDetail.info?.name || selectedSeries?.name || 'Unknown Series'}</Text>

              <View style={styles.seriesDetailsContainer}>
                <View style={styles.seriesRow}>
                  <Text style={styles.seriesLabel}>Start Date:</Text>
                  <Text style={styles.seriesValue}>{seriesDetail.info?.startDate || selectedSeries?.startDate || 'N/A'}</Text>
                </View>

                <View style={styles.seriesRow}>
                  <Text style={styles.seriesLabel}>End Date:</Text>
                  <Text style={styles.seriesValue}>{seriesDetail.info?.endDate || selectedSeries?.endDate || 'N/A'}</Text>
                </View>

                <View style={styles.seriesRow}>
                  <Text style={styles.seriesLabel}>Total Matches:</Text>
                  <Text style={styles.seriesValue}>{seriesDetail.matchList?.length || 0}</Text>
                </View>

                {seriesDetail.info?.odi > 0 && (
                  <View style={styles.seriesRow}>
                    <Text style={styles.seriesLabel}>ODI Matches:</Text>
                    <Text style={styles.seriesValue}>{seriesDetail.info.odi}</Text>
                  </View>
                )}

                {seriesDetail.info?.t20 > 0 && (
                  <View style={styles.seriesRow}>
                    <Text style={styles.seriesLabel}>T20 Matches:</Text>
                    <Text style={styles.seriesValue}>{seriesDetail.info.t20}</Text>
                  </View>
                )}

                {seriesDetail.info?.test > 0 && (
                  <View style={styles.seriesRow}>
                    <Text style={styles.seriesLabel}>Test Matches:</Text>
                    <Text style={styles.seriesValue}>{seriesDetail.info.test}</Text>
                  </View>
                )}
              </View>

              {seriesDetail.matchList && seriesDetail.matchList.length > 0 && (
                <View style={styles.matchesSection}>
                  <Text style={styles.sectionTitle}>Matches</Text>
                  {seriesDetail.matchList.map((match: any) => renderMatchCardInSeries(match))}
                </View>
              )}
            </ScrollView>
          ) : (
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedSeries?.name || selectedSeries?.seriesName || 'Unknown Series'}</Text>

              <View style={styles.seriesDetailsContainer}>
                <View style={styles.seriesRow}>
                  <Text style={styles.seriesLabel}>Start Date:</Text>
                  <Text style={styles.seriesValue}>{selectedSeries?.startDate || selectedSeries?.startDateTime || 'N/A'}</Text>
                </View>

                <View style={styles.seriesRow}>
                  <Text style={styles.seriesLabel}>End Date:</Text>
                  <Text style={styles.seriesValue}>{selectedSeries?.endDate || selectedSeries?.endDateTime || 'N/A'}</Text>
                </View>

                <View style={styles.seriesRow}>
                  <Text style={styles.seriesLabel}>Teams:</Text>
                  <Text style={styles.seriesValue}>{selectedSeries?.squads || selectedSeries?.teams || 'N/A'}</Text>
                </View>

                <View style={styles.seriesRow}>
                  <Text style={styles.seriesLabel}>Matches:</Text>
                  <Text style={styles.seriesValue}>{selectedSeries?.matches || 'N/A'}</Text>
                </View>
              </View>

              <Text style={styles.noDataText}>Detailed series information could not be loaded.</Text>
            </ScrollView>
          )}
        </View>
      </Modal>
    );
  };

  // Render favorite section (similar to football but player-only)
  const renderFavorite = () => (
    <View style={styles.tabContent}>
      {/* Header with Change Player button - positioned at top right */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => {
            setSearchQuery("");
            setSearchResults([]);
            setShowSearchModal(true);
          }}
          style={styles.addFavoriteBtn}
        >
          <Text style={styles.addButtonText}>
            Change Player
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {loadingFavoritePlayer ? (
          <Text style={styles.noDataText}>Loading player info...</Text>
        ) : (
          <View style={styles.favoritePlayerCard}>
            <Image
              source={{
                uri: (() => {
                  return (favoritePlayer?.image || playerImage) || "https://via.placeholder.com/120x120?text=Player";
                })()
              }}
              style={{ width: 120, height: 120, borderRadius: 60, marginBottom: 10 }}
              resizeMode="cover"
            />

            <Text style={[styles.teamName, { fontWeight: 'bold' }]}>
              {favoritePlayer?.name || "N/A"}
            </Text>

            {/* First Name */}
            <Text style={styles.playerDetail}>
              First Name: {extractFirstLastName(favoritePlayer?.name || "").firstName || "N/A"}
            </Text>

            {/* Last Name */}
            <Text style={styles.playerDetail}>
              Last Name: {extractFirstLastName(favoritePlayer?.name || "").lastName || "N/A"}
            </Text>

            {/* Age */}
            <Text style={styles.playerDetail}>
              Age: {favoritePlayer?.dateOfBirth ?
                `${calculateAge(favoritePlayer.dateOfBirth)} years` : "N/A"}
            </Text>

            {/* Date of Birth */}
            <Text style={styles.playerDetail}>
              Date of Birth: {favoritePlayer?.dateOfBirth ?
                new Date(favoritePlayer.dateOfBirth).toLocaleDateString() : "N/A"}
            </Text>

            <Text style={styles.playerDetail}>
              Role: {favoritePlayer?.role || "N/A"}
            </Text>
            <Text style={styles.playerDetail}>
              Batting Style: {favoritePlayer?.battingStyle || "N/A"}
            </Text>
            <Text style={styles.playerDetail}>
              Bowling Style: {favoritePlayer?.bowlingStyle || "N/A"}
            </Text>
            <Text style={styles.playerDetail}>
              Place of Birth: {favoritePlayer?.placeOfBirth || "N/A"}
            </Text>

            {/* Country with flag */}
            <View style={styles.countryContainer}>
              <Text style={styles.playerDetail}>
                Country: {favoritePlayer?.country || "N/A"}
              </Text>
              {countryFlag && (
                <Image
                  source={{ uri: countryFlag }}
                  style={styles.countryFlag}
                />
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Search Modal */}
      <Modal visible={showSearchModal} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a player"
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
            <Text style={styles.noResultsText}>No players found</Text>
          ) : (
            <ScrollView style={styles.searchResults}>
              {searchResults.map((player, index) => (
                <TouchableOpacity
                  key={`${index}-${player.name}`}
                  onPress={() => selectPlayer(player)}
                  style={styles.searchResultItem}
                >
                  <Text style={styles.searchResultText}>{player.name}</Text>
                  <Text style={[styles.searchResultText, { fontSize: 12, color: '#94a3b8' }]}>
                    {player.country} - {player.role}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );

  // Render stats section with team selection
  const renderStats = () => (
    <View style={styles.tabContent}>
      <View style={{ flex: 1 }}>
        {loadingStatsTeam ? (
          <Text style={styles.noDataText}>Loading team stats...</Text>
        ) : !selectedStatsTeam ? (
          <Text style={styles.noDataText}>No team selected.</Text>
        ) : (
          <View style={styles.statsContainer}>
            {/* Team Header and Change Team button - separate boxes */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <View style={styles.compactTeamHeader}>
                {teamImage ? (
                  <Image source={{ uri: teamImage }} style={styles.teamImage} />
                ) : (
                  <Text style={styles.teamCrest}>🏏</Text>
                )}
                <Text style={styles.compactTeamName}>{selectedStatsTeam.name.toUpperCase()}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setStatsSearchQuery("");
                  setStatsSearchResults([]);
                  setShowStatsSearchModal(true);
                }}
                style={[styles.changeTeamBtn, { marginRight: -10 }, { marginLeft: 10 }]}
              >
                <Text style={styles.changeTeamText}>Change Team</Text>
              </TouchableOpacity>
            </View>

            {/* Format-specific Statistics */}
            {selectedStatsTeam.odi && (
              <View style={styles.compactFormatCard}>
                <Text style={styles.compactCardTitle}>ODI Statistics</Text>
                <Text style={styles.compactStatLine}>Ranking: #{selectedStatsTeam.odi.position}</Text>
                <Text style={styles.compactStatLine}>Played: {selectedStatsTeam.odi.played}  Won: {selectedStatsTeam.odi.won}  Lost: {selectedStatsTeam.odi.lost}  No Result: {selectedStatsTeam.odi.noResult}</Text>
                <Text style={styles.compactStatLine}>Runs Scored: {selectedStatsTeam.odi.totalRuns}  Wickets Taken: {selectedStatsTeam.odi.wicketsTaken}</Text>
                <Text style={styles.compactStatLine}>Captain: {selectedStatsTeam.odi.captain}</Text>
                <Text style={styles.compactStatLine}>Vice Captain: {selectedStatsTeam.odi.viceCaptain}</Text>
              </View>
            )}

            {selectedStatsTeam.test && selectedStatsTeam.test.played > 0 && (
              <View style={styles.compactFormatCard}>
                <Text style={styles.compactCardTitle}>Test Statistics</Text>
                <Text style={styles.compactStatLine}>Ranking: #{selectedStatsTeam.test.position}</Text>
                <Text style={styles.compactStatLine}>Played: {selectedStatsTeam.test.played}  Won: {selectedStatsTeam.test.won}  Lost: {selectedStatsTeam.test.lost}  Draw: {selectedStatsTeam.test.draw}</Text>
                <Text style={styles.compactStatLine}>Runs Scored: {selectedStatsTeam.test.totalRuns}  Wickets Taken: {selectedStatsTeam.test.wicketsTaken}</Text>
                <Text style={styles.compactStatLine}>Captain: {selectedStatsTeam.test.captain}</Text>
                <Text style={styles.compactStatLine}>Vice Captain: {selectedStatsTeam.test.viceCaptain}</Text>
              </View>
            )}

            {selectedStatsTeam.t20 && (
              <View style={styles.compactFormatCard}>
                <Text style={styles.compactCardTitle}>T20 Statistics</Text>
                <Text style={styles.compactStatLine}>Ranking: #{selectedStatsTeam.t20.position}</Text>
                <Text style={styles.compactStatLine}>Played: {selectedStatsTeam.t20.played}  Won: {selectedStatsTeam.t20.won}  Lost: {selectedStatsTeam.t20.lost}  No Result: {selectedStatsTeam.t20.noResult}</Text>
                <Text style={styles.compactStatLine}>Runs Scored: {selectedStatsTeam.t20.totalRuns}  Wickets Taken: {selectedStatsTeam.t20.wicketsTaken}</Text>
                <Text style={styles.compactStatLine}>Captain: {selectedStatsTeam.t20.captain}</Text>
                <Text style={styles.compactStatLine}>Vice Captain: {selectedStatsTeam.t20.viceCaptain}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Team Search Modal */}
      <Modal visible={showStatsSearchModal} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a team"
              placeholderTextColor="gray"
              value={statsSearchQuery}
              onChangeText={onStatsSearchInputChange}
              autoFocus={true}
            />
            <TouchableOpacity
              onPress={() => setShowStatsSearchModal(false)}
              style={styles.closeModalButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {statsSearchResults.length === 0 && statsSearchQuery.length > 0 ? (
            <Text style={styles.noResultsText}>No teams found</Text>
          ) : (
            <ScrollView style={styles.searchResults}>
              {statsSearchResults.map((teamName) => (
                <TouchableOpacity
                  key={teamName}
                  onPress={() => selectStatsTeam(teamName)}
                  style={styles.searchResultItem}
                >
                  <Text style={styles.searchResultText}>{teamName.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );

  // Football-style tab bar and overlay button
  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexGrow: 1 }}>
          {/* Show three lines button only for Matches tab, now on the left */}
          {activeTab === 'Matches' && (
            <TouchableOpacity
              style={[styles.openTrayButton, { position: 'relative', left: 0, right: 0, marginLeft: 8, marginRight: 8 }]}
              onPress={() => {
                setMatchesLeftTrayOpen(true);
                Animated.timing(matchesTrayAnim, {
                  toValue: 0,
                  duration: 250,
                  useNativeDriver: false,
                }).start();
              }}
            >
              <Text style={styles.openButtonText}>☰</Text>
            </TouchableOpacity>
          )}
          {/* Tabs */}
          <View style={{ flexDirection: 'row', flex: 1 }}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabButton,
                  activeTab === tab && styles.activeTabButton,
                  // Stretch tabs if three lines button is hidden
                  activeTab !== 'Matches' && { flex: 1, minWidth: undefined }
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

      {/* Overlay Modal for match categories, football style */}
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
                <Text style={styles.sectionTitle}>Categories</Text>
                <View>
                  {MATCH_CATEGORIES.map((label) => (
                    <TouchableOpacity
                      key={label}
                      onPress={() => {
                        setSelectedCompetition(label);
                        Animated.timing(matchesTrayAnim, {
                          toValue: -220,
                          duration: 250,
                          useNativeDriver: false,
                        }).start(() => setMatchesLeftTrayOpen(false));
                      }}
                      style={[
                        styles.competitionButton,
                        selectedCompetition === label && styles.activeCompetitionButton
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          selectedCompetition === label && styles.activeTabText
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <View style={styles.content}>
        {activeTab === "Series" && (
          <View style={styles.tabContent}>
            {loadingSeries ? (
              <ActivityIndicator size="large" color="#3B82F6" />
            ) : seriesData.length === 0 ? (
              <Text style={styles.noDataText}>No series found</Text>
            ) : (
              <ScrollView style={styles.scrollContainer}>
                {seriesData.map((series: any) => renderSeriesCard(series))}
              </ScrollView>
            )}
            {renderSeriesModal()}
            {renderMatchModal()}
          </View>
        )}
        {activeTab === "Matches" && (
          <View style={styles.tabContent}>
            <View style={styles.matchesContent}>
              {loadingMatches ? (
                <ActivityIndicator size="large" color="#3B82F6" />
              ) : matchesData.length === 0 ? (
                <Text style={styles.noDataText}>No matches found</Text>
              ) : (
                <ScrollView style={styles.scrollContainer}>
                  {matchesData.map(renderMatchCard)}
                </ScrollView>
              )}
            </View>
            {renderMatchModal()}
            {renderSeriesModal()}
          </View>
        )}
        {activeTab === "Favorite" && renderFavorite()}
        {activeTab === "Stats" && renderStats()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
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
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  matchTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    flex: 1,
    flexWrap: 'wrap',
  },
  scorecardAvailable: {
    color: '#22c55e',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  matchStatus: {
    color: '#facc15',
    fontWeight: '500',
    marginTop: 4,
  },
  matchDetail: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  matchesContent: {
    flex: 1,
    padding: 5,
    height: '92%',
  },
  // Modal and detail styles from football.tsx
  modalContainer: {
    flex: 1,
    backgroundColor: '#1B2631',
    padding: 15,
  },
  closeButton: {
    backgroundColor: '#ef4444',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  closeText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  modalTitle: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
    marginVertical: 10,
  },
  modalSub: {
    color: '#cbd5e1',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  closeButtonText: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: 'bold',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    justifyContent: 'center',
  },
  flag: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    marginHorizontal: 6,
    transform: [{ translateY: -3 }],
  },
  teamName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 0,
  },
  scoreLine: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 2,
  },
  inningSection: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  inningTitle: {
    color: '#38bdf8',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 6,
    textAlign: 'center',
  },
  subHeading: {
    color: '#f8fafc',
    fontWeight: '600',
    fontSize: 13,
    marginTop: 8,
    marginBottom: 2,
  },
  playerStat: {
    color: '#cbd5e1',
    fontSize: 13,
    marginLeft: 10,
    marginBottom: 2,
  },
  openTrayButton: {
    position: 'absolute',
    top: 2,
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
  sectionTitle: {
    color: '#FF0000',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 10,
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
  seriesHeader: {
    marginBottom: 12,
  },
  seriesInfo: {
    gap: 8,
  },
  seriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seriesLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  seriesValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
  seriesDetailsContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  matchesSection: {
    marginTop: 16,
  },
  // Favorite section styles
  favoriteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  addFavoriteBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  favoritePlayerCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  playerName: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  playerDetail: {
    color: '#cbd5e1',
    fontSize: 14,
    marginBottom: 4,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 16,
    paddingVertical: 8,
  },
  closeModalButton: {
    padding: 8,
    backgroundColor: '#ef4444',
    borderRadius: 6,
    marginLeft: 8,
  },
  loader: {
    marginTop: 20,
  },
  noResultsText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  searchResults: {
    marginTop: 10,
    marginHorizontal: 16,
  },
  searchResultItem: {
    backgroundColor: '#1e293b',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchResultText: {
    color: '#f8fafc',
    fontSize: 16,
  },
  // Stats section styles
  statsContainer: {
    paddingHorizontal: 16,
  },
  teamHeader: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statsTeamName: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  teamRanking: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },

  keyPlayersCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  playerValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  recentFormCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  winBadge: {
    backgroundColor: '#22c55e',
  },
  lossBadge: {
    backgroundColor: '#ef4444',
  },
  drawBadge: {
    backgroundColor: '#f59e0b',
  },
  formText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  formatCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  formatStatsLines: {
    marginTop: 12,
  },
  formatStatLine: {
    color: '#f8fafc',
    fontSize: 14,
    marginBottom: 8,
    paddingLeft: 8,
  },
  // Compact stats styles
  compactTeamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    padding: 12,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    flex: 1,
    marginRight: 8,
  },
  teamCrest: {
    fontSize: 18,
    marginRight: 8,
  },
  teamImage: {
    width: 25,
    height: 25,
    borderRadius: 2,
    marginRight: 8,
  },
  compactTeamName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  changeTeamBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  changeTeamText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  compactFormatCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  compactCardTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  compactStatsLines: {
    marginTop: 4,
  },
  compactStatLine: {
    color: '#f8fafc',
    fontSize: 13,
    marginBottom: 3,
    paddingLeft: 4,
  },
  countryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  countryFlag: {
    width: 20,
    height: 15,
    marginLeft: 8,
    borderRadius: 2,
  },
});
