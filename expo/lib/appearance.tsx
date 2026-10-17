import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme, useColorScheme } from "nativewind";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import { APPEARANCE_KEY, parseAppearance, type Appearance } from "./appearance-value";

const Context = createContext({ appearance: "system" as Appearance, setAppearance: (_value: Appearance) => {}, fontsReady: false, fontError: false });
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setValue] = useState<Appearance>("system");
  const [ready, setReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [fontError, setFontError] = useState(false);
  const { colorScheme: resolvedScheme } = useColorScheme();
  useEffect(() => {
    AsyncStorage.getItem(APPEARANCE_KEY).then(raw => {
      const value = parseAppearance(raw);
      setValue(value);
      colorScheme.set(value);
    }).catch(() => colorScheme.set("system")).finally(() => setReady(true));
    // Lazy loading keeps older native shells usable with system-font fallback.
    import("expo-font").then(font => font.loadAsync({
      FiraGO: require("../assets/fonts/FiraGO-Regular.ttf"),
      FiraGOBold: require("../assets/fonts/FiraGO-Bold.ttf"),
      GeorgianDisplay: require("../assets/fonts/GeorgianDisplay.ttf"),
    })).then(() => setFontsReady(true)).catch(() => setFontError(true));
  }, []);
  const setAppearance = (value: Appearance) => {
    setValue(value);
    colorScheme.set(value);
    AsyncStorage.setItem(APPEARANCE_KEY, value).catch(() => {});
  };
  useEffect(() => {
    if (Platform.OS !== "web") return;
    document.documentElement.classList.toggle("dark", resolvedScheme === "dark");
  }, [resolvedScheme]);
  return <Context.Provider value={{ appearance, setAppearance, fontsReady, fontError }}>{ready ? children : null}</Context.Provider>;
}
export const useAppearance = () => useContext(Context);