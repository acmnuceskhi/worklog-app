"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-slate-900/80 group-[.toaster]:backdrop-blur-md group-[.toaster]:text-white group-[.toaster]:border-white/10 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-white/60",
          actionButton:
            "group-[.toast]:bg-blue-600 group-[.toast]:text-white group-[.toast]:hover:bg-blue-700 group-[.toast]:transition-colors",
          cancelButton:
            "group-[.toast]:bg-white/10 group-[.toast]:text-white/70 group-[.toast]:hover:bg-white/20 group-[.toast]:transition-colors",
          success:
            "group-[.toaster]:border-green-500/50 group-[.toaster]:bg-green-500/10",
          error:
            "group-[.toaster]:border-red-500/50 group-[.toaster]:bg-red-500/10",
          info: "group-[.toaster]:border-blue-500/50 group-[.toaster]:bg-blue-500/10",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
