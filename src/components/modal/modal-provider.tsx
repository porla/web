import { CatchBoundary } from "@tanstack/react-router";
import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  ModalContext,
  ModalInstanceContext,
  useModalDismiss,
  type ModalProps,
  type ShowFn,
} from "./use-modal";
import { Spinner } from "@/components/ui/spinner";
import { ModalTitle } from "@/components/modal/modal-title";

const DISMISSED = Symbol("dismissed"); // ESC / backdrop → resolves undefined

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

  const remove = useCallback((instance: Instance, result: unknown) => {
    instance.resolve(result);
    setInstances((prev) => prev.filter((i) => i !== instance));
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
  onClosed: (instance: Instance, result: unknown) => void;
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

  const titleId = useId();
  const modalInstance = useMemo(
    () => ({ titleId, dismiss: () => close(DISMISSED), setDismissible }),
    [titleId, close, setDismissible],
  );

  const handleClose = () => {
    const r = resultRef.current === DISMISSED ? undefined : resultRef.current;
    onClosed(instance, r);
  };

  const { Component, props } = instance;

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={titleId}
      onClose={handleClose}
      onCancel={(e) => {
        if (!dismissibleRef.current) {
          e.preventDefault();
        }
      }}
    >
      <div className="modal-box has-data-sticky-footer:pb-0 has-data-plugin-frame:flex has-data-plugin-frame:flex-col">
        {/* A modal that crashes or whose code fails to load (e.g. a stale tab
            after an upgrade) must not take the app down. */}
        <ModalInstanceContext.Provider value={modalInstance}>
          <CatchBoundary
            getResetKey={() => instance.id}
            errorComponent={({ error }) => <ModalError error={error} />}
          >
            <Suspense fallback={<Spinner />}>
              <Component {...props} close={close} />
            </Suspense>
          </CatchBoundary>
        </ModalInstanceContext.Provider>
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

function ModalError({ error }: { error: Error }) {
  const dismiss = useModalDismiss();

  return (
    <div className="space-y-3">
      <ModalTitle>This dialog failed to load</ModalTitle>
      <p className="text-sm opacity-70">
        Reloading the page usually helps after an upgrade.
      </p>
      <pre className="text-xs opacity-60 whitespace-pre-wrap">
        {error.message}
      </pre>
      <div className="modal-action">
        <button type="button" className="btn" onClick={dismiss}>
          Close
        </button>
      </div>
    </div>
  );
}
