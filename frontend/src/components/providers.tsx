"use client";

import { PREFERENCES_KEY, SESSION_KEY } from "@/lib/storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export { PREFERENCES_KEY, SESSION_KEY } from "@/lib/storage";

/** Display and input settings, remembered on this device. */
export type Preferences = {
  largeText: boolean;
  voiceMode: boolean;
  /** Demo switch: pretend there is no network and replay cached answers. */
  offlineMode: boolean;
};

/** The phone-number login stub. Never leaves this browser. */
export type Session = {
  phone: string;
  signedInAt: string;
};

const DEFAULT_PREFERENCES: Preferences = {
  largeText: false,
  voiceMode: false,
  offlineMode: false,
};

type Snapshot = {
  preferences: Preferences;
  session: Session | null;
};

/* -------------------------------------------------------------------------- */
/*  localStorage as an external store.                                        */
/*                                                                            */
/*  useSyncExternalStore rather than read-in-an-effect: React hydrates with    */
/*  the server snapshot and then re-renders with the stored one, so there is   */
/*  no mismatch and no setState inside an effect. The `storage` event also     */
/*  keeps two open tabs in step for free.                                     */
/* -------------------------------------------------------------------------- */

const SERVER_SNAPSHOT: Snapshot = {
  preferences: DEFAULT_PREFERENCES,
  session: null,
};

const listeners = new Set<() => void>();

// getSnapshot must be referentially stable between reads or React re-renders
// forever, so the parsed value is cached against the raw strings it came from.
let cachedRaw: { preferences: string | null; session: string | null } = {
  preferences: null,
  session: null,
};
let cachedSnapshot: Snapshot = SERVER_SNAPSHOT;

function safeRead(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function getSnapshot(): Snapshot {
  const preferences = safeRead(PREFERENCES_KEY);
  const session = safeRead(SESSION_KEY);

  if (preferences === cachedRaw.preferences && session === cachedRaw.session) {
    return cachedSnapshot;
  }

  cachedRaw = { preferences, session };
  cachedSnapshot = {
    preferences: parse(preferences, DEFAULT_PREFERENCES),
    session: parse<Session | null>(session, null),
  };
  return cachedSnapshot;
}

function parse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const value = JSON.parse(raw) as T;
    // Spread over the fallback so a partial or older entry still yields a
    // complete object rather than undefined fields.
    return value && typeof value === "object" && fallback && typeof fallback === "object"
      ? { ...fallback, ...value }
      : value;
  } catch {
    return fallback;
  }
}

function getServerSnapshot(): Snapshot {
  return SERVER_SNAPSHOT;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function write(key: string, value: unknown | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode — the change still applies to this page view */
  }
  // `storage` does not fire in the tab that made the change.
  listeners.forEach((listener) => listener());
}

/* -------------------------------------------------------------------------- */

type PreferencesValue = {
  preferences: Preferences;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
};

type SessionValue = {
  session: Session | null;
  signIn: (phone: string) => void;
  signOut: () => void;
};

const PreferencesContext = createContext<PreferencesValue | null>(null);
const SessionContext = createContext<SessionValue | null>(null);

export function AppProviders({ children }: { children: ReactNode }) {
  const { preferences, session } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  // Mirror onto <html> so the token overrides in globals.css take effect.
  // PreferencesScript has already done this for the first paint; this keeps it
  // in step when the reader flips a toggle.
  useEffect(() => {
    const root = document.documentElement;

    if (preferences.largeText) root.dataset.textSize = "large";
    else delete root.dataset.textSize;

    if (preferences.voiceMode) root.dataset.voice = "on";
    else delete root.dataset.voice;

    if (preferences.offlineMode) root.dataset.offline = "on";
    else delete root.dataset.offline;
  }, [preferences]);

  const setPreference = useCallback<PreferencesValue["setPreference"]>(
    (key, value) => {
      write(PREFERENCES_KEY, { ...getSnapshot().preferences, [key]: value });
    },
    [],
  );

  const signIn = useCallback((phone: string) => {
    write(SESSION_KEY, { phone, signedInAt: new Date().toISOString() });
  }, []);

  const signOut = useCallback(() => write(SESSION_KEY, null), []);

  const preferencesValue = useMemo(
    () => ({ preferences, setPreference }),
    [preferences, setPreference],
  );
  const sessionValue = useMemo(
    () => ({ session, signIn, signOut }),
    [session, signIn, signOut],
  );

  return (
    <PreferencesContext.Provider value={preferencesValue}>
      <SessionContext.Provider value={sessionValue}>
        {children}
      </SessionContext.Provider>
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesValue {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences must be used inside AppProviders");
  return value;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside AppProviders");
  return value;
}
