import { useUser } from "@clerk/clerk-expo";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from "../firebase";
import type { Book } from '../services/book_API';

interface BookDetailsProps {
  book: Book | null;
  visible: boolean;
  onClose: () => void;
}

export default function BookDetails({ book, visible, onClose }: BookDetailsProps) {
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);

  // Use Google Books ID as unique identifier
  const itemId = book?.id;

  // Fetch like state from Firestore when itemId changes
  useEffect(() => {
    const fetchLike = async () => {
      if (!user?.primaryEmailAddress?.emailAddress || !itemId) {
        setIsLiked(false);
        return;
      }
      try {
        const booksDocRef = doc(db, user.primaryEmailAddress.emailAddress, "books");
        const docSnap = await getDoc(booksDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsLiked(!!data[itemId]);
        } else {
          setIsLiked(false);
        }
      } catch (e) {
        setIsLiked(false);
      }
    };
    fetchLike();
  }, [user?.primaryEmailAddress?.emailAddress, itemId]);

  const handleLike = async () => {
    if (!user?.primaryEmailAddress?.emailAddress || !itemId) return;
    setLoadingLike(true);
    try {
      const booksDocRef = doc(db, user.primaryEmailAddress.emailAddress, "books");
      await setDoc(booksDocRef, { [itemId]: true }, { merge: true });
      setIsLiked(true);
    } catch (e) {
      // Optionally show error
    }
    setLoadingLike(false);
  };

  const handleUnlike = async () => {
    if (!user?.primaryEmailAddress?.emailAddress || !itemId) return;
    setLoadingLike(true);
    try {
      const booksDocRef = doc(db, user.primaryEmailAddress.emailAddress, "books");
      await setDoc(booksDocRef, { [itemId]: false }, { merge: true });
      setIsLiked(false);
    } catch (e) {
      // Optionally show error
    }
    setLoadingLike(false);
  };

  if (!book) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <ScrollView style={styles.scrollView}>
            {/* Image at top, heart button at top right of image, then title below image */}
            <View style={{ position: 'relative', alignItems: 'center', marginBottom: 16 }}>
              {book.volumeInfo.imageLinks?.thumbnail && (
                <Image
                  source={{ uri: book.volumeInfo.imageLinks.thumbnail }}
                  style={styles.coverImage}
                />
              )}
              {/* Heart button at top right of image */}
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
            <Text style={styles.title}>{book.volumeInfo.title}</Text>
            {book.volumeInfo.authors && (
              <Text style={styles.author}>
                by {book.volumeInfo.authors.join(', ')}
              </Text>
            )}

            <View style={styles.detailsContainer}>
              {book.volumeInfo.publishedDate && (
                <Text style={styles.detailText}>
                  Published: {book.volumeInfo.publishedDate}
                </Text>
              )}
              {book.volumeInfo.publisher && (
                <Text style={styles.detailText}>
                  Publisher: {book.volumeInfo.publisher}
                </Text>
              )}
              {book.volumeInfo.categories && (
                <Text style={styles.detailText}>
                  Categories: {book.volumeInfo.categories.join(', ')}
                </Text>
              )}
              {book.volumeInfo.averageRating && (
                <Text style={styles.detailText}>
                  Rating: {book.volumeInfo.averageRating}/5
                  {book.volumeInfo.ratingsCount && ` (${book.volumeInfo.ratingsCount} ratings)`}
                </Text>
              )}
            </View>

            {book.volumeInfo.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionTitle}>Description</Text>
                <Text style={styles.description}>{book.volumeInfo.description}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1B2631',
    borderRadius: 20,
    // width: '90%',
    // maxHeight: '80%',
    padding: 20,
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 1,
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  coverImage: {
    width: 120,
    height: 180,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
  },
  titleContainer: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  author: {
    fontSize: 16,
    color: '#FF0000',
  },
  detailsContainer: {
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  descriptionContainer: {
    marginTop: 10,
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF0000',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  posterHeartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
  },
}); 