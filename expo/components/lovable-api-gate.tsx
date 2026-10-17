// lovable-skill: expo-backend-api@2. A newer skill release replaces this file; extend behavior in app code.
import { useEffect, useState, type ReactNode } from "react";
import { AppState, View } from "react-native";
import { Text } from "./ui/Text";

import { checkApiVersion, isUpdateRequired, onUpdateRequiredChange } from "../lib/lovable-api";

export function LovableApiGate({ children }: { children: ReactNode }) {
  const [updateRequired, setUpdateRequired] = useState(isUpdateRequired);

  useEffect(() => {
    const unsubscribe = onUpdateRequiredChange(setUpdateRequired);
    setUpdateRequired(isUpdateRequired());
    void checkApiVersion();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void checkApiVersion();
    });
    return () => {
      unsubscribe();
      subscription.remove();
    };
  }, []);

  if (!updateRequired) return <>{children}</>;

  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      <Text accessibilityRole="header" className="text-center text-2xl font-semibold text-foreground">
        Update required
      </Text>
      <Text className="mt-3 text-center text-base text-muted-foreground">
        This version of the app is no longer supported. Install the latest version from the app store to continue.
      </Text>
    </View>
  );
}

