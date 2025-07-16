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

export function useFootballData() {
  const { user } = useUser();
  const [statsCompetition, setStatsCompetition] = useState(COMPETITIONS[0]);
  const [statsOption, setStatsOption] = useState("Standings");
  const [statsData, setStatsData] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [matchesCompetition, setMatchesCompetition] = useState(COMPETITIONS[0]);
  const [matchesData, setMatchesData] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const [homeMatches, setHomeMatches] = useState<any[]>([]);
  const [loadingHome, setLoadingHome] = useState(false);

  const [favoriteTeams, setFavoriteTeams] = useState<{ id: number; name: string }[]>([]);
  const [favoriteTeamsStats, setFavoriteTeamsStats] = useState<any>(null);
  const [loadingFavStats, setLoadingFavStats] = useState(false);

  // Favorite player logic
  const [favoritePlayerId, setFavoritePlayerId] = useState<number | null>(null);
  const [favoritePlayerData, setFavoritePlayerData] = useState<any>(null);
  const [loadingFavoritePlayer, setLoadingFavoritePlayer] = useState(false);

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

  // Fetch favorite player data when favoritePlayerId changes
  useEffect(() => {
    const fetchFavoritePlayerData = async () => {
      if (!favoritePlayerId) {
        setFavoritePlayerData(null);
        return;
      }
      setLoadingFavoritePlayer(true);
      try {
        const data = await fetchFromApi(`players/${favoritePlayerId}`);
        setFavoritePlayerData(data);
      } catch (error) {
        setFavoritePlayerData(null);
      } finally {
        setLoadingFavoritePlayer(false);
      }
    };
    fetchFavoritePlayerData();
  }, [favoritePlayerId]);
  // Add favorite player (similar to addFavoriteTeam)
  const addFavoritePlayer = async (playerName: string) => {
    if (!playerName) return null;
    try {
      const data = await fetchFromApi("players", `?name=${encodeURIComponent(playerName)}`);
      if (data?.error || !data.players || data.players.length === 0) {
        Alert.alert("Player Error", "Player not found");
        return null;
      }
      // Only allow one favorite player
      return data.players[0].id;
    } catch (error) {
      Alert.alert("Search Error", "Failed to search for player");
      return null;
    }
  };

  const fetchHomeMatches = async () => {
    setLoadingHome(true);
    try {
      // Get favorite team ID, default to 86 if not set
      const teamId = (favoriteTeams && favoriteTeams.length > 0 && favoriteTeams[0].id) ? favoriteTeams[0].id : 86;
      // Fetch all matches for the favorite team (both finished and scheduled)
      const data = await fetchFromApi(`teams/${teamId}/matches`);
      if (data?.error) {
        Alert.alert("API Error", data.error);
        setHomeMatches([]);
        return;
      }
      let matches = data.matches || [];
      // Sort by date ascending
      matches.sort((a: any, b: any) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

      // Find the most recent match in the last 7 days (finished)
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentMatch = [...matches].reverse().find((m: any) => m.status === "FINISHED" && new Date(m.utcDate) >= oneWeekAgo && new Date(m.utcDate) <= now);

      // Find the next scheduled match
      const nextMatch = matches.find((m: any) => m.status === "SCHEDULED" && new Date(m.utcDate) > now);

      let selectedMatches: any[] = [];
      if (recentMatch && nextMatch) {
        selectedMatches = [recentMatch, nextMatch];
      } else if (recentMatch) {
        // If no next match, show recent and next closest (future or past)
        const nextClosest = matches.find((m: any) => m.id !== recentMatch.id && new Date(m.utcDate) > now);
        if (nextClosest) {
          selectedMatches = [recentMatch, nextClosest];
        } else {
          // Just show recent match
          selectedMatches = [recentMatch];
        }
      } else if (nextMatch) {
        // If no recent, show next two scheduled
        const next2 = matches.filter((m: any) => m.status === "SCHEDULED" && new Date(m.utcDate) > now).slice(0, 2);
        selectedMatches = next2;
      } else {
        // Fallback: show last two matches
        selectedMatches = matches.slice(-2);
      }
      setHomeMatches(selectedMatches);
    } catch (error) {
      Alert.alert("Fetch Error", "Failed to fetch home matches");
      setHomeMatches([]);
    } finally {
      setLoadingHome(false);
    }
  };

  const fetchStatsData = async () => {
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

      setStatsData(processedData);
    } catch (error) {
      console.error("Stats fetch error:", error);
      Alert.alert("Fetch Error", "Failed to fetch stats data");
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchMatchesData = async () => {
    setLoadingMatches(true);
    try {
      const data = await fetchFromApi(
        `competitions/${matchesCompetition.id}/matches`
      );

      if (data?.error) {
        Alert.alert("API Error", data.error);
        return;
      }

      const allMatches = data.matches || [];

      // Optional: sort by date
      allMatches.sort((a: any, b: any) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

      setMatchesData(allMatches);
    } catch (error) {
      Alert.alert("Fetch Error", "Failed to fetch matches");
    } finally {
      setLoadingMatches(false);
    }
  };


  const fetchFavoriteStats = async () => {
    if (favoriteTeams.length === 0) {
      setFavoriteTeamsStats({});
      return;
    }

    setLoadingFavStats(true);
    try {
      const allStats: Record<string, any> = {};

      for (const team of favoriteTeams) {
        const teamStats: Record<string, any> = {};

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
        }

        allStats[team.name] = teamStats;
      }

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
      const data = await fetchFromApi("teams", `?name=${encodeURIComponent(teamName)}`);

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

  const fetchAllTeams = async () => {
    const allTeamsMap = new Map<number, any>();
    for (const compId of COMPETITION_IDS) {
      const data = await fetchFromApi(`competitions/${compId}/teams`);
      if (data.teams) {
        data.teams.forEach((team: any) => {
          if (!allTeamsMap.has(team.id)) {
            allTeamsMap.set(team.id, team);
          }
        });
      }
    }
    return Array.from(allTeamsMap.values());
  };

  const searchTeams = async (query: string) => {
    if (!query || query.length < 2) {
      return [];
    }

    const lowerQuery = query.toLowerCase();

    try {
      if (!cachedTeams || cachedTeams.length === 0) {
        cachedTeams = await fetchAllTeams();
      } else {
        console.log("Using cached teams");
      }

      const filtered = cachedTeams.filter((team: any) =>
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
    loadingMatches,
    fetchMatchesData,

    homeMatches,
    loadingHome,
    fetchHomeMatches,

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
  };
}
