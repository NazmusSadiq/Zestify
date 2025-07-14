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

export default function News_Games() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const NEWS_FILE_PATH = FileSystem.documentDirectory + "news.json";

  useEffect(() => {
    loadLocalNews();
  }, []);

  const loadLocalNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const fileInfo = await FileSystem.getInfoAsync(NEWS_FILE_PATH);
      if (!fileInfo.exists) {
        setArticles([]);
        return;
      }

      const jsonStr = await FileSystem.readAsStringAsync(NEWS_FILE_PATH);
      let allNews: Article[] = JSON.parse(jsonStr);

      let filtered = allNews.filter(article => article.tags?.includes("games"));

      filtered = filtered.filter((article, index, self) =>
        index === self.findIndex(a => a.title.toLowerCase() === article.title.toLowerCase())
      );

      // Sort articles by publishedAt descending (fix for TS: return number)
      filtered.sort((a, b) => {
        const dateA = new Date(a.publishedAt).getTime();
        const dateB = new Date(b.publishedAt).getTime();
        return dateB - dateA;
      });

      const cleanupText = (text?: string): string | undefined =>
        text?.replace(/\[\d+\s*chars\]$/, "").trim();

      filtered = filtered.map(article => ({
        ...article,
        content: cleanupText(article.content),
        description: cleanupText(article.description),
      }));

      setArticles(filtered);
    } catch (e) {
      console.error("Error loading news:", e);
      setError("Failed to load local news.");
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
      category="Games"
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
        <Text style={styles.title}>No video game news found.</Text>
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
