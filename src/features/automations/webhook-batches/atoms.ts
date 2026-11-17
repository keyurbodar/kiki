import { Atom } from "effect/reactivity";
import { ApiClient } from "@/data/client/ApiClient";

export const webhookBatchKeys = (automationId: string) => [
  `webhook_batch:${automationId}`,
];

export type WebhookBatchesQuery = {
  readonly orgId: string;
  readonly automationId: string;
  readonly status: "" | "collecting";
  readonly cursor: string;
};

const webhookBatchesQuery = Atom.family((key: string) => {
  const { orgId, automationId, status, cursor } = JSON.parse(
    key,
  ) as WebhookBatchesQuery;
  return Atom.withRefresh("15 seconds")(
    ApiClient.query("automations", "listBatches", {
      params: { orgId, automationId },
      query: {
        limit: "20",
        ...(status === "" ? {} : { status }),
        ...(cursor === "" ? {} : { cursor }),
      },
      reactivityKeys: webhookBatchKeys(automationId),
      timeToLive: "15 seconds",
    }),
  );
});

/** One page of an automation's webhook batches, refetched every 15 seconds. */
export const webhookBatchesAtom = ({
  orgId,
  automationId,
  status,
  cursor,
}: WebhookBatchesQuery) =>
  webhookBatchesQuery(
    JSON.stringify({ orgId, automationId, status, cursor }),
  );

export const flushWebhookBatchAtom = ApiClient.mutation(
  "automations",
  "flushBatch",
);
export const cancelWebhookBatchAtom = ApiClient.mutation(
  "automations",
  "cancelBatch",
);
