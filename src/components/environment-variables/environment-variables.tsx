import type { ComponentProps, ReactNode } from "react";
import type { ProjectEnvironmentVariable } from "@/data/api/schemas/project-settings";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import { SettingsRow } from "@/primitives/settings-row";
import { MaskedValueRow, type MaskedValueState } from "../masked-value-row";

export type VariableScope = "shared" | "personal";

export const scopeCopy: Record<
  VariableScope,
  { readonly label: string; readonly description: string }
> = {
  shared: {
    label: "Shared variables",
    description: "Available to every thread in this project",
  },
  personal: {
    label: "Personal variables",
    description: "Available only to your threads, overriding shared names",
  },
};

export type EnvironmentVariablesProps = ComponentProps<"div">;

export function EnvironmentVariables(props: EnvironmentVariablesProps) {
  return <div data-slot="environment-variables" {...props} />;
}

export type VariableRowProps = Omit<ComponentProps<"div">, "onClick"> & {
  readonly variable?: ProjectEnvironmentVariable;
  readonly value?: MaskedValueState;
  readonly onRename?: () => void;
  readonly onDelete?: () => void;
  readonly children?: ReactNode;
};

export function VariableRow({
  variable,
  value,
  onRename,
  onDelete,
  children,
  ...props
}: VariableRowProps) {
  if (variable === undefined)
    return <div data-slot="variable-row" {...props} />;
  return (
    <div data-slot="variable-row" {...props}>
      <SettingsRow
        className="min-h-15"
        label={
          <span className="font-mono text-sm font-medium text-foreground">
            {variable.name}
          </span>
        }
        description={
          variable.description ??
          (variable.configured ? undefined : "Not set on this machine yet")
        }
        descriptionTone="muted"
      >
        {children}
        {value && <MaskedValueRow name={variable.name} value={value} />}
        <Menu>
          <MenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`${variable.name} actions`}
              />
            }
          >
            <Icon name="dot-grid-1x3-horizontal" className="size-(--icon-sm)" />
          </MenuTrigger>
          <MenuContent align="end" className="w-44">
            <MenuItem onClick={onRename}>
              <Icon name="pencil" className="size-(--icon-sm)" />
              Rename
            </MenuItem>
            <MenuItem intent="danger" onClick={onDelete}>
              <Icon name="trash-can" className="size-(--icon-sm)" />
              Delete
            </MenuItem>
          </MenuContent>
        </Menu>
      </SettingsRow>
    </div>
  );
}
