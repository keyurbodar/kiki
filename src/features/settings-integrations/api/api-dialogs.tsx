import { useAtomSet } from "@effect/atom-react";
import { DateTime } from "effect";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import type { ServiceUser, ServiceUserRole } from "@/data/api/schemas/api-keys";
import { type OrgId, ServiceUserId } from "@/data/api/schemas/ids";
import {
  apiSettingsKeys,
  createServiceUser,
  mintApiKey,
} from "@/data/atoms/api-keys";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Input } from "@/primitives/input";
import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectItem,
  MenuSelectTrigger,
  MenuSelectValue,
} from "@/primitives/menu-select";
import { Textarea } from "@/primitives/textarea";
import {
  type ExpirationChoice,
  errorMessage,
  expirationDate,
  roleLabels,
} from "./api-state";
import { ProjectIcon } from "./icons";
import { busyLabel, ConnectFooter, CopyValue, Field } from "./parts";

const apiKeyHelp = {
  href: "https://docs.capy.ai/api-reference/authentication",
  label: "API key help",
};

export function CreateServiceUserDialog({
  open,
  onOpenChange,
  orgId,
  canCreateAdmin,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: OrgId | undefined;
  canCreateAdmin: boolean;
  onCreated: (serviceUserId: string) => void;
}) {
  const create = useAtomSet(createServiceUser, { mode: "promise" });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon] = useState<string | null>(null);
  const [role, setRole] = useState<ServiceUserRole>("read_write");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setName("");
    setDescription("");
    setRole("read_write");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (orgId === undefined || name.trim() === "") return;
    setBusy(true);
    create({
      params: { orgId },
      payload: {
        name,
        description: description.trim() === "" ? null : description,
        icon,
        role,
      },
      reactivityKeys: apiSettingsKeys.apiSettings(orgId),
    })
      .then((created) => {
        toast.success("Service user created", { description: created.name });
        reset();
        onOpenChange(false);
        onCreated(created.id);
      })
      .catch((error: unknown) =>
        toast.error(errorMessage(error, "Could not create service user")),
      )
      .finally(() => setBusy(false));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) reset();
        if (!busy) onOpenChange(next);
      }}
    >
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Create service user</DialogTitle>
            <DialogDescription>
              Creates a non-human identity for organization-owned work
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Name">
              <span className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Change service user icon"
                >
                  <ProjectIcon icon={icon} className="size-5" />
                </Button>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="CI automation"
                  maxLength={255}
                  autoFocus
                  required
                />
              </span>
            </Field>
            <Field label="Description" optional>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Runs checks and deployment workflows"
                maxLength={5000}
              />
            </Field>
            <Field label="Role">
              <MenuSelect
                items={roleLabels}
                value={role}
                onValueChange={(value) => setRole(value as ServiceUserRole)}
              >
                <MenuSelectTrigger className="w-full">
                  <MenuSelectValue />
                </MenuSelectTrigger>
                <MenuSelectContent>
                  <MenuSelectItem value="read_only">Read-only</MenuSelectItem>
                  <MenuSelectItem value="read_write">Read-write</MenuSelectItem>
                  <MenuSelectItem value="admin" disabled={!canCreateAdmin}>
                    Admin
                  </MenuSelectItem>
                </MenuSelectContent>
              </MenuSelect>
              {!canCreateAdmin && (
                <span className="text-xs font-normal text-muted-foreground-2">
                  Only organization admins can create admin service users
                </span>
              )}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" intent="accent" disabled={busy}>
              {busyLabel(busy, "Create service user", "Creating")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const principalLabel = (user: Pick<ServiceUser, "name" | "disabledAt">) =>
  `${user.name}${user.disabledAt === null ? "" : " (disabled)"}`;

export function CreateApiKeyDialog({
  open,
  onOpenChange,
  orgId,
  serviceUsers,
  lockedServiceUserId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: OrgId | undefined;
  serviceUsers: ReadonlyArray<Pick<ServiceUser, "id" | "name" | "disabledAt">>;
  lockedServiceUserId?: string;
}) {
  const mint = useAtomSet(mintApiKey, { mode: "promise" });
  const [name, setName] = useState("");
  const [principal, setPrincipal] = useState(lockedServiceUserId ?? "human");
  const [expiration, setExpiration] = useState<ExpirationChoice>("never");
  const [customDate, setCustomDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [plaintext, setPlaintext] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setPrincipal(lockedServiceUserId ?? "human");
    setExpiration("never");
    setCustomDate("");
    setPlaintext(null);
  };
  const close = () => {
    reset();
    onOpenChange(false);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (orgId === undefined || name.trim() === "") return;
    const expiresAt = expirationDate(expiration, customDate);
    if (expiration === "custom" && expiresAt === undefined) return;
    setBusy(true);
    mint({
      params: { orgId },
      payload: {
        name,
        serviceUserId:
          principal === "human" ? undefined : ServiceUserId.make(principal),
        expiresAt:
          expiresAt === undefined ? undefined : DateTime.fromDateUnsafe(expiresAt),
      },
      reactivityKeys: apiSettingsKeys.apiSettings(orgId),
    })
      .then((minted) => setPlaintext(minted.plaintext))
      .catch((error: unknown) =>
        toast.error(errorMessage(error, "Could not create API key")),
      )
      .finally(() => setBusy(false));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next, details) => {
        if (!next && plaintext !== null) {
          details.cancel();
          return;
        }
        if (!next && !busy) reset();
        if (!busy) onOpenChange(next);
      }}
    >
      <DialogContent
        className={
          plaintext === null ? undefined : "[&_[data-slot=dialog-close]]:hidden"
        }
      >
        {plaintext === null ? (
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>Create API key</DialogTitle>
              <DialogDescription>
                The key acts with its principal's live access
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <Field label="Name">
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Deploy workflow"
                  maxLength={255}
                  autoFocus
                  required
                />
              </Field>
              <Field label="Principal">
                <MenuSelect
                  items={Object.fromEntries([
                    ...(lockedServiceUserId === undefined
                      ? [["human", "You"]]
                      : []),
                    ...serviceUsers.map((user) => [user.id, principalLabel(user)]),
                  ])}
                  value={principal}
                  onValueChange={(value) => value !== null && setPrincipal(value)}
                  disabled={lockedServiceUserId !== undefined}
                >
                  <MenuSelectTrigger className="w-full">
                    <MenuSelectValue />
                  </MenuSelectTrigger>
                  <MenuSelectContent>
                    {lockedServiceUserId === undefined && (
                      <MenuSelectItem value="human">You</MenuSelectItem>
                    )}
                    {serviceUsers.map((user) => (
                      <MenuSelectItem key={user.id} value={user.id}>
                        {principalLabel(user)}
                      </MenuSelectItem>
                    ))}
                  </MenuSelectContent>
                </MenuSelect>
              </Field>
              <Field label="Expiration">
                <MenuSelect
                  items={{
                    never: "Never",
                    30: "30 days",
                    90: "90 days",
                    365: "1 year",
                    custom: "Custom date",
                  }}
                  value={expiration}
                  onValueChange={(value) =>
                    setExpiration(value as ExpirationChoice)
                  }
                >
                  <MenuSelectTrigger className="w-full">
                    <MenuSelectValue />
                  </MenuSelectTrigger>
                  <MenuSelectContent>
                    <MenuSelectItem value="never">Never</MenuSelectItem>
                    <MenuSelectItem value="30">30 days</MenuSelectItem>
                    <MenuSelectItem value="90">90 days</MenuSelectItem>
                    <MenuSelectItem value="365">1 year</MenuSelectItem>
                    <MenuSelectItem value="custom">Custom date</MenuSelectItem>
                  </MenuSelectContent>
                </MenuSelect>
              </Field>
              {expiration === "custom" && (
                <Field label="Expires on">
                  <Input
                    type="date"
                    value={customDate}
                    min={new Date(Date.now() + 86_400_000)
                      .toISOString()
                      .slice(0, 10)}
                    onChange={(event) => setCustomDate(event.target.value)}
                    required
                  />
                </Field>
              )}
            </DialogBody>
            <ConnectFooter help={apiKeyHelp} onCancel={close} disabled={busy}>
              <Button type="submit" intent="accent" disabled={busy}>
                {busyLabel(busy, "Create API key", "Creating")}
              </Button>
            </ConnectFooter>
          </form>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Save your API key</DialogTitle>
              <DialogDescription>
                You won't be able to view this key again
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <CopyValue value={plaintext} label="API key" />
            </DialogBody>
            <ConnectFooter help={apiKeyHelp} onCancel={close} cancelLabel="Done" />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
