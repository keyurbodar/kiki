import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Checkbox } from "@/primitives/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/primitives/dialog";
import { Input } from "@/primitives/input";
import { Label } from "@/primitives/label";
import { OtpInput } from "@/primitives/otp-input";
import { generateBackupCodes } from "./security-model";

const sampleEnrollment = {
  secret: "JBSWY3DPEHPK3PXP",
  uri: "otpauth://totp/Capy:alex@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Capy",
};

export function BackupCodesList({ codes }: { codes: string[] }) {
  const text = codes.join("\n");
  return (
    <div className="flex flex-col gap-2">
      <Card>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 px-4 py-3">
          {codes.map((code) => (
            <li
              key={code}
              className="text-sm font-normal text-foreground tabular-nums"
            >
              {code}
            </li>
          ))}
        </ul>
      </Card>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={() =>
            void navigator.clipboard
              ?.writeText(text)
              .then(() => toast.success("Backup codes copied"))
          }
        >
          Copy
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={() => {
            const url = URL.createObjectURL(
              new Blob([`${text}\n`], { type: "text/plain" }),
            );
            const link = document.createElement("a");
            link.href = url;
            link.download = "capy-backup-codes.txt";
            link.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download
        </Button>
      </div>
    </div>
  );
}

export function TotpSetupDialog({
  open,
  onOpenChange,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}) {
  const [code, setCode] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [saved, setSaved] = useState(false);
  const reset = () => {
    setCode("");
    setShowKey(false);
    setCodes(null);
    setSaved(false);
  };
  const verify = (value: string) => {
    if (value.length !== 6) return;
    setCodes(generateBackupCodes());
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogOverlay />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Set up authenticator app</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {codes !== null ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-normal text-muted-foreground-1">
                Each code works once if you lose your app
              </p>
              <BackupCodesList codes={codes} />
              <Label className="flex items-center gap-2">
                <Checkbox
                  checked={saved}
                  onCheckedChange={(c) => setSaved(c === true)}
                />
                I saved these codes
              </Label>
              <Button
                intent="accent"
                size="base"
                className="w-full"
                disabled={!saved}
                onClick={() => {
                  reset();
                  onComplete();
                }}
              >
                Continue
              </Button>
            </div>
          ) : (
            <form
              className="flex flex-col items-center gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                verify(code);
              }}
            >
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="link"
                  size="auto-sm"
                  render={<a href={sampleEnrollment.uri} />}
                >
                  Open in authenticator app
                </Button>
                {showKey ? (
                  <Input
                    className="w-72"
                    font="mono"
                    readOnly
                    aria-label="setup key"
                    value={sampleEnrollment.secret}
                  />
                ) : (
                  <Button
                    type="button"
                    variant="link"
                    size="auto-sm"
                    onClick={() => setShowKey(true)}
                  >
                    Enter a key instead
                  </Button>
                )}
              </div>
              <OtpInput className="w-full">
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  aria-label="Verification code"
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCode(value);
                    verify(value);
                  }}
                />
              </OtpInput>
              <Button
                type="submit"
                intent="accent"
                size="base"
                className="w-full"
                disabled={code.length !== 6}
              >
                Continue
              </Button>
            </form>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export function BackupCodesDialog({
  codes,
  onClose,
}: {
  codes: string[] | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={codes !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogOverlay />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New backup codes</DialogTitle>
          <DialogDescription>
            Your old codes stop working, save these now
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {codes === null ? null : <BackupCodesList codes={codes} />}
        </DialogBody>
        <DialogFooter>
          <Button intent="accent" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
