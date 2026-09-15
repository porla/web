import { useSelector } from "@tanstack/react-form";
import { useFieldContext } from "@/hooks/form-context.tsx";

export default function NumberField({ label }: { label: string }) {
  const field = useFieldContext<number | null>();

  const errors = useSelector(field.store, (state) => state.meta.errors);

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

      {errors.map((error: string) => (
        <div key={error} style={{ color: "red" }}>
          {error}
        </div>
      ))}
    </div>
  );
}
