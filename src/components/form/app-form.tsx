import { createFormHook, useSelector } from "@tanstack/react-form";
import { lazy, type ReactNode } from "react";
import { useModalDismissible } from "@/components/modal/use-modal";
import { fieldContext, formContext, useFormContext } from "./form-context";

const CheckboxField = lazy(() =>
  import("@/components/form/fields/checkbox-field").then((m) => ({
    default: m.CheckboxField,
  })),
);

const ColorField = lazy(() =>
  import("@/components/form/fields/color-field").then((m) => ({
    default: m.ColorField,
  })),
);

const DateField = lazy(() =>
  import("@/components/form/fields/date-field").then((m) => ({
    default: m.DateField,
  })),
);

const NumberField = lazy(() =>
  import("@/components/form/fields/number-field").then((m) => ({
    default: m.NumberField,
  })),
);

const SelectField = lazy(() =>
  import("@/components/form/fields/select-field").then((m) => ({
    default: m.SelectField,
  })),
);

const TextField = lazy(() =>
  import("@/components/form/fields/text-field").then((m) => ({
    default: m.TextField,
  })),
);

const TorrentFlagsField = lazy(() =>
  import("@/components/form/fields/torrent-flags-field").then((m) => ({
    default: m.TorrentFlagsField,
  })),
);

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
    NumberField,
    SelectField,
    TextField,
    TorrentFlagsField,
  },
  formComponents: {
    Form,
    ModalActions,
    SaveError,
    Saved,
    SubmitButton,
  },
  fieldContext,
  formContext,
});
