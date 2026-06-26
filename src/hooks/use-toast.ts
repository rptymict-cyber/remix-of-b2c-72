import * as React from "react";
import { toast as sonnerToast } from "sonner";

// Legacy compatibility shim: redirect all toast() calls to sonner
// so every toast uses the unified pill style at the top.
type ToastInput = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
};

function toast(props: ToastInput = {}) {
  const { title, description, variant, duration } = props;
  const message = (title ?? description ?? "") as React.ReactNode;
  const opts = {
    duration: duration ?? 3000,
    description: title && description ? (description as any) : undefined,
  };
  if (variant === "destructive") {
    sonnerToast.error(message as any, opts);
  } else {
    sonnerToast.success(message as any, opts);
  }
  return { id: "0", dismiss: () => {}, update: () => {} };
}

function useToast() {
  return {
    toasts: [] as any[],
    toast,
    dismiss: () => {},
  };
}

export { useToast, toast };
