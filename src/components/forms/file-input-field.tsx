import { useSelector } from "@tanstack/react-form";
import { useFieldContext } from "@/hooks/form-context.tsx";

export default function FileInputField({ label }: { label: string }) {
  const field = useFieldContext<File | null>();

  const errors = useSelector(field.store, (state) => state.meta.errors);

  return (
    <div className="fieldset">
      <label className="label">{label}</label>

      <input
        type="file"
        className="file-input"
        onBlur={field.handleBlur}
        onChange={(e) =>
          e.target.files
            ? field.handleChange(e.target.files[0])
            : field.handleChange(null)
        }
      />

      {errors.map((error: string) => (
        <div key={error} style={{ color: "red" }}>
          {error}
        </div>
      ))}
    </div>
  );
}
