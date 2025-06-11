import axios from 'axios';

const RAWG_API_KEY = '18c0a8a51d504896a5a7a397ff662be0';
const BASE_URL = 'https://api.rawg.io/api';

export interface Game {
  id: number;
  name: string;
  background_image: string;
  rating: number;
  released: string;
  platforms: {
    platform: {
      name: string;
    };
  }[];
  genres: {
    id: number;
    name: string;
    slug: string;
    games_count: number;
    image_background: string;
  }[];
  description: string;
  website: string;
  developers: {
    name: string;
  }[];
  publishers: {
    name: string;
  }[];
  added: number;
  added_by_status: {
    toplay?: number;
    yet?: number;
    [key: string]: number | undefined;
  };
  esrb_rating?: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface GameResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Game[];
}

export const fetchTrendingGames = async (): Promise<GameResponse> => {
  try {
    const response = await axios.get(`${BASE_URL}/games`, {
      params: {
        key: RAWG_API_KEY,
        ordering: '-rating',
        page_size: 10,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching trending games:', error);
    throw error;
  }
};

export const fetchNewReleases = async (): Promise<GameResponse> => {
  try {
    const response = await axios.get(`${BASE_URL}/games`, {
      params: {
        key: RAWG_API_KEY,
        ordering: '-released',
        page_size: 10,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching new releases:', error);
    throw error;
  }
};

export const fetchGameDetails = async (gameId: number): Promise<Game> => {
  try {
    const response = await axios.get(`${BASE_URL}/games/${gameId}`, {
      params: {
        key: RAWG_API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching game details:', error);
    throw error;
  }
};

export const searchGames = async (query: string): Promise<GameResponse> => {
  try {
    const response = await axios.get(`${BASE_URL}/games`, {
      params: {
        key: RAWG_API_KEY,
        search: query,
        page_size: 10,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching games:', error);
    throw error;
  }
};

export const fetchTopRatedGames = async (): Promise<GameResponse> => {
  try {
    const response = await axios.get(`${BASE_URL}/games`, {
      params: {
        key: RAWG_API_KEY,
        ordering: '-metacritic',
        page_size: 10,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching top rated games:', error);
    throw error;
  }
};

export const fetchUpcomingGames = async (): Promise<GameResponse> => {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    
    const response = await axios.get(`${BASE_URL}/games`, {
      params: {
        key: RAWG_API_KEY,
        dates: `${currentDate},${nextYear.toISOString().split('T')[0]}`,
        ordering: '-added',
        page_size: 10,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching upcoming games:', error);
    throw error;
  }
};

export interface CompanyDetails {
  id: number;
  name: string;
  games_count: number;
  image_background: string;
  description?: string;
  games?: {
    id: number;
    name: string;
    added: number;
  }[];
}

export const fetchTopPublishers = async (): Promise<{ results: CompanyDetails[] }> => {
  try {
    const response = await axios.get(`${BASE_URL}/publishers`, {
      params: {
        key: RAWG_API_KEY,
        ordering: '-games_count',
        page_size: 10,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching top publishers:', error);
    throw error;
  }
};

export const fetchTopDevelopers = async (): Promise<{ results: CompanyDetails[] }> => {
  try {
    const response = await axios.get(`${BASE_URL}/developers`, {
      params: {
        key: RAWG_API_KEY,
        ordering: '-games_count',
        page_size: 10,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching top developers:', error);
    throw error;
  }
};

export const fetchPublisherDetails = async (id: number): Promise<CompanyDetails> => {
  try {
    const response = await axios.get(`${BASE_URL}/publishers/${id}`, {
      params: {
        key: RAWG_API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching publisher details:', error);
    throw error;
  }
};

export const fetchDeveloperDetails = async (id: number): Promise<CompanyDetails> => {
  try {
    const response = await axios.get(`${BASE_URL}/developers/${id}`, {
      params: {
        key: RAWG_API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching developer details:', error);
    throw error;
  }
};

export interface GameFilterParams {
  ordering?: string;
  platforms?: string;
  page_size?: number;
}

export const fetchFilteredGames = async (params: GameFilterParams): Promise<GameResponse> => {
  try {
    const response = await axios.get(`${BASE_URL}/games`, {
      params: {
        key: RAWG_API_KEY,
        ...params,
        page_size: params.page_size || 20,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching filtered games:', error);
    throw error;
  }
};

export const fetchGamesByPlatform = async (platformId: string): Promise<GameResponse> => {
  try {
    const response = await axios.get(`${BASE_URL}/games`, {
      params: {
        key: RAWG_API_KEY,
        platforms: platformId,
        page_size: 20,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching games by platform:', error);
    throw error;
  }
};

export const fetchGamesByOrdering = async (ordering: string): Promise<GameResponse> => {
  try {
    const response = await axios.get(`${BASE_URL}/games`, {
      params: {
        key: RAWG_API_KEY,
        ordering,
        page_size: 20,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching games by ordering:', error);
    throw error;
  }
};