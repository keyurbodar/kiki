import { useAtom, useAtomSet, useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import { currentUserAtom } from "@/data/atoms/session";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/primitives/alert";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Icon } from "@/primitives/icon";
import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectItem,
  MenuSelectTrigger,
  MenuSelectValue,
} from "@/primitives/menu-select";
import { SettingsRow, SettingsRowLink } from "@/primitives/settings-row";
import { Switch } from "@/primitives/switch";
import { toast } from "@/primitives/toaster";
import { NotificationDevicesSection } from "../notification-devices/notification-devices";
import {
  BellOffIcon,
  EditBoxIcon,
  MusicNoteIcon,
  TrashIcon,
} from "../notification-filter-rows/icons";
import {
  completionKindLabels,
  completionKinds,
  deviceCompletionKinds,
  enabledKindsSummary,
} from "../notification-filter-rows/notification-kinds";
import { SlackLogo } from "../notifications-slack-page/slack-logo";
import {
  activeSlackLinksAtom,
  currentUserKeys,
  updatePreferencesAtom,
} from "./atoms";
import {
  browserNotificationPermission,
  type CompletionSound,
  completionSoundLabels,
  completionSounds,
  customSoundMaxBytes,
  customSoundName,
  type DesktopNotificationAccess,
  desktopNotifications,
  isCompletionSound,
  isDesktopApp,
  isKindEnabled,
  notificationPrefsAtom,
  playCompletionSound,
  readCustomSound,
  requestBrowserNotificationPermission,
  saveCustomSound,
  showSystemNotification,
} from "./notification-prefs";
import {
  type SubscribeOnMessageMode,
  slackNotificationPreferences,
  subscribeOnMessageLabels,
  subscribeOnMessageMode,
  subscribeOnMessageModes,
} from "./user-preferences";

const openSystemSettings = () => desktopNotifications()?.openSettings?.();

function SubscribeOnMessageRow() {
  const user = Option.getOrUndefined(
    AsyncResult.value(useAtomValue(currentUserAtom)),
  );
  const update = useAtomSet(updatePreferencesAtom, { mode: "promise" });
  const [saving, setSaving] = useState(false);
  const mode = subscribeOnMessageMode(user?.preferences);

  const change = (next: SubscribeOnMessageMode) => {
    if (next === mode) return;
    setSaving(true);
    update({
      payload: { subscribeOnMessage: next === "ask" ? null : next },
      reactivityKeys: currentUserKeys,
    })
      .catch(() => toast.error("Could not update the subscribe setting"))
      .finally(() => setSaving(false));
  };

  return (
    <SettingsRow
      id="subscribe-on-message"
      label="Subscribe when you write"
      description="When you write in a thread or Captain you are not subscribed to"
    >
      <MenuSelect
        items={subscribeOnMessageLabels}
        value={mode}
        onValueChange={(next) => {
          if (next) change(next as SubscribeOnMessageMode);
        }}
      >
        <MenuSelectTrigger
          className="w-40"
          disabled={user === undefined || saving}
          aria-label="Subscribe when you write"
        >
          <MenuSelectValue />
        </MenuSelectTrigger>
        <MenuSelectContent>
          {subscribeOnMessageModes.map((value) => (
            <MenuSelectItem key={value} value={value}>
              {subscribeOnMessageLabels[value]}
            </MenuSelectItem>
          ))}
        </MenuSelectContent>
      </MenuSelect>
    </SettingsRow>
  );
}

export function SettingsNotificationsPage() {
  const [prefs, setPrefs] = useAtom(notificationPrefsAtom);
  const desktop = isDesktopApp();
  const navigate = useNavigate();
  const [permission, setPermission] = useState(browserNotificationPermission);
  const [access, setAccess] = useState<DesktopNotificationAccess>("unknown");
  const [soundName, setSoundName] = useState<string | null>(null);
  const [soundBusy, setSoundBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const user = Option.getOrUndefined(
    AsyncResult.value(useAtomValue(currentUserAtom)),
  );
  const slackLinks = useAtomValue(activeSlackLinksAtom);

  useEffect(() => {
    const read = desktopNotifications()?.access;
    if (read === undefined) return;
    let cancelled = false;
    let latest: object | undefined;
    const refresh = () => {
      const token = {};
      latest = token;
      read().then((next) => {
        if (!cancelled && latest === token) setAccess(next);
      });
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onFocus = () => {
      refresh();
      clearTimeout(timer);
      timer = setTimeout(refresh, 1500);
    };
    refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    readCustomSound()
      .then((sound) => {
        if (!cancelled)
          setSoundName(sound === null ? null : customSoundName(sound));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const desktopDenied = desktop && access === "denied";
  const desktopAlertsOff = desktop && access === "alerts-off";
  const blocked = (!desktop && permission === "denied") || desktopDenied;
  const systemOn =
    prefs.desktop && (desktop ? !desktopDenied : permission === "granted");
  const systemDescription = desktop
    ? "Show a system notification when a thread finishes or needs you"
    : permission === "unsupported"
      ? "This browser has no system notifications"
      : blocked
        ? "Blocked by the browser, allow notifications for this site to turn it on"
        : "Show a system notification when a thread finishes or needs you";

  const ensureDesktopAccess = async () => {
    const request = desktopNotifications()?.requestAccess;
    if (access !== "not-determined" || request === undefined) return access;
    const next = await request();
    setAccess(next);
    return next;
  };

  const toggleSystem = (on: boolean) => {
    if (!on || desktop) {
      setPrefs({ ...prefs, desktop: on });
      if (on) void ensureDesktopAccess();
      return;
    }
    void requestBrowserNotificationPermission().then((next) => {
      setPermission(next);
      setPrefs({ ...prefs, desktop: next === "granted" });
    });
  };

  const changeSound = (sound: CompletionSound) => {
    setPrefs({ ...prefs, sound });
    void playCompletionSound(sound);
  };

  const sendTest = async () => {
    void playCompletionSound(prefs.sound);
    const state = systemOn ? await ensureDesktopAccess() : access;
    if (desktop && state === "denied") {
      toast.info("Notifications for Capy are off in System Settings", {
        action: { label: "Open System Settings", onClick: openSystemSettings },
      });
      return;
    }
    const shown =
      systemOn &&
      (await showSystemNotification(
        {
          title: "Ready for review: Test notification",
          body: "A finished thread rings like this, click to open settings",
          href: "/settings/notifications",
          tag: "capy-test-notification",
        },
        (href) => void navigate({ href }),
      ));
    if (!shown) toast.info("Turn on system notifications to see one");
  };

  const uploadSound = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file === undefined) return;
    if (file.size > customSoundMaxBytes) {
      toast.error("Sound files are capped at 2 MB");
      return;
    }
    setSoundBusy(true);
    saveCustomSound(file)
      .then(() => {
        setSoundName(file.name);
        setPrefs({ ...prefs, sound: "custom" });
        void playCompletionSound("custom");
      })
      .catch(() =>
        toast.error("Could not save the sound, browser storage is full"),
      )
      .finally(() => setSoundBusy(false));
  };

  const removeSound = () => {
    setSoundBusy(true);
    saveCustomSound(null)
      .then(() => {
        setSoundName(null);
        if (prefs.sound === "custom") setPrefs({ ...prefs, sound: "none" });
      })
      .catch(() => toast.error("Could not remove the sound"))
      .finally(() => setSoundBusy(false));
  };

  const soundOptions = completionSounds.filter(
    (sound) => sound !== "custom" || soundName !== null,
  );
  const deviceKinds = deviceCompletionKinds
    .filter((kind) => isKindEnabled(prefs, kind))
    .map((kind) => completionKindLabels[kind]);
  const slack = slackNotificationPreferences(user?.preferences);
  const slackKinds =
    slack?.enabled === true
      ? completionKinds
          .filter((kind) => slack.kinds?.[kind] !== false)
          .map((kind) => completionKindLabels[kind])
      : [];

  return (
    <SettingsPage
      title="Notifications"
      description="How Capy reaches you when a thread comes back"
    >
      <SettingsSection>
        <Card rows>
          <SettingsRowLink
            id="channel-email"
            to="/settings/notifications/email"
            icon={<Icon name="mailbox" />}
            label="Email"
            description="Marketing, account, and billing email"
          />
        </Card>
      </SettingsSection>
      <SettingsSection>
        {(desktopDenied || desktopAlertsOff) && (
          <Alert color="warning">
            <BellOffIcon />
            <AlertTitle>
              {desktopDenied
                ? "macOS is blocking notifications from Capy"
                : "Banners for Capy are off in macOS"}
            </AlertTitle>
            <AlertDescription>
              {desktopDenied
                ? "Turn on Allow notifications for Capy in System Settings"
                : "Turn on Desktop banners for Capy in System Settings"}
            </AlertDescription>
            <AlertAction>
              <Button size="sm" onClick={openSystemSettings}>
                Open System Settings
              </Button>
            </AlertAction>
          </Alert>
        )}
        <Card rows>
          <SettingsRow
            id="system-notifications"
            label="System notifications"
            description={systemDescription}
          >
            <Switch
              checked={systemOn}
              disabled={blocked || (!desktop && permission === "unsupported")}
              onCheckedChange={toggleSystem}
              aria-label="System notifications"
            />
          </SettingsRow>
          <SettingsRow
            id="completion-sound"
            label="Completion sound"
            description="Plays when a thread finishes or needs you"
          >
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Preview completion sound"
                disabled={prefs.sound === "none"}
                onClick={() => void playCompletionSound(prefs.sound)}
              >
                <Icon name="play" />
              </Button>
              <MenuSelect
                items={completionSoundLabels}
                value={prefs.sound}
                onValueChange={(next) => {
                  if (typeof next === "string" && isCompletionSound(next))
                    changeSound(next);
                }}
              >
                <MenuSelectTrigger className="w-32">
                  <MenuSelectValue />
                </MenuSelectTrigger>
                <MenuSelectContent>
                  {soundOptions.map((sound) => (
                    <MenuSelectItem key={sound} value={sound}>
                      {completionSoundLabels[sound]}
                    </MenuSelectItem>
                  ))}
                </MenuSelectContent>
              </MenuSelect>
            </div>
          </SettingsRow>
          <SettingsRow
            id="custom-sound"
            label="Custom sound"
            description={soundName ?? "Your own clip, up to 2 MB"}
          >
            <input
              ref={fileInput}
              type="file"
              accept="audio/*"
              disabled={soundBusy}
              className="sr-only"
              aria-label="Custom sound file"
              onChange={uploadSound}
            />
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-md border-hairline border-border-2 bg-muted text-muted-foreground-2">
                <MusicNoteIcon />
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={
                  soundName === null
                    ? "Upload custom sound"
                    : "Replace custom sound"
                }
                disabled={soundBusy}
                onClick={() => fileInput.current?.click()}
              >
                <EditBoxIcon />
              </Button>
              {soundName !== null && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove custom sound"
                  disabled={soundBusy}
                  onClick={removeSound}
                >
                  <TrashIcon />
                </Button>
              )}
            </div>
          </SettingsRow>
          <SettingsRow
            id="test-notification"
            label="Test notification"
            description="Ring this device the way a finished thread would"
          >
            <Button variant="ghost" size="sm" onClick={() => void sendTest()}>
              Send test notification
            </Button>
          </SettingsRow>
        </Card>
      </SettingsSection>
      <SettingsSection
        title="Subscriptions"
        description="Subscribed threads and Captains stay in your sidebar and notify you"
      >
        <Card rows>
          <SubscribeOnMessageRow />
        </Card>
      </SettingsSection>
      {user !== undefined && <NotificationDevicesSection userId={user.id} />}
      <SettingsSection
        title="Push notifications"
        description="Choose which completions reach you on each channel"
      >
        <Card rows>
          <SettingsRowLink
            id="channel-device"
            to="/settings/notifications/device"
            icon={<Icon name="studio-display" />}
            label={desktop ? "Desktop app" : "This browser"}
            description={enabledKindsSummary(deviceKinds)}
          />
          <SettingsRowLink
            id="channel-slack"
            to="/settings/notifications/slack"
            icon={<SlackLogo />}
            label="Slack"
            description={
              slackLinks.length === 0 && user !== undefined
                ? "Link your Slack account to get direct messages"
                : enabledKindsSummary(slackKinds, completionKinds)
            }
          />
        </Card>
      </SettingsSection>
    </SettingsPage>
  );
}
