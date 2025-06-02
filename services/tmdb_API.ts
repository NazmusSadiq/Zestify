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

export const fetchTVSeries = async ({
  query,
}: {
  query: string;
}): Promise<any[]> => {
  const endpoint = query
    ? `${TMDB_CONFIG.BASE_URL}/search/tv?query=${encodeURIComponent(query)}`
    : `${TMDB_CONFIG.BASE_URL}/tv/popular`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: TMDB_CONFIG.headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch TV series: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results;
};

export const fetchLatestMovies = async (pages: number = 1): Promise<any[]> => {
  const baseEndpoint = `${TMDB_CONFIG.BASE_URL}/movie/now_playing?language=en-US`;
  let allResults: any[] = [];

  for (let page = 1; page <= pages; page++) {
    const response = await fetch(`${baseEndpoint}&page=${page}`, {
      method: "GET",
      headers: TMDB_CONFIG.headers,
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch latest movies (page ${page}): ${response.statusText}`);
    }
    const data = await response.json();
    allResults.push(...data.results);
  }

  return allResults;
};

export const fetchUpcomingMovies = async (pages: number = 1): Promise<any[]> => {
  const baseEndpoint = `${TMDB_CONFIG.BASE_URL}/movie/upcoming?language=en-US`;
  let allResults: any[] = [];

  for (let page = 1; page <= pages; page++) {
    const response = await fetch(`${baseEndpoint}&page=${page}`, {
      method: "GET",
      headers: TMDB_CONFIG.headers,
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch upcoming movies (page ${page}): ${response.statusText}`);
    }
    const data = await response.json();
    allResults.push(...data.results);
  }

  return allResults;
};

export const fetchTopRatedMovies = async (pages: number = 1): Promise<any[]> => {
  const baseEndpoint = `${TMDB_CONFIG.BASE_URL}/movie/top_rated?language=en-US`;
  let allResults: any[] = [];

  for (let page = 1; page <= pages; page++) {
    const response = await fetch(`${baseEndpoint}&page=${page}`, {
      method: "GET",
      headers: TMDB_CONFIG.headers,
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch top rated movies (page ${page}): ${response.statusText}`);
    }
    const data = await response.json();
    allResults.push(...data.results);
  }

  return allResults;
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
export const fetchLatestTVSeries = async (pages: number = 1): Promise<any[]> => {
  const baseEndpoint = `${TMDB_CONFIG.BASE_URL}/tv/on_the_air?language=en-US`;
  let allResults: any[] = [];

  for (let page = 1; page <= pages; page++) {
    const response = await fetch(`${baseEndpoint}&page=${page}`, {
      method: "GET",
      headers: TMDB_CONFIG.headers,
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch latest TV series (page ${page}): ${response.statusText}`);
    }
    const data = await response.json();
    allResults.push(...data.results);
  }

  return allResults;
};

export const fetchUpcomingTVSeries = async (pages: number = 1): Promise<any[]> => {
  const baseEndpoint = `${TMDB_CONFIG.BASE_URL}/tv/airing_today?language=en-US`;
  let allResults: any[] = [];

  for (let page = 1; page <= pages; page++) {
    const response = await fetch(`${baseEndpoint}&page=${page}`, {
      method: "GET",
      headers: TMDB_CONFIG.headers,
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch upcoming TV series (page ${page}): ${response.statusText}`);
    }
    const data = await response.json();
    allResults.push(...data.results);
  }

  return allResults;
};

export const fetchTopRatedTVSeries = async (pages: number = 1): Promise<any[]> => {
  const baseEndpoint = `${TMDB_CONFIG.BASE_URL}/tv/top_rated?language=en-US`;
  let allResults: any[] = [];

  for (let page = 1; page <= pages; page++) {
    const response = await fetch(`${baseEndpoint}&page=${page}`, {
      method: "GET",
      headers: TMDB_CONFIG.headers,
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch top rated TV series (page ${page}): ${response.statusText}`);
    }
    const data = await response.json();
    allResults.push(...data.results);
  }

  return allResults;
};

export const fetchTVSeriesDetails = async (
  tvSeriesId: string
): Promise<any> => {
  // Fetch main TV series details
  const detailsResponse = await fetch(
    `${TMDB_CONFIG.BASE_URL}/tv/${tvSeriesId}`,
    {
      method: "GET",
      headers: TMDB_CONFIG.headers,
    }
  );

  if (!detailsResponse.ok) {
    throw new Error(`Failed to fetch TV series details: ${detailsResponse.statusText}`);
  }

  const detailsData = await detailsResponse.json();

  // Filter out season 0 (specials)
  const filteredSeasons = (detailsData.seasons || []).filter(
    (season: any) => season.season_number !== 0
  );

  // Fetch credits (cast)
  const creditsResponse = await fetch(
    `${TMDB_CONFIG.BASE_URL}/tv/${tvSeriesId}/credits`,
    {
      method: "GET",
      headers: TMDB_CONFIG.headers,
    }
  );

  if (!creditsResponse.ok) {
    throw new Error(`Failed to fetch TV series credits: ${creditsResponse.statusText}`);
  }

  const creditsData = await creditsResponse.json();

  // Fetch detailed info for each valid season
  const seasonsDetailed = await Promise.all(
    filteredSeasons.map(async (season: any) => {
      const seasonResponse = await fetch(
        `${TMDB_CONFIG.BASE_URL}/tv/${tvSeriesId}/season/${season.season_number}`,
        {
          method: "GET",
          headers: TMDB_CONFIG.headers,
        }
      );

      if (!seasonResponse.ok) {
        return {
          ...season,
          episodes: [], // fallback empty episodes
        };
      }

      const seasonData = await seasonResponse.json();

      const episodesDetailed = (seasonData.episodes || []).map((ep: any) => ({
        id: ep.id,
        episode_number: ep.episode_number,
        name: ep.name,
        overview: ep.overview,
        air_date: ep.air_date,
        vote_average: ep.vote_average,
        vote_count: ep.vote_count,
      }));

      return {
        ...season,
        episodes: episodesDetailed,
      };
    })
  );

  return {
    ...detailsData,
    cast: creditsData.cast.slice(0, 10),
    seasons: seasonsDetailed,
  };
};


const languageCodes: { [key: string]: string } = {
  English: "en",
  Spanish: "es",
  Bengali: "bn",
  Korean: "ko",
  Hindi: "hi",
};

export const movieGenreIds: Record<string, number> = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Horror: 27,
  Romance: 10749,
  "Sci-Fi": 878,
  Thriller: 53,
};

export const tvGenreIds: Record<string, number> = {
  Action: 10759,
  Adventure: 10759,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  "Sci-Fi": 10765,
};

export const networkIds: Record<string, number> = {
  Netflix: 213,
  HBO: 49,
  "Amazon Prime": 1024,
  Hulu: 453,
  NBC: 6,
  FOX: 19,
  CW: 71,
  "Disney+": 2739,
};

export const fetchFilteredMovies = async (
  filterType: string,
  filterValue: string,
  maxPages: number = 10
): Promise<any[]> => {
  try {
    const allResults: any[] = [];

    const genreId = movieGenreIds[filterValue];
    const languageCode = languageCodes[filterValue];

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

        case "Language":
          if (!languageCode) {
            console.warn(`Unknown language: ${filterValue}`);
            return [];
          }
          endpoint += `&with_original_language=${languageCode}`;
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

export const fetchFilteredTVSeries = async (
  filterType: string,
  filterValue: string,
  maxPages: number = 10
): Promise<any[]> => {
  try {
    const allResults: any[] = [];

    const genreId = tvGenreIds[filterValue];
    const languageCode = languageCodes[filterValue];

    for (let page = 1; page <= maxPages; page++) {
      let endpoint = `${TMDB_CONFIG.BASE_URL}/discover/tv?api_key=${TMDB_CONFIG.API_KEY}&language=en-US&page=${page}`;

      switch (filterType) {
        case "Genre":
          if (!genreId) {
            console.warn(`Unknown genre: ${filterValue}`);
            return [];
          }
          endpoint += `&with_genres=${genreId}`;
          break;

        case "Network":
          const networkId = networkIds[filterValue];
          if (!networkId) {
            console.warn(`Unknown network: ${filterValue}`);
            return [];
          }
          endpoint += `&with_networks=${networkId}`;
          break;

        case "Language":
          if (!languageCode) {
            console.warn(`Unknown language: ${filterValue}`);
            return [];
          }
          endpoint += `&with_original_language=${languageCode}`;
          break;

        case "Release Year":
          if (!/^\d{4}$/.test(filterValue)) {
            console.warn(`Invalid release year: ${filterValue}`);
            return [];
          }
          endpoint += `&first_air_date_year=${filterValue}`;
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
          `Failed to fetch filtered TV series: ${response.statusText}`
        );
      }

      const data = await response.json();
      allResults.push(...data.results);

      if (page >= data.total_pages) break;
    }

    return allResults;
  } catch (error) {
    console.error("Error fetching filtered TV series:", error);
    return [];
  }
};

