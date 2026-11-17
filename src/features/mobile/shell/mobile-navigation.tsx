import { createContext, type ReactNode, useContext, useState } from "react";
import { useIsNarrow } from "../use-mobile";

export type MobileNavigation = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

const MobileNavigationContext = createContext<MobileNavigation | null>(null);

export type MobileNavigationProviderProps = {
  closeKey?: string;
  children: ReactNode;
};

export function MobileNavigationProvider({
  closeKey,
  children,
}: MobileNavigationProviderProps) {
  const isNarrow = useIsNarrow();
  const [open, setOpen] = useState(false);
  const [lastCloseKey, setLastCloseKey] = useState(closeKey);
  if (closeKey !== lastCloseKey) {
    setLastCloseKey(closeKey);
    setOpen(false);
  }
  if (!isNarrow && open) setOpen(false);
  return (
    <MobileNavigationContext.Provider
      value={{ open, setOpen, toggle: () => setOpen((value) => !value) }}
    >
      {children}
    </MobileNavigationContext.Provider>
  );
}

export function useMobileNavigation() {
  const navigation = useContext(MobileNavigationContext);
  if (navigation === null)
    throw new TypeError(
      "useMobileNavigation must be inside MobileNavigationProvider",
    );
  return navigation;
}
