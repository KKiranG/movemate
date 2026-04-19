import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-md)] border text-[15px] font-medium leading-[22px] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] disabled:cursor-not-allowed disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-[var(--accent)] px-4 py-3 text-[var(--text-on-accent)] shadow-[0_8px_24px_rgba(201,82,28,0.18)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-pressed)]",
        secondary:
          "border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] px-4 py-3 text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]",
        ghost:
          "border-transparent bg-transparent px-3 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-2)] hover:text-[var(--text-primary)] active:bg-[var(--bg-elevated-3)] active:text-[var(--text-primary)]",
        destructive:
          "border-transparent bg-[var(--danger)] px-4 py-3 text-[var(--text-on-accent)] hover:brightness-110 active:brightness-90",
        icon: "h-10 w-10 rounded-[var(--radius-sm)] border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] p-2 text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]",
        chip: "rounded-[var(--radius-pill)] border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] px-3 py-1.5 text-[13px] leading-[18px] text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]",
      },
      size: {
        default: "min-h-[54px]",
        sm: "min-h-10 px-3 text-[13px]",
        compact: "min-h-8 px-3 text-[13px]",
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
