import type { Config } from "tailwindcss";

const semantic = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./lib/**/*.{js,jsx,ts,tsx}"],
  // Must stay "class": with the default "media", NativeWind's web runtime
  // calls colorScheme.set at startup, which throws in media mode → blank screen.
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: { body: ["FiraGO"], "body-bold": ["FiraGOBold"], display: ["GeorgianDisplay"] },
      colors: {
        background: semantic("background"),
        foreground: semantic("foreground"),
        card: { DEFAULT: semantic("card"), foreground: semantic("card-foreground") },
        primary: { DEFAULT: semantic("primary"), foreground: semantic("primary-foreground") },
        accent: { DEFAULT: semantic("accent"), foreground: semantic("accent-foreground") },
        secondary: { DEFAULT: semantic("secondary"), foreground: semantic("secondary-foreground") },
        muted: { DEFAULT: semantic("muted"), foreground: semantic("muted-foreground") },
        destructive: { DEFAULT: semantic("destructive"), foreground: semantic("destructive-foreground") },
        border: semantic("border"),
        input: semantic("input"),
        "safe": semantic("safe"),
        "target": semantic("target"),
        "reach": semantic("reach"),
        "violet": semantic("violet"),
        "violet-soft": semantic("violet-soft"),
        "safe-soft": semantic("safe-soft"),
        "target-soft": semantic("target-soft"),
        "reach-soft": semantic("reach-soft"),

      },
    },
  },
  plugins: [],
} satisfies Config;
