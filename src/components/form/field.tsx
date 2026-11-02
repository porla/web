import { useSelector } from "@tanstack/react-form";
import { useId, type ReactNode } from "react";
import { FieldErrors } from "./field-errors";
import { useFieldContext } from "./form-context";

export type ControlProps = {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
  onBlur: () => void;
};

export function Field({
  label,
  description,
  children,
}: {
  label: ReactNode;
  description?: ReactNode;
  children: (control: ControlProps) => ReactNode;
}) {
  const field = useFieldContext<unknown>();
  const id = useId();
  const invalid = useSelector(
    field.store,
    (s) => s.meta.isTouched && s.meta.errors.length > 0,
  );

  const descriptionId = description ? `${id}-description` : undefined;
  const errorsId = invalid ? `${id}-errors` : undefined;

  return (
    <div className="fieldset">
      <label className="label" htmlFor={id}>
        {label}
      </label>

      {children({
        id,
        "aria-describedby":
          [descriptionId, errorsId].filter(Boolean).join(" ") || undefined,
        "aria-invalid": invalid || undefined,
        onBlur: field.handleBlur,
      })}

      {description && (
        <div id={descriptionId} className="text-base-content">
          {description}
        </div>
      )}

      <FieldErrors id={`${id}-errors`} />
    </div>
  );
}
