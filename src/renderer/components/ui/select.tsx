import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * Select léger (sans Radix) exposant l'API utilisée par l'application :
 * <Select value onValueChange><SelectTrigger><SelectValue placeholder />
 * <SelectContent><SelectItem value>label</SelectItem></SelectContent></Select>
 */

interface SelectContextValue {
  value: string;
  setValue: (v: string) => void;
}

const SelectCtx = React.createContext<SelectContextValue | null>(null);

function useSelect() {
  const ctx = React.useContext(SelectCtx);
  if (!ctx) throw new Error("Select components must be used within <Select>");
  return ctx;
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export function Select({ value, defaultValue, onValueChange, children }: SelectProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const current = value !== undefined ? value : internal;

  const setValue = React.useCallback(
    (v: string) => {
      if (value === undefined) setInternal(v);
      onValueChange?.(v);
    },
    [value, onValueChange]
  );

  return (
    <SelectCtx.Provider value={{ value: current, setValue }}>
      <div className="relative w-full">{children}</div>
    </SelectCtx.Provider>
  );
}

export const SelectTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
    <span className="ml-2 opacity-50">&#9662;</span>
  </div>
));
SelectTrigger.displayName = "SelectTrigger";

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useSelect();
  return <>{value !== "" ? value : placeholder}</>;
}

export const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-input bg-popover p-1 shadow-md",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
SelectContent.displayName = "SelectContent";

export function SelectItem({
  value,
  children,
  className,
  ...props
}: { value: string; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const { setValue } = useSelect();
  return (
    <div
      role="option"
      aria-selected={false}
      onClick={() => setValue(value)}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}