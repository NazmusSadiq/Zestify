import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

// Season ID as requested
const SEASON_ID = 23614;
const BASE_URL = "https://api.sportmonks.com/v3/football";
const API_KEY = process.env.EXPO_PUBLIC_SPORTSMONKS_FOOTBALL_API_KEY;

type Standing = {
  position: number;
  participant: {
    data: {
      name: string;
    };
  };
  points: number;
  details: {
    data: {
      type_id: number;
      value: number;
    }[];
  };
  // You can expand the type here if needed for other included data
};

export default function PremierLeagueStandings() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStandings = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/standings/seasons/${SEASON_ID}?api_token=${API_KEY}&include=participant;rule.type;details.type;form;stage;league;group`
      );
      const json = await res.json();

      console.log("Full API response for season 23614:", JSON.stringify(json, null, 2)); // ✅ log entire response

      const data: Standing[] = json?.data || [];
      setStandings(data);
    } catch (error) {
      console.error("Error fetching standings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandings();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Season {SEASON_ID} Standings</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {standings.length === 0 ? (
            <Text>No standings found.</Text>
          ) : (
            standings.map((team, index) => {
              const played = team.details?.data?.find((d) => d.type_id === 130)?.value || 0;
              return (
                <View key={index} style={styles.card}>
                  <Text style={styles.team}>
                    {team.position}. {team.participant?.data?.name || "Unknown"}
                  </Text>
                  <Text style={styles.points}>Points: {team.points} | Played: {played}</Text>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E3A8A",
    textAlign: "center",
    marginBottom: 16,
  },
  scroll: {
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#E0F2FE",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  team: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0C4A6E",
  },
  points: {
    fontSize: 14,
    color: "#334155",
  },
});
