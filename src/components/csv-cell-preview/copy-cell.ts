import { toast } from "sonner";

export const copyCell = (value: string) =>
  navigator.clipboard
    .writeText(value)
    .then(() => toast.success("Copied cell"))
    .catch(() => toast.error("Could not copy cell"));
