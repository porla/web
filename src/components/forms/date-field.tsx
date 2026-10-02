import { useSelector } from "@tanstack/react-form";
import { useFieldContext } from "@/hooks/form-context.tsx";
import { DateTime } from "luxon";

export default function DateField({ label }: { label: string }) {
  const field = useFieldContext<number | null>();

  const errors = useSelector(field.store, (state) => state.meta.errors);
  const isTouched = useSelector(field.store, (state) => state.meta.isTouched);

  return (
    <div className="fieldset">
      <label className="label">{label}</label>

      <input
        type="date"
        className="input"
        value={
          field.state.value === null
            ? ""
            : DateTime.fromSeconds(field.state.value).toFormat("yyyy-MM-dd")
        }
        min={DateTime.now().toFormat("yyyy-MM-dd")}
        onChange={(e) => {
          if (e.target.value === "") {
            return field.handleChange(null);
          }

          const picked = DateTime.fromISO(e.target.value);

          if (!picked.isValid) {
            return field.handleChange(null);
          }

          return field.handleChange(picked.endOf("day").toUnixInteger());
        }}
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
