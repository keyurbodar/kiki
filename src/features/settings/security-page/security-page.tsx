import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import { SettingsConfirmDialog } from "@/features/settings/confirm-dialog";
import { AddPasskeyDialog } from "@/features/settings/passkeys";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Card, CardListHeader } from "@/primitives/card";
import { Icon } from "@/primitives/icon";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import { SettingsRow } from "@/primitives/settings-row";
import { Switch } from "@/primitives/switch";
import { PasswordDialog } from "./password-dialog";
import {
  generateBackupCodes,
  type OAuthProvider,
  type Passkey,
  passkeyCountLabel,
  passkeyDescription,
  providerNames,
  removeTotpDescription,
  requirePasskeyDescription,
  type SecurityState,
  sampleSecurity,
  signInMethodCount,
  twoStepDescription,
} from "./security-model";
import { BackupCodesDialog, TotpSetupDialog } from "./two-step-dialogs";

function RowMenu({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Menu>
      <MenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={label} />}
      >
        <Icon name="settings-slider-hor" size="sm" />
      </MenuTrigger>
      <MenuContent align="end">{children}</MenuContent>
    </Menu>
  );
}

export type SecurityPageProps = {
  initialState?: SecurityState;
  requiredBy?: string[];
};

export function SecurityPage({
  initialState = sampleSecurity,
  requiredBy = [],
}: SecurityPageProps) {
  const [state, setState] = useState(initialState);
  const [passwordDialog, setPasswordDialog] = useState<"set" | "change" | null>(
    null,
  );
  const [disconnect, setDisconnect] = useState<OAuthProvider | null>(null);
  const [totpOpen, setTotpOpen] = useState(false);
  const [removeTotp, setRemoveTotp] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [addPasskey, setAddPasskey] = useState(false);
  const [removePasskey, setRemovePasskey] = useState<Passkey | null>(null);
  const [stopRequiring, setStopRequiring] = useState(false);

  const update = (patch: Partial<SecurityState>) =>
    setState((prev) => ({ ...prev, ...patch }));
  const onlyMethod = signInMethodCount(state) === 1;
  const hasTrusted = state.passkeys.some((p) => p.trusted);
  const disconnectName = disconnect === null ? "" : providerNames[disconnect];

  return (
    <>
      <SettingsPage
        title="Security"
        description="How you confirm it's you when you sign in"
      >
        <SettingsSection
          id="sign-in-methods"
          title="Sign-in methods"
          description="Ways you can sign in to this account"
        >
          <Card rows>
            <SettingsRow
              icon={<Icon name="email-1" />}
              label="Email code"
              description={`Sign in with a code sent to ${state.emailAddress}`}
            >
              {state.emailVerified ? null : (
                <Badge color="warning">Not verified</Badge>
              )}
            </SettingsRow>
            <SettingsRow
              icon={<Icon name="password" />}
              label="Password"
              description={
                state.passwordEnabled
                  ? "Sign in with your email and password"
                  : "Add one to sign in without waiting for a code"
              }
            >
              <Button
                variant="ghost"
                onClick={() =>
                  setPasswordDialog(state.passwordEnabled ? "change" : "set")
                }
              >
                {state.passwordEnabled ? "Change" : "Set password"}
              </Button>
            </SettingsRow>
            {(Object.keys(providerNames) as OAuthProvider[]).map((provider) => {
              const name = providerNames[provider];
              const account = state.externalAccounts.find(
                (a) => a.provider === provider,
              );
              if (account === undefined)
                return (
                  <SettingsRow
                    key={provider}
                    icon={
                      provider === "github" ? (
                        <Icon name="github" />
                      ) : (
                        <Icon name="chrome" />
                      )
                    }
                    label={name}
                    description={`Sign in with your ${name} account`}
                  >
                    <Button
                      variant="ghost"
                      onClick={() => {
                        update({
                          externalAccounts: [
                            ...state.externalAccounts,
                            {
                              provider,
                              emailAddress: state.emailAddress,
                              verified: true,
                            },
                          ],
                        });
                        toast.success(`${name} connected`);
                      }}
                    >
                      Connect
                    </Button>
                  </SettingsRow>
                );
              return (
                <SettingsRow
                  key={provider}
                  icon={
                    provider === "github" ? (
                      <Icon name="github" />
                    ) : (
                      <Icon name="chrome" />
                    )
                  }
                  label={name}
                  description={
                    !account.verified
                      ? "Connecting didn't finish, remove it and connect again"
                      : onlyMethod
                        ? `Add another way to sign in before you disconnect ${name}`
                        : `Connected as ${account.emailAddress}`
                  }
                >
                  <RowMenu label={`${name} actions`}>
                    <MenuItem
                      intent="danger"
                      disabled={onlyMethod && account.verified}
                      onClick={() => setDisconnect(provider)}
                    >
                      {account.verified ? "Disconnect" : "Remove"}
                    </MenuItem>
                  </RowMenu>
                </SettingsRow>
              );
            })}
          </Card>
        </SettingsSection>
        <SettingsSection
          id="two-step-verification"
          title="Two-step verification"
          description={twoStepDescription(requiredBy)}
        >
          <Card rows>
            <SettingsRow
              id="authenticator-app"
              icon={<Icon name="phone-dynamic-island" />}
              label="Authenticator app"
              description={
                state.totpEnabled
                  ? "Sign-ins ask for a code from your app"
                  : "Get sign-in codes from an app like 1Password or Google Authenticator"
              }
              actions={
                state.totpEnabled ? (
                  <RowMenu label="Authenticator app actions">
                    <MenuItem
                      intent="danger"
                      onClick={() => setRemoveTotp(true)}
                    >
                      Remove
                    </MenuItem>
                  </RowMenu>
                ) : undefined
              }
            >
              {state.totpEnabled ? null : (
                <Button variant="ghost" onClick={() => setTotpOpen(true)}>
                  Set up
                </Button>
              )}
            </SettingsRow>
            <SettingsRow
              id="backup-codes"
              icon={<Icon name="key-2" />}
              label="Backup codes"
              description={
                state.totpEnabled
                  ? "Single-use codes for when you lose your authenticator"
                  : "Available once your authenticator app is on"
              }
            >
              {state.totpEnabled ? (
                <Button
                  variant="ghost"
                  onClick={() => setBackupCodes(generateBackupCodes())}
                >
                  Regenerate
                </Button>
              ) : null}
            </SettingsRow>
          </Card>
        </SettingsSection>
        <SettingsSection
          id="passkeys"
          title="Passkeys"
          description="Sign in with Face ID, Touch ID, Windows Hello or a security key, and a trusted passkey counts as two-step verification"
        >
          <Card rows>
            <CardListHeader className="flex min-h-15 items-center justify-between gap-3 py-3 pr-2 pl-4">
              <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
                {passkeyCountLabel(state.passkeys.length)}
              </span>
              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={
                    state.passkeys.length > 0
                      ? "Add another passkey or security key as a backup"
                      : "Add a passkey"
                  }
                  title={
                    state.passkeys.length > 0
                      ? "Add another passkey or security key as a backup"
                      : "Add a passkey"
                  }
                  onClick={() => setAddPasskey(true)}
                >
                  <Icon name="square-plus" size="sm" />
                </Button>
              </div>
            </CardListHeader>
            {state.passkeys.map((passkey) => (
              <SettingsRow
                key={passkey.id}
                icon={<Icon name="passkeys" />}
                label={passkey.name}
                description={passkeyDescription(passkey, state.totpEnabled)}
              >
                <RowMenu label={`${passkey.name} actions`}>
                  {passkey.trusted ? null : (
                    <MenuItem
                      onClick={() => {
                        update({
                          passkeys: state.passkeys.map((p) =>
                            p.id === passkey.id ? { ...p, trusted: true } : p,
                          ),
                        });
                        toast.success("Passkey trusted");
                      }}
                    >
                      Trust
                    </MenuItem>
                  )}
                  <MenuItem
                    intent="danger"
                    onClick={() => setRemovePasskey(passkey)}
                  >
                    Remove
                  </MenuItem>
                </RowMenu>
              </SettingsRow>
            ))}
          </Card>
          <Card>
            <SettingsRow
              label="Require a passkey to sign in"
              description={requirePasskeyDescription(state)}
            >
              <Switch
                aria-label="Require a passkey to sign in"
                checked={state.passkeyRequired}
                disabled={!state.passkeyRequired && !hasTrusted}
                onCheckedChange={(checked) => {
                  if (!checked) return setStopRequiring(true);
                  update({ passkeyRequired: true });
                  toast.success("Your account now requires a passkey sign-in");
                }}
              />
            </SettingsRow>
          </Card>
        </SettingsSection>
      </SettingsPage>
      <PasswordDialog
        mode={passwordDialog}
        onOpenChange={(open) => !open && setPasswordDialog(null)}
        onSaved={() => {
          update({ passwordEnabled: true });
          setPasswordDialog(null);
        }}
      />
      <SettingsConfirmDialog
        open={disconnect !== null}
        onOpenChange={(open) => !open && setDisconnect(null)}
        title={`Disconnect ${disconnectName}?`}
        description={`You can't sign in with ${disconnectName} until you connect it again`}
        confirmLabel="Disconnect"
        loadingLabel="Disconnecting"
        onConfirm={() => {
          update({
            externalAccounts: state.externalAccounts.filter(
              (a) => a.provider !== disconnect,
            ),
          });
          toast.success(`${disconnectName} disconnected`);
        }}
      />
      <TotpSetupDialog
        open={totpOpen}
        onOpenChange={setTotpOpen}
        onComplete={() => {
          setTotpOpen(false);
          update({ totpEnabled: true });
          toast.success("Two-step verification is on");
        }}
      />
      <BackupCodesDialog
        codes={backupCodes}
        onClose={() => setBackupCodes(null)}
      />
      <SettingsConfirmDialog
        open={removeTotp}
        onOpenChange={setRemoveTotp}
        title="Remove authenticator app?"
        description={removeTotpDescription(requiredBy)}
        confirmLabel="Remove"
        loadingLabel="Removing"
        onConfirm={() => {
          update({ totpEnabled: false });
          toast.success("Authenticator app removed");
        }}
      />
      <AddPasskeyDialog
        open={addPasskey}
        onOpenChange={setAddPasskey}
        canRequire={!state.passkeyRequired}
        onAdd={({ name, require }) => {
          const passkey: Passkey = {
            id: `passkey_${state.passkeys.length + 1}`,
            name,
            createdAt: new Date(),
            lastUsedAt: null,
            trusted: true,
          };
          update({
            passkeys: [...state.passkeys, passkey],
            passkeyRequired: state.passkeyRequired || require,
          });
          setAddPasskey(false);
          toast.success(
            require
              ? "Passkey added, your account now requires a passkey sign-in"
              : "Passkey added and trusted",
          );
        }}
      />
      <SettingsConfirmDialog
        open={removePasskey !== null}
        onOpenChange={(open) => !open && setRemovePasskey(null)}
        title="Remove passkey?"
        description={
          removePasskey === null
            ? ""
            : `${removePasskey.name} stops working for signing in to Capy`
        }
        confirmLabel="Remove"
        loadingLabel="Removing"
        onConfirm={() => {
          update({
            passkeys: state.passkeys.filter((p) => p.id !== removePasskey?.id),
          });
          toast.success("Passkey removed");
        }}
      />
      <SettingsConfirmDialog
        open={stopRequiring}
        onOpenChange={setStopRequiring}
        title="Stop requiring a passkey?"
        description="Your password and email codes will sign you in to Capy again"
        confirmLabel="Stop requiring"
        loadingLabel="Saving"
        onConfirm={() => {
          update({ passkeyRequired: false });
          toast.success("Passkey sign-in is no longer required");
        }}
      />
    </>
  );
}
