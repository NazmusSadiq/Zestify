import { icons } from "@/constants/icons";
import { Tabs, usePathname } from "expo-router";
import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

const appIcon = require("../../assets/icons/logo.png");

function TabIcon({ focused, icon, title }: any) {
    const color = focused ? "#FF0000" : "#FFF";

    return (
        <View style={styles.tabItem}>
            <Image source={icon} tintColor={color} style={{ width: 24, height: 24 }} />
            <Text style={[styles.tabText, { color, fontWeight: focused ? "600" : "400" }]}>{title}</Text>
        </View>
    );
}

function AnimatedHeader() {
    const pathname = usePathname();
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(1);

    useEffect(() => {
        const isHome = pathname === "/";
        translateY.value = withTiming(isHome ? 0 : -100, { duration: 300 });
        opacity.value = withTiming(isHome ? 1 : 0, { duration: 300 });
    }, [pathname]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[styles.headerContainer, animatedStyle]}>
            <View style={styles.logoContainer}>
                <Image source={appIcon} style={styles.icon} resizeMode="contain" />
                <Text style={styles.brandText}>Zestify</Text>
            </View>
        </Animated.View>
    );
}


export default function TabsLayout() {
    return (
        <>
            <AnimatedHeader />
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
                        height: 60,
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
                        tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={icons.home} title="Home" />,
                    }}
                />
                <Tabs.Screen
                    name="entertainment"
                    options={{
                        title: "Browse",
                        headerShown: false,
                        tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={icons.play} title="Browse" />,
                    }}
                />
                <Tabs.Screen
                    name="sport"
                    options={{
                        title: "Sports",
                        headerShown: false,
                        tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={icons.star} title="Sports" />,
                    }}
                />
                <Tabs.Screen
                    name="news"
                    options={{
                        title: "News",
                        headerShown: false,
                        tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={icons.save} title="News" />,
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: "Profile",
                        headerShown: false,
                        tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={icons.person} title="Profile" />,
                    }}
                />
            </Tabs>
        </>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        position: "absolute",
        top: 30,
        left: -10,
        right: 0,
        paddingHorizontal: 20,
        zIndex: 999,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "black",
    },
    icon: {
        width: 50,
        height: 50,
    },
    logoContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    brandText: {
        color: "#FF0000",
        fontSize: 24,
        marginLeft: 8,
        fontFamily: "sans-serif-light",
        fontWeight: "300",
        transform: [{ translateY: -2.5 }],
    },
    searchButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#222",
        justifyContent: "center",
        alignItems: "center",
    },
    tabItem: {
        minWidth: 90,
        height: 70,
        borderRadius: 35,
        backgroundColor: "black",
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 5,
        marginTop: 12,
    },
    tabText: {
        marginTop: 4,
        fontSize: 12,
        textAlign: "center",
    },
});
