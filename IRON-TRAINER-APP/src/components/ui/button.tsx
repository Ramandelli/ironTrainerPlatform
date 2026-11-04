import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-foreground hover:shadow-primary transform hover:scale-105 font-semibold",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-border bg-card/50 backdrop-blur-sm text-foreground hover:bg-card hover:shadow-card",
        secondary: "bg-gradient-steel text-foreground hover:shadow-lg transform hover:scale-105",
        ghost: "hover:bg-card/80 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Iron Tracker specific variants
        workout: "bg-gradient-primary text-foreground font-bold py-3 px-6 rounded-xl shadow-primary hover:shadow-timer transform hover:scale-105 active:scale-95",
        exercise: "bg-card text-foreground border border-border hover:border-primary hover:shadow-card transform hover:scale-102",
        timer: "bg-iron-orange text-foreground font-bold rounded-full shadow-timer animate-pulse hover:animate-none transform hover:scale-110",
        success: "bg-gradient-success text-foreground font-semibold hover:shadow-lg transform hover:scale-105",
        rest: "bg-steel-blue text-foreground border-2 border-iron-orange/50 hover:border-iron-orange transform hover:scale-105"
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
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
