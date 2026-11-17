import { useState } from "react";
import { toast } from "sonner";
import { SettingsSection } from "@/components/settings-page";
import { entry as gitEntry } from "@/features/settings/nav/entries/git";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { CopyField } from "@/primitives/copy-field";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/primitives/menu";
import { SettingsRow } from "@/primitives/settings-row";
import { Switch } from "@/primitives/switch";
import {
  type AgentPreferences,
  CheckmarkIcon,
  ChevronDownSmallIcon,
  catalogRow,
  DotGridHorizontalIcon,
  MenuOption,
  menuCheckClass,
  menuIconSlot,
} from "../threads";
import {
  type CommitAuthorOption,
  commitAuthorOptions,
  commitBranchPrefix,
  commitCommitEmail,
  defaultBranchPrefix,
  type GitSigning,
  selectedCommitAuthor,
  signingDescription,
  signingStatusLabel,
} from "./git-settings";

const row = (id: string) => catalogRow(gitEntry, id);
const buttonIconClass = "size-(--icon-sm) shrink-0";

export const copyPublicKey = (publicKey: string) =>
  navigator.clipboard.writeText(publicKey).then(
    () => toast.success("Public signing key copied"),
    () => toast.error("Could not copy the signing key"),
  );

export type GitSettingsSectionProps = {
  preferences: AgentPreferences;
  signing: GitSigning | undefined;
  busy: string | null;
  onCommitAuthorChange: (option: CommitAuthorOption) => void;
  onCommitEmailChange: (email: string | null) => Promise<boolean>;
  onBranchPrefixChange: (prefix: string | null) => Promise<boolean>;
  onSigningChange: (enabled: boolean) => void;
  onRotate: () => void;
};

/** Capy's GitSettingsSection: commit author and email, signed commits and the branch prefix. */
export function GitSettingsSection({
  preferences,
  signing,
  busy,
  onCommitAuthorChange,
  onCommitEmailChange,
  onBranchPrefixChange,
  onSigningChange,
  onRotate,
}: GitSettingsSectionProps) {
  const [viewingKey, setViewingKey] = useState(false);
  const author = preferences.git?.commitAuthor ?? "user";
  const signCommits = preferences.gitSigning?.signCommits === true;
  const coAuthor = preferences.git?.coAuthor !== false;
  const selected = selectedCommitAuthor(author, coAuthor);
  const commitAuthor = row("commit-author");
  const signRow = row("sign-commits");
  const hasKey = signCommits && signing?.hasKey === true;
  return (
    <SettingsSection
      title="Git"
      description="Commit identity, signatures, and branch names"
    >
      <Card rows>
        <SettingsRow
          id={commitAuthor.id}
          label={commitAuthor.title}
          description="Who authors and co-authors Capy's commits, on desktop your own Git authors"
        >
          <Menu>
            <MenuTrigger
              render={
                <Button
                  size="sm"
                  className="w-40 justify-between"
                  disabled={busy !== null}
                />
              }
            >
              {selected.label}
              <ChevronDownSmallIcon className={buttonIconClass} />
            </MenuTrigger>
            <MenuContent align="end" className="min-w-80">
              {commitAuthorOptions.map((option) => (
                <MenuItem
                  key={option.label}
                  density="rich"
                  onClick={() => onCommitAuthorChange(option)}
                >
                  <MenuOption
                    label={option.label}
                    description={option.description}
                    trailing={
                      option === selected ? (
                        <CheckmarkIcon className={menuCheckClass} />
                      ) : undefined
                    }
                  />
                </MenuItem>
              ))}
            </MenuContent>
          </Menu>
        </SettingsRow>
        <CommitEmailRow
          key={preferences.git?.commitEmail ?? ""}
          value={preferences.git?.commitEmail}
          credited={author === "user" || coAuthor}
          disabled={busy !== null}
          onChange={onCommitEmailChange}
        />
        <SettingsRow
          id={signRow.id}
          label={signRow.title}
          description={signingDescription(author, signCommits, signing)}
        >
          <div className="flex items-center gap-2">
            <Switch
              checked={signCommits}
              disabled={
                author !== "user" || busy !== null || signing === undefined
              }
              onCheckedChange={onSigningChange}
            />
            {hasKey ? (
              <Menu>
                <MenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Signing key actions"
                      disabled={busy !== null}
                    />
                  }
                >
                  <DotGridHorizontalIcon className={buttonIconClass} />
                </MenuTrigger>
                <MenuContent align="end" className="w-48">
                  <MenuItem onClick={() => setViewingKey(true)}>
                    <span className={menuIconSlot}>
                      <Icon name="key-2" size="sm" />
                    </span>
                    View key
                  </MenuItem>
                  {signing?.publicKey == null ? null : (
                    <MenuItem
                      onClick={() =>
                        void copyPublicKey(signing.publicKey ?? "")
                      }
                    >
                      <span className={menuIconSlot}>
                        <Icon name="clipboard" size="sm" />
                      </span>
                      Copy public key
                    </MenuItem>
                  )}
                  <MenuSeparator />
                  <MenuItem onClick={onRotate}>
                    <span className={menuIconSlot}>
                      <Icon name="rotate" size="sm" />
                    </span>
                    Rotate key
                  </MenuItem>
                </MenuContent>
              </Menu>
            ) : null}
          </div>
        </SettingsRow>
        {hasKey && signing !== undefined && viewingKey ? (
          <SigningKeyDialog
            signing={signing}
            rotating={busy === "rotateSigning"}
            onRotate={onRotate}
            onClose={() => setViewingKey(false)}
          />
        ) : null}
        <BranchPrefixRow
          key={preferences.git?.branchPrefix ?? defaultBranchPrefix}
          value={preferences.git?.branchPrefix}
          disabled={busy !== null}
          onChange={onBranchPrefixChange}
        />
      </Card>
    </SettingsSection>
  );
}

function SigningKeyDialog({
  signing,
  rotating,
  onRotate,
  onClose,
}: {
  signing: GitSigning;
  rotating: boolean;
  onRotate: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Signing key</DialogTitle>
          <DialogDescription>
            The GPG key Capy signs your commits with
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Fingerprint</span>
            {signing.fingerprint === null ? null : (
              <CopyField
                className="w-56"
                aria-label="fingerprint"
                title={signing.fingerprint.slice(-16)}
              >
                {signing.fingerprint.slice(-16)}
              </CopyField>
            )}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">GitHub</span>
            <Badge
              size="sm"
              color={
                signing.registrationStatus === "registered"
                  ? "success"
                  : "warning"
              }
            >
              {signingStatusLabel(signing.registrationStatus)}
            </Badge>
          </div>
          {signing.publicKey === null ? null : (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                  Public key
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void copyPublicKey(signing.publicKey ?? "")}
                >
                  <Icon name="clipboard" size="sm" />
                  Copy
                </Button>
              </div>
              <pre className="max-h-40 overflow-auto rounded-md border-hairline border-border-1 bg-panel p-3 font-mono text-xs break-all whitespace-pre-wrap text-muted-foreground-1">
                {signing.publicKey}
              </pre>
              {signing.registrationStatus === "manual_required" ? (
                <p className="text-xs text-muted-foreground-2">
                  Add this key in GitHub settings to show commits as Verified
                </p>
              ) : null}
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            disabled={rotating}
            aria-busy={rotating || undefined}
            onClick={onRotate}
          >
            Rotate key
          </Button>
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const blurOnEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
  if (event.key === "Enter") event.currentTarget.blur();
};

function CommitEmailRow({
  value,
  credited,
  disabled,
  onChange,
}: {
  value: string | undefined;
  credited: boolean;
  disabled: boolean;
  onChange: (email: string | null) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(value ?? "");
  const email = row("commit-email");
  const commit = () => {
    const result = commitCommitEmail(draft, value);
    if (result.kind === "reject") {
      setDraft(value ?? "");
      toast.error(result.error);
      return;
    }
    setDraft(result.value);
    if (result.kind === "save")
      void onChange(result.next).then((saved) => {
        if (!saved) setDraft(value ?? "");
      });
  };
  return (
    <SettingsRow
      id={email.id}
      label={email.title}
      description={
        credited
          ? "A verified email from your GitHub account, defaults to a private address"
          : "Available when commits are authored by you or credit you as co-author"
      }
    >
      <Input
        size="sm"
        className="w-56"
        type="email"
        value={draft}
        maxLength={254}
        placeholder="you@company.com"
        aria-label="Commit email"
        disabled={!credited || disabled}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={blurOnEnter}
      />
    </SettingsRow>
  );
}

function BranchPrefixRow({
  value,
  disabled,
  onChange,
}: {
  value: string | undefined;
  disabled: boolean;
  onChange: (prefix: string | null) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(value ?? defaultBranchPrefix);
  const prefix = row("branch-prefix");
  const commit = () => {
    const result = commitBranchPrefix(draft, value);
    if (result.kind === "reject") {
      setDraft(value ?? defaultBranchPrefix);
      toast.error(result.error);
      return;
    }
    setDraft(result.value);
    if (result.kind === "save")
      void onChange(result.next).then((saved) => {
        if (!saved) setDraft(value ?? defaultBranchPrefix);
      });
  };
  return (
    <SettingsRow
      id={prefix.id}
      label={prefix.title}
      description="Prefix for new Capy branches"
    >
      <div className="flex items-center gap-1">
        <Input
          size="sm"
          className="w-32"
          value={draft}
          maxLength={32}
          aria-label="Branch prefix"
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={blurOnEnter}
        />
        <span className="text-sm text-muted-foreground-2">/</span>
      </div>
    </SettingsRow>
  );
}
