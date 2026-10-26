import { useFieldContext } from "@/hooks/form-context.tsx";
import { useId } from "react";
import FieldErrors from "./field-errors";

export default function NumberField({ label }: { label: string }) {
  const field = useFieldContext<number | null>();

  const id = useId();

  return (
    <div className="fieldset">
      <label className="label" htmlFor={id}>
        {label}
      </label>

      <input
        id={id}
        type="number"
        className="input"
        value={field.state.value ?? ""}
        onChange={(e) =>
          field.handleChange(
            Number.isNaN(e.target.valueAsNumber)
              ? null
              : e.target.valueAsNumber,
          )
        }
        onBlur={field.handleBlur}
      />

      <FieldErrors />
    </div>
  );
}
