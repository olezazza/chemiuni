import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View } from "react-native";

import { useThemeColors } from "@/lib/theme";

export default function TabsLayout() {
  const c = useThemeColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.mutedForeground,
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.border },
        tabBarBackground: () => <View style={{ flex: 1, backgroundColor: c.card }} />,
        tabBarItemStyle: { backgroundColor: c.card },
        tabBarLabelStyle: { fontSize: 11, fontFamily: "FiraGOBold", letterSpacing: 0 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "მთავარი", tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} /> }} />
      <Tabs.Screen name="list" options={{ title: "ჩემი სია", tabBarIcon: ({ color, size }) => <Feather name="list" color={color} size={size} /> }} />
      <Tabs.Screen name="explore" options={{ title: "აღმოაჩინე", tabBarIcon: ({ color, size }) => <Feather name="search" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: "პროფილი", tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} /> }} />
    </Tabs>
  );
}
