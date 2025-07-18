import useFetch from './usefetch';

const API_KEY = 'AIzaSyAaaLFtkZoj-qnYtmopHVn1bTgeAcEcxIM';
const BASE_URL = 'https://www.googleapis.com/books/v1';

export interface Book {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail?: string;
    };
    publishedDate?: string;
    publisher?: string;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
  };
}

export interface BookResponse {
  items: Book[];
}

export const searchBooks = async (query: string): Promise<BookResponse> => {
  const response = await fetch(`${BASE_URL}/volumes?q=${query}&key=${API_KEY}&maxResults=20`);
  return response.json();
};

export const getBookDetails = async (bookId: string): Promise<Book> => {
  const response = await fetch(`${BASE_URL}/volumes/${bookId}?key=${API_KEY}`);
  return response.json();
};

export const useBookAPI = () => {
  const fetchNewReleases = async () => {
    const currentYear = new Date().getFullYear();
    const query = `publishedDate:${currentYear}`;
    const response = await fetch(`${BASE_URL}/volumes?q=${query}&key=${API_KEY}&maxResults=20`);
    return response.json();
  };

  const fetchBestSellers = async () => {
    const query = 'subject:bestseller';
    const response = await fetch(`${BASE_URL}/volumes?q=${query}&key=${API_KEY}&maxResults=20`);
    return response.json();
  };

  const fetchTrendingBooks = async () => {
    const query = 'subject:popular';
    const response = await fetch(`${BASE_URL}/volumes?q=${query}&key=${API_KEY}&maxResults=20`);
    return response.json();
  };

  const { data: newReleases, loading: newReleasesLoading, error: newReleasesError, refetch: getNewReleases } = useFetch(fetchNewReleases);
  const { data: bestSellers, loading: bestSellersLoading, error: bestSellersError, refetch: getBestSellers } = useFetch(fetchBestSellers);
  const { data: trendingBooks, loading: trendingBooksLoading, error: trendingBooksError, refetch: getTrendingBooks } = useFetch(fetchTrendingBooks);

  return {
    data: newReleases || bestSellers || trendingBooks,
    loading: newReleasesLoading || bestSellersLoading || trendingBooksLoading,
    error: newReleasesError || bestSellersError || trendingBooksError,
    getNewReleases,
    getBestSellers,
    getTrendingBooks,
    searchBooks,
    getBookDetails,
  };
}; 