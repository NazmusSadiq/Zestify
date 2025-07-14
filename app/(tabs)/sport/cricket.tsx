import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useCricketData } from "./cricketdatafetcher";

const TABS = ["Matches", "Series", "Stats", "Favorite"];
const MATCH_CATEGORIES = [
  "Current Matches",
  "World Cup ODI",
  "World Cup T20",
  "IPL",
  "BPL",
  "Big Bash",
  "CPL",
  "T10"
];

export default function Cricket() {
  const [activeTab, setActiveTab] = useState("Matches");
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [matchDetail, setMatchDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const {
    matchesData,
    loadingMatches,
    selectedCompetition,
    setSelectedCompetition,
    getMatchScorecard
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

  const renderMatchCard = (match: any) => (
    <TouchableOpacity key={match.id} style={styles.matchCard} onPress={() => setSelectedMatch(match)}>
      <Text style={styles.matchTitle}>{match.name}</Text>
      <Text style={styles.matchStatus}>{match.status}</Text>
      <Text style={styles.matchDetail}>{match.date} | {match.venue}</Text>
      {match.score?.map((s: any, idx: number) => (
        <Text key={idx} style={styles.matchDetail}>
          {s.inning}: {s.r}/{s.w} in {s.o} overs
        </Text>
      ))}
    </TouchableOpacity>
  );

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

  const renderMatchesTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.leftTray}>
        {MATCH_CATEGORIES.map((label) => (
          <TouchableOpacity
            key={label}
            onPress={() => setSelectedCompetition(label)}
            style={[
              styles.trayItem,
              selectedCompetition === label && styles.trayItemSelected
            ]}
          >
            <Text
              style={[
                styles.trayItemText,
                selectedCompetition === label && styles.trayItemTextSelected
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.matchList}>
        {loadingMatches ? (
          <ActivityIndicator size="large" color="#3B82F6" />
        ) : matchesData.length === 0 ? (
          <Text style={styles.noDataText}>No matches found</Text>
        ) : (
          <ScrollView>{matchesData.map(renderMatchCard)}</ScrollView>
        )}
      </View>

      {renderMatchModal()}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {activeTab === "Matches" && renderMatchesTab()}
        {/* Other tabs remain the same */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#1B2631",
    paddingVertical: 10
  },
  tabButton: {
    padding: 10,
    backgroundColor: "#1e293b",
    borderRadius: 10
  },
  activeTabButton: {
    backgroundColor: "#fff"
  },
  tabText: {
    color: "#fff",
    fontSize: 14
  },
  activeTabText: {
    color: "#000",
    fontWeight: "bold"
  },
  content: {
    flex: 1,
    flexDirection: "row"
  },
  tabContent: {
    flex: 1,
    flexDirection: "row"
  },
  leftTray: {
    width: 120,
    backgroundColor: "#0f172a",
    paddingTop: 10
  },
  trayItem: {
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  trayItemSelected: {
    backgroundColor: "#3B82F6",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10
  },
  trayItemText: {
    color: "#cbd5e1"
  },
  trayItemTextSelected: {
    color: "#fff",
    fontWeight: "bold"
  },
  matchList: {
    flex: 1,
    padding: 10
  },
  matchCard: {
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10
  },
  matchTitle: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600"
  },
  matchStatus: {
    color: "#facc15",
    fontWeight: "500",
    marginTop: 4
  },
  matchDetail: {
    color: "#cbd5e1",
    fontSize: 12,
    marginTop: 2
  },
  noDataText: {
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 20
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 15
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 10
  },
  closeText: {
    color: "#3B82F6",
    fontSize: 16
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4
  },
  modalSub: {
    color: "#94a3b8",
    fontSize: 12,
    marginBottom: 4
  },
  flag: {
    width: 32,
    height: 20,
    marginRight: 8
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10
  },
  teamName: {
    color: "#f8fafc",
    fontSize: 14
  },
  scoreLine: {
    color: "#fbbf24",
    fontSize: 14,
    marginTop: 6
  },
  inningSection: {
    marginTop: 16
  },
  inningTitle: {
    color: "#f8fafc",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 6
  },
  subHeading: {
    color: "#94a3b8",
    fontWeight: "600",
    marginTop: 8
  },
  playerStat: {
    color: "#e2e8f0",
    fontSize: 13
  }
});
