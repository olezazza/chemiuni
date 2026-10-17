import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Chip, DemoNote, ScreenHeader, SectionTitle } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { ELECTIVES, FIELDS, SUBJECTS, type FieldId, type SubjectId } from "@/lib/data";
import { hasScores } from "@/lib/engine";
import { savedFormDestination } from "@/lib/form-navigation";
import { useStore } from "@/lib/store";
import { SCORE_TYPE_LABEL, type ScoreType } from "@/lib/types";

const LANGS = ["ინგლისური", "გერმანული", "ფრანგული", "რუსული"];

function ScoreField({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <View className="mt-4">
      <Text className="mb-1.5 text-sm font-medium text-foreground">{label}</Text>
      <Input
        keyboardType="number-pad"
        maxLength={3}
        placeholder="0–100"
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ""))}
        className={error ? "border-destructive bg-card text-2xl font-bold" : "border-border bg-card text-2xl font-bold"}
        accessibilityLabel={label}
      />
      {error && <Text className="mt-1 text-xs text-destructive">{error}</Text>}
    </View>
  );
}

export default function Scores() {
  const insets = useSafeAreaInsets();
  const { thenList, fromOnboarding } = useLocalSearchParams<{ thenList?: string; fromOnboarding?: string }>();
  const { profile, update } = useStore();
  const s = profile.scores;
  const existing = hasScores(profile);

  const [type, setType] = useState<ScoreType>(s.type);
  const [georgian, setGeorgian] = useState(s.georgian?.toString() ?? "");
  const [foreign, setForeign] = useState(s.foreign?.toString() ?? "");
  const [lang, setLang] = useState(s.foreignLang);
  const [elective, setElective] = useState<SubjectId | null>(s.elective);
  const [electiveScore, setElectiveScore] = useState(s.electiveScore?.toString() ?? "");
  const [field, setField] = useState<FieldId | null>(profile.field);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    const chk = (k: string, v: string) => {
      if (v === "") e[k] = "შეიყვანე ქულა";
      else if (+v > 100) e[k] = "ქულა უნდა იყოს 0-დან 100-მდე";
    };
    chk("georgian", georgian);
    chk("foreign", foreign);
    chk("elective", electiveScore);
    if (!elective) e.electiveSubject = "აირჩიე არჩევითი საგანი";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    update((p) => ({
      ...p,
      field,
      listCreated: thenList ? true : p.listCreated,
      scores: { georgian: +georgian, foreign: +foreign, foreignLang: lang, elective, electiveScore: +electiveScore, type, updatedAt: new Date().toISOString() },
    }));
    const destination = savedFormDestination(router.canGoBack(), fromOnboarding === "1", thenList === "1");
    if (destination === "back") router.back();
    else router.replace(destination);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} className="bg-background">
      <View style={{ paddingTop: insets.top + 8 }} className="bg-background">
        <ScreenHeader title={existing ? "ქულების რედაქტირება" : "გამოცდის ქულები"} />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}>
        <DemoNote text="საჩვენებელი სკალა: თითოეული საგანი 0–100. ოფიციალური ფორმულა და უნივერსიტეტების მოთხოვნები მოგვიანებით დაემატება." />

        <SectionTitle>ქულის ტიპი</SectionTitle>
        <View className="flex-row flex-wrap gap-2">
          {(Object.keys(SCORE_TYPE_LABEL) as ScoreType[]).map((t) => (
            <Chip key={t} label={SCORE_TYPE_LABEL[t]} selected={type === t} onPress={() => setType(t)} />
          ))}
        </View>

        <SectionTitle>სავალდებულო საგნები</SectionTitle>
        <ScoreField label={SUBJECTS.georgian} value={georgian} onChange={setGeorgian} error={errors.georgian} />
        <Text className="mb-1.5 mt-4 text-sm font-medium text-foreground">უცხოური ენა</Text>
        <View className="flex-row flex-wrap gap-2">
          {LANGS.map((l) => (
            <Chip key={l} label={l} selected={lang === l} onPress={() => setLang(l)} />
          ))}
        </View>
        <ScoreField label={`${lang} — ქულა`} value={foreign} onChange={setForeign} error={errors.foreign} />

        <SectionTitle>არჩევითი საგანი</SectionTitle>
        <View className="flex-row flex-wrap gap-2">
          {ELECTIVES.map((e) => (
            <Chip key={e} label={SUBJECTS[e]} selected={elective === e} onPress={() => setElective(e)} />
          ))}
        </View>
        {errors.electiveSubject && <Text className="mt-1 text-xs text-destructive">{errors.electiveSubject}</Text>}
        {elective && <ScoreField label={`${SUBJECTS[elective]} — ქულა`} value={electiveScore} onChange={setElectiveScore} error={errors.elective} />}

        <SectionTitle>სასურველი სფერო</SectionTitle>
        <View className="flex-row flex-wrap gap-2">
          {FIELDS.map((f) => (
            <Chip key={f.id} label={f.name} selected={field === f.id} onPress={() => setField(field === f.id ? null : f.id)} />
          ))}
        </View>

        {existing && (
          <Text className="mt-6 text-sm leading-5 text-muted-foreground">
            შენახვისას ახალი მნიშვნელობები ჩაანაცვლებს წინა შედეგებს. თუ არაფერი გინდა შეცვალო, უბრალოდ დაბრუნდი უკან.
          </Text>
        )}
        <Button className="mt-4 min-h-[52px]" onPress={save}>{existing ? "ცვლილებების შენახვა" : "შენახვა"}</Button>
        {Object.keys(errors).length > 0 && <Text className="mt-2 text-center text-sm text-destructive">გთხოვ, შეასწორე მონიშნული ველები.</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
