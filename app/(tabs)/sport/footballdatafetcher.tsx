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
  const name = typeof team === "string" ? team : team?.shortName ?? team?.name ?? "N/A";
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

  // Load favorite teams from Firebase when component mounts
  useEffect(() => {
    const loadFavoriteTeams = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) return;

      try {
        const userDocRef = doc(db, "users", user.primaryEmailAddress.emailAddress);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists() && docSnap.data().favoriteTeams) {
          setFavoriteTeams(docSnap.data().favoriteTeams);
        }      } catch (error: any) {
        console.error("Error loading favorite teams:", error);
        Alert.alert("Error", "Failed to load favorite teams");
      }
    };

    loadFavoriteTeams();
  }, [user?.primaryEmailAddress?.emailAddress]);

  // Save favorite teams to Firebase whenever they change
  useEffect(() => {
    const saveFavoriteTeams = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) return;

      try {
        const userDocRef = doc(db, "users", user.primaryEmailAddress.emailAddress);
        await setDoc(userDocRef, { favoriteTeams }, { merge: true });      } catch (error: any) {
        console.error("Error saving favorite teams:", error);
        Alert.alert("Error", "Failed to save favorite teams");
      }
    };

    if (favoriteTeams.length > 0) {
      saveFavoriteTeams();
    }
  }, [favoriteTeams, user?.primaryEmailAddress?.emailAddress]);

  const fetchHomeMatches = async () => {
    setLoadingHome(true);
    try {
      const data = await fetchFromApi("matches", "?status=SCHEDULED&limit=5");
      if (data?.error) {
        Alert.alert("API Error", data.error);
        return;
      }
      setHomeMatches(data.matches || []);
    } catch (error) {
      Alert.alert("Fetch Error", "Failed to fetch home matches");
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
  };
}
