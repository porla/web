import { useFieldContext } from "@/components/form/form-context";
import { DateTime } from "luxon";
import { Field } from "@/components/form/field";

export function DateField({ label }: { label: string }) {
  const field = useFieldContext<number | null>();

  return (
    <Field label={label}>
      {(control) => (
        <input
          {...control}
          type="date"
          className="input"
          value={
            field.state.value === null
              ? ""
              : DateTime.fromSeconds(field.state.value).toFormat("yyyy-MM-dd")
          }
          min={DateTime.now().toFormat("yyyy-MM-dd")}
          onChange={(e) => {
            const picked = DateTime.fromISO(e.target.value);
            field.handleChange(
              e.target.value !== "" && picked.isValid
                ? picked.endOf("day").toUnixInteger()
                : null,
            );
          }}
        />
      )}
    </Field>
  );
}
