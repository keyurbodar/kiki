import { RegistryContext } from "@effect/atom-react";
import { useContext } from "react";
import type { OrgId } from "@/data/api/schemas/ids";
import { pendingPreviewFn, runAtomFn, uploadFilesFn } from "@/data/atoms/files";
import { makeUploader, type Uploader } from "./upload";

/**
 * The uploader for an organization: POST /orgs/:orgId/files through the A3
 * client, then a PUT per target (or a simulated one for mock targets).
 * Undefined without an org, which turns attachments off.
 */
export function useFileUploader(
  orgId: OrgId | undefined,
): Uploader | undefined {
  const registry = useContext(RegistryContext);
  if (orgId === undefined) return undefined;
  return makeUploader({
    upload: (files) => runAtomFn(registry, uploadFilesFn(), { orgId, files }),
    pendingPreview: (fileId) =>
      runAtomFn(registry, pendingPreviewFn(), { orgId, fileId }).then(
        (preview) => preview.url,
        () => undefined,
      ),
  });
}
