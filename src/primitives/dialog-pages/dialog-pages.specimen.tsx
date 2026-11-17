import { useState } from "react";
import { Button } from "@/primitives/button";
import { Dialog, DialogContent } from "@/primitives/dialog";
import { DialogPages } from ".";

type Page = "members" | "invite";

export function DialogPagesSpecimen() {
  const [page, setPage] = useState<Page>("invite");
  return (
    <Dialog defaultOpen>
      <DialogContent className="max-w-md">
        <DialogPages
          page={page}
          root="members"
          onBack={() => setPage("members")}
          pages={{
            members: {
              title: "Members",
              body: (
                <Button variant="ghost" onClick={() => setPage("invite")}>
                  Invite people
                </Button>
              ),
            },
            invite: {
              title: "Invite people",
              spacing: "relaxed",
              body: "Invites go out by email and expire after a week.",
              footer: <Button intent="accent">Send invites</Button>,
            },
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
