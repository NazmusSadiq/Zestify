import { icons } from "@/constants/icons";
import { Image, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

interface Props {
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onIconPress?: () => void; 
}

const SearchBar = ({ placeholder, value, onChangeText, onIconPress }: Props) => {
  return (
    <View style={styles.wrapper}>
      <TouchableOpacity onPress={onIconPress}>
        <Image
          source={icons.search}
          style={styles.icon}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#ccc"
        style={styles.input}
      />
    </View>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2c3e50",
    borderRadius: 8,
    height: 40,
    width: 220,
    paddingHorizontal: 10,
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: "#ccc",
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#fff",
    height: "100%",
    textAlignVertical: "center",
  },
});
