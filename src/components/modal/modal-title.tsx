import type { ReactNode } from "react";
import { useModalTitleId } from "./use-modal";

// A modal's heading; it also names the dialog for screen readers.
export function ModalTitle({ children }: { children: ReactNode }) {
  return (
    <h3 id={useModalTitleId()} className="font-bold text-lg">
      {children}
    </h3>
  );
}
