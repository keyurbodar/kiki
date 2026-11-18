import { useAtomSet } from "@effect/atom-react";
import { type ReactNode, useState } from "react";
import { addSkillAtom, volumeReactivityKey } from "@/data/atoms/explore";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { toast } from "@/primitives/toaster";
import { errorMessage } from "../dialogs/error-message";
import { useRecordAdded } from "../listing-add-action/recently-added";
import {
  useCurrentUserId,
  useOrgId,
  useOrgName,
} from "../listing-detail/explore-session";
import { BuildingsGlyph, UserGlyph } from "../listing-detail/glyphs";
import {
  type PickedProject,
  ProjectPicker,
  useProjects,
} from "./project-picker";
import {
  addedToast,
  type ScopeChoice,
  scopeDestination,
  scopePayload,
} from "./skill-scope";

type ChoiceProps = {
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
  icon: ReactNode;
  label: string;
  description: string;
};

function Choice({
  checked,
  disabled,
  onSelect,
  icon,
  label,
  description,
}: ChoiceProps) {
  return (
    <label
      data-checked={checked || undefined}
      data-disabled={disabled || undefined}
      className="flex w-full cursor-pointer items-center gap-3 rounded p-3 text-left transition-colors duration-100 hover:bg-secondary has-[:focus-visible]:outline-ring-inset data-[checked]:bg-secondary data-[disabled]:pointer-events-none data-[disabled]:opacity-55"
    >
      <input
        type="radio"
        name="skill-scope"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
      />
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground [&_svg]:size-(--icon-sm)">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground-2">{description}</span>
      </span>
    </label>
  );
}

export type SkillScopeDialogProps = {
  slug: string;
  name: string;
  replacing: boolean;
  onClose: () => void;
};

export function SkillScopeDialog({
  slug,
  name,
  replacing,
  onClose,
}: SkillScopeDialogProps) {
  const orgId = useOrgId();
  const orgName = useOrgName();
  const userId = useCurrentUserId();
  const projects = useProjects(orgId);
  const addSkill = useAtomSet(addSkillAtom, { mode: "promise" });
  const recordAdded = useRecordAdded(orgId);
  const [choice, setChoice] = useState<ScopeChoice>("organization");
  const [picked, setPicked] = useState<PickedProject>();
  const [adding, setAdding] = useState(false);
  const project = picked ?? projects[0];
  const scope = scopePayload(choice, userId, project?.id);
  const destination = scopeDestination(choice, orgName, project?.name);

  const submit = () => {
    if (orgId === undefined || scope === undefined || adding) return;
    setAdding(true);
    addSkill({
      params: { orgId },
      payload: { slug, scope },
      reactivityKeys: [volumeReactivityKey(orgId)],
    })
      .then((result) => {
        recordAdded([{ kind: "skill", slug, versionId: result.versionId }]);
        onClose();
        const message = addedToast(result, destination);
        toast.success(message.title, { description: message.description });
      })
      .catch((error: unknown) => {
        setAdding(false);
        toast.error(errorMessage(error, `Could not add ${name}`));
      });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !adding && onClose()}>
      <DialogContent className="max-w-md">
        <form
          className="flex min-h-0 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {replacing ? `Update ${name}` : `Add ${name}`}
            </DialogTitle>
            <DialogDescription>
              {replacing
                ? "Replaces the copy in the drive you pick with the latest version"
                : "Copies the skill folder into a drive, where you can edit it"}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex-col">
            <fieldset aria-label="Drive" className="flex flex-col gap-1">
              <span className="text-sm font-medium text-foreground">Drive</span>
              <Choice
                checked={choice === "organization"}
                onSelect={() => setChoice("organization")}
                icon={<BuildingsGlyph />}
                label={orgName ?? "Organization"}
                description="Every thread in the organization can use it"
              />
              <Choice
                checked={choice === "project"}
                onSelect={() => setChoice("project")}
                disabled={projects.length === 0}
                icon={<Icon name="folder-1" />}
                label="A project"
                description="Threads in one project can use it"
              />
              <Choice
                checked={choice === "personal"}
                onSelect={() => setChoice("personal")}
                icon={<UserGlyph />}
                label="Your drive"
                description="Only your threads can use it"
              />
            </fieldset>
            {choice === "project" && (
              <div className="flex min-h-11 items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground">
                  Project
                </span>
                <ProjectPicker
                  projects={projects}
                  value={project}
                  onValueChange={setPicked}
                />
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button
              variant="ghost"
              type="button"
              disabled={adding}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              intent="accent"
              type="submit"
              disabled={scope === undefined || adding}
              aria-busy={adding || undefined}
            >
              {adding
                ? replacing
                  ? "Updating"
                  : "Adding"
                : replacing
                  ? "Update skill"
                  : "Add skill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
