import { useSelector } from "@tanstack/react-form";
import { useFieldContext } from "@/hooks/form-context.tsx";
import type { HTMLInputTypeAttribute } from "react";

export default function TextField({
  label,
  description,
  type,
}: {
  label: string;
  description?: string;
  type?: HTMLInputTypeAttribute;
}) {
  const field = useFieldContext<string>();

  const errors = useSelector(field.store, (state) => state.meta.errors);
  const isTouched = useSelector(field.store, (state) => state.meta.isTouched);

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

      {description && <div className="text-base-content">{description}</div>}

      {isTouched &&
        errors.map((error, i) => (
          <div key={i} className="text-red-400">
            {typeof error === "string" ? error : error?.message}
          </div>
        ))}
    </div>
  );
}
