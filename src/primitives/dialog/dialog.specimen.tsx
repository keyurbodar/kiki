import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from ".";

export function DialogSpecimen() {
  return (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive this thread?</DialogTitle>
          <DialogDescription>
            Its machines stop and its pull requests keep running.
          </DialogDescription>
        </DialogHeader>
        <DialogBody
          spacing="relaxed"
          className="text-sm text-muted-foreground-1"
        >
          You can unarchive it from Threads at any time.
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button intent="danger">Archive</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
