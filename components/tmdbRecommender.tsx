import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const TMDB_CONFIG = {
  BASE_URL: "https://api.themoviedb.org/3",
  API_KEY: process.env.EXPO_PUBLIC_MOVIE_API_KEY,
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${process.env.EXPO_PUBLIC_MOVIE_API_KEY}`,
  },
};

interface Movie {
  id: number;
  title: string;
  genre_ids: number[];
  vote_average: number;
  release_date: string;
  poster_path?: string | null;
  overview?: string;
  genres?: { id: number; name: string }[];
}


export const fetchPersonalizedRecommendations = async (userEmail?: string): Promise<Movie[]> => {
  try {
    
    if (!userEmail) {
      return await fetchFallbackRecommendations();
    }

    const likedMovieIds = await fetchUserLikedMovies(userEmail);
    
    if (likedMovieIds.length === 0) {
      return await fetchFallbackRecommendations();
    }

    const likedMoviesDetails = await fetchMoviesDetails(likedMovieIds);
    
    const topGenres = analyzeTopGenres(likedMoviesDetails);
    console.info(`Top genres: ${topGenres}, Names: ${getGenreNames(topGenres)}`);
    
    if (topGenres.length === 0) {
      return await fetchFallbackRecommendations();
    }

    const recommendations = await fetchMoviesByGenres(topGenres);
    
    const filteredRecommendations = filterRecommendations(recommendations);
    
    if (filteredRecommendations.length === 0) {
      console.info("No movies passed filters, using fallback");
      return await fetchFallbackRecommendations();
    }
    
    return filteredRecommendations;

  } catch (error) {
    console.error("Error fetching personalized recommendations:", error);
    return await fetchFallbackRecommendations();
  }
};


const fetchUserLikedMovies = async (userEmail: string): Promise<string[]> => {
  try {
    const docRef = doc(db, userEmail, "movies");
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return [];
    }
    
    const data = docSnap.data();
    // Filter only movies that are marked as liked (true)
    return Object.entries(data)
      .filter(([_, isLiked]) => isLiked === true)
      .map(([movieId]) => movieId);
      
  } catch (error) {
    console.error("Error fetching user liked movies:", error);
    return [];
  }
};


const fetchMoviesDetails = async (movieIds: string[]): Promise<Movie[]> => {
  try {
    const movieDetailsPromises = movieIds.slice(0, 50).map(async (movieId) => {
      const response = await fetch(
        `${TMDB_CONFIG.BASE_URL}/movie/${movieId}?language=en-US`,
        {
          method: "GET",
          headers: TMDB_CONFIG.headers,
        }
      );
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    });

    const movieDetails = await Promise.all(movieDetailsPromises);
    return movieDetails.filter(movie => movie !== null);
    
  } catch (error) {
    console.error("Error fetching movies details:", error);
    return [];
  }
};


const analyzeTopGenres = (movies: Movie[]): number[] => {
  const genreCounts: Map<number, number> = new Map();
  
  movies.forEach(movie => {
    if (movie.genres) {
      movie.genres.forEach(genre => {
        genreCounts.set(genre.id, (genreCounts.get(genre.id) || 0) + 1);
      });
    } else if (movie.genre_ids) {
      movie.genre_ids.forEach(genreId => {
        genreCounts.set(genreId, (genreCounts.get(genreId) || 0) + 1);
      });
    }
  });
  
  const sortedGenres = Array.from(genreCounts.entries())
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 4)
    .map(([genreId]) => genreId);
    
  console.info(`Top genres from liked movies:`, sortedGenres);
  return sortedGenres;
};

const fetchMoviesByGenres = async (genreIds: number[]): Promise<Movie[]> => {
  try {
    const allMovies: Movie[] = [];
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 2);
    const minDate = sixMonthsAgo.toISOString().split('T')[0];
    
    for (const genreId of genreIds) {
     
      const sortingMethods = [
        'popularity.desc',     
        'release_date.desc',   
        'vote_average.desc'    
      ];
      
      for (const sortBy of sortingMethods) {
        for (let page = 1; page <= 5; page++) { 
          const endpoint = `${TMDB_CONFIG.BASE_URL}/discover/movie?` +
            `language=en-US&` +
            `sort_by=${sortBy}&` +
            `page=${page}&` +
            `with_genres=${genreId}&` + 
            `vote_count.gte=5&` + 
            `with_original_language=bn|en|ja&` +
            `primary_release_date.gte=${minDate}&` +
            `primary_release_date.lte=${new Date().toISOString().split('T')[0]}`;
             
          const response = await fetch(endpoint, {
            method: "GET",
            headers: TMDB_CONFIG.headers,
          });
          
          if (!response.ok) {
            continue;
          }
          
          const data = await response.json();
   
          if (data.results && data.results.length > 0) {
           allMovies.push(...data.results);
          }
          
          // If we got less than expected, no more pages available
          if (!data.results || data.results.length < 15) {
            break;
          }
        }
      }
    }
    
    // Remove duplicates based on movie ID
    const uniqueMovies = allMovies.filter((movie, index, self) => 
      index === self.findIndex(m => m.id === movie.id)
    );

    return uniqueMovies;
    
  } catch (error) {
    console.error("Error fetching movies by genres:", error);
    return [];
  }
};


const filterRecommendations = (movies: Movie[]): Movie[] => {
  
  const filtered = movies
    .filter(movie => movie.vote_average > 7.0) 
    .sort((a, b) => b.vote_average - a.vote_average)
    .slice(0, 20); 
  
  return filtered;
};

const fetchFallbackRecommendations = async (): Promise<Movie[]> => {
  try {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const minDate = twoMonthsAgo.toISOString().split('T')[0];
    const maxDate = new Date().toISOString().split('T')[0];

    let allMovies: Movie[] = [];
    // Fetch first 5 pages for more results
    for (let page = 1; page <= 5; page++) {
      const endpoint = `${TMDB_CONFIG.BASE_URL}/discover/movie?` +
        `language=en-US&` +
        `sort_by=vote_average.desc&` +
        `page=${page}&` +
        `vote_count.gte=20&` +
        `with_original_language=bn|en|kr|ja&` +
        `primary_release_date.gte=${minDate}&` +
        `primary_release_date.lte=${maxDate}`;

      const response = await fetch(endpoint, {
        method: "GET",
        headers: TMDB_CONFIG.headers,
      });
      if (!response.ok) {
        continue;
      }
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        allMovies.push(...data.results);
      }
      // If less than 15 results, break early
      if (!data.results || data.results.length < 15) {
        break;
      }
    }

    // Remove duplicates by movie ID
    const uniqueMovies = allMovies.filter((movie, index, self) =>
      index === self.findIndex(m => m.id === movie.id)
    );

    // Filter by vote_average > 7.0
    const filtered = uniqueMovies.filter((movie: Movie) => movie.vote_average > 7.0);
    return filtered.slice(0, 30); // Return up to 30 movies
  } catch (error) {
    console.error("Error fetching fallback recommendations:", error);
    return [];
  }
};

/**
 * Helper function to get genre names for debugging
 */
export const getGenreNames = (genreIds: number[]): string[] => {
  const genreMap: Record<number, string> = {
    28: "Action",
    12: "Adventure", 
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Science Fiction",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western"
  };
  
  return genreIds.map(id => genreMap[id] || `Unknown (${id})`);
};
