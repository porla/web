import { useFieldContext } from "@/components/form/form-context";
import { Field } from "@/components/form/field";
import type { HTMLInputTypeAttribute } from "react";

export function TextField({
  autoCapitalize,
  autoComplete,
  autoFocus,
  description,
  label,
  placeholder,
  spellCheck,
  type,
}: {
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: string;
  autoFocus?: boolean;
  description?: string;
  label: string;
  placeholder?: string;
  spellCheck?: boolean;
  type?: HTMLInputTypeAttribute;
}) {
  const field = useFieldContext<string>();

  return (
    <Field label={label} description={description}>
      {(control) => (
        <input
          {...control}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          placeholder={placeholder}
          spellCheck={spellCheck}
          type={type ?? "text"}
          className="input"
          value={field.state.value ?? ""}
          onChange={(e) => field.handleChange(e.target.value)}
        />
      )}
    </Field>
  );
}
