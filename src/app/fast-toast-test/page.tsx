import { FastToastProvider } from "@/contexts/FastToastContext";
import { ToastPerformanceTest } from "@/components/ToastPerformanceTest";

export default function FastToastTestPage() {
  return (
    <FastToastProvider>
      <ToastPerformanceTest />
    </FastToastProvider>
  );
}