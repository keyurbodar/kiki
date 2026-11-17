import { ApiClient } from "../client/ApiClient.ts";

export const createFolderAtom = ApiClient.mutation(
  "threadOrganization",
  "createFolder",
);
