// The modal API for components: useModal().show(Component, props) opens a modal and
// resolves with what it passes to close(), or undefined when dismissed. ModalProvider
// (modal-provider.tsx) renders them.
import {
  createContext,
  useContext,
  useEffect,
  type ComponentType,
} from "react";

// Injected into every modal so it can resolve the promise
export interface ModalProps<Result = void> {
  close: (result: Result) => void;
}

export type ShowFn = <P extends ModalProps<never>>(
  Component: ComponentType<P>,
  // props arg is optional when the modal has no required own-props
  ...args: Record<string, never> extends Omit<P, "close">
    ? [props?: Omit<P, "close">]
    : [props: Omit<P, "close">]
) => Promise<P extends ModalProps<infer R> ? R | undefined : undefined>;

export const ModalContext = createContext<{ show: ShowFn } | null>(null);

// Lets the open modal turn off Esc and backdrop dismissal.
export const DismissibleContext = createContext<(dismissible: boolean) => void>(
  () => {},
);

export function useModalDismissible(dismissible: boolean) {
  const setDismissible = useContext(DismissibleContext);

  useEffect(() => {
    setDismissible(dismissible);
  }, [setDismissible, dismissible]);
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used inside <ModalProvider>");
  return ctx;
}
