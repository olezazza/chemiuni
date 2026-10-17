import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { FIELDS, type FieldId } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useThemeColors } from "@/lib/theme";
import { EXAM_STATUS_LABEL, type ExamStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

function Option({ label, selected, onPress, icon }: { label: string; selected: boolean; onPress: () => void; icon?: keyof typeof Feather.glyphMap }) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityState={{ selected }}
      className={cn("min-h-[52px] flex-row items-center gap-3 rounded-xl border px-4 py-3", selected ? "border-accent bg-accent/10" : "border-border bg-card active:bg-secondary")}
    >
      {icon && <Feather name={icon} size={18} color={selected ? c.accent : c.mutedForeground} />}
      <Text className={cn("flex-1 text-base", selected ? "font-semibold text-accent" : "text-foreground")}>{label}</Text>
      {selected && <Feather name="check-circle" size={18} color={c.accent} />}
    </Pressable>
  );
}

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const { update } = useStore();
  const [step, setStep] = useState(0);
  const [field, setField] = useState<FieldId | null>(null);
  const [status, setStatus] = useState<ExamStatus | null>(null);
  const [q, setQ] = useState("");

  const finish = (enterScores: boolean) => {
    update((p) => ({ ...p, onboarded: true, field: field ?? p.field, examStatus: status ?? p.examStatus }));
    // One transition: a timed replace + push could leave scores as the stack root.
    router.replace(enterScores ? "/scores?fromOnboarding=1" : "/(tabs)");
  };

  const fields = FIELDS.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} className="bg-background">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, paddingHorizontal: 20, flexGrow: 1 }}
      >
        <View className="mb-6 flex-row items-center justify-between">
          <View className="flex-row gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <View key={i} className={cn("h-1.5 w-8 rounded-full", i <= step ? "bg-primary" : "bg-border")} />
            ))}
          </View>
          {step > 0 && (
            <Pressable onPress={() => (step === 3 ? finish(false) : setStep(step + 1))} className="min-h-[44px] justify-center px-2">
              <Text className="text-sm font-semibold text-muted-foreground">გამოტოვება</Text>
            </Pressable>
          )}
        </View>

        {step === 0 && (
          <View className="flex-1 justify-center">
            <Text className="text-3xl font-bold leading-10 text-foreground">ChemiUni</Text>
            <Text className="mt-3 text-lg leading-7 text-foreground">დაგეხმარება, დაგეგმო უნივერსიტეტის არჩევანი ერთიანი ეროვნული გამოცდებისთვის.</Text>
            <View className="mt-8 gap-4">
              {[
                ["list", "შეადგინე პრიორიტეტების სია შენი ქულებისა და ინტერესების მიხედვით"],
                ["bar-chart-2", "ნახე ჩაბარების საილუსტრაციო, სიმულირებული შეფასებები"],
                ["search", "აღმოაჩინე პროგრამები ძიებითა და ფილტრებით"],
              ].map(([icon, t]) => (
              <View key={t} className="flex-row items-start gap-3">
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-accent/10">
                    <Feather name={icon as "list"} size={17} color={c.accent} />
                  </View>
                  <Text className="flex-1 text-base leading-6 text-foreground">{t}</Text>
                </View>
              ))}
            </View>
            <Text className="mt-8 text-sm leading-6 text-muted-foreground">უნივერსიტეტების, პროგრამების, ზღვრებისა და შანსების მონაცემები საჩვენებელია და არ წარმოადგენს გამოცდების ეროვნული ცენტრის ოფიციალურ შედეგებს.</Text>
            <View className="mt-8">
              <Button className="min-h-[52px]" onPress={() => setStep(1)}>დავიწყოთ</Button>
            </View>
          </View>
        )}

        {step === 1 && (
          <View>
            <Text variant="title" className="leading-9">რისი სწავლა გაინტერესებს?</Text>
            <Text className="mt-2 text-muted-foreground">აირჩიე სფერო — მოგვიანებით ყოველთვის შეგიძლია შეცვალო.</Text>
            <Input className="mt-5" placeholder="მოძებნე სფერო…" value={q} onChangeText={setQ} />
            <View className="mt-4 gap-2">
              {fields.map((f) => (
                <Option key={f.id} label={f.name} selected={field === f.id} onPress={() => setField(f.id)} />
              ))}
              {fields.length === 0 && <Text className="py-4 text-center text-muted-foreground">ასეთი სფერო ვერ მოიძებნა.</Text>}
            </View>
            <Button className="mt-6 min-h-[52px]" onPress={() => setStep(2)}>გაგრძელება</Button>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text variant="title" className="leading-9">გამოცდების რომელ ეტაპზე ხარ?</Text>
            <View className="mt-5 gap-2">
              {(Object.keys(EXAM_STATUS_LABEL) as ExamStatus[]).map((s) => (
                <Option
                  key={s}
                  icon={s === "preparing" ? "edit-3" : s === "pending" ? "clock" : "award"}
                  label={EXAM_STATUS_LABEL[s]}
                  selected={status === s}
                  onPress={() => setStatus(s)}
                />
              ))}
            </View>
            <Button className="mt-6 min-h-[52px]" onPress={() => setStep(3)}>გაგრძელება</Button>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text variant="title" className="leading-9">შევიყვანოთ ქულები ახლა?</Text>
            <Text className="mt-2 leading-6 text-muted-foreground">
              {status === "available" ? "შენი შედეგებით სია უფრო მეტად მოერგება შენს მონაცემებს. შეფასებები მაინც საილუსტრაციოა." : "შეგიძლია შეიყვანო მოსალოდნელი ან სავარჯიშო ტესტის ქულები და მოგვიანებით განაახლო."}
            </Text>
            <View className="mt-8 gap-3">
              <Button className="min-h-[52px]" onPress={() => finish(true)}>ქულების შეყვანა</Button>
              <Button variant="tinted" className="min-h-[52px]" onPress={() => finish(false)}>მოგვიანებით</Button>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
