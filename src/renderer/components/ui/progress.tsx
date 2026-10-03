import * as React from "react";
import { cn } from "../../lib/utils";

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Valeur entre 0 et 100 */
  value?: number | null;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, ...props }, ref) => {
    const safe = Math.min(100, Math.max(0, value ?? 0));
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safe}
        className={cn(
          "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
        {...props}
      >
        <div
          className="h-full w-full flex-1 bg-primary transition-transform"
          style={{ transform: `translateX(-${100 - safe}%)` }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };