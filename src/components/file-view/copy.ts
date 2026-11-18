import { toast } from "@/primitives/toaster";

export function copyText(text: string, success: string, failure: string) {
  return navigator.clipboard.writeText(text).then(
    () => {
      toast.success(success);
    },
    () => {
      toast.error(failure);
    },
  );
}
