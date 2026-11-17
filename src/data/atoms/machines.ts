import { ApiClient } from "../client/ApiClient.ts";

export const previewHandoffAtom = ApiClient.mutation(
  "machines",
  "previewHandoff",
);
