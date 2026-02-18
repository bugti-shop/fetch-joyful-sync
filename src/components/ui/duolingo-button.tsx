import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const duolingoButtonVariants = cva(
  "relative inline-flex items-center justify-center font-bold transition-all duration-150 active:translate-y-1 active:shadow-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#58cc02] text-white shadow-[0_5px_0_0_#58a700] hover:bg-[#61d802] active:bg-[#4caf00]",
        secondary: "bg-white text-[#4b4b4b] border-2 border-[#e5e5e5] shadow-[0_5px_0_0_#e5e5e5] hover:bg-[#f7f7f7] active:bg-[#ebebeb]",
        dark: "bg-[#1cb0f6] text-white shadow-[0_5px_0_0_#1899d6] hover:bg-[#1dc3ff] active:bg-[#0999db]",
        premium: "bg-[#ffc800] text-[#1a1a1a] shadow-[0_5px_0_0_#e5b400] hover:bg-[#ffd429] active:bg-[#e5b400]",
        black: "bg-black text-white shadow-[0_5px_0_0_#333333] hover:bg-[#1a1a1a] active:bg-[#000000]",
        outline: "bg-transparent text-[#1cb0f6] border-2 border-[#1cb0f6] shadow-[0_5px_0_0_#1899d6] hover:bg-[#1cb0f6]/10 active:bg-[#1cb0f6]/20",
      },
      size: {
        default: "h-14 px-8 text-base rounded-2xl",
        sm: "h-10 px-4 text-sm rounded-xl",
        lg: "h-16 px-10 text-lg rounded-2xl",
        full: "w-full h-14 px-8 text-base rounded-2xl",
        fullLg: "w-full h-16 px-10 text-lg rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface DuolingoButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof duolingoButtonVariants> {
  asChild?: boolean;
}

const DuolingoButton = React.forwardRef<HTMLButtonElement, DuolingoButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(duolingoButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
DuolingoButton.displayName = "DuolingoButton";

export { DuolingoButton, duolingoButtonVariants };
