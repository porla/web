// modal.tsx
import {
  createContext,
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

type ShowFn = <P extends ModalProps<any>>(
  Component: ComponentType<P>,
  // props arg is optional when the modal has no required own-props
  ...args: {} extends Omit<P, "close">
    ? [props?: Omit<P, "close">]
    : [props: Omit<P, "close">]
) => Promise<P extends ModalProps<infer R> ? R | undefined : undefined>;

const ModalContext = createContext<{ show: ShowFn } | null>(null);

const DISMISSED = Symbol("dismissed"); // ESC / backdrop → resolves undefined

interface Instance {
  id: number;
  Component: ComponentType<any>;
  props: Record<string, unknown>;
  resolve: (value: unknown) => void;
}

let counter = 0;

export function ModalProvider({ children }: { children: ReactNode }) {
  const [instances, setInstances] = useState<Instance[]>([]);

  const show = useCallback<ShowFn>((Component, props?) => {
    return new Promise((resolve) => {
      setInstances((prev) => [
        ...prev,
        { id: ++counter, Component, props: props ?? {}, resolve },
      ]);
    }) as any;
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

  useEffect(() => {
    dialogRef.current?.showModal();
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
    <dialog ref={dialogRef} className="modal" onClose={handleClose}>
      <div className="modal-box">
        <Component {...props} close={close} />
      </div>
      {/* click outside → dismiss (resolves undefined) */}
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used inside <ModalProvider>");
  return ctx;
}
