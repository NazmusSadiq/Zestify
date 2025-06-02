export const TMDB_CONFIG = {
  BASE_URL: "https://api.themoviedb.org/3",
  API_KEY: process.env.EXPO_PUBLIC_MOVIE_API_KEY,
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${process.env.EXPO_PUBLIC_MOVIE_API_KEY}`,
  },
};

export const fetchMovies = async ({
  query,
}: {
  query: string;
}): Promise<any[]> => {
  const endpoint = query
    ? `${TMDB_CONFIG.BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
    : `${TMDB_CONFIG.BASE_URL}/discover/movie?sort_by=popularity.desc`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: TMDB_CONFIG.headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch movies: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results;
};

export const fetchLatestMovies = async (): Promise<any[]> => {
  const endpoint = `${TMDB_CONFIG.BASE_URL}/movie/now_playing?language=en-US&page=1`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: TMDB_CONFIG.headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch latest movies: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results;
};

export const fetchUpcomingMovies = async (): Promise<any[]> => {
  const endpoint = `${TMDB_CONFIG.BASE_URL}/movie/upcoming?language=en-US&page=1`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: TMDB_CONFIG.headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch upcoming movies: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results;
};

export const fetchTopRatedMovies = async (): Promise<any[]> => {
  const endpoint = `${TMDB_CONFIG.BASE_URL}/movie/top_rated?language=en-US&page=1`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: TMDB_CONFIG.headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch top rated movies: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results;
};

export const fetchMovieDetails = async (
  movieId: string
): Promise<any> => {
  const detailsResponse = await fetch(
    `${TMDB_CONFIG.BASE_URL}/movie/${movieId}`,
    {
      method: "GET",
      headers: TMDB_CONFIG.headers,
    }
  );

  if (!detailsResponse.ok) {
    throw new Error(`Failed to fetch movie details: ${detailsResponse.statusText}`);
  }

  const detailsData = await detailsResponse.json();

  const creditsResponse = await fetch(
    `${TMDB_CONFIG.BASE_URL}/movie/${movieId}/credits`,
    {
      method: "GET",
      headers: TMDB_CONFIG.headers,
    }
  );

  if (!creditsResponse.ok) {
    throw new Error(`Failed to fetch movie credits: ${creditsResponse.statusText}`);
  }

  const creditsData = await creditsResponse.json();

  return {
    ...detailsData,
    cast: creditsData.cast.slice(0, 10),
  };
};

// Map genre names to TMDB genre IDs
export const genreIds: Record<string, number> = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  History: 36,
  Horror: 27,
  Music: 10402,
  Mystery: 9648,
  Romance: 10749,
  "Sci-Fi": 878,
  Thriller: 53,
  War: 10752,
  Western: 37,
};

export const fetchFilteredMovies = async (
  filterType: string,
  filterValue: string,
  maxPages: number = 10
): Promise<any[]> => {
  try {
    const allResults: any[] = [];

    const genreId = genreIds[filterValue]; 

    for (let page = 1; page <= maxPages; page++) {
      let endpoint = `${TMDB_CONFIG.BASE_URL}/discover/movie?api_key=${TMDB_CONFIG.API_KEY}&language=en-US&page=${page}`;

      switch (filterType) {
        case "Genre":
          if (!genreId) {
            console.warn(`Unknown genre: ${filterValue}`);
            return [];
          }
          endpoint += `&with_genres=${genreId}`;
          break;

        case "Release Year":
          if (!/^\d{4}$/.test(filterValue)) {
            console.warn(`Invalid release year: ${filterValue}`);
            return [];
          }
          endpoint += `&primary_release_year=${filterValue}`;
          break;

        case "Rating Above":
          const rating = parseFloat(filterValue);
          if (isNaN(rating) || rating < 0 || rating > 10) {
            console.warn(`Invalid rating: ${filterValue}`);
            return [];
          }
          endpoint += `&vote_average.gte=${rating}`;
          break;

        default:
          console.warn(`Unsupported filter type: ${filterType}`);
          return [];
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers: TMDB_CONFIG.headers,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch filtered movies: ${response.statusText}`
        );
      }

      const data = await response.json();
      allResults.push(...data.results);

      if (page >= data.total_pages) break;
    }

    return allResults;
  } catch (error) {
    console.error("Error fetching filtered movies:", error);
    return [];
  }
};


