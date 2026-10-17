import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfidenceBadge, DemoNote, ScreenHeader, SectionTitle } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { SUBJECTS, fieldName, programById, universityById, type SubjectId } from "@/lib/data";
import { alternatives, buildList, electiveCoef, estimate, formatTuition, hasScores, improvements, isEligible } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { useThemeColors } from "@/lib/theme";

function Info({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) {
  const c = useThemeColors();
  return (
    <View className="flex-row items-center gap-3 py-2">
      <Feather name={icon} size={16} color={c.mutedForeground} />
      <Text className="w-28 text-sm text-muted-foreground">{label}</Text>
      <Text className="flex-1 text-sm font-medium text-foreground">{value}</Text>
    </View>
  );
}

export default function ProgramDetail() {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, update } = useStore();
  const prog = programById(id);

  if (!prog)
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8 }}>
        <ScreenHeader title="პროგრამა" />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-center text-muted-foreground">პროგრამა ვერ მოიძებნა.</Text>
          <Button variant="tinted" className="mt-4" onPress={() => router.replace("/explore")}>დაბრუნება ძიებაში</Button>
        </View>
      </View>
    );

  const u = universityById(prog.universityId);
  const est = estimate(profile, prog);
  const eligible = isEligible(profile, prog);
  const inList = profile.listCreated && buildList(profile).some((i) => i.program.id === prog.id);
  const imps = improvements(profile, prog);
  const alts = alternatives(profile, prog);

  const toggleList = () =>
    update((p) =>
      inList
        ? { ...p, ...(p.approvedList ? { approvedList: p.approvedList.filter(x => x !== prog.id) } : {}), removed: [...p.removed, prog.id], pinned: p.pinned.filter((x) => x !== prog.id) }
        : { ...p, ...(p.approvedList ? { approvedList: [...new Set([...p.approvedList, prog.id])] } : {}), listCreated: true, pinned: [...p.pinned.filter((x) => x !== prog.id), prog.id], removed: p.removed.filter((x) => x !== prog.id) },
    );

  const coefRows: [string, number, number | null][] = [
    [SUBJECTS.georgian, prog.coefficients.georgian ?? 1, profile.scores.georgian],
    [`${SUBJECTS.foreign}`, prog.coefficients.foreign ?? 1, profile.scores.foreign],
    ...(eligible && profile.scores.elective
      ? ([[SUBJECTS[profile.scores.elective], electiveCoef(prog, profile.scores.elective), profile.scores.electiveScore]] as [string, number, number | null][])
      : prog.electives.map((e) => [SUBJECTS[e], electiveCoef(prog, e as SubjectId), null] as [string, number, number | null])),
  ];

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top + 8 }}>
        <ScreenHeader title={u.short} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}>
        <Text className="text-sm text-muted-foreground">{u.name}</Text>
        <Text className="mt-1 text-2xl font-bold leading-9 text-foreground">{prog.name}</Text>
        <Text className="mt-2 text-base leading-6 text-foreground">{prog.blurb}</Text>

        <View className="mt-5 border-y border-border py-3">
          <Info icon="award" label="საფეხური" value={prog.degree} />
          <Info icon="map-pin" label="ქალაქი" value={u.city} />
          <Info icon="grid" label="სფერო" value={fieldName(prog.field)} />
          <Info icon="credit-card" label="საფასური*" value={formatTuition(prog.tuition)} />
          <Info icon="gift" label="დაფინანსება*" value={[prog.stateGrant && "სახელმწიფო გრანტი", prog.scholarship && "სტიპენდიები"].filter(Boolean).join(", ") || "—"} />
          <Info icon="users" label="ადგილები*" value={String(prog.seats)} />
        </View>

        <SectionTitle>საილუსტრაციო შეფასება</SectionTitle>
        <View className="border-l-2 border-violet bg-violet-soft px-4 py-5">
          {!hasScores(profile) ? (
            <>
              <Text className="text-base text-foreground">შეფასების სანახავად შეიყვანე ქულები.</Text>
              <Button variant="tinted" className="mt-3" onPress={() => router.push("/scores")}>ქულების შეყვანა</Button>
            </>
          ) : !eligible ? (
            <Text className="text-base leading-6 text-foreground">
              ეს პროგრამა ითხოვს არჩევით საგანს: {prog.electives.map((e) => SUBJECTS[e]).join(" ან ")}. შენი არჩევითი საგანი არ ემთხვევა, ამიტომ შეფასება შეუძლებელია.
            </Text>
          ) : (
            est && (
              <>
                <View className="flex-row flex-wrap items-end justify-between gap-3">
                  <View>
                    <Text className="text-4xl font-bold text-foreground">~{est.pct}%</Text>
                    <Text className="text-xs text-muted-foreground">საილუსტრაციო მაჩვენებელი</Text>
                  </View>
                  <ConfidenceBadge confidence={est.confidence} />
                </View>
                <View className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                  <View className="h-2 rounded-full bg-accent" style={{ width: `${est.pct}%` }} />
                </View>
                <View className="mt-4 flex-row gap-2">
                  <View className="flex-1 p-2">
                    <Text className="text-xs text-muted-foreground">შენი საჩვენებელი ქულა</Text>
                    <Text className="text-xl font-bold text-foreground">{est.comp}</Text>
                  </View>
                  <View className="flex-1 p-2">
                    <Text className="text-xs text-muted-foreground">სანიმუშო ისტ. ზღვარი</Text>
                    <Text className="text-xl font-bold text-foreground">{prog.sampleCutoff}</Text>
                  </View>
                </View>
                <Text className="mt-3 text-sm leading-5 text-muted-foreground">
                  შენი ქულების შეწონილი საშუალო {est.gap >= 0 ? `${est.gap}-ით აღემატება` : `${Math.abs(est.gap)}-ით ჩამორჩება`} ამ პროგრამის გამოგონილ ზღვარს. ეს არ არის ოფიციალურ მონაცემებზე დაფუძნებული ალბათობა — მხოლოდ ინტერფეისის საჩვენებლად.
                </Text>
              </>
            )
          )}
        </View>

        <SectionTitle>საგნები და კოეფიციენტები (სანიმუშო)</SectionTitle>
        <View className="border-y border-border">
          {coefRows.map(([l, coef, v]) => (
            <View key={l} className="flex-row items-center justify-between border-b border-border py-3">
              <Text className="flex-1 text-sm text-foreground">{l}</Text>
              <Text className="w-16 text-right text-sm text-muted-foreground">×{coef}</Text>
              <Text className="w-14 text-right text-sm font-semibold text-foreground">{v ?? "—"}</Text>
            </View>
          ))}
          <Text className="py-2 text-xs text-muted-foreground">არჩევითი: {prog.electives.map((e) => SUBJECTS[e]).join(", ")}</Text>
        </View>

        {imps.length > 0 && (
          <>
            <SectionTitle>რა გააუმჯობესებს ჩემს შანსებს?</SectionTitle>
            <View className="gap-2">
              {imps.map((i) => (
                <View key={i.subject} className="flex-row items-start gap-3 rounded-xl bg-target-soft p-4">
                  <Feather name="trending-up" size={18} color={c.target} style={{ marginTop: 2 }} />
                  <Text className="flex-1 text-sm leading-5 text-foreground">
                    თუ <Text className="text-sm font-semibold text-foreground">{i.label}</Text>-ში +{i.delta} ქულას მიიღებ, საილუსტრაციო მაჩვენებელი {i.oldPct}%-დან ~{i.newPct}%-მდე გაიზრდება.
                  </Text>
                </View>
              ))}
            </View>
            <Text className="mt-2 text-xs leading-5 text-muted-foreground">ჰიპოთეტური სცენარებია. რეალური ეფექტი დამოკიდებული იქნება ოფიციალურ ფორმულაზე, როცა ის დაემატება.</Text>
          </>
        )}

        {alts.length > 0 && (
          <>
            <SectionTitle>ალტერნატივები</SectionTitle>
            <View className="gap-2">
              {alts.map((a) => {
                const e = estimate(profile, a);
                return (
                  <Pressable key={a.id} onPress={() => router.push(`/program/${a.id}`)} className="min-h-[56px] flex-row items-center gap-3 rounded-xl border border-border bg-card p-4 active:bg-secondary">
                    <View className="flex-1">
                      <Text className="text-xs text-muted-foreground">{universityById(a.universityId).short} · {universityById(a.universityId).city}</Text>
                      <Text className="text-sm font-semibold text-foreground">{a.name}</Text>
                    </View>
                    {e && <Text className="text-xs text-muted-foreground">~{e.pct}%</Text>}
                    <Feather name="chevron-right" size={16} color={c.mutedForeground} />
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <DemoNote className="mt-6" text="* ყველა რიცხვი (საფასური, ადგილები, ზღვრები, კოეფიციენტები, შანსები) გამოგონილია საჩვენებლად და არ წარმოადგენს ოფიციალურ ინფორმაციას." />
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-background px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        <Button variant={inList ? "tinted" : "default"} className="min-h-[52px]" onPress={toggleList}>
          {inList ? "სიიდან ამოღება" : "ჩემს სიაში დამატება"}
        </Button>
      </View>
    </View>
  );
}
