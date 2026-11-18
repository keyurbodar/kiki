import { useAtomSet } from "@effect/atom-react";
import { Exit } from "effect";
import { useState } from "react";
import { Badge } from "@/primitives/badge";
import { MenuSeparator } from "@/primitives/menu";
import { ResponsiveMenuItem } from "@/primitives/responsive-menu";
import { toast } from "@/primitives/toaster";
import {
  credentialIconProvider,
  dropServedAsOnUntick,
  openaiCompatible,
} from "../model-connect-sheet/presets.ts";
import { failureMessage, useRunner, useSaveModels } from "./actions.ts";
import { testCredentialAtom, updateCredentialAtom, useOrgId } from "./atoms.ts";
import { ConnectionShell, HealthBadge } from "./connection-shell.tsx";
import { ProviderIcon } from "./provider-icon.tsx";
import {
  applyTick,
  capyProvider,
  describeCapyCredits,
  describeCredential,
  describeEndpoint,
  lockedModels,
  neverUseCapyCredits,
} from "./routing.ts";
import { TickTree } from "./tick-tree.tsx";
import type { Credential, ModelsRouting, Seat } from "./types.ts";

export const orgOnlyReason =
  "Your organization serves this model only on its own keys";

export type CredentialAction = "edit" | "move" | "remove";

type TestResult = {
  readonly ok: boolean;
  readonly message?: string;
  readonly detail?: string;
  readonly model?: string;
  readonly roundTripMs?: number;
};

export type CredentialRowProps = {
  credential: Credential;
  routing: ModelsRouting;
  editable: boolean;
  draggable: boolean;
  reason?: string;
  expanded: boolean;
  onToggle: () => void;
  onAction: (action: CredentialAction) => void;
};

export function CredentialRow({
  credential,
  routing,
  editable,
  draggable,
  reason,
  expanded,
  onToggle,
  onAction,
}: CredentialRowProps) {
  const orgId = useOrgId();
  const testCredential = useAtomSet(testCredentialAtom, {
    mode: "promiseExit",
  });
  const updateCredential = useAtomSet(updateCredentialAtom, {
    mode: "promiseExit",
  });
  const { busy, save } = useSaveModels(credential.id);
  const runner = useRunner();
  const [testing, setTesting] = useState(false);
  const description = describeCredential(credential, Date.now());
  const endpoint = describeEndpoint(credential);
  const health = credential.health;
  const test = () => {
    if (orgId === undefined) return;
    setTesting(true);
    void testCredential({ params: { orgId, credentialId: credential.id } })
      .then((exit) => {
        if (Exit.isFailure(exit)) {
          toast.error(failureMessage(exit.cause, "Could not test the key"));
          return;
        }
        const result = exit.value as TestResult;
        if (result.ok)
          toast.success(result.message ?? `Served by ${credential.name}`, {
            description: [
              result.model,
              result.roundTripMs === undefined
                ? undefined
                : `${result.roundTripMs} ms`,
            ]
              .filter((part) => part !== undefined)
              .join(", "),
          });
        else
          toast.error(result.message ?? "The test request failed", {
            description: result.detail,
          });
      })
      .finally(() => setTesting(false));
  };
  const badge =
    health === undefined ? (
      credential.status === "active" ? null : (
        <Badge color="warning">Key error</Badge>
      )
    ) : health.state === "usage_exhausted" ? null : (
      <HealthBadge health={health} />
    );
  const power =
    credential.status === "active"
      ? {
          checked: credential.enabled,
          disabled: !editable || runner.busy || testing,
          title: reason,
          onChange: (enabled: boolean) => {
            if (orgId === undefined) return;
            runner.run(
              (reactivityKeys) =>
                updateCredential({
                  params: { orgId, credentialId: credential.id },
                  payload: { enabled },
                  reactivityKeys,
                }),
              enabled
                ? "Could not turn the key on"
                : "Could not turn the key off",
            );
          },
        }
      : undefined;
  return (
    <ConnectionShell
      sortId={credential.id}
      draggable={draggable}
      dragReason={reason}
      icon={
        <ProviderIcon
          provider={credentialIconProvider(credential)}
          className="size-4"
        />
      }
      label={credential.name}
      description={description}
      badge={badge}
      power={power}
      menuLabel={`Actions for ${credential.name}`}
      menuDisabled={!editable || testing}
      menuTitle={reason}
      menu={
        <>
          <ResponsiveMenuItem onClick={() => onAction("edit")}>
            Edit
          </ResponsiveMenuItem>
          <ResponsiveMenuItem onClick={test}>
            Test connection
          </ResponsiveMenuItem>
          {credential.ownerType === "user" && routing.admin ? (
            <ResponsiveMenuItem onClick={() => onAction("move")}>
              Move to organization
            </ResponsiveMenuItem>
          ) : null}
          <MenuSeparator />
          <ResponsiveMenuItem
            data-intent="danger"
            className="text-destructive"
            onClick={() => onAction("remove")}
          >
            Remove
          </ResponsiveMenuItem>
        </>
      }
      expanded={expanded}
      onToggle={onToggle}
    >
      {endpoint === "" ? null : (
        <span className="truncate text-xs font-normal text-muted-foreground-2">
          {endpoint}
        </span>
      )}
      {credential.ticks.length === 0 ? (
        <span className="text-xs font-normal text-muted-foreground-2">
          Serves nothing yet
        </span>
      ) : (
        <TickTree
          ticks={credential.ticks}
          connection={credential.name}
          editable={editable}
          reason={reason}
          busy={busy || testing}
          lockedModels={
            credential.ownerType === "user" ? lockedModels(routing) : undefined
          }
          lockReason={orgOnlyReason}
          onTick={(change) => {
            const next = applyTick(
              credential.models,
              credential.allModels,
              credential.ticks,
              change,
            );
            save(
              credential.provider === openaiCompatible
                ? dropServedAsOnUntick(next, credential.allModels, change)
                : next,
            );
          }}
        />
      )}
    </ConnectionShell>
  );
}

export type CapyCreditsRowProps = {
  credential: Credential;
  admin: boolean;
  reason?: string;
  expanded: boolean;
  onToggle: () => void;
};

export function CapyCreditsRow({
  credential,
  admin,
  reason,
  expanded,
  onToggle,
}: CapyCreditsRowProps) {
  const { busy, save } = useSaveModels(credential.id);
  const used = credential.ticks.some((lab) => lab.models.some((m) => m.ticked));
  return (
    <ConnectionShell
      draggable={false}
      icon={<ProviderIcon provider={capyProvider} className="size-4" />}
      label="Capy credits"
      description={describeCapyCredits(credential)}
      menuLabel="Actions for Capy credits"
      menuDisabled={!admin || busy}
      menuTitle={reason}
      menu={
        <>
          <ResponsiveMenuItem
            disabled={credential.models.length === 0}
            onClick={() => save([])}
          >
            Allow every model
          </ResponsiveMenuItem>
          <ResponsiveMenuItem
            disabled={!used}
            onClick={() => save(neverUseCapyCredits(credential.ticks))}
          >
            Never use Capy credits
          </ResponsiveMenuItem>
        </>
      }
      expanded={expanded}
      onToggle={onToggle}
    >
      <TickTree
        ticks={credential.ticks}
        editable={admin}
        reason={reason}
        busy={busy}
        onTick={(change) =>
          save(
            applyTick(
              credential.models,
              credential.allModels,
              credential.ticks,
              change,
            ),
          )
        }
      />
    </ConnectionShell>
  );
}

export type UnsupportedSeatRowProps = {
  seat: Seat;
  credentialId: string;
  draggable: boolean;
};

export function UnsupportedSeatRow({
  seat,
  credentialId,
  draggable,
}: UnsupportedSeatRowProps) {
  return (
    <ConnectionShell
      sortId={credentialId}
      draggable={draggable}
      icon={
        <ProviderIcon
          provider={seat.service}
          className="size-4 text-muted-foreground-2"
        />
      }
      label="Unsupported connection, update Capy to manage it"
      description={seat.accountLabel ?? seat.accountId ?? credentialId}
      expanded={false}
    />
  );
}
