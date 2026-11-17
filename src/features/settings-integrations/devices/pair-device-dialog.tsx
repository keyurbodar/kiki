import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { DateTime } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import { type ReactNode, useEffect, useState } from "react";
import type { Device, DeviceCodePreview } from "@/data/api/schemas/devices";
import type { OrgId } from "@/data/api/schemas/ids";
import {
  approveDeviceCodeAtom,
  denyDeviceCodeAtom,
  devicesAtom,
  lookupDeviceCodeAtom,
} from "@/data/atoms/devices";
import { organizationsAtom } from "@/data/atoms/session";
import { Button } from "@/primitives/button";
import { Checkbox } from "@/primitives/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
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
import { useActiveOrgId } from "../shared";
import { ConnectFooter, ConnectWait, type ConnectWaitStatus } from "./parts";
import { formatCountdown, pairingErrorMessage } from "./status";

const pairingHelp = {
  href: "https://docs.capy.ai/desktop",
  label: "Pairing help",
};

const idleDevicesAtom: Atom.Atom<
  AsyncResult.AsyncResult<ReadonlyArray<Device>, never>
> = Atom.make(AsyncResult.initial<ReadonlyArray<Device>, never>());

type Step =
  | { step: "code" }
  | {
      step: "review";
      preview: DeviceCodePreview;
      name: string;
      confirmed: boolean;
    }
  | {
      step: "approved";
      name: string;
      idsBeforeApproval: ReadonlySet<string> | undefined;
    }
  | { step: "denied" };

type Busy = "lookup" | "approve" | "deny";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-normal text-muted-foreground-2">
        {label}
      </span>
      <span className="truncate text-sm font-normal text-foreground">
        {value}
      </span>
    </div>
  );
}

export type PairDeviceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCode?: string;
};

export function PairDeviceDialog({
  open,
  onOpenChange,
  initialCode = "",
}: PairDeviceDialogProps) {
  const organizationsResult = useAtomValue(organizationsAtom);
  const organizations = AsyncResult.isSuccess(organizationsResult)
    ? organizationsResult.value
    : [];
  const activeOrgId = useActiveOrgId();
  const lookup = useAtomSet(lookupDeviceCodeAtom, { mode: "promise" });
  const approve = useAtomSet(approveDeviceCodeAtom, { mode: "promise" });
  const deny = useAtomSet(denyDeviceCodeAtom, { mode: "promise" });
  const [state, setState] = useState<Step>({ step: "code" });
  const [code, setCode] = useState(initialCode);
  const [chosenOrgId, setChosenOrgId] = useState<OrgId | undefined>(undefined);
  const [busy, setBusy] = useState<Busy | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [now, setNow] = useState(() => Date.now());
  const reviewing = state.step === "review";

  useEffect(() => {
    if (!reviewing) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [reviewing]);

  const orgId = chosenOrgId ?? activeOrgId;
  const remaining =
    state.step === "review"
      ? DateTime.toEpochMillis(state.preview.expiresAt) - now
      : 0;
  const devicesResult = useAtomValue(
    state.step === "code" || orgId === undefined
      ? idleDevicesAtom
      : devicesAtom(orgId),
  );
  const devices = AsyncResult.isSuccess(devicesResult)
    ? devicesResult.value
    : [];
  const idsBeforeApproval =
    state.step === "approved" ? state.idsBeforeApproval : undefined;
  const joined =
    state.step !== "approved" || idsBeforeApproval === undefined
      ? undefined
      : devices.find(
          (device) =>
            device.name === state.name && !idsBeforeApproval.has(device.id),
        );

  const close = () => {
    if (busy === undefined) onOpenChange(false);
  };

  const submitCode = (value: string) => {
    if (value.trim() === "" || busy !== undefined) return;
    setBusy("lookup");
    setError(undefined);
    lookup({ payload: { userCode: value } })
      .then((preview) =>
        setState({
          step: "review",
          preview,
          name: preview.hostname,
          confirmed: false,
        }),
      )
      .catch((cause) =>
        setError(pairingErrorMessage(cause, "Could not look up this code")),
      )
      .finally(() => setBusy(undefined));
  };

  const approveCode = () => {
    if (
      state.step !== "review" ||
      orgId === undefined ||
      !state.confirmed ||
      busy !== undefined
    )
      return;
    const name =
      state.name.trim() === "" ? state.preview.hostname : state.name.trim();
    setBusy("approve");
    setError(undefined);
    approve({ params: { orgId }, payload: { userCode: code, name } })
      .then(() =>
        setState({
          step: "approved",
          name,
          idsBeforeApproval: AsyncResult.isSuccess(devicesResult)
            ? new Set(devices.map((device) => device.id))
            : undefined,
        }),
      )
      .catch((cause) =>
        setError(pairingErrorMessage(cause, "Could not approve this code")),
      )
      .finally(() => setBusy(undefined));
  };

  const denyCode = () => {
    if (busy !== undefined) return;
    setBusy("deny");
    setError(undefined);
    deny({ payload: { userCode: code } })
      .then(() => setState({ step: "denied" }))
      .catch((cause) =>
        setError(pairingErrorMessage(cause, "Could not deny this code")),
      )
      .finally(() => setBusy(undefined));
  };

  const errorLine =
    error === undefined ? null : (
      <p className="text-sm font-normal text-destructive">{error}</p>
    );
  const awaitingMachine = state.step === "approved" && joined === undefined;
  const orgName = organizations.find((org) => org.id === orgId)?.name;
  const wait: { status: ConnectWaitStatus; title: string; description: string } =
    state.step === "denied"
      ? {
          status: "stopped",
          title: "Device denied",
          description:
            "The machine stops asking, pairing it later needs a fresh code",
        }
      : joined === undefined
        ? error === undefined
          ? {
              status: "pending",
              title: "Waiting for the machine to connect",
              description:
                "Deny cancels this approval until the machine connects",
            }
          : {
              status: "failed",
              title: error,
              description: "The approval still stands, deny again to cancel it",
            }
        : {
            status: "success",
            title: "Machine connected",
            description: `${joined.name} joined ${orgName ?? "your organization"}`,
          };

  const denyButton = (
    <Button
      variant="ghost"
      intent="danger"
      disabled={busy === "deny"}
      aria-busy={busy === "deny"}
      onClick={denyCode}
    >
      {busy === "deny" ? "Denying" : "Deny"}
    </Button>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => busy === undefined && onOpenChange(next)}
    >
      <DialogContent>
        {state.step === "code" ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitCode(code);
            }}
          >
            <DialogHeader>
              <DialogTitle>Pair a device</DialogTitle>
              <DialogDescription>
                Approve a machine asking to join Capy
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <Field label="Pairing code">
                <Input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="BCDF-GHJK"
                  aria-label="Pairing code"
                  className="uppercase"
                  maxLength={64}
                  autoFocus
                  required
                />
              </Field>
              <p className="text-sm font-normal text-muted-foreground-2">
                The eight characters shown on the machine you are pairing
              </p>
              {errorLine}
            </DialogBody>
            <ConnectFooter help={pairingHelp} onCancel={close}>
              <Button
                type="submit"
                intent="accent"
                disabled={busy === "lookup"}
                aria-busy={busy === "lookup"}
              >
                {busy === "lookup" ? "Checking" : "Continue"}
              </Button>
            </ConnectFooter>
          </form>
        ) : state.step === "review" ? (
          <>
            <DialogHeader>
              <DialogTitle>Pair a device</DialogTitle>
              <DialogDescription>
                Reported by the requesting machine, not verified
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <div className="flex flex-col gap-2 rounded-(--radius-card) bg-secondary px-3 py-2.5">
                <PreviewRow label="Hostname" value={state.preview.hostname} />
                <PreviewRow
                  label="System"
                  value={`${state.preview.os}/${state.preview.arch}`}
                />
                <PreviewRow
                  label="Expires"
                  value={
                    remaining > 0
                      ? `in ${formatCountdown(remaining)}`
                      : "Expired"
                  }
                />
              </div>
              {organizations.length > 1 && (
                <Field label="Organization">
                  <MenuSelect
                    items={Object.fromEntries(
                      organizations.map((org) => [org.id, org.name]),
                    )}
                    value={orgId ?? null}
                    onValueChange={(value) =>
                      value !== null && setChosenOrgId(value as OrgId)
                    }
                  >
                    <MenuSelectTrigger className="w-full">
                      <MenuSelectValue />
                    </MenuSelectTrigger>
                    <MenuSelectContent>
                      {organizations.map((org) => (
                        <MenuSelectItem key={org.id} value={org.id}>
                          {org.name}
                        </MenuSelectItem>
                      ))}
                    </MenuSelectContent>
                  </MenuSelect>
                </Field>
              )}
              <Field label="Device name">
                <Input
                  value={state.name}
                  onChange={(event) =>
                    setState({ ...state, name: event.target.value })
                  }
                  placeholder={state.preview.hostname}
                  aria-label="Device name"
                  maxLength={255}
                />
              </Field>
              <label className="flex cursor-pointer items-start gap-2.5">
                <Checkbox
                  checked={state.confirmed}
                  aria-label="Confirm the machine is yours"
                  className="mt-0.5"
                  onCheckedChange={(checked) =>
                    setState({ ...state, confirmed: checked === true })
                  }
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">
                    This code is on a machine I am setting up right now
                  </span>
                  <span className="text-sm font-normal text-muted-foreground-2">
                    Never approve a code someone sent you
                  </span>
                </span>
              </label>
              {errorLine}
              <Button
                size="base"
                variant="link"
                onClick={() => setState({ step: "code" })}
              >
                Use a different code
              </Button>
            </DialogBody>
            <ConnectFooter
              help={pairingHelp}
              onCancel={close}
              secondary={denyButton}
            >
              <Button
                intent="accent"
                disabled={
                  !state.confirmed ||
                  orgId === undefined ||
                  remaining <= 0 ||
                  busy === "approve"
                }
                aria-busy={busy === "approve"}
                onClick={approveCode}
              >
                {busy === "approve" ? "Approving" : "Approve"}
              </Button>
            </ConnectFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Pair a device</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <ConnectWait
                status={wait.status}
                title={wait.title}
                description={wait.description}
                action={null}
              />
            </DialogBody>
            <ConnectFooter
              help={pairingHelp}
              onCancel={close}
              cancelLabel="Done"
              secondary={awaitingMachine && denyButton}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
