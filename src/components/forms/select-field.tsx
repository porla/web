import { useSelector } from "@tanstack/react-form";
import { useFieldContext } from "@/hooks/form-context.tsx";

type SelectItem = {
  value: number;
  label: string;
};

export default function SelectField({
  label,
  items,
}: {
  label: string;
  items: SelectItem[];
}) {
  const field = useFieldContext<number | null>();

  const errors = useSelector(field.store, (state) => state.meta.errors);

  return (
    <div className="fieldset">
      <label className="label">{label}</label>

      <select
        className="select"
        onBlur={field.handleBlur}
        onChange={(e) => {
          field.handleChange(
            e.target.value === "" ? null : parseInt(e.target.value),
          );
        }}
        value={field.state.value ?? undefined}
      >
        <option value={""}>None</option>
        {items.map((item) => (
          <option key={`${field.name}_${item.value}`} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      {errors.map((error: string) => (
        <div key={error} style={{ color: "red" }}>
          {error}
        </div>
      ))}
    </div>
  );
}
