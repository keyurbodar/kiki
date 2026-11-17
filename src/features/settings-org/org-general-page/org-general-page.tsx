import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import { toast } from "sonner";
import { AvatarEditor } from "@/components/avatar-editor";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import type { OrgId } from "@/data/api/schemas/ids";
import type { Organization } from "@/data/api/schemas/organization";
import {
  deleteOrganizationAtom,
  organizationAtom,
  presignOrganizationAvatarAtom,
  removeOrganizationAvatarAtom,
  updateOrganizationAtom,
  updateOrganizationAvatarAtom,
} from "@/data/atoms/organizations";
import { organizationsAtom } from "@/data/atoms/session";
import { readAvatarUploadTarget, uploadToTarget } from "@/lib/upload";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { CopyField } from "@/primitives/copy-field";
import { Input } from "@/primitives/input";
import { SettingsRow } from "@/primitives/settings-row";
import { IssuePrefixRow } from "./issue-prefix-row";
import {
  catalogRow,
  organizationAccess,
  organizationNameChange,
} from "./org-general";
import { SharingSection } from "./sharing-section";

/** Settings → Organization → General for the active organization. */
export function SettingsOrgGeneralPage() {
  const organizations = useAtomValue(organizationsAtom);
  const list = AsyncResult.isSuccess(organizations)
    ? organizations.value
    : undefined;
  const active = list?.[0];
  if (list === undefined || active === undefined) return null;
  return <OrgGeneral orgId={active.id} organizations={list} />;
}

function OrgGeneral({
  orgId,
  organizations,
}: {
  orgId: OrgId;
  organizations: ReadonlyArray<Organization>;
}) {
  const navigate = useNavigate();
  const detail = useAtomValue(organizationAtom(orgId));
  const refreshList = useAtomRefresh(organizationsAtom);
  const refreshDetail = useAtomRefresh(organizationAtom(orgId));
  const rename = useAtomSet(updateOrganizationAtom, { mode: "promise" });
  const presignAvatar = useAtomSet(presignOrganizationAvatarAtom, {
    mode: "promise",
  });
  const updateAvatar = useAtomSet(updateOrganizationAvatarAtom, {
    mode: "promise",
  });
  const removeAvatar = useAtomSet(removeOrganizationAvatarAtom, {
    mode: "promise",
  });
  const deleteOrganization = useAtomSet(deleteOrganizationAtom, {
    mode: "promise",
  });
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const organization = AsyncResult.isSuccess(detail)
    ? detail.value
    : organizations.find((candidate) => candidate.id === orgId);
  if (organization === undefined) return null;

  const { accessLevel, isAdmin, adminReason } = organizationAccess(
    organization.accessLevel,
  );
  const isOwner = accessLevel === "owner";
  const name = nameDraft ?? organization.name;
  const params = { orgId: organization.id };
  const refresh = () => {
    refreshList();
    refreshDetail();
  };

  const saveName = () => {
    const next = organizationNameChange(name, organization.name);
    if (next === undefined) {
      setNameDraft(null);
      return;
    }
    rename({ params, payload: { name: next } })
      .then(() => {
        setNameDraft(null);
        refresh();
        toast.success("Organization name saved");
      })
      .catch(() => toast.error("Could not rename organization"));
  };

  const changeImage = (file: File) => {
    if (!isAdmin) return;
    setImageBusy(true);
    presignAvatar({
      params,
      payload: { mediaType: file.type, sizeBytes: file.size },
    })
      .then(async (response) => {
        const target = readAvatarUploadTarget(response);
        if (target === undefined) throw new Error("No upload target");
        await uploadToTarget(target, file);
        return updateAvatar({
          params,
          payload: { avatarKey: target.avatarKey },
        });
      })
      .then(() => {
        refresh();
        toast.success("Organization image updated");
      })
      .catch(() => toast.error("Could not update organization image"))
      .finally(() => setImageBusy(false));
  };

  const removeImage = () => {
    if (!isAdmin) return;
    setImageBusy(true);
    removeAvatar({ params })
      .then(() => {
        refresh();
        toast.success("Organization image removed");
      })
      .catch(() => toast.error("Could not remove organization image"))
      .finally(() => setImageBusy(false));
  };

  const confirmDelete = () => {
    if (!isOwner) return;
    setDeleting(true);
    deleteOrganization({ params })
      .then(() => {
        setConfirmingDelete(false);
        refreshList();
        toast.success("Organization deleted");
        navigate({ to: "/new" });
      })
      .catch(() => toast.error("Could not delete organization"))
      .finally(() => setDeleting(false));
  };

  const logo = catalogRow("org-logo");
  const nameRow = catalogRow("org-name");
  const idRow = catalogRow("org-id");
  const deleteRow = catalogRow("delete-organization");

  return (
    <>
      <SettingsPage title="Organization">
        <SettingsSection>
          <Card rows>
            <SettingsRow
              id={logo.id}
              label={logo.title}
              description={
                isAdmin
                  ? "Set the image used for this organization"
                  : adminReason
              }
            >
              <AvatarEditor
                src={organization.avatarUrl}
                name={organization.name}
                label="Change organization image"
                title="Adjust organization image"
                busy={imageBusy}
                disabled={!isAdmin}
                onImage={changeImage}
                onRemove={removeImage}
              />
            </SettingsRow>
            <SettingsRow
              id={nameRow.id}
              label={nameRow.title}
              description="Shown on threads, invitations, and integrations"
            >
              <Input
                size="sm"
                value={name}
                aria-label="Organization name"
                className="w-56!"
                disabled={!isAdmin}
                title={adminReason}
                onChange={(event) => setNameDraft(event.target.value)}
                onBlur={saveName}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                  if (event.key === "Escape") setNameDraft(null);
                }}
              />
            </SettingsRow>
            <SettingsRow
              id={idRow.id}
              label={idRow.title}
              description="For support and API requests"
            >
              <CopyField
                className="w-56!"
                size="sm"
                value={organization.id}
                label="organization ID"
              />
            </SettingsRow>
            <IssuePrefixRow
              organizationId={organization.id}
              isAdmin={isAdmin}
              adminReason={adminReason}
            />
          </Card>
        </SettingsSection>
        <SharingSection
          organization={organization}
          isAdmin={isAdmin}
          adminReason={adminReason}
          onSaved={refresh}
        />
        {isOwner ? (
          <SettingsSection title="Danger zone">
            <Card>
              <SettingsRow
                id={deleteRow.id}
                label={deleteRow.title}
                description="Permanently delete this organization and revoke all member access"
              >
                <Button
                  variant="ghost"
                  intent="danger"
                  onClick={() => setConfirmingDelete(true)}
                >
                  Delete organization
                </Button>
              </SettingsRow>
            </Card>
          </SettingsSection>
        ) : null}
      </SettingsPage>
      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={`Delete ${organization.name}?`}
        description="Immediately cancels active subscriptions and disables the organization, its projects, credentials, invitations, and member access; restoration recovers access but leaves subscriptions canceled"
        confirmLabel="Delete organization"
        loading={deleting}
        loadingLabel="Deleting"
        closeOnConfirm={false}
        onConfirm={confirmDelete}
      />
    </>
  );
}
