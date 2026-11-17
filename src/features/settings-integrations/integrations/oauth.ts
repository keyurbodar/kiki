import { useAtomSet } from "@effect/atom-react";
import { useState } from "react";
import { ApiClient } from "@/data/client/ApiClient";

const startSlackOAuth = ApiClient.mutation("integrations", "startSlackOAuth");
const startLinearOAuth = ApiClient.mutation("integrations", "startLinearOAuth");
const startPaperOAuth = ApiClient.mutation("integrations", "startPaperOAuth");

export const authorizeUrlOf = (result: unknown): string | undefined => {
  if (typeof result !== "object" || result === null) return undefined;
  const url = (result as { authorizeUrl?: unknown }).authorizeUrl;
  return typeof url === "string" ? url : undefined;
};

export function useStartOAuth(provider: "slack" | "linear" | "paper") {
  const [opening, setOpening] = useState(false);
  const slack = useAtomSet(startSlackOAuth, { mode: "promise" });
  const linear = useAtomSet(startLinearOAuth, { mode: "promise" });
  const paper = useAtomSet(startPaperOAuth, { mode: "promise" });
  const start = async (orgId: string) => {
    setOpening(true);
    try {
      const result =
        provider === "slack"
          ? await slack({ params: { orgId }, payload: {} })
          : provider === "linear"
            ? await linear({ params: { orgId } })
            : await paper({ params: { orgId } });
      const url = authorizeUrlOf(result);
      if (url !== undefined) window.location.assign(url);
    } finally {
      setOpening(false);
    }
  };
  return { opening, start };
}
