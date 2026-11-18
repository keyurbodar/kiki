import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import { reactivityKeys as sessionKeys } from "@/data/atoms/conventions";
import { currentUserAtom } from "@/data/atoms/session";
import { ApiClient } from "@/data/client/ApiClient";
import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectItem,
  MenuSelectTrigger,
  MenuSelectValue,
} from "@/primitives/menu-select";
import { SettingsRow } from "@/primitives/settings-row";
import { Switch } from "@/primitives/switch";
import { toast } from "@/primitives/toaster";
import { toastFailure } from "./actions.ts";
import {
  setFallbackAtom,
  setMemberCredentialsAtom,
  settingsKeys,
  useOrgId,
} from "./atoms.ts";
import {
  fallbackDescriptions,
  fallbackLabels,
  fallbackValues,
} from "./routing.ts";
import type { CreditsFallback, ModelsSettings } from "./types.ts";

const updatePreferencesAtom = ApiClient.mutation("users", "updatePreferences");

type ModelPreferences = {
  readonly creditsFallback?: CreditsFallback;
  readonly seatRotation?: boolean;
};

const usePreferences = () => {
  const result = useAtomValue(currentUserAtom);
  return AsyncResult.isSuccess(result)
    ? (result.value.preferences as ModelPreferences)
    : undefined;
};

const usePreferenceWriter = () => {
  const update = useAtomSet(updatePreferencesAtom, { mode: "promise" });
  return (payload: ModelPreferences) =>
    update({ payload, reactivityKeys: [sessionKeys.currentUser] }).catch(() => {
      toast.error("Could not save the preference");
    });
};

export type FallbackSelectProps = {
  value: CreditsFallback;
  disabled?: boolean;
  title?: string;
  onChange: (value: CreditsFallback) => void;
};

export function FallbackSelect({
  value,
  disabled,
  title,
  onChange,
}: FallbackSelectProps) {
  return (
    <MenuSelect
      items={fallbackLabels}
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        if (next) onChange(next as CreditsFallback);
      }}
    >
      <MenuSelectTrigger title={title} className="w-44">
        <MenuSelectValue />
      </MenuSelectTrigger>
      <MenuSelectContent>
        {fallbackValues.map((option) => (
          <MenuSelectItem key={option} value={option}>
            {fallbackLabels[option]}
          </MenuSelectItem>
        ))}
      </MenuSelectContent>
    </MenuSelect>
  );
}

export type RunOutRowsProps = {
  settings: ModelsSettings | undefined;
  admin: boolean;
  reason?: string;
};

export function RunOutRows({ settings, admin, reason }: RunOutRowsProps) {
  const orgId = useOrgId();
  const preferences = usePreferences();
  const setFallback = useAtomSet(setFallbackAtom, { mode: "promiseExit" });
  const writePreferences = usePreferenceWriter();
  const [saving, setSaving] = useState<"org" | "mine" | null>(null);
  const org = settings?.creditsFallback ?? "own_then_ask";
  const membersChoose = settings?.membersOverrideFallback === true;
  const mine = preferences?.creditsFallback ?? org;
  const saveOrg = (creditsFallback: CreditsFallback) => {
    if (orgId === undefined) return;
    setSaving("org");
    void toastFailure(
      setFallback({
        params: { orgId },
        payload: { creditsFallback },
        reactivityKeys: settingsKeys(orgId),
      }),
      "Could not save the setting",
    ).finally(() => setSaving(null));
  };
  const saveMine = (creditsFallback: CreditsFallback) => {
    setSaving("mine");
    void writePreferences({ creditsFallback }).finally(() => setSaving(null));
  };
  return (
    <>
      <SettingsRow
        id="credits-fallback"
        label="Organization"
        description={
          membersChoose
            ? `${fallbackDescriptions[org]}, unless a member chose otherwise`
            : admin
              ? `${fallbackDescriptions[org]}, in every thread`
              : `Set by your organization: ${fallbackDescriptions[org].toLowerCase()}`
        }
      >
        <FallbackSelect
          value={org}
          disabled={!admin || settings === undefined || saving !== null}
          title={reason}
          onChange={saveOrg}
        />
      </SettingsRow>
      {membersChoose ? (
        <SettingsRow
          label="Threads you own"
          description={
            preferences?.creditsFallback === undefined
              ? "Same as your organization until you choose"
              : fallbackDescriptions[mine]
          }
        >
          <FallbackSelect
            value={mine}
            disabled={preferences === undefined || saving !== null}
            onChange={saveMine}
          />
        </SettingsRow>
      ) : null}
    </>
  );
}

export function SeatRotationRow() {
  const preferences = usePreferences();
  const writePreferences = usePreferenceWriter();
  const [saving, setSaving] = useState(false);
  return (
    <SettingsRow
      label="Spread usage across my subscriptions"
      description="Threads move between subscriptions that serve the same model, keeping each thread on one while its cache is warm"
    >
      <Switch
        checked={preferences?.seatRotation !== false}
        disabled={preferences === undefined || saving}
        aria-label="Spread usage across my subscriptions"
        onCheckedChange={(seatRotation) => {
          setSaving(true);
          void writePreferences({ seatRotation }).finally(() =>
            setSaving(false),
          );
        }}
      />
    </SettingsRow>
  );
}

export function MemberRows({
  settings,
}: {
  settings: ModelsSettings | undefined;
}) {
  const orgId = useOrgId();
  const setMembers = useAtomSet(setMemberCredentialsAtom, {
    mode: "promiseExit",
  });
  const setFallback = useAtomSet(setFallbackAtom, { mode: "promiseExit" });
  const [saving, setSaving] = useState(false);
  const allowed = settings?.allowMemberCredentials !== false;
  const membersChoose = settings?.membersOverrideFallback === true;
  const run = (pending: Parameters<typeof toastFailure>[0]) => {
    setSaving(true);
    void toastFailure(pending, "Could not save the setting").finally(() =>
      setSaving(false),
    );
  };
  const disabled = settings === undefined || saving;
  return (
    <>
      <SettingsRow
        label="Members can connect their own subscriptions and keys"
        description={
          allowed
            ? "Their own come first in threads they own, then the organization's"
            : "Every thread runs on the organization's connections"
        }
      >
        <Switch
          checked={allowed}
          disabled={disabled}
          aria-label="Members can connect their own subscriptions and keys"
          onCheckedChange={(next) => {
            if (orgId === undefined) return;
            run(
              setMembers({
                params: { orgId },
                payload: { allowed: next },
                reactivityKeys: settingsKeys(orgId),
              }),
            );
          }}
        />
      </SettingsRow>
      <SettingsRow
        label="Members can choose what happens when a subscription or key runs out"
        description={
          membersChoose
            ? "Each member sets this for threads they own"
            : "The organization's setting applies to every thread"
        }
      >
        <Switch
          checked={membersChoose}
          disabled={disabled}
          aria-label="Members can choose what happens when a subscription or key runs out"
          onCheckedChange={(next) => {
            if (orgId === undefined) return;
            run(
              setFallback({
                params: { orgId },
                payload: { membersOverrideFallback: next },
                reactivityKeys: settingsKeys(orgId),
              }),
            );
          }}
        />
      </SettingsRow>
    </>
  );
}
