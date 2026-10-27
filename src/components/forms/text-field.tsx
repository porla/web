import { useFieldContext } from "@/hooks/form-context.tsx";
import { useId, type HTMLInputTypeAttribute } from "react";
import FieldErrors from "./field-errors";

export default function TextField({
  autoFocus,
  description,
  label,
  type,
}: {
  autoFocus?: boolean;
  description?: string;
  label: string;
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
        autoFocus={autoFocus}
        id={id}
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
