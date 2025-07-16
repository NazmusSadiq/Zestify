import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { useCricketData } from "./cricketdatafetcher";

const TABS = ["Series", "Matches", "Stats", "Favorite"];
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


  const {
    matchesData,
    loadingMatches,
    selectedCompetition,
    setSelectedCompetition,
    getMatchScorecard,
    seriesData,
    loadingSeries
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

  // Football-style tab bar and overlay button
  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexGrow: 1 }}>
          {/* Show three lines button only for Matches or Stats tab, now on the left */}
          {(activeTab === 'Matches' || activeTab === 'Stats') && (
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
                  (activeTab !== 'Matches' && activeTab !== 'Stats') && { flex: 1, minWidth: undefined }
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
                {seriesData.map((series: any) => (
                  <View key={series.id || series.seriesId} style={styles.matchCard}>
                    <Text style={styles.matchTitle}>{series.name || series.seriesName || 'Unknown Series'}</Text>
                    <Text style={styles.matchDetail}>{series.startDate || series.startDateTime || ''} {series.venue ? `| ${series.venue}` : ''}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
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
          </View>
        )}
        {/* Other tabs remain the same */}
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
    flexDirection: 'row',
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
    top: 5,
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
});
