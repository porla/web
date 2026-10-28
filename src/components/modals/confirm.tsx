import type { ModalProps } from "@/components/modal";
import { useAppForm } from "@/hooks/form";
import { useMutation } from "@tanstack/react-query";
import type { ReactNode } from "react";

type ConfirmModalProps = {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  // Runs inside the dialog, so a failure is shown there and can be retried.
  action: () => Promise<unknown>;
};

export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  action,
  close,
}: ConfirmModalProps & ModalProps<boolean>) {
  const run = useMutation({ mutationFn: action, meta: { silent: true } });

  const form = useAppForm({
    defaultValues: {},
    onSubmit: async () => {
      await run.mutateAsync();
      close(true);
    },
  });

  return (
    <form.AppForm>
      <form.Form>
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="py-2">{message}</p>

        <form.SaveError error={run.error} />
        <form.ModalActions
          submitLabel={confirmLabel}
          onCancel={() => close(false)}
        />
      </form.Form>
    </form.AppForm>
  );
}
