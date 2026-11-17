import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  SettingsLoadFailedRow,
  SettingsPage,
  SettingsSection,
} from "@/components/settings-page";
import { reactivityKeys } from "@/data/atoms/conventions";
import { issueStatesAtom } from "@/data/atoms/issues";
import {
  organizationsAtom,
  resolveActiveOrgId,
  selectedOrgIdAtom,
} from "@/data/atoms/session";
import { ApiClient } from "@/data/client/ApiClient";
import { errorMessage } from "@/lib/billing";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Card, CardListHeader } from "@/primitives/card";
import { DialogHeader, DialogTitle } from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuSeparator,
  ResponsiveMenuTrigger,
} from "@/primitives/responsive-menu";
import { SettingsRow } from "@/primitives/settings-row";
import { IssueLabelsSection } from "../issue-labels-section";
import { StateEditorDialog } from "../issue-state-editor";
import { stateIconGlyph } from "../issue-state-editor/state-icons";
import type { IssueState, StateCounts } from "./data";
import { decodeCounts, decodeStates, issueStateChange } from "./data";

const updateStateAtom = ApiClient.mutation("issues", "updateState");
const createStateAtom = ApiClient.mutation("issues", "createState");
const setDefaultAtom = ApiClient.mutation("issue-states", "setDefaultState");
const deleteStateAtom = ApiClient.mutation("issue-states", "deleteState");

const countLabel = (count: number) =>
  count === 1 ? "1 issue" : `${count} issues`;

export function SettingsIssueStatesPage() {
  const organizations = useAtomValue(organizationsAtom);
  const selected = useAtomValue(selectedOrgIdAtom);
  const orgId = resolveActiveOrgId(
    AsyncResult.isSuccess(organizations) ? organizations.value : [],
    selected,
  );
  if (orgId === undefined) return null;
  return <IssueStates orgId={orgId} />;
}

function IssueStates({ orgId }: { orgId: string }) {
  const statesResult = useAtomValue(issueStatesAtom(orgId as never));
  const refresh = useAtomRefresh(issueStatesAtom(orgId as never));
  const createState = useAtomSet(createStateAtom, { mode: "promise" });
  const updateState = useAtomSet(updateStateAtom, { mode: "promise" });
  const setDefault = useAtomSet(setDefaultAtom, { mode: "promise" });
  const deleteState = useAtomSet(deleteStateAtom, { mode: "promise" });
  const states = AsyncResult.isSuccess(statesResult)
    ? decodeStates(statesResult.value)
    : [];
  const [renaming, setRenaming] = useState<string | null>(null);
  const [editor, setEditor] = useState<
    | { mode: "new" }
    | { mode: "edit"; state: IssueState; lastOfType: boolean }
    | null
  >(null);
  const [deleting, setDeleting] = useState<IssueState | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const keys = [
    reactivityKeys.issueStates(orgId),
    reactivityKeys.issues(orgId),
  ];
  const countsResult = useAtomValue(
    ApiClient.query("issues", "stateCounts", {
      params: { orgId: orgId as never },
      reactivityKeys: keys,
    }),
  );
  const counts = AsyncResult.isSuccess(countsResult)
    ? decodeCounts(countsResult.value)
    : {};

  const lastOfType = (state: IssueState) =>
    states.filter((item) => item.type === state.type).length === 1;

  const setAsDefault = (state: IssueState) => {
    setDefault({
      params: { orgId, stateId: state.id },
      reactivityKeys: keys,
    }).catch((error: unknown) =>
      toast.error(errorMessage(error, "Could not change the default state")),
    );
  };

  const submitState = (
    name: string,
    icon: string,
    color: string,
    type: "open" | "closed",
  ) => {
    if (editor === null) return Promise.resolve();
    if (editor.mode === "new") {
      return createState({
        params: { orgId },
        payload: { name, type, icon, color },
        reactivityKeys: keys,
      });
    }
    return updateState({
      params: { orgId, stateId: editor.state.id },
      payload: issueStateChange(editor.state, { name, icon, color, type }),
      reactivityKeys: keys,
    });
  };

  const confirmDelete = (moveTo?: string) => {
    if (deleting === null) return;
    setDeletingBusy(true);
    deleteState({
      params: { orgId, stateId: deleting.id },
      query: moveTo === undefined ? { moveTo: "none" } : { moveTo },
      reactivityKeys: keys,
    })
      .then(() => {
        setDeleting(null);
        refresh();
      })
      .catch((error: unknown) =>
        toast.error(errorMessage(error, "Could not delete the state")),
      )
      .finally(() => setDeletingBusy(false));
  };

  const loadFailed = AsyncResult.isFailure(statesResult);

  return (
    <SettingsPage
      title="Issue states"
      description="The states every issue in this organization moves through, and the labels that tag them"
    >
      <SettingsSection
        title="States"
        description="Closed issues leave counts and sit in folded sections at the bottom"
      >
        <Card rows>
          {loadFailed ? (
            <SettingsLoadFailedRow
              label="Could not load issue states"
              onRetry={refresh}
            />
          ) : (
            <>
              <CardListHeader
                label={`${states.length} states`}
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditor({ mode: "new" })}
                  >
                    <Icon name="plus-large" />
                    Add state
                  </Button>
                }
              />
              {AsyncResult.isSuccess(statesResult) ? (
                <StateList
                  states={states}
                  counts={counts}
                  renaming={renaming}
                  onRename={setRenaming}
                  onRenameDone={() => setRenaming(null)}
                  onEdit={(state) =>
                    setEditor({
                      mode: "edit",
                      state,
                      lastOfType: lastOfType(state),
                    })
                  }
                  onSetDefault={setAsDefault}
                  onDelete={(state) => setDeleting(state)}
                  updateState={(id, payload) =>
                    updateState({
                      params: { orgId, stateId: id },
                      payload,
                      reactivityKeys: keys,
                    })
                  }
                />
              ) : (
                <div className="p-4">
                  <span className="text-sm text-muted-foreground-2">
                    Loading issue states
                  </span>
                </div>
              )}
            </>
          )}
        </Card>
      </SettingsSection>
      <SettingsSection
        title="Labels"
        description="Tag issues across projects, for customers, areas, or kinds of work"
      >
        <IssueLabelsSection />
      </SettingsSection>
      {editor !== null && (
        <StateEditorDialog
          key={`${editor.mode}:${editor.mode === "edit" ? editor.state.id : "new"}`}
          target={editor}
          open
          onClose={() => setEditor(null)}
          onSubmit={submitState}
        />
      )}
      <StateDeleteDialog
        state={deleting}
        states={states}
        count={deleting === null ? 0 : (counts[deleting.id] ?? 0)}
        open={deleting !== null}
        busy={deletingBusy}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </SettingsPage>
  );
}

function StateList({
  states,
  counts,
  renaming,
  onRename,
  onRenameDone,
  onEdit,
  onSetDefault,
  onDelete,
  updateState,
}: {
  states: ReadonlyArray<IssueState>;
  counts: StateCounts;
  renaming: string | null;
  onRename: (id: string) => void;
  onRenameDone: () => void;
  onEdit: (state: IssueState) => void;
  onSetDefault: (state: IssueState) => void;
  onDelete: (state: IssueState) => void;
  updateState: (
    id: string,
    payload: Record<string, string | undefined>,
  ) => Promise<unknown>;
}) {
  return (
    <div className="flex flex-col divide-y-hairline divide-border-1">
      {states.map((state) => (
        <StateRow
          key={state.id}
          state={state}
          count={counts[state.id]}
          editing={renaming === state.id}
          onRename={() => onRename(state.id)}
          onStopEditing={onRenameDone}
          onEdit={() => onEdit(state)}
          onSetDefault={() => onSetDefault(state)}
          onDelete={() => onDelete(state)}
          updateState={updateState}
        />
      ))}
    </div>
  );
}

function StateRow({
  state,
  count,
  editing,
  onRename,
  onStopEditing,
  onEdit,
  onSetDefault,
  onDelete,
  updateState,
}: {
  state: IssueState;
  count: number | undefined;
  editing: boolean;
  onRename: () => void;
  onStopEditing: () => void;
  onEdit: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
  updateState: (
    id: string,
    payload: Record<string, string | undefined>,
  ) => Promise<unknown>;
}) {
  return (
    <div className="group/row relative flex flex-col" data-state-id={state.id}>
      {editing ? (
        <InlineEditRow
          state={state}
          onDone={onStopEditing}
          updateState={updateState}
        />
      ) : (
        <SettingsRow
          label={
            <span className="flex items-center gap-2.5">
              {stateIconGlyph(state.icon, state.color)}
              {state.name}
              {state.isDefault && (
                <span className="text-xs font-normal text-muted-foreground-2">
                  Default
                </span>
              )}
            </span>
          }
          actions={
            <StateRowMenu
              state={state}
              onRename={onRename}
              onEdit={onEdit}
              onSetDefault={onSetDefault}
              onDelete={onDelete}
            />
          }
        >
          <span className="w-20 text-right text-xs font-normal text-muted-foreground-2 tabular-nums">
            {count === undefined ? null : countLabel(count)}
          </span>
          <span className="flex w-14 justify-end pointer-coarse:w-18">
            <Badge>{state.type === "open" ? "Open" : "Closed"}</Badge>
          </span>
        </SettingsRow>
      )}
    </div>
  );
}

function InlineEditRow({
  state,
  onDone,
  updateState,
}: {
  state: IssueState;
  onDone: () => void;
  updateState: (
    id: string,
    payload: Record<string, string | undefined>,
  ) => Promise<unknown>;
}) {
  const [name, setName] = useState(state.name);
  const [pending, setPending] = useState(false);
  const trimmed = name.trim();
  const save = () => {
    if (trimmed === "" || pending) return;
    const payload = issueStateChange(state, { name: trimmed });
    if (Object.keys(payload).length === 0) return onDone();
    setPending(true);
    updateState(state.id, payload).then(onDone, (error: unknown) => {
      setPending(false);
      toast.error(errorMessage(error, "Could not rename the state"));
    });
  };
  return (
    <div className="flex items-center gap-2 p-4">
      <span className="flex size-(--icon-sm) shrink-0 items-center justify-center">
        {stateIconGlyph(state.icon, state.color)}
      </span>
      <Input
        size="sm"
        value={name}
        maxLength={64}
        aria-label="State name"
        className="ml-0.5 max-w-72"
        autoFocus
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") save();
          if (event.key === "Escape") onDone();
        }}
      />
      <span className="flex-1" />
      <Button variant="ghost" size="sm" onClick={onDone}>
        Cancel
      </Button>
      <Button
        variant="solid"
        intent="accent"
        size="sm"
        loading={pending}
        disabled={trimmed === ""}
        onClick={save}
      >
        Save
      </Button>
    </div>
  );
}

const menuIconClass =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

function StateRowMenu({
  state,
  onRename,
  onEdit,
  onSetDefault,
  onDelete,
}: {
  state: IssueState;
  onRename: () => void;
  onEdit: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  return (
    <ResponsiveMenu>
      <ResponsiveMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${state.name} actions`}
          />
        }
      >
        <Icon name="dot-grid-1x3-horizontal" />
      </ResponsiveMenuTrigger>
      <ResponsiveMenuContent align="end" className="w-52">
        <ResponsiveMenuItem onClick={onRename}>
          <span className={menuIconClass}>
            <Icon name="pencil" />
          </span>
          Rename
        </ResponsiveMenuItem>
        <ResponsiveMenuItem onClick={onEdit}>
          <span className={menuIconClass}>
            <Icon name="color-palette" />
          </span>
          Change color and icon
        </ResponsiveMenuItem>
        <ResponsiveMenuItem disabled={state.isDefault} onClick={onSetDefault}>
          <span className={menuIconClass}>
            <Icon name="circle-check" />
          </span>
          {state.isDefault
            ? `Default ${state.type} state`
            : `Set as default ${state.type}`}
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

function StateDeleteDialog({
  state,
  states,
  count,
  open,
  busy,
  onCancel,
  onConfirm,
}: {
  state: IssueState | null;
  states: ReadonlyArray<IssueState>;
  count: number;
  open: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (moveTo?: string) => void;
}) {
  const [selected, setSelected] = useState<string | undefined>(undefined);
  if (state === null) return null;
  const alternatives = states.filter(
    (item) => item.id !== state.id && item.type === state.type,
  );
  if (count === 0) {
    return (
      <ConfirmDialog
        open={open}
        onOpenChange={(next) => !next && onCancel()}
        title={`Delete ${state.name}`}
        description="No issues are in this state"
        confirmLabel="Delete state"
        loading={busy}
        closeOnConfirm={false}
        onConfirm={() => onConfirm()}
      />
    );
  }
  return (
    <Popover open={open} onOpenChange={(next) => !next && onCancel()}>
      <PopoverTrigger render={<span />} />
      <PopoverContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{`Delete ${state.name}`}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 p-5">
          <p className="text-sm font-normal text-muted-foreground-2">
            {`${countLabel(count)} in ${state.name}, move ${count === 1 ? "it" : "them"} to another state first`}
          </p>
          <MenuSelectWrapper
            alternatives={alternatives}
            selected={selected}
            onSelect={setSelected}
          />
          <p className="text-xs font-normal text-muted-foreground-2">
            {`Defaults to the first ${state.type} state`}
          </p>
        </div>
        <div className="flex justify-end gap-2 px-5 pb-4">
          <Button variant="ghost" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            intent="danger"
            loading={busy}
            disabled={selected === undefined}
            onClick={() => onConfirm(selected)}
          >
            {`Move ${countLabel(count)} and delete`}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function MenuSelectWrapper({
  alternatives,
  selected,
  onSelect,
}: {
  alternatives: ReadonlyArray<IssueState>;
  selected: string | undefined;
  onSelect: (value: string | undefined) => void;
}) {
  const value = selected ?? alternatives[0]?.id;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">
        Move issues to
      </span>
      <Popover>
        <PopoverTrigger render={<span />} />
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={(event) => event.currentTarget.blur()}
        >
          {alternatives.find((item) => item.id === value)?.name ??
            "Choose a state"}
        </Button>
        <PopoverContent align="start" className="w-full">
          <div className="flex flex-col gap-0.5">
            {alternatives.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => onSelect(item.id)}
              >
                {stateIconGlyph(item.icon, item.color)}
                {item.name}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
