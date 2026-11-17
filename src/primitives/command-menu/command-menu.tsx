import { Autocomplete as BaseAutocomplete } from "@base-ui/react/autocomplete";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ComponentProps } from "react";

export const CommandMenuDialog = BaseDialog.Root;

export type CommandMenuDialogProps = ComponentProps<typeof BaseDialog.Root>;

export type CommandMenuContentProps = ComponentProps<typeof BaseDialog.Popup>;

export function CommandMenuContent(props: CommandMenuContentProps) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Popup data-slot="command-menu-content" {...props} />
    </BaseDialog.Portal>
  );
}

export const CommandMenu = BaseAutocomplete.Root;

export type CommandMenuProps = ComponentProps<typeof BaseAutocomplete.Root>;

export type CommandMenuInputProps = ComponentProps<
  typeof BaseAutocomplete.Input
>;

export function CommandMenuInput(props: CommandMenuInputProps) {
  return <BaseAutocomplete.Input data-slot="command-menu-input" {...props} />;
}

export type CommandMenuFiltersProps = ComponentProps<"div">;

export function CommandMenuFilters(props: CommandMenuFiltersProps) {
  return <div data-slot="command-menu-filters" {...props} />;
}

export type CommandMenuFilterProps = ComponentProps<"button">;

export function CommandMenuFilter(props: CommandMenuFilterProps) {
  return <button data-slot="command-menu-filter" {...props} />;
}

export type CommandMenuListProps = ComponentProps<typeof BaseAutocomplete.List>;

export function CommandMenuList(props: CommandMenuListProps) {
  return <BaseAutocomplete.List data-slot="command-menu-list" {...props} />;
}

export type CommandMenuGroupProps = ComponentProps<
  typeof BaseAutocomplete.Group
>;

export function CommandMenuGroup(props: CommandMenuGroupProps) {
  return <BaseAutocomplete.Group data-slot="command-menu-group" {...props} />;
}

export type CommandMenuGroupLabelProps = ComponentProps<
  typeof BaseAutocomplete.GroupLabel
>;

export function CommandMenuGroupLabel(props: CommandMenuGroupLabelProps) {
  return (
    <BaseAutocomplete.GroupLabel
      data-slot="command-menu-group-label"
      {...props}
    />
  );
}

export type CommandMenuItemProps = ComponentProps<typeof BaseAutocomplete.Item>;

export function CommandMenuItem(props: CommandMenuItemProps) {
  return <BaseAutocomplete.Item data-slot="command-menu-item" {...props} />;
}

export type CommandMenuEmptyProps = ComponentProps<
  typeof BaseAutocomplete.Empty
>;

export function CommandMenuEmpty(props: CommandMenuEmptyProps) {
  return <BaseAutocomplete.Empty data-slot="command-menu-empty" {...props} />;
}

export type CommandMenuFooterProps = ComponentProps<"div">;

export function CommandMenuFooter(props: CommandMenuFooterProps) {
  return <div data-slot="command-menu-footer" {...props} />;
}
