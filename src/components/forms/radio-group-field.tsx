import { useFieldContext } from "@/hooks/form-context";

type RadioGroupFieldProps = {
  label: string;
  values: { id: string, title: string }[];
}

export default function RadioGroupField(props: RadioGroupFieldProps) {
  const field = useFieldContext<string>();

  return (
    <fieldset>
      <legend className="text-sm/6 font-semibold text-gray-900 dark:text-white">{props.label}</legend>
      <div className="mt-6 space-y-6 sm:flex sm:items-center sm:space-y-0 sm:space-x-10">
        {props.values.map((val) => (
          <div key={val.id} className="flex items-center">
            <input
              type="radio"
              className="relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 dark:border-white/10 dark:bg-white/5 dark:checked:border-indigo-500 dark:checked:bg-indigo-500 dark:focus-visible:outline-indigo-500 dark:disabled:border-white/5 dark:disabled:bg-white/10 dark:disabled:before:bg-white/20 forced-colors:appearance-auto forced-colors:before:hidden"
              checked={field.state.value == val.id}
              id={field.name}
              name={field.name}
              value={val.id}
              onBlur={field.handleBlur}
              onChange={e => field.handleChange(e.target.value)}
            />
            <label
              htmlFor={val.id}
              className="ml-3 block text-sm/6 font-medium text-gray-900 dark:text-white"
            >
              {val.title}
            </label>
          </div>
        ))}
      </div>
    </fieldset>
  )
}
