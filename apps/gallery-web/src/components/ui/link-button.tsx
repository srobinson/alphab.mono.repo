// src/components/ui/zed-link-button.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import Kbd from "./kbd";

export interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  shortcut?: React.ReactNode;
}

export const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ className, children, shortcut, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(
        "group select-none text-sm tracking-tight rounded-[3px] flex gap-1.5 items-center justify-center text-nowrap border border-gray-200 bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors duration-75 h-9 pl-2.5 pr-3 w-full sm:shrink-0 lg:w-fit font-normal text-black",
        className,
      )}
      {...props}
    >
      {children}
      {shortcut && <Kbd className="hidden sm:flex ml-1">{shortcut}</Kbd>}
    </a>
  ),
);
LinkButton.displayName = "LinkButton";
