import { fetchCricketApi, fetchMatchScorecard, fetchSeriesInfo } from "@/services/cricket_API";
import * as FileSystem from 'expo-file-system';
import { useEffect, useState } from "react";
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


export function useCricketData() {
  const [matchesData, setMatchesData] = useState<any[]>([]);
  const [allMatchesData, setAllMatchesData] = useState<any[]>([]); // cache all matches
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

  // Helper to fetch multiple pages
  const fetchAllPages = async (endpoint: string, maxPages: number = 20) => {
    let results: any[] = [];
    let offset = 0;
    for (let i = 0; i < maxPages; i++) {
      const page = await fetchCricketApi(endpoint, `&offset=${offset}`);
      if (Array.isArray(page) && page.length > 0) {
        results = results.concat(page);
        offset += page.length;
        if (page.length < 20) break; // API returns less than 20, likely last page
      } else {
        break;
      }
    }
    return results;
  };

  // Fetch all matches once when Matches tab is loaded
  const fetchAllMatchesOnce = async () => {
    setLoadingMatches(true);
    try {
      const all = await fetchAllPages("matches", 20);
      setAllMatchesData(Array.isArray(all) ? all : []);
      // Default to all matches view
      setMatchesData(Array.isArray(all) ? all : []);
    } catch (error) {
      setAllMatchesData([]);
      setMatchesData([]);
      const errorMessage = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      Alert.alert("Fetch Error", "Failed to fetch matches,error: " + errorMessage);
    } finally {
      setLoadingMatches(false);
    }
  };

const CRICKET_COUNTRIES = [
  "afghanistan", "australia", "bangladesh", "england", "india", "ireland", "new zealand", "pakistan", "south africa", "sri lanka", "west indies", "zimbabwe", "netherlands", "scotland", "namibia", "uae", "oman", "nepal", "usa", "canada"
];

  // Filter matches from cached allMatchesData
  const filterMatches = (competition: string) => {
    if (!Array.isArray(allMatchesData) || allMatchesData.length === 0) return [];
    if (competition === "All Matches") {
      return allMatchesData;
    } else if (competition === "Upcoming Matches") {
      return allMatchesData.filter((match: any) => {
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
      return allMatchesData; // placeholder, will filter in useEffect
    } else if (["Test", "ODI", "T20"].includes(competition)) {
      const type = competition.toLowerCase();
      return allMatchesData.filter((match: any) => {
        const matchType = (match.matchType || match.matchtype || '').toString().toLowerCase();
        return matchType === type;
      });
    } else {
      return allMatchesData.filter((m: any) =>
        m.series?.toLowerCase().includes(competition.toLowerCase()) ||
        m.name?.toLowerCase().includes(competition.toLowerCase())
      );
    }
  };

  // When selectedCompetition changes, filter from allMatchesData
  useEffect(() => {
    if (selectedCompetition === "Current Matches") {
      // Current Matches is a live API call
      const fetchCurrent = async () => {
        setLoadingMatches(true);
        try {
          const data = await fetchCricketApi("currentMatches");
          setMatchesData(Array.isArray(data) ? data : []);
        } catch (error) {
          setMatchesData([]);
        } finally {
          setLoadingMatches(false);
        }
      };
      fetchCurrent();
    } else if (selectedCompetition === "International Matches") {
      // Filter using hardcoded cricket countries
      setLoadingMatches(true);
      try {
        const filtered = allMatchesData.filter((match: any) => {
          if (!Array.isArray(match.teams) || match.teams.length !== 2) return false;
          const t1 = (match.teams[0] || '').toString().toLowerCase();
          const t2 = (match.teams[1] || '').toString().toLowerCase();
          return CRICKET_COUNTRIES.includes(t1) && CRICKET_COUNTRIES.includes(t2);
        });
        setMatchesData(filtered);
      } catch {
        setMatchesData([]);
      } finally {
        setLoadingMatches(false);
      }
    } else {
      setMatchesData(filterMatches(selectedCompetition));
    }
  }, [selectedCompetition, allMatchesData]);

  // Fetch all matches once on mount (when Matches tab is loaded)
  useEffect(() => {
    fetchAllMatchesOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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



  return {
    matchesData,
    loadingMatches,

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

    addFavoriteTeam,
    searchTeams,

    selectedCompetition,
    setSelectedCompetition,

    getMatchScorecard,
    getSeriesInfo,
  };
}
