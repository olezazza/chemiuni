import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { FlatList, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DemoNote, ProgramCard, SectionTitle } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { PROGRAMS, fieldName, type Program } from "@/lib/data";
import { buildList, estimate, hasScores } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { useThemeColors } from "@/lib/theme";
import { EXAM_STATUS_LABEL, SCORE_TYPE_LABEL } from "@/lib/types";

export default function Home() {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const { profile } = useStore();
  const scored = hasScores(profile);
  const name = profile.account.name.trim();
  const featured = useMemo(() => {
    if (scored && profile.listCreated) return buildList(profile).slice(0, 3).map(i => i.program);
    const programs = PROGRAMS.filter(p => !profile.field || p.field === profile.field);
    return (programs.length ? programs : PROGRAMS).slice(0, 3);
  }, [profile, scored]);
  const header = <View>
    <View className="flex-row items-center justify-between">
      <Text className="font-display text-xl font-bold text-accent">ChemiUni<Text className="text-xl text-violet">.</Text></Text>
      <Pressable accessibilityRole="button" accessibilityLabel="პროფილი" onPress={() => router.push("/profile")} className="min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-secondary"><Feather name="user" size={19} color={c.accent} /></Pressable>
    </View>
    <Text className="mt-6 text-sm text-muted-foreground">{name ? `გამარჯობა, ${name}` : "გამარჯობა"}</Text>
    <Text className="mt-2 text-3xl font-bold leading-10 text-foreground">შენი მომავალი{ "\n" }იწყება აქ.</Text>
    <View className="mt-5 flex-row items-center gap-3">
      <View className="h-8 w-8 items-center justify-center rounded-full bg-safe-soft"><Feather name={scored ? "check" : "arrow-up-right"} size={18} color={c.safe} /></View>
      <View className="flex-1"><Text className="text-base font-semibold text-foreground">{scored ? "შენი ქულები შენახულია" : "პირველი ნაბიჯი — შენი ქულები"}</Text><Text className="mt-1 text-xs leading-5 text-muted-foreground">{scored ? SCORE_TYPE_LABEL[profile.scores.type] : profile.examStatus ? EXAM_STATUS_LABEL[profile.examStatus] : "უნივერსიტეტისკენ, ნაბიჯ-ნაბიჯ"}</Text></View>
    </View>
    {scored ? <Pressable accessibilityRole="button" accessibilityLabel="ქულები" onPress={() => router.push("/scores")} className="mt-4 min-h-[44px] flex-row border-y border-border py-4">
      {[["ქართული", profile.scores.georgian], [profile.scores.foreignLang, profile.scores.foreign], ["არჩევითი", profile.scores.electiveScore]].map(([label, value], i) => <View key={String(label)} className={`flex-1 px-2 ${i > 0 ? "border-l border-border" : ""}`}><Text className={`text-3xl font-bold ${i === 2 ? "text-violet" : "text-accent"}`}>{value}</Text><Text className="mt-1 text-xs leading-5 text-muted-foreground">{label}</Text></View>)}
    </Pressable> : <Button className="mt-4 min-h-[52px]" onPress={() => router.push("/scores")}>ქულების შეყვანა</Button>}
    <View className="mt-5 flex-row gap-3">
      {([["list", "ჩემი სია", "/list"], ["compass", "აღმოაჩინე", "/explore"]] as const).map(([icon, label, path]) => <Pressable key={path} accessibilityRole="button" onPress={() => router.push(path)} className="min-h-[64px] flex-1 flex-row items-center gap-2 rounded-xl bg-secondary px-3"><Feather name={icon} size={19} color={icon === "list" ? c.accent : c.violet} /><Text className="flex-1 text-sm font-semibold text-foreground">{label}</Text><Feather name="arrow-up-right" size={15} color={c.mutedForeground} /></Pressable>)}
    </View>
    <SectionTitle>{scored && profile.listCreated ? "შენი საუკეთესო არჩევანი" : "აღმოაჩინე შესაძლებლობები"}</SectionTitle>
    <Text className="mb-4 text-sm text-muted-foreground">{fieldName(profile.field)}</Text>
  </View>;
  return <FlatList<Program> className="flex-1 bg-background" data={featured} keyExtractor={p => p.id} ListHeaderComponent={header} renderItem={({ item }) => <ProgramCard program={item} est={estimate(profile, item)} />} ListFooterComponent={<DemoNote className="mt-5" />} contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 32, gap: 12 }} />;
}
