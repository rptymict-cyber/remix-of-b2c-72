import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      duration={3000}
      visibleToasts={1}
      offset={`calc(env(safe-area-inset-top, 0px) + 56px)`}
      icons={{
        success: <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-50" strokeWidth={2.5} />,
        error: <XCircle className="h-5 w-5 text-red-500" strokeWidth={2.5} />,
        warning: <AlertTriangle className="h-5 w-5 text-amber-500" strokeWidth={2.5} />,
        info: <Info className="h-5 w-5 text-sky-500" strokeWidth={2.5} />,
        loading: <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "mx-auto inline-flex items-center gap-2 rounded-full bg-white pl-2 pr-4 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-black/5 text-[14px] font-medium text-foreground w-auto max-w-[90vw]",
          title: "text-[14px] font-medium leading-none",
          description: "text-[12px] text-muted-foreground",
          icon: "flex items-center justify-center shrink-0",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
