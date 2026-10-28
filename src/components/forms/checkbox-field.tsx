import { useFieldContext } from "@/hooks/form-context.tsx";
import { useId } from "react";
import FieldErrors from "./field-errors";

export default function CheckboxField({
  autoFocus,
  description,
  disabled,
  label,
}: {
  autoFocus?: boolean;
  description?: string;
  disabled?: boolean;
  label: string;
}) {
  const field = useFieldContext<boolean>();

  const id = useId();

  return (
    <div className="fieldset">
      <label className="label" htmlFor={id}>
        {label}
      </label>

      <input
        id={id}
        autoFocus={autoFocus}
        type={"checkbox"}
        className="checkbox"
        checked={field.state.value}
        disabled={disabled}
        onChange={(e) => field.handleChange(e.target.checked)}
        onBlur={field.handleBlur}
      />

      {description && <div className="text-base-content">{description}</div>}

      <FieldErrors />
    </div>
  );
}
