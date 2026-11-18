import { HttpClientError } from "effect/http";
import { HttpApiError } from "effect/http-api";
import { toast } from "sonner";

/**
 * A mutation that named a row the server no longer has. The `pulls` routes
 * declare a 404 for every id they take, so a deleted comment, finding or
 * review arrives as `NotFound`; a transport-level 404 is the same fact.
 */
export const isGone = (error: unknown): boolean =>
  error instanceof HttpApiError.NotFound ||
  (HttpClientError.isHttpClientError(error) && error.response?.status === 404);

/** What a gone row says: it is gone, not that the person's action was refused. */
export const goneMessage = (what: string) => ({
  title: `${what} no longer exists`,
  description: "It was deleted, so the list behind it is refreshing",
});

/** A gone row refreshes the list that carried it; anything else keeps its message. */
export const goneOr = (
  error: unknown,
  what: string,
  refresh: () => void,
): boolean => {
  if (!isGone(error)) return false;
  const { title, description } = goneMessage(what);
  toast.error(title, { description });
  refresh();
  return true;
};
