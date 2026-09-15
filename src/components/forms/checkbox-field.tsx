import { useSelector } from "@tanstack/react-form";
import { useFieldContext } from "@/hooks/form-context.tsx";

export default function CheckboxField({ label }: { label: string }) {
  const field = useFieldContext<boolean>();

  const errors = useSelector(field.store, (state) => state.meta.errors);

  return (
    <div className="fieldset">
      <label className="label">{label}</label>

      <input
        type={"checkbox"}
        className="checkbox"
        checked={field.state.value}
        onChange={(e) => field.handleChange(e.target.checked)}
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
