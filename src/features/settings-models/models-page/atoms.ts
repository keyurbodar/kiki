import { ApiClient } from "@/data/client/ApiClient";

export const moveToOrganizationAtom = ApiClient.mutation(
  "models",
  "moveToOrganization",
);
