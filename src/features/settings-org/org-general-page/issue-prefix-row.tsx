import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import { toast } from "sonner";
import type { OrgId } from "@/data/api/schemas/ids";
import {
  issuePrefixAtom,
  issuePrefixReactivityKeys,
  setIssuePrefixAtom,
} from "@/data/atoms/organizations";
import { Input } from "@/primitives/input";
import { SettingsRow } from "@/primitives/settings-row";
import {
  catalogRow,
  issuePrefixChange,
  normalizeIssuePrefix,
  readIssuePrefix,
} from "./org-general";

export type IssuePrefixRowProps = {
  organizationId: OrgId;
  isAdmin: boolean;
  adminReason: string | undefined;
};

export function IssuePrefixRow({
  organizationId,
  isAdmin,
  adminReason,
}: IssuePrefixRowProps) {
  const result = useAtomValue(issuePrefixAtom(organizationId));
  const setPrefix = useAtomSet(setIssuePrefixAtom, { mode: "promise" });
  const [draft, setDraft] = useState<string | null>(null);
  const current = AsyncResult.isSuccess(result)
    ? readIssuePrefix(result.value)
    : undefined;
  if (current === undefined) return null;

  const save = () => {
    const change = issuePrefixChange(draft, current.prefix);
    if (change === undefined) {
      setDraft(null);
      return;
    }
    setPrefix({
      params: { orgId: organizationId },
      payload: change,
      reactivityKeys: issuePrefixReactivityKeys(organizationId),
    })
      .then(() => {
        setDraft(null);
        toast.success(
          change.prefix === null
            ? "Issue prefix restored"
            : "Issue prefix saved",
        );
      })
      .catch(() => toast.error("Could not save the issue prefix"));
  };

  const row = catalogRow("org-issue-prefix");
  return (
    <SettingsRow
      id={row.id}
      label={row.title}
      description={
        isAdmin
          ? "Up to 8 letters before each issue number, blank for the default"
          : adminReason
      }
    >
      <Input
        size="sm"
        value={draft ?? current.prefix ?? ""}
        placeholder={current.effective}
        aria-label="Issue prefix"
        className="w-28"
        maxLength={8}
        disabled={!isAdmin}
        title={adminReason}
        onChange={(event) => setDraft(normalizeIssuePrefix(event.target.value))}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") setDraft(null);
        }}
      />
    </SettingsRow>
  );
}
