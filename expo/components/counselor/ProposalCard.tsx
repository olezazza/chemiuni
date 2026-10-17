import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import type { Proposal } from "@/lib/counselor-types";
import { programById, universityById } from "@/lib/data";
import { useThemeColors, type ThemeColors } from "@/lib/theme";
import { cn } from "@/lib/utils";

const actions = {
  add: { label: "დამატება", icon: "plus" },
  remove: { label: "ამოღება", icon: "minus" },
  replace: { label: "ჩანაცვლება", icon: "repeat" },
} as const;

const statuses = {
  pending: { label: "განსახილველი", icon: "clock", box: "bg-violet-soft", text: "text-violet" },
  accepted: { label: "მიღებულია", icon: "check", box: "bg-safe-soft", text: "text-safe" },
  rejected: { label: "უარყოფილია", icon: "x", box: "bg-muted", text: "text-muted-foreground" },
  stale: { label: "აღარ მოქმედებს", icon: "alert-circle", box: "bg-target-soft", text: "text-target" },
} as const;

const tone = (p: Proposal, c: ThemeColors) =>
  p.action === "add" ? c.safe : p.action === "remove" ? c.destructive : c.accent;

function ProgramLine({ id, kind, struck }: { id: string; kind: string; struck?: boolean }) {
  const c = useThemeColors();
  const program = programById(id);
  const uni = program ? universityById(program.universityId) : null;
  return (
    <Pressable
      disabled={!program}
      onPress={() => router.push(`/program/${id}`)}
      accessibilityRole="link"
      accessibilityLabel={`${kind}: ${program?.name ?? "პროგრამა მიუწვდომელია"}`}
      className="min-h-[44px] flex-row items-center gap-3 rounded-xl bg-background px-3 py-2 active:bg-secondary"
    >
      <View className="flex-1">
        <Text className="text-xs text-muted-foreground">{kind}</Text>
        <Text
          className={cn(
            "text-[15px] font-semibold leading-6",
            struck ? "text-muted-foreground line-through" : "text-foreground",
          )}
        >
          {program?.name ?? "პროგრამა მიუწვდომელია"}
        </Text>
        {uni && (
          <Text className="text-xs text-muted-foreground">
            {uni.short} · {uni.city}
          </Text>
        )}
      </View>
      {program && <Feather name="chevron-right" size={18} color={c.mutedForeground} />}
    </Pressable>
  );
}

export function ProposalCard({
  proposal: p,
  onAccept,
  onReject,
}: {
  proposal: Proposal;
  onAccept: () => void;
  onReject: () => void;
}) {
  const c = useThemeColors();
  const action = actions[p.action];
  const status = statuses[p.status];
  const decided = p.status === "rejected" || p.status === "stale";
  return (
    <View
      className={cn(
        "mt-3 overflow-hidden rounded-2xl border bg-card",
        p.status === "accepted" ? "border-safe" : "border-border",
      )}
    >
      <View className="flex-row items-center gap-2 px-4 pt-3">
        <View
          className="h-7 w-7 items-center justify-center rounded-full"
          style={{ backgroundColor: tone(p, c) + "22" }}
        >
          <Feather name={action.icon} size={15} color={tone(p, c)} />
        </View>
        <Text className="flex-1 text-[15px] font-semibold text-foreground">{action.label}</Text>
        <View
          accessibilityLabel={`სტატუსი: ${status.label}`}
          className={cn("flex-row items-center gap-1 rounded-full px-2.5 py-1", status.box)}
        >
          <Feather
            name={status.icon}
            size={12}
            color={
              p.status === "accepted"
                ? c.safe
                : p.status === "stale"
                  ? c.target
                  : p.status === "pending"
                    ? c.violet
                    : c.mutedForeground
            }
          />
          <Text className={cn("text-xs font-semibold", status.text)}>{status.label}</Text>
        </View>
      </View>

      <View className={cn("gap-1 px-4 pt-3", decided && "opacity-80")}>
        {p.targetId && (
          <ProgramLine
            id={p.targetId}
            kind={p.action === "replace" ? "ახლა სიაში" : "სიიდან ამოიღება"}
            struck={p.status === "accepted" || p.action === "remove"}
          />
        )}
        {p.action === "replace" && (
          <View className="items-center py-0.5" accessibilityElementsHidden>
            <Feather name="arrow-down" size={16} color={c.accent} />
          </View>
        )}
        {p.programId && (
          <ProgramLine
            id={p.programId}
            kind={p.action === "replace" ? "შემოთავაზებული" : "სიას დაემატება"}
          />
        )}
      </View>

      <View className="flex-row gap-2 px-4 pb-4 pt-3">
        <Feather name="message-circle" size={14} color={c.mutedForeground} style={{ marginTop: 3 }} />
        <Text className="flex-1 text-sm leading-6 text-muted-foreground">{p.reason}</Text>
      </View>

      {p.notice && (
        <View className="mx-4 mb-4 rounded-xl bg-target-soft px-3 py-2">
          <Text className="text-sm leading-5 text-foreground">{p.notice}</Text>
        </View>
      )}

      {p.status === "pending" && (
        <View className="flex-row gap-2 border-t border-border px-4 py-3">
          <Button className="flex-1" onPress={onAccept} accessibilityLabel={`${action.label}: მიღება`}>
            მიღება
          </Button>
          <Button
            variant="tinted"
            className="flex-1"
            onPress={onReject}
            accessibilityLabel={`${action.label}: უარყოფა`}
          >
            უარყოფა
          </Button>
        </View>
      )}
    </View>
  );
}
