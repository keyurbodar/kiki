import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  IssueColorSwatchPicker,
  isIssueColorKey,
  issueColorStyles,
} from "@/components/issue-states";
import { SettingsLoadFailedRow } from "@/components/settings-page";
import { reactivityKeys } from "@/data/atoms/conventions";
import { issueLabelsAtom } from "@/data/atoms/issues";
import {
  organizationsAtom,
  resolveActiveOrgId,
  selectedOrgIdAtom,
} from "@/data/atoms/session";
import { ApiClient } from "@/data/client/ApiClient";
import { errorMessage } from "@/lib/billing";
import { Button } from "@/primitives/button";
import { Card, CardListHeader } from "@/primitives/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { Label } from "@/primitives/label";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuSeparator,
  ResponsiveMenuTrigger,
} from "@/primitives/responsive-menu";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { decodeLabels, type IssueLabel } from "../issue-states-page/data";

export type LabelEditorTarget =
  | { readonly mode: "new" }
  | { readonly mode: "edit"; readonly label: IssueLabel };

export function LabelEditorDialog({
  target,
  open,
  onClose,
  onSave,
}: {
  target: LabelEditorTarget;
  open: boolean;
  onClose: () => void;
  onSave: (name: string, color: string) => Promise<unknown>;
}) {
  const label = target.mode === "edit" ? target.label : undefined;
  const [name, setName] = useState(label?.name ?? "");
  const [color, setColor] = useState(label?.color ?? "gray");
  const [pending, setPending] = useState(false);
  const trimmed = name.trim();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (trimmed === "" || pending) return;
    setPending(true);
    onSave(trimmed, color).then(onClose, (error: unknown) => {
      setPending(false);
      toast.error(
        errorMessage(
          error,
          label === undefined
            ? "Could not create the label"
            : "Could not save the label",
        ),
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <form className="contents" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>
              {label === undefined ? "New label" : "Edit label"}
            </DialogTitle>
          </DialogHeader>
          <DialogBody spacing="relaxed">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="issue-label-name">Name</Label>
              <Input
                id="issue-label-name"
                placeholder="Label name"
                maxLength={64}
                value={name}
                autoFocus
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Color</Label>
              {isIssueColorKey(color) ? (
                <IssueColorSwatchPicker
                  value={color}
                  onChange={setColor}
                  size="icon-sm"
                  className="-mx-1 flex items-center gap-0.5"
                />
              ) : null}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              intent="accent"
              loading={pending}
              disabled={trimmed === ""}
            >
              {label === undefined ? "Create label" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const menuIconClass =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

function LabelRowMenu({
  label,
  onEdit,
  onDelete,
}: {
  label: IssueLabel;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <ResponsiveMenu>
      <ResponsiveMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${label.name} actions`}
          />
        }
      >
        <Icon name="dot-grid-1x3-horizontal" />
      </ResponsiveMenuTrigger>
      <ResponsiveMenuContent align="end" className="w-52">
        <ResponsiveMenuItem onClick={onEdit}>
          <span className={menuIconClass}>
            <Icon name="pencil" />
          </span>
          Rename and recolor
        </ResponsiveMenuItem>
        <ResponsiveMenuSeparator />
        <ResponsiveMenuItem intent="danger" onClick={onDelete}>
          <span className={menuIconClass}>
            <Icon name="trash-can" />
          </span>
          Delete
        </ResponsiveMenuItem>
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  );
}

export function IssueLabelsSection() {
  const organizations = useAtomValue(organizationsAtom);
  const selected = useAtomValue(selectedOrgIdAtom);
  const orgId = resolveActiveOrgId(
    AsyncResult.isSuccess(organizations) ? organizations.value : [],
    selected,
  );
  const labelsResult = useAtomValue(issueLabelsAtom(orgId as never));
  const createLabel = useAtomSet(
    ApiClient.mutation("issue-labels", "createLabel"),
    { mode: "promise" },
  );
  const updateLabel = useAtomSet(
    ApiClient.mutation("issue-labels", "updateLabel"),
    { mode: "promise" },
  );
  const deleteLabel = useAtomSet(
    ApiClient.mutation("issue-labels", "deleteLabel"),
    { mode: "promise" },
  );
  const [editor, setEditor] = useState<LabelEditorTarget | null>(null);
  const [deleting, setDeleting] = useState<IssueLabel | null>(null);
  const [busy, setBusy] = useState(false);

  if (orgId === undefined || labelsResult === undefined) return null;
  const labels = AsyncResult.isSuccess(labelsResult)
    ? decodeLabels(labelsResult.value)
    : [];
  const reactivityKeysForOrg = [reactivityKeys.issueLabels(orgId)];

  const save = (name: string, color: string) => {
    const target = editor;
    if (target === null) return Promise.resolve();
    if (target.mode === "edit") {
      return updateLabel({
        params: { orgId, labelId: target.label.id },
        payload: { name, color },
        reactivityKeys: reactivityKeysForOrg,
      });
    }
    return createLabel({
      params: { orgId },
      payload: { name, color },
      reactivityKeys: reactivityKeysForOrg,
    });
  };

  const confirmDelete = () => {
    if (deleting === null) return;
    setBusy(true);
    deleteLabel({
      params: { orgId, labelId: deleting.id },
      reactivityKeys: reactivityKeysForOrg,
    })
      .then(() => setDeleting(null))
      .catch((error: unknown) =>
        toast.error(errorMessage(error, "Could not delete the label")),
      )
      .finally(() => setBusy(false));
  };

  return (
    <>
      <Card rows>
        <CardListHeader
          label={labels.length === 1 ? "1 label" : `${labels.length} labels`}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditor({ mode: "new" })}
            >
              <Icon name="plus-large" />
              Add label
            </Button>
          }
        />
        {AsyncResult.isFailure(labelsResult) ? (
          <SettingsLoadFailedRow
            label="Could not load labels"
            onRetry={() => window.location.reload()}
          />
        ) : !AsyncResult.isSuccess(labelsResult) &&
          !AsyncResult.isFailure(labelsResult) ? (
          <div className="p-4">
            <SkeletonPanel className="h-4 w-2/3" />
          </div>
        ) : labels.length === 0 ? (
          <div className="flex flex-col gap-1 p-4">
            <span className="text-sm font-medium text-foreground">
              No labels yet
            </span>
            <span className="text-sm font-normal text-muted-foreground-2">
              Add one here, or create one from an issue's label picker
            </span>
          </div>
        ) : (
          labels.map((label) => (
            <div
              key={label.id}
              className="group/row flex items-center justify-between gap-6 p-4"
            >
              <span className="flex items-center gap-2.5">
                <span className="flex size-(--icon-sm) items-center justify-center">
                  <IssueLabelDot color={label.color} />
                </span>
                <span className="text-sm font-medium text-foreground">
                  {label.name}
                </span>
              </span>
              <LabelRowMenu
                label={label}
                onEdit={() => setEditor({ mode: "edit", label })}
                onDelete={() => setDeleting(label)}
              />
            </div>
          ))
        )}
      </Card>
      {editor !== null && (
        <LabelEditorDialog
          key={`${editor.mode}:${editor.mode === "edit" ? editor.label.id : "new"}`}
          target={editor}
          open
          onClose={() => setEditor(null)}
          onSave={save}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting === null ? "Delete label" : `Delete ${deleting.name}`}
        description="The label comes off every issue that has it"
        confirmLabel="Delete label"
        loading={busy}
        closeOnConfirm={false}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function IssueLabelDot({ color }: { color: string }) {
  const key = isIssueColorKey(color) ? color : "gray";
  const swatch = issueColorStyles[key].swatch;
  return (
    <span aria-hidden className={`size-2 shrink-0 rounded-full ${swatch}`} />
  );
}
