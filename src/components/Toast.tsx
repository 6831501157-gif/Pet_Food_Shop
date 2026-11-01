import type { ToastMessage } from "@/hooks/useToast";

export function Toast({ toast }: { toast: ToastMessage | null }) {
  if (!toast) return null;
  return (
    <div
      role="status"
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm text-white shadow-lg ${
        toast.error ? "bg-red-600" : "bg-stone-900"
      }`}
    >
      {toast.text}
    </div>
  );
}
