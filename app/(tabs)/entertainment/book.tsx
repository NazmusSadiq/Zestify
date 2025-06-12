import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BookDetails from '../../../components/BookDetails';
import { Book, useBookAPI } from '../../../services/book_API';

export default function Books() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { data, loading, error, getNewReleases, getBestSellers, getTrendingBooks } = useBookAPI();

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    await Promise.all([
      getNewReleases(),
      getBestSellers(),
      getTrendingBooks()
    ]);
  };

  const handleBookPress = (book: Book) => {
    setSelectedBook(book);
    setModalVisible(true);
  };

  const renderSection = (title: string, books: Book[] = []) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {books.map((book, index) => (
          <TouchableOpacity
            key={index}
            style={styles.bookCard}
            onPress={() => handleBookPress(book)}
          >
            <Image
              source={{ uri: book.volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192' }}
              style={styles.bookCover}
            />
            <Text style={styles.bookTitle} numberOfLines={2}>
              {book.volumeInfo.title}
            </Text>
            {book.volumeInfo.authors && (
              <Text style={styles.bookAuthor} numberOfLines={1}>
                {book.volumeInfo.authors[0]}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF0000" style={styles.loader} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading books. Please try again.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderSection("New Releases", data?.items)}
        {renderSection("Best Sellers", data?.items)}
        {renderSection("Trending", data?.items)}
      </ScrollView>

      <BookDetails
        book={selectedBook}
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedBook(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B2631",
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF0000",
    marginBottom: 15,
  },
  horizontalScroll: {
    marginBottom: 10,
  },
  bookCard: {
    width: 150,
    marginRight: 15,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#FF0000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  bookCover: {
    width: 126,
    height: 180,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#1B2631",
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  bookAuthor: {
    fontSize: 14,
    color: "#FF0000",
    textAlign: "center",
    marginTop: 4,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
});
