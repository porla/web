import { useFieldContext } from "@/components/form/form-context";
import { Field } from "@/components/form/field";
import type { HTMLInputTypeAttribute } from "react";

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

  return (
    <Field label={label} description={description}>
      {(control) => (
        <input
          {...control}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          placeholder={placeholder}
          type={type ?? "text"}
          className="input"
          value={field.state.value ?? ""}
          onChange={(e) => field.handleChange(e.target.value)}
        />
      )}
    </Field>
  );
}
