import { useClerk, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { db } from "../../firebase";

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

  // Fetch user profile and liked stats from Firestore
  useEffect(() => {
    const fetchProfileAndStats = async () => {
      if (!emailAddress) return;
      setLoading(true);
      try {
        // Profile
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
        // Stats
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
        setProfileData(null);
        setStats({});
      }
      setLoading(false);
    };
    fetchProfileAndStats();
  }, [emailAddress]);

  // Pick image and upload as base64
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets[0].base64) {
      setUploading(true);
      const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setProfilePic(base64Img);
      // Save to Firestore
      try {
        if (emailAddress) {
          const docRef = doc(db, emailAddress, "profile");
          await setDoc(docRef, { profilePic: base64Img }, { merge: true });
          Alert.alert("Profile Picture Updated");
        } else {
          Alert.alert("No valid email found for user");
        }
      } catch {
        Alert.alert("Error updating profile picture");
      }
      setUploading(false);
    }
  };

  // Save name to Firestore
  const handleSaveName = async () => {
    if (!emailAddress) return;
    setUploading(true);
    try {
      if (emailAddress) {
        const docRef = doc(db, emailAddress, "profile");
        await setDoc(docRef, { name }, { merge: true });
        Alert.alert("Name Updated");
      } else {
        Alert.alert("No valid email found for user");
      }
    } catch {
      Alert.alert("Error updating name");
    }
    setUploading(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}><ActivityIndicator size="large" color="#FF0000" /></View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
        <View style={styles.statsGrid}>
          {statConfigs.map(({ key, label, icon }) => (
            <View key={key} style={styles.statCard}>
              <Ionicons name={icon as any} size={28} color="#FF0000" style={{ marginBottom: 6 }} />
              <Text style={styles.statCount}>{stats[key] ?? 0}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>
        {/* Hide logout button, now in menu */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#181A20',
    paddingVertical: 40,
  },
  profileCard: {
    backgroundColor: '#23262F',
    borderRadius: 24,
    padding: 28,
    width: '94%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 30,
  },
  profilePicContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
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
    marginBottom: 10,
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
    marginTop: 18,
    marginBottom: 18,
    width: '100%',
  },
  statCard: {
    backgroundColor: '#181A20',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
    marginVertical: 8,
    paddingVertical: 16,
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
