import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/kit";
import { Text } from "@/components/ui/Text";
export default function Privacy() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title="კონფიდენციალურობა" />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }}
      >
        <Text className="text-xl font-bold">ChemiUni და შენი მონაცემები</Text>
        <Text className="mt-4 leading-7">
          ქულები, პრეფერენციები, სია, საუბარი და შეთავაზებებზე გადაწყვეტილებები ინახება შენს
          მოწყობილობაზე. AI პასუხისთვის იგზავნება ქულები, საგნები, პრეფერენციები, მიმდინარე სიის
          პროგრამების კოდები, საუბრის ისტორია და შეთავაზებებზე გადაწყვეტილებები. ანგარიშის სახელი,
          სკოლა და პროფილის ელფოსტა არ იგზავნება AI-სთან. საუბარში ნუ შეიყვან პირად ან სენსიტიურ
          ინფორმაციას.
        </Text>
        <Text className="mt-4 leading-7">
          AI მოთხოვნებს ამუშავებს Lovable AI Gateway და არჩეული მოდელის მომწოდებელი. უსაფრთხო
          შესვლას უზრუნველყოფს Lovable Cloud. საუბარი არ ინახება ChemiUni-ის Cloud ცხრილებში;
          სერვისის მოთხოვნებზე შეიძლება მოქმედებდეს მომწოდებლის მონაცემთა შენახვის პოლიტიკა.
          პროგრამების ყველა შეფასება საჩვენებელია და არა ოფიციალური პროგნოზი.
        </Text>
        <Text className="mt-4 leading-7">
          მოწყობილობის მონაცემების წაშლა შეგიძლია პროფილში. AI ანგარიშის წაშლა შეგიძლია კონსულტანტის
          ეკრანიდან; ის ადგილობრივ ქულებსა და სიას არ შლის.
        </Text>
      </ScrollView>
    </View>
  );
}
