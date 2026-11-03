import { prefixPath } from "@/lib/base-path";
import type { ReactNode } from "react";

// inputs at 16px on phones: iOS zooms into anything smaller when it's focused.
export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-base-200 p-4">
      <div className="group/auth card card-border w-full max-w-sm bg-base-100 shadow-sm max-sm:[&_input]:text-base">
        <div className="card-body gap-6 p-6 sm:p-8">
          <header className="flex flex-col items-center gap-3 text-center">
            <div className="relative">
              <img
                src={prefixPath("/porla.svg")}
                alt=""
                width={48}
                height={48}
                className="size-12 object-contain"
              />
              <Shades />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-semibold">{title}</h1>
              {description && (
                <p className="text-sm text-base-content/70">{description}</p>
              )}
            </div>
          </header>

          {children}
        </div>
      </div>
    </main>
  );
}

// Porla looks away while a password is typed.
function Shades() {
  const lens =
    "relative h-3 w-4 rounded-t-sm rounded-b-full bg-neutral after:absolute after:top-1 after:left-0.5 after:h-0.5 after:w-2 after:-rotate-30 after:rounded-full after:bg-neutral-content/40";

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-[34%] flex -translate-y-8 -rotate-6 items-start justify-center opacity-0 transition duration-300 ease-out group-has-[[data-secret]:focus]/auth:translate-y-0 group-has-[[data-secret]:focus]/auth:opacity-100 motion-reduce:transition-none"
    >
      <span className={lens} />
      <span className="mt-0.5 h-0.5 w-1.5 bg-neutral" />
      <span className={lens} />
    </span>
  );
}
