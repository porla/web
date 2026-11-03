import clsx from "clsx";
import type { ReactNode } from "react";

export function ProgressCell({
  value,
  complete,
  label,
  textClassName,
  children,
}: {
  value: number;
  complete: boolean;
  label: string;
  textClassName: string;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <progress
        className={clsx(
          "progress h-1.5 w-8",
          complete ? "progress-success" : "progress-primary",
        )}
        value={value}
        max={1}
        aria-label={label}
      />
      <span className={textClassName}>{children}</span>
    </span>
  );
}
