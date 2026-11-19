import { isBoolean, oneOf } from "./local-preference";

export const deliveries = ["steer", "interrupt", "queue"] as const;
export type Delivery = (typeof deliveries)[number];
export type EnterAction = Delivery | "newline";

export type InputPrefs = {
  enter: EnterAction;
  modEnter: Delivery;
  altEnter: Delivery;
};

export const inputPrefsKey = "capy-web:input-prefs-v4";
export const defaultInputPrefs: InputPrefs = {
  enter: "steer",
  modEnter: "interrupt",
  altEnter: "queue",
};

const isEnter = oneOf([...deliveries, "newline"]);
const isDelivery = oneOf(deliveries);

export function isInputPrefs(value: unknown): value is InputPrefs {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return isEnter(v.enter) && isDelivery(v.modEnter) && isDelivery(v.altEnter);
}

export const enterLabels: Record<EnterAction, string> = {
  steer: "Steer",
  interrupt: "Interrupt",
  queue: "Queue",
  newline: "Newline",
};

export const deliveryLabels: Record<Delivery, string> = {
  steer: "Steer",
  interrupt: "Interrupt",
  queue: "Queue",
};

export const scrollNewMessagesKey = "kiki:scroll-new-messages-to-top";
export { isBoolean };

export const reuseThreadTabKey = "capy-desktop:reuse-thread-tab-v2";
export const openPreviewLinksInKey = "capy-desktop:open-preview-links-in";
export const previewLinkTargets = {
  pane: "Thread pane",
  system: "System browser",
};
export const isPreviewLinkTarget = oneOf(["pane", "system"]);
export const openLinksInKey = "capy-desktop:open-links-in";
export const linkTargets = { system: "System browser", capy: "Capy browser" };
export const isLinkTarget = oneOf(["system", "capy"]);
export const searchEngineKey = "capy-desktop:browser-search-engine";
export const searchEngines = {
  google: "Google",
  duckduckgo: "DuckDuckGo",
  bing: "Bing",
};
export const isSearchEngine = oneOf(["google", "duckduckgo", "bing"]);
