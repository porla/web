import { createFormHook, useSelector } from "@tanstack/react-form";
import { type ReactNode } from "react";
import {
  useModalDismiss,
  useModalDismissible,
} from "@/components/modal/use-modal";
import { fieldContext, formContext, useFormContext } from "./form-context";
import { CheckboxField } from "@/components/form/fields/checkbox-field";
import { ColorField } from "@/components/form/fields/color-field";
import { DateField } from "@/components/form/fields/date-field";
import { NumberField } from "@/components/form/fields/number-field";
import { SelectField } from "@/components/form/fields/select-field";
import { TextField } from "@/components/form/fields/text-field";
import { TorrentFlagsField } from "@/components/form/fields/torrent-flags-field";
import { ModalTitle } from "@/components/modal/modal-title";

function SubmitButton({
  disabled,
  label,
}: {
  disabled?: boolean;
  label: string;
}) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => (
        <button
          type="submit"
          className="btn btn-primary"
          disabled={disabled || !canSubmit || isSubmitting}
        >
          {label}
        </button>
      )}
    </form.Subscribe>
  );
}

// The <form> element: submits through TanStack Form. handleSubmit re-throws a
// failed save; the error is shown from the mutation (<form.SaveError>), so
// it's caught here.
function Form({ children }: { children: ReactNode }) {
  const form = useFormContext();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit().catch(() => {});
      }}
    >
      {children}
    </form>
  );
}

function SaveError({ error }: { error: Error | null }) {
  if (!error) {
    return null;
  }

  return (
    <div role="alert" className="alert alert-error alert-soft">
      {error.message || "Request failed"}
    </div>
  );
}

function Saved({ show, children }: { show: boolean; children?: ReactNode }) {
  if (!show) {
    return null;
  }

  return (
    <div role="status" className="alert alert-success alert-soft">
      {children ?? "Saved"}
    </div>
  );
}

// Cancel and the submit button, stuck to the bottom of a modal. Cancel
// dismisses it like Esc does.
function ModalActions({ submitLabel }: { submitLabel: string }) {
  const form = useFormContext();
  const dismiss = useModalDismiss();

  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  // Closing while the save runs would lose its result and any error.
  useModalDismissible(!isSubmitting);

  // stick to the bottom of a modal
  return (
    <div
      data-sticky-footer
      className="modal-action sticky bottom-0 -mx-6 border-t border-base-300 bg-base-100 px-6 pt-4 pb-6"
    >
      <button
        type="button"
        className="btn"
        disabled={isSubmitting}
        onClick={dismiss}
      >
        Cancel
      </button>

      <SubmitButton label={submitLabel} />
    </div>
  );
}

function ModalForm({
  title,
  submitLabel,
  error,
  children,
}: {
  title: ReactNode;
  submitLabel: string;
  error?: Error | null;
  children: ReactNode;
}) {
  return (
    <Form>
      <ModalTitle>{title}</ModalTitle>
      {children}
      <SaveError error={error ?? null} />
      <ModalActions submitLabel={submitLabel} />
    </Form>
  );
}

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    CheckboxField,
    ColorField,
    DateField,
    NumberField,
    SelectField,
    TextField,
    TorrentFlagsField,
  },
  formComponents: {
    Form,
    ModalForm,
    SaveError,
    Saved,
    SubmitButton,
  },
  fieldContext,
  formContext,
});
