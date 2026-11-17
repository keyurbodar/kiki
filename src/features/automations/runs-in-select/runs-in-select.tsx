import { type ReactNode, useState } from "react";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSearchRow,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
  MenuTrigger,
} from "@/primitives/menu";
import { SettingsRow } from "@/primitives/settings-row";
import {
  BubbleWide,
  Checkmark,
  ChevronDownSmall,
  ChevronRightSmall,
  EditSmall,
  Globe,
  Lock,
  Repeat,
} from "../automation-editor/icons";
import type { RunsIn } from "../automation-editor/model";
import {
  chevronClass,
  cx,
  menuCheckClass,
  menuEmptyClass,
  menuIconClass,
  menuLabelClass,
  menuSearchInputClass,
  menuTrailingClass,
  stopMenuKeys,
} from "../automation-editor/parts";
import {
  accessDescription,
  runsInDescription,
  runsInLabel,
  selectableThreads,
  threadLabel,
} from "./runs-in";
import { type ProjectThread, useProjectThreads } from "./use-threads";

export type RunsInSelectProps = {
  value: RunsIn;
  projectId?: string;
  automationId?: string;
  offerStanding: boolean;
  onValueChange: (value: RunsIn) => void;
  takenThreadIds?: ReadonlySet<string>;
};

const noneTaken: ReadonlySet<string> = new Set();

export function RunsInSelect({
  value,
  projectId,
  offerStanding,
  onValueChange,
  takenThreadIds = noneTaken,
}: RunsInSelectProps) {
  const threads = useProjectThreads(projectId);
  return (
    <RunsInMenu
      value={value}
      threads={threads}
      offerStanding={offerStanding}
      onValueChange={onValueChange}
      takenThreadIds={takenThreadIds}
    />
  );
}

export type RunsInMenuProps = {
  value: RunsIn;
  threads: ReadonlyArray<ProjectThread>;
  offerStanding: boolean;
  onValueChange: (value: RunsIn) => void;
  takenThreadIds: ReadonlySet<string>;
};

export function RunsInMenu({
  value,
  threads,
  offerStanding,
  onValueChange,
  takenThreadIds,
}: RunsInMenuProps) {
  const [query, setQuery] = useState("");
  const thread = threads.find(
    (candidate) => candidate.id === value.singleJamId,
  );
  const visible = selectableThreads(threads, takenThreadIds, query);
  const label = runsInLabel(value, thread);
  const ModeIcon = value.threadMode === "new" ? EditSmall : Repeat;
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="bare"
            size="auto-sm"
            aria-label="Runs in"
            className="-m-1 p-1"
          />
        }
      >
        <ModeIcon className="size-(--icon-sm) shrink-0" />
        <span className="min-w-0 truncate">{label}</span>
        {thread?.personal ? (
          <Lock className="size-(--icon-sm) shrink-0" />
        ) : null}
        <ChevronDownSmall className={chevronClass} />
      </MenuTrigger>
      <MenuContent className="w-60">
        <MenuItem
          onClick={() =>
            onValueChange({ threadMode: "new", singleJamId: null })
          }
        >
          <span className={menuIconClass}>
            <EditSmall />
          </span>
          <span className={menuLabelClass}>A new thread each run</span>
          {value.threadMode === "new" ? (
            <Checkmark className={cx("ml-auto", menuCheckClass)} />
          ) : null}
        </MenuItem>
        {offerStanding ? (
          <MenuItem
            onClick={() =>
              onValueChange({ threadMode: "single", singleJamId: null })
            }
          >
            <span className={menuIconClass}>
              <Repeat />
            </span>
            <span className={menuLabelClass}>One standing thread</span>
            {value.threadMode === "single" && value.singleJamId === null ? (
              <Checkmark className={cx("ml-auto", menuCheckClass)} />
            ) : null}
          </MenuItem>
        ) : null}
        <MenuSeparator />
        <MenuSub onOpenChange={(open) => (open ? undefined : setQuery(""))}>
          <MenuSubTrigger>
            <span className={menuIconClass}>
              <BubbleWide />
            </span>
            <span className={menuLabelClass}>An existing thread</span>
            <span className={menuTrailingClass}>
              {thread?.code ?? undefined}
              <ChevronRightSmall className={chevronClass} />
            </span>
          </MenuSubTrigger>
          <MenuContent className="w-80">
            <MenuSearchRow>
              <input
                className={menuSearchInputClass}
                placeholder="Search threads"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={stopMenuKeys}
              />
            </MenuSearchRow>
            {visible.length === 0 ? (
              <div className={menuEmptyClass}>No threads in this project</div>
            ) : (
              visible.map((candidate) => (
                <MenuItem
                  key={candidate.id}
                  onClick={() =>
                    onValueChange({
                      threadMode: "single",
                      singleJamId: candidate.id,
                    })
                  }
                >
                  <span className={menuIconClass}>
                    <BubbleWide />
                  </span>
                  <span className={menuLabelClass}>
                    {candidate.title ?? "Untitled thread"}
                  </span>
                  <span className={menuTrailingClass}>
                    {candidate.code}
                    {candidate.id === value.singleJamId ? (
                      <Checkmark className={menuCheckClass} />
                    ) : null}
                  </span>
                </MenuItem>
              ))
            )}
          </MenuContent>
        </MenuSub>
      </MenuContent>
    </Menu>
  );
}

export type RunsInRowsProps = {
  runsIn: RunsIn;
  control: ReactNode;
  project: ReactNode;
  thread?: ProjectThread;
};

export function RunsInRows({
  runsIn,
  control,
  project,
  thread,
}: RunsInRowsProps) {
  const label = threadLabel(runsIn, thread);
  const personal = thread?.personal === true;
  return (
    <>
      <SettingsRow
        label="Runs in"
        description={runsInDescription(runsIn, label)}
      >
        {control}
      </SettingsRow>
      {runsIn.singleJamId === null ? (
        <SettingsRow
          label="Project"
          description="Runs start their thread in this project"
        >
          {project}
        </SettingsRow>
      ) : label === null ? null : (
        <SettingsRow
          label="Access"
          description={accessDescription(label, personal)}
        >
          <Badge size="base">
            {personal ? (
              <Lock className="size-(--icon-xs)" />
            ) : (
              <Globe className="size-(--icon-xs)" />
            )}
            {personal ? "Private" : "Shared"}
          </Badge>
        </SettingsRow>
      )}
    </>
  );
}
