import { useSelector } from "@tanstack/react-form";
import { useFieldContext } from "@/hooks/form-context.tsx";

export default function TextField({ label }: { label: string }) {
  const field = useFieldContext<string>();

  const errors = useSelector(field.store, (state) => state.meta.errors);

  return (
    <div className="fieldset">
      <label className="label">{label}</label>

      <input
        type={"color"}
        className="size-8 rounded-md cursor-pointer outline-0 border-0"
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
