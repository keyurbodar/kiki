import { useEffect, useState } from "react";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import { SidebarNavEditor } from "@/components/sidebar-nav-editor";
import { desktopBridge } from "@/lib/desktop-bridge";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Menu, MenuContent, MenuTrigger } from "@/primitives/menu";
import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectItem,
  MenuSelectTrigger,
  MenuSelectValue,
} from "@/primitives/menu-select";
import { SettingsRow } from "@/primitives/settings-row";
import { Switch } from "@/primitives/switch";
import { useLocalPreference } from "./local-preference";
import {
  type Delivery,
  defaultInputPrefs,
  deliveryLabels,
  desktopHandoffKey,
  type EnterAction,
  enterLabels,
  inputPrefsKey,
  isBoolean,
  isDesktopHandoff,
  isInputPrefs,
  isLinkTarget,
  isPreviewLinkTarget,
  isSearchEngine,
  linkTargets,
  openLinksInKey,
  openPreviewLinksInKey,
  previewLinkTargets,
  reuseThreadTabKey,
  scrollNewMessagesKey,
  searchEngineKey,
  searchEngines,
} from "./preferences";

const isDesktop = () => desktopBridge() !== undefined;

function SelectControl<T extends string>({
  items,
  value,
  onValueChange,
  className,
  ariaLabel,
}: {
  items: Record<T, string>;
  value: T;
  onValueChange: (value: T) => void;
  className: string;
  ariaLabel?: string;
}) {
  return (
    <MenuSelect
      items={items}
      value={value}
      onValueChange={(next) => next && onValueChange(next as T)}
    >
      <MenuSelectTrigger
        aria-label={ariaLabel}
        className={`justify-between data-[placeholder]:text-muted-foreground-3 ${className}`}
      >
        <MenuSelectValue />
      </MenuSelectTrigger>
      <MenuSelectContent>
        {(Object.entries(items) as Array<[T, string]>).map(([key, label]) => (
          <MenuSelectItem key={key} value={key}>
            {label}
          </MenuSelectItem>
        ))}
      </MenuSelectContent>
    </MenuSelect>
  );
}

export function GeneralPage() {
  const desktop = isDesktop();
  const [handoff, setHandoff] = useLocalPreference(
    desktopHandoffKey,
    "never",
    isDesktopHandoff,
  );
  const [input, setInput] = useLocalPreference(
    inputPrefsKey,
    defaultInputPrefs,
    isInputPrefs,
  );

  return (
    <SettingsPage title="General">
      <SettingsSection title="Interface">
        <Card rows>
          <SettingsRow
            id="sidebar"
            label="Sidebar"
            description="Choose which pages show on the sidebar's bottom bar"
          >
            <Menu>
              <MenuTrigger render={<Button variant="ghost" size="sm" />}>
                Pages
              </MenuTrigger>
              <MenuContent align="end" className="w-52">
                <SidebarNavEditor />
              </MenuContent>
            </Menu>
          </SettingsRow>
          {!desktop && (
            <SettingsRow
              id="desktop-handoff"
              label="Open links in desktop app"
              description="Open Capy links in the installed desktop app"
            >
              <Switch
                checked={handoff === "always"}
                onCheckedChange={(checked) =>
                  setHandoff(checked ? "always" : "never")
                }
                aria-label="Open Capy links in the desktop app"
              />
            </SettingsRow>
          )}
          <ScrollNewMessagesRow />
        </Card>
      </SettingsSection>
      {desktop && <DesktopAppSection />}
      <SettingsSection title="Input">
        <Card rows>
          <SettingsRow
            id="submit-on-enter"
            label="Enter behavior"
            description="What pressing Enter does mid-run; Newline keeps ⌘/Ctrl+Enter and ⌥/Alt+Enter sends"
          >
            <SelectControl<EnterAction>
              items={enterLabels}
              value={input.enter}
              onValueChange={(enter) => setInput({ ...input, enter })}
              className="w-32"
            />
          </SettingsRow>
          <SettingsRow
            id="submit-on-mod-enter"
            label="⌘/Ctrl+Enter behavior"
            description="What pressing ⌘/Ctrl+Enter does mid-run"
          >
            <SelectControl<Delivery>
              items={deliveryLabels}
              value={input.modEnter}
              onValueChange={(modEnter) => setInput({ ...input, modEnter })}
              className="w-32"
            />
          </SettingsRow>
          <SettingsRow
            id="submit-on-alt-enter"
            label="⌥/Alt+Enter behavior"
            description="What pressing ⌥/Alt+Enter does mid-run"
          >
            <SelectControl<Delivery>
              items={deliveryLabels}
              value={input.altEnter}
              onValueChange={(altEnter) => setInput({ ...input, altEnter })}
              className="w-32"
            />
          </SettingsRow>
          <MicrophoneRow />
        </Card>
      </SettingsSection>
    </SettingsPage>
  );
}

function ScrollNewMessagesRow() {
  const [enabled, setEnabled] = useLocalPreference(
    scrollNewMessagesKey,
    true,
    isBoolean,
  );
  return (
    <SettingsRow
      id="scroll-new-messages-to-top"
      label="Scroll new messages to top"
    >
      <Switch
        checked={enabled}
        onCheckedChange={setEnabled}
        aria-label="Scroll new messages to top"
      />
    </SettingsRow>
  );
}

function DesktopAppSection() {
  const [reuseTab, setReuseTab] = useLocalPreference(
    reuseThreadTabKey,
    true,
    isBoolean,
  );
  const [previewLinks, setPreviewLinks] = useLocalPreference(
    openPreviewLinksInKey,
    "pane",
    isPreviewLinkTarget,
  );
  const [links, setLinks] = useLocalPreference(
    openLinksInKey,
    "system",
    isLinkTarget,
  );
  const [engine, setEngine] = useLocalPreference(
    searchEngineKey,
    "google",
    isSearchEngine,
  );
  return (
    <SettingsSection title="Desktop app">
      <Card rows>
        <SettingsRow
          id="reuse-thread-tab"
          label="Switch to existing thread tab"
          description="Focus the thread's existing tab in this window when opening it again"
        >
          <Switch
            checked={reuseTab}
            onCheckedChange={setReuseTab}
            aria-label="Switch to existing thread tab"
          />
        </SettingsRow>
        <SettingsRow
          id="open-preview-links-in"
          label="Open preview links in"
          description="Where a preview link opens on a plain click; modifier clicks always use the system browser"
        >
          <SelectControl
            items={previewLinkTargets}
            value={previewLinks}
            onValueChange={setPreviewLinks}
            className="w-36"
          />
        </SettingsRow>
        <SettingsRow
          id="open-links-in"
          label="Open external links in"
          description="Capy links like pull requests stay in the app; outside a thread, the system browser opens"
        >
          <SelectControl
            items={linkTargets}
            value={links}
            onValueChange={setLinks}
            className="w-36"
          />
        </SettingsRow>
        <SettingsRow
          id="browser-search-engine"
          label="Search engine"
          description="The engine the browser omnibox searches with"
        >
          <SelectControl
            items={searchEngines}
            value={engine}
            onValueChange={setEngine}
            className="w-36"
          />
        </SettingsRow>
      </Card>
    </SettingsSection>
  );
}

const systemMicrophone = "system";

type Microphones = {
  supported: boolean;
  labelled: boolean;
  devices: Array<{ deviceId: string; label: string }>;
  allow: () => Promise<void>;
};

function useMicrophones(): Microphones {
  const supported =
    typeof navigator !== "undefined" &&
    navigator.mediaDevices?.enumerateDevices !== undefined;
  const [state, setState] = useState<{
    devices: Array<{ deviceId: string; label: string }>;
    labelled: boolean;
  }>({ devices: [], labelled: true });
  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    const load = () =>
      listMicrophones().then((next) => {
        if (!cancelled) setState(next);
      });
    load();
    navigator.mediaDevices.addEventListener?.("devicechange", load);
    return () => {
      cancelled = true;
      navigator.mediaDevices.removeEventListener?.("devicechange", load);
    };
  }, [supported]);
  return {
    supported,
    ...state,
    allow: async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      for (const track of stream.getTracks()) track.stop();
      setState(await listMicrophones());
    },
  };
}

const virtualMicrophones = new Set(["", "default", "communications"]);

export async function listMicrophones() {
  const inputs = (await navigator.mediaDevices.enumerateDevices()).filter(
    (d) => d.kind === "audioinput",
  );
  return {
    devices: inputs
      .filter((d) => !virtualMicrophones.has(d.deviceId))
      .map((d) => ({ deviceId: d.deviceId, label: d.label })),
    labelled: inputs.every((d) => d.label !== ""),
  };
}

const isMicrophoneChoice = (
  value: unknown,
): value is { deviceId: string; label: string } | null =>
  value === null ||
  (typeof value === "object" &&
    typeof (value as { deviceId?: unknown }).deviceId === "string" &&
    typeof (value as { label?: unknown }).label === "string");

function MicrophoneRow() {
  const microphones = useMicrophones();
  const [choice, setChoice] = useLocalPreference(
    "capy-web:voice-microphone",
    null,
    isMicrophoneChoice,
  );
  if (!microphones.supported) return null;
  const connected =
    choice === null ||
    microphones.devices.some((d) => d.deviceId === choice.deviceId);
  const items: Record<string, string> = {
    [systemMicrophone]: "System default",
    ...(choice === null || connected
      ? {}
      : { [choice.deviceId]: `${choice.label} (not connected)` }),
    ...Object.fromEntries(
      microphones.devices.map((d) => [d.deviceId, d.label]),
    ),
  };
  return (
    <SettingsRow
      id="voice-microphone"
      label="Microphone"
      description={
        microphones.labelled
          ? "Used for voice input on this device"
          : "Allow microphone access to choose an input"
      }
    >
      {microphones.labelled ? (
        <SelectControl
          items={items}
          value={choice?.deviceId ?? systemMicrophone}
          onValueChange={(id) => {
            if (id === systemMicrophone) return setChoice(null);
            const device = microphones.devices.find((d) => d.deviceId === id);
            if (device !== undefined) setChoice(device);
          }}
          className="w-56"
        />
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void microphones.allow().catch(() => undefined)}
        >
          Allow access
        </Button>
      )}
    </SettingsRow>
  );
}
