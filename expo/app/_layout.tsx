// Gesture handler must load before navigation modules (Expo Router requirement).
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import { Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LovablePreviewErrorReporter } from "../components/lovable-preview-error-reporter";
import { LovablePreviewSafeArea } from "../components/lovable-preview-safe-area";
import { LovablePreviewTextSelection } from "../components/lovable-preview-text-selection";
import { LovableSimulatorGuard } from "../components/lovable-simulator-guard";
import { StoreProvider } from "../lib/store";
import { navigationThemes, useAppColorScheme } from "../lib/theme";
import { AppearanceProvider } from "../lib/appearance";
import { LovableApiGate } from "../components/lovable-api-gate";

export default function RootLayout() {
  return <AppearanceProvider><Navigation /></AppearanceProvider>;
}

function Navigation() {
  const scheme = useAppColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LovablePreviewErrorReporter>
          <LovablePreviewSafeArea>
            <LovableSimulatorGuard>
              <ThemeProvider value={navigationThemes[scheme]}>
                <StoreProvider>
                  <LovablePreviewTextSelection />
                  <StatusBar style={scheme === "dark" ? "light" : "dark"} />
                  <LovableApiGate><Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="scores" options={{ presentation: "modal" }} />
                    <Stack.Screen name="preferences" options={{ presentation: "modal" }} />
                  </Stack></LovableApiGate>
                </StoreProvider>
              </ThemeProvider>
            </LovableSimulatorGuard>
          </LovablePreviewSafeArea>
        </LovablePreviewErrorReporter>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
