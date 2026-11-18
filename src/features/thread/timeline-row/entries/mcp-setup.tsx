import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { useParams } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import {
  completeMcpSetupAtom,
  createMcpSetupAtom,
  mcpSetupsAtom,
} from "@/data/atoms/mcp-setup.ts";
import { organizationsAtom } from "@/data/atoms/session.ts";
import { McpSetupCard, McpSetupLine } from "@/features/thread/mcp-setup-card";
import { listingState } from "@/features/thread/mcp-setup-card/helpers";
import {
  decodeProposal,
  type McpSetupProposal,
} from "@/features/thread/mcp-setup-card/proposal";
import { defineTimelineRow, type TimelineRowOf } from "../registry";

/**
 * The availability a proposal is offered with: the owner the proposal asked
 * for, the org the person is in, and this thread. No endpoint reports a server
 * catalogue for a proposal, so nothing here claims one.
 */
function useOrg() {
  const organizations = useAtomValue(organizationsAtom);
  return AsyncResult.isSuccess(organizations)
    ? organizations.value[0]
    : undefined;
}

type BoundProps = {
  row: TimelineRowOf<"mcp-setup">;
  proposal: McpSetupProposal;
  orgId: string;
  orgName: string;
  threadId: string;
};

/**
 * The row's answer lives on the server: the setup the thread already carries
 * for this tool call is what decides whether the proposal still waits on the
 * person, so a reload or a second tab reads the same outcome.
 */
function BoundMcpSetupRow({
  row,
  proposal,
  orgId,
  orgName,
  threadId,
}: BoundProps) {
  const setups = useAtomValue(mcpSetupsAtom(orgId, threadId));
  const refresh = useAtomRefresh(mcpSetupsAtom(orgId, threadId));
  const create = useAtomSet(createMcpSetupAtom, { mode: "promise" });
  const complete = useAtomSet(completeMcpSetupAtom, { mode: "promise" });
  const [open, setOpen] = useState(false);
  const [answered, setAnswered] = useState<"declined" | "added">();
  const setup = AsyncResult.isSuccess(setups)
    ? setups.value.find(
        (candidate) => String(candidate.toolCallId) === String(row.toolCallId),
      )
    : undefined;
  const state =
    answered ??
    (setup === undefined
      ? "pending"
      : listingState({ current: setup.current, expired: setup.expired }));
  const availability = {
    owner: proposal.kind === "add" ? proposal.owner : undefined,
    orgName,
    where: "this thread",
  };
  const openSetup = async () =>
    (await create({
      params: { orgId },
      payload: {
        jamId: threadId,
        assistantEventId: row.assistantEventId,
        toolResultEventId: row.toolResultEventId,
        toolCallId: row.toolCallId,
      },
    })) as { id?: string } | undefined;
  return (
    <>
      <McpSetupLine
        proposal={proposal}
        state={state}
        actionable={state === "pending" && !open}
        onActivate={() => setOpen(true)}
      />
      {open && state === "pending" && (
        <McpSetupCard
          proposal={row.proposal}
          availableTo={availability}
          onSubmit={async ({ values, owner }) => {
            const created = await openSetup();
            if (created?.id === undefined) return;
            await complete({
              params: { orgId, setupId: created.id },
              payload: {
                decision: "approve",
                owner: owner === "personal" ? "user" : "organization",
                env: values.environment,
                headers: values.credentialHeaders,
                requestHeaders: values.requestHeaders,
                ...(values.clientSecret === ""
                  ? {}
                  : { clientSecret: values.clientSecret }),
              },
            });
            setAnswered("added");
            setOpen(false);
            refresh();
          }}
          onDecline={async () => {
            const created = await openSetup();
            if (created?.id !== undefined)
              await complete({
                params: { orgId, setupId: created.id },
                payload: { decision: "decline" },
              });
            setAnswered("declined");
            setOpen(false);
            refresh();
          }}
        />
      )}
    </>
  );
}

function McpSetupRowView({ row }: { row: TimelineRowOf<"mcp-setup"> }) {
  const proposal = decodeProposal(row.proposal);
  const org = useOrg();
  const { threadId } = useParams({ strict: false }) as { threadId?: string };
  if (proposal === undefined) return null;
  if (org === undefined || threadId === undefined)
    return (
      <McpSetupLine proposal={proposal} state="pending" actionable={false} />
    );
  return (
    <BoundMcpSetupRow
      row={row}
      proposal={proposal}
      orgId={org.id}
      orgName={org.name}
      threadId={threadId}
    />
  );
}

export const entry = defineTimelineRow({
  type: "mcp-setup",
  component: McpSetupRowView,
});
