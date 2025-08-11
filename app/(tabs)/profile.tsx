import { useClerk, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import LikedBooks from "../../components/LikedBooks";
import LikedGames from "../../components/LikedGames";
import LikedMusicAlbums from "../../components/LikedMusicAlbums";
import LikedMusicArtists from "../../components/LikedMusicArtists";
import LikedMusicTracks from "../../components/LikedMusicTracks";
import LikedShows from "../../components/LikedShows";
import { db } from "../../firebase";
import { fetchFromApi } from "../../services/fotball_API";

// Helper function for team crest
const getTeamWithCrest = (team: any) => {
  let name = typeof team === "string" ? team : team?.shortName ?? team?.name ?? "N/A";
  if (name && name.toLowerCase().includes("wolverhampton")) {
    name = "Wolves";
  }
  const crest = team?.crest ?? team?.logo ?? team?.crestUrl ?? null;
  return { name, crest };
};

// Wikipedia image fetcher
async function getWikipediaImageUrl(playerName: string): Promise<string | null> {
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

const statConfigs = [
  { key: 'musicTracks', label: 'Tracks', icon: 'musical-notes' },
  { key: 'musicAlbums', label: 'Albums', icon: 'albums' },
  { key: 'musicArtists', label: 'Artists', icon: 'person' },
  { key: 'books', label: 'Books', icon: 'book' },
  { key: 'games', label: 'Games', icon: 'game-controller' },
  { key: 'movies', label: 'Movies', icon: 'film' },
  { key: 'tvseries', label: 'TV Shows', icon: 'tv' },
];

export default function Profile() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const emailAddress = user?.primaryEmailAddress?.emailAddress;
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [stats, setStats] = useState<{ [key: string]: number }>({});
  const [menuVisible, setMenuVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // LikedShows modal state
  const [likedShowsVisible, setLikedShowsVisible] = useState(false);
  const [likedShowsTab, setLikedShowsTab] = useState<"Movie" | "TV Series">("Movie");
  
  // Other liked content modals
  const [likedBooksVisible, setLikedBooksVisible] = useState(false);
  const [likedGamesVisible, setLikedGamesVisible] = useState(false);
  const [likedMusicTracksVisible, setLikedMusicTracksVisible] = useState(false);
  const [likedMusicAlbumsVisible, setLikedMusicAlbumsVisible] = useState(false);
  const [likedMusicArtistsVisible, setLikedMusicArtistsVisible] = useState(false);

  // Direct favorite player handling - no cache, just direct API calls
  const [favoritePlayerId, setFavoritePlayerId] = useState<number | null>(null);
  const [favoritePlayerData, setFavoritePlayerData] = useState<any>(null);
  const [loadingFavoritePlayer, setLoadingFavoritePlayer] = useState(false);

  const hasValidPlayerData = favoritePlayerData && !favoritePlayerData.error && favoritePlayerData.name;

  // Fetch favorite player data directly from API
  const fetchFavoritePlayerData = async (playerId: number) => {
    setLoadingFavoritePlayer(true);
    try {
      const data = await fetchFromApi(`persons/${playerId}`, "", true);
      
      if (data?.error || !data?.name) {
        setFavoritePlayerData({ error: data?.error || 'Player not found' });
      } else {
        // Try to fetch Wikipedia image
        let wikiImage = null;
        if (data?.name) {
          try {
            wikiImage = await getWikipediaImageUrl(data.name);
          } catch (imgError) {
            console.warn("Failed to fetch Wikipedia image for", data.name);
          }
        }
        
        const playerDataWithImage = { ...data, wikiImage };
        setFavoritePlayerData(playerDataWithImage);
      }
    } catch (error) {
      console.error("Error fetching favorite player data:", error);
      setFavoritePlayerData({ error: 'Failed to fetch player data' });
    } finally {
      setLoadingFavoritePlayer(false);
    }
  };

  // Fetch favorite player ID and data when profile loads or tab is focused
  useFocusEffect(
    useCallback(() => {
      
      const loadFavoritePlayer = async () => {
        if (!emailAddress) return;
        
        try {
          const userDocRef = doc(db, "users", emailAddress);
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            const userData = docSnap.data();
            const playerId = userData.favoritePlayerId;
            
            setFavoritePlayerId(playerId);
            
            if (playerId) {
              await fetchFavoritePlayerData(playerId);
            } else {
              setFavoritePlayerData(null);
            }
          } else {
            setFavoritePlayerId(null);
            setFavoritePlayerData(null);
          }
        } catch (error) {
          console.error("Error loading favorite player:", error);
          setFavoritePlayerData({ error: 'Failed to load favorite player' });
        }
      };
      
      loadFavoritePlayer();
    }, [emailAddress])
  );

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!emailAddress) return;
      setLoading(true);
      try {
        const docRef = doc(db, emailAddress, 'profile');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfileData(data);
          setName(data.name || '');
          setProfilePic(data.profilePic || null);
        } else {
          setProfileData(null);
        }
      } catch (e) {
        setProfileData(null);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [emailAddress]);

  // Fetch liked stats - using useFocusEffect to update when tab is focused
  useFocusEffect(
    useCallback(() => {
      const fetchStats = async () => {
        if (!emailAddress) return;
        try {
          const statResults: { [key: string]: number } = {};
          await Promise.all(
            statConfigs.map(async ({ key }) => {
              const statRef = doc(db, emailAddress, key);
              const statSnap = await getDoc(statRef);
              if (statSnap.exists()) {
                const data = statSnap.data();
                statResults[key] = Object.values(data).filter((v) => v === true).length;
              } else {
                statResults[key] = 0;
              }
            })
          );
          setStats(statResults);
        } catch (e) {
          setStats({});
        }
      };
      fetchStats();
    }, [emailAddress])
  );

  // Fetch favorite teams - using the same structure as football.tsx
  const [favoriteTeams, setFavoriteTeams] = useState<{ id: number; name: string }[]>([]);
  const [favoriteTeamData, setFavoriteTeamData] = useState<any>(null);
  const [loadingFavoriteTeam, setLoadingFavoriteTeam] = useState(false);

  const hasValidTeamData = favoriteTeamData && !favoriteTeamData.error && favoriteTeamData.name;

  // Fetch favorite team data directly from API
  const fetchFavoriteTeamData = async (teamId: number) => {
    setLoadingFavoriteTeam(true);
    try {
      const data = await fetchFromApi(`teams/${teamId}`, "", true);
      
      if (data?.error || !data?.name) {
        setFavoriteTeamData({ error: data?.error || 'Team not found' });
      } else {
        setFavoriteTeamData(data);
      }
    } catch (error) {
      console.error("Error fetching favorite team data:", error);
      setFavoriteTeamData({ error: 'Failed to fetch team data' });
    } finally {
      setLoadingFavoriteTeam(false);
    }
  };

  // Fetch favorite teams and data when profile loads or tab is focused
  useFocusEffect(
    useCallback(() => {
      const loadFavoriteTeam = async () => {
        if (!emailAddress) return;
        
        try {
          const userDocRef = doc(db, "users", emailAddress);
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            const userData = docSnap.data();
            const teams = userData.favoriteTeams;
            
            setFavoriteTeams(teams || []);
            
            if (teams && teams.length > 0 && teams[0].id) {
              await fetchFavoriteTeamData(teams[0].id);
            } else {
              setFavoriteTeamData(null);
            }
          } else {
            setFavoriteTeams([]);
            setFavoriteTeamData(null);
          }
        } catch (error) {
          console.error("Error loading favorite team:", error);
          setFavoriteTeamData({ error: 'Failed to load favorite team' });
        }
      };
      
      loadFavoriteTeam();
    }, [emailAddress])
  );

  const handlePickImage = async () => {
    try {
      setUploading(true);
      
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to change your profile picture.');
        return;
      }

      // Show options to user
      Alert.alert(
        'Change Profile Picture',
        'Choose an option',
        [
          { text: 'Camera', onPress: () => openCamera() },
          { text: 'Gallery', onPress: () => openGallery() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Error in handlePickImage:', error);
      Alert.alert("Error", "Failed to pick image");
    } finally {
      setUploading(false);
    }
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera permissions to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        await saveProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert("Error", "Failed to open camera");
    }
  };

  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        await saveProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert("Error", "Failed to open gallery");
    }
  };

  const saveProfilePicture = async (uri: string) => {
    if (!emailAddress) return;
    
    try {
      setUploading(true);
      
      // Update local state immediately for better UX
      setProfilePic(uri);
      
      // Save to Firestore
      const docRef = doc(db, emailAddress, 'profile');
      await setDoc(docRef, { profilePic: uri }, { merge: true });
      
      // Update profile data state
      setProfileData((prev: any) => ({ ...prev, profilePic: uri }));
      
      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error) {
      console.error("Error saving profile picture:", error);
      // Revert local state on error
      setProfilePic(profileData?.profilePic || null);
      Alert.alert("Error", "Failed to save profile picture");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveName = async () => {
    if (!emailAddress) return;
    try {
      setUploading(true);
      const docRef = doc(db, emailAddress, 'profile');
      await setDoc(docRef, { name }, { merge: true });
      setProfileData((prev: any) => ({ ...prev, name }));
    } catch (error) {
      console.error("Error saving name:", error);
      Alert.alert("Error", "Failed to save name");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleStatCardPress = (key: string) => {
    if (key === 'movies') {
      setLikedShowsTab("Movie");
      setLikedShowsVisible(true);
    } else if (key === 'tvseries') {
      setLikedShowsTab("TV Series");
      setLikedShowsVisible(true);
    } else if (key === 'books') {
      setLikedBooksVisible(true);
    } else if (key === 'games') {
      setLikedGamesVisible(true);
    } else if (key === 'musicTracks') {
      setLikedMusicTracksVisible(true);
    } else if (key === 'musicAlbums') {
      setLikedMusicAlbumsVisible(true);
    } else if (key === 'musicArtists') {
      setLikedMusicArtistsVisible(true);
    }
  };

  const handleFavoritePlayerPress = () => {
    // Navigate to sport -> football -> favorite with player tab active
    router.push('/sport/football?tab=Favorite&favoriteTab=player');
  };

  const handleFavoriteTeamPress = () => {
    // Navigate to sport -> football -> favorite with team tab active
    router.push('/sport/football?tab=Favorite&favoriteTab=team');
  };

  if (loading) {
    return (
      <View style={styles.container}><ActivityIndicator size="large" color="#FF0000" /></View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        {/* 3-dot menu button */}
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <Ionicons name="ellipsis-vertical" size={26} color="#fff" />
        </TouchableOpacity>
        {/* Menu Modal */}
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
            <View style={styles.menuModal}>
              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => {
                  setEditMode(true);
                  setMenuVisible(false);
                }}
              >
                <Ionicons name="pencil" size={18} color="#FF0000" style={{ marginRight: 8 }} />
                <Text style={styles.menuOptionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => {
                  setMenuVisible(false);
                  handleLogout();
                }}
              >
                <Ionicons name="log-out-outline" size={18} color="#FF0000" style={{ marginRight: 8 }} />
                <Text style={styles.menuOptionText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
        <View style={styles.profilePicContainer}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.profilePic} />
          ) : (
            <View style={[styles.profilePic, { backgroundColor: '#444', justifyContent: 'center', alignItems: 'center' }]}> 
              <Ionicons name="person-circle" size={80} color="#fff" />
            </View>
          )}
          <TouchableOpacity style={styles.uploadButton} onPress={handlePickImage} disabled={uploading}>
            <Text style={styles.uploadButtonText}>{uploading ? 'Uploading...' : 'Change Photo'}</Text>
          </TouchableOpacity>
        </View>
        {/* Name and Edit Mode */}
        {editMode ? (
          <>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#888"
              autoFocus
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={async () => {
                await handleSaveName();
                setEditMode(false);
              }}
              disabled={uploading}
            >
              <Text style={styles.saveButtonText}>{uploading ? 'Saving...' : 'Save Name'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.profileName}>{name || 'No Name'}</Text>
        )}
        <Text style={styles.profileEmail}>{emailAddress || 'No email found'}</Text>
        {profileData?.bio && (
          <>
            <Text style={styles.label}>Bio:</Text>
            <Text style={styles.value}>{profileData.bio}</Text>
          </>
        )}

        {/* Stats cards with favorite player and teams as last two cards */}
        <View style={styles.statsGrid}>
          {statConfigs.map(({ key, label, icon }) => (
            <TouchableOpacity key={key} style={styles.statCard} onPress={() => handleStatCardPress(key)}>
              <Ionicons name={icon as any} size={28} color="#FF0000" style={{ marginBottom: 6 }} />
              <Text style={styles.statCount}>{stats[key] ?? 0}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
          {/* Favorite Player Card (second last) */}
          <TouchableOpacity style={styles.statCard} onPress={handleFavoritePlayerPress}>
            {(() => {
              if (loadingFavoritePlayer) {
                return (
                  <>
                    <ActivityIndicator size="small" color="#FF0000" style={{ marginBottom: 6 }} />
                    <Text style={[styles.value, { textAlign: 'center', marginTop: 4 }]}>
                      Loading...
                    </Text>
                  </>
                );
              }
              
              // Show favorite player data if available
              if (hasValidPlayerData) {
                return (
                  <>
                    {favoritePlayerData?.wikiImage ? (
                      <Image
                        source={{ uri: favoritePlayerData.wikiImage }}
                        style={{ width: 60, height:60, borderRadius: 30, marginBottom: 6 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="person" size={50} color="#FF0000" style={{ marginBottom: 6 }} />
                    )}
                    <Text style={[styles.value, { textAlign: 'center', marginTop: 0, marginBottom: -2, fontSize: 13 }]}>
                      {favoritePlayerData?.name}
                    </Text>
                              
                  </>
                );
              }
              
              // No favorite player set
              return (
                <>
                  <Ionicons name="person" size={40} color="#FF0000" style={{ marginBottom: 6 }} />
                  <Text style={[styles.value, { textAlign: 'center', marginTop: 0, fontSize: 12 }]}>
                    No favorite player
                  </Text>
                </>
              );
            })()}
          </TouchableOpacity>
          {/* Favorite Teams Card (last) */}
          <TouchableOpacity style={styles.statCard} onPress={handleFavoriteTeamPress}>
            {(() => {
              if (loadingFavoriteTeam) {
                return (
                  <>
                    <ActivityIndicator size="small" color="#FF0000" style={{ marginBottom: 6 }} />
                    <Text style={[styles.value, { textAlign: 'center', marginTop: 0, alignSelf: 'center' }]}>
                      Loading...
                    </Text>
                  </>
                );
              }
              
              // Show favorite team data if available
              if (hasValidTeamData) {
                return (
                  <>
                    {favoriteTeamData?.crest ? (
                      <Image
                        source={{ uri: favoriteTeamData.crest }}
                        style={{ width: 70, height: 70, borderRadius: 35, marginBottom: 6 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="shield" size={60} color="#FF0000" style={{ marginBottom: 6 }} />
                    )}
                    <Text style={[styles.value, { textAlign: 'center', marginTop: 0, marginBottom: -2, fontSize: 13, alignSelf: 'center' }]}>
                      {favoriteTeamData?.shortName || favoriteTeamData?.name}
                    </Text>
                  </>
                );
              }
              
              // No favorite team set
              return (
                <>
                  <Ionicons name="shield" size={40} color="#FF0000" style={{ marginBottom: 6 }} />
                  <Text style={[styles.value, { textAlign: 'center', marginTop: 0, fontSize: 12, alignSelf: 'center' }]}>
                    No favorite team
                  </Text>
                </>
              );
            })()}
          </TouchableOpacity>
        </View>
        {/* Hide logout button, now in menu */}
      </View>
      
      {/* LikedShows Modal */}
      <LikedShows
        visible={likedShowsVisible}
        onClose={() => setLikedShowsVisible(false)}
        activeTab={likedShowsTab}
      />
      
      {/* Other Liked Content Modals */}
      <LikedBooks
        visible={likedBooksVisible}
        onClose={() => setLikedBooksVisible(false)}
      />
      
      <LikedGames
        visible={likedGamesVisible}
        onClose={() => setLikedGamesVisible(false)}
      />
      
      <LikedMusicTracks
        visible={likedMusicTracksVisible}
        onClose={() => setLikedMusicTracksVisible(false)}
      />
      
      <LikedMusicAlbums
        visible={likedMusicAlbumsVisible}
        onClose={() => setLikedMusicAlbumsVisible(false)}
      />
      
      <LikedMusicArtists
        visible={likedMusicArtistsVisible}
        onClose={() => setLikedMusicArtistsVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#181A20',
    paddingTop: 20,
    paddingBottom: 20,
  },
  profileCard: {
    backgroundColor: '#23262F',
    borderRadius: 24,
    padding: 20,
    width: '94%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 10,
  },
  profilePicContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
    borderWidth: 3,
    borderColor: '#FF0000',
  },
  uploadButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 4,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  profileName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    marginBottom: 2,
    textAlign: 'center',
  },
  profileEmail: {
    color: '#aaa',
    fontSize: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    width: '100%',
    marginBottom: 10,
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 10,
    alignSelf: 'stretch',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  label: {
    color: '#FF0000',
    fontWeight: 'bold',
    fontSize: 16,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  value: {
    color: '#fff',
    fontSize: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 12,
    width: '100%',
  },
  statCard: {
    backgroundColor: '#181A20',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
    marginVertical: 6,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  statCount: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 2,
  },
  statLabel: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginTop: 20,
    alignSelf: 'stretch',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  menuButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    zIndex: 10,
    padding: 6,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuModal: {
    backgroundColor: '#23262F',
    borderRadius: 14,
    marginTop: 60,
    marginRight: 18,
    paddingVertical: 8,
    paddingHorizontal: 0,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  menuOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
