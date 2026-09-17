import { useSelector } from "@tanstack/react-form";
import { useFieldContext } from "@/hooks/form-context.tsx";

export default function NumberField({ label }: { label: string }) {
  const field = useFieldContext<number | null>();

  const errors = useSelector(field.store, (state) => state.meta.errors);
  const isTouched = useSelector(field.store, (state) => state.meta.isTouched);

  return (
    <div className="fieldset">
      <label className="label">{label}</label>

      <input
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

      {isTouched &&
        errors.map((error, i) => (
          <div key={i} className="text-red-400">
            {typeof error === "string" ? error : error?.message}
          </div>
        ))}
    </div>
  );
}
