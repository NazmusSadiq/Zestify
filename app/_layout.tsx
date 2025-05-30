import { Stack } from "expo-router";
import { Platform, StatusBar, View } from "react-native";
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const CLERK_PUBLISHABLE_KEY = process.env.EEXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;


const InitialLayout = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inTabsGroup = segments[0] === '(tabs)';

    console.log('User changed: ', isSignedIn);

    if (isSignedIn && !inTabsGroup) {
      router.replace('/profile');
    } else if (!isSignedIn) {
      router.replace('/login');
    }
  }, [isSignedIn]);

  return <Slot />;
};

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};


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


      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <InitialLayout />
      </ClerkProvider>

      {/* <Stack
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
      </Stack> */}
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
