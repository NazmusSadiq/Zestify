import { StyleSheet, Text, View } from "react-native";

export default function news_Sports() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>News_Sports!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 40,        // roughly equivalent to text-5xl
    color: "#3B82F6",    // assuming "text-primary" means a blue color; adjust as needed
    fontWeight: "bold",
  },
});
