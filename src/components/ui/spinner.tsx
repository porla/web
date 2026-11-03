import clsx from "clsx";

const sizes = {
  xs: "loading-xs",
  sm: "loading-sm",
  md: "loading-md",
  lg: "loading-lg",
  xl: "loading-xl",
} as const;

// Something is loading. Announced to screen readers as "Loading".
export function Spinner({
  size,
  className,
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={clsx(
        "loading loading-spinner",
        size && sizes[size],
        className,
      )}
    />
  );
}
