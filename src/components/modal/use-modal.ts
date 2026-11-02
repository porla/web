// The modal API for components: useModal().show(Component, props) opens a modal
// and resolves with what it passes to close(), or undefined when dismissed (Esc,
// the backdrop, Cancel or Close). ModalProvider (modal-provider.tsx) renders them.
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

// The modal that renders a component: its title's id (the dialog's accessible
// name), a way to dismiss it, and whether Esc and the backdrop may.
type ModalInstance = {
  titleId: string | undefined;
  dismiss: () => void;
  setDismissible: (dismissible: boolean) => void;
};

export const ModalInstanceContext = createContext<ModalInstance>({
  titleId: undefined,
  dismiss: () => {},
  setDismissible: () => {},
});

// Closes the modal this component is in, the same as Esc or the backdrop: the
// show() promise resolves undefined.
export function useModalDismiss() {
  return useContext(ModalInstanceContext).dismiss;
}

export function useModalTitleId() {
  return useContext(ModalInstanceContext).titleId;
}

// Turns Esc and backdrop dismissal off while `dismissible` is false (a save is
// running, or the content can't be shown again).
export function useModalDismissible(dismissible: boolean) {
  const { setDismissible } = useContext(ModalInstanceContext);

  useEffect(() => {
    setDismissible(dismissible);
  }, [setDismissible, dismissible]);
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used inside <ModalProvider>");
  return ctx;
}
