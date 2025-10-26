import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  type?: "default" | "success" | "error" | "warning" | "info";
  duration?: number;
  onClose?: (id: string) => void;
  className?: string;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    { id, title, description, type = "default", onClose, className, ...props },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
      // Animate in
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
      setIsVisible(false);
      setTimeout(() => onClose?.(id), 300);
    };

    const icons = {
      default: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
      success: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
      error: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      ),
      warning: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
      info: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
    };

    const colors = {
      default: "bg-white/10 border-white/20 text-white",
      success: "bg-green-500/20 border-green-500/30 text-green-100",
      error: "bg-red-500/20 border-red-500/30 text-red-100",
      warning: "bg-yellow-500/20 border-yellow-500/30 text-yellow-100",
      info: "bg-blue-500/20 border-blue-500/30 text-blue-100",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-start space-x-3 p-4 rounded-lg border backdrop-blur-md shadow-xl",
          "transform transition-all duration-300 ease-out",
          isVisible
            ? "translate-x-0 opacity-100 scale-100"
            : "translate-x-full opacity-0 scale-95",
          colors[type],
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "flex-shrink-0",
            type === "success" && "text-green-400",
            type === "error" && "text-red-400",
            type === "warning" && "text-yellow-400",
            type === "info" && "text-blue-400",
            type === "default" && "text-white/70"
          )}
        >
          {icons[type]}
        </div>

        <div className="flex-1 min-w-0">
          {title && <p className="text-sm font-medium">{title}</p>}
          {description && (
            <p className="text-sm opacity-90 mt-1">{description}</p>
          )}
        </div>

        <button
          onClick={handleClose}
          className="flex-shrink-0 ml-4 text-white/50 hover:text-white/80 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    );
  }
);
Toast.displayName = "Toast";

export { Toast };
