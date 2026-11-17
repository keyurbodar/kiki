import { createLink } from "@tanstack/react-router";
import type { ComponentProps, ReactNode } from "react";
import { Icon } from "@/primitives/icon";
import { SettingsRow, SettingsRowLink } from "@/primitives/settings-row";

function RowBody({
  icon,
  label,
  description,
  descriptionTone = "muted",
}: {
  readonly icon?: ReactNode;
  readonly label: ReactNode;
  readonly description?: ReactNode;
  readonly descriptionTone?: "muted" | "strong";
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {icon !== undefined && (
        <div className="grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-foreground [&_svg:not([class*='size-'])]:size-4">
          {icon}
        </div>
      )}
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description !== undefined && description !== "" && (
          <div
            className={
              descriptionTone === "strong"
                ? "font-normal text-muted-foreground-1 text-xs"
                : "font-normal text-muted-foreground-2 text-xs"
            }
          >
            {description}
          </div>
        )}
      </div>
    </div>
  );
}

export interface McpRowProps
  extends Omit<ComponentProps<typeof SettingsRow>, "children"> {
  readonly icon?: ReactNode;
  readonly label: ReactNode;
  readonly description?: ReactNode;
  readonly descriptionTone?: "muted" | "strong";
  readonly children?: ReactNode;
}

export function McpRow({
  icon,
  label,
  description,
  descriptionTone,
  children,
  ...props
}: McpRowProps) {
  return (
    <SettingsRow
      className="group/row flex min-h-15 items-center justify-between gap-6 p-4"
      {...props}
    >
      <RowBody
        icon={icon}
        label={label}
        description={description}
        descriptionTone={descriptionTone}
      />
      {children !== undefined && children !== null && (
        <div className="relative flex shrink-0 items-center gap-2">
          {children}
        </div>
      )}
    </SettingsRow>
  );
}

const RouterRowLink = createLink(SettingsRowLink);

export type McpRowLinkProps = {
  readonly to: string;
  readonly params?: Readonly<Record<string, string>>;
  readonly id?: string;
  readonly icon?: ReactNode;
  readonly label: ReactNode;
  readonly description?: ReactNode;
  readonly children?: ReactNode;
};

export function McpRowLink({
  icon,
  label,
  description,
  children,
  to,
  params,
  id,
}: McpRowLinkProps) {
  return (
    <RouterRowLink
      id={id}
      to={to as never}
      params={params as never}
      className="flex min-h-15 items-center justify-between gap-6 p-4 transition-colors duration-100 outline-none select-none hover:bg-card-hover focus-visible:outline-ring-inset"
    >
      <RowBody icon={icon} label={label} description={description} />
      <div className="flex shrink-0 items-center gap-2">
        {children}
        <Icon
          name="chevron-right"
          size="sm"
          className="text-muted-foreground-3 max-sm:hidden"
        />
      </div>
    </RouterRowLink>
  );
}
