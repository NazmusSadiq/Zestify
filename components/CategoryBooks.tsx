import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Book, searchBooks } from '../services/book_API';
import BookDetails from './BookDetails';

interface CategoryBooksProps {
  category: string;
  subcategory: string;
  visible: boolean;
  onClose: () => void;
}

type SortOption = 'title' | 'author' | 'rating' | 'date';

export default function CategoryBooks({ category, subcategory, visible, onClose }: CategoryBooksProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (visible) {
      loadBooks();
    }
  }, [visible, category, subcategory]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const query = `subject:${subcategory}`;
      const response = await searchBooks(query);
      setBooks(response.items || []);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortBooks = (books: Book[]) => {
    return [...books].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.volumeInfo.title.localeCompare(b.volumeInfo.title);
          break;
        case 'author':
          const authorA = a.volumeInfo.authors?.[0] || '';
          const authorB = b.volumeInfo.authors?.[0] || '';
          comparison = authorA.localeCompare(authorB);
          break;
        case 'rating':
          const ratingA = a.volumeInfo.averageRating || 0;
          const ratingB = b.volumeInfo.averageRating || 0;
          comparison = ratingA - ratingB;
          break;
        case 'date':
          const dateA = new Date(a.volumeInfo.publishedDate || '').getTime();
          const dateB = new Date(b.volumeInfo.publishedDate || '').getTime();
          comparison = dateA - dateB;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortOrder('asc');
    }
  };

  const renderSortButton = (option: SortOption, label: string) => (
    <TouchableOpacity
      style={[
        styles.sortButton,
        sortBy === option && styles.sortButtonActive
      ]}
      onPress={() => handleSort(option)}
    >
      <Text style={[
        styles.sortButtonText,
        sortBy === option && styles.sortButtonTextActive
      ]}>
        {label} {sortBy === option && (sortOrder === 'asc' ? '↑' : '↓')}
      </Text>
    </TouchableOpacity>
  );

  const renderBook = ({ item }: { item: Book }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => setSelectedBook(item)}
    >
      <Image
        source={{ uri: item.volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192' }}
        style={styles.bookCover}
      />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.volumeInfo.title}
        </Text>
        {item.volumeInfo.authors && (
          <Text style={styles.bookAuthor} numberOfLines={1}>
            {item.volumeInfo.authors[0]}
          </Text>
        )}
        {item.volumeInfo.averageRating && (
          <Text style={styles.bookRating}>
            Rating: {item.volumeInfo.averageRating}/5
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{subcategory}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sortContainer}>
          {renderSortButton('title', 'Title')}
          {renderSortButton('author', 'Author')}
          {renderSortButton('rating', 'Rating')}
          {renderSortButton('date', 'Date')}
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
            contentContainerStyle={styles.bookList}
            showsVerticalScrollIndicator={false}
          />
        )}

        <BookDetails
          book={selectedBook}
          visible={!!selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B2631',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#FF0000',
  },
  sortContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#2C3E50',
    justifyContent: 'space-around',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#1a1a1a',
  },
  sortButtonActive: {
    backgroundColor: '#FF0000',
  },
  sortButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  sortButtonTextActive: {
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookList: {
    padding: 10,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#2C3E50',
    borderRadius: 10,
    marginBottom: 10,
    padding: 10,
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: 5,
  },
  bookInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#FF0000',
    marginBottom: 5,
  },
  bookRating: {
    fontSize: 12,
    color: '#ccc',
  },
}); 