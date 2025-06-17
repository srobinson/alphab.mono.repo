import * as React from "react";
import { cn } from "@/lib/utils";

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {}

const Kbd = React.forwardRef<HTMLElement, KbdProps>(({ className, ...props }, ref) => (
  <kbd
    ref={ref}
    className={cn(
      "h-5 max-w-max rounded-[3px] px-1.5 flex items-center gap-0.5 text-[11px] font-bold text-gray-500 border border-gray-500/20 bg-gray-50/50 select-none",
      className,
    )}
    {...props}
  />
));
Kbd.displayName = "Kbd";

export default Kbd;
