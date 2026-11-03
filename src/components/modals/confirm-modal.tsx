import type { ModalProps } from "@/components/modal/use-modal";
import { useAppForm } from "@/components/form/app-form";
import { useMutation } from "@tanstack/react-query";
import type { ReactNode } from "react";

type ConfirmModalProps = {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  // Runs inside the dialog, so a failure is shown there and can be retried.
  action: () => Promise<unknown>;
};

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  action,
  close,
}: ConfirmModalProps & ModalProps<boolean>) {
  const run = useMutation({ mutationFn: action, meta: { errorToast: false } });

  const form = useAppForm({
    defaultValues: {},
    onSubmit: async () => {
      await run.mutateAsync();
      close(true);
    },
  });

  return (
    <form.AppForm>
      <form.ModalForm
        title={<>{title}</>}
        submitLabel={confirmLabel}
        error={run.error}
      >
        <p className="py-2">{message}</p>
      </form.ModalForm>
    </form.AppForm>
  );
}
