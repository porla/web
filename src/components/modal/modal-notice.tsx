import { Spinner } from "@/components/ui/spinner";
import type { ReactNode } from "react";
import { ModalTitle } from "./modal-title";
import { useModalDismiss } from "./use-modal";

// What a modal shows instead of its form: a spinner while what it needs loads,
// or a message (the torrent is gone, there's nothing to choose) and Close.
export function ModalNotice({
  title,
  loading,
  children,
}: {
  title: ReactNode;
  loading?: boolean;
  children?: ReactNode;
}) {
  const dismiss = useModalDismiss();

  if (loading) {
    return <Spinner />;
  }

  return (
    <>
      <ModalTitle>{title}</ModalTitle>
      <div className="space-y-3 py-2">{children}</div>
      <div className="modal-action">
        <button type="button" className="btn" onClick={dismiss}>
          Close
        </button>
      </div>
    </>
  );
}
