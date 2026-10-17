import { useMemo, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Chip, DemoNote, ProgramCard } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { CITIES, FIELDS, PROGRAMS, universityById, type City, type FieldId } from "@/lib/data";
import { estimate } from "@/lib/engine";
import { useStore } from "@/lib/store";

type Tuition = "all" | "free" | "low" | "high";
type Sort = "relevance" | "chance";

export default function Explore() {
  const insets = useSafeAreaInsets();
  const { profile } = useStore();
  const [q, setQ] = useState("");
  const [field, setField] = useState<FieldId | null>(null);
  const [city, setCity] = useState<City | null>(null);
  const [tuition, setTuition] = useState<Tuition>("all");
  const [grantOnly, setGrantOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("relevance");

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const r = PROGRAMS.filter((p) => {
      const u = universityById(p.universityId);
      if (needle && !`${p.name} ${u.name} ${u.short}`.toLowerCase().includes(needle)) return false;
      if (field && p.field !== field) return false;
      if (city && u.city !== city) return false;
      if (tuition === "free" && p.tuition !== 0) return false;
      if (tuition === "low" && p.tuition > 2250) return false;
      if (tuition === "high" && p.tuition <= 2250) return false;
      if (grantOnly && !(p.stateGrant || p.scholarship)) return false;
      return true;
    }).map((p) => ({ p, est: estimate(profile, p) }));
    if (sort === "chance") r.sort((a, b) => (b.est?.pct ?? -1) - (a.est?.pct ?? -1));
    else r.sort((a, b) => Number(b.p.field === profile.field) - Number(a.p.field === profile.field));
    return r;
  }, [q, field, city, tuition, grantOnly, sort, profile]);

  const clear = () => {
    setQ("");
    setField(null);
    setCity(null);
    setTuition("all");
    setGrantOnly(false);
  };

  const Row = ({ children }: { children: React.ReactNode }) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8, paddingRight: 16 }} className="mt-2">
      {children}
    </ScrollView>
  );

  const header = (
    <View>
      <Text className="text-3xl font-bold text-foreground">აღმოაჩინე</Text>
      <Input className="mt-4 border border-border bg-card" placeholder="მოძებნე უნივერსიტეტი ან პროგრამა" value={q} onChangeText={setQ} returnKeyType="search" />
      <Row>
        {FIELDS.map((f) => (
          <Chip key={f.id} label={f.name} selected={field === f.id} onPress={() => setField(field === f.id ? null : f.id)} />
        ))}
      </Row>
      <Row>
        {CITIES.map((c) => (
          <Chip key={c} label={c} selected={city === c} onPress={() => setCity(city === c ? null : c)} />
        ))}
        <Chip label="გრანტი / სტიპენდია" selected={grantOnly} onPress={() => setGrantOnly(!grantOnly)} />
      </Row>
      <Row>
        {([["free", "უფასო"], ["low", "≤ 2 250 ₾"], ["high", "> 2 250 ₾"]] as const).map(([k, l]) => (
          <Chip key={k} label={l} selected={tuition === k} onPress={() => setTuition(tuition === k ? "all" : k)} />
        ))}
      </Row>
      <View className="mt-4 gap-3">
        <Text className="text-sm text-muted-foreground">{results.length} პროგრამა · სანიმუშო მონაცემები</Text>
        <View className="flex-row gap-1">
          <Chip label="შესაბამისობა" selected={sort === "relevance"} onPress={() => setSort("relevance")} />
          <Chip label="შანსი" selected={sort === "chance"} onPress={() => setSort("chance")} />
        </View>
      </View>
      {sort === "chance" && !profile.scores.electiveScore && (
        <DemoNote className="mt-3" text="შანსით დასალაგებლად შეიყვანე ქულები პროფილში." />
      )}
      <View className="h-3" />
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <FlatList
        className="flex-1 bg-background"
        data={results}
        keyExtractor={(i) => i.p.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 32, gap: 12 }}
        renderItem={({ item }) => <ProgramCard program={item.p} est={item.est} />}
        ListEmptyComponent={
          <View className="items-center p-6">
            <Text className="text-center text-base text-foreground">ამ ფილტრებით პროგრამა ვერ მოიძებნა.</Text>
            <Button variant="tinted" className="mt-4" onPress={clear}>ფილტრების გასუფთავება</Button>
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}
