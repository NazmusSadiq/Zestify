import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

const NEWS_FILE_PATH = FileSystem.documentDirectory + "news.json";
const API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_GNEWS_API_KEY || process.env.EXPO_PUBLIC_GNEWS_API_KEY;

const fetchNewsByTag = async (query, tag) => {
  const response = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=50&token=${API_KEY}`);
  if (!response.ok) throw new Error(`Failed for ${tag}: ${response.status}`);
  const data = await response.json();

  return data.articles.map(article => ({
    ...article,
    tags: [tag],
  }));
};

const loadExistingNews = async () => {
  const fileExists = await FileSystem.getInfoAsync(NEWS_FILE_PATH);
  if (!fileExists.exists) return [];
  const jsonStr = await FileSystem.readAsStringAsync(NEWS_FILE_PATH);
  return JSON.parse(jsonStr);
};

const saveNews = async (newArticles) => {
  const existing = await loadExistingNews();

  const merged = [...existing];
  newArticles.forEach(article => {
    if (!merged.some(a => a.url === article.url)) {
      merged.push(article);
    }
  });

  await FileSystem.writeAsStringAsync(NEWS_FILE_PATH, JSON.stringify(merged, null, 2));
};

export const fetchGamesNewsAndSave = async () => {
  try {
    const articles = await fetchNewsByTag('"video game" OR esports OR "game trailer"', 'games');
    await saveNews(articles);
  } catch (e) {
    console.error("Failed to fetch games news:", e);
  }
};

export const fetchSportsNewsAndSave = async () => {
  try {
    // Fetch all sports news, no restrictive tag filtering
    const articles = await fetchNewsByTag('sports');

    const taggedArticles = articles.map((article) => {
      const tags= [];
      const text = `${article.title} ${article.description || ''}`.toLowerCase();

      if (text.includes("football")) tags.push("football");
      if (text.includes("cricket")) tags.push("cricket");
      if (text.includes("tennis")) tags.push("tennis");
      if (text.includes("basketball")) tags.push("basketball");
      if (text.includes("soccer")) tags.push("soccer");
      if (tags.length === 0) tags.push("sports");

      return { ...article, tags };
    });

    await saveNews(taggedArticles);
  } catch (e) {
    console.error("Failed to fetch sports news:", e);
  }
};



export const fetchMusicNewsAndSave = async () => {
  try {
    const articles = await fetchNewsByTag('music albums OR songs OR artists', 'music');
    await saveNews(articles);
  } catch (e) {
    console.error("Failed to fetch music news:", e);
  }
};

export const fetchTVNewsAndSave = async () => {
  try {
    const articles = await fetchNewsByTag('tv shows OR netflix OR prime video', 'tv');
    await saveNews(articles);
  } catch (e) {
    console.error("Failed to fetch TV news:", e);
  }
};

export const fetchMoviesNewsAndSave = async () => {
  try {
    const articles = await fetchNewsByTag('movies OR film trailers OR box office', 'movies');
    await saveNews(articles);
  } catch (e) {
    console.error("Failed to fetch movies news:", e);
  }
};

// Optional: Fetch all at once (still available if needed)
export const fetchAndSaveAllNews = async () => {
  await Promise.all([
    fetchGamesNewsAndSave(),
    fetchSportsNewsAndSave(),
    fetchMusicNewsAndSave(),
    //fetchTVNewsAndSave(),
    //fetchMoviesNewsAndSave()
  ]);
};
