import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, View } from "react-native";

import { Text } from "@/components/ui/Text";
import { universityById, type Program } from "@/lib/data";
import { CONFIDENCE_LABEL, formatTuition, hasScores, isEligible, type Confidence, type Estimate } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { useThemeColors } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={cn(
        "min-h-[44px] flex-row items-center justify-center rounded-full border px-4",
        selected ? "border-accent/30 bg-secondary" : "border-border bg-card active:bg-secondary",
      )}
    >
      {selected && <View className="mr-2 h-1.5 w-1.5 rounded-full bg-accent" />}
      <Text className={cn("text-sm", selected ? "font-semibold text-accent" : "text-muted-foreground")}>{label}</Text>
    </Pressable>
  );
}

const CONF_ICON: Record<Confidence, keyof typeof Feather.glyphMap> = {
  safe: "shield",
  target: "target",
  reach: "trending-up",
};

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const c = useThemeColors();
  const color = c[confidence];
  return (
    <View
      className="flex-row items-center gap-1.5 self-start rounded-md px-2.5 py-1.5"
      style={{ backgroundColor: c[`${confidence}Soft`] }}
    >
      <Feather name={CONF_ICON[confidence]} size={13} color={color} />
      <Text className="text-xs font-semibold" style={{ color }}>{CONFIDENCE_LABEL[confidence]}</Text>
    </View>
  );
}

export function DemoNote({ text, className }: { text?: string; className?: string }) {
  const c = useThemeColors();
  return (
    <View className={cn("flex-row items-start gap-2 border-l-2 border-target px-3 py-1", className)}>
      <Feather name="info" size={15} color={c.mutedForeground} style={{ marginTop: 2 }} />
      <Text className="flex-1 text-xs leading-5 text-muted-foreground">
        {text ?? "საჩვენებელი მონაცემები: ზღვრები, კოეფიციენტები და შანსები გამოგონილია და მხოლოდ ილუსტრაციისთვისაა."}
      </Text>
    </View>
  );
}

export function SectionTitle({ children, className }: { children: string; className?: string }) {
  return <View className={cn("mb-3 mt-8 flex-row items-center gap-3", className)}><View className="h-4 w-1 rounded-full bg-violet" /><Text className="flex-1 font-display text-base font-semibold leading-6 text-foreground">{children}</Text></View>;
}

export function ProgramCard({
  program,
  est,
  reasons,
  rank,
  right,
}: {
  program: Program;
  est: Estimate;
  reasons?: string[];
  rank?: number;
  right?: React.ReactNode;
}) {
  const c = useThemeColors();
  const { profile } = useStore();
  const u = universityById(program.universityId);
  const missing = !est ? (!hasScores(profile) ? "შეფასებისთვის მონაცემები არასაკმარისია — შეიყვანე ქულები პროფილში" : !isEligible(profile, program) ? "შენი არჩევითი საგანი ამ პროგრამაზე არ მოითხოვება — შეფასება შეუძლებელია" : "შეფასებისთვის მონაცემები არასაკმარისია") : null;
  return (
    <Pressable
      onPress={() => router.push(`/program/${program.id}`)}
      className="min-h-[44px] rounded-xl border border-border bg-card p-4 active:bg-secondary"
      accessibilityRole="button"
      accessibilityLabel={`${u.name}, ${program.name}`}
    >
      <View className="flex-row items-start gap-3">
        {rank != null && (
          <View className="min-h-[32px] w-7 items-center justify-center">
            <Text className="text-xl font-bold text-violet">{String(rank).padStart(2, "0")}</Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="text-xs leading-5 text-muted-foreground">
            {u.name}
          </Text>
          <Text className="mt-0.5 text-base font-semibold leading-6 text-foreground">{program.name}</Text>
          <View className="mt-1 flex-row flex-wrap items-center gap-x-3 gap-y-1">
            <View className="flex-row items-center gap-1">
              <Feather name="map-pin" size={12} color={c.mutedForeground} />
              <Text className="text-xs text-muted-foreground">{u.city}</Text>
            </View>
            <Text className="text-xs text-muted-foreground">{formatTuition(program.tuition)}</Text>
          </View>
        </View>
        {right}
      </View>
      {est ? (
        <View className="mt-4 flex-row flex-wrap items-center justify-between gap-2">
          <ConfidenceBadge confidence={est.confidence} />
          <Text className="text-xs font-semibold text-foreground">საილუსტრაციო შანსი ~{est.pct}%</Text>
        </View>
      ) : (
        <View className="mt-4 flex-row items-start gap-2 self-start rounded-md bg-muted px-2.5 py-1.5">
          <Feather name="help-circle" size={13} color={c.foreground} style={{ marginTop: 3 }} />
          <Text className="flex-1 text-xs leading-5 text-foreground">{missing}</Text>
        </View>
      )}
      {reasons && reasons.length > 0 && (
        <View className="mt-3 gap-1">
          {reasons.map((r) => (
            <View key={r} className="flex-row items-start gap-2">
              <Feather name="check" size={13} color={c.accent} style={{ marginTop: 3 }} />
              <Text className="flex-1 text-sm leading-5 text-foreground">{r}</Text>
            </View>
          ))}
        </View>
      )}
      <View className="mt-3 flex-row items-center justify-end gap-1">
        <Text className="text-sm font-semibold text-accent">დეტალები</Text>
        <Feather name="chevron-right" size={16} color={c.accent} />
      </View>
    </Pressable>
  );
}

export function ScreenHeader({ title, onBack, right }: { title: string; onBack?: () => void; right?: React.ReactNode }) {
  const c = useThemeColors();
  return (
    <View className="flex-row items-center gap-1 px-2 pb-2">
      <Pressable
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/")))}
        accessibilityRole="button"
        className="min-h-[44px] min-w-[44px] items-center justify-center rounded-full active:bg-secondary"
        accessibilityLabel="უკან"
      >
        <Feather name="chevron-left" size={26} color={c.foreground} />
      </Pressable>
      <Text className="flex-1 text-lg font-semibold leading-7 text-foreground">
        {title}
      </Text>
      {right}
    </View>
  );
}
