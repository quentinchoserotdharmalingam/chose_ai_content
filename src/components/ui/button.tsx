import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[13px] font-semibold transition-all duration-200 ease-in-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "rounded-full bg-ht-primary text-white hover:bg-ht-primary-dark shadow-ht-1",
        destructive: "rounded-lg bg-ht-error text-white hover:opacity-90",
        outline: "rounded-lg border border-ht-border-secondary bg-white text-ht-text hover:bg-ht-fill-secondary",
        secondary: "rounded-lg bg-ht-fill-secondary text-ht-text hover:bg-ht-border",
        ghost: "rounded-lg hover:bg-ht-fill-secondary text-ht-text",
        link: "text-ht-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-[12px]",
        lg: "h-12 px-8 text-[14px]",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
