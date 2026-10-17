import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { FlatList, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DemoNote, ProgramCard } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { SUBJECTS, fieldName } from "@/lib/data";
import { buildList, hasScores } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { useThemeColors } from "@/lib/theme";
import { BUDGET_LABEL, SCORE_TYPE_LABEL } from "@/lib/types";

function Action({ icon, label, onPress }: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void }) {
  const c = useThemeColors();
  return (
    <Pressable onPress={onPress} className="min-h-[44px] flex-row items-center gap-1.5 rounded-full border border-border bg-card px-3.5 active:bg-secondary">
      <Feather name={icon} size={15} color={c.accent} />
      <Text className="text-sm font-medium text-foreground">{label}</Text>
    </Pressable>
  );
}

export default function MyList() {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const { profile, update } = useStore();
  const scored = hasScores(profile);
  const list = useMemo(() => (profile.listCreated && scored ? buildList(profile) : []), [profile, scored]);

  const create = () => {
    if (!scored) return router.push("/scores?thenList=1");
    update((p) => ({ ...p, listCreated: true }));
  };

  const removeItem = (id: string) =>
    update((p) => ({ ...p, ...(p.approvedList ? { approvedList: p.approvedList.filter(x => x !== id) } : {}), removed: [...p.removed, id], pinned: p.pinned.filter((x) => x !== id) }));

  if (!profile.listCreated || !scored) {
    return (
      <View className="flex-1 bg-background px-6" style={{ paddingTop: insets.top + 24 }}>
        <Text className="text-3xl font-bold text-foreground">ჩემი სია</Text>
        <View className="flex-1 items-center justify-center pb-16">
          <View className="h-20 w-20 items-center justify-center rounded-xl bg-accent/10">
            <Feather name="layers" size={36} color={c.accent} />
          </View>
          <Text className="mt-6 text-center text-2xl font-bold leading-9 text-foreground">შენი პირადი სია უნივერსიტეტებისთვის</Text>
          <Text className="mt-3 text-center text-base leading-6 text-muted-foreground">
            {scored
              ? "ქულები უკვე შენახულია. ერთი შეხებით შევქმნით პრიორიტეტების სიას შენი სფეროსა და პრეფერენციების მიხედვით."
              : "შეიყვანე გამოცდის ქულები და ChemiUni შეგიდგენს პროგრამების რანჟირებულ სიას — უსაფრთხო, მიზნობრივი და ამბიციური არჩევანით."}
          </Text>
          <Button className="mt-8 min-h-[52px] w-full" onPress={create}>შექმენი ჩემი სია</Button>
          <Pressable onPress={() => router.push("/explore")} className="mt-2 min-h-[44px] justify-center">
            <Text className="font-semibold text-accent">ჯერ პროგრამების დათვალიერება</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const s = profile.scores;
  const header = (
    <View>
      <Text className="text-3xl font-bold text-foreground">ჩემი სია</Text>

      <Pressable onPress={() => router.push("/scores")} className="mt-5 min-h-[44px] border-y border-border py-5 active:bg-secondary">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-semibold tracking-normal text-muted-foreground">{SCORE_TYPE_LABEL[s.type]}</Text>
          <Feather name="edit-2" size={14} color={c.mutedForeground} />
        </View>
        <View className="mt-3 flex-row gap-2">
          {[
            ["ქართული", s.georgian],
            [s.foreignLang, s.foreign],
            [s.elective ? SUBJECTS[s.elective] : "", s.electiveScore],
          ].map(([l, v]) => (
            <View key={String(l)} className="flex-1 border-l border-border px-3 py-2.5">
              <Text className="text-3xl font-bold text-accent">{v}</Text>
              <Text className="text-xs leading-5 text-muted-foreground">{l}</Text>
            </View>
          ))}
        </View>
        <View className="mt-3 flex-row flex-wrap gap-x-3 gap-y-1">
          <Text className="text-sm text-foreground">
            <Text className="text-sm text-muted-foreground">სფერო: </Text>
            {fieldName(profile.field)}
          </Text>
          <Text className="text-sm text-muted-foreground">{BUDGET_LABEL[profile.prefs.budget]}</Text>
        </View>
      </Pressable>

      <View className="mt-3 flex-row flex-wrap gap-2">
        <Action icon="refresh-cw" label="თავიდან აწყობა" onPress={() => update((p) => { const { approvedList, ...rest } = p; return { ...rest, removed: [] }; })} />
        <Action icon="edit-3" label="ქულები" onPress={() => router.push("/scores")} />
        <Action icon="sliders" label="პრეფერენციები" onPress={() => router.push("/preferences")} />
      </View>

      <DemoNote className="mt-4" />
      <Button variant="tinted" className="mt-3" onPress={() => router.push("/counselor")}>უნივერსიტეტის კონსულტანტი</Button>
      <Text className="mb-2 mt-6 text-xs font-semibold tracking-normal text-muted-foreground">რეკომენდებული პრიორიტეტები · {list.length}</Text>
    </View>
  );

  return (
    <FlatList
      className="flex-1 bg-background"
      data={list}
      keyExtractor={(i) => i.program.id}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 32, gap: 12 }}
      renderItem={({ item, index }) => (
        <ProgramCard
          program={item.program}
          est={item.est}
          reasons={item.reasons}
          rank={index + 1}
          right={
            <Pressable onPress={() => removeItem(item.program.id)} hitSlop={6} className="min-h-[44px] min-w-[44px] items-center justify-center rounded-full active:bg-secondary" accessibilityLabel="სიიდან ამოღება">
              <Feather name="x" size={18} color={c.mutedForeground} />
            </Pressable>
          }
        />
      )}
      ListEmptyComponent={
        <View className="items-center p-6">
          <Text className="text-center text-base text-foreground">შენს პირობებს სანიმუშო მონაცემებში არცერთი პროგრამა არ ემთხვევა.</Text>
          <Button variant="tinted" className="mt-4" onPress={() => router.push("/preferences")}>პრეფერენციების შეცვლა</Button>
        </View>
      }
    />
  );
}
