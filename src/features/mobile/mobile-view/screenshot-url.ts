import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import { queryTimeToLive } from "@/data/atoms/conventions";
import { organizationsAtom } from "@/data/atoms/session";
import { ApiClient } from "@/data/client/ApiClient";

const fileUrlQuery = Atom.family((key: string) => {
  const [orgId = "", jamId = "", fileId = ""] = key.split("/");
  return ApiClient.query("files", "url", {
    params: { orgId, jamId, fileId },
    query: {},
    timeToLive: queryTimeToLive,
  });
});

export const fileUrlAtom = (orgId: string, jamId: string, fileId: string) =>
  fileUrlQuery([orgId, jamId, fileId].join("/"));

export function signedUrlOf(response: unknown): string | undefined {
  if (typeof response === "string") return response;
  if (typeof response !== "object" || response === null) return undefined;
  const url = (response as { url?: unknown }).url;
  return typeof url === "string" ? url : undefined;
}

export function useActiveOrgId(): string | undefined {
  const organizations = Option.getOrUndefined(
    AsyncResult.value(useAtomValue(organizationsAtom)),
  );
  return organizations?.[0]?.id;
}

export function useFileUrl(orgId: string, jamId: string, fileId: string) {
  const atom = fileUrlAtom(orgId, jamId, fileId);
  const response = Option.getOrUndefined(AsyncResult.value(useAtomValue(atom)));
  const refresh = useAtomRefresh(atom);
  return { url: signedUrlOf(response), mediaFailed: refresh };
}
