import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm text-slate-900 transition-all duration-200 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50",
        "hover:bg-white hover:border-slate-300",
        "focus:bg-white focus:border-[#003366] focus:ring-4 focus:ring-blue-100",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
