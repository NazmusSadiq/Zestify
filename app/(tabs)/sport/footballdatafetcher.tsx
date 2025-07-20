// Fetch player image from Wikipedia
export async function getWikipediaImageUrl(playerName: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(playerName)}&prop=pageimages&pithumbsize=500&origin=*`;
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
    return null;
  } catch (e) {
    return null;
  }
}
import {
  COMPETITIONS,
  fetchFromApi,
  MATCHES_COMPETITIONS,
  STATS_ENDPOINTS,
} from "@/services/fotball_API";
import { useUser } from "@clerk/clerk-expo";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { db } from "../../../firebase";

export const getTeamWithCrest = (team: any) => {
  let name = typeof team === "string" ? team : team?.shortName ?? team?.name ?? "N/A";

  if (name && name.toLowerCase().includes("wolverhampton")) {
    name = "Wolves";
  }

  const crest = team?.crest ?? team?.logo ?? team?.crestUrl ?? null;

  return {
    name,
    crest,
  };
};

let cachedTeams: any[] = [];

// Cache for home matches to prevent repeated API calls
let cachedHomeMatches: any[] = [];
let homeMatchesCacheTimestamp: number | null = null;
const HOME_MATCHES_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
let isHomeMatchesFetching = false; // Prevent multiple simultaneous fetches

// Cache for stats data
let cachedStatsData: { [key: string]: any } = {};
let statsCacheTimestamps: { [key: string]: number } = {};
const STATS_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Enhanced cache for all major league matches - fetched once per app session
let cachedAllLeagueMatches: { [competitionId: string]: any[] } = {};
let leagueMatchesFetchTimestamp: number | null = null;
let hasInitializedLeagueMatches = false;
let leagueMatchesInitPromise: Promise<void> | null = null;

// Cache for team details
let cachedTeamDetails: { [teamId: number]: any } = {};
let teamDetailsCacheTimestamp: number | null = null;
const TEAM_DETAILS_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Cache for favorite player data - GLOBAL CACHE
let cachedFavoritePlayerData: any = null;
let favoritePlayerCacheTimestamp: number | null = null;
const FAVORITE_PLAYER_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Cache version to track updates - increment when cache is updated
let favoritePlayerCacheVersion: number = 0;


export const clearAllFootballCaches = () => {
  cachedTeams = [];
  cachedHomeMatches = [];
  homeMatchesCacheTimestamp = null;
  isHomeMatchesFetching = false;
  cachedStatsData = {};
  statsCacheTimestamps = {};
  cachedAllLeagueMatches = {};
  leagueMatchesFetchTimestamp = null;
  hasInitializedLeagueMatches = false;
  leagueMatchesInitPromise = null;
  cachedTeamDetails = {};
  teamDetailsCacheTimestamp = null;
  cachedFavoritePlayerData = null;
  favoritePlayerCacheTimestamp = null;
  favoritePlayerCacheVersion = 0;
};

// Function to clear only favorite player cache - useful for debugging
export const clearFavoritePlayerCache = () => {
  cachedFavoritePlayerData = null;
  favoritePlayerCacheTimestamp = null;
  favoritePlayerCacheVersion++;
};

// Function to manually set a valid player in cache (for debugging/fixing bad data)
export const setValidPlayerInCache = async (playerId: number, playerName: string) => {
  const playerData = { 
    id: playerId, 
    name: playerName,
    currentTeam: { name: "Unknown Team" }
  };
  
  cachedFavoritePlayerData = playerData;
  favoritePlayerCacheTimestamp = Date.now();
  favoritePlayerCacheVersion++;
  
  return playerData;
};

// Function to force refresh profile data from cache - for profile use
export const refreshProfileDataFromCache = () => {
  favoritePlayerCacheVersion++;
  return {
    data: cachedFavoritePlayerData,
    timestamp: favoritePlayerCacheTimestamp,
    version: favoritePlayerCacheVersion,
    isValid: favoritePlayerCacheTimestamp ? 
      (Date.now() - favoritePlayerCacheTimestamp) < FAVORITE_PLAYER_CACHE_DURATION : false
  };
};

// Function to get current cached favorite player data
export const getCachedFavoritePlayerData = () => {
  return {
    data: cachedFavoritePlayerData,
    timestamp: favoritePlayerCacheTimestamp,
    version: favoritePlayerCacheVersion,
    isValid: favoritePlayerCacheTimestamp ? 
      (Date.now() - favoritePlayerCacheTimestamp) < FAVORITE_PLAYER_CACHE_DURATION : false
  };
};

// Function to clean expired cache entries
export const cleanExpiredCaches = () => {
  const now = Date.now();

  // Clean expired stats cache
  Object.keys(statsCacheTimestamps).forEach(key => {
    if (now - statsCacheTimestamps[key] > STATS_CACHE_DURATION) {
      delete cachedStatsData[key];
      delete statsCacheTimestamps[key];
    }
  });

  // Clean expired home matches cache
  if (homeMatchesCacheTimestamp && (now - homeMatchesCacheTimestamp) > HOME_MATCHES_CACHE_DURATION) {
    cachedHomeMatches = [];
    homeMatchesCacheTimestamp = null;
  }

  // Clean expired team details cache
  if (teamDetailsCacheTimestamp && (now - teamDetailsCacheTimestamp) > TEAM_DETAILS_CACHE_DURATION) {
    cachedTeamDetails = {};
    teamDetailsCacheTimestamp = null;
  }

  // Clean expired favorite player cache
  if (favoritePlayerCacheTimestamp && (now - favoritePlayerCacheTimestamp) > FAVORITE_PLAYER_CACHE_DURATION) {
    cachedFavoritePlayerData = null;
    favoritePlayerCacheTimestamp = null;
  }


};

// Auto-cleanup every 10 minutes
setInterval(() => {
  cleanExpiredCaches();
}, 10 * 60 * 1000);

export function useFootballData(profileMode = false) {
  const { user } = useUser();
  const [statsCompetition, setStatsCompetition] = useState(COMPETITIONS[0]);
  const [statsOption, setStatsOption] = useState("Standings");
  const [statsData, setStatsData] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [matchesCompetition, setMatchesCompetition] = useState(MATCHES_COMPETITIONS[0]);
  const [matchesData, setMatchesData] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const [homeMatches, setHomeMatches] = useState<any[]>([]);
  const [loadingHome, setLoadingHome] = useState(false);

  const [favoriteTeams, setFavoriteTeams] = useState<{ id: number; name: string }[]>([]);
  const [favoriteTeamsStats, setFavoriteTeamsStats] = useState<any>(null);
  const [loadingFavStats, setLoadingFavStats] = useState(false);

  // Favorite player logic - using global cache
  const [favoritePlayerId, setFavoritePlayerId] = useState<number | null>(null);
  const [favoritePlayerData, setFavoritePlayerData] = useState<any>(null);
  const [loadingFavoritePlayer, setLoadingFavoritePlayer] = useState(false);
  // Track cache version to detect changes
  const [watchedCacheVersion, setWatchedCacheVersion] = useState<number>(favoritePlayerCacheVersion);

  // Load favorite teams and player from Firebase when component mounts
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) return;
      try {
        const userDocRef = doc(db, "users", user.primaryEmailAddress.emailAddress);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.favoriteTeams) setFavoriteTeams(data.favoriteTeams);
          if (data.favoritePlayerId) setFavoritePlayerId(data.favoritePlayerId);
        }
      } catch (error: any) {
        console.error("Error loading favorites:", error);
        Alert.alert("Error", "Failed to load favorites");
      }
    };
    loadFavorites();
  }, [user?.primaryEmailAddress?.emailAddress]);

  // Save favorite teams and player to Firebase whenever they change
  useEffect(() => {
    const saveFavorites = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) return;
      try {
        const userDocRef = doc(db, "users", user.primaryEmailAddress.emailAddress);
        await setDoc(userDocRef, { favoriteTeams, favoritePlayerId }, { merge: true });
      } catch (error: any) {
        console.error("Error saving favorites:", error);
        Alert.alert("Error", "Failed to save favorites");
      }
    };
    if (favoriteTeams.length > 0 || favoritePlayerId) {
      saveFavorites();
    }
  }, [favoriteTeams, favoritePlayerId, user?.primaryEmailAddress?.emailAddress]);

  // Watch for cache version changes - this allows profile to react to cache updates
  useEffect(() => {
    if (profileMode && favoritePlayerCacheVersion !== watchedCacheVersion) {
      
      setWatchedCacheVersion(favoritePlayerCacheVersion);
      
      // Update player data if we have valid cached data for current player ID
      if (cachedFavoritePlayerData && favoritePlayerId) {
        const now = Date.now();
        const isValidCache = favoritePlayerCacheTimestamp && 
          (now - favoritePlayerCacheTimestamp) < FAVORITE_PLAYER_CACHE_DURATION;
        
        
        if (isValidCache && 
            (cachedFavoritePlayerData.id === favoritePlayerId || 
             (cachedFavoritePlayerData.playerId === favoritePlayerId && cachedFavoritePlayerData.error))) {
          
          // In profile mode, only set valid player data (not error data)
          if (!cachedFavoritePlayerData.error && cachedFavoritePlayerData.name) {
            setFavoritePlayerData(cachedFavoritePlayerData);
          } else if (cachedFavoritePlayerData.error) {
            setFavoritePlayerData(null);
          }
        } else {
        }
      } else {
      }
    }
  }, [profileMode, watchedCacheVersion, favoritePlayerId]);

  // Periodically check for cache version changes (for profile mode)
  useEffect(() => {
    if (profileMode) {
      const interval = setInterval(() => {
        if (favoritePlayerCacheVersion !== watchedCacheVersion) {
          setWatchedCacheVersion(favoritePlayerCacheVersion);
        }
      }, 1000); // Check every second
      
      return () => clearInterval(interval);
    }
  }, [profileMode, watchedCacheVersion]);

  // Load cached favorite player data on mount
  useEffect(() => {
    const now = Date.now();
    
    // Clear cache if player ID changed
    if (favoritePlayerId && cachedFavoritePlayerData && 
        cachedFavoritePlayerData.id !== favoritePlayerId && 
        cachedFavoritePlayerData.playerId !== favoritePlayerId) {
      cachedFavoritePlayerData = null;
      favoritePlayerCacheTimestamp = null;
      setFavoritePlayerData(null);
      return;
    }
    
    if (profileMode && cachedFavoritePlayerData?.error) {
      setFavoritePlayerData(null);
      return;
    }
    
    if (cachedFavoritePlayerData &&
        favoritePlayerCacheTimestamp &&
        (now - favoritePlayerCacheTimestamp) < FAVORITE_PLAYER_CACHE_DURATION &&
        favoritePlayerId &&
        (cachedFavoritePlayerData.id === favoritePlayerId || 
         (!profileMode && cachedFavoritePlayerData.error && cachedFavoritePlayerData.playerId === favoritePlayerId))) {
      // In profile mode, only load valid player data (not error data)
      if (profileMode && (!cachedFavoritePlayerData.name || cachedFavoritePlayerData.error)) {
        setFavoritePlayerData(null);
        return;
      }
      
      setFavoritePlayerData(cachedFavoritePlayerData);
    }
  }, [favoritePlayerId, profileMode]); // Only depend on favoritePlayerId to avoid loops

  // Fetch favorite player data when favoritePlayerId changes - ONLY for non-profile mode
  useEffect(() => {
    // Skip fetching if in profile mode - profile should only read from cache
    if (profileMode) {
      return;
    }
    
    const fetchFavoritePlayerData = async () => {
      if (!favoritePlayerId) {
        setFavoritePlayerData(null);
        return;
      }

      // Check if we have cached data that's still valid
      const now = Date.now();
      console.log("Fetch effect cache check:", {
        hasCachedData: !!cachedFavoritePlayerData,
        hasTimestamp: !!favoritePlayerCacheTimestamp,
        favoritePlayerId,
        cachedId: cachedFavoritePlayerData?.id,
        cachedPlayerId: cachedFavoritePlayerData?.playerId,
        cacheAge: favoritePlayerCacheTimestamp ? now - favoritePlayerCacheTimestamp : null,
        isValid: favoritePlayerCacheTimestamp ? (now - favoritePlayerCacheTimestamp) < FAVORITE_PLAYER_CACHE_DURATION : false
      });
      
      if (cachedFavoritePlayerData &&
          favoritePlayerCacheTimestamp &&
          (now - favoritePlayerCacheTimestamp) < FAVORITE_PLAYER_CACHE_DURATION &&
          (cachedFavoritePlayerData.id === favoritePlayerId || 
           (cachedFavoritePlayerData.error && cachedFavoritePlayerData.playerId === favoritePlayerId))) {
        setFavoritePlayerData(cachedFavoritePlayerData);
        return;
      }

      setLoadingFavoritePlayer(true);
      try {
        // Bypass rate limiting for critical favorite player data fetch
        const data = await fetchFromApi(`persons/${favoritePlayerId}`, "", true);
        
        // Check if the data is an error response
        if (data?.error || !data?.name) {
          console.warn(`Player data fetch failed for ID ${favoritePlayerId}:`, data?.error || 'No player name found');
          
          // Try to find player in local player names as fallback
          let fallbackData = null;
          try {
            const knownPlayers: { [key: number]: any } = {
              1556: { id: 1556, name: "Vinicius Junior", currentTeam: { name: "Real Madrid" } },
              371: { id: 371, name: "Robert Lewandowski", currentTeam: { name: "Barcelona" } },
            };
            
            if (knownPlayers[favoritePlayerId]) {
              fallbackData = knownPlayers[favoritePlayerId];
            }
          } catch (fallbackError) {
            console.warn("Fallback player lookup failed:", fallbackError);
          }
          
          if (fallbackData) {
            // Try to fetch Wikipedia image for fallback data
            let wikiImage = null;
            if (fallbackData.name) {
              try {
                wikiImage = await getWikipediaImageUrl(fallbackData.name);
              } catch (imgError) {
                console.warn("Failed to fetch Wikipedia image for", fallbackData.name);
              }
            }
            
            const playerDataWithImage = { ...fallbackData, wikiImage };
            
            // Cache the fallback data globally
            cachedFavoritePlayerData = playerDataWithImage;
            favoritePlayerCacheTimestamp = now;
            favoritePlayerCacheVersion++;
            
            setFavoritePlayerData(playerDataWithImage);
          } else {
            // Set error data so profile can handle fallback - include playerId for cache validation
            const errorData = { error: data?.error || 'Player not found', playerId: favoritePlayerId };
            
            // Cache the error data globally with playerId
            cachedFavoritePlayerData = errorData;
            favoritePlayerCacheTimestamp = now;
            favoritePlayerCacheVersion++;
            
            setFavoritePlayerData(errorData);
          }
        } else {
          // Try to fetch Wikipedia image for valid player data
          let wikiImage = null;
          if (data?.name) {
            try {
              wikiImage = await getWikipediaImageUrl(data.name);
            } catch (imgError) {
              console.warn("Failed to fetch Wikipedia image for", data.name);
            }
          }
          
          const playerDataWithImage = { ...data, wikiImage };
          
          // Cache the data globally
          cachedFavoritePlayerData = playerDataWithImage;
          favoritePlayerCacheTimestamp = now;
          favoritePlayerCacheVersion++;
          
          setFavoritePlayerData(playerDataWithImage);
        }
      } catch (error) {
        console.error("Error fetching favorite player data:", error);
        const errorData = { error: 'Failed to fetch player data', playerId: favoritePlayerId };
        
        // Cache the error data globally with playerId
        cachedFavoritePlayerData = errorData;
        favoritePlayerCacheTimestamp = now;
        favoritePlayerCacheVersion++;
        
        setFavoritePlayerData(errorData);
      } finally {
        setLoadingFavoritePlayer(false);
      }
    };
    fetchFavoritePlayerData();
  }, [favoritePlayerId, profileMode]);

  // Initialize league matches cache on first use
  useEffect(() => {
    if (!hasInitializedLeagueMatches) {
      initializeAllLeagueMatches().catch(error => {
        console.error("Failed to initialize league matches cache:", error);
      });
    }
  }, []);
  // Add favorite player (similar to addFavoriteTeam)
  const addFavoritePlayer = async (playerName: string) => {
    if (!playerName) return null;
    try {
      // Bypass rate limiting for critical favorite player search
      const data = await fetchFromApi("persons", `?name=${encodeURIComponent(playerName)}`, true);
      if (data?.error || !data.persons || data.persons.length === 0) {
        Alert.alert("Player Error", "Player not found");
        return null;
      }
      // Only allow one favorite player
      return data.persons[0].id;
    } catch (error) {
      Alert.alert("Search Error", "Failed to search for player");
      return null;
    }
  };

  const fetchHomeMatches = async () => {
    // Prevent multiple simultaneous fetches
    if (isHomeMatchesFetching) {
      return;
    }

    setLoadingHome(true);
    try {
      // Check if we have cached data that's still valid
      const now = Date.now();
      if (cachedHomeMatches.length > 0 &&
        homeMatchesCacheTimestamp &&
        (now - homeMatchesCacheTimestamp) < HOME_MATCHES_CACHE_DURATION) {
        setHomeMatches(cachedHomeMatches);
        setLoadingHome(false);
        return;
      }

      isHomeMatchesFetching = true;

      // Teams to find next matches for
      const teamIds = [86, 81, 4, 5, 108, 524, 65, 57, 64];
      const allNextMatches: any[] = [];
      const seenMatchIds = new Set<number>();

      // Ensure league matches cache is initialized
      if (!hasInitializedLeagueMatches) {
        await initializeAllLeagueMatches();
      }

      // Extract matches for each team from cached league data
      for (const teamId of teamIds) {
        try {
          let teamMatches: any[] = [];

          // Search through all cached competitions for matches involving this team
          Object.values(cachedAllLeagueMatches).forEach((competitionMatches: any[]) => {
            const matchesForThisTeam = competitionMatches.filter((match: any) => {
              return match.homeTeam?.id === teamId || match.awayTeam?.id === teamId;
            });
            teamMatches.push(...matchesForThisTeam);
          });

          if (teamMatches.length === 0) {
            console.warn(`No cached matches found for team ${teamId}`);
            continue;
          }

          // Sort by date ascending
          teamMatches.sort((a: any, b: any) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

          // Find the next scheduled match for this team (earliest upcoming match)
          const currentTime = new Date();
          const upcomingMatches = teamMatches.filter((m: any) => {
            const matchDate = new Date(m.utcDate);
            // Include all possible upcoming match statuses
            const upcomingStatuses = ["SCHEDULED", "TIMED", "POSTPONED"];
            return upcomingStatuses.includes(m.status) && matchDate > currentTime;
          });

          // Sort upcoming matches by date and get the earliest one
          upcomingMatches.sort((a: any, b: any) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
          const nextMatch = upcomingMatches[0];

          if (nextMatch && !seenMatchIds.has(nextMatch.id)) {
            seenMatchIds.add(nextMatch.id);
            allNextMatches.push(nextMatch);
          }
        } catch (error) {
          console.warn(`Failed to extract matches for team ${teamId}:`, error);
        }
      }

      // Sort all next matches by date
      allNextMatches.sort((a: any, b: any) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

      // Update cache
      cachedHomeMatches = allNextMatches;
      homeMatchesCacheTimestamp = now;

      setHomeMatches(allNextMatches);
    } catch (error) {
      console.error("Error extracting home matches from cache:", error);
      Alert.alert("Fetch Error", "Failed to fetch home matches");
      setHomeMatches([]);
    } finally {
      isHomeMatchesFetching = false;
      setLoadingHome(false);
    }
  };

  // For football home tab - fetch favorite team matches (optimized to use cache)
  const fetchFootballHomeMatches = async () => {
    setLoadingHome(true);
    try {
      // Get favorite team ID, default to 86 if not set
      const teamId = (favoriteTeams && favoriteTeams.length > 0 && favoriteTeams[0].id) ? favoriteTeams[0].id : 86;

      // Try to get matches from cached league data first
      let matches: any[] = [];

      // Ensure league matches cache is initialized
      if (!hasInitializedLeagueMatches) {
        await initializeAllLeagueMatches();
      }

      // Search through all cached competitions for matches involving this team
      Object.values(cachedAllLeagueMatches).forEach((competitionMatches: any[]) => {
        const matchesForThisTeam = competitionMatches.filter((match: any) => {
          return match.homeTeam?.id === teamId || match.awayTeam?.id === teamId;
        });
        matches.push(...matchesForThisTeam);
      });

      // If we have cached matches, use them
      if (matches.length > 0) {
      } else {
        const data = await fetchFromApi(`teams/${teamId}/matches`);
        if (data?.error) {
          Alert.alert("API Error", data.error);
          setHomeMatches([]);
          return;
        }
        matches = data.matches || [];
      }

      // Sort by date ascending
      matches.sort((a: any, b: any) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

      // Find the most recent match in the last 7 days (finished)
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentMatch = [...matches].reverse().find((m: any) => m.status === "FINISHED" && new Date(m.utcDate) >= oneWeekAgo && new Date(m.utcDate) <= now);

      // Find the next scheduled match (earliest upcoming match)
      const upcomingMatches = matches.filter((m: any) => {
        const matchDate = new Date(m.utcDate);
        // Include all possible upcoming match statuses
        const upcomingStatuses = ["SCHEDULED", "TIMED", "POSTPONED"];
        return upcomingStatuses.includes(m.status) && matchDate > now;
      });

      // Sort upcoming matches by date and get the earliest one
      upcomingMatches.sort((a: any, b: any) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
      const nextMatch = upcomingMatches[0];

      let selectedMatches: any[] = [];
      if (recentMatch && nextMatch) {
        selectedMatches = [recentMatch, nextMatch];
      } else if (recentMatch) {
        // If no next match, show recent and next closest (future)
        const futureMatches = matches.filter((m: any) => {
          const matchDate = new Date(m.utcDate);
          const upcomingStatuses = ["SCHEDULED", "TIMED", "POSTPONED"];
          return m.id !== recentMatch.id && matchDate > now && upcomingStatuses.includes(m.status);
        });
        futureMatches.sort((a: any, b: any) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
        const nextClosest = futureMatches[0];

        if (nextClosest) {
          selectedMatches = [recentMatch, nextClosest];
        } else {
          // Just show recent match
          selectedMatches = [recentMatch];
        }
      } else if (nextMatch) {
        // If no recent, show next two scheduled (earliest upcoming matches)
        const next2 = upcomingMatches.slice(0, 2);
        selectedMatches = next2;
      } else {
        // Fallback: show last two matches
        selectedMatches = matches.slice(-2);
      }
      setHomeMatches(selectedMatches);
    } catch (error) {
      Alert.alert("Fetch Error", "Failed to fetch football home matches");
      setHomeMatches([]);
    } finally {
      setLoadingHome(false);
    }
  };

  const fetchStatsData = async () => {
    // Create cache key based on competition and option
    const cacheKey = `${statsCompetition.id}_${statsOption}`;
    const now = Date.now();

    // Check if we have cached data that's still valid
    if (cachedStatsData[cacheKey] &&
      statsCacheTimestamps[cacheKey] &&
      (now - statsCacheTimestamps[cacheKey]) < STATS_CACHE_DURATION) {
      setStatsData(cachedStatsData[cacheKey]);
      return;
    }

    setLoadingStats(true);
    try {
      let processedData;

      if (statsOption === "Team Stats") {
        const standingsPromise = fetchFromApi(STATS_ENDPOINTS["Standings"](statsCompetition.id));
        const teamsPromise = fetchFromApi(STATS_ENDPOINTS["Team Stats"](statsCompetition.id));
        const [standingsData, teamsData] = await Promise.all([standingsPromise, teamsPromise]);

        if (
          standingsData?.standings &&
          Array.isArray(standingsData.standings) &&
          standingsData.standings[0]?.table &&
          Array.isArray(standingsData.standings[0].table) &&
          teamsData?.teams &&
          Array.isArray(teamsData.teams)
        ) {
          const teamsMap: Record<number, any> = {};
          teamsData.teams.forEach((team: any) => {
            teamsMap[team.id] = team;
          });

          processedData = standingsData.standings[0].table.map((entry: any) => {
            const teamInfo = teamsMap[entry.team.id] ?? {};
            return {
              id: entry.team.id,
              name: teamInfo.name ?? entry.team.name ?? "N/A",
              crest: teamInfo.crest ?? entry.team.crest ?? null,
              venue: teamInfo.venue ?? "N/A",
              played: entry.playedGames,
              wins: entry.won,
              draws: entry.draw,
              losses: entry.lost,
              goalsScored: entry.goalsFor,
              goalsConceded: entry.goalsAgainst,
            };
          });
        } else {
          processedData = [];
          console.warn("Team Stats: Unexpected API structure", { standingsData, teamsData });
        }
      }

      else {
        const endpoint = STATS_ENDPOINTS[statsOption](statsCompetition.id);
        const data = await fetchFromApi(endpoint, "?limit=32");

        if (data?.error) {
          Alert.alert("API Error", data.error);
          return;
        }

        if (statsOption === "Standings") {
          processedData = data.standings[0].table.map((team: any) => ({
            id: team.team.id,
            position: team.position,
            team: team.team,
            played: team.playedGames,
            wins: team.won,
            draws: team.draw,
            losses: team.lost,
            goalsFor: team.goalsFor,
            goalsAgainst: team.goalsAgainst,
            points: team.points,
          }));
        } else if (statsOption === "Top Scorer") {
          processedData = data.scorers.map((scorer: any) => {
            return {
              id: scorer.player.id,
              name: scorer.player.name,
              team: typeof scorer.team === 'object' ? scorer.team.name : scorer.team,
              goals: scorer.goals,
              crest: scorer.team?.crest ?? scorer.team?.logo ?? scorer.team?.crestUrl ?? null,
            };
          });
        }
      }

      cachedStatsData[cacheKey] = processedData;
      statsCacheTimestamps[cacheKey] = now;

      setStatsData(processedData);
    } catch (error) {
      console.error("Stats fetch error:", error);
      Alert.alert("Fetch Error", "Failed to fetch stats data");
    } finally {
      setLoadingStats(false);
    }
  };

  // Initialize all league matches data once per app session
  // Competition code to ID mapping
  const COMPETITION_CODE_TO_ID: { [key: string]: number } = {
    "PL": 2021,    // Premier League
    "PD": 2014,    // La Liga (Primera Division)
    "SA": 2019,    // Serie A
    "BL1": 2002,   // Bundesliga
    "FL1": 2015,   // Ligue 1
    "CL": 2001,    // Champions League
  };

  const initializeAllLeagueMatches = async () => {
    if (hasInitializedLeagueMatches || leagueMatchesInitPromise) {
      return leagueMatchesInitPromise || Promise.resolve();
    }

    leagueMatchesInitPromise = (async () => {
      const leagueIds = [2021, 2001, 2014, 2002, 2019, 2015]; // Premier League, La Liga, etc.
      const batchSize = 2; // Process 2 leagues at a time to avoid rate limiting
      const batches = [];

      for (let i = 0; i < leagueIds.length; i += batchSize) {
        batches.push(leagueIds.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const batchPromises = batch.map(async (competitionId) => {
          try {
            const data = await fetchFromApi(`competitions/${competitionId}/matches`);

            if (data?.error) {
              cachedAllLeagueMatches[competitionId.toString()] = [];
              return;
            }

            const allMatches = data.matches || [];
            // Sort by date
            allMatches.sort((a: any, b: any) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

            cachedAllLeagueMatches[competitionId.toString()] = allMatches;
          } catch (error) {
            cachedAllLeagueMatches[competitionId.toString()] = [];
          }
        });

        await Promise.all(batchPromises);

        // Add delay between batches
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }
      }

      hasInitializedLeagueMatches = true;
      leagueMatchesFetchTimestamp = Date.now();
    })();

    return leagueMatchesInitPromise;
  };

  const fetchMatchesData = async (subscribedMatchIds?: number[]) => {
    setLoadingMatches(true);
    try {
      // Handle special "Subscribed" filter - NO CACHING for subscribed matches
      if (matchesCompetition.id === "SUBSCRIBED") {
        await fetchSubscribedMatches(subscribedMatchIds);
        return;
      }

      // For regular league matches, use our comprehensive cache
      const competitionCode = matchesCompetition.id;
      const competitionId = COMPETITION_CODE_TO_ID[competitionCode];

      if (!competitionId) {
        console.warn(`Unknown competition code: ${competitionCode}`);
        setMatchesData([]);
        setLoadingMatches(false);
        return;
      }

      // Initialize all league matches if not done yet
      if (!hasInitializedLeagueMatches) {
        await initializeAllLeagueMatches();
      }

      // Check if we have cached data for this competition (using numeric ID as key)
      const cacheKey = competitionId.toString();
      if (cachedAllLeagueMatches[cacheKey]) {
        setMatchesData(cachedAllLeagueMatches[cacheKey]);
        setLoadingMatches(false);
        return;
      }

      const data = await fetchFromApi(`competitions/${competitionId}/matches`);

      if (data?.error) {
        Alert.alert("API Error", data.error);
        setMatchesData([]);
        return;
      }

      const allMatches = data.matches || [];
      allMatches.sort((a: any, b: any) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

      // Cache the result (using numeric ID as key for consistency)
      cachedAllLeagueMatches[competitionId.toString()] = allMatches;

      setMatchesData(allMatches);
    } catch (error) {
      Alert.alert("Fetch Error", "Failed to fetch matches");
    } finally {
      setLoadingMatches(false);
    }
  };

  // Fetch subscribed matches from provided match IDs and get their details
  const fetchSubscribedMatches = async (subscribedMatchIds?: number[]) => {
    try {
      // If no IDs provided, try to get from Firebase (fallback)
      let matchIds = subscribedMatchIds;
      if (!matchIds || matchIds.length === 0) {
        if (!user?.primaryEmailAddress?.emailAddress) {
          setMatchesData([]);
          return;
        }

        const userDocRef = doc(db, "users", user.primaryEmailAddress.emailAddress);
        const docSnap = await getDoc(userDocRef);

        if (!docSnap.exists()) {
          setMatchesData([]);
          return;
        }

        const userData = docSnap.data();
        matchIds = userData.subscribedMatches || [];
      }

      if (!matchIds || matchIds.length === 0) {
        setMatchesData([]);
        return;
      }

      // Always fetch fresh data for subscribed matches - no caching
      const matchDetails = [];
      for (const matchId of matchIds) {
        try {
          const matchData = await fetchFromApi(`matches/${matchId}`);
          if (matchData && !matchData.error) {
            // Handle different API response structures
            const match = matchData.match || matchData;
            if (match && match.id) {
              matchDetails.push(match);
            } else {
              console.log(`Match ${matchId} has invalid structure:`, matchData);
            }
          } else {
            console.log(`Match ${matchId} fetch failed:`, matchData?.error || 'Unknown error');
          }
        } catch (error) {
          console.error(`Failed to fetch match ${matchId}:`, error);
          // Continue with other matches even if one fails
        }
      }

      // Sort by date
      matchDetails.sort((a: any, b: any) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

      setMatchesData(matchDetails);
    } catch (error) {
      console.error("Error fetching subscribed matches:", error);
      setMatchesData([]);
    }
  };


  const fetchFavoriteStats = async () => {
    if (favoriteTeams.length === 0) {
      setFavoriteTeamsStats({});
      return;
    }

    const cacheKey = favoriteTeams.map(t => t.id).sort().join(',');
    const now = Date.now();

    if (cachedStatsData[`fav_${cacheKey}`] &&
      statsCacheTimestamps[`fav_${cacheKey}`] &&
      (now - statsCacheTimestamps[`fav_${cacheKey}`]) < STATS_CACHE_DURATION) {
      setFavoriteTeamsStats(cachedStatsData[`fav_${cacheKey}`]);
      return;
    }

    setLoadingFavStats(true);
    try {
      const allStats: Record<string, any> = {};

      for (const team of favoriteTeams) {
        const teamStats: Record<string, any> = {};

        // Check if we have this team's data cached
        if (cachedTeamDetails[team.id] &&
          teamDetailsCacheTimestamp &&
          (now - teamDetailsCacheTimestamp) < TEAM_DETAILS_CACHE_DURATION) {
          const data = cachedTeamDetails[team.id];
          teamStats.details = {
            id: data.id,
            name: data.name,
            crest: data.crest,
            address: data.address,
            founded: data.founded,
            venue: data.venue,
            coach: data.coach?.name || "Unknown",
            competitions: data.runningCompetitions?.map((c: any) =>
              c.name === "Primera Division" ? "La Liga" : c.name
            ) || [],
            squad: data.squad?.map((p: any) => `${p.name} (${p.position})`) || [],
          };
        } else {
          const data = await fetchFromApi(`teams/${team.id}`);
          if (data?.error) {
            teamStats.error = data.error;
          } else {
            teamStats.details = {
              id: data.id,
              name: data.name,
              crest: data.crest,
              address: data.address,
              founded: data.founded,
              venue: data.venue,
              coach: data.coach?.name || "Unknown",
              competitions: data.runningCompetitions?.map((c: any) =>
                c.name === "Primera Division" ? "La Liga" : c.name
              ) || [],
              squad: data.squad?.map((p: any) => `${p.name} (${p.position})`) || [],
            };
            // Cache team details
            cachedTeamDetails[team.id] = data;
            teamDetailsCacheTimestamp = now;
          }
        }

        allStats[team.name] = teamStats;
      }

      // Cache the processed stats
      cachedStatsData[`fav_${cacheKey}`] = allStats;
      statsCacheTimestamps[`fav_${cacheKey}`] = now;

      setFavoriteTeamsStats(allStats);
    } catch (error) {
      Alert.alert("Fetch Error", "Failed to fetch favorite stats");
    } finally {
      setLoadingFavStats(false);
    }
  };

  const addFavoriteTeam = async (teamName: string) => {
    if (!teamName) return null;
    try {
      // Bypass rate limiting for critical favorite team search
      const data = await fetchFromApi("teams", `?name=${encodeURIComponent(teamName)}`, true);

      if (data?.error || data.count === 0) {
        Alert.alert("Team Error", "Team not found");
        return null;
      }

      if (favoriteTeams.length >= 1) {
        Alert.alert("Limit", "Only 1 favorite teams allowed");
        return null;
      }

      return {
        id: data.teams[0].id,
        name: data.teams[0].name
      };
    } catch (error) {
      Alert.alert("Search Error", "Failed to search for team");
      return null;
    }
  };


  const COMPETITION_IDS = [2021, 2001, 2014, 2002, 2019, 2015];

  // Add timestamp for teams cache
  let teamsCacheTimestamp: number | null = null;
  const TEAMS_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for teams

  const fetchAllTeams = async () => {
    const now = Date.now();

    // Check if teams cache is still valid
    if (cachedTeams.length > 0 &&
      teamsCacheTimestamp &&
      (now - teamsCacheTimestamp) < TEAMS_CACHE_DURATION) {
      return cachedTeams;
    }

    const allTeamsMap = new Map<number, any>();
    for (const compId of COMPETITION_IDS) {
      try {
        const data = await fetchFromApi(`competitions/${compId}/teams`);
        if (data.teams) {
          data.teams.forEach((team: any) => {
            if (!allTeamsMap.has(team.id)) {
              allTeamsMap.set(team.id, team);
            }
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch teams for competition ${compId}:`, error);
      }
    }

    const teams = Array.from(allTeamsMap.values());
    cachedTeams = teams;
    teamsCacheTimestamp = now;

    return teams;
  };

  const searchTeams = async (query: string) => {
    if (!query || query.length < 2) {
      return [];
    }

    const lowerQuery = query.toLowerCase();

    try {
      const teams = await fetchAllTeams(); // This will use cache if available

      const filtered = teams.filter((team: any) =>
        team.name.toLowerCase().includes(lowerQuery)
      );

      return filtered.slice(0, 10);
    } catch (error) {
      return [];
    }
  };


  return {
    statsCompetition,
    setStatsCompetition,
    statsOption,
    setStatsOption,
    statsData,
    loadingStats,
    fetchStatsData,

    matchesCompetition,
    setMatchesCompetition,
    matchesData,
    setMatchesData,
    loadingMatches,
    fetchMatchesData,
    fetchSubscribedMatches,

    homeMatches,
    loadingHome,
    fetchHomeMatches,
    fetchFootballHomeMatches,
    initializeAllLeagueMatches,
    clearAllFootballCaches,
    clearFavoritePlayerCache,
    setValidPlayerInCache,
    getCachedFavoritePlayerData,
    refreshProfileDataFromCache,
    cleanExpiredCaches,

    favoriteTeams,
    setFavoriteTeams,
    favoriteTeamsStats,
    loadingFavStats,
    fetchFavoriteStats,
    addFavoriteTeam,
    searchTeams,

    // Favorite player
    favoritePlayerId,
    setFavoritePlayerId,
    favoritePlayerData,
    loadingFavoritePlayer,
    addFavoritePlayer,

    // Competitions arrays
    COMPETITIONS,
    MATCHES_COMPETITIONS,
  };
}
