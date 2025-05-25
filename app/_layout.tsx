import { Stack } from "expo-router";
import { Platform, StatusBar, View } from "react-native";
import "./globals.css";

export default function RootLayout() {
  // Uncomment the following block before building the app to set the navigation bar color properly on Android
  
  /*if (Platform.OS === 'android') {
    NavigationBar.setBackgroundColorAsync('black');
    NavigationBar.setButtonStyleAsync('light'); // Optional: make the nav buttons light to be visible on black
  }*/
  
  return (
    <>
      {Platform.OS === "android" && (
        <View
          style={{
            height: StatusBar.currentHeight,
            backgroundColor: "black",
          }}
        />
      )}

      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: "black" },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="movie/[id]"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      {/*Comment the following block before building the app to set the navigation bar color properly on Android*/}
  
      {Platform.OS === "android" && (
        <View
          style={{
            height: 44,
            backgroundColor: "black", 
          }}
        />
      )}
    </>
  );
}
