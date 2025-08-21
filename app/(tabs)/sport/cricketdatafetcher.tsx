import { fetchCricketApi, fetchMatchScorecard, fetchSeriesInfo } from "@/services/cricket_API";
import * as FileSystem from 'expo-file-system';
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
// Local file path for storing country flags
const FLAGS_FILE_PATH = FileSystem.documentDirectory + "cricket_flags.json";

// Fetch and cache all country flags using the API rotation system
export async function fetchAndCacheCountryFlags() {
  const data = await fetchCricketApi("countries");
  if (data?.error) throw new Error(data.error);
  if (!Array.isArray(data)) throw new Error('Failed to fetch countries');
  
  // Store only id, name, and img
  const flags = data.map((c: any) => ({
    id: c.id,
    name: c.name,
    img: c.img
  }));
  await FileSystem.writeAsStringAsync(FLAGS_FILE_PATH, JSON.stringify(flags));
  return flags;
}

// Get country flags from local file (or fetch/cache if not present)
export async function getCountryFlags() {
  try {
    const fileInfo = await FileSystem.getInfoAsync(FLAGS_FILE_PATH);
    if (fileInfo.exists) {
      const jsonStr = await FileSystem.readAsStringAsync(FLAGS_FILE_PATH);
      return JSON.parse(jsonStr);
    } else {
      return await fetchAndCacheCountryFlags();
    }
  } catch (e) {
    // On error, try to fetch and cache again
    return await fetchAndCacheCountryFlags();
  }
}

let cachedTeams: any[] = [];

// Global cache for all matches - persists for entire app lifetime
let globalAllMatches: any[] = [];
let hasGloballyFetchedMatches = false;
let globalMatchesFetchPromise: Promise<void> | null = null;

export function useCricketData() {
  const [matchesData, setMatchesData] = useState<any[]>([]);
  const [allMatchesData, setAllMatchesData] = useState<any[]>(globalAllMatches); // Initialize with cached data
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState("Current Matches");

  const [seriesData, setSeriesData] = useState<any[]>([]);
  const [loadingSeries, setLoadingSeries] = useState(false);

  const [statsData, setStatsData] = useState<any>({
    topRunScorers: [],
    topWicketTakers: [],
    topTeams: []
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // For hardcoded stats tab fetch
  const [statsMatches, setStatsMatches] = useState<any[]>([]);
  const [loadingStatsMatches, setLoadingStatsMatches] = useState(false);

  const [favoriteTeam, setFavoriteTeam] = useState<any>(null);
  const [favoriteMatches, setFavoriteMatches] = useState<any[]>([]);
  const [loadingFavorite, setLoadingFavorite] = useState(false);

  // Home matches for carousel
  const [homeMatches, setHomeMatches] = useState<any[]>([]);
  const [loadingHome, setLoadingHome] = useState(false);

  const fetchAllPages = async (endpoint: string, maxPages: number = 10) => {
    let results: any[] = [];
    let offset = 0;
    for (let i = 0; i < maxPages; i++) {
      const page = await fetchCricketApi(endpoint, `&offset=${offset}`);
      if (Array.isArray(page) && page.length > 0) {
        results = results.concat(page);
        offset += page.length;
        if (page.length < 20) break; 
      } else {
        break;
      }
    }
    return results;
  };

  // One-time global fetch function for all matches cache
  const initializeAllMatchesCache = async () => {
    if (hasGloballyFetchedMatches || globalMatchesFetchPromise) {
      return globalMatchesFetchPromise || Promise.resolve();
    }
    
    console.log("🏏 Starting initialization of all matches cache");
    
    globalMatchesFetchPromise = (async () => {
      try {
        const all = await fetchAllPages("matches", 10);
        const matchesArray = Array.isArray(all) ? all : [];
        globalAllMatches = matchesArray;
        hasGloballyFetchedMatches = true;
        setAllMatchesData(matchesArray);
        console.log(`🏏 Successfully cached ${matchesArray.length} cricket matches`);
      } catch (error) {
        console.error("🏏 Failed to initialize matches cache:", error);
        globalAllMatches = [];
        setAllMatchesData([]);
        const errorMessage = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
        Alert.alert("Cache Error", "Failed to cache cricket matches: " + errorMessage);
      }
    })();
    
    return globalMatchesFetchPromise;
  };

  // Fetch all matches once when Matches tab is loaded (deprecated - now using cache)
  const fetchAllMatchesOnce = async () => {
    // If cache is already initialized, use cached data
    if (hasGloballyFetchedMatches) {
      setAllMatchesData(globalAllMatches);
      setMatchesData(globalAllMatches);
      return;
    }
    
    // Otherwise initialize cache
    setLoadingMatches(true);
    try {
      await initializeAllMatchesCache();
      // Default to all matches view
      setMatchesData(globalAllMatches);
    } catch (error) {
      setMatchesData([]);
    } finally {
      setLoadingMatches(false);
    }
  };

const CRICKET_COUNTRIES = [
  "afghanistan", "australia", "bangladesh", "england", "india", "ireland", "new zealand", "pakistan", "south africa", "sri lanka", "west indies", "zimbabwe", "netherlands", "scotland", "namibia", "uae", "oman", "nepal", "usa", "canada"
];

  // Filter matches from cached globalAllMatches
  const filterMatches = (competition: string) => {
    const dataToFilter = hasGloballyFetchedMatches ? globalAllMatches : allMatchesData;
    if (!Array.isArray(dataToFilter) || dataToFilter.length === 0) return [];
    
    if (competition === "All Matches") {
      return dataToFilter;
    } else if (competition === "Upcoming Matches") {
      return dataToFilter.filter((match: any) => {
        const status = (match.status || "").toString().toLowerCase();
        if (typeof match.matchStarted === 'boolean') {
          return match.matchStarted === false;
        }
        if (status.includes('not started') || status.includes('upcoming') || status.includes('scheduled')) {
          return true;
        }
        if (match.dateTimeGMT) {
          const matchTime = new Date(match.dateTimeGMT).getTime();
          return matchTime > Date.now();
        }
        return false;
      });
    } else if (competition === "International Matches") {
      // Only show matches where both teams are in the cricket countries list
      // This is async, so we need to handle it in useEffect below
      return dataToFilter; // placeholder, will filter in useEffect
    } else if (["Test", "ODI", "T20"].includes(competition)) {
      const type = competition.toLowerCase();
      return dataToFilter.filter((match: any) => {
        const matchType = (match.matchType || match.matchtype || '').toString().toLowerCase();
        return matchType === type;
      });
    } else {
      return dataToFilter.filter((m: any) =>
        m.series?.toLowerCase().includes(competition.toLowerCase()) ||
        m.name?.toLowerCase().includes(competition.toLowerCase())
      );
    }
  };

  // Fetch subscribed matches from cache
  const fetchSubscribedMatches = useCallback(async (subscribedMatchIds?: string[]) => {
    setLoadingMatches(true);
    try {
      if (!subscribedMatchIds || subscribedMatchIds.length === 0) {
        setMatchesData([]);
        return;
      }

      // Ensure cache is initialized
      if (!hasGloballyFetchedMatches) {
        console.log("🏏 Cache not initialized, initializing first...");
        await initializeAllMatchesCache();
      }

      // Filter globalAllMatches to show only subscribed matches
      if (globalAllMatches.length > 0) {
        const subscribedMatches = globalAllMatches.filter((match: any) => 
          subscribedMatchIds.includes(match.id || match.matchId)
        );
        setMatchesData(subscribedMatches);
        console.log(`🏏 Extracted ${subscribedMatches.length} subscribed matches from cache`);
      } else {
        // If cache is empty, just show empty
        setMatchesData([]);
        console.log("🏏 No cached matches available for subscribed filter");
      }
    } catch (error) {
      setMatchesData([]);
      console.error("🏏 Error fetching subscribed matches:", error);
    } finally {
      setLoadingMatches(false);
    }
  }, []);

  // When selectedCompetition changes, filter from cached data
  useEffect(() => {
    if (selectedCompetition === "Subscribed") {
      // Handle subscribed matches - this will be called from cricket.tsx with subscribedMatchIds
      // For now, just show empty until called with proper IDs
      setMatchesData([]);
    } else if (selectedCompetition === "Current Matches") {
      // Current Matches is a live API call
      const fetchCurrent = async () => {
        setLoadingMatches(true);
        try {
          const data = await fetchCricketApi("currentMatches");
          setMatchesData(Array.isArray(data) ? data : []);
          console.log(`🏏 Fetched ${Array.isArray(data) ? data.length : 0} current matches`);
        } catch (error) {
          setMatchesData([]);
          console.error("🏏 Error fetching current matches:", error);
        } finally {
          setLoadingMatches(false);
        }
      };
      fetchCurrent();
    } else if (selectedCompetition === "International Matches") {
      // Filter using hardcoded cricket countries from cache
      setLoadingMatches(true);
      try {
        const dataToFilter = hasGloballyFetchedMatches ? globalAllMatches : allMatchesData;
        const filtered = dataToFilter.filter((match: any) => {
          if (!Array.isArray(match.teams) || match.teams.length !== 2) return false;
          const t1 = (match.teams[0] || '').toString().toLowerCase();
          const t2 = (match.teams[1] || '').toString().toLowerCase();
          return CRICKET_COUNTRIES.includes(t1) && CRICKET_COUNTRIES.includes(t2);
        });
        setMatchesData(filtered);
        console.log(`🏏 Filtered ${filtered.length} international matches from cache`);
      } catch {
        setMatchesData([]);
        console.log("🏏 Error filtering international matches");
      } finally {
        setLoadingMatches(false);
      }
    } else {
      const filtered = filterMatches(selectedCompetition);
      setMatchesData(filtered);
      console.log(`🏏 Filtered ${filtered.length} matches for ${selectedCompetition} from cache`);
    }
  }, [selectedCompetition]); // Removed allMatchesData dependency to prevent infinite loops

  // Fetch all matches once on mount (when Matches tab is loaded)
  useEffect(() => {
    fetchAllMatchesOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize matches cache on component mount
  useEffect(() => {
    if (!hasGloballyFetchedMatches) {
      console.log("🏏 Starting background initialization of matches cache");
      initializeAllMatchesCache().catch(error => {
        console.error("Failed to initialize cricket matches cache:", error);
      });
    }
  }, []);

  const fetchSeriesData = async () => {
    setLoadingSeries(true);
    try {
      const data = await fetchCricketApi("series");
      if (data?.error) {
        Alert.alert("API Error", data.error);
        return;
      }
      setSeriesData(data || []);
    } catch (error) {
      const errorMessage = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      Alert.alert("Fetch Error", "Failed to fetch series,error: " + errorMessage);
    } finally {
      setLoadingSeries(false);
    }
  };

  const fetchStatsData = async () => {
    setLoadingStats(true);
    setLoadingStatsMatches(true);
    try {
      // Use the proper API rotation system instead of hardcoded key
      const data = await fetchCricketApi("currentMatches");
      if (data?.error) {
        setStatsMatches([]);
      } else {
        setStatsMatches(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      setStatsMatches([]);
    } finally {
      setLoadingStats(false);
      setLoadingStatsMatches(false);
    }
  };

  const fetchFavoriteData = async () => {
    if (!favoriteTeam) {
      setFavoriteMatches([]);
      return;
    }

    setLoadingFavorite(true);
    try {
      const data = await fetchCricketApi(`teams/${favoriteTeam.id}/matches`);
      setFavoriteMatches(data || []);
    } catch (error) {
      const errorMessage = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      Alert.alert("Fetch Error", "Failed to fetch matches,error: " + errorMessage);
    } finally {
      setLoadingFavorite(false);
    }
  };

  const addFavoriteTeam = async (teamName: string) => {
    if (!teamName) return null;
    try {
      const teams = await searchTeams(teamName);
      if (teams.length === 0) {
        Alert.alert("Team Error", "Team not found");
        return null;
      }
      return teams[0];
    } catch (error) {
      const errorMessage = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      Alert.alert("Fetch Error", "Failed to fetch matches,error: " + errorMessage);
      return null;
    }
  };

  const fetchAllTeams = async () => {
    try {
      const data = await fetchCricketApi("teams");
      return data || [];
    } catch (error) {
      return [];
    }
  };

  const searchTeams = async (query: string) => {
    if (!query || query.length < 2) return [];

    const lowerQuery = query.toLowerCase();
    try {
      if (cachedTeams.length === 0) {
        cachedTeams = await fetchAllTeams();
      }

      return cachedTeams.filter((team: any) =>
        team.name.toLowerCase().includes(lowerQuery)
      ).slice(0, 10);
    } catch (error) {
      return [];
    }
  };

  const getMatchScorecard = async (matchId: string) => {
    try {
      const data = await fetchMatchScorecard(matchId);
      return data;
    } catch (err) {
      return { error: true };
    }
  };

  const getSeriesInfo = async (seriesId: string) => {
    try {
      const data = await fetchSeriesInfo(seriesId);
      return data;
    } catch (err) {
      return { error: true };
    }
  };

  // Fetch home matches for carousel (international matches in next 3 days from cache)
  const fetchHomeMatches = useCallback(async () => {
    setLoadingHome(true);
    try {
      // Ensure cache is initialized
      if (!hasGloballyFetchedMatches) {
        console.log("🏏 Cache not initialized, initializing first for home matches...");
        await initializeAllMatchesCache();
      }

      // Get current time and 3 days from now
      const now = Date.now();
      const threeDaysFromNow = now + (3 * 24 * 60 * 60 * 1000); // 3 days in milliseconds

      // Filter for international matches from cached data
      const dataToFilter = globalAllMatches;
      const internationalMatches = dataToFilter.filter((match: any) => {
        if (!Array.isArray(match.teams) || match.teams.length !== 2) return false;
        const t1 = (match.teams[0] || '').toString().toLowerCase();
        const t2 = (match.teams[1] || '').toString().toLowerCase();
        return CRICKET_COUNTRIES.includes(t1) && CRICKET_COUNTRIES.includes(t2);
      });

      // Filter for matches in the next 3 days only
      const next3DaysMatches = internationalMatches.filter((match: any) => {
        // Check if match is not started/finished
        const status = (match.status || "").toString().toLowerCase();
        if (typeof match.matchStarted === 'boolean' && match.matchStarted === true) {
          return false; // Skip started matches
        }
        if (status.includes('finished') || status.includes('completed')) {
          return false; // Skip finished matches
        }

        // Check if match is within next 3 days
        if (match.dateTimeGMT) {
          const matchTime = new Date(match.dateTimeGMT).getTime();
          return matchTime >= now && matchTime <= threeDaysFromNow;
        }
        return false;
      });

      let homeMatchesData: any[] = [];
      
      if (next3DaysMatches.length > 0) {
        // Sort by date ascending and take up to 15 matches
        next3DaysMatches.sort((a: any, b: any) => {
          const dateA = new Date(a.dateTimeGMT || a.date || 0).getTime();
          const dateB = new Date(b.dateTimeGMT || b.date || 0).getTime();
          return dateA - dateB;
        });
        homeMatchesData = next3DaysMatches.slice(0, 15);
        console.log(`🏏 Found ${homeMatchesData.length} international matches in next 3 days for home carousel`);
      } else {
        // Fallback: Get next 3 upcoming international matches regardless of date
        console.log("🏏 No matches in next 3 days, falling back to next upcoming international matches");
        
        const upcomingInternationalMatches = internationalMatches.filter((match: any) => {
          // Check if match is not started/finished
          const status = (match.status || "").toString().toLowerCase();
          if (typeof match.matchStarted === 'boolean' && match.matchStarted === true) {
            return false; // Skip started matches
          }
          if (status.includes('finished') || status.includes('completed')) {
            return false; // Skip finished matches
          }

          // Check if match is in the future
          if (match.dateTimeGMT) {
            const matchTime = new Date(match.dateTimeGMT).getTime();
            return matchTime >= now;
          }
          return false;
        });

        // Sort by date ascending and take first 3 matches
        upcomingInternationalMatches.sort((a: any, b: any) => {
          const dateA = new Date(a.dateTimeGMT || a.date || 0).getTime();
          const dateB = new Date(b.dateTimeGMT || b.date || 0).getTime();
          return dateA - dateB;
        });
        
        homeMatchesData = upcomingInternationalMatches.slice(0, 3);
        console.log(`🏏 Fallback: Found ${homeMatchesData.length} upcoming international matches for home carousel`);
      }

      setHomeMatches(homeMatchesData);
      console.log(`🏏 Extracted ${homeMatchesData.length} international matches for home carousel from cache`);
    } catch (error) {
      console.error("🏏 Error extracting home matches from cache:", error);
      setHomeMatches([]);
    } finally {
      setLoadingHome(false);
    }
  }, []);



  return {
    matchesData,
    loadingMatches,
    setMatchesData,

    seriesData,
    loadingSeries,
    fetchSeriesData,

    statsData,
    loadingStats,
    fetchStatsData,

    statsMatches,
    loadingStatsMatches,

    favoriteTeam,
    setFavoriteTeam,
    favoriteMatches,
    loadingFavorite,
    fetchFavoriteData,

    homeMatches,
    loadingHome,
    fetchHomeMatches,

    addFavoriteTeam,
    searchTeams,

    selectedCompetition,
    setSelectedCompetition,

    getMatchScorecard,
    getSeriesInfo,
    fetchSubscribedMatches,
  };
}
