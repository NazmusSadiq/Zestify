import NewsCard from "@/components/NewsCard";
import * as FileSystem from "expo-file-system";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";

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

export default function News_Media() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [articleUrl, setArticleUrl] = useState<string | null>(null);

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
      const allNews: Article[] = JSON.parse(jsonStr);

      const filtered = allNews.filter(article =>
        article.tags?.includes("music")
      );

      setArticles(filtered);
    } catch (e) {
      console.error("Error loading news:", e);
      setError("Failed to load local news.");
    } finally {
      setLoading(false);
    }
  };

  const openArticle = (url: string) => {
    setArticleUrl(url);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setArticleUrl(null);
  };

  const renderItem = ({ item }: { item: Article }) => (
    <NewsCard
      category="Music"
      date={new Date(item.publishedAt).toLocaleDateString()}
      title={item.title}
      source={item.source.name}
      imageUrl={item.image}
      onPress={() => openArticle(item.url)}
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
        <Text style={styles.title}>No music news found.</Text>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item) => item.url}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.webviewContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
            <Text style={styles.closeButtonText}>✕ Close</Text>
          </TouchableOpacity>
          {articleUrl && (
            <WebView
              source={{ uri: articleUrl }}
              startInLoadingState
              style={{ flex: 1 }}
            />
          )}
        </View>
      </Modal>
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
  webviewContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  closeButton: {
    padding: 10,
    backgroundColor: "#3B82F6",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
