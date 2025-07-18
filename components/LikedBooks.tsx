import { useUser } from "@clerk/clerk-expo";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from "../firebase";
import { Book, getBookDetails } from '../services/book_API';
import BookDetails from './BookDetails';
import MovieCard from './MovieCard';

const sortOptions = [
  { option: 'Title', key: 'title' },
  { option: 'Author', key: 'author' },
  { option: 'Rating', key: 'rating' },
  { option: 'Date', key: 'date' },
];

interface LikedBooksProps {
  visible: boolean;
  onClose: () => void;
}

export default function LikedBooks({ visible, onClose }: LikedBooksProps) {
  const { user } = useUser();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [sortBy, setSortBy] = useState(sortOptions[0]);

  useEffect(() => {
    if (!visible) return;
    const fetchLikedBooks = async () => {
      setLoading(true);
      try {
        if (!user?.primaryEmailAddress?.emailAddress) {
          setBooks([]);
          return;
        }
        const docRef = doc(db, user.primaryEmailAddress.emailAddress, "books");
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
                return await getBookDetails(id);
              } catch {
                return null;
              }
            })
          );
          setBooks(detailsArr.filter((b): b is Book => b !== null));
        } else {
          setBooks([]);
        }
      } catch (err) {
        setBooks([]);
      }
      setLoading(false);
    };
    fetchLikedBooks();
  }, [visible, user?.primaryEmailAddress?.emailAddress]);

  const sortBooks = (books: Book[]) => {
    return [...books].sort((a, b) => {
      let comparison = 0;
      switch (sortBy.key) {
        case 'title':
          comparison = (a.volumeInfo.title || '').localeCompare(b.volumeInfo.title || '');
          break;
        case 'author':
          const authorA = a.volumeInfo.authors?.[0] || '';
          const authorB = b.volumeInfo.authors?.[0] || '';
          comparison = authorA.localeCompare(authorB);
          break;
        case 'rating':
          const ratingA = a.volumeInfo.averageRating || 0;
          const ratingB = b.volumeInfo.averageRating || 0;
          comparison = ratingB - ratingA; // Higher ratings first
          break;
        case 'date':
          const dateA = new Date(a.volumeInfo.publishedDate || '').getTime();
          const dateB = new Date(b.volumeInfo.publishedDate || '').getTime();
          comparison = dateB - dateA; // Newer dates first
          break;
      }
      return comparison;
    });
  };

  const renderBook = ({ item }: { item: Book }) => {
    const title = item.volumeInfo.title || 'Unknown Title';
    const posterUrl = item.volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192';
    const averageRating = item.volumeInfo.averageRating || null;
    const publishedDate = item.volumeInfo.publishedDate || null;

    return (
      <View style={styles.cardWrapper}>
        <MovieCard 
          title={title} 
          posterUrl={posterUrl} 
          onPress={() => setSelectedBook(item)} 
        />
        <View style={styles.infoContainer}>
          {averageRating !== null && (
            <Text style={styles.infoText}>⭐ {averageRating.toFixed(1)}</Text>
          )}
          {publishedDate && (
            <Text style={styles.infoText}>
              {new Date(publishedDate).getFullYear()}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.fullscreenContainer}>
        <View style={styles.sortSection}>
          <View style={styles.sortHeader}>
            <Text style={styles.sortLabel}>Sort By:</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close ✕</Text>
            </TouchableOpacity>
          </View>

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
            <ActivityIndicator size="large" color="#FF0000" />
          </View>
        ) : (
          <FlatList
            data={sortBooks(books)}
            renderItem={renderBook}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
          />
        )}

        <BookDetails
          book={selectedBook}
          visible={!!selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "#1e272e",
    paddingTop: 10,
  },
  sortSection: {
    backgroundColor: "#000",
    paddingBottom: 10,
    paddingTop: 12,
    marginTop: -10,
    borderBottomWidth: 1,
    borderBottomColor: "#485460",
  },
  sortHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: -10,
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#FF0000",
    borderRadius: 16,
  },
  closeButtonText: {
    color: "#f1f2f6",
    fontSize: 12,
    fontWeight: "600",
  },
  sortLabel: {
    color: "#f1f2f6",
    fontWeight: "bold",
    fontSize: 16,
  },
  dropdown: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: -10,
  },
  dropdownItem: {
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f1f2f6",
    marginRight: 10,
    marginBottom: 8,
    backgroundColor: "#2f3640",
  },
  dropdownItemSelected: {
    backgroundColor: "#ffffff",
    borderColor: "#ffffff",
  },
  dropdownItemTextSelected: {
    color: "#000000",
    fontWeight: "700",
  },
  dropdownItemText: {
    color: "#f1f2f6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  row: {
    justifyContent: "space-between",
  },
  cardWrapper: {
    flex: 1 / 3,
    marginVertical: 8,
    marginHorizontal: 14,
  },
  infoContainer: {
    marginTop: 6,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  infoText: {
    color: "#d2dae2",
    fontWeight: "bold",
    fontSize: 12,
  },
}); 