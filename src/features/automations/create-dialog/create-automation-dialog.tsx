import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cx } from "@/components/view-toolbar";
import { cardVariants } from "@/primitives/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { Box, EditSmall } from "../automations-list/glyphs";
import { templatesSectionId } from "../templates-section";

const track = (owner: string) =>
  `features/automations/create-dialog.tsx#${owner}`;

type CreateOption = {
  readonly key: string;
  readonly icon: ReactNode;
  readonly title: string;
  readonly description: string;
  readonly onClick: () => void;
};

export type CreateAutomationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** New automation: start from scratch, from a template, or with Capy. */
export function CreateAutomationDialog({
  open,
  onOpenChange,
}: CreateAutomationDialogProps) {
  const navigate = useNavigate();
  const options: CreateOption[] = [
    {
      key: "scratch",
      icon: <Icon name="pencil" />,
      title: "Start from scratch",
      description: "Configure triggers, instructions, and limits yourself",
      onClick: () => {
        onOpenChange(false);
        void navigate({ to: "/automation/new", search: {} });
      },
    },
    {
      key: "template",
      icon: <Box />,
      title: "Start from template",
      description: "Pick a ready-made automation and fit it to your project",
      onClick: () => {
        onOpenChange(false);
        document
          .getElementById(templatesSectionId)
          ?.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      key: "capy",
      icon: <EditSmall />,
      title: "Create with Capy",
      description: "Describe what you want and Capy builds it in a thread",
      onClick: () => {
        onOpenChange(false);
        void navigate({ to: "/new" });
      },
    },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create automation</DialogTitle>
          <DialogDescription>
            Choose how to create your automation
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex-col md:flex-row">
          {options.map((option) => (
            <button
              key={option.key}
              data-track-owner={track(
                "CreateAutomationDialog:button[onClick=onClick]",
              )}
              type="button"
              className={cx(
                cardVariants({ variant: "interactive" }),
                "flex-1 items-start gap-1.5 p-4 text-left",
              )}
              onClick={option.onClick}
            >
              <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-foreground [&_svg]:size-4">
                {option.icon}
              </span>
              <span className="pt-1 text-sm font-medium text-foreground">
                {option.title}
              </span>
              <span className="text-sm font-normal text-muted-foreground-2">
                {option.description}
              </span>
            </button>
          ))}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
