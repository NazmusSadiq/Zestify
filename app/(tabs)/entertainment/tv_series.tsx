import { StyleSheet, Text, View } from "react-native";

export default function TV_Series() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>TV series!</Text>
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
