import { ApiClient } from "@/data/client/ApiClient";

export const completeSlackOAuthAtom = ApiClient.mutation(
  "integrations",
  "completeSlackOAuth",
);
export const completeLinearOAuthAtom = ApiClient.mutation(
  "integrations",
  "completeLinearOAuth",
);
export const completePaperOAuthAtom = ApiClient.mutation(
  "integrations",
  "completePaperOAuth",
);
export const completeGitHubOAuthAtom = ApiClient.mutation(
  "integrations",
  "completeGitHubOAuth",
);
export const completeMcpOAuthAtom = ApiClient.mutation("mcp", "completeOAuth");

export const atomsFor = {
  slack: completeSlackOAuthAtom,
  linear: completeLinearOAuthAtom,
  paper: completePaperOAuthAtom,
};
