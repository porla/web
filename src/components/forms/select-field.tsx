import { useFieldContext } from "@/hooks/form-context";
import { Listbox, Label, ListboxButton, ListboxOptions, ListboxOption } from "@headlessui/react"
import { ChevronUpDownIcon, CheckIcon } from "@heroicons/react/20/solid"

type Item = {
  id: number;
  name: string;
}

type SelectFieldProps = {
  label: string;
  items: Item[];
};

export default function SelectField(props: SelectFieldProps) {
  const field = useFieldContext<number | null>();

  return (
    <div>
      <Listbox value={props.items.find(itm => itm.id == field.state.value) || null} onChange={v => field.handleChange(v?.id || null)}>
        <Label className="block text-sm/6 font-medium text-gray-900 dark:text-white">{props.label}</Label>

        <div className="relative mt-2">
          <ListboxButton className="grid w-full cursor-default grid-cols-1 rounded-md bg-white py-1.5 pr-2 pl-3 text-left text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus-visible:outline-indigo-500">
            <span className="col-start-1 row-start-1 truncate pr-6">{props.items.find(itm => itm.id == field.state.value)?.name || "Not set"}</span>
            <ChevronUpDownIcon
              aria-hidden="true"
              className="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-500 sm:size-4 dark:text-gray-400"
            />
          </ListboxButton>

          <ListboxOptions
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg outline-1 outline-black/5 sm:text-sm dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
          >
            <ListboxOption
              value={null}
              className="group relative cursor-default py-2 pr-9 pl-3 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white data-focus:outline-hidden dark:text-white dark:data-focus:bg-indigo-500"
            >
              <span className="block truncate font-normal group-data-selected:font-semibold text-gray-400">Not set</span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600 group-not-data-selected:hidden group-data-focus:text-white dark:text-indigo-400">
                <CheckIcon aria-hidden="true" className="size-5" />
              </span>
            </ListboxOption>

            {props.items.map((item) => (
              <ListboxOption
                key={item.id}
                value={item}
                className="group relative cursor-default py-2 pr-9 pl-3 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white data-focus:outline-hidden dark:text-white dark:data-focus:bg-indigo-500"
              >
                <span className="block truncate font-normal group-data-selected:font-semibold">{item.name}</span>

                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600 group-not-data-selected:hidden group-data-focus:text-white dark:text-indigo-400">
                  <CheckIcon aria-hidden="true" className="size-5" />
                </span>
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>
      <p className="text-sm text-gray-400 mt-2">The session to use for this preset.</p>
    </div>
  )
}