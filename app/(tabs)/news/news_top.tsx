import NewsCard from "@/components/NewsCard";
import NewsViewer from "@/components/NewsViewer";
import * as FileSystem from "expo-file-system";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";

interface Article {
  title: string;
  url: string;
  image?: string;
  content?: string;
  description?: string;
  source: { name: string };
  publishedAt: string;
  tags?: string[];
}

const NEWS_FILE_PATH = FileSystem.documentDirectory + "news.json";
const API_KEY = "YOUR_API_KEY";  // <-- Replace with your GNews API key
const API_URL = `https://gnews.io/api/v4/top-headlines?category=general&apikey=${API_KEY}`;

export default function News_Top() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    setError(null);

    try {
      const fileInfo = await FileSystem.getInfoAsync(NEWS_FILE_PATH);

      if (fileInfo.exists) {
        // Load local cached news first
        const jsonStr = await FileSystem.readAsStringAsync(NEWS_FILE_PATH);
        let localNews: Article[] = JSON.parse(jsonStr);

        // Filter duplicates by title (case-insensitive)
        localNews = localNews.filter((article, index, self) =>
          index === self.findIndex(a => a.title.toLowerCase() === article.title.toLowerCase())
        );

        // Sort articles by publishedAt descending (fix for TS: return number)
        localNews.sort((a, b) => {
          const dateA = new Date(a.publishedAt).getTime();
          const dateB = new Date(b.publishedAt).getTime();
          return dateB - dateA;
        });

        if (localNews.length > 0) {
          setArticles(localNews);
          setLoading(false);
          return;
        }
      }

      // If no local news, fetch from API
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const json = await response.json();

      // GNews API returns articles in `articles` array
      let fetchedArticles: Article[] = json.articles.map((a: any) => ({
        title: a.title,
        url: a.url,
        image: a.image,
        content: a.content,
        description: a.description,
        source: { name: a.source.name },
        publishedAt: a.publishedAt,
        tags: ["top"],
      }));

      // Filter duplicates by title (case-insensitive)
      fetchedArticles = fetchedArticles.filter((article, index, self) =>
        index === self.findIndex(a => a.title.toLowerCase() === article.title.toLowerCase())
      );

      // Save fetched news locally for caching
      await FileSystem.writeAsStringAsync(NEWS_FILE_PATH, JSON.stringify(fetchedArticles));

      setArticles(fetchedArticles);
    } catch (e) {
      console.error("Error loading top news:", e);
      setError("Failed to load top news.");
    } finally {
      setLoading(false);
    }
  };

  const openArticle = (article: Article) => {
    setSelectedArticle(article);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedArticle(null);
  };

  const renderItem = ({ item }: { item: Article }) => (
    <NewsCard
      category="Top News"
      date={new Date(item.publishedAt).toLocaleDateString()}
      title={item.title}
      source={item.source.name}
      imageUrl={item.image}
      onPress={() => openArticle(item)}
    />
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {articles.length === 0 ? (
        <Text style={styles.title}>No top news available.</Text>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item) => item.url}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {selectedArticle && (
        <NewsViewer
          visible={modalVisible}
          onClose={closeModal}
          title={selectedArticle.title}
          content={selectedArticle.content}
          description={selectedArticle.description}
          imageUrl={selectedArticle.image}
          source={selectedArticle.source.name}
          publishedAt={selectedArticle.publishedAt}
          url={selectedArticle.url}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#1B2631",
  },
  title: {
    fontSize: 20,
    color: "#3B82F6",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
});
