import { ApiClient } from "@/data/client/ApiClient";

/** Posts a comment or a reply on an issue. */
export const commentIssueAtom = ApiClient.mutation("issues", "comment");
