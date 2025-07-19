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

interface TVSeries {
  id: number;
  name: string;
  genre_ids: number[];
  vote_average: number;
  last_air_date: string;
  first_air_date: string;
  poster_path?: string | null;
  overview?: string;
  genres?: { id: number; name: string }[];
}

interface GenreCount {
  genreId: number;
  count: number;
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
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const minDate = sixMonthsAgo.toISOString().split('T')[0];
    
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    
    const endpoint = `${TMDB_CONFIG.BASE_URL}/discover/movie?` +
      `language=en-US&` +
      `sort_by=vote_average.desc&` +
      `page=1&` +
      `vote_count.gte=200&` +
      `with_original_language=bn|en|kr|ja&` +
      `primary_release_date.gte=${minDate}&` + 
      `primary_release_date.lte=${new Date().toISOString().split('T')[0]}`; 
  
    
    const response = await fetch(endpoint, {
      method: "GET",
      headers: TMDB_CONFIG.headers,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch fallback recommendations: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    const yearFiltered = data.results.filter((movie: Movie) => {
      const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 0;
      return releaseYear >= lastYear; 
    });
    
    const filtered = yearFiltered
      .filter((movie: Movie) => movie.vote_average > 8.0)
      .slice(0, 10);
    
    return filtered;
      
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

// ==================== TV SERIES PERSONALIZED RECOMMENDATIONS ====================

export const fetchPersonalizedTVRecommendations = async (userEmail?: string): Promise<TVSeries[]> => {
  try {
    
    if (!userEmail) {
      return await fetchFallbackTVRecommendations();
    }

    const likedTVIds = await fetchUserLikedTVSeries(userEmail);
    
    if (likedTVIds.length === 0) {
      return await fetchFallbackTVRecommendations();
    }

    const likedTVDetails = await fetchTVSeriesDetails(likedTVIds);
    
    const topGenres = analyzeTopTVGenres(likedTVDetails);
    console.info(`Top TV genres: ${topGenres}, Names: ${getTVGenreNames(topGenres)}`);
    
    if (topGenres.length === 0) {
      return await fetchFallbackTVRecommendations();
    }

    const recommendations = await fetchTVSeriesByGenres(topGenres);
    
    const filteredRecommendations = filterTVRecommendations(recommendations);
    
    if (filteredRecommendations.length === 0) {
      console.info("No TV series passed filters, using fallback");
      return await fetchFallbackTVRecommendations();
    }
    
    return filteredRecommendations;

  } catch (error) {
    console.error("Error fetching personalized TV recommendations:", error);
    return await fetchFallbackTVRecommendations();
  }
};

const fetchUserLikedTVSeries = async (userEmail: string): Promise<string[]> => {
  try {
    const docRef = doc(db, userEmail, "tvseries");
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return [];
    }
    
    const data = docSnap.data();
    // Filter only TV series that are marked as liked (true)
    return Object.entries(data)
      .filter(([_, isLiked]) => isLiked === true)
      .map(([tvId]) => tvId);
      
  } catch (error) {
    console.error("Error fetching user liked TV series:", error);
    return [];
  }
};

const fetchTVSeriesDetails = async (tvIds: string[]): Promise<TVSeries[]> => {
  try {
    const tvDetailsPromises = tvIds.slice(0, 50).map(async (tvId) => {
      const response = await fetch(
        `${TMDB_CONFIG.BASE_URL}/tv/${tvId}?language=en-US`,
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

    const tvDetails = await Promise.all(tvDetailsPromises);
    return tvDetails.filter(tv => tv !== null);
    
  } catch (error) {
    console.error("Error fetching TV series details:", error);
    return [];
  }
};

const analyzeTopTVGenres = (tvSeries: TVSeries[]): number[] => {
  const genreCounts: Map<number, number> = new Map();
  
  tvSeries.forEach(tv => {
    if (tv.genres) {
      tv.genres.forEach(genre => {
        genreCounts.set(genre.id, (genreCounts.get(genre.id) || 0) + 1);
      });
    } else if (tv.genre_ids) {
      tv.genre_ids.forEach(genreId => {
        genreCounts.set(genreId, (genreCounts.get(genreId) || 0) + 1);
      });
    }
  });
  
  const sortedGenres = Array.from(genreCounts.entries())
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 4)
    .map(([genreId]) => genreId);
    
  console.info(`Top genres from liked TV series:`, sortedGenres);
  return sortedGenres;
};

const fetchTVSeriesByGenres = async (genreIds: number[]): Promise<TVSeries[]> => {
  try {
    const allTVSeries: TVSeries[] = [];
    
    // Last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const minDate = threeMonthsAgo.toISOString().split('T')[0];
    
    for (const genreId of genreIds) {
     
      const sortingMethods = [
        'popularity.desc',     
        'last_air_date.desc',   
        'vote_average.desc'    
      ];
      
      for (const sortBy of sortingMethods) {
        for (let page = 1; page <= 5; page++) { 
          const endpoint = `${TMDB_CONFIG.BASE_URL}/discover/tv?` +
            `language=en-US&` +
            `sort_by=${sortBy}&` +
            `page=${page}&` +
            `with_genres=${genreId}&` + 
            `vote_count.gte=10&` + 
            `with_original_language=bn|en|kr|ja&` +
            `last_air_date.lte=${new Date().toISOString().split('T')[0]}&` +
            `last_air_date.gte=${minDate}`;
             
          const response = await fetch(endpoint, {
            method: "GET",
            headers: TMDB_CONFIG.headers,
          });
          
          if (!response.ok) {
            continue;
          }
          
          const data = await response.json();
   
          if (data.results && data.results.length > 0) {
           allTVSeries.push(...data.results);
          }
          
          // If we got less than expected, no more pages available
          if (!data.results || data.results.length < 15) {
            break;
          }
        }
      }
    }
    
    // Remove duplicates based on TV series ID
    const uniqueTVSeries = allTVSeries.filter((tv, index, self) => 
      index === self.findIndex(t => t.id === tv.id)
    );

    return uniqueTVSeries;
    
  } catch (error) {
    console.error("Error fetching TV series by genres:", error);
    return [];
  }
};

const filterTVRecommendations = (tvSeries: TVSeries[]): TVSeries[] => {
  
  const filtered = tvSeries
    .filter(tv => tv.vote_average > 7.5) 
    .sort((a, b) => b.vote_average - a.vote_average)
    .slice(0, 20); 
  
  return filtered;
};

const fetchFallbackTVRecommendations = async (): Promise<TVSeries[]> => {
  try {
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const minDate = threeMonthsAgo.toISOString().split('T')[0];
    
    const endpoint = `${TMDB_CONFIG.BASE_URL}/discover/tv?` +
      `language=en-US&` +
      `sort_by=vote_average.desc&` +
      `page=1&` +
      `vote_count.gte=100&` +
      `with_original_language=bn|en|kr|ja&` +
      `last_air_date.lte=${new Date().toISOString().split('T')[0]}&` + 
      `last_air_date.gte=${minDate}`;
  
    const response = await fetch(endpoint, {
      method: "GET",
      headers: TMDB_CONFIG.headers,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch fallback TV recommendations: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    const filtered = data.results
      .filter((tv: TVSeries) => tv.vote_average > 7.5)
      .slice(0, 10);
    
    return filtered;
      
  } catch (error) {
    console.error("Error fetching fallback TV recommendations:", error);
    return [];
  }
};

/**
 * Helper function to get TV genre names for debugging
 */
export const getTVGenreNames = (genreIds: number[]): string[] => {
  const tvGenreMap: Record<number, string> = {
    10759: "Action & Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    10762: "Kids",
    9648: "Mystery",
    10763: "News",
    10764: "Reality",
    10765: "Sci-Fi & Fantasy",
    10766: "Soap",
    10767: "Talk",
    10768: "War & Politics",
    37: "Western"
  };
  
  return genreIds.map(id => tvGenreMap[id] || `Unknown (${id})`);
};
