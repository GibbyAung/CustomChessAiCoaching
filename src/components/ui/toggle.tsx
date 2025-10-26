import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToggleProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: "sm" | "default" | "lg";
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  (
    { className, checked = false, onCheckedChange, size = "default", ...props },
    ref
  ) => {
    const handleClick = () => {
      onCheckedChange?.(!checked);
    };

    const sizes = {
      sm: "h-5 w-9",
      default: "h-6 w-11",
      lg: "h-7 w-14",
    };

    const thumbSizes = {
      sm: "h-3 w-3",
      default: "h-4 w-4",
      lg: "h-5 w-5",
    };

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        data-state={checked ? "checked" : "unchecked"}
        className={cn(
          "relative inline-flex items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent",
          checked
            ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg"
            : "bg-white/20 backdrop-blur-sm border border-white/20",
          sizes[size],
          className
        )}
        onClick={handleClick}
        ref={ref}
        {...props}
      >
        <span
          className={cn(
            "inline-block rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0.5",
            thumbSizes[size]
          )}
        />
      </button>
    );
  }
);
Toggle.displayName = "Toggle";

export { Toggle };
