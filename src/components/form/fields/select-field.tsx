import { useFieldContext } from "@/components/form/form-context";
import { Field } from "@/components/form/field";

type SelectItem = {
  value: number;
  label: string;
};

export function SelectField({
  autoFocus,
  label,
  items,
}: {
  autoFocus?: boolean;
  label: string;
  items: SelectItem[];
}) {
  const field = useFieldContext<number | null>();

  return (
    <Field label={label}>
      {(control) => (
        <select
          {...control}
          autoFocus={autoFocus}
          className="select"
          onChange={(e) =>
            field.handleChange(
              e.target.value === "" ? null : parseInt(e.target.value),
            )
          }
          value={field.state.value ?? ""}
        >
          <option value="">None</option>
          {items.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}
