import {
  type CSSProperties,
  createContext,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { SidebarWrapper } from "@/primitives/sidebar";

export const SIDEBAR_DEFAULT_WIDTH = 240;
export const SIDEBAR_MIN_WIDTH = 224;
export const SIDEBAR_MAX_WIDTH = 330;
export const SIDEBAR_COLLAPSE_THRESHOLD = SIDEBAR_MIN_WIDTH / 2;
export const SIDEBAR_KEY_STEP = 8;
export const SIDEBAR_KEY_STEP_LARGE = 32;
export const SIDEBAR_WIDTH_KEY = "capy:web:sidebar-width";
export const SIDEBAR_OPEN_KEY = "capy:web:sidebar-open";

export type SidebarState = { open: boolean; isNarrow: boolean; width: number };

export type SidebarActions = {
  setOpen: (open: boolean) => void;
  setOpenMobile: (open: boolean | ((open: boolean) => boolean)) => void;
  toggle: () => void;
  setWidth: (width: number) => void;
};

const SidebarStateContext = createContext<SidebarState | null>(null);
const SidebarOpenMobileContext = createContext<boolean | null>(null);
const SidebarActionsContext = createContext<SidebarActions | null>(null);

export const clampSidebarWidth = (width: number) =>
  Math.min(Math.max(width, SIDEBAR_MIN_WIDTH), SIDEBAR_MAX_WIDTH);

const readStorage = (key: string) => {
  try {
    return globalThis.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  try {
    globalThis.localStorage.setItem(key, value);
  } catch {}
};

export const readStoredSidebarWidth = () => {
  const raw = readStorage(SIDEBAR_WIDTH_KEY);
  const width = raw === null ? Number.NaN : Number(raw);
  return Number.isFinite(width) ? width : null;
};

export const readStoredSidebarOpen = () => {
  const raw = readStorage(SIDEBAR_OPEN_KEY);
  return raw === null ? null : raw === "true";
};

let narrowQuery: MediaQueryList | null = null;

const getNarrowQuery = () => {
  if (narrowQuery) return narrowQuery;
  const md = getComputedStyle(document.documentElement)
    .getPropertyValue("--breakpoint-md")
    .trim();
  narrowQuery = window.matchMedia(md ? `(width < ${md})` : "not all");
  return narrowQuery;
};

export const isNarrowViewport = () => getNarrowQuery().matches;

const subscribeNarrow = (onChange: () => void) => {
  const query = getNarrowQuery();
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

export function useIsNarrow() {
  return useSyncExternalStore(subscribeNarrow, isNarrowViewport, () => false);
}

export function useSidebarState() {
  const state = useContext(SidebarStateContext);
  if (!state)
    throw new TypeError("useSidebarState must be inside SidebarProvider");
  return state;
}

export function useSidebarOpenMobile() {
  const open = useContext(SidebarOpenMobileContext);
  if (open === null)
    throw new TypeError("useSidebarOpenMobile must be inside SidebarProvider");
  return open;
}

export function useSidebarActions() {
  const actions = useContext(SidebarActionsContext);
  if (!actions)
    throw new TypeError("useSidebarActions must be inside SidebarProvider");
  return actions;
}

const STATIC_STATE: SidebarState = {
  open: true,
  isNarrow: false,
  width: SIDEBAR_DEFAULT_WIDTH,
};

const STATIC_ACTIONS: SidebarActions = {
  setOpen: () => {},
  setOpenMobile: () => {},
  toggle: () => {},
  setWidth: () => {},
};

export function StaticSidebarProvider({ children }: { children: ReactNode }) {
  return (
    <SidebarStateContext.Provider value={STATIC_STATE}>
      <SidebarOpenMobileContext.Provider value={false}>
        <SidebarActionsContext.Provider value={STATIC_ACTIONS}>
          {children}
        </SidebarActionsContext.Provider>
      </SidebarOpenMobileContext.Provider>
    </SidebarStateContext.Provider>
  );
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const isNarrow = useIsNarrow();
  const [open, setOpenState] = useState(true);
  const [openMobile, setOpenMobile] = useState(false);
  const [width, setWidthState] = useState(SIDEBAR_DEFAULT_WIDTH);

  if (!isNarrow && openMobile) setOpenMobile(false);

  useLayoutEffect(() => {
    const storedWidth = readStoredSidebarWidth();
    if (storedWidth !== null) setWidthState(clampSidebarWidth(storedWidth));
    const storedOpen = readStoredSidebarOpen();
    if (storedOpen !== null) setOpenState(storedOpen);
  }, []);

  const actions: SidebarActions = {
    setOpen: (next) => {
      setOpenState(next);
      writeStorage(SIDEBAR_OPEN_KEY, String(next));
    },
    setOpenMobile,
    toggle: () => {
      if (isNarrowViewport()) {
        setOpenMobile((current) => !current);
        return;
      }
      setOpenState((current) => {
        writeStorage(SIDEBAR_OPEN_KEY, String(!current));
        return !current;
      });
    },
    setWidth: (next) => {
      const clamped = clampSidebarWidth(next);
      setWidthState(clamped);
      document.documentElement.style.setProperty(
        "--sidebar-width-user",
        `${clamped}px`,
      );
      writeStorage(SIDEBAR_WIDTH_KEY, String(clamped));
    },
  };

  return (
    <SidebarStateContext.Provider value={{ open, isNarrow, width }}>
      <SidebarOpenMobileContext.Provider value={openMobile}>
        <SidebarActionsContext.Provider value={actions}>
          <SidebarWrapper
            className="flex h-dvh w-full overflow-hidden bg-chrome pt-(--safe-top) max-md:bg-panel"
            style={
              {
                "--sidebar-width": `var(--sidebar-width-user, ${width}px)`,
              } as CSSProperties
            }
          >
            {children}
          </SidebarWrapper>
        </SidebarActionsContext.Provider>
      </SidebarOpenMobileContext.Provider>
    </SidebarStateContext.Provider>
  );
}
