import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const BTN_TRANSITION =
  "transition-[background-color,color,border-color] duration-[120ms] ease-[cubic-bezier(0.2,0.7,0.1,1)]"

const buttonVariants = cva(
  cn(
    "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-none border border-transparent font-mono uppercase tracking-[0.08em] whitespace-nowrap select-none outline-none",
    BTN_TRANSITION,
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
  ),
  {
    variants: {
      variant: {
        default: cn(
          "bg-[var(--ink)] text-[var(--paper-0)] border-[var(--ink)]",
          "hover:bg-[var(--orange)] hover:border-[var(--orange)]"
        ),
        accent: cn(
          "bg-[var(--orange)] text-[var(--paper-0)] border-[var(--orange)]",
          "hover:bg-[var(--orange-deep)] hover:border-[var(--orange-deep)]"
        ),
        outline: cn(
          "bg-transparent text-[var(--ink)] border-[var(--ink)]",
          "hover:bg-[var(--ink)] hover:text-[var(--paper-0)]"
        ),
        secondary: cn(
          "bg-[var(--paper-1)] text-[var(--ink)] border-[var(--paper-1)]",
          "hover:bg-[var(--paper-2)] hover:border-[var(--paper-2)]"
        ),
        ghost: cn(
          "bg-transparent text-[var(--ink-2)] border-transparent",
          "hover:bg-[var(--paper-1)] hover:text-[var(--ink)]"
        ),
        destructive: cn(
          "bg-transparent text-[var(--signal-red)] border-[var(--signal-red)]",
          "hover:bg-[var(--signal-red)] hover:text-[var(--paper-0)]"
        ),
        link: cn(
          "bg-transparent border-transparent text-[var(--orange)] underline-offset-4 normal-case tracking-normal font-sans",
          "hover:underline"
        ),
      },
      size: {
        default:
          "h-10 px-5 text-xs has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        sm: "h-8 px-3 text-[10px] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 px-6 text-sm has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-sm": "size-8 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
