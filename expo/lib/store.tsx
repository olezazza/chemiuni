import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { EMPTY_PROFILE, type Profile } from "./types";

const KEY = "chemiuni.profile.v1";

type Ctx = {
  ready: boolean;
  profile: Profile;
  update: (fn: (p: Profile) => Profile) => void;
  reset: () => Promise<void>;
  saveError: boolean;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [saveError, setSaveError] = useState(false);
  const current = useRef(profile);
  const writes = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw) as Partial<Profile>;
          const restored = {
            ...EMPTY_PROFILE,
            ...saved,
            scores: { ...EMPTY_PROFILE.scores, ...saved.scores },
            prefs: { ...EMPTY_PROFILE.prefs, ...saved.prefs },
            account: { ...EMPTY_PROFILE.account, ...saved.account },
          };
          current.current = restored;
          setProfile(restored);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const update = useCallback((fn: (p: Profile) => Profile) => {
    const next = fn(current.current);
    current.current = next;
    setProfile(next);
    // Serialize writes so an earlier message cannot overwrite a later approval.
    writes.current = writes.current
      .catch(() => {})
      .then(() => AsyncStorage.setItem(KEY, JSON.stringify(next)))
      .then(() => setSaveError(false))
      .catch(() => setSaveError(true));
  }, []);

  const reset = useCallback(async () => {
    await writes.current.catch(() => {});
    await AsyncStorage.removeItem(KEY);
    current.current = EMPTY_PROFILE;
    setSaveError(false);
    setProfile(EMPTY_PROFILE);
  }, []);

  const value = useMemo(
    () => ({ ready, profile, update, reset, saveError }),
    [ready, profile, update, reset, saveError],
  );
  // Children mount only after saved data loads, so no screen can overwrite it with defaults.
  return <StoreContext.Provider value={value}>{ready ? children : null}</StoreContext.Provider>;
}

export function useStore() {
  const c = useContext(StoreContext);
  if (!c) throw new Error("useStore outside provider");
  return c;
}
