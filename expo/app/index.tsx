import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useStore } from "@/lib/store";
import { useThemeColors } from "@/lib/theme";

export default function Index() {
  const { ready, profile } = useStore();
  const c = useThemeColors();
  if (!ready)
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={c.accent} />
      </View>
    );
  return <Redirect href={profile.onboarded ? "/(tabs)" : "/onboarding"} />;
}
