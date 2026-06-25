import * as React from "react";
import type { ToastPosition } from "react-toastify";

export type AlertPosition = Extract<
  ToastPosition,
  "top-left" | "top-right" | "bottom-left" | "bottom-right"
>;

export const ALERT_POSITIONS: Array<{
  value: AlertPosition;
  label: string;
}> = [
  { value: "top-left", label: "Top Left" },
  { value: "top-right", label: "Top Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-right", label: "Bottom Right" },
];

const ALERT_POSITION_STORAGE_KEY = "alert-position";
const DEFAULT_ALERT_POSITION: AlertPosition = "top-left";

interface ToastPositionContextValue {
  position: AlertPosition;
  setPosition: (position: AlertPosition) => void;
}

const ToastPositionContext = React.createContext<
  ToastPositionContextValue | undefined
>(undefined);

const isAlertPosition = (value: string | null): value is AlertPosition =>
  value === "top-left" ||
  value === "top-right" ||
  value === "bottom-left" ||
  value === "bottom-right";

const getInitialPosition = (): AlertPosition => {
  const stored = localStorage.getItem(ALERT_POSITION_STORAGE_KEY);
  return isAlertPosition(stored) ? stored : DEFAULT_ALERT_POSITION;
};

const ToastPositionProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [position, setPositionState] =
    React.useState<AlertPosition>(getInitialPosition);

  const setPosition = React.useCallback((nextPosition: AlertPosition) => {
    setPositionState(nextPosition);
    localStorage.setItem(ALERT_POSITION_STORAGE_KEY, nextPosition);
  }, []);

  const value = React.useMemo(
    () => ({
      position,
      setPosition,
    }),
    [position, setPosition],
  );

  return (
    <ToastPositionContext.Provider value={value}>
      {children}
    </ToastPositionContext.Provider>
  );
};

export const useToastPosition = () => {
  const context = React.useContext(ToastPositionContext);
  if (!context) {
    throw new Error(
      "useToastPosition must be used within ToastPositionProvider",
    );
  }
  return context;
};

export default ToastPositionProvider;
