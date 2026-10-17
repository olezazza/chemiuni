import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { cn } from "@/lib/utils";
import { useAppearance } from "@/lib/appearance";

interface TextProps extends RNTextProps {
  variant?: "default" | "title" | "subtitle" | "caption";
}

const variantStyles = {
  default: "text-base text-foreground",
  title: "text-2xl font-bold text-foreground",
  subtitle: "text-lg font-semibold text-foreground",
  caption: "text-sm text-muted-foreground",
};

export function Text({ variant = "default", className, ...props }: TextProps) {
  const { fontsReady } = useAppearance();
  const heading = variant === "title" || variant === "subtitle" || /text-(?:2xl|3xl|4xl|lg)|font-display/.test(className ?? "");
  const bold = /font-(?:bold|semibold|medium)/.test(className ?? "");
  const family = heading ? "font-display" : bold ? "font-body-bold" : "font-body";
  return <RNText className={cn(variantStyles[variant], className, fontsReady && family, "tracking-normal")} {...props} />;
}
