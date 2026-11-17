import type { ComponentProps } from "react";

export type EnvironmentVariablesProps = ComponentProps<"div">;

export function EnvironmentVariables(props: EnvironmentVariablesProps) {
  return <div {...props} />;
}

export type VariableRowProps = ComponentProps<"div">;

export function VariableRow(props: VariableRowProps) {
  return <div data-slot="variable-row" {...props} />;
}
