import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useState } from "react";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import {
  type DriveScopeFiles,
  driveScopesFilesAtom,
} from "@/data/atoms/agent-context";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Card, CardListHeader } from "@/primitives/card";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuTrigger,
} from "@/primitives/responsive-menu";
import { SettingsRow } from "@/primitives/settings-row";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import {
  menuItemIconClass,
  menuItemLabelClass,
  ProjectMenu,
  readSkillMeta,
  resultValue,
  useAgentScopes,
  useVolumeFile,
} from "../agent-scopes";
import { SkillSheet } from "./skill-sheet";
import {
  filterSkills,
  type ListedSkill,
  listSkills,
  skillsCountLabel,
} from "./skills";

const pageSize = 25;

type ListSearch = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

/** Capy's CardListHeader: a count, an optional search toggle and an action. */
function ListHeader({
  label,
  search,
  action,
}: {
  label: ReactNode;
  search?: ListSearch | undefined;
  action?: ReactNode;
}) {
  const [searching, setSearching] = useState(false);
  const open = search !== undefined && (searching || search.value !== "");
  return (
    <CardListHeader className="flex min-h-15 items-center justify-between gap-3 py-3 pr-2 pl-4">
      <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
        {open ? (
          <Input
            variant="blank"
            size="sm"
            className="-ml-2"
            autoFocus
            placeholder={search.placeholder}
            aria-label={search.placeholder}
            value={search.value}
            onChange={(event) => search.onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              search.onChange("");
              setSearching(false);
            }}
            onBlur={() => search.value === "" && setSearching(false)}
          />
        ) : (
          label
        )}
      </span>
      <div className="flex shrink-0 items-center gap-0.5">
        {search !== undefined && !open && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={search.placeholder}
            title={search.placeholder}
            onClick={() => setSearching(true)}
          >
            <Icon name="magnifying-glass" />
          </Button>
        )}
        {open && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Clear search"
            title="Clear search"
            onClick={() => {
              search.onChange("");
              setSearching(false);
            }}
          >
            <Icon name="cross-medium" />
          </Button>
        )}
        {action}
      </div>
    </CardListHeader>
  );
}

function SkillRow({
  skill,
  highlighted,
  onOpen,
}: {
  skill: ListedSkill;
  highlighted: boolean;
  onOpen: () => void;
}) {
  const { content, failed } = useVolumeFile(skill.entry);
  const description =
    content?.kind === "text"
      ? readSkillMeta(content.text)?.description
      : undefined;
  const missing = content !== undefined && description === undefined;
  return (
    <SettingsRow
      icon={skill.scope.icon}
      label={
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="truncate">{skill.name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground-2">
            {skill.scope.name}
          </span>
        </span>
      }
      description={
        content === undefined ? (
          failed ? (
            <span className="block truncate text-muted-foreground-3">
              Could not load this skill
            </span>
          ) : (
            <SkeletonPanel className="h-3 w-48" />
          )
        ) : missing ? (
          <span className="block truncate text-muted-foreground-3">
            No description, so Capy never picks it
          </span>
        ) : (
          <span className="block truncate">{description}</span>
        )
      }
      highlighted={highlighted}
      onClick={onOpen}
    >
      {missing ? (
        <Badge size="xs" color="warning">
          Not loaded
        </Badge>
      ) : (
        skill.hiddenBy !== undefined && (
          <Badge size="xs">Replaced by {skill.hiddenBy.name}</Badge>
        )
      )}
      <Icon
        name="chevron-right-small"
        className="size-(--icon-sm) shrink-0 text-muted-foreground-3"
      />
    </SettingsRow>
  );
}

type OpenSkill = { scopeKey: string; name?: string };

/** Capy's Skills settings page. */
export function SkillsPage() {
  const { projects, project, setProjectId, scopes, ready } = useAgentScopes();
  const result = useAtomValue(
    driveScopesFilesAtom(scopes.map((scope) => scope.filtersKey).join("\n")),
  );
  const files: ReadonlyArray<DriveScopeFiles | undefined> =
    resultValue(result) ?? [];
  const loading =
    !ready ||
    ((AsyncResult.isInitial(result) || AsyncResult.isWaiting(result)) &&
      files.length === 0);
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(pageSize);
  const [open, setOpen] = useState<OpenSkill>();
  const skills = listSkills(scopes, files);
  const matches = filterSkills(skills, query);
  const writable = scopes.filter((scope) => scope.readOnly !== true);
  const openIndex = scopes.findIndex((scope) => scope.key === open?.scopeKey);
  const openScope = scopes[openIndex];
  const openFiles = files[openIndex];
  return (
    <SettingsPage
      title="Skills"
      description="Instructions Capy uses when a task matches"
    >
      <SettingsSection
        id="skills-list"
        title="Skills in Drive"
        description="Capy sees each name and description, and opens a skill when a task matches"
        action={
          projects.length > 1 && project !== undefined ? (
            <ProjectMenu
              projects={projects}
              value={project}
              onChange={setProjectId}
            />
          ) : undefined
        }
      >
        <Card rows>
          <ListHeader
            label={
              loading ? (
                <SkeletonPanel className="h-4 w-16" />
              ) : (
                skillsCountLabel(skills.length)
              )
            }
            search={
              skills.length < 2 && query === ""
                ? undefined
                : {
                    value: query,
                    onChange: setQuery,
                    placeholder: "Search skills",
                  }
            }
            action={
              <ResponsiveMenu>
                <ResponsiveMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="New skill"
                      title="New skill"
                      disabled={loading}
                    >
                      <Icon name="plus-medium" />
                    </Button>
                  }
                />
                <ResponsiveMenuContent align="end" className="w-64 max-w-full">
                  {writable.map((scope) => (
                    <ResponsiveMenuItem
                      key={scope.key}
                      onClick={() => setOpen({ scopeKey: scope.key })}
                    >
                      <span className={menuItemIconClass}>{scope.icon}</span>
                      <span className={menuItemLabelClass}>{scope.name}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground-2">
                        {scope.kind}
                      </span>
                    </ResponsiveMenuItem>
                  ))}
                </ResponsiveMenuContent>
              </ResponsiveMenu>
            }
          />
          {loading &&
            [0, 1].map((index) => (
              <SettingsRow
                key={index}
                icon={<SkeletonPanel className="size-4" />}
                label={<SkeletonPanel className="h-4 w-32" />}
                description={<SkeletonPanel className="h-3 w-56" />}
              />
            ))}
          {matches.slice(0, visible).map((skill) => (
            <SkillRow
              key={`${skill.scope.key}:${skill.name}`}
              skill={skill}
              highlighted={
                open?.scopeKey === skill.scope.key && open.name === skill.name
              }
              onOpen={() =>
                setOpen({ scopeKey: skill.scope.key, name: skill.name })
              }
            />
          ))}
          {matches.length > visible && (
            <div className="flex justify-center p-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setVisible((count) => count + pageSize)}
              >
                Show more
              </Button>
            </div>
          )}
          {skills.length > 0 && matches.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground-2">
              No skills match
            </div>
          )}
        </Card>
      </SettingsSection>
      {openScope !== undefined && open !== undefined && (
        <SkillSheet
          scope={openScope}
          name={open.name}
          live={
            openFiles === undefined
              ? undefined
              : {
                  entries: openFiles.entries,
                  headDigest:
                    openFiles.volumes.find(
                      (volume) => volume.namespace === "artifacts",
                    )?.headDigest ?? null,
                }
          }
          onClose={() => setOpen(undefined)}
        />
      )}
    </SettingsPage>
  );
}
