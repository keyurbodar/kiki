import { Button, ButtonIcon } from "@/primitives/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { Label } from "@/primitives/label";
import { OtpInput } from "@/primitives/otp-input";
import { type AccountEmail, keptEmailNote } from "./account";

export type ChangeEmailStep = "address" | "code" | "kept";
export type ChangeEmailBusy = "sending" | "confirming" | null;

export type ChangeEmailDialogProps = {
  open: boolean;
  step: ChangeEmailStep;
  currentEmail: string;
  newEmail: string;
  pendingEmail: string;
  keptEmails: AccountEmail[];
  code: string;
  busy: ChangeEmailBusy;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onNewEmailChange: (value: string) => void;
  onSubmitAddress: () => void;
  onCodeChange: (value: string) => void;
  onConfirm: (code: string) => void;
  onResend: () => void;
  onBack: () => void;
};

function FieldError({ children }: { children: string | null }) {
  if (children === null) return null;
  return (
    <p role="alert" className="text-xs text-destructive">
      {children}
    </p>
  );
}

export function ChangeEmailDialog(props: ChangeEmailDialogProps) {
  const { step, busy, error } = props;
  const pages = {
    address: {
      title: "Change email",
      body: (
        <>
          <p className="text-sm font-normal text-muted-foreground-1">
            We'll send a code to the new address, then it replaces{" "}
            <span className="text-foreground">{props.currentEmail}</span>
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="change-email-input">New email</Label>
            <Input
              id="change-email-input"
              type="email"
              autoComplete="email"
              // biome-ignore lint/a11y/noAutofocus: Capy focuses the address field when the dialog opens
              autoFocus
              value={props.newEmail}
              placeholder="you@company.com"
              disabled={busy !== null}
              aria-invalid={error !== null}
              onChange={(e) => props.onNewEmailChange(e.target.value)}
            />
            <FieldError>{error}</FieldError>
          </div>
        </>
      ),
      footer: (
        <>
          <Button
            variant="ghost"
            type="button"
            disabled={busy !== null}
            onClick={() => props.onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            intent="accent"
            aria-busy={busy === "sending" || undefined}
            disabled={props.newEmail.trim() === "" || busy === "sending"}
          >
            {busy === "sending" ? "Sending" : "Send code"}
          </Button>
        </>
      ),
    },
    code: {
      title: "Check your email",
      body: (
        <>
          <p className="text-sm font-normal text-muted-foreground-1">
            Enter the 6-digit code sent to{" "}
            <span className="text-foreground">{props.pendingEmail}</span>
          </p>
          <div className="flex flex-col gap-1.5">
            <OtpInput
              value={props.code}
              onChange={(code) => {
                props.onCodeChange(code);
                if (code.length === 6) props.onConfirm(code);
              }}
              autoFocus
              invalid={error !== null}
              disabled={busy !== null}
            />
            <FieldError>{error}</FieldError>
          </div>
          <Button
            variant="link"
            size="auto-sm"
            type="button"
            className="self-start"
            disabled={busy !== null}
            onClick={props.onResend}
          >
            {busy === "sending" ? "Sending" : "Send a new code"}
          </Button>
        </>
      ),
      footer: (
        <Button
          type="submit"
          intent="accent"
          aria-busy={busy === "confirming" || undefined}
          disabled={props.code.length !== 6 || busy === "sending"}
        >
          {busy === "confirming" ? "Changing" : "Change email"}
        </Button>
      ),
    },
    kept: {
      title: "Email changed",
      body: (
        <>
          <p className="text-sm font-normal text-muted-foreground-1">
            <span className="text-foreground">{props.pendingEmail}</span> is now
            your primary email
          </p>
          {props.keptEmails.map((email) => (
            <p
              key={email.id}
              className="text-sm font-normal text-muted-foreground-1"
            >
              {keptEmailNote(email)}
            </p>
          ))}
        </>
      ),
      footer: (
        <Button
          type="submit"
          intent="accent"
          // biome-ignore lint/a11y/noAutofocus: Capy focuses Done on the last step
          autoFocus
        >
          Done
        </Button>
      ),
    },
  } as const;
  const page = pages[step];
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogOverlay />
      <DialogContent className="max-w-sm">
        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            if (step === "address") props.onSubmitAddress();
            if (step === "code") props.onConfirm(props.code);
            if (step === "kept") props.onOpenChange(false);
          }}
        >
          <DialogHeader>
            {step === "code" && (
              <Button
                variant="ghost"
                size="icon-sm"
                type="button"
                aria-label="Back"
                disabled={busy !== null}
                onClick={props.onBack}
              >
                <ButtonIcon>
                  <Icon name="chevron-left-medium" size="sm" />
                </ButtonIcon>
              </Button>
            )}
            <DialogTitle>{page.title}</DialogTitle>
          </DialogHeader>
          <DialogBody>{page.body}</DialogBody>
          <DialogFooter>{page.footer}</DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
