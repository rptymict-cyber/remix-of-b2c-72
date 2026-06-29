import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { Check, Info, AlertTriangle, XCircle, Loader2 } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const IconBubble = ({
  bg,
  children,
}: {
  bg: string;
  children: React.ReactNode;
}) => (
  <span
    className="flex items-center justify-center rounded-full shrink-0"
    style={{ width: 32, height: 32, background: bg }}
  >
    {children}
  </span>
);

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      duration={3000}
      visibleToasts={1}
      offset={`calc(var(--app-header-height, 84px) + 8px)`}
      icons={{
        success: (
          <IconBubble bg="hsl(142 60% 45%)">
            <Check className="h-[18px] w-[18px] text-white" strokeWidth={3} />
          </IconBubble>
        ),
        error: (
          <IconBubble bg="hsl(0 72% 55%)">
            <XCircle className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
          </IconBubble>
        ),
        warning: (
          <IconBubble bg="hsl(38 92% 55%)">
            <AlertTriangle className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
          </IconBubble>
        ),
        info: (
          <IconBubble bg="hsl(210 80% 55%)">
            <Info className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
          </IconBubble>
        ),
        loading: (
          <IconBubble bg="hsl(215 10% 55%)">
            <Loader2 className="h-[18px] w-[18px] animate-spin text-white" />
          </IconBubble>
        ),
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "app-toast",
          title: "app-toast-title",
          description: "app-toast-description",
          icon: "app-toast-icon",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
