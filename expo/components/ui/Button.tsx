import { Pressable, type PressableProps } from "react-native";

import { cn } from "@/lib/utils";

import { Text } from "./Text";

interface ButtonProps extends PressableProps {
  variant?: "default" | "tinted" | "ghost";
  children: string;
}

const baseStyles = "min-h-[48px] items-center justify-center rounded-xl px-5 py-3";

// Tinted pressed state stops at 18% in dark mode: the label falls under 4.5:1 on a card beyond that.
const variantStyles = {
  default: "bg-primary active:bg-primary/90",
  tinted: "bg-secondary active:bg-muted",
  ghost: "active:bg-secondary",
};

const textVariantStyles = {
  default: "text-[15px] font-semibold text-primary-foreground",
  tinted: "text-[15px] font-semibold text-accent",
  ghost: "text-accent",
};

export function Button({ variant = "default", children, className, ...props }: ButtonProps) {
  return (
    <Pressable className={cn(baseStyles, variantStyles[variant], className)} {...props}>
      <Text className={cn(textVariantStyles[variant], "text-center")}>{children}</Text>
    </Pressable>
  );
}
