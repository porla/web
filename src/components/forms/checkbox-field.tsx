import { useFieldContext } from "@/hooks/form-context.tsx";
import { useId } from "react";
import FieldErrors from "./field-errors";

export default function CheckboxField({
  autoFocus,
  label,
}: {
  autoFocus?: boolean;
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
        onChange={(e) => field.handleChange(e.target.checked)}
        onBlur={field.handleBlur}
      />

      <FieldErrors />
    </div>
  );
}
