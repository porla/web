import { useFieldContext } from "@/components/form/form-context";
import { useId, type HTMLInputTypeAttribute } from "react";
import { FieldErrors } from "@/components/form/field-errors";

export function TextField({
  autoComplete,
  autoFocus,
  description,
  label,
  placeholder,
  type,
}: {
  autoComplete?: string;
  autoFocus?: boolean;
  description?: string;
  label: string;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
}) {
  const field = useFieldContext<string>();

  const id = useId();

  return (
    <div className="fieldset">
      <label className="label" htmlFor={id}>
        {label}
      </label>

      <input
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        id={id}
        placeholder={placeholder}
        type={type ?? "text"}
        className="input"
        value={field.state.value ?? ""}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
      />

      {description && <div className="text-base-content">{description}</div>}

      <FieldErrors />
    </div>
  );
}
