import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DemoNote, SectionTitle } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { SUBJECTS, fieldName } from "@/lib/data";
import { hasScores } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { useThemeColors } from "@/lib/theme";
import { useAppearance } from "@/lib/appearance";
import type { Appearance } from "@/lib/appearance-value";
import { cn } from "@/lib/utils";
import { AMBITION_LABEL, BUDGET_LABEL, EXAM_STATUS_LABEL, SCORE_TYPE_LABEL, type Account } from "@/lib/types";

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row items-start justify-between gap-4 py-3 ${last ? "" : "border-b border-border"}`}>
      <Text className="flex-1 text-sm text-muted-foreground">{label}</Text>
      <Text className="flex-1 text-right text-sm font-medium text-foreground">{value}</Text>
    </View>
  );
}

const ACCOUNT_FIELDS: { key: keyof Account; label: string; placeholder: string; keyboard?: "email-address" | "number-pad" }[] = [
  { key: "name", label: "სახელი", placeholder: "მაგ. ნინო" },
  { key: "school", label: "სკოლა", placeholder: "სკოლის დასახელება" },
  { key: "gradYear", label: "დამთავრების წელი", placeholder: "მაგ. 2027", keyboard: "number-pad" },
  { key: "email", label: "ელფოსტა", placeholder: "name@example.com", keyboard: "email-address" },
];

export default function Profile() {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const { appearance, setAppearance, fontError } = useAppearance();
  const { profile, update, reset } = useStore();
  const s = profile.scores;
  const pr = profile.prefs;
  const [editing, setEditing] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [draft, setDraft] = useState<Account>(profile.account);
  const acc = profile.account;

  const initials = acc.name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const saveAccount = () => {
    const clean: Account = {
      name: draft.name.trim(),
      school: draft.school.trim(),
      gradYear: draft.gradYear.replace(/\D/g, "").slice(0, 4),
      email: draft.email.trim(),
    };
    update((p) => ({ ...p, account: clean }));
    setEditing(false);
  };

  const doReset = async () => {
    await reset();
    router.replace("/onboarding");
  };
  const confirmReset = () => setResetOpen(true);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        className="flex-1 bg-background"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: 32 }}
      >
        <Text className="text-3xl font-bold text-foreground">პროფილი</Text>

        {/* Header: avatar + identity */}
        <View className="mt-6 flex-row items-center gap-4 border-b border-border pb-6">
          <View className="h-16 w-16 items-center justify-center rounded-xl bg-violet-soft">
            {initials ? (
              <Text className="text-xl font-bold text-violet">{initials}</Text>
            ) : (
              <Feather name="user" size={26} color={c.violet} />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">{acc.name || "შენი პროფილი"}</Text>
            <Text className="mt-0.5 text-sm text-muted-foreground">
              {[acc.school, acc.gradYear && `${acc.gradYear} წ.`].filter(Boolean).join(" · ") || "სახელი და სკოლა არასავალდებულოა"}
            </Text>
          </View>
        </View>

        <SectionTitle>გარეგნობა</SectionTitle>
        <View className="flex-row gap-2">
          {([
            ["light", "ნათელი", "sun"], ["dark", "მუქი", "moon"], ["system", "სისტემა", "smartphone"],
          ] as const).map(([value, label, icon]) => (
            <Pressable key={value} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: appearance === value }} onPress={() => setAppearance(value as Appearance)} className={cn("min-h-[80px] min-w-[44px] flex-1 items-center justify-center gap-2 rounded-xl border", appearance === value ? "border-accent bg-secondary" : "border-border bg-card")}>
              <Feather name={icon} size={20} color={appearance === value ? c.accent : c.mutedForeground} />
              <Text className={cn("text-sm font-semibold", appearance === value ? "text-accent" : "text-muted-foreground")}>{label}</Text>
            </Pressable>
          ))}
        </View>
        {fontError && <Text className="mt-3 text-sm text-muted-foreground">ქართული შრიფტი ვერ ჩაიტვირთა. გამოიყენება მოწყობილობის შრიფტი.</Text>}

        <SectionTitle>ანგარიში</SectionTitle>
        <View className="border-b border-border pb-5">
          <Text className="text-xs leading-5 text-muted-foreground">
            ველები არასავალდებულოა და ინახება მხოლოდ ამ მოწყობილობაზე. რეგისტრაცია და შესვლა ამ პროტოტიპში ჯერ არ არის.
          </Text>
          {editing ? (
            <View className="mt-3 gap-3">
              {ACCOUNT_FIELDS.map((f) => (
                <View key={f.key}>
                  <Text className="mb-1.5 text-sm font-medium text-foreground">{f.label}</Text>
                  <Input
                    value={draft[f.key]}
                    onChangeText={(t) => setDraft((d) => ({ ...d, [f.key]: t }))}
                    placeholder={f.placeholder}
                    keyboardType={f.keyboard}
                    autoCapitalize={f.key === "email" ? "none" : "sentences"}
                    maxLength={f.key === "gradYear" ? 4 : 80}
                  />
                </View>
              ))}
              <View className="mt-1 flex-row gap-2">
                <Button variant="tinted" className="flex-1" onPress={() => { setDraft(acc); setEditing(false); }}>გაუქმება</Button>
                <Button className="flex-1" onPress={saveAccount}>შენახვა</Button>
              </View>
            </View>
          ) : (
            <>
              <View className="mt-1">
                {ACCOUNT_FIELDS.map((f, i) => (
                  <Row key={f.key} label={f.label} value={acc[f.key] || "—"} last={i === ACCOUNT_FIELDS.length - 1} />
                ))}
              </View>
              <Button variant="tinted" className="mt-2" onPress={() => { setDraft(acc); setEditing(true); }}>რედაქტირება</Button>
            </>
          )}
        </View>

        <SectionTitle>გამოცდის შედეგები</SectionTitle>
        <View className="border-b border-border pb-5">
          {hasScores(profile) ? (
            <>
              <Row label="სტატუსი" value={SCORE_TYPE_LABEL[s.type]} />
              <Row label={SUBJECTS.georgian} value={String(s.georgian)} />
              <Row label={`${SUBJECTS.foreign} (${s.foreignLang})`} value={String(s.foreign)} />
              <Row label={s.elective ? SUBJECTS[s.elective] : "არჩევითი"} value={String(s.electiveScore)} last={!s.updatedAt} />
              {s.updatedAt && <Row label="განახლდა" value={new Date(s.updatedAt).toLocaleDateString("ka-GE")} last />}
            </>
          ) : (
            <Text className="py-2 text-sm text-muted-foreground">ქულები ჯერ არ არის შენახული.</Text>
          )}
          <Button className="mt-2" onPress={() => router.push("/scores")}>{hasScores(profile) ? "ქულების რედაქტირება" : "ქულების შეყვანა"}</Button>
        </View>

        <SectionTitle>აკადემიური პრეფერენციები</SectionTitle>
        <View className="border-b border-border pb-5">
          <Row label="გამოცდების ეტაპი" value={profile.examStatus ? EXAM_STATUS_LABEL[profile.examStatus] : "—"} />
          <Row label="სფერო" value={fieldName(profile.field)} />
          <Row label="ქალაქები" value={pr.anyCity || pr.cities.length === 0 ? "ნებისმიერი" : pr.cities.join(", ")} />
          {pr.excludedCities.length > 0 && <Row label="გამორიცხული" value={pr.excludedCities.join(", ")} />}
          <Row label="ბიუჯეტი" value={BUDGET_LABEL[pr.budget]} />
          <Row label="სტიპენდიები" value={pr.scholarshipFocus ? "პრიორიტეტია" : "—"} />
          <Row label="სიის ხასიათი" value={AMBITION_LABEL[pr.ambition]} last />
          <Button variant="tinted" className="mt-2" onPress={() => router.push("/preferences")}>პრეფერენციების განახლება</Button>
        </View>

        <SectionTitle>მონაცემების მართვა</SectionTitle>
        <View className="border-b border-border pb-5">
          <DemoNote text="ChemiUni-ის ეს ვერსია პროტოტიპია. უნივერსიტეტების ზღვრები, კოეფიციენტები, საფასური და შანსები საჩვენებელია და არ ეფუძნება ოფიციალურ მონაცემებს." />
          <Button variant="ghost" className="mt-2" onPress={confirmReset}>ყველა მონაცემის განულება</Button>
        </View>
      </ScrollView>
      <Modal visible={resetOpen} transparent animationType="fade" onRequestClose={() => setResetOpen(false)}>
        <View className="flex-1 items-center justify-center bg-background/90 px-6">
          <View accessibilityViewIsModal className="w-full max-w-md rounded-xl border border-border bg-card p-6">
            <Text className="text-xl font-bold text-foreground">მონაცემების წაშლა</Text>
            <Text className="mt-3 text-sm leading-6 text-muted-foreground">ყველა შენახული ქულა, პრეფერენცია, ანგარიშის ველები და სია წაიშლება.</Text>
            <Button variant="tinted" className="mt-5" onPress={() => setResetOpen(false)}>გაუქმება</Button>
            <Button variant="ghost" className="mt-2" onPress={doReset}>წაშლა</Button>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
