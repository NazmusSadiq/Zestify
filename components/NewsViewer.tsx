import React, { useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';

interface NewsViewerProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  content?: string;
  description?: string;
  imageUrl?: string;
  source: string;
  publishedAt: string;
  url: string;
}

const NewsViewer: React.FC<NewsViewerProps> = ({
  visible,
  onClose,
  title,
  content,
  description,
  imageUrl,
  source,
  publishedAt,
  url,
}) => {
  const [webVisible, setWebVisible] = useState(false);

  const openWebView = () => setWebVisible(true);
  const closeWebView = () => setWebVisible(false);

  return (
    <>
      {/* Main Article Modal */}
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Text style={styles.backButtonText}>← Close</Text>
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {imageUrl && <Image source={{ uri: imageUrl }} style={styles.image} />}

            <Text style={styles.title}>{title}</Text>

            <View style={styles.metaContainer}>
              <Text style={styles.source}>{source}</Text>
              <Text style={styles.date}>{new Date(publishedAt).toLocaleString()}</Text>
            </View>

            {description && <Text style={styles.description}>{description}</Text>}
            {content && <Text style={styles.content}>{content}</Text>}

            <Text style={styles.url} onPress={openWebView}>
              Read Full Article on Webview
            </Text>
          </ScrollView>
        </View>
      </Modal>

      {/* WebView Modal */}
      <Modal visible={webVisible} animationType="slide" onRequestClose={closeWebView}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.backButton} onPress={closeWebView}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <WebView source={{ uri: url }} style={{ flex: 1 }} />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#3B82F6',
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  source: {
    color: '#3498db',
    fontWeight: '600',
    fontSize: 14,
  },
  date: {
    color: '#888',
    fontSize: 14,
  },
  description: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 12,
  },
  content: {
    color: '#eee',
    fontSize: 16,
    lineHeight: 24,
  },
  url: {
    marginTop: 20,
    color: '#e74c3c',
    fontWeight: '600',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default NewsViewer;
