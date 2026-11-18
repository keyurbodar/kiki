import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import { currentUserAtom } from "@/data/atoms/session";
import { ApiClient } from "@/data/client/ApiClient";
import { toast } from "@/primitives/toaster";
import {
  type AutomationRow,
  decodeAutomationPage,
  decodeMembers,
  emptyOptimistic,
  type OptimisticAutomations,
  withOptimisticRow,
} from "./automation";

const timeToLive = "5 minutes";

export const automationReactivityKeys = (orgId: string) => [
  `automation:${orgId}`,
  `automation_run:${orgId}`,
];

/** Query params for listPage, as Capy's automationListQuery builds them. */
export type AutomationListQuery = {
  readonly projectIds?: ReadonlyArray<string>;
  readonly projectIdsNot?: "1";
  readonly enabled?: "1" | "0";
  readonly createdFrom?: string;
  readonly createdTo?: string;
};

const compactQuery = (query: AutomationListQuery) => {
  const out: Record<string, string | Array<string>> = { limit: "100" };
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    out[key] = typeof value === "string" ? value : [...value];
  }
  return out;
};

/** One listPage query per org and serialized filter query. */
export const automationsPageAtom = Atom.family((key: string) => {
  const [orgId = "", query = "{}"] = key.split("\n");
  return ApiClient.query("automations", "listPage", {
    params: { orgId },
    query: compactQuery(JSON.parse(query) as AutomationListQuery),
    reactivityKeys: automationReactivityKeys(orgId),
    timeToLive,
  });
});

export const orgMembersAtom = Atom.family((orgId: string) =>
  ApiClient.query("members", "listMembers", {
    params: { orgId },
    query: {},
    reactivityKeys: [`members:${orgId}`],
    timeToLive,
  }),
);

export const enableAutomationAtom = ApiClient.mutation("automations", "enable");
export const disableAutomationAtom = ApiClient.mutation(
  "automations",
  "disable",
);
export const deleteAutomationAtom = ApiClient.mutation("automations", "delete");
export const restoreAutomationAtom = ApiClient.mutation(
  "automations",
  "restore",
);
export const triggerAutomationAtom = ApiClient.mutation(
  "automations",
  "trigger",
);

/** Local edits shared by the list, its menus and the bulk bar. */
export const optimisticAutomationsAtom = Atom.make<OptimisticAutomations>(
  emptyOptimistic,
).pipe(Atom.keepAlive);

export { useActiveOrgId } from "@/data/atoms/session";

const resultOf = <A, E>(result: AsyncResult.AsyncResult<A, E>) =>
  Option.getOrUndefined(AsyncResult.value(result));

export type Viewer = {
  readonly id: string | undefined;
  readonly name: string;
  readonly imageUrl: string | null;
};

export function useViewer(): Viewer {
  const user = resultOf(useAtomValue(currentUserAtom));
  const name = [user?.firstName, user?.lastName]
    .filter((part) => part !== null && part !== undefined && part !== "")
    .join(" ");
  return {
    id: user?.id,
    name: user === undefined ? "Me" : name || (user.email ?? user.id),
    imageUrl: user?.imageUrl ?? null,
  };
}

export type OrgMember = {
  readonly userId: string;
  readonly name: string | undefined;
  readonly imageUrl: string | null;
};

export function useOrgMembers(orgId: string | undefined): OrgMember[] {
  const result = useAtomValue(orgMembersAtom(orgId ?? ""));
  return orgId === undefined ? [] : decodeMembers(resultOf(result));
}

export type AutomationsPage = {
  readonly rows: ReadonlyArray<AutomationRow>;
  readonly waiting: boolean;
  readonly failed: boolean;
  readonly loaded: boolean;
  readonly retry: (() => void) | undefined;
};

/** Rows of the listPage query for a serialized filter query, with creator names resolved. */
export function useAutomationsPage(
  orgId: string | undefined,
  query: string,
  members: ReadonlyArray<OrgMember>,
): AutomationsPage {
  const atom = automationsPageAtom(`${orgId ?? ""}\n${query}`);
  const result = useAtomValue(atom);
  const refresh = useAtomRefresh(atom);
  const nameOf = (userId: string) =>
    members.find((member) => member.userId === userId)?.name;
  const value = orgId === undefined ? undefined : resultOf(result);
  const failed = orgId !== undefined && AsyncResult.isFailure(result);
  return {
    rows: value === undefined ? [] : decodeAutomationPage(value, nameOf).rows,
    waiting: result.waiting,
    failed,
    loaded: value !== undefined,
    retry: failed ? refresh : undefined,
  };
}

/** Enables or disables automations optimistically, with Capy's toasts and undo. */
export function useSetAutomationsEnabled(orgId: string | undefined) {
  const setOptimistic = useAtomSet(optimisticAutomationsAtom);
  const enable = useAtomSet(enableAutomationAtom, { mode: "promise" });
  const disable = useAtomSet(disableAutomationAtom, { mode: "promise" });
  const send = (row: AutomationRow, enabled: boolean) => {
    if (orgId === undefined) return;
    (enabled ? enable : disable)({
      params: { orgId, automationId: row.id },
      reactivityKeys: automationReactivityKeys(orgId),
    }).catch(() => {
      setOptimistic((state) => withOptimisticRow(state, row, row.updatedAt));
      toast.error(enabled ? "Could not enable" : "Could not disable", {
        description: row.name,
      });
    });
  };
  return (
    rows: ReadonlyArray<AutomationRow>,
    enabled: boolean,
    message: string,
    description: string,
  ) => {
    if (rows.length === 0) return;
    const now = new Date();
    setOptimistic((state) =>
      rows.reduce(
        (acc, row) =>
          withOptimisticRow(
            acc,
            { ...row, enabled, updatedAt: now },
            row.updatedAt,
          ),
        state,
      ),
    );
    for (const row of rows) send(row, enabled);
    toast.success(message, {
      description,
      action: {
        label: "Undo",
        onClick: () => {
          setOptimistic((state) =>
            rows.reduce(
              (acc, row) => withOptimisticRow(acc, row, row.updatedAt),
              state,
            ),
          );
          for (const row of rows) send(row, row.enabled);
        },
      },
    });
  };
}

/** Starts one run now, as Capy's Run now item does. */
export function useRunAutomation(orgId: string | undefined) {
  const trigger = useAtomSet(triggerAutomationAtom, { mode: "promise" });
  return (row: AutomationRow) => {
    if (orgId === undefined) return;
    trigger({
      params: { orgId, automationId: row.id },
      payload: { requestId: crypto.randomUUID() },
      reactivityKeys: automationReactivityKeys(orgId),
    })
      .then(() =>
        toast.success("Automation started", { description: row.name }),
      )
      .catch(() =>
        toast.error("Could not run automation", { description: row.name }),
      );
  };
}
