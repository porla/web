import type { ReactNode } from "react";

export function SettingsCard({ children }: { children: ReactNode }) {
  return (
    <div className="card bg-base-200 shadow-sm w-full">
      <div className="card-body">{children}</div>
    </div>
  );
}
