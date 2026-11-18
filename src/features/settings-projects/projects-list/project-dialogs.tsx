import { useAtomSet } from "@effect/atom-react";
import type { OrgId } from "@/data/api/schemas/ids";
import type { ProjectSettingsDirectoryEntry } from "@/data/api/schemas/project-settings";
import {
  projectMutations,
  projectWriteKeys,
} from "@/data/atoms/project-settings";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/primitives/dialog";
import { Input } from "@/primitives/input";
import { toast } from "@/primitives/toaster";

type Target = Pick<
  ProjectSettingsDirectoryEntry,
  "id" | "name" | "nameIsDerived"
> | null;

export function RenameProjectDialog({
  orgId,
  project,
  onClose,
}: {
  readonly orgId: OrgId;
  readonly project: Target;
  readonly onClose: () => void;
}) {
  const update = useAtomSet(projectMutations.update, { mode: "promise" });
  const rename = (name: string | null) => {
    if (project === null) return;
    update({
      params: { orgId, projectId: project.id },
      payload: { name },
      reactivityKeys: projectWriteKeys(orgId, project.id),
    })
      .then(() => toast.success("Name saved"))
      .catch(() => toast.error("Could not rename the project"));
    onClose();
  };
  return (
    <Dialog open={project !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogOverlay />
      <DialogContent className="max-w-sm">
        {project && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const name = new FormData(event.currentTarget).get("name");
              if (typeof name === "string" && name.trim() !== "")
                rename(name.trim());
              else onClose();
            }}
          >
            <DialogHeader>
              <DialogTitle>Rename project</DialogTitle>
              <DialogDescription>
                {project.nameIsDerived
                  ? "The name follows the repositories until you set one"
                  : "Threads and their codes keep their history"}
              </DialogDescription>
            </DialogHeader>
            <div className="px-4 py-2">
              <Input
                key={project.id}
                name="name"
                aria-label="Project name"
                defaultValue={project.name}
                maxLength={255}
                autoFocus
              />
            </div>
            <DialogFooter>
              {!project.nameIsDerived && (
                <Button
                  variant="ghost"
                  type="button"
                  className="mr-auto"
                  onClick={() => rename(null)}
                >
                  Use derived name
                </Button>
              )}
              <Button variant="ghost" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button intent="accent" type="submit">
                Rename
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function DeleteProjectDialog({
  orgId,
  project,
  onClose,
  onDeleted,
}: {
  readonly orgId: OrgId;
  readonly project: Pick<ProjectSettingsDirectoryEntry, "id" | "name"> | null;
  readonly onClose: () => void;
  readonly onDeleted?: () => void;
}) {
  const remove = useAtomSet(projectMutations.delete, { mode: "promise" });
  const restore = useAtomSet(projectMutations.restore, { mode: "promise" });
  const confirm = () => {
    if (project === null) return;
    const keys = projectWriteKeys(orgId, project.id);
    const params = { orgId, projectId: project.id };
    remove({ params, reactivityKeys: keys })
      .then(() => {
        onDeleted?.();
        toast("Project deleted", {
          description: project.name,
          action: {
            label: "Undo",
            onClick: () => {
              restore({ params, reactivityKeys: keys }).catch(() =>
                toast.error("Could not restore the project"),
              );
            },
          },
        });
      })
      .catch(() => toast.error("Could not delete the project"));
    onClose();
  };
  return (
    <Dialog open={project !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogOverlay />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete {project?.name ?? "project"}?</DialogTitle>
          <DialogDescription>
            Threads keep their history; the project disappears from pickers and
            boards
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button intent="danger" type="button" onClick={confirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
