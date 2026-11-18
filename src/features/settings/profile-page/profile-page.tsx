import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import { toast } from "sonner";
import { AvatarEditor } from "@/components/avatar-editor";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import { reactivityKeys } from "@/data/atoms/conventions";
import { currentUserAtom } from "@/data/atoms/session";
import {
  accountAtom,
  deleteAccountAtom,
  updateAccountImageAtom,
  updateAccountNameAtom,
} from "@/data/atoms/users";
import { SettingsConfirmDialog } from "@/features/settings/confirm-dialog";
import { Button, ButtonIcon } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { CopyField } from "@/primitives/copy-field";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { SettingsRow } from "@/primitives/settings-row";
import {
  type AccountEmail,
  type DeletedOrganization,
  fullName,
  readAccount,
  restoreDescription,
  splitName,
  validateNewEmail,
} from "./account";
import {
  type ChangeEmailBusy,
  ChangeEmailDialog,
  type ChangeEmailStep,
} from "./change-email-dialog";

/** The picked file as the URL the account stores, so a reload paints it again. */
const fileUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export type ProfilePageProps = {
  deletedOrganizations?: DeletedOrganization[];
};

export function ProfilePage({ deletedOrganizations = [] }: ProfilePageProps) {
  const account = readAccount(
    Option.getOrUndefined(AsyncResult.value(useAtomValue(accountAtom))),
  );
  const user = Option.getOrUndefined(
    AsyncResult.value(useAtomValue(currentUserAtom)),
  );
  const saveNameAtom = useAtomSet(updateAccountNameAtom, { mode: "promise" });
  const saveImage = useAtomSet(updateAccountImageAtom, { mode: "promise" });
  const removeAccount = useAtomSet(deleteAccountAtom, { mode: "promise" });
  const [draftName, setDraftName] = useState<string | null>(null);
  const [draftEmails, setDraftEmails] =
    useState<ReadonlyArray<AccountEmail> | null>(null);
  const [nameBusy, setNameBusy] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(deletedOrganizations);

  const userName = [user?.firstName, user?.lastName]
    .filter((part) => part !== null && part !== undefined && part !== "")
    .join(" ");
  const savedName = fullName(account) || userName;
  const name = draftName ?? savedName;
  const emails = draftEmails ?? account?.emails ?? [];
  const primary = emails.find((email) => email.primary);
  const keys = [reactivityKeys.currentUser];

  const save = () => {
    const trimmed = name.trim();
    if (account === undefined || trimmed === "" || trimmed === savedName) {
      setDraftName(null);
      return;
    }
    const { firstName, lastName } = splitName(trimmed);
    setNameBusy(true);
    saveNameAtom({ payload: { firstName, lastName }, reactivityKeys: keys })
      .then(() => {
        setDraftName(null);
        toast.success("Name updated");
      })
      .catch(() => toast.error("Could not update your name"))
      .finally(() => setNameBusy(false));
  };

  const upload = (file: File) => {
    setImageBusy(true);
    fileUrl(file)
      .then((imageUrl) =>
        saveImage({ payload: { imageUrl }, reactivityKeys: keys }),
      )
      .then(() => toast.success("Profile picture updated"))
      .catch(() => toast.error("Could not update your profile picture"))
      .finally(() => setImageBusy(false));
  };

  const email = useChangeEmail(emails, setDraftEmails);

  return (
    <>
      <SettingsPage title="Profile">
        <SettingsSection>
          <Card rows>
            <SettingsRow
              id="profile-picture"
              label="Profile picture"
              description="Shown across your account"
            >
              <AvatarEditor
                src={account?.imageUrl ?? user?.imageUrl ?? null}
                name={name}
                label="Change profile picture"
                title="Adjust profile picture"
                busy={imageBusy}
                disabled={account === undefined}
                onImage={upload}
              />
            </SettingsRow>
            <SettingsRow
              id="profile-name"
              label="Name"
              description="Shown to teammates"
            >
              <Input
                size="sm"
                value={name}
                aria-label="Full name"
                className="w-56"
                disabled={account === undefined || nameBusy}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={save}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") setDraftName(null);
                }}
              />
            </SettingsRow>
            <SettingsRow
              id="profile-email"
              label="Email"
              description="Shown to teammates and used to sign in"
            >
              <span className="max-w-72 truncate text-sm font-normal text-muted-foreground-1">
                {primary?.email}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Change email"
                disabled={account === undefined}
                onClick={() => email.setOpen(true)}
              >
                <ButtonIcon>
                  <Icon name="pencil" size="sm" />
                </ButtonIcon>
              </Button>
            </SettingsRow>
            <SettingsRow
              id="user-id"
              label="User ID"
              description="For support and API requests"
            >
              {account === undefined ? null : (
                <CopyField
                  size="sm"
                  value={account.id}
                  label="user ID"
                  className="relative flex min-w-0 w-56"
                />
              )}
            </SettingsRow>
          </Card>
        </SettingsSection>
        <SettingsSection title="Danger zone">
          <Card>
            <SettingsRow
              id="delete-account"
              label="Delete account"
              description="Permanently revoke your access to Capy"
            >
              <Button
                variant="ghost"
                intent="danger"
                disabled={account === undefined}
                onClick={() => setDeleteOpen(true)}
              >
                Delete account
              </Button>
            </SettingsRow>
          </Card>
        </SettingsSection>
        {deleted.length > 0 && (
          <SettingsSection
            id="deleted-organizations"
            title="Deleted organizations"
          >
            <Card rows>
              {deleted.map((org) => (
                <SettingsRow
                  key={org.id}
                  id={`deleted-organization-${org.id}`}
                  label={org.name}
                  description={restoreDescription(org)}
                >
                  <Button
                    variant="ghost"
                    disabled={restoring !== null}
                    aria-busy={restoring === org.id || undefined}
                    onClick={() => {
                      setRestoring(org.id);
                      setDeleted((rows) => rows.filter((r) => r.id !== org.id));
                      setRestoring(null);
                      toast.success(`${org.name} restored`);
                    }}
                  >
                    {restoring === org.id ? "Restoring" : "Restore"}
                  </Button>
                </SettingsRow>
              ))}
            </Card>
          </SettingsSection>
        )}
      </SettingsPage>
      <ChangeEmailDialog
        open={email.open}
        step={email.step}
        currentEmail={primary?.email ?? ""}
        newEmail={email.newEmail}
        pendingEmail={email.pending?.email ?? ""}
        keptEmails={email.kept}
        code={email.code}
        busy={email.busy}
        error={email.error}
        onOpenChange={email.onOpenChange}
        onNewEmailChange={(value) => {
          email.setNewEmail(value);
          email.setError(null);
        }}
        onSubmitAddress={email.submitAddress}
        onCodeChange={(value) => {
          email.setCode(value);
          email.setError(null);
        }}
        onConfirm={email.confirm}
        onResend={email.resend}
        onBack={email.back}
      />
      <SettingsConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete account permanently?"
        description="Your account and credentials will be deleted, and you'll lose access to every organization. Shared work and authored history remain"
        confirmLabel="Delete permanently"
        loading={deleting}
        loadingLabel="Deleting"
        closeOnConfirm={false}
        onConfirm={() => {
          setDeleting(true);
          removeAccount({ reactivityKeys: keys })
            .then(() => {
              setDeleteOpen(false);
              toast.success("Account deleted");
            })
            .catch(() => toast.error("Could not delete your account"))
            .finally(() => setDeleting(false));
        }}
      />
    </>
  );
}

export function useChangeEmail(
  emails: ReadonlyArray<AccountEmail>,
  setEmails: (emails: ReadonlyArray<AccountEmail>) => void,
) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ChangeEmailStep>("address");
  const [newEmail, setNewEmail] = useState("");
  const [pending, setPending] = useState<AccountEmail | null>(null);
  const [kept, setKept] = useState<AccountEmail[]>([]);
  const [code, setCode] = useState("");
  const [busy] = useState<ChangeEmailBusy>(null);
  const [error, setError] = useState<string | null>(null);
  const primary = emails.find((email) => email.primary);

  const reset = () => {
    setStep("address");
    setNewEmail("");
    setPending(null);
    setKept([]);
    setCode("");
    setError(null);
  };

  const finish = (email: AccountEmail) => {
    const others = emails.filter(
      (e) => !e.primary && e.id !== email.id && e.linkedSignIn !== undefined,
    );
    const previous = emails.find((e) => e.primary);
    const stays =
      previous?.linkedSignIn !== undefined
        ? [{ ...previous, primary: false }]
        : [];
    setEmails([
      { ...email, primary: true, verified: true },
      ...others,
      ...stays,
    ]);
    if (stays.length === 0) {
      setOpen(false);
      reset();
      toast.success(`Your email is now ${email.email}`);
    } else {
      setKept(stays);
      setStep("kept");
    }
  };

  return {
    open,
    setOpen,
    step,
    newEmail,
    setNewEmail,
    pending,
    kept,
    code,
    setCode,
    busy,
    error,
    setError,
    onOpenChange: (next: boolean) => {
      if (next) return setOpen(true);
      setOpen(false);
      reset();
    },
    submitAddress: () => {
      if (primary === undefined) return;
      const problem = validateNewEmail(newEmail, primary.email);
      if (problem !== null) return setError(problem);
      const email = newEmail.trim().toLowerCase();
      setPending({
        id: `email_${email}`,
        email,
        primary: false,
        verified: false,
      });
      setCode("");
      setStep("code");
    },
    confirm: (value: string) => {
      if (pending === null || value.length !== 6) return;
      finish(pending);
    },
    resend: () => {
      setCode("");
      setError(null);
    },
    back: () => {
      setCode("");
      setError(null);
      setStep("address");
    },
  };
}
