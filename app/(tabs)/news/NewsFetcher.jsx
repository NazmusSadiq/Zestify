import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

const NEWS_FILE_PATH = FileSystem.documentDirectory + "news.json";
const API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_GNEWS_API_KEY || process.env.EXPO_PUBLIC_GNEWS_API_KEY;

const delay = (ms) => new Promise(res => setTimeout(res, ms));

export const clearLocalNewsFile = async () => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(NEWS_FILE_PATH);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(NEWS_FILE_PATH);
      console.log("Local news.json file cleared.");
    } else {
      console.log("No news.json file found to clear.");
    }
  } catch (error) {
    console.error("Failed to clear local news file:", error);
  }
};

const fetchNewsByTag = async (query, tag) => {
  const MAX_RETRIES = 3;
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    attempts++;
    const url = query
      ? `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=100&token=${API_KEY}`
      : `https://gnews.io/api/v4/top-headlines?category=general&max=100&token=${API_KEY}`;

    const response = await fetch(url);

    if (response.status === 429) {
      console.warn(`Rate limit hit for tag "${tag}". Waiting before retrying attempt ${attempts}...`);
      await delay(2000 * attempts);
      continue;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch news for ${tag}: ${response.status}`);
    }

    const data = await response.json();

    if (!data.articles) {
      console.warn(`No articles found for tag "${tag}"`);
      return [];
    }

    return data.articles.map(article => ({
      ...article,
      tags: [tag],
    }));
  }

  throw new Error(`Failed to fetch news for ${tag} after ${MAX_RETRIES} retries due to rate limiting.`);
};

const loadExistingNews = async () => {
  const fileExists = await FileSystem.getInfoAsync(NEWS_FILE_PATH);
  if (!fileExists.exists) return [];
  const jsonStr = await FileSystem.readAsStringAsync(NEWS_FILE_PATH);
  return JSON.parse(jsonStr);
};

const saveNews = async (newArticles) => {
  const existing = await loadExistingNews();

  const merged = [...newArticles];
  existing.forEach(article => {
    if (!merged.some(a => a.url === article.url)) {
      merged.push(article);
    }
  });

  await FileSystem.writeAsStringAsync(NEWS_FILE_PATH, JSON.stringify(merged, null, 2));
};

export const fetchTopNewsAndSave = async () => {
  try {
    const articles = await fetchNewsByTag('', 'top');
    const englishArticles = articles.filter(article => article.language === 'en');

    const taggedArticles = englishArticles.map(article => ({
      ...article,
      tags: ['top'],
    }));
    await saveNews(taggedArticles);
  } catch (e) {
    console.log("Failed to fetch top news:", e);
  }
};

export const fetchGamesNewsAndSave = async () => {
  try {
    // Multiple targeted searches to get more diverse gaming news
    const queries = [
      // Core gaming terms
      'gaming OR "video games" OR "video game" OR esports OR "game industry"',
      // Popular games and franchises
      '"Call of Duty" OR "Grand Theft Auto" OR "Assassin\'s Creed" OR "FIFA" OR "Fortnite" OR "Minecraft" OR "League of Legends"',
      // Gaming platforms and companies
      'PlayStation OR Xbox OR Nintendo OR Steam OR "Epic Games" OR "Game Pass" OR "Nintendo Switch"',
      // Game development and releases
      '"game release" OR "game launch" OR "game trailer" OR "beta test" OR "early access" OR "game update"',
      // Gaming hardware and tech
      '"RTX 4090" OR "PS5" OR "Xbox Series" OR "Steam Deck" OR "VR gaming" OR "gaming laptop"'
    ];

    const allArticles = [];
    
    // Fetch articles for each query with small delays
    for (let i = 0; i < queries.length; i++) {
      try {
        const articles = await fetchNewsByTag(queries[i], 'games');
        allArticles.push(...articles);
        
        // Add delay between queries to avoid rate limiting
        if (i < queries.length - 1) {
          await delay(300);
        }
      } catch (queryError) {
        console.log(`Failed to fetch games news for query ${i + 1}:`, queryError);
        // Continue with other queries even if one fails
      }
    }
    
    // Remove duplicates based on URL
    const uniqueArticles = allArticles.filter((article, index, self) => 
      index === self.findIndex(a => a.url === article.url)
    );
    
    await saveNews(uniqueArticles);
    console.log(`Fetched ${uniqueArticles.length} unique gaming articles from ${queries.length} queries`);
  } catch (e) {
    console.log("Failed to fetch games news:", e);
  }
};

export const fetchSportsNewsAndSave = async () => {
  try {
    const articles = await fetchNewsByTag('football OR cricket OR tennis OR basketball OR soccer OR sports', 'sports');
    await saveNews(articles);
  } catch (e) {
    console.log("Failed to fetch sports news:", e);
  }
};

export const fetchMusicNewsAndSave = async () => {
  try {
    const articles = await fetchNewsByTag('album OR song OR artist or music or singer', 'music');
    await saveNews(articles);
  } catch (e) {
    console.log("Failed to fetch music news:", e);
  }
};

export const fetchMediaNewsAndSave = async () => {
  try {
    const query = `"movies" OR "film trailers" OR "box office" OR "tv shows" OR "tv series" OR "netflix" OR "prime video" OR "HBO" OR "Disney+" OR "Hulu"`;
    const articles = await fetchNewsByTag(query, 'media');
    await saveNews(articles);
  } catch (e) {
    console.log("Failed to fetch Media news:", e);
  }
};

export const fetchAndSaveAllNews = async () => {
  try {
    //await clearLocalNewsFile();
    await fetchTopNewsAndSave();
    await delay(500);

    await fetchGamesNewsAndSave();
    await delay(500);

    await fetchSportsNewsAndSave();
    await delay(1000);

    await fetchMusicNewsAndSave();
    await delay(500);

    await fetchMediaNewsAndSave();
    await delay(500);

  } catch (e) {
    console.error("Error fetching all news:", e);
  }
};
