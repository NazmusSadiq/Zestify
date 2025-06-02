import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { fetchAndSaveAllNews } from "./news/NewsFetcher";

export default function Index() {
  useEffect(() => {
    fetchAndSaveAllNews();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome to Expo Router!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1B2631",
  },
  heading: {
    fontSize: 40,
    color: "white",
    fontWeight: "bold",
  },
});
