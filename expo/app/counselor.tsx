import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  View,
  type TextInput,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { ProposalCard } from "@/components/counselor/ProposalCard";
import { decideProposals, validateProposal } from "@/lib/counselor";
import {
  CounselorConnectError,
  counselorClient,
  ensureGuestSession,
  requestCounselor,
} from "@/lib/counselor-service";
import type { CounselorMessage } from "@/lib/counselor-types";
import { useStore } from "@/lib/store";
import { useThemeColors } from "@/lib/theme";
import { useAppearance } from "@/lib/appearance";

const id = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export default function Counselor() {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const { profile, update, saveError } = useStore();
  const { fontsReady } = useAppearance();
  const latest = useRef(profile);
  latest.current = profile;
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [confirmIds, setConfirmIds] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const input = useRef<TextInput>(null);
  const list = useRef<FlatList<CounselorMessage>>(null);
  const abort = useRef<AbortController | null>(null);
  const running = useRef(false);
  const messages = profile.counselor?.messages ?? [];
  const pending = messages.flatMap((m) => m.proposals).filter((p) => p.status === "pending");
  const connecting = useRef(false);
  const mounted = useRef(true);
  const active = () => mounted.current;
  const connect = async () => {
    if (connecting.current) return;
    connecting.current = true;
    setAuthReady(false);
    setError("");
    try {
      await ensureGuestSession();
      if (active()) setSignedIn(true);
    } catch (failure) {
      if (__DEV__) console.warn("[counselor] connect", String(failure));
      if (active()) {
        setSignedIn(false);
        setError(
          failure instanceof CounselorConnectError && failure.stage === "guest"
            ? "სტუმრის სესია ვერ შეიქმნა. ხელახლა სცადე ცოტა ხანში."
            : "კონსულტანტის სერვისი ახლა მიუწვდომელია. ხელახლა სცადე.",
        );
      }
    } finally {
      connecting.current = false;
      if (active()) setAuthReady(true);
    }
  };
  useEffect(() => {
    mounted.current = true;
    void connect();
    return () => {
      mounted.current = false;
      abort.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (signedIn && !confirmIds.length && !deleteOpen) input.current?.focus();
  }, [signedIn, busy, confirmIds.length, deleteOpen]);

  const send = async (retry = false) => {
    if (running.current || !latest.current.listCreated) return;
    const text = draft.trim();
    if (!retry && !text) return;
    running.current = true;
    setBusy(true);
    setError("");
    const current = latest.current;
    const history = retry
      ? (current.counselor?.messages ?? [])
      : [
          ...(current.counselor?.messages ?? []),
          {
            id: id(),
            role: "user" as const,
            parts: [{ type: "text" as const, text }],
            proposals: [],
          },
        ];
    if (!retry) {
      update((p) => ({ ...p, counselor: { messages: history } }));
      setDraft("");
    }
    const controller = new AbortController();
    abort.current = controller;
    try {
      const reply = await requestCounselor(current, history, controller.signal, id());
      if (!controller.signal.aborted)
        update((p) => ({
          ...p,
          counselor: {
            messages: [
              ...(p.counselor?.messages ?? []),
              {
                ...reply,
                proposals: reply.proposals.map((proposal) => {
                  const notice = validateProposal(p, proposal);
                  return notice ? { ...proposal, status: "stale" as const, notice } : proposal;
                }),
              },
            ],
          },
        }));
    } catch (e) {
      if (!controller.signal.aborted)
        setError(
          e instanceof Error && /[ა-ჰ]/.test(e.message)
            ? e.message
            : "კონსულტანტის პასუხი ვერ მივიღეთ. სია უცვლელია.",
        );
    } finally {
      running.current = false;
      setBusy(false);
      input.current?.focus();
    }
  };
  const accept = (ids: string[], confirmed = false) => {
    const proposals = (latest.current.counselor?.messages ?? [])
      .flatMap((m) => m.proposals)
      .filter((p) => ids.includes(p.id) && p.status === "pending");
    if (
      !confirmed &&
      proposals.some((p) => p.action === "remove" && !validateProposal(latest.current, p))
    ) {
      setConfirmIds(ids);
      return;
    }
    update((p) => decideProposals(p, ids, true, confirmed));
    setConfirmIds([]);
  };
  const reject = (pid: string) => update((profile) => decideProposals(profile, [pid], false));
  const md = {
    body: { color: c.foreground, fontSize: 15, lineHeight: 24, ...(fontsReady ? { fontFamily: "FiraGO" } : {}) },
    text: { color: c.foreground },
    paragraph: { marginTop: 0, marginBottom: 6, color: c.foreground },
    strong: { color: c.foreground, fontWeight: "700" as const },
    em: { color: c.foreground },
    heading1: { color: c.foreground, fontSize: 18 },
    heading2: { color: c.foreground, fontSize: 17 },
    heading3: { color: c.foreground, fontSize: 16 },
    bullet_list_icon: { color: c.accent },
    ordered_list_icon: { color: c.accent },
    list_item: { color: c.foreground },
    link: { color: c.accent },
    code_inline: { color: c.foreground, backgroundColor: c.muted },
    blockquote: { backgroundColor: c.muted, borderColor: c.border },
  };
  const userMd = {
    ...md,
    body: { ...md.body, color: c.primaryForeground },
    text: { color: c.primaryForeground },
    paragraph: { marginTop: 0, marginBottom: 0, color: c.primaryForeground },
    strong: { color: c.primaryForeground, fontWeight: "700" as const },
    em: { color: c.primaryForeground },
    link: { color: c.primaryForeground },
    list_item: { color: c.primaryForeground },
  };
  const starters = [
    { label: "სიის შეფასება", text: "შეაფასე ჩემი სია და პრეფერენციები. რა არის გასაუმჯობესებელი?" },
    { label: "იაფი ალტერნატივები", text: "მაჩვენე უფრო ხელმისაწვდომი ალტერნატივები ჩემი სიიდან." },
    { label: "რისკის შემცირება", text: "ჩემი სია ზედმეტად რისკიანია? რა შევცვალო?" },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="bg-background"
    >
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title="კონსულტანტი" />
      </View>
      {!profile.listCreated ? (
        <View className="flex-1 justify-center px-6">
          <Text className="text-center text-muted-foreground">
            კონსულტანტთან საუბრამდე შექმენი შენი პროგრამების სია.
          </Text>
          <Button className="mt-5" onPress={() => router.replace("/(tabs)/list")}>
            ჩემი სია
          </Button>
        </View>
      ) : !authReady ? (
        <View className="flex-1 gap-4 px-6 pt-8">
          <View className="min-h-[28px] w-2/3 bg-muted" />
          <View className="min-h-[52px] bg-muted" />
          <View className="min-h-[52px] bg-muted" />
        </View>
      ) : !signedIn ? (
        <View className="flex-1 justify-center px-6">
          <Text className="text-center text-muted-foreground">
            {error || "კონსულტანტთან დაკავშირება ვერ მოხერხდა."}
          </Text>
          <Button className="mt-5" onPress={() => void connect()}>
            ხელახლა ცდა
          </Button>
        </View>

      ) : (
        <>
          <FlatList
            ref={list}
            data={messages}
            keyExtractor={(m) => m.id}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
            contentContainerStyle={{ padding: 16, gap: 18 }}
            ListHeaderComponent={
              <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-violet-soft">
                  <Feather name="compass" size={20} color={c.violet} />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-foreground">ChemiUni მრჩეველი</Text>
                  <Text className="text-xs leading-5 text-muted-foreground">
                    ქულები, სია და პრეფერენციები · საჩვენებელი მონაცემები
                  </Text>
                </View>
                {pending.length > 0 && (
                  <View className="rounded-full bg-violet-soft px-2.5 py-1">
                    <Text className="text-xs font-semibold text-violet">{pending.length} ღია</Text>
                  </View>
                )}
                <Pressable
                  className="min-h-[44px] min-w-[44px] items-center justify-center"
                  onPress={() => router.push("/privacy")}
                  accessibilityLabel="კონფიდენციალურობა"
                >
                  <Feather name="info" size={18} color={c.mutedForeground} />
                </Pressable>
              </View>
            }
            ListEmptyComponent={
              <View className="py-4">
                <Text className="font-display text-xl text-foreground">რით დაგეხმარო?</Text>
                <Text className="mt-1 text-sm leading-6 text-muted-foreground">
                  აირჩიე თემა ან დაწერე საკუთარი სიტყვებით. ცვლილებები მხოლოდ შენი თანხმობით შევა სიაში.
                </Text>
                <View className="mt-4 gap-2">
                  {starters.map((s) => (
                    <Pressable
                      key={s.label}
                      onPress={() => {
                        setDraft(s.text);
                        input.current?.focus();
                      }}
                      accessibilityRole="button"
                      className="min-h-[48px] flex-row items-center gap-3 rounded-xl border border-border bg-card px-4 active:bg-secondary"
                    >
                      <Feather name="corner-down-right" size={16} color={c.accent} />
                      <Text className="flex-1 text-[15px] text-foreground">{s.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            }
            renderItem={({ item }) =>
              item.role === "user" ? (
                <View className="ml-10 self-end rounded-2xl rounded-br-md bg-primary px-4 py-2.5">
                  {item.parts.map((part, index) => (
                    <Markdown key={index} style={userMd}>
                      {part.text}
                    </Markdown>
                  ))}
                </View>
              ) : (
                <View className="mr-2">
                  <View className="mb-1.5 flex-row items-center gap-1.5">
                    <Feather name="compass" size={13} color={c.violet} />
                    <Text className="text-xs font-semibold text-violet">მრჩეველი</Text>
                  </View>
                  <View className="border-l-2 border-violet pl-3">
                    {item.parts.map((part, index) => (
                      <Markdown key={index} style={md}>
                        {part.text}
                      </Markdown>
                    ))}
                  </View>
                  {item.proposals.map((p) => (
                    <ProposalCard
                      key={p.id}
                      proposal={p}
                      onAccept={() => accept([p.id])}
                      onReject={() => reject(p.id)}
                    />
                  ))}
                </View>
              )
            }
            ListFooterComponent={
              <View>
                {busy && (
                  <View accessibilityLiveRegion="polite" className="gap-2 py-2">
                    <View className="flex-row items-center gap-2">
                      <ActivityIndicator color={c.violet} size="small" />
                      <Text className="text-sm text-muted-foreground">მრჩეველი ფიქრობს…</Text>
                    </View>
                    <View className="h-3 w-3/4 rounded-full bg-muted" />
                    <View className="h-3 w-1/2 rounded-full bg-muted" />
                  </View>
                )}
                {error ? (
                  <View className="mt-2 rounded-2xl border border-destructive bg-card p-4">
                    <View className="flex-row gap-2">
                      <Feather name="alert-triangle" size={16} color={c.destructive} style={{ marginTop: 3 }} />
                      <Text className="flex-1 text-sm leading-6 text-foreground">{error}</Text>
                    </View>
                    <Button variant="tinted" className="mt-3" onPress={() => send(true)} disabled={busy}>
                      ხელახლა ცდა
                    </Button>
                  </View>
                ) : null}
                {pending.length > 1 && (
                  <Button className="mt-4" onPress={() => accept(pending.map((p) => p.id))}>
                    {`ყველას მიღება (${pending.length})`}
                  </Button>
                )}
                {saveError && (
                  <Text className="mt-3 text-sm text-destructive">
                    ცვლილებები მოწყობილობაზე ვერ შეინახა. აპის დახურვამდე ხელახლა სცადე.
                  </Text>
                )}
                <View className="mt-6 items-center">
                  <Button variant="ghost" onPress={() => setDeleteOpen(true)}>
                    ანგარიშის წაშლა
                  </Button>
                </View>
              </View>
            }
          />
          <View
            className="border-t border-border bg-card px-4 pt-3"
            style={{ paddingBottom: insets.bottom + 12 }}
          >
            <View className="flex-row items-end gap-2">
              <Input
                ref={input}
                className="max-h-[140px] flex-1"
                multiline
                value={draft}
                onChangeText={setDraft}
                maxLength={6000}
                placeholder="რა არის შენთვის მნიშვნელოვანი?"
                accessibilityLabel="შეტყობინება"
              />
              <Pressable
                accessibilityLabel={busy ? "შეჩერება" : "გაგზავნა"}
                accessibilityState={{ disabled: !busy && !draft.trim() }}
                disabled={!busy && !draft.trim()}
                onPress={() => (busy ? abort.current?.abort() : send())}
                className={
                  !busy && !draft.trim()
                    ? "min-h-[52px] min-w-[52px] items-center justify-center rounded-xl border border-border bg-muted"
                    : "min-h-[52px] min-w-[52px] items-center justify-center rounded-xl bg-primary active:opacity-90"
                }
              >
                <Feather
                  name={busy ? "square" : "arrow-up"}
                  size={22}
                  color={!busy && !draft.trim() ? c.mutedForeground : c.primaryForeground}
                />
              </Pressable>
            </View>
          </View>
        </>
      )}
      <Modal
        visible={confirmIds.length > 0 || deleteOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setConfirmIds([]);
          setDeleteOpen(false);
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="items-center justify-center bg-background/90 px-6"
        >
          <View
            className="w-full max-w-md rounded-lg border border-border bg-card p-5"
            accessibilityViewIsModal
          >
            <Text className="text-xl font-bold">
              {deleteOpen ? "ანგარიშის წაშლა" : "პროგრამის ამოღება"}
            </Text>
            <Text className="mt-3 text-sm leading-6 text-muted-foreground">
              {deleteOpen
                ? "AI-ს ანგარიში სამუდამოდ წაიშლება. ამ მოწყობილობაზე შენახული ქულები, სია და საუბარი უცვლელი დარჩება."
                : `ამ შეთავაზებებით ${pending.filter((p) => confirmIds.includes(p.id) && p.action === "remove").length} პროგრამა ჩანაცვლების გარეშე ამოიღება და სია შემცირდება. გააგრძელებ?`}
            </Text>
            <Button
              variant="tinted"
              className="mt-4"
              onPress={() => {
                setConfirmIds([]);
                setDeleteOpen(false);
              }}
            >
              გაუქმება
            </Button>
            <Button
              className="mt-2"
              onPress={async () => {
                if (!deleteOpen) {
                  accept(confirmIds, true);
                  return;
                }
                try {
                  const { api } = await import("@/lib/lovable-api");
                  await api.post("/api/public/delete-account");
                  await (await counselorClient()).auth.signOut();
                  setDeleteOpen(false);
                  void connect();
                } catch {
                  setError("ანგარიში ვერ წაიშალა. ხელახლა სცადე.");
                  setDeleteOpen(false);
                }
              }}
            >
              {deleteOpen ? "ანგარიშის წაშლა" : "დადასტურება"}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}
