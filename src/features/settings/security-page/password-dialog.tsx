import { useState } from "react";
import { Button } from "@/primitives/button";
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

export type PasswordDialogProps = {
  mode: "set" | "change" | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function PasswordDialog({
  mode,
  onOpenChange,
  onSaved,
}: PasswordDialogProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const close = (open: boolean) => {
    if (!open) {
      setCurrent("");
      setNext("");
    }
    onOpenChange(open);
  };
  return (
    <Dialog open={mode !== null} onOpenChange={close}>
      <DialogOverlay />
      <DialogContent className="max-w-sm">
        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            onSaved();
            close(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {mode === "change" ? "Change password" : "Set password"}
            </DialogTitle>
            <DialogDescription>
              Use it with your email to sign in
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-3">
            {mode === "change" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="security-current-password">
                  Current password
                </Label>
                <Input
                  id="security-current-password"
                  type="password"
                  autoComplete="current-password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="security-new-password">New password</Label>
              <Input
                id="security-new-password"
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              intent="accent"
              disabled={next === "" || (mode === "change" && current === "")}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
