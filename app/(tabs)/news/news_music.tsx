import { StyleSheet, Text, View } from "react-native";

export default function News_Media() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>News_Media!</Text>
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
    fontSize: 40,        
    color: "#3B82F6",   
    fontWeight: "bold",
  },
});
