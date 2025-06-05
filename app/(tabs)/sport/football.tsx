import { COMPETITIONS, STATS_OPTIONS } from "@/services/fotball_API";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getTeamWithCrest, useFootballData } from "./footballdatafetcher";

const tabs = ["Home", "Stats", "Matches", "Favorite"];

export default function Football() {
  const [activeTab, setActiveTab] = useState<"Home" | "Stats" | "Matches" | "Favorite">("Home");
  const [statsLeftTrayOpen, setStatsLeftTrayOpen] = useState(false);
  const [matchesLeftTrayOpen, setMatchesLeftTrayOpen] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimeout = useRef<number | null>(null);

  const onSearchInputChange = (query: string) => {
    setSearchQuery(query);
  };

  const {
    statsCompetition, setStatsCompetition, statsOption, setStatsOption, statsData, loadingStats, fetchStatsData,
    matchesCompetition, setMatchesCompetition, matchesData, loadingMatches, fetchMatchesData, homeMatches, loadingHome,
    fetchHomeMatches, favoriteTeams, setFavoriteTeams, favoriteTeamsStats, loadingFavStats, fetchFavoriteStats, addFavoriteTeam, searchTeams
  } = useFootballData();

  useEffect(() => {
    if (activeTab === "Home") fetchHomeMatches();
    if (activeTab === "Stats") fetchStatsData();
    if (activeTab === "Matches") fetchMatchesData();
    if (activeTab === "Favorite") fetchFavoriteStats();
  }, [activeTab, statsCompetition, statsOption, matchesCompetition, favoriteTeams]);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      const teams = await searchTeams(searchQuery);
      setSearchResults(teams);
      setIsSearching(false);
    }, 500);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchQuery]);


  const renderHome = () => (
    <View style={styles.tabContent}>
      {loadingHome ? (
        <ActivityIndicator size="large" color="#3B82F6" />
      ) : homeMatches.length === 0 ? (
        <Text style={styles.noDataText}>No upcoming matches found</Text>
      ) : (
        <ScrollView style={styles.scrollContainer}>
          {homeMatches.map((match: any) => (
            <View key={match.id} style={styles.matchCard}>
              <Text style={styles.matchTitle}>
                {match.homeTeam?.name || "Unknown"} vs {match.awayTeam?.name || "Unknown"}
              </Text>
              <Text style={styles.matchDetail}>
                {match.utcDate ? new Date(match.utcDate).toLocaleString() : "Date not available"}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      {!statsLeftTrayOpen ? (
        <TouchableOpacity
          style={styles.openTrayButton}
          onPress={() => setStatsLeftTrayOpen(true)}
        >
          <Text style={styles.openButtonText}>☰</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.leftTray}>
          <TouchableOpacity
            onPress={() => setStatsLeftTrayOpen(false)}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>◀</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Competitions</Text>
          <View>
            {COMPETITIONS.map((comp) => (
              <TouchableOpacity
                key={comp.id}
                onPress={() => setStatsCompetition(comp)}
                style={[
                  styles.competitionButton,
                  statsCompetition.id === comp.id && styles.activeCompetitionButton
                ]}
              >
                <Text style={[
                  styles.tabText,
                  statsCompetition.id === comp.id && styles.activeTabText
                ]}>
                  {comp.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Options</Text>
          <View>
            {STATS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => setStatsOption(opt)}
                style={[
                  styles.optionButton,
                  statsOption === opt && styles.activeOptionButton
                ]}
              >
                <Text style={[
                  styles.tabText,
                  statsOption === opt && styles.activeTabText
                ]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.statsContent}>
        {loadingStats ? (
          <ActivityIndicator size="large" color="#3B82F6" />
        ) : statsData ? (
          <ScrollView style={styles.scrollContainer}>
            <Text style={styles.statsHeader}>
              {statsCompetition.name} - {statsOption}
            </Text>

            {statsOption === "Standings" && (
              <View style={styles.table}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableHeader}></Text>
                  <Text style={[styles.tableHeader, { flex: 7 }]}>Team</Text>
                  <Text style={styles.tableHeader}>P</Text>
                  <Text style={styles.tableHeader}>W</Text>
                  <Text style={styles.tableHeader}>D</Text>
                  <Text style={styles.tableHeader}>L</Text>
                  <Text style={[styles.tableHeader, { flex: 2 }]}>GF/A</Text>
                  <Text style={[styles.tableHeader, { flex: 1.25 }]}>Pts</Text>
                </View>
                {statsData.map((item: any, index: number) => {
                  const key = item?.team?.id ?? item.position ?? index;
                  return (
                    <View key={key} style={styles.tableRow}>
                      <Text style={styles.tableCell}>{item.position ?? "-"}</Text>
                      <View style={{ flex: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
                        {item.team?.crest && (
                          <Image
                            source={{ uri: item.team.crest }}
                            style={{ width: 15, height: 15, marginRight: 4 }}
                            resizeMode="contain"
                          />
                        )}
                        <Text style={{ color: 'white', textAlign: 'left', paddingLeft: 0, marginLeft: 5, flexShrink: 1, fontSize: 12 }}>
                          {getTeamWithCrest(item.team).name}
                        </Text>
                      </View>


                      <Text style={styles.tableCell}>{item.played ?? "-"}</Text>
                      <Text style={styles.tableCell}>{item.wins ?? "-"}</Text>
                      <Text style={styles.tableCell}>{item.draws ?? "-"}</Text>
                      <Text style={styles.tableCell}>{item.losses ?? "-"}</Text>
                      <Text style={[styles.tableCell, { flex: 3 }]}>
                        {item.goalsFor ?? "-"} / {item.goalsAgainst ?? "-"}
                      </Text>
                      <Text style={styles.tableCell}>{item.points ?? "-"}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {statsOption === "Team Stats" && (
              statsData
                .slice()
                .sort((a: any, b: any) => {
                  const nameA = (a.name ?? "").toLowerCase();
                  const nameB = (b.name ?? "").toLowerCase();
                  return nameA.localeCompare(nameB);
                })
                .map((team: any, index: number) => {
                  const key = team?.id ?? team?.name ?? index;

                  return (
                    <View key={key} style={styles.teamCard}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        {team.crest ? (
                          <Image
                            source={{ uri: team.crest }}
                            style={{ width: 30, height: 30, marginRight: 8 }}
                            resizeMode="contain"
                          />
                        ) : null}
                        <Text style={styles.teamName}>{team.name ?? "N/A"}</Text>
                      </View>
                      <Text style={styles.teamDetail}>Venue: {team.venue ?? "N/A"}</Text>
                      <Text style={styles.teamDetail}>Matches: {team.played ?? "N/A"}</Text>
                      <Text style={styles.teamDetail}>Wins: {team.wins ?? "N/A"}</Text>
                      <Text style={styles.teamDetail}>Draws: {team.draws ?? "N/A"}</Text>
                      <Text style={styles.teamDetail}>Losses: {team.losses ?? "N/A"}</Text>
                      <Text style={styles.teamDetail}>Goals Scored: {team.goalsScored ?? "N/A"}</Text>
                      <Text style={styles.teamDetail}>Goals Conceded: {team.goalsConceded ?? "N/A"}</Text>
                    </View>
                  );
                })
            )}

            {statsOption === "Top Scorer" && (
              <View style={styles.table}>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableHeader, { flex: 2 }]}>Player</Text>
                  <Text style={[styles.tableHeader, { flex: 3 }]}>Team</Text>
                  <Text style={styles.tableHeader}>Goals</Text>
                </View>
                {statsData.map((player: any, index: number) => {
                  const key = player?.id ?? player?.name ?? index;

                  return (
                    <View key={key} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{player.name ?? "N/A"}</Text>
                      <View style={[styles.tableCell, { flex: 3, flexDirection: 'row', alignItems: 'center' }]}>
                        {player.crest ? (
                          <Image
                            source={{ uri: player.crest }}
                            style={{ width: 20, height: 20, marginRight: 6 }}
                            resizeMode="contain"
                          />
                        ) : null}
                        <Text style={styles.tableCell}>{typeof player.team === 'string' ? player.team : player.team?.name ?? "N/A"}</Text>
                      </View>
                      <Text style={styles.tableCell}>{player.goals ?? "-"}</Text>
                    </View>
                  );
                })}
              </View>
            )}

          </ScrollView>
        ) : (
          <Text style={styles.noDataText}>No stats data available</Text>
        )}
      </View>
    </View>
  );

  const renderMatches = () => (
    <View style={styles.matchesContainer}>
      {!matchesLeftTrayOpen ? (
        <TouchableOpacity
          style={styles.openTrayButton}
          onPress={() => setMatchesLeftTrayOpen(true)}
        >
          <Text style={styles.openButtonText}>☰</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.leftTray}>
          <TouchableOpacity
            onPress={() => setMatchesLeftTrayOpen(false)}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>◀</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Competitions</Text>
          <View>
            {COMPETITIONS.map((comp) => (
              <TouchableOpacity
                key={comp.id}
                onPress={() => setMatchesCompetition(comp)}
                style={[
                  styles.competitionButton,
                  matchesCompetition.id === comp.id && styles.activeCompetitionButton
                ]}
              >
                <Text style={[
                  styles.tabText,
                  matchesCompetition.id === comp.id && styles.activeTabText
                ]}>
                  {comp.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.matchesContent}>
        {loadingMatches ? (
          <ActivityIndicator size="large" color="#3B82F6" />
        ) : matchesData.length === 0 ? (
          <Text style={styles.noDataText}>No matches found</Text>
        ) : (
          <ScrollView
            style={styles.scrollContainer}
            ref={(ref) => {
              if (ref && matchesData.length > 0) {
                const upcomingIndex = matchesData.findIndex(match => match.status === "SCHEDULED");
                if (upcomingIndex !== -1) {
                  setTimeout(() => {
                    ref.scrollTo({ y: upcomingIndex * 110, animated: true });
                  }, 100);
                } else {
                  const finishedIndices = matchesData
                    .map((match, idx) => (match.status === "FINISHED" ? idx : -1))
                    .filter(idx => idx !== -1);
                  if (finishedIndices.length > 0) {
                    const lastFinishedIndex = finishedIndices[finishedIndices.length - 1];
                    setTimeout(() => {
                      ref.scrollTo({ y: lastFinishedIndex * 110, animated: true });
                    }, 100);
                  } else {
                    setTimeout(() => {
                      ref.scrollTo({ y: 0, animated: true });
                    }, 100);
                  }
                }
              }
            }}
          >
            {matchesData.map((match: any) => {
              const { homeTeam, awayTeam, score, utcDate, status, competition, matchday } = match;

              const home = getTeamWithCrest(homeTeam);
              const away = getTeamWithCrest(awayTeam);

              const matchDate = new Date(utcDate);
              matchDate.setHours(matchDate.getHours() + 6);
              const timeString = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              const isPlayed = status === "FINISHED" || status === "IN_PLAY" || status === "PAUSED";

              return (
                <View key={match.id} style={styles.matchCard}>
                  <Text style={styles.metaText}>
                    {competition?.name ?? 'Unknown'} - R{matchday}{isPlayed ? ` - ${timeString}` : ""}
                  </Text>

                  <View style={styles.teamRow}>
                    <View style={styles.teamContainer}>
                      <Text style={styles.teamName}>{home.name}</Text>
                      {home.crest && <Image source={{ uri: home.crest }} style={styles.crest} />}
                    </View>

                    {isPlayed ? (
                      <Text style={styles.scoreText}>
                        {score.fullTime.home ?? '-'} - {score.fullTime.away ?? '-'}
                      </Text>
                    ) : (
                      <Text style={styles.matchTime}>{timeString}</Text>
                    )}

                    <View style={styles.teamContainer}>
                      {away.crest && <Image source={{ uri: away.crest }} style={styles.crest} />}
                      <Text style={styles.teamName}>{away.name}</Text>
                    </View>
                  </View>

                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );

  const selectTeam = (team: any) => {
    setFavoriteTeams([{ id: team.id, name: team.name }]);
    setShowSearchModal(false);
    setSearchQuery("");
  };

  const renderFavorite = () => {
    const favoriteTeamName = favoriteTeams[0]?.name;
    const favoriteTeamStats = favoriteTeamsStats?.[favoriteTeamName ?? ""];

    return (
      <View style={styles.tabContent}>
        <View style={styles.favoriteHeader}>
          <Text style={styles.sectionTitle}>Favorite Team</Text>
          <TouchableOpacity
            onPress={() => setShowSearchModal(true)}
            style={styles.addFavoriteBtn}
          >
            <Text style={styles.addButtonText}>
              {favoriteTeams.length > 0 ? "Change Team" : "Add Team"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {!favoriteTeamName || !favoriteTeamStats?.details ? (
            <Text style={styles.noDataText}>
              Loading team info or no favorite team selected.
            </Text>
          ) : (
            <View style={styles.favoriteTeamCard}>
              <Image
                source={{ uri: favoriteTeamStats.details.crest || "" }}
                style={{ width: 80, height: 80, marginBottom: 10 }}
                resizeMode="contain"
              />
              <Text style={styles.teamName}>
                {favoriteTeamStats.details.name || "N/A"}
              </Text>
              <Text style={styles.teamDetail}>
                Founded: {favoriteTeamStats.details.founded ?? "N/A"}
              </Text>
              <Text style={styles.teamDetail}>
                Address: {favoriteTeamStats.details.address || "N/A"}
              </Text>
              <Text style={styles.teamDetail}>
                Venue: {favoriteTeamStats.details.venue || "N/A"}
              </Text>
              <Text style={styles.teamDetail}>
                Coach: {favoriteTeamStats.details.coach || "N/A"}
              </Text>

              <Text style={[styles.teamDetail, { marginTop: 10 }]}>
                Competitions:
              </Text>
              {(favoriteTeamStats.details.competitions ?? []).map(
                (comp: string, index: number) => (
                  <Text key={index} style={styles.teamDetail}>
                    • {comp}
                  </Text>
                )
              )}

              <Text style={[styles.teamDetail, { marginTop: 10 }]}>Squad:</Text>
              {(favoriteTeamStats.details.squad ?? []).map(
                (player: string, index: number) => (
                  <Text key={index} style={styles.teamDetail}>
                    • {player}
                  </Text>
                )
              )}
            </View>
          )}
        </ScrollView>

        <Modal visible={showSearchModal} animationType="slide" transparent={false}>
          <View style={styles.modalContainer}>
            <View style={styles.searchBarContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a team"
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
              <Text style={styles.noResultsText}>No teams found</Text>
            ) : (
              <ScrollView style={styles.searchResults}>
                {searchResults.map((team) => (
                  <TouchableOpacity
                    key={`${team.id}-${team.name}`}
                    onPress={() => selectTeam(team)}
                    style={styles.searchResultItem}
                  >
                    <Text style={styles.noDataText}>{team.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </Modal>
      </View>
    );
  };


  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab as any)}
            style={[
              styles.tabButton,
              activeTab === tab && styles.activeTabButton
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

      <View style={styles.content}>
        {activeTab === "Home" && renderHome()}
        {activeTab === "Stats" && renderStats()}
        {activeTab === "Matches" && renderMatches()}
        {activeTab === "Favorite" && renderFavorite()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    height: '92%',
  },
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
  },
  matchDetail: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  metaText: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 8,
  },

  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  teamContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },

  crest: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    marginHorizontal: 6,
    transform: [{ translateY: -3 }],
  },

  favoriteTeamCard: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1B2631',
    padding: 15,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#0f172a',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
  },
  closeModalButton: {
    backgroundColor: '#ef4444',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResults: {
    flex: 1,
  },
  searchResultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  loader: {
    marginTop: 20,
  },
  noResultsText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  scoreText: {
    color: '#fbbf24',
    fontSize: 18,
    fontWeight: 'bold',
    transform: [{ translateY: -3 }],
  },

  matchTime: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: 'bold',
  },

  eventsContainer: {
    marginTop: 10,
  },

  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1B2631',
    height: '92%',
  },
  matchesContainer: {
    flex: 1,
    flexDirection: 'row',
    height: '92%',
  },
  leftTray: {
    width: 130,
    height: '92%',
    backgroundColor: '#0d1b2a',
    borderRightWidth: 1,
    borderColor: '#1e293b',
    position: 'relative',
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
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeOptionButton: {
    backgroundColor: '#fff',
  },
  statsContent: {
    flex: 1,
    padding: 5,
    height: '92%',
  },
  matchesContent: {
    flex: 1,
    padding: 5,
    height: '92%',
  },
  statsHeader: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 15,
    textAlign: 'center',
    marginVertical: 10,
  },
  statsData: {
    color: '#cbd5e1',
    fontSize: 14,
    height: '92%',
  },
  favoriteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addFavoriteBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  teamCard: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  teamName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  teamStats: {
    color: '#cbd5e1',
    fontSize: 14,
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
  closeButton: {
    position: 'absolute',
    bottom: 10,
    left: '50%',
    transform: [{ translateX: -17 }],
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },

  closeButtonText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: '700',
    lineHeight: 30,
    marginTop: -5,
  },
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },
  tableHeader: {
    flex: 1,
    padding: 5,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    backgroundColor: '#1e293b',
    fontSize: 12,
  },
  tableCell: {
    flex: 1,
    padding: 5,
    color: '#cbd5e1',
    textAlign: 'center',
    fontSize: 12,
  },
  teamDetail: {
    color: '#cbd5e1',
    fontSize: 14,
    marginBottom: 4,
  },
});