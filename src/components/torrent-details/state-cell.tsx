import clsx from "clsx";

export function StateCell({
  label,
  dot,
  title,
}: {
  label: string;
  dot?: string;
  title: string;
}) {
  return (
    <span
      className="flex cursor-help items-center gap-1.5 whitespace-nowrap"
      title={title}
    >
      <span
        className={clsx("status shrink-0", dot ?? "opacity-30")}
        aria-hidden
      />
      <span className={clsx(dot === undefined && "opacity-60")}>{label}</span>
    </span>
  );
}
