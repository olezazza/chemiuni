import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Chip, ScreenHeader, SectionTitle } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { CITIES, FIELDS, type City, type FieldId } from "@/lib/data";
import { useStore } from "@/lib/store";
import { savedFormDestination } from "@/lib/form-navigation";
import { AMBITION_LABEL, BUDGET_LABEL, type Ambition, type Budget, type Prefs } from "@/lib/types";

export default function Preferences() {
  const insets = useSafeAreaInsets();
  const { profile, update } = useStore();
  const [prefs, setPrefs] = useState<Prefs>(profile.prefs);
  const [field, setField] = useState<FieldId | null>(profile.field);
  const [more, setMore] = useState(false);
  const set = (patch: Partial<Prefs>) => setPrefs((p) => ({ ...p, ...patch }));

  const toggleCity = (c: City) => {
    const cities = prefs.cities.includes(c) ? prefs.cities.filter((x) => x !== c) : [...prefs.cities, c];
    set({ cities, anyCity: cities.length === 0, excludedCities: prefs.excludedCities.filter((x) => x !== c) });
  };

  const save = () => {
    // Only preferences change here — saved scores stay untouched.
    update((p) => ({ ...p, field, prefs }));
    const destination = savedFormDestination(router.canGoBack());
    if (destination === "back") router.back();
    else router.replace(destination);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} className="bg-background">
      <View style={{ paddingTop: insets.top + 8 }}>
        <ScreenHeader title="პრეფერენციები" />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}>
        <SectionTitle className="mt-2">სფერო</SectionTitle>
        <View className="flex-row flex-wrap gap-2">
          {FIELDS.map((f) => (
            <Chip key={f.id} label={f.name} selected={field === f.id} onPress={() => setField(field === f.id ? null : f.id)} />
          ))}
        </View>

        <SectionTitle>სად გინდა სწავლა?</SectionTitle>
        <View className="flex-row flex-wrap gap-2">
          <Chip label="ნებისმიერ ქალაქში" selected={prefs.anyCity && prefs.cities.length === 0} onPress={() => set({ anyCity: true, cities: [] })} />
          {CITIES.map((c) => (
            <Chip key={c} label={c} selected={prefs.cities.includes(c)} onPress={() => toggleCity(c)} />
          ))}
        </View>

        <SectionTitle>სწავლის საფასური</SectionTitle>
        <View className="flex-row flex-wrap gap-2">
          {(Object.keys(BUDGET_LABEL) as Budget[]).map((b) => (
            <Chip key={b} label={BUDGET_LABEL[b]} selected={prefs.budget === b} onPress={() => set({ budget: b })} />
          ))}
        </View>

        {!more ? (
          <Button variant="ghost" className="mt-4" onPress={() => setMore(true)}>დამატებითი პრეფერენციები</Button>
        ) : (
          <>
            <SectionTitle>სიის ხასიათი</SectionTitle>
            <View className="flex-row flex-wrap gap-2">
              {(Object.keys(AMBITION_LABEL) as Ambition[]).map((a) => (
                <Chip key={a} label={AMBITION_LABEL[a]} selected={prefs.ambition === a} onPress={() => set({ ambition: a })} />
              ))}
            </View>
            <SectionTitle>სტიპენდიები</SectionTitle>
            <Chip label="პრიორიტეტი მიანიჭე სტიპენდიებს" selected={prefs.scholarshipFocus} onPress={() => set({ scholarshipFocus: !prefs.scholarshipFocus })} />
            {prefs.excludedCities.length > 0 && (
              <>
                <SectionTitle>გამორიცხული ქალაქები</SectionTitle>
                <View className="flex-row flex-wrap gap-2">
                  {prefs.excludedCities.map((c) => (
                    <Chip key={c} label={`${c} ✕`} selected onPress={() => set({ excludedCities: prefs.excludedCities.filter((x) => x !== c) })} />
                  ))}
                </View>
              </>
            )}
            <SectionTitle>სხვა რამ, რაც მნიშვნელოვანია</SectionTitle>
            <Input multiline className="min-h-[88px] border border-border bg-card" placeholder="მაგ.: მინდა ინგლისურენოვანი პროგრამა" value={prefs.notes} onChangeText={(notes) => set({ notes })} />
          </>
        )}

        <Button className="mt-6 min-h-[52px]" onPress={save}>შენახვა</Button>
        <Text className="mt-2 text-center text-xs text-muted-foreground">შენახული ქულები უცვლელი რჩება.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
