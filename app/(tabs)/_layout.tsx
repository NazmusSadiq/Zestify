import { icons } from "@/constants/icons";
import { Tabs } from "expo-router";
import { Image, Text, View } from "react-native";

function TabIcon({ focused, icon, title }: any) {
    const color = focused ? "#FFD700" : "#A8B5DB";

    return (
        <View
            style={{
                minWidth: 90,
                height: 70,
                borderRadius: 35,
                backgroundColor: "black",
                justifyContent: "flex-end",
                alignItems: "center",
                paddingBottom: 4,
                marginTop: 15,
            }}
        >
            <Image source={icon} tintColor={color} style={{ width: 24, height: 24 }} />
            <Text
                style={{
                    color,
                    marginTop: 4,
                    fontWeight: focused ? "600" : "400",
                    fontSize: 12,
                    textAlign: "center",
                }}
            >
                {title}
            </Text>
        </View>
    );
}

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarShowLabel: false,
                tabBarItemStyle: {
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 0,
                    width: "auto",
                },
                tabBarStyle: {
                    backgroundColor: "black", 
                    borderTopWidth: 0,
                    borderWidth: 0, 
                    height: 50,
                    position: "absolute",
                    overflow: "hidden",
                    elevation: 0, 
                    shadowOpacity: 0, 
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={icons.home} title="Home" />
                    ),
                }}
            />
            <Tabs.Screen
                name="entertainment"
                options={{
                    title: "Browse",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={icons.play} title="Browse" />
                    ),
                }}
            />
            <Tabs.Screen
                name="sports"
                options={{
                    title: "Sports",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={icons.star} title="Sports" />
                    ),
                }}
            />
            <Tabs.Screen
                name="news"
                options={{
                    title: "News",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={icons.save} title="News" />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={icons.person} title="Profile" />
                    ),
                }}
            />
        </Tabs>
    );
}