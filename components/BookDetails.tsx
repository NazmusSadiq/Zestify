import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from '@expo/vector-icons';
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
  const itemId = book?.id;

  useEffect(() => {
    const fetchLike = async () => {
      if (!user?.primaryEmailAddress?.emailAddress || !itemId) {
        setIsLiked(false);
        return;
      }
      try {
        const docRef = doc(db, user.primaryEmailAddress.emailAddress, "books");
        const docSnap = await getDoc(docRef);
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
      const docRef = doc(db, user.primaryEmailAddress.emailAddress, "books");
      await setDoc(docRef, { [itemId]: true }, { merge: true });
      setIsLiked(true);
    } catch (e) {}
    setLoadingLike(false);
  };

  const handleUnlike = async () => {
    if (!user?.primaryEmailAddress?.emailAddress || !itemId) return;
    setLoadingLike(true);
    try {
      const docRef = doc(db, user.primaryEmailAddress.emailAddress, "books");
      await setDoc(docRef, { [itemId]: false }, { merge: true });
      setIsLiked(false);
    } catch (e) {}
    setLoadingLike(false);
  };

  if (!book) return null;

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
              {book.volumeInfo.imageLinks?.thumbnail && (
                <Image
                  source={{ uri: book.volumeInfo.imageLinks.thumbnail }}
                  style={styles.image}
                  resizeMode="cover"
                />
              )}
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
              <Text style={styles.title}>{book.volumeInfo.title}</Text>
              {book.volumeInfo.authors && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Authors:</Text>
                  <Text style={styles.value}>{book.volumeInfo.authors.join(', ')}</Text>
                </View>
              )}
              {book.volumeInfo.publishedDate && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Published:</Text>
                  <Text style={styles.value}>{book.volumeInfo.publishedDate}</Text>
                </View>
              )}
              {book.volumeInfo.publisher && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Publisher:</Text>
                  <Text style={styles.value}>{book.volumeInfo.publisher}</Text>
                </View>
              )}
              {book.volumeInfo.categories && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Categories</Text>
                  <Text style={styles.value}>{book.volumeInfo.categories.join(', ')}</Text>
                </View>
              )}
              {book.volumeInfo.averageRating && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Rating:</Text>
                  <Text style={styles.value}>{book.volumeInfo.averageRating}/5{book.volumeInfo.ratingsCount && ` (${book.volumeInfo.ratingsCount} ratings)`}</Text>
                </View>
              )}

              {book.volumeInfo.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.description}>{book.volumeInfo.description.replace(/<[^>]+>/g, "")}</Text>
                </View>
              )}
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
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 15,
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
  description: {
    color: '#CCCCCC',
    lineHeight: 22,
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
});