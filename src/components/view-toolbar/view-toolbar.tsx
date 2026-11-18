import type { ComponentProps, FormEvent, ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/primitives/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/primitives/context-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Input } from "@/primitives/input";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
  MenuTrigger,
} from "@/primitives/menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  type DateRange,
  dateRangeLabel,
  dateRangePresetLabels,
  dateRangePresets,
  isCustomDateRange,
} from "./date-range";

export const cx = (
  ...parts: ReadonlyArray<string | false | null | undefined>
) => parts.filter(Boolean).join(" ");

export const viewTabClassName = cx(
  "inline-flex h-(--h-control-sm) shrink-0 cursor-pointer items-center justify-center gap-1 rounded",
  "border-hairline border-border-2 bg-button px-2.5 text-xs font-medium whitespace-nowrap text-muted-foreground-1 shadow-plate",
  "outline-none select-none transition-colors duration-100 hover:bg-button-hover hover:text-foreground",
  "focus-visible:outline-ring-inset",
  "[&_svg]:size-(--icon-sm) [&_svg]:shrink-0",
);

export const viewToolbarIconButtonClassName = cx(
  viewTabClassName,
  "w-(--h-control-sm) px-0",
);

export const menuIconSlotClassName =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted";

export const menuCheckClassName = "size-(--icon-xs) shrink-0 text-foreground";

/** Icon nodes the toolbar draws. Consumers pass sprite icons; omitted ones draw nothing. */
export type ViewToolbarIcons = {
  readonly remove?: ReactNode;
  readonly check?: ReactNode;
  readonly display?: ReactNode;
  readonly calendar?: ReactNode;
  readonly rename?: ReactNode;
  readonly changeIcon?: ReactNode;
  readonly removeIcon?: ReactNode;
  readonly update?: ReactNode;
  readonly deleteView?: ReactNode;
};

export type ViewToolbarProps = ComponentProps<"div"> & {
  /** View tabs (ViewTab, SavedViewTab). Scrolls horizontally with a right fade. */
  tabs?: ReactNode;
  /** Trailing actions: new folder, filter menu, display menu. */
  actions?: ReactNode;
};

/** The row under the top bar: view tabs on the left, actions on the right. */
export function ViewToolbar({
  tabs,
  actions,
  className,
  children,
  ...props
}: ViewToolbarProps) {
  return (
    <div
      className={cx(
        "flex min-h-11 shrink-0 items-center gap-2 px-2",
        className,
      )}
      {...props}
    >
      {tabs === undefined ? null : (
        <div className="scrollbar-hide mask-fade-r-scroll flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-1.5 [--mask-fade-ramp:var(--mask-fade-ramp-toolbar)]">
          {tabs}
        </div>
      )}
      {children}
      {actions === undefined ? null : (
        <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
      )}
    </div>
  );
}

export type ViewTabProps = Omit<ComponentProps<"button">, "children"> & {
  label: ReactNode;
  icon?: ReactNode;
  active?: boolean;
  children?: ReactNode;
};

export function ViewTab({
  label,
  icon,
  active,
  className,
  children,
  ...props
}: ViewTabProps) {
  return (
    <button
      type="button"
      data-active={active ? "" : undefined}
      {...props}
      className={cx(
        viewTabClassName,
        active && "bg-secondary text-foreground shadow-none hover:bg-secondary",
        "disabled:pointer-events-none disabled:opacity-55",
        className,
      )}
    >
      {icon}
      {label}
      {children}
    </button>
  );
}

export type SavedView<Filters> = {
  readonly id: string;
  readonly name: string;
  readonly icon: string | null;
  readonly filters: Filters;
};

export type SavedViewUpdate<Filters> = Partial<
  Pick<SavedView<Filters>, "name" | "icon" | "filters">
>;

export type IconPickerSlot = {
  value: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (icon: string) => void;
};

export type SavedViewTabProps<Filters> = {
  view: SavedView<Filters>;
  active: boolean;
  currentFilters: Filters;
  onSelect: () => void;
  onUpdate: (update: SavedViewUpdate<Filters>) => void;
  onDelete: () => void;
  /** Draws a saved view's icon id. */
  renderIcon?: (icon: string) => ReactNode;
  /** The icon picker "Change icon" opens (Capy's ProjectIconPicker). */
  renderIconPicker?: (picker: IconPickerSlot) => ReactNode;
  icons?: ViewToolbarIcons;
};

export function SavedViewTab<Filters>({
  view,
  active,
  currentFilters,
  onSelect,
  onUpdate,
  onDelete,
  renderIcon,
  renderIconPicker,
  icons,
}: SavedViewTabProps<Filters>) {
  const [renaming, setRenaming] = useState(false);
  const [pickingIcon, setPickingIcon] = useState(false);
  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger className="shrink-0">
          <ViewTab
            label={view.name}
            icon={view.icon === null ? undefined : renderIcon?.(view.icon)}
            active={active}
            onClick={onSelect}
          />
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <MenuItem onClick={() => setRenaming(true)}>
            <span className={menuIconSlotClassName}>{icons?.rename}</span>
            Rename view
          </MenuItem>
          <MenuItem onClick={() => setPickingIcon(true)}>
            <span className={menuIconSlotClassName}>{icons?.changeIcon}</span>
            Change icon
          </MenuItem>
          {view.icon === null ? null : (
            <MenuItem onClick={() => onUpdate({ icon: null })}>
              <span className={menuIconSlotClassName}>{icons?.removeIcon}</span>
              Remove icon
            </MenuItem>
          )}
          <MenuItem onClick={() => onUpdate({ filters: currentFilters })}>
            <span className={menuIconSlotClassName}>{icons?.update}</span>
            Update with current filters
          </MenuItem>
          <MenuSeparator />
          <MenuItem intent="danger" onClick={onDelete}>
            <span className={menuIconSlotClassName}>{icons?.deleteView}</span>
            Delete view
          </MenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {renderIconPicker?.({
        value: view.icon ?? "star",
        open: pickingIcon,
        onOpenChange: setPickingIcon,
        onSelect: (icon) => onUpdate({ icon }),
      })}
      <SaveViewDialog
        open={renaming}
        onOpenChange={setRenaming}
        title="Rename view"
        submitLabel="Rename"
        initialName={view.name}
        onSave={(name) => onUpdate({ name })}
      />
    </>
  );
}

const chipSegmentClassName =
  "flex shrink-0 items-center gap-1 px-1.5 border-l-hairline border-border-2 first:border-l-0";

const chipButtonClassName = cx(
  chipSegmentClassName,
  "h-full cursor-pointer text-muted-foreground-2 outline-none transition-colors duration-100",
  "hover:bg-secondary hover:text-foreground",
  "focus-visible:outline-ring-inset",
);

const chipValueButtonClassName = cx(
  chipSegmentClassName,
  "h-full min-w-0 shrink cursor-pointer overflow-hidden font-medium text-foreground outline-none transition-colors duration-100",
  "hover:bg-secondary",
  "focus-visible:outline-ring-inset",
);

export type FilterSign = "positive" | "negative";

export type BinaryOperator = {
  readonly kind: "binary";
  readonly agreement: "is" | "are";
  readonly cardinality: "one" | "many";
  readonly sign: FilterSign;
  readonly onChange: (sign: FilterSign) => void;
};

export type FilterOperatorModel =
  | string
  | { readonly kind: "fixed"; readonly label: string }
  | BinaryOperator
  | {
      readonly kind: "choice";
      readonly current: string;
      readonly options: ReadonlyArray<{ value: string; label: string }>;
      readonly onPick: (value: string) => void;
    };

export const filterOperatorLabel = (
  operator: Pick<BinaryOperator, "agreement" | "cardinality" | "sign">,
  sign: FilterSign = operator.sign,
) =>
  operator.agreement === "are"
    ? sign === "positive"
      ? "are"
      : "are not"
    : sign === "negative"
      ? "is not"
      : operator.cardinality === "one"
        ? "is"
        : "is either of";

export type FilterOperatorProps = {
  property: string;
  operator: FilterOperatorModel;
  icons?: ViewToolbarIcons;
};

export function FilterOperator({
  property,
  operator,
  icons,
}: FilterOperatorProps) {
  const [open, setOpen] = useState(false);
  if (typeof operator === "string" || operator.kind === "fixed")
    return (
      <span className={cx(chipSegmentClassName, "text-muted-foreground-2")}>
        {typeof operator === "string" ? operator : operator.label}
      </span>
    );
  const items =
    operator.kind === "binary"
      ? (["positive", "negative"] as const).map((sign) => ({
          key: sign,
          label: filterOperatorLabel(operator, sign),
          checked: operator.sign === sign,
          pick: () => operator.onChange(sign),
        }))
      : operator.options.map((option) => ({
          key: option.value,
          label: option.label,
          checked: operator.current === option.value,
          pick: () => operator.onPick(option.value),
        }));
  const current = items.find((item) => item.checked)?.label ?? "";
  return (
    <Menu open={open} onOpenChange={setOpen}>
      <MenuTrigger
        render={
          <button
            type="button"
            aria-label={
              "Change " + property + " filter operator, currently " + current
            }
            className={chipButtonClassName}
          />
        }
      >
        {current}
      </MenuTrigger>
      <MenuContent
        align="start"
        className={operator.kind === "binary" ? "w-32" : "w-40"}
      >
        {items.map((item) => (
          <MenuItem
            key={item.key}
            closeOnClick={false}
            onClick={() => {
              setOpen(false);
              item.pick();
            }}
          >
            {item.label}
            {item.checked ? (
              <span className={cx("ml-auto", menuCheckClassName)}>
                {icons?.check}
              </span>
            ) : null}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}

export type FilterValueSelector = {
  readonly ariaLabel: string;
  readonly content: ReactNode;
  readonly contentClassName?: string;
};

export type FilterValueProps = {
  value: ReactNode;
  selector?: FilterValueSelector;
  onValueClick?: () => void;
};

export function FilterValue({
  value,
  selector,
  onValueClick,
}: FilterValueProps) {
  const [open, setOpen] = useState(false);
  if (onValueClick !== undefined)
    return (
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onValueClick}
        className={chipValueButtonClassName}
      >
        {value}
      </button>
    );
  if (selector === undefined)
    return (
      <span
        className={cx(
          chipSegmentClassName,
          "min-w-0 shrink overflow-hidden font-medium text-foreground",
        )}
      >
        {value}
      </span>
    );
  return (
    <Menu open={open} onOpenChange={setOpen}>
      <MenuTrigger
        render={
          <button
            type="button"
            aria-label={selector.ariaLabel}
            className={chipValueButtonClassName}
          />
        }
      >
        {value}
      </MenuTrigger>
      <MenuContent align="start" className={selector.contentClassName}>
        <SelectorContent key={open ? "open" : "closed"}>
          {selector.content}
        </SelectorContent>
      </MenuContent>
    </Menu>
  );
}

function SelectorContent({ children }: { children: ReactNode }) {
  return children;
}

export type FilterChipModel = {
  readonly key: string;
  readonly icon?: ReactNode;
  readonly property: string;
  readonly operator: FilterOperatorModel;
  readonly value: ReactNode;
  readonly selector?: FilterValueSelector;
  readonly onValueClick?: () => void;
  readonly onRemove: () => void;
};

export type FilterChipProps = {
  chip: FilterChipModel;
  icons?: ViewToolbarIcons;
};

export function FilterChip({ chip, icons }: FilterChipProps) {
  return (
    <span className="flex h-6 max-w-full shrink-0 items-center overflow-clip rounded border-hairline border-border-2 bg-card text-xs font-normal whitespace-nowrap shadow-plate">
      <span
        className={cx(
          chipSegmentClassName,
          "text-foreground [&_svg]:size-3 [&_svg]:text-icon-muted",
        )}
      >
        {chip.icon}
        {chip.property}
      </span>
      <FilterOperator
        property={chip.property}
        operator={chip.operator}
        icons={icons}
      />
      <FilterValue
        value={chip.value}
        selector={chip.selector}
        onValueClick={chip.onValueClick}
      />
      <button
        type="button"
        aria-label={"Remove " + chip.property + " filter"}
        onMouseDown={(event) => event.preventDefault()}
        className={chipButtonClassName}
        onClick={chip.onRemove}
      >
        {icons?.remove}
      </button>
    </span>
  );
}

export type FilterChipBarProps = {
  chips: ReadonlyArray<FilterChipModel>;
  /** Filters differ from the active view: shows Clear, and Save when onSave is set. */
  dirty: boolean;
  onClear: () => void;
  onSave?: () => void;
  leading?: ReactNode;
  after?: ReactNode;
  icons?: ViewToolbarIcons;
};

export function FilterChipBar({
  chips,
  dirty,
  onClear,
  onSave,
  leading,
  after,
  icons,
}: FilterChipBarProps) {
  return (
    <div className="flex shrink-0 items-center gap-2 px-2 pb-1.5">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {leading}
        {chips.map((chip) => (
          <FilterChip key={chip.key} chip={chip} icons={icons} />
        ))}
        {after}
      </div>
      {dirty ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <Button variant="ghost" size="xs" onClick={onClear}>
            Clear
          </Button>
          {onSave === undefined ? null : (
            <Button variant="solid" size="xs" onClick={onSave}>
              Save
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export type SaveViewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
  title?: string;
  submitLabel?: string;
  initialName?: string;
};

export function SaveViewDialog({
  open,
  onOpenChange,
  onSave,
  title = "Save view",
  submitLabel = "Save view",
  initialName = "",
}: SaveViewDialogProps) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get("name");
    if (typeof name !== "string" || name.trim().length === 0) return;
    onSave(name.trim());
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="px-4 py-2">
            <Input
              name="name"
              placeholder="View name"
              aria-label="View name"
              defaultValue={initialName}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button intent="accent" type="submit">
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type FilterKeyHintProps = { filterKey: string; value?: ReactNode };

/** The "key:" hint a submenu shows before its filter has a value. */
export function FilterKeyHint({ filterKey, value }: FilterKeyHintProps) {
  return (
    <>
      <span className="mr-1.5 text-muted-foreground-3 last:mr-0">
        {filterKey}:
      </span>
      {value === undefined ? null : <span>{value}</span>}
    </>
  );
}

export type MenuSubmenuProps = {
  icon?: ReactNode;
  label: ReactNode;
  value?: ReactNode;
  contentClassName?: string;
  children: ReactNode;
};

/** A submenu row: icon, label, and the current value on the right. */
export function MenuSubmenu({
  icon,
  label,
  value,
  contentClassName,
  children,
}: MenuSubmenuProps) {
  return (
    <MenuSub>
      <MenuSubTrigger>
        {icon === undefined ? null : (
          <span className={menuIconSlotClassName}>{icon}</span>
        )}
        <span className="min-w-0 truncate">{label}</span>
        {value === undefined ? null : (
          <span className="ml-auto flex min-w-0 items-center truncate pl-3 text-muted-foreground-2">
            {value}
          </span>
        )}
      </MenuSubTrigger>
      <MenuContent side="right" align="start" className={contentClassName}>
        {children}
      </MenuContent>
    </MenuSub>
  );
}

export type CustomRangeSlot = {
  from: string | null;
  to: string | null;
  onApply: (range: { from: string; to: string }) => void;
};

export type DateRangeItemsProps = {
  value: DateRange | null;
  onChange: (value: DateRange | null) => void;
  /** The custom range picker (Capy's DateRangePicker); the row is omitted without it. */
  renderCustom?: (custom: CustomRangeSlot) => ReactNode;
  icons?: ViewToolbarIcons;
};

export function DateRangeItems({
  value,
  onChange,
  renderCustom,
  icons,
}: DateRangeItemsProps) {
  const custom = value !== null && isCustomDateRange(value) ? value : null;
  return (
    <>
      {dateRangePresets.map((preset) => (
        <MenuItem
          key={preset}
          closeOnClick={false}
          onClick={() => onChange(value === preset ? null : preset)}
        >
          <span className={menuIconSlotClassName}>{icons?.calendar}</span>
          {dateRangePresetLabels[preset]}
          {value === preset ? (
            <span className={cx("ml-auto", menuCheckClassName)}>
              {icons?.check}
            </span>
          ) : null}
        </MenuItem>
      ))}
      {renderCustom === undefined ? null : (
        <>
          <MenuSeparator />
          <MenuSubmenu
            icon={icons?.calendar}
            label="Custom…"
            value={
              custom === null ? undefined : (
                <span className={menuCheckClassName}>{icons?.check}</span>
              )
            }
            contentClassName="w-64"
          >
            {renderCustom({
              from: custom?.from ?? null,
              to: custom?.to ?? null,
              onApply: (range) => onChange({ kind: "custom", ...range }),
            })}
          </MenuSubmenu>
        </>
      )}
    </>
  );
}

export type DateRangeSubmenuProps = DateRangeItemsProps & {
  icon?: ReactNode;
  label: ReactNode;
  /** Filter key shown as "key:" while no range is set. */
  hint?: string;
};

export function DateRangeSubmenu({
  icon,
  label,
  hint,
  value,
  ...items
}: DateRangeSubmenuProps) {
  const current = value === null ? undefined : dateRangeLabel(value);
  return (
    <MenuSubmenu
      icon={icon}
      label={label}
      value={
        hint === undefined || current !== undefined ? (
          current
        ) : (
          <FilterKeyHint filterKey={hint} />
        )
      }
      contentClassName="w-44"
    >
      <DateRangeItems value={value} {...items} />
    </MenuSubmenu>
  );
}

export type DisplayMenuProps = { children: ReactNode; icon?: ReactNode };

export function DisplayMenu({ children, icon }: DisplayMenuProps) {
  return (
    <Menu>
      <Tooltip>
        <TooltipTrigger
          render={
            <MenuTrigger
              render={
                <button
                  type="button"
                  aria-label="Display options"
                  className={viewToolbarIconButtonClassName}
                />
              }
            >
              {icon}
            </MenuTrigger>
          }
        />
        <TooltipContent side="bottom">Display</TooltipContent>
      </Tooltip>
      <MenuContent align="end" className="w-60">
        {children}
      </MenuContent>
    </Menu>
  );
}

export type DisplayChoiceSubProps<Key extends string> = {
  icon?: ReactNode;
  label: ReactNode;
  labels: Record<Key, string>;
  value: Key;
  onPick: (value: Key) => void;
  icons?: ViewToolbarIcons;
};

export function DisplayChoiceSub<Key extends string>({
  icon,
  label,
  labels,
  value,
  onPick,
  icons,
}: DisplayChoiceSubProps<Key>) {
  return (
    <MenuSubmenu
      icon={icon}
      label={label}
      value={labels[value]}
      contentClassName="w-44"
    >
      {(Object.keys(labels) as Key[]).map((key) => (
        <MenuItem key={key} onClick={() => onPick(key)}>
          {labels[key]}
          {value === key ? (
            <span className={cx("ml-auto", menuCheckClassName)}>
              {icons?.check}
            </span>
          ) : null}
        </MenuItem>
      ))}
    </MenuSubmenu>
  );
}

export type DisplayToggleProps = {
  icon?: ReactNode;
  label: ReactNode;
  checked: boolean;
  onToggle: () => void;
  icons?: ViewToolbarIcons;
};

export function DisplayToggle({
  icon,
  label,
  checked,
  onToggle,
  icons,
}: DisplayToggleProps) {
  return (
    <MenuItem closeOnClick={false} onClick={onToggle}>
      {icon === undefined ? null : (
        <span className={menuIconSlotClassName}>{icon}</span>
      )}
      {label}
      {checked ? (
        <span className={cx("ml-auto", menuCheckClassName)}>
          {icons?.check}
        </span>
      ) : null}
    </MenuItem>
  );
}

export type ViewToolbarIconButtonProps = ComponentProps<"button"> & {
  label: string;
};

/** Square toolbar button with a tooltip under it (New folder). */
export function ViewToolbarIconButton({
  label,
  className,
  children,
  ...props
}: ViewToolbarIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            className={cx(viewToolbarIconButtonClassName, className)}
            {...props}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
