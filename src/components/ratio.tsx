import { ratio } from "@/format";
import clsx from "clsx";

// Ten steps: red below 0.2 up to teal below 2, then gold with a glow that
// grows at 3 and 5 (softer on light backgrounds, where a bright glow smears).
// Each step is [upper bound, classes].
const steps: [number, string][] = [
  [0.2, "text-red-600 dark:text-red-400"],
  [0.5, "text-orange-600 dark:text-orange-400"],
  [0.8, "text-amber-600 dark:text-amber-400"],
  [1, "text-lime-600 dark:text-lime-400"],
  [1.25, "text-green-600 dark:text-green-400"],
  [1.5, "text-emerald-600 dark:text-emerald-400"],
  [2, "text-teal-600 dark:text-teal-400"],
  [3, "text-yellow-600 dark:text-yellow-300"],
  [5, "font-medium text-yellow-600 dark:text-yellow-300"],
  [Infinity, "font-semibold text-yellow-600 dark:text-yellow-200"],
];

const ratioClass = (r: number) => steps.find(([max]) => r < max)![1];

export default function Ratio({ value }: { value: number }) {
  return (
    <span className={clsx("tabular-nums", ratioClass(value))}>
      {ratio(value)}
    </span>
  );
}
