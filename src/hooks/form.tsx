import { createFormHook, useSelector } from "@tanstack/react-form";
import { lazy, type ReactNode } from "react";
import { useModalDismissible } from "@/components/modal";
import { fieldContext, formContext, useFormContext } from "./form-context";

const FileInputField = lazy(
  () => import("@/components/forms/file-input-field.tsx"),
);

const CheckboxField = lazy(
  () => import("@/components/forms/checkbox-field.tsx"),
);
const ColorField = lazy(() => import("@/components/forms/color-field.tsx"));
const DateField = lazy(() => import("@/components/forms/date-field.tsx"));
const NumberField = lazy(() => import("@/components/forms/number-field.tsx"));
const SelectField = lazy(() => import("@/components/forms/select-field.tsx"));
const TextField = lazy(() => import("@/components/forms/text-field.tsx"));

function SubmitButton({ label }: { label: string }) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => (
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!canSubmit || isSubmitting}
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

function ModalActions({
  submitLabel,
  onCancel,
}: {
  submitLabel: string;
  onCancel: () => void;
}) {
  const form = useFormContext();
  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  // Closing while the save runs would lose its result and any error.
  useModalDismissible(!isSubmitting);

  return (
    <div className="modal-action">
      <button
        type="button"
        className="btn"
        disabled={isSubmitting}
        onClick={onCancel}
      >
        Cancel
      </button>

      <SubmitButton label={submitLabel} />
    </div>
  );
}

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    CheckboxField,
    ColorField,
    DateField,
    FileInputField,
    NumberField,
    SelectField,
    TextField,
  },
  formComponents: {
    Form,
    ModalActions,
    SaveError,
    SubmitButton,
  },
  fieldContext,
  formContext,
});
