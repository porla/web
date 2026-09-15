import { useSelector } from "@tanstack/react-form";
import { useFieldContext } from "@/hooks/form-context.tsx";
import type { HTMLInputTypeAttribute } from "react";

export default function TextField({
  label,
  type,
}: {
  label: string;
  type?: HTMLInputTypeAttribute;
}) {
  const field = useFieldContext<string>();

  const errors = useSelector(field.store, (state) => state.meta.errors);

  return (
    <div className="fieldset">
      <label className="label">{label}</label>

      <input
        type={type ?? "text"}
        className="input"
        value={field.state.value ?? ""}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
      />

      {errors.map((error: string) => (
        <div key={error} style={{ color: "red" }}>
          {error}
        </div>
      ))}
    </div>
  );
}
