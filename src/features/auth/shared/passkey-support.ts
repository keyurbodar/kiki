import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const isSupported = () =>
  typeof window !== "undefined" &&
  typeof window.PublicKeyCredential === "function";
const serverSnapshot = () => false;

export const usePasskeySupport = () =>
  useSyncExternalStore(subscribe, isSupported, serverSnapshot);
