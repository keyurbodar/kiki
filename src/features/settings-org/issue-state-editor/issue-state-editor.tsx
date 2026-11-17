import { useState } from "react";
import { toast } from "sonner";
import {
  IssueColorSwatchPicker,
  isIssueColorKey,
} from "@/components/issue-states";
import { errorMessage } from "@/lib/billing";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Drawer, DrawerContent } from "@/primitives/drawer";
import { Input } from "@/primitives/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import type { IssueState } from "../issue-states-page/data";
import { stateIconGlyph, stateIcons } from "./state-icons";

export type StateEditorTarget =
  | { readonly mode: "new" }
  | {
      readonly mode: "edit";
      readonly state: IssueState;
      readonly lastOfType: boolean;
    };

export type EditorFormProps = {
  target: StateEditorTarget;
  onClose: () => void;
  onSubmit: (
    name: string,
    icon: string,
    color: string,
    type: "open" | "closed",
  ) => Promise<unknown>;
  errorFallback: string;
};

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export function EditorForm({
  target,
  onClose,
  onSubmit,
  errorFallback,
}: EditorFormProps) {
  const state = target.mode === "edit" ? target.state : undefined;
  const [name, setName] = useState(state?.name ?? "");
  const [look, setLook] = useState({
    icon: state?.icon ?? "empty",
    color: state?.color ?? "gray",
  });
  const [type, setType] = useState<"open" | "closed">(state?.type ?? "open");
  const [pending, setPending] = useState(false);
  const locked = target.mode === "edit" && target.lastOfType;
  const trimmed = name.trim();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (trimmed === "" || pending) return;
    setPending(true);
    onSubmit(trimmed, look.icon, look.color, type).then(
      onClose,
      (error: unknown) => {
        setPending(false);
        toast.error(errorMessage(error, errorFallback));
      },
    );
  };

  return (
    <form className="contents" onSubmit={submit}>
      <DialogHeader>
        <DialogTitle>
          {target.mode === "new" ? "New state" : "Edit state"}
        </DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4 px-5 py-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="issue-state-name"
            className="text-sm font-medium text-foreground"
          >
            Name
          </label>
          <div className="flex items-center gap-2">
            <IssueStateLookPicker look={look} onChange={setLook}>
              <Button
                type="button"
                variant="outline"
                size="icon-base"
                aria-label="Icon and color"
              >
                {stateIconGlyph(look.icon, look.color)}
              </Button>
            </IssueStateLookPicker>
            <Input
              id="issue-state-name"
              placeholder="State name"
              maxLength={64}
              value={name}
              autoFocus={target.mode === "new"}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Type</span>
          <fieldset className="-mx-1 flex items-center gap-1">
            <legend className="sr-only">Type</legend>
            {(["open", "closed"] as const).map((option) => (
              <Button
                key={option}
                type="button"
                variant="ghost"
                size="sm"
                data-selected={type === option || undefined}
                aria-pressed={type === option}
                disabled={locked && option !== state?.type}
                title={
                  locked && option !== state?.type
                    ? `Every organization needs one ${state?.type} state`
                    : undefined
                }
                onClick={() => setType(option)}
              >
                {option === "open" ? "Open" : "Closed"}
              </Button>
            ))}
          </fieldset>
          <p className="text-xs font-normal text-muted-foreground-2">
            Closed issues leave counts and sit in folded sections at the bottom
          </p>
        </div>
      </div>
      <div className="flex flex-row justify-end gap-2 px-5 pb-4">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          intent="accent"
          loading={pending}
          disabled={trimmed === ""}
        >
          {target.mode === "new" ? "Create state" : "Save"}
        </Button>
      </div>
    </form>
  );
}

type Look = { readonly icon: string; readonly color: string };

function IssueStateLookPicker({
  look,
  onChange,
  children,
}: {
  look: Look;
  onChange: (look: Look) => void;
  children: React.ReactNode;
}) {
  const phone =
    typeof window !== "undefined" &&
    window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  const body = (
    <LookPickerBody look={look} onChange={onChange} drawer={phone} />
  );
  if (phone) {
    return (
      <Drawer>
        <DrawerTriggerLike>{children}</DrawerTriggerLike>
        <DrawerContent>
          <div className="flex flex-col px-3 pb-3">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Popover>
      <PopoverTrigger render={<span />} />
      {children}
      <PopoverContent align="start" className="w-72">
        {body}
      </PopoverContent>
    </Popover>
  );
}

function DrawerTriggerLike({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex">{children}</span>;
}

function LookPickerBody({
  look,
  onChange,
  drawer,
}: {
  look: Look;
  onChange: (look: Look) => void;
  drawer: boolean;
}) {
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const matches = stateIcons.filter(
    (item) =>
      item.label.toLowerCase().includes(term) || item.key.includes(term),
  );
  return (
    <div className="flex min-h-0 flex-col">
      <div className="-mx-1">
        <Input
          variant="blank"
          className="-mx-1"
          placeholder="Search icons"
          aria-label="Search icons"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div
        className={cx(
          "-mx-1 min-h-0 overflow-y-auto px-1",
          !drawer && "max-h-[34rem]",
        )}
      >
        {matches.length === 0 ? (
          <div className="px-2 py-3 text-center text-sm font-normal text-muted-foreground-2">
            No matching icons
          </div>
        ) : (
          <div
            role="radiogroup"
            aria-label="Icon"
            className={cx(
              "grid gap-0.5 pt-1.5",
              drawer ? "grid-cols-8" : "grid-cols-9",
            )}
          >
            {matches.map((item) => (
              <Button
                key={item.key}
                type="button"
                variant="ghost"
                size={drawer ? "icon-base" : "icon-sm"}
                role="radio"
                aria-checked={item.key === look.icon}
                aria-label={item.label}
                title={item.label}
                data-selected={item.key === look.icon || undefined}
                onClick={() => onChange({ ...look, icon: item.key })}
              >
                {stateIconGlyph(item.key, look.color)}
              </Button>
            ))}
          </div>
        )}
      </div>
      {isIssueColorKey(look.color) && (
        <IssueColorSwatchPicker
          value={look.color}
          onChange={(color) => onChange({ ...look, color })}
          size={drawer ? "icon-base" : "icon-sm"}
          className="-mx-2 mt-2 flex items-center justify-between border-t-hairline border-border-1 px-2 pt-2"
        />
      )}
    </div>
  );
}

export function StateEditorDialog({
  target,
  open,
  onClose,
  onSubmit,
}: {
  target: StateEditorTarget;
  open: boolean;
  onClose: () => void;
  onSubmit: EditorFormProps["onSubmit"];
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <EditorForm
          target={target}
          onClose={onClose}
          onSubmit={onSubmit}
          errorFallback={
            target.mode === "new"
              ? "Could not create the state"
              : "Could not save the state"
          }
        />
      </DialogContent>
    </Dialog>
  );
}
