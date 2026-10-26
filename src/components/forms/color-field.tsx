import { useFieldContext } from "@/hooks/form-context.tsx";
import { useId } from "react";
import FieldErrors from "./field-errors";

export default function ColorField({ label }: { label: string }) {
  const field = useFieldContext<string>();

  const id = useId();

  return (
    <div className="fieldset">
      <label className="label" htmlFor={id}>
        {label}
      </label>

      <input
        id={id}
        type={"color"}
        className="size-8 rounded-md cursor-pointer outline-0 border-0"
        value={field.state.value ?? ""}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
      />

      <FieldErrors />
    </div>
  );
}
