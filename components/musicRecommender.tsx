import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Album, getAlbumDetails, getGenreContent } from "../services/music_API";

// Fallback genres if user has no likes
const FALLBACK_GENRES = ["pop", "rock", "hip-hop", "electronic", "jazz"];

function extractAlbumGenres(album: any): string[] {
  // Last.fm album.getInfo returns tags as album.tags.tag (array of {name: string})
  if (album && album.tags && Array.isArray(album.tags.tag)) {
    return album.tags.tag.map((t: any) => t.name.toLowerCase());
  }
  return [];
}

export const fetchPersonalizedMusicRecommendations = async (userEmail?: string): Promise<Album[]> => {
  let genres: string[] = [];
  let genreScore: Record<string, number> = {};

  // Try to fetch user-liked albums from Firestore
  if (userEmail) {
    try {
      const docRef = doc(db, userEmail, "musicAlbums");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const likedKeys = Object.entries(data)
          .filter(([_, v]) => v === true)
          .map(([key]) => key); // key format: albumName:artistName
        // Fetch album details and accumulate genre scores
        const albumDetailsArr = await Promise.all(
          likedKeys.map(async (key) => {
            const match = key.match(/^(.+?):(.+)$/);
            if (!match) return null;
            const [, albumName, artistName] = match;
            try {
              return await getAlbumDetails(albumName, artistName);
            } catch {
              return null;
            }
          })
        );
        for (const album of albumDetailsArr) {
          if (!album) continue;
          const albumGenres = extractAlbumGenres(album);
          const listeners = parseInt(album.listeners || '1', 10) || 1;
          for (const genre of albumGenres) {
            genreScore[genre] = (genreScore[genre] || 0) + listeners;
          }
        }
        genres = Object.entries(genreScore)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([genre]) => genre);
      }
    } catch (e) {
      console.error("Error fetching user liked albums:", e);
    }
  }

  // Fallback to default genres if none found
  if (!genres.length) {
    genres = FALLBACK_GENRES;
  }

  // Fetch top albums for each genre
  const allAlbums: Album[] = [];
  for (const genre of genres) {
    try {
      const genreContent = await getGenreContent(genre);
      if (genreContent && genreContent.topAlbums) {
        allAlbums.push(...genreContent.topAlbums);
      }
    } catch (e) {
      console.error(`Error fetching albums for genre ${genre}:`, e);
    }
  }

  // Deduplicate albums by name + artist
  const seen = new Set<string>();
  const uniqueAlbums = allAlbums.filter((album) => {
    const key = `${album.name}|${album.artist.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by listeners (descending)
  uniqueAlbums.sort((a, b) => (parseInt(b.listeners || '0', 10)) - (parseInt(a.listeners || '0', 10)));

  // Return top 20 recommendations
  return uniqueAlbums.slice(0, 20);
};

export type { Album };

