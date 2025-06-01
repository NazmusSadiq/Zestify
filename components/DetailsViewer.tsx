import React from "react";
import {
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface DetailsViewerProps {
  data: Record<string, any> | null;
  visible: boolean;
  onClose: () => void;
  titleKey?: string;
  imageKey?: string;
}

const DetailsViewer = ({
  data,
  visible,
  onClose,
  titleKey = "title",
  imageKey = "poster_path",
}: DetailsViewerProps) => {
  if (!data) return null;

  const excludedFields = [
    "backdrop_path",
    "id",
    "imdb_id",
    "genre_ids",
    "vote_count",
    "tagline",
    "poster_path",
  ];

  const renderFields = () =>
    Object.entries(data).map(([key, value]) => {
      if (
        excludedFields.includes(key) ||
        key === titleKey ||
        key === imageKey
      )
        return null;

      if (typeof value === "string" || typeof value === "number") {
        return (
          <View key={key} style={styles.fieldContainer}>
            <Text style={styles.fieldKey}>{formatKey(key)}:</Text>
            <Text style={styles.fieldValue}>{value.toString()}</Text>
          </View>
        );
      }

      if (Array.isArray(value)) {
        return (
          <View key={key} style={styles.fieldContainer}>
            <Text style={styles.fieldKey}>{formatKey(key)}:</Text>
            <Text style={styles.fieldValue}>
              {value
                .map((item) =>
                  typeof item === "object" ? item.name || item.title : item
                )
                .join(", ")}
            </Text>
          </View>
        );
      }

      if (typeof value === "object" && value !== null) {
        return (
          <View key={key} style={styles.fieldContainer}>
            <Text style={styles.fieldKey}>{formatKey(key)}:</Text>
            <Text style={styles.fieldValue}>
              {value.name || value.title || JSON.stringify(value)}
            </Text>
          </View>
        );
      }

      return null;
    });

  const formatKey = (key: string) =>
    key.replace(/_/g, " ").replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose} // Android back button support
    >
      <SafeAreaView style={styles.fullscreenContainer}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close ✕</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {data[titleKey] && <Text style={styles.title}>{data[titleKey]}</Text>}

          {data[imageKey] && (
            <View style={styles.imageContainer}>
              <Image
                source={{
                  uri: `https://image.tmdb.org/t/p/w342${data[imageKey]}`,
                }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
          )}

          <View style={styles.detailsContainer}>{renderFields()}</View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "#2c3e50",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 10,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  imageContainer: {
    aspectRatio: 2 / 3,
    height: 400,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#34495e",
    alignSelf: "center",
    marginBottom: 12,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  detailsContainer: {
    marginTop: 8,
  },
  fieldContainer: {
    marginBottom: 10,
  },
  fieldKey: {
    color: "#bbb",
    fontWeight: "600",
  },
  fieldValue: {
    color: "#eee",
  },
});

export default DetailsViewer;
