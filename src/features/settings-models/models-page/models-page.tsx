import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Exit } from "effect";
import { useState } from "react";
import { ClaudeConnectDialog } from "@/components/claude-connect-dialog";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import { Card } from "@/primitives/card";
import { toast } from "@/primitives/toaster";
import { AddConnectionSheet } from "../add-connection-sheet";
import { ModelDefaultsSection } from "../model-defaults/model-defaults-section";
import {
  CapyCreditsRow,
  ConnectionList,
  ConnectionsHeader,
  CredentialRow,
  catalogRows,
  connectionsCount,
  decodeCompactAt,
  decodeSettings,
  disconnectSeatAtom,
  isCapyCredits,
  MemberRows,
  ModelsTable,
  modelsSettingsAtom,
  myCompactAtAtom,
  myConnections,
  organizationConnections,
  orgCompactAtAtom,
  RunOutRows,
  refreshClaudeSeatAtom,
  removeCompactAtAtom,
  removeMyCompactAtAtom,
  reorderConnectionsAtom,
  routingKeys,
  SeatRotationRow,
  SeatRow,
  updateCredentialAtom,
  upsertCompactAtAtom,
  upsertMyCompactAtAtom,
  useOrgId,
} from "../model-routing";
import type {
  CatalogEntry,
  CompactAtEntry,
  Credential,
} from "../model-routing/types";
import { moveToOrganizationAtom } from "./atoms";
import { CompactAtDialog } from "./compact-at-dialog";
import {
  MoveToOrganizationDialog,
  RenameSeatDialog,
} from "./connection-dialogs";
import {
  ConnectionsCard,
  cardChrome,
  LoadingConnections,
  useRoutingData,
} from "./connections";

type RenameRequest = { service: string; credentialId: string; label: string };
type CompactAtRequest = {
  scope: "user" | "org";
  entry: CatalogEntry;
  value: number | undefined;
};

const failed = (exit: Exit.Exit<unknown, unknown>) => Exit.isFailure(exit);

export function ModelsPage() {
  const orgId = useOrgId();
  const orgKey = orgId ?? "";
  const { admin, routing, catalog } = useRoutingData();
  const settingsResult = useAtomValue(modelsSettingsAtom(orgKey));
  const orgCompactAtResult = useAtomValue(orgCompactAtAtom(orgKey));
  const myCompactAtResult = useAtomValue(myCompactAtAtom(orgKey));
  const reorder = useAtomSet(reorderConnectionsAtom, { mode: "promiseExit" });
  const disconnect = useAtomSet(disconnectSeatAtom, { mode: "promiseExit" });
  const refreshClaudeSeat = useAtomSet(refreshClaudeSeatAtom, {
    mode: "promiseExit",
  });
  const rename = useAtomSet(updateCredentialAtom, { mode: "promiseExit" });
  const move = useAtomSet(moveToOrganizationAtom, { mode: "promiseExit" });
  const upsertOrg = useAtomSet(upsertCompactAtAtom, { mode: "promiseExit" });
  const removeOrg = useAtomSet(removeCompactAtAtom, { mode: "promiseExit" });
  const upsertMine = useAtomSet(upsertMyCompactAtAtom, { mode: "promiseExit" });
  const removeMine = useAtomSet(removeMyCompactAtAtom, { mode: "promiseExit" });

  const [renameRequest, setRenameRequest] = useState<RenameRequest | null>(
    null,
  );
  const [moveRequest, setMoveRequest] = useState<Credential | null>(null);
  // A seat reconnects by pasting a fresh `claude setup-token` into the same
  // dialog that connected it; the credential id makes it a re-link, not a new
  // connection.
  const [reconnectRequest, setReconnectRequest] = useState<{
    credentialId: string;
    label: string;
  } | null>(null);
  // The rows carry a chevron and an expanded body; the state behind them was
  // never added, so every toggle was a no-op.
  const [openRows, setOpenRows] = useState<ReadonlyArray<string>>([]);
  const isOpen = (id: string) => openRows.includes(id);
  const toggleRow = (id: string) =>
    setOpenRows((rows) =>
      rows.includes(id) ? rows.filter((row) => row !== id) : [...rows, id],
    );
  const [compactAtRequest, setCompactAtRequest] =
    useState<CompactAtRequest | null>(null);

  const settings = decodeSettings(
    settingsResult._tag === "Success" ? settingsResult.value : undefined,
  );
  const orgCompactAt: ReadonlyArray<CompactAtEntry> = decodeCompactAt(
    orgCompactAtResult._tag === "Success"
      ? orgCompactAtResult.value
      : undefined,
  );
  const myCompactAt: ReadonlyArray<CompactAtEntry> = decodeCompactAt(
    myCompactAtResult._tag === "Success" ? myCompactAtResult.value : undefined,
  );
  const orgCompactAtOf = (entry: CatalogEntry) =>
    orgCompactAt.find((row) => row.model === entry.id)?.compactAt;
  const myCompactAtOf = (entry: CatalogEntry) =>
    myCompactAt.find((row) => row.model === entry.id)?.compactAt;

  const mine = routing === undefined ? undefined : myConnections(routing);
  const orgConnections =
    routing === undefined ? [] : organizationConnections(routing);
  const credits = routing?.credentials.find((row) => isCapyCredits(row));
  const rows = routing === undefined ? [] : catalogRows(routing, catalog, []);
  const fable = mine?.some((entry) => entry.seat?.plan === "fable") === true;

  const refreshSeat = (credentialId: string) => {
    void refreshClaudeSeat({
      params: { credentialId },
      reactivityKeys: orgId === undefined ? undefined : routingKeys(orgId),
    }).then((exit) => {
      if (failed(exit)) toast.error("Could not refresh the subscription");
      else toast.success("Subscription refreshed");
    });
  };

  const saveCompactAt = async (
    request: CompactAtRequest,
    compactAt: number | null,
  ) => {
    if (orgId === undefined) return;
    const keys = routingKeys(orgId);
    const params = { orgId };
    if (request.scope === "user") {
      const exit =
        compactAt === null
          ? await removeMine({
              params,
              query: { model: request.entry.id },
              reactivityKeys: keys,
            })
          : await upsertMine({
              params,
              payload: { model: request.entry.id, compactAt },
              reactivityKeys: keys,
            });
      if (failed(exit)) throw new Error("compact-at");
      return;
    }
    const exit =
      compactAt === null
        ? await removeOrg({
            params,
            query: { model: request.entry.id },
            reactivityKeys: keys,
          })
        : await upsertOrg({
            params,
            payload: { model: request.entry.id, compactAt },
            reactivityKeys: keys,
          });
    if (failed(exit)) throw new Error("compact-at");
  };

  return (
    <SettingsPage
      title="Models"
      description="For each model, a thread runs on the first subscription or key below that serves it"
    >
      <ModelDefaultsSection />
      <SettingsSection
        id="my-connections"
        title="Your connections"
        description="Threads you own run on these first, in this order"
      >
        <ConnectionsCard
          label={
            mine === undefined ? "Connections" : connectionsCount(mine.length)
          }
          action={
            routing === undefined ? undefined : (
              <AddConnectionSheet
                scope="user"
                connectedSeats={[]}
                credentials={routing.credentials}
                catalog={catalog}
                onSeatConnected={() => undefined}
              />
            )
          }
        >
          {mine === undefined ? (
            <LoadingConnections label="Loading connections" />
          ) : mine.length === 0 ? null : (
            <>
              <ConnectionsHeader fable={fable} />
              <ConnectionList
                ids={mine.map((entry) => entry.id)}
                editable
                onReorder={(next) => {
                  if (orgId === undefined || routing === undefined) return;
                  void reorder({
                    params: { orgId },
                    payload: { order: next },
                    reactivityKeys: routingKeys(orgId),
                  }).then((exit) => {
                    if (failed(exit)) toast.error("Could not save the order");
                  });
                }}
              >
                {mine.map((entry) =>
                  entry.seat === undefined ? (
                    <CredentialRow
                      key={entry.id}
                      credential={entry.credential as Credential}
                      routing={routing as NonNullable<typeof routing>}
                      editable
                      draggable
                      expanded={isOpen(entry.id)}
                      onToggle={() => toggleRow(entry.id)}
                      onAction={(action) => {
                        if (action === "move" && entry.credential !== undefined)
                          setMoveRequest(entry.credential);
                      }}
                    />
                  ) : (
                    <SeatRow
                      key={entry.id}
                      seat={entry.seat}
                      credentialId={entry.id}
                      routing={routing as NonNullable<typeof routing>}
                      fableColumn={fable}
                      draggable
                      expanded={isOpen(entry.id)}
                      onToggle={() => toggleRow(entry.id)}
                      onRefresh={() => refreshSeat(entry.id)}
                      onRename={() =>
                        setRenameRequest({
                          service: entry.seat?.service ?? "claude",
                          credentialId: entry.id,
                          label: entry.seat?.accountLabel ?? "",
                        })
                      }
                      onReconnect={
                        entry.seat?.service === "claude"
                          ? () =>
                              setReconnectRequest({
                                credentialId: entry.id,
                                label: entry.seat?.accountLabel ?? "",
                              })
                          : undefined
                      }
                      onDisconnect={() => {
                        if (orgId === undefined) return;
                        void disconnect({
                          params: { service: entry.seat?.service ?? "claude" },
                          query: { credentialId: entry.id },
                          reactivityKeys: routingKeys(orgId),
                        }).then((exit) => {
                          if (failed(exit))
                            toast.error(
                              "Could not disconnect the subscription",
                            );
                        });
                      }}
                    />
                  ),
                )}
              </ConnectionList>
              <div className="border-t-hairline border-border-1">
                <SeatRotationRow />
              </div>
            </>
          )}
        </ConnectionsCard>
      </SettingsSection>
      <SettingsSection
        id="api-keys"
        title="Organization connections"
        description={
          admin
            ? "Every member's threads use these after their own, in this order"
            : "Every member's threads use these after their own, set by admins"
        }
      >
        <ConnectionsCard
          label={connectionsCount(orgConnections.length)}
          action={
            routing === undefined ? undefined : (
              <AddConnectionSheet
                scope="org"
                connectedSeats={[]}
                credentials={routing.credentials}
                catalog={catalog}
                disabled={!admin}
                onSeatConnected={() => undefined}
              />
            )
          }
        >
          {routing === undefined ? (
            <LoadingConnections label="Loading connections" />
          ) : (
            <ConnectionList
              ids={orgConnections.map((credential) => credential.id)}
              editable={admin}
              onReorder={(next) => {
                if (orgId === undefined) return;
                void reorder({
                  params: { orgId },
                  payload: { order: next },
                  reactivityKeys: routingKeys(orgId),
                }).then((exit) => {
                  if (failed(exit)) toast.error("Could not save the order");
                });
              }}
            >
              {orgConnections.map((credential) => (
                <CredentialRow
                  key={credential.id}
                  credential={credential}
                  routing={routing}
                  editable={admin}
                  draggable={admin}
                  expanded={isOpen(credential.id)}
                  onToggle={() => toggleRow(credential.id)}
                  onAction={(action) => {
                    if (action === "move") setMoveRequest(credential);
                  }}
                />
              ))}
              {credits === undefined ? null : (
                <CapyCreditsRow
                  credential={credits}
                  admin={admin}
                  expanded={isOpen(credits.id)}
                  onToggle={() => toggleRow(credits.id)}
                />
              )}
            </ConnectionList>
          )}
        </ConnectionsCard>
      </SettingsSection>
      {admin ? (
        <SettingsSection
          id="members"
          title="Members"
          description="What every member can do with their own connections"
        >
          <Card rows className={`${cardChrome}`}>
            <MemberRows settings={settings} />
          </Card>
        </SettingsSection>
      ) : null}
      <SettingsSection
        id="credits-fallback"
        title="When a subscription or key runs out"
        description="What a thread does when the subscription or key serving its model is out of usage"
      >
        <Card rows className={`${cardChrome}`}>
          <RunOutRows settings={settings} admin={admin} />
        </Card>
      </SettingsSection>
      <SettingsSection
        id="catalog"
        title="Models"
        description={
          admin
            ? "Turning a model off turns it off for every member, Served by shows your own threads"
            : "Admins turn models off for every member, Served by shows your own threads"
        }
      >
        <ModelsTable
          rows={rows}
          credentials={routing?.credentials ?? []}
          admin={admin}
          compactAtOf={orgCompactAtOf}
          myCompactAtOf={myCompactAtOf}
          onCompactAt={(entry, scope) =>
            setCompactAtRequest({
              scope,
              entry,
              value:
                scope === "user" ? myCompactAtOf(entry) : orgCompactAtOf(entry),
            })
          }
        />
      </SettingsSection>
      {compactAtRequest === null ? null : (
        <CompactAtDialog
          entry={{
            id: compactAtRequest.entry.id,
            name: compactAtRequest.entry.name,
            provider: compactAtRequest.entry.provider,
            efforts: compactAtRequest.entry.efforts,
            context: compactAtRequest.entry.limits.context,
          }}
          scope={compactAtRequest.scope}
          value={compactAtRequest.value}
          onClose={() => setCompactAtRequest(null)}
          onSave={(compactAt) => saveCompactAt(compactAtRequest, compactAt)}
        />
      )}
      {renameRequest === null ? null : (
        <RenameSeatDialog
          service={renameRequest.service}
          label={renameRequest.label}
          onClose={() => setRenameRequest(null)}
          onRename={async (name) => {
            if (orgId === undefined) return;
            const exit = await rename({
              params: { orgId, credentialId: renameRequest.credentialId },
              payload: { name },
              reactivityKeys: routingKeys(orgId),
            });
            if (failed(exit)) throw new Error("rename");
          }}
        />
      )}
      {reconnectRequest === null ? null : (
        <ClaudeConnectDialog
          reconnect={reconnectRequest}
          onClose={() => setReconnectRequest(null)}
          onConnected={() => {
            setReconnectRequest(null);
            toast.success("Subscription reconnected");
          }}
        />
      )}
      {moveRequest === null ? null : (
        <MoveToOrganizationDialog
          name={moveRequest.name}
          onClose={() => setMoveRequest(null)}
          onMove={async () => {
            if (orgId === undefined) return;
            const exit = await move({
              params: { orgId, credentialId: moveRequest.id },
              reactivityKeys: routingKeys(orgId),
            });
            if (failed(exit)) throw new Error("move");
          }}
        />
      )}
    </SettingsPage>
  );
}
