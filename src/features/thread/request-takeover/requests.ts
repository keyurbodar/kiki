import { ApiClient } from "@/data/client/ApiClient";

export const setEnvironmentVariablesMutation = ApiClient.mutation(
  "jams",
  "setEnvironmentVariables",
);
export const desktopRequestDoneMutation = ApiClient.mutation(
  "jams",
  "desktopRequestDone",
);
export const terminalRequestDoneMutation = ApiClient.mutation(
  "jams",
  "terminalRequestDone",
);
export const feedbackRequestSendMutation = ApiClient.mutation(
  "jams",
  "feedbackRequestSend",
);
export const feedbackRequestDeclineMutation = ApiClient.mutation(
  "jams",
  "feedbackRequestDecline",
);

export const jamEventKey = (jamId: string) => `jam_event:${jamId}`;

export const isAdmitted = (result: unknown) =>
  typeof result === "object" &&
  result !== null &&
  "admitted" in result &&
  result.admitted === true;

export const listNames = (names: ReadonlyArray<string>) =>
  names.length <= 1
    ? (names[0] ?? "")
    : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
