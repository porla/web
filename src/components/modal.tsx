// modal.tsx
import { CatchBoundary } from "@tanstack/react-router";
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

// Injected into every modal so it can resolve the promise
export interface ModalProps<Result = void> {
  close: (result: Result) => void;
}

type ShowFn = <P extends ModalProps<never>>(
  Component: ComponentType<P>,
  // props arg is optional when the modal has no required own-props
  ...args: Record<string, never> extends Omit<P, "close">
    ? [props?: Omit<P, "close">]
    : [props: Omit<P, "close">]
) => Promise<P extends ModalProps<infer R> ? R | undefined : undefined>;

const ModalContext = createContext<{ show: ShowFn } | null>(null);

const DISMISSED = Symbol("dismissed"); // ESC / backdrop → resolves undefined

// Lets the open modal turn off Esc and backdrop dismissal.
const DismissibleContext = createContext<(dismissible: boolean) => void>(
  () => {},
);

interface Instance {
  id: number;
  Component: ComponentType<ModalProps<never>>;
  props: Record<string, unknown>;
  resolve: (value: unknown) => void;
}

let counter = 0;

export function ModalProvider({ children }: { children: ReactNode }) {
  const [instances, setInstances] = useState<Instance[]>([]);

  const show = useCallback<ShowFn>((Component, props?) => {
    return new Promise<unknown>((resolve) => {
      setInstances((prev) => [
        ...prev,
        {
          id: ++counter,
          // Instances hold modals of every result type side by side
          Component: Component as ComponentType<ModalProps<never>>,
          props: props ?? {},
          resolve,
        },
      ]);
    }) as Promise<never>;
  }, []);

  const remove = useCallback((id: number, result: unknown) => {
    setInstances((prev) => {
      prev.find((i) => i.id === id)?.resolve(result);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  return (
    <ModalContext.Provider value={{ show }}>
      {children}
      {instances.map((inst) => (
        <ModalHost key={inst.id} instance={inst} onClosed={remove} />
      ))}
    </ModalContext.Provider>
  );
}

function ModalHost({
  instance,
  onClosed,
}: {
  instance: Instance;
  onClosed: (id: number, result: unknown) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resultRef = useRef<unknown>(DISMISSED);
  const dismissibleRef = useRef(true);

  const setDismissible = useCallback((dismissible: boolean) => {
    dismissibleRef.current = dismissible;
  }, []);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    // Chrome ignores a prevented cancel on a repeated Esc, so stop the key
    // itself; then no close request is made. On the document, because focus
    // can leave the dialog (a disabled submit button drops it to <body>).
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !dismissibleRef.current) e.preventDefault();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, []);

  const close = useCallback((result: unknown) => {
    resultRef.current = result;
    dialogRef.current?.close(); // fires the native "close" event
  }, []);

  const handleClose = () => {
    const r = resultRef.current === DISMISSED ? undefined : resultRef.current;
    onClosed(instance.id, r);
  };

  const { Component, props } = instance;

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onClose={handleClose}
      onCancel={(e) => {
        if (!dismissibleRef.current) {
          e.preventDefault();
        }
      }}
    >
      <div className="modal-box has-data-sticky-footer:pb-0">
        {/* A modal that crashes or whose code fails to load (e.g. a stale tab
            after an upgrade) must not take the app down. */}
        <CatchBoundary
          getResetKey={() => instance.id}
          errorComponent={({ error }) => (
            <ModalError error={error} onClose={() => close(DISMISSED)} />
          )}
        >
          <Suspense fallback={<span className="loading loading-spinner" />}>
            <DismissibleContext.Provider value={setDismissible}>
              <Component {...props} close={close} />
            </DismissibleContext.Provider>
          </Suspense>
        </CatchBoundary>
      </div>
      {/* click outside → dismiss (resolves undefined). Not a button: the
          dialog focuses its first focusable element, and Enter would close it. */}
      <div
        className="modal-backdrop"
        onClick={() => dismissibleRef.current && close(DISMISSED)}
      />
    </dialog>
  );
}

function ModalError({ error, onClose }: { error: Error; onClose: () => void }) {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg">This dialog failed to load</h3>
      <p className="text-sm opacity-70">
        Reloading the page usually helps after an upgrade.
      </p>
      <pre className="text-xs opacity-60 whitespace-pre-wrap">
        {error.message}
      </pre>
      <div className="modal-action">
        <button type="button" className="btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs with its provider
export function useModalDismissible(dismissible: boolean) {
  const setDismissible = useContext(DismissibleContext);

  useEffect(() => {
    setDismissible(dismissible);
  }, [setDismissible, dismissible]);
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs with its provider
export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used inside <ModalProvider>");
  return ctx;
}
