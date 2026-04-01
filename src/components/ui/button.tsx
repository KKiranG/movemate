import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-w-[44px] items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-accent px-4 py-3 text-white hover:bg-[#0052cc] active:bg-[#0047b3]",
        secondary:
          "border border-border bg-surface px-4 py-3 text-text hover:bg-black/[0.02] active:bg-black/[0.05] dark:hover:bg-white/[0.04] dark:active:bg-white/[0.08]",
        ghost:
          "px-3 py-2 text-text-secondary hover:text-text active:bg-black/[0.04] active:text-text dark:hover:text-text dark:active:bg-white/[0.08]",
      },
      size: {
        default: "min-h-11",
        sm: "min-h-11 px-3 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
