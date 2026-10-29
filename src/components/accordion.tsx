import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

// A section that folds away, closed unless defaultOpen. Its content stays
// mounted while closed, so form fields in it keep their values.
export default function Accordion({
  title,
  defaultOpen = false,
  className = "bg-base-200",
  children,
}: {
  title: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <details
      open={isOpen}
      onToggle={(e) => setIsOpen(e.currentTarget.open)}
      className={clsx("collapse border border-base-300", className)}
    >
      <summary className="collapse-title font-semibold flex justify-between pr-4">
        <span>{title}</span>
        <span
          className={clsx(
            "transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        >
          <ChevronDown />
        </span>
      </summary>
      <div className="collapse-content text-sm">{children}</div>
    </details>
  );
}
