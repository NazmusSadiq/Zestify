import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from "../firebase";

interface FilteredGame {
  id: number;
  name: string;
  background_image: string;
  rating: number;
  released: string;
  added: number;
  added_by_status: {
    toplay?: number;
    yet?: number;
    [key: string]: number | undefined;
  };
  genres: {
    id: number;
    name: string;
    slug: string;
    games_count: number;
    image_background: string;
  }[];
  platforms: {
    platform: {
      name: string;
    };
  }[];
  esrb_rating?: {
    id: number;
    name: string;
    slug: string;
  };
}

interface GameFilterDetailsProps {
  game: FilteredGame | null;
  visible: boolean;
  onClose: () => void;
}

export default function GameFilterDetails({ game, visible, onClose }: GameFilterDetailsProps) {
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);

  useEffect(() => {
    const fetchLike = async () => {
      if (!user?.primaryEmailAddress?.emailAddress || !game?.id) {
        setIsLiked(false);
        return;
      }
      try {
        const docRef = doc(db, user.primaryEmailAddress.emailAddress, "games");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsLiked(!!data[game.id]);
        } else {
          setIsLiked(false);
        }
      } catch (e) {
        setIsLiked(false);
      }
    };
    fetchLike();
  }, [user?.primaryEmailAddress?.emailAddress, game?.id]);

  const handleLike = async () => {
    if (!user?.primaryEmailAddress?.emailAddress || !game?.id) return;
    setLoadingLike(true);
    try {
      const docRef = doc(db, user.primaryEmailAddress.emailAddress, "games");
      await setDoc(docRef, { [game.id]: true }, { merge: true });
      setIsLiked(true);
    } catch (e) {
      // Optionally show error
    }
    setLoadingLike(false);
  };

  const handleUnlike = async () => {
    if (!user?.primaryEmailAddress?.emailAddress || !game?.id) return;
    setLoadingLike(true);
    try {
      const docRef = doc(db, user.primaryEmailAddress.emailAddress, "games");
      await setDoc(docRef, { [game.id]: false }, { merge: true });
      setIsLiked(false);
    } catch (e) {
      // Optionally show error
    }
    setLoadingLike(false);
  };

  if (!game) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Ionicons name="arrow-back" size={24} color="#FF0000" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <View style={{ position: 'relative' }}>
              <Image
                source={{ uri: game.background_image }}
                style={styles.image}
                resizeMode="cover"
              />
              {/* Heart button at top right of poster */}
              <TouchableOpacity
                style={styles.posterHeartButton}
                onPress={isLiked ? handleUnlike : handleLike}
                activeOpacity={0.7}
                disabled={loadingLike}
              >
                <Text style={{ fontSize: 28, opacity: loadingLike ? 0.5 : 1 }}>
                  {isLiked ? '❤️' : '🤍'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.detailsContainer}>
              <Text style={styles.title}>{game.name}</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>Rating:</Text>
                <Text style={styles.value}>{game.rating}/5</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Released:</Text>
                <Text style={styles.value}>{new Date(game.released).toLocaleDateString()}</Text>
              </View>

              {game.esrb_rating && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>ESRB Rating:</Text>
                  <Text style={styles.value}>{game.esrb_rating.name}</Text>
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Platforms</Text>
                <Text style={styles.value}>
                  {game.platforms.map(p => p.platform.name).join(', ')}
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Genres</Text>
                <Text style={styles.value}>
                  {game.genres.map(g => g.name).join(', ')}
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Player Stats</Text>
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Total Added</Text>
                    <Text style={styles.statValue}>{game.added}</Text>
                  </View>
                  {Object.entries(game.added_by_status).map(([status, count]) => (
                    count && (
                      <View key={status} style={styles.statItem}>
                        <Text style={styles.statLabel}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                        <Text style={styles.statValue}>{count}</Text>
                      </View>
                    )
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    // width: '92%',
    // maxHeight: '92%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 15,
  },
  detailsContainer: {
    padding: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#252525',
    padding: 10,
    borderRadius: 8,
  },
  label: {
    fontWeight: 'bold',
    width: 100,
    color: '#3B82F6',
  },
  value: {
    flex: 1,
    color: '#FFFFFF',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#252525',
    padding: 15,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#3B82F6',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    color: '#FF0000',
    fontSize: 16,
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#1E1E1E',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  statLabel: {
    color: '#3B82F6',
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  posterHeartButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 20,
    padding: 2,
  },
});
