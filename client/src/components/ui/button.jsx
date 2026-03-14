import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 font-inter",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[#B45309] to-[#F59E0B] text-[#0C1210] hover:brightness-110",
        destructive: "bg-[#DC2626] text-white hover:bg-red-600",
        outline: "border border-[#243028] bg-transparent hover:bg-[#1A2420] text-[#E5E5E5]",
        secondary: "bg-[#1A2420] text-[#E5E5E5] hover:bg-[#243028]",
        ghost: "hover:bg-[#1A2420] text-[#E5E5E5]",
        link: "text-[#D97706] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
