import { fetchGameDetails, Game } from "@/services/GameAPI";
import { useUser } from "@clerk/clerk-expo";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { db } from "../firebase";
import GameFilterDetails from "./GameFilterDetails";

const sortOptions = [
  { option: "Name", key: "name" },
  { option: "Release Date", key: "released" },
  { option: "Popularity", key: "added" },
  { option: "Average Rating", key: "rating" },
];

interface LikedGamesProps {
  visible: boolean;
  onClose: () => void;
}

const LikedGames = ({ visible, onClose }: LikedGamesProps) => {
  const { user } = useUser();
  const [likedGames, setLikedGames] = useState<Game[]>([]);
  const [sortBy, setSortBy] = useState(sortOptions[0]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const fetchLikedGames = async () => {
      setLoading(true);
      try {
        if (!user?.primaryEmailAddress?.emailAddress) {
          setLikedGames([]);
          return;
        }
        const docRef = doc(db, user.primaryEmailAddress.emailAddress, "games");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const likedIds = Object.entries(data)
            .filter(([_, v]) => v === true)
            .map(([id]) => id);
          // Fetch details for each liked id
          const detailsArr = await Promise.all(
            likedIds.map(async (id) => {
              try {
                return await fetchGameDetails(Number(id));
              } catch {
                return null;
              }
            })
          );
          setLikedGames(detailsArr.filter((g): g is Game => g !== null));
        } else {
          setLikedGames([]);
        }
      } catch (err) {
        setLikedGames([]);
      }
      setLoading(false);
    };
    fetchLikedGames();
  }, [visible, user?.primaryEmailAddress?.emailAddress]);

  // Sorting
  const sortedGames = [...likedGames].sort((a, b) => {
    const key = sortBy.key as keyof Game;
    const valA = a[key];
    const valB = b[key];
    if (valA === undefined || valB === undefined) return 0;
    if (key === "released") {
      return new Date(valB as string).getTime() - new Date(valA as string).getTime();
    }
    if (typeof valA === "string" && typeof valB === "string") {
      return valA.localeCompare(valB);
    }
    if (typeof valA === "number" && typeof valB === "number") {
      return valB - valA;
    }
    return 0;
  });

  const renderItem = ({ item }: { item: Game }) => (
    <TouchableOpacity style={styles.gameCard} onPress={() => setSelectedGame(item)}>
      <View style={styles.imageContainer}>
        {item.background_image ? (
          <Image
            source={{ uri: item.background_image }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, { backgroundColor: '#444' }]} />
        )}
      </View>
      <Text style={styles.gameTitle} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.gameRating}>⭐ {item.rating?.toFixed(1)}</Text>
      <Text style={styles.gameDate}>{item.released ? new Date(item.released).toLocaleDateString() : ''}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Liked Games</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close ✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.sortSection}>
          <Text style={styles.sortLabel}>Sort By:</Text>
          <View style={styles.dropdown}>
            {sortOptions.map(({ option, key }) => (
              <TouchableOpacity
                key={key}
                onPress={() => setSortBy({ option, key })}
                style={[
                  styles.dropdownItem,
                  sortBy.key === key && styles.dropdownItemSelected,
                ]}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    sortBy.key === key && styles.dropdownItemTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <FlatList
            data={sortedGames}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
          />
        )}
        <GameFilterDetails
          game={selectedGame}
          visible={!!selectedGame}
          onClose={() => setSelectedGame(null)}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e272e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#485460',
  },
  headerTitle: {
    color: '#f1f2f6',
    fontWeight: 'bold',
    fontSize: 20,
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FF0000',
    borderRadius: 16,
  },
  closeButtonText: {
    color: '#f1f2f6',
    fontSize: 12,
    fontWeight: '600',
  },
  sortSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingBottom: 10,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#485460',
    paddingHorizontal: 16,
  },
  sortLabel: {
    color: '#f1f2f6',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 10,
  },
  dropdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dropdownItem: {
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f2f6',
    marginRight: 10,
    marginBottom: 8,
    backgroundColor: '#2f3640',
  },
  dropdownItemSelected: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  dropdownItemTextSelected: {
    color: '#000000',
    fontWeight: '700',
  },
  dropdownItemText: {
    color: '#f1f2f6',
  },
  listContent: {
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  row: {
    justifyContent: 'space-between',
  },
  gameCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#2f3640',
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    padding: 8,
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  imageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#222',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  gameTitle: {
    color: '#f1f2f6',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  gameRating: {
    color: '#ffd700',
    fontSize: 14,
    marginBottom: 2,
  },
  gameDate: {
    color: '#a4b0be',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
});

export default LikedGames; 