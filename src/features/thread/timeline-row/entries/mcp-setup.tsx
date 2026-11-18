import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import {
  completeMcpSetupAtom,
  createMcpSetupAtom,
} from "@/data/atoms/mcp-setup.ts";
import { organizationsAtom } from "@/data/atoms/session.ts";
import { McpSetupCard, McpSetupLine } from "@/features/thread/mcp-setup-card";
import { proposalName } from "@/features/thread/mcp-setup-card/helpers";
import { decodeProposal } from "@/features/thread/mcp-setup-card/proposal";
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

function McpSetupRowView({ row }: { row: TimelineRowOf<"mcp-setup"> }) {
  const proposal = decodeProposal(row.proposal);
  const org = useOrg();
  const create = useAtomSet(createMcpSetupAtom, { mode: "promise" });
  const complete = useAtomSet(completeMcpSetupAtom, { mode: "promise" });
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"pending" | "declined" | "added">(
    "pending",
  );
  if (proposal === undefined) return null;
  const availability = {
    owner: proposal.kind === "add" ? proposal.owner : undefined,
    orgName: org?.name ?? "your workspace",
    where: "this thread",
  };
  return (
    <>
      <McpSetupLine
        proposal={proposal}
        state={state}
        actionable={org !== undefined && state === "pending" && !open}
        onActivate={() => setOpen(true)}
      />
      {open && org !== undefined && (
        <McpSetupCard
          proposal={row.proposal}
          availableTo={availability}
          onSubmit={async ({ values, owner }) => {
            const setup = (await create({
              params: { orgId: org.id },
              payload: {
                name: proposalName(proposal),
                owner: owner ?? undefined,
                secrets: values,
                proposal: row.proposal,
              },
            })) as { id?: string } | undefined;
            if (setup?.id !== undefined)
              await complete({
                params: { orgId: org.id, setupId: setup.id },
                payload: {},
              });
            setState("added");
            setOpen(false);
          }}
          onDecline={() => {
            setState("declined");
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

export const entry = defineTimelineRow({
  type: "mcp-setup",
  component: McpSetupRowView,
});
