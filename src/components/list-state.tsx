import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// Takes the place of a table (headers too) when there's nothing to list, or
// it couldn't be loaded.
export default function ListState({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-box border border-base-300 bg-base-200 px-6 py-5 text-center">
        <Icon className="mx-auto mb-2 size-6 opacity-50" />
        <div className="font-semibold">{title}</div>
        {children && <div className="mt-1 text-sm opacity-80">{children}</div>}
      </div>
    </div>
  );
}
