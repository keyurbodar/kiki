import { ApiClient } from "../client/ApiClient.ts";

/** The setup a proposal becomes once the person answers it in the transcript. */
export const createMcpSetupAtom = ApiClient.mutation("mcp", "createSetup");

/**
 * Records the answer: `{ decision: "approve", owner?, env?, headers?,
 * requestHeaders?, clientSecret? }` or `{ decision: "decline" }`. Capy has no
 * separate install call — approving a proposal completes its setup.
 */
export const completeMcpSetupAtom = ApiClient.mutation("mcp", "completeSetup");

/** Re-runs a setup that failed on the server. */
export const retryMcpSetupAtom = ApiClient.mutation("mcp", "retrySetup");

/** The setups a thread already carries, keyed by the thread. */
export const mcpSetupsAtom = (orgId: string, jamId: string) =>
  ApiClient.query("mcp", "listSetups", { params: { orgId, jamId } });
