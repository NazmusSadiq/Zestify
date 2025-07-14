import { fetchCricketApi, fetchMatchScorecard } from "@/services/cricket_API";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

let cachedTeams: any[] = [];

export function useCricketData() {
  const [matchesData, setMatchesData] = useState<any[]>([]);
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

  const [favoriteTeam, setFavoriteTeam] = useState<any>(null);
  const [favoriteMatches, setFavoriteMatches] = useState<any[]>([]);
  const [loadingFavorite, setLoadingFavorite] = useState(false);

  const fetchMatchesData = async () => {
    setLoadingMatches(true);
    try {
      const endpoint = selectedCompetition === "Current Matches" ? "currentMatches" : "matches";
      const allMatches = await fetchCricketApi(endpoint);

      const filtered = selectedCompetition === "Current Matches"
        ? allMatches
        : allMatches.filter((m: any) =>
            m.series?.toLowerCase().includes(selectedCompetition.toLowerCase()) ||
            m.name?.toLowerCase().includes(selectedCompetition.toLowerCase())
          );

      setMatchesData(filtered);
    } catch (error) {
      Alert.alert("Fetch Error", "Failed to fetch matches");
    } finally {
      setLoadingMatches(false);
    }
  };

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
      Alert.alert("Fetch Error", "Failed to fetch series");
    } finally {
      setLoadingSeries(false);
    }
  };

  const fetchStatsData = async () => {
    setLoadingStats(true);
    try {
      const [runScorers, wicketTakers, teams] = await Promise.all([
        fetchCricketApi("stats/run-scorers"),
        fetchCricketApi("stats/wicket-takers"),
        fetchCricketApi("stats/teams")
      ]);

      setStatsData({
        topRunScorers: runScorers || [],
        topWicketTakers: wicketTakers || [],
        topTeams: teams || []
      });
    } catch (error) {
      Alert.alert("Fetch Error", "Failed to fetch stats");
    } finally {
      setLoadingStats(false);
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
      Alert.alert("Fetch Error", "Failed to fetch favorite matches");
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
      Alert.alert("Search Error", "Failed to search for team");
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

  useEffect(() => {
    fetchMatchesData();
  }, [selectedCompetition]);

  return {
    matchesData,
    loadingMatches,
    fetchMatchesData,

    seriesData,
    loadingSeries,
    fetchSeriesData,

    statsData,
    loadingStats,
    fetchStatsData,

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
  };
}
