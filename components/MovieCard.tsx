import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface MovieCardProps {
  title: string;
  posterUrl?: string;
}

const MovieCard: React.FC<MovieCardProps> = ({ title, posterUrl }) => {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={styles.poster} />
        ) : (
          <View style={styles.noPoster}>
            <Text style={styles.noPosterText}>No Image</Text>
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 0,
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
    height: 36, // approximate height for 2 lines of text at fontSize 12 + marginTop
    justifyContent: 'center', // or 'flex-start' if you want top align
  },
  title: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    maxWidth: '100%',
  },
});



export default MovieCard;
