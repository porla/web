import { dismissToast, useToasts } from "@/toast";
import { X } from "lucide-react";

export default function Toaster() {
  const toasts = useToasts();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast toast-end z-50">
      {toasts.map((t) => (
        <div key={t.id} role="alert" className="alert alert-error">
          <span>{t.message}</span>
          <button
            className="btn btn-ghost btn-xs btn-square"
            aria-label="Dismiss"
            onClick={() => dismissToast(t.id)}
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
