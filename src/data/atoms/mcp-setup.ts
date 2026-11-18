import { ApiClient } from "../client/ApiClient.ts";

/** The setup a proposal becomes once the person accepts it in the transcript. */
export const createMcpSetupAtom = ApiClient.mutation("mcp", "createSetup");

/** Marks that setup complete, which is what turns the inline row's state. */
export const completeMcpSetupAtom = ApiClient.mutation("mcp", "completeSetup");
