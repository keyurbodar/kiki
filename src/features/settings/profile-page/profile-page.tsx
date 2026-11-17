import { useRef, useState } from "react";
import { toast } from "sonner";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import { SettingsConfirmDialog } from "@/features/settings/confirm-dialog";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { CopyField } from "@/primitives/copy-field";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { SettingsRow } from "@/primitives/settings-row";
import {
  type Account,
  type AccountEmail,
  type DeletedOrganization,
  fullName,
  restoreDescription,
  sampleAccount,
  splitName,
  validateNewEmail,
} from "./account";
import {
  type ChangeEmailBusy,
  ChangeEmailDialog,
  type ChangeEmailStep,
} from "./change-email-dialog";

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export type ProfilePageProps = {
  initialAccount?: Account;
  deletedOrganizations?: DeletedOrganization[];
};

export function ProfilePage({
  initialAccount = sampleAccount,
  deletedOrganizations = [],
}: ProfilePageProps) {
  const [account, setAccount] = useState(initialAccount);
  const [draftName, setDraftName] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState(account.imageUrl);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(deletedOrganizations);
  const fileInput = useRef<HTMLInputElement>(null);

  const name = draftName ?? fullName(account);
  const primary = account.emails.find((email) => email.primary);

  const saveName = () => {
    const trimmed = name.trim();
    if (trimmed === "" || trimmed === fullName(account)) {
      setDraftName(null);
      return;
    }
    setAccount({ ...account, ...splitName(trimmed) });
    setDraftName(null);
    toast.success("Name updated");
  };

  const email = useChangeEmail(account, setAccount);

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
              <span className="contents">
                <span className="relative flex shrink-0 items-center justify-center overflow-hidden rounded bg-secondary size-8 text-xs">
                  {imageUrl === undefined ? (
                    initials(name)
                  ) : (
                    <img
                      alt={name}
                      className="absolute inset-0 size-full object-cover"
                      src={imageUrl}
                    />
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Change profile picture"
                  title="Adjust profile picture"
                  onClick={() => fileInput.current?.click()}
                >
                  <Icon name="pencil" size="sm" />
                </Button>
              </span>
              <input
                ref={fileInput}
                accept="image/gif,image/jpeg,image/png,image/webp"
                className="hidden"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file === undefined) return;
                  setImageUrl(URL.createObjectURL(file));
                  toast.success("Profile picture updated");
                }}
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
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={saveName}
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
                onClick={() => email.setOpen(true)}
              >
                <Icon name="pencil" size="sm" />
              </Button>
            </SettingsRow>
            <SettingsRow
              id="user-id"
              label="User ID"
              description="For support and API requests"
            >
              <CopyField className="relative flex min-w-0 w-56">
                <Input
                  size="sm"
                  font="mono"
                  readOnly
                  aria-label="user ID"
                  spellCheck={false}
                  autoComplete="off"
                  value={account.id}
                />
                <span className="absolute inset-y-0 flex items-center right-0.5">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Copy user ID"
                    onClick={() =>
                      void navigator.clipboard
                        ?.writeText(account.id)
                        .then(() => toast.success("Copied"))
                    }
                  />
                </span>
              </CopyField>
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
          setDeleting(false);
          setDeleteOpen(false);
          toast.success("Account deleted");
        }}
      />
    </>
  );
}

export function useChangeEmail(
  account: Account,
  setAccount: (account: Account) => void,
) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ChangeEmailStep>("address");
  const [newEmail, setNewEmail] = useState("");
  const [pending, setPending] = useState<AccountEmail | null>(null);
  const [kept, setKept] = useState<AccountEmail[]>([]);
  const [code, setCode] = useState("");
  const [busy] = useState<ChangeEmailBusy>(null);
  const [error, setError] = useState<string | null>(null);
  const primary = account.emails.find((email) => email.primary);

  const reset = () => {
    setStep("address");
    setNewEmail("");
    setPending(null);
    setKept([]);
    setCode("");
    setError(null);
  };

  const finish = (email: AccountEmail) => {
    const others = account.emails.filter(
      (e) => !e.primary && e.id !== email.id && e.linkedSignIn !== undefined,
    );
    const previous = account.emails.find((e) => e.primary);
    const stays =
      previous?.linkedSignIn !== undefined
        ? [{ ...previous, primary: false }]
        : [];
    setAccount({
      ...account,
      emails: [
        { ...email, primary: true, verified: true },
        ...others,
        ...stays,
      ],
    });
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
