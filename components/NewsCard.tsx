import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NewsCardProps {
  category: string;
  date: string;
  title: string;
  source: string;
  imageUrl?: string;
  onPress?: () => void;
}

const NewsCard: React.FC<NewsCardProps> = ({
  category,
  date,
  title,
  source,
  imageUrl,
  onPress
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.noImage}>
            <Text style={styles.noImageText}>No Image</Text>
          </View>
        )}
      </View>

      <View style={styles.textContainer}>
        <View style={styles.metaContainer}>
          <Text style={styles.category}>{category}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>

        <Text style={styles.title}>{title}</Text>

        <View style={styles.sourceContainer}>
          <Text style={styles.source}>{source}</Text>
          <Text style={styles.readMore}>Read More</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3, // subtle shadow on Android
    shadowColor: '#000', // shadow on iOS
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#2c3e50',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#34495e',
  },
  noImageText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  textContainer: {
    padding: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  category: {
    color: '#ecf0f1',
    fontSize: 12,
    fontWeight: '600',
  },
  date: {
    color: '#95a5a6',
    fontSize: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sourceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  source: {
    color: '#3498db',
    fontSize: 13,
    fontWeight: '600',
  },
  readMore: {
    color: '#e74c3c',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default NewsCard;
