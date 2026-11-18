// biome-ignore-all lint/a11y/useSemanticElements: Capy's data table is ARIA divs on a CSS subgrid, and ChoiceRow is a radio button
// biome-ignore-all lint/a11y/useFocusableInteractive: table rows and headers are not interactive by themselves
import { cva, cx, type VariantProps } from "class-variance-authority";
import {
  type ComponentProps,
  createContext,
  type KeyboardEvent,
  type ReactNode,
  useContext,
} from "react";
import { Button, type ButtonProps } from "@/primitives/button";
import { Card, cardVariants } from "@/primitives/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { toast } from "@/primitives/toaster";

export const menuIconSlot =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

export const linkClass =
  "text-(--text-link) hover:underline underline-offset-2";

/** Capy's error copy: a typed API error's message, else the fallback. */
export const errorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== "object" || error === null) return fallback;
  const tagged = error as { _tag?: unknown; message?: unknown };
  return typeof tagged._tag === "string" &&
    tagged._tag.startsWith("capy/") &&
    typeof tagged.message === "string" &&
    tagged.message !== ""
    ? tagged.message
    : fallback;
};

export const showError = (error: unknown, fallback: string) =>
  toast.error(errorMessage(error, fallback));

export type ActionButtonProps = ButtonProps & {
  loading?: boolean;
  loadingLabel?: ReactNode;
};

/** Button with Capy's loading/loadingLabel props, mapped onto the contract Button. */
export function ActionButton({
  loading = false,
  loadingLabel,
  disabled,
  children,
  ...props
}: ActionButtonProps) {
  return (
    <Button
      {...props}
      disabled={disabled === true || loading}
      aria-busy={loading || undefined}
    >
      {loading && loadingLabel !== undefined ? loadingLabel : children}
    </Button>
  );
}

const tableVariants = cva(
  "isolate grid w-full overflow-x-auto overscroll-x-contain px-4 [--table-fluid-min:0rem] [--table-lead-min:0rem] max-md:[--table-fluid-min:8rem] max-md:[--table-lead-min:10rem] max-md:[--table-auto-min:auto] max-md:[clip-path:inset(0_0_0_0.5rem)]",
  {
    variants: {
      density: {
        directory: "[--table-row-h:--spacing(12.5)]",
        pick: "[--table-row-h:--spacing(11)]",
        compact: "[--table-row-h:--spacing(8)]",
      },
    },
    defaultVariants: { density: "directory" },
  },
);

const leadCell =
  "max-md:min-w-auto max-md:first:sticky max-md:first:left-0 max-md:first:z-(--z-table-lead) max-md:in-data-scrolled:first:bg-[var(--table-lead-bg,var(--panel))] max-md:in-data-scrolled:first:shadow-[-0.5rem_0_0_var(--table-lead-bg,var(--panel)),var(--spacing-hairline)_0_0_var(--border-1)]";

/** Capy's responsive grid columns: minmax(0,…) tracks get a mobile minimum. */
export function tableColumns(columns: string) {
  const expanded = columns.replace(
    /repeat\(\s*(\d+)\s*,((?:[^()]|\([^()]*\))*)\)/g,
    (_, count: string, track: string) =>
      Array.from({ length: Number(count) }, () => track.trim()).join(" "),
  );
  const tracks =
    expanded.match(/(?:[^\s(]+|\((?:[^()]|\([^()]*\))*\))+/g) ?? [];
  if (tracks.join("").replace(/\s+/g, "") !== expanded.replace(/\s+/g, ""))
    return columns;
  return tracks
    .map((track, index) => {
      const fluid = /^minmax\(\s*0(?:px)?\s*,(.+)\)$/.exec(track);
      if (fluid !== null)
        return `minmax(var(${index === 0 ? "--table-lead-min" : "--table-fluid-min"}),${fluid[1]})`;
      const auto = /^minmax\(\s*([\d.]+(?:px|rem))\s*,\s*auto\s*\)$/.exec(
        track,
      );
      return auto === null
        ? track
        : `minmax(var(--table-auto-min,${auto[1]}),auto)`;
    })
    .join(" ");
}

const TableCardContext = createContext(false);

export type DataTableProps = ComponentProps<"div"> &
  VariantProps<typeof tableVariants> & { columns: string; card?: boolean };

export function DataTable({
  columns,
  density,
  card = false,
  className,
  style,
  onScroll,
  ...props
}: DataTableProps) {
  const table = (
    <div
      role="table"
      data-slot="data-table"
      style={{ gridTemplateColumns: tableColumns(columns), ...style }}
      className={cx(
        tableVariants({ density }),
        card && "[--table-lead-bg:var(--card)]",
        className,
      )}
      onScroll={(event) => {
        event.currentTarget.toggleAttribute(
          "data-scrolled",
          event.currentTarget.scrollLeft > 0,
        );
        onScroll?.(event);
      }}
      {...props}
    />
  );
  return card ? (
    <TableCardContext.Provider value>
      <Card className="py-2">{table}</Card>
    </TableCardContext.Provider>
  ) : (
    table
  );
}

export function DataTableHeader({
  className,
  ...props
}: ComponentProps<"div">) {
  const inCard = useContext(TableCardContext);
  return (
    <div
      role="row"
      className={cx(
        "col-span-full grid h-8 grid-cols-subgrid items-center",
        inCard &&
          "relative mb-0.5 [--table-lead-bg:var(--section)] before:absolute before:inset-y-0 before:-inset-x-2 before:rounded-(--radius-card) before:bg-section [&>*]:relative",
        className,
      )}
      {...props}
    />
  );
}

export function DataTableHead({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      role="columnheader"
      className={cx(
        "flex min-w-0 items-center gap-0.5 pr-4 text-xs font-normal whitespace-nowrap text-muted-foreground-1 select-none",
        leadCell,
        className,
      )}
      {...props}
    />
  );
}

export function DataTableRow({
  interactive = true,
  className,
  ...props
}: ComponentProps<"div"> & { interactive?: boolean }) {
  return (
    <div
      role="row"
      className={cx(
        "relative col-span-full grid grid-cols-subgrid",
        interactive &&
          "before:absolute before:inset-y-0 before:-inset-x-2 before:rounded before:transition-colors before:duration-100 hover:before:bg-section",
        className,
      )}
      {...props}
    />
  );
}

export function DataTableCell({
  lead = false,
  className,
  ...props
}: ComponentProps<"div"> & { lead?: boolean }) {
  return (
    <div
      role="cell"
      className={cx(
        "relative flex min-h-(--table-row-h) min-w-0 items-center pr-4 text-xs font-normal text-muted-foreground-1",
        lead && "whitespace-nowrap text-foreground",
        leadCell,
        className,
      )}
      {...props}
    />
  );
}

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: ReactNode;
  intent?: ButtonProps["intent"];
  onConfirm: () => void;
  loading?: boolean;
  loadingLabel?: ReactNode;
  closeOnConfirm?: boolean;
};

/** Capy's ConfirmDialog API, composed from the dialog primitive. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  intent = "danger",
  onConfirm,
  loading = false,
  loadingLabel,
  closeOnConfirm = true,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="pb-2" />
        <DialogFooter>
          <Button
            variant="ghost"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <ActionButton
            intent={intent}
            loading={loading}
            loadingLabel={loadingLabel}
            onClick={() => {
              onConfirm();
              if (closeOnConfirm) onOpenChange(false);
            }}
          >
            {confirmLabel}
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function radioKeys(event: KeyboardEvent<HTMLDivElement>) {
  const radios = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>(
      '[role="radio"]:not(:disabled)',
    ),
  );
  if (radios.length === 0) return;
  const current = radios.indexOf(document.activeElement as HTMLButtonElement);
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? radios.length - 1
        : event.key === "ArrowDown" || event.key === "ArrowRight"
          ? (current + 1) % radios.length
          : event.key === "ArrowUp" || event.key === "ArrowLeft"
            ? (current - 1 + radios.length) % radios.length
            : undefined;
  if (next === undefined) return;
  event.preventDefault();
  radios[next]?.focus();
  radios[next]?.click();
}

export function ChoiceGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      tabIndex={-1}
      className="flex flex-col gap-2"
      onKeyDown={radioKeys}
    >
      {children}
    </div>
  );
}

export type ChoiceProps = {
  checked: boolean;
  onSelect: () => void;
  icon?: ReactNode;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  wrapDescription?: boolean;
};

export function Choice({
  checked,
  onSelect,
  icon,
  label,
  description,
  disabled = false,
  wrapDescription = false,
}: ChoiceProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      disabled={disabled}
      tabIndex={checked ? 0 : -1}
      onClick={onSelect}
      className={cx(
        cardVariants({ variant: "interactive" }),
        "text-left disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55",
        "w-full flex-row items-center gap-3 px-4 py-3",
      )}
    >
      {icon !== undefined && (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-(--radius-inner) bg-secondary text-muted-foreground-1 [&_svg]:size-(--icon-base)">
          {icon}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="truncate">{label}</span>
        </span>
        <span
          className={cx(
            "text-xs font-normal text-muted-foreground-1",
            !wrapDescription && "sm:truncate",
          )}
        >
          {description}
        </span>
      </span>
      <span
        className={cx(
          "flex size-4 shrink-0 items-center justify-center rounded-full border-hairline border-[light-dark(var(--border-3),var(--muted-foreground-3))] bg-input transition-colors duration-100",
          checked && "border-transparent bg-primary",
        )}
      >
        {checked && (
          <span className="size-1.5 rounded-full bg-primary-foreground" />
        )}
      </span>
    </button>
  );
}

/** Read-only value with a copy button (Capy's CopyField). */
export function CopyValue({ value, label }: { value: string; label: string }) {
  const copy = () =>
    navigator.clipboard.writeText(value).then(
      () => toast.success(`${label} copied`),
      () => toast.error(`Could not copy the ${label.toLowerCase()}`),
    );
  return (
    <span data-slot="copy-field" className="relative flex w-full min-w-0">
      <Input
        readOnly
        value={value}
        aria-label={label}
        spellCheck={false}
        autoComplete="off"
        className="text-ellipsis pr-8"
        onFocus={(event) => event.currentTarget.select()}
      />
      <span className="absolute inset-y-0 right-1 flex items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`Copy ${label}`}
          onClick={() => void copy()}
        >
          <Icon name="clipboard" />
        </Button>
      </span>
    </span>
  );
}
