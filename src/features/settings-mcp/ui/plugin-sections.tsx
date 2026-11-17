import { useState } from "react";
import { SettingsSection } from "@/components/settings-page";
import { Badge } from "@/primitives/badge";
import { Card } from "@/primitives/card";
import { Input } from "@/primitives/input";
import { SettingsRow } from "@/primitives/settings-row";
import { pluralize } from "../model/status.ts";
import type { PluginSkill } from "../model/types.ts";
import { cx } from "./cx.ts";

const visibleSkillCount = 5;

export function WarningsSection({
  warnings,
}: {
  readonly warnings: ReadonlyArray<string>;
}) {
  if (warnings.length === 0) return null;
  return (
    <SettingsSection
      title="Warnings"
      description="Parts of this plugin Capy skipped when it read it"
    >
      <Card rows>
        {warnings.map((warning) => (
          <SettingsRow
            key={warning}
            label={
              <span className="font-normal break-words text-muted-foreground">
                {warning}
              </span>
            }
          />
        ))}
      </Card>
    </SettingsSection>
  );
}

export function SkillsSection({
  skills,
  added,
  mark = "New",
}: {
  readonly skills: ReadonlyArray<PluginSkill>;
  readonly added?: ReadonlySet<string>;
  readonly mark?: string;
}) {
  const [filter, setFilter] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  if (skills.length === 0) return null;
  const needle = filter.trim().toLowerCase();
  const matching = skills
    .filter(
      (skill) =>
        needle === "" ||
        skill.name.toLowerCase().includes(needle) ||
        skill.description.toLowerCase().includes(needle),
    )
    .toSorted(
      (a, b) =>
        Number(added?.has(b.name) === true) -
        Number(added?.has(a.name) === true),
    );
  const shown =
    showAll || needle !== "" ? matching : matching.slice(0, visibleSkillCount);
  const hidden = matching.length - shown.length;
  const toggle = (name: string) => {
    const next = new Set(expanded);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setExpanded(next);
  };
  return (
    <SettingsSection
      title={
        <span className="flex items-center gap-1.5">
          Skills
          <span className="text-sm font-normal whitespace-nowrap text-muted-foreground-2">
            {pluralize(skills.length, "skill")}
          </span>
        </span>
      }
      action={
        skills.length > 1 ? (
          <Input
            size="sm"
            value={filter}
            placeholder="Filter skills"
            aria-label="Filter skills"
            className="w-48 max-sm:w-full"
            onChange={(event) => setFilter(event.target.value)}
          />
        ) : undefined
      }
    >
      <Card rows>
        {matching.length === 0 && (
          <p className="p-6 text-center text-sm font-normal text-muted-foreground-2">
            No skills match {filter.trim()}
          </p>
        )}
        {shown.map((skill) => {
          const open = expanded.has(skill.name);
          return (
            <button
              key={skill.name}
              type="button"
              aria-expanded={open}
              className="flex min-w-0 flex-col px-4 py-2.5 text-left transition-colors duration-fast hover:bg-card-hover focus-visible:outline-ring-inset"
              onClick={() => toggle(skill.name)}
            >
              <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
                <span className="truncate">{skill.name}</span>
                {added?.has(skill.name) === true && (
                  <Badge size="sm" color="accent">
                    {mark}
                  </Badge>
                )}
              </span>
              <span
                className={cx(
                  "text-xs font-normal text-muted-foreground-2",
                  open ? "break-words" : "truncate",
                )}
              >
                {skill.description}
              </span>
            </button>
          );
        })}
        {hidden > 0 && (
          <button
            type="button"
            className="px-4 py-2.5 text-left text-sm font-normal text-muted-foreground-1 transition-colors duration-fast hover:text-foreground focus-visible:outline-ring-inset"
            onClick={() => setShowAll(true)}
          >
            Show {hidden} more
          </button>
        )}
      </Card>
    </SettingsSection>
  );
}

export function SecretFields({
  secrets,
  values,
  onChange,
}: {
  readonly secrets: Readonly<
    Record<
      string,
      { readonly description: string; readonly optional?: boolean }
    >
  >;
  readonly values: Readonly<Record<string, string>>;
  readonly onChange: (values: Readonly<Record<string, string>>) => void;
}) {
  return Object.entries(secrets).map(([name, secret]) => (
    <label key={name} className="flex flex-col gap-1.5 p-4">
      <span className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">{name}</span>
        {secret.optional === true && <Badge size="sm">Optional</Badge>}
      </span>
      {secret.description !== "" && (
        <span className="text-sm font-normal text-muted-foreground-2">
          {secret.description}
        </span>
      )}
      <Input
        type="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-1p-ignore
        data-lpignore="true"
        className="mt-1 [-webkit-text-security:disc]"
        value={values[name] ?? ""}
        onChange={(event) =>
          onChange({ ...values, [name]: event.target.value })
        }
      />
    </label>
  ));
}
