import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MovieCardProps {
  title: string;
  posterUrl?: string;
  onPress?: () => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ title, posterUrl, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={styles.poster} />
        ) : (
          <View style={styles.noPoster}>
            <Text style={styles.noPosterText}>No Image</Text>
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 0,
    paddingBottom: 4, // Ensure text is not clipped at the bottom
  },
  imageContainer: {
    aspectRatio: 2 / 3,
    height: 140,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#34495e',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  noPoster: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
  },
  noPosterText: {
    color: '#ccc',
    fontSize: 10,
  },
  titleContainer: {
    height: 36,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    maxWidth: '100%',
    paddingBottom: 8, // Increased to prevent visual clipping
    marginBottom: 2, // Extra space for safety
  },
});

export default MovieCard;