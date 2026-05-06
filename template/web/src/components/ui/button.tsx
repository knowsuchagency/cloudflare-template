import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const BTN_TRANSITION =
  "transition-[transform,box-shadow,background-color,color,border-color] duration-[80ms] ease-[cubic-bezier(0.2,0.7,0.3,1)]"

const buttonVariants = cva(
  cn(
    "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-none border-2 border-transparent font-sans font-semibold whitespace-nowrap select-none outline-none",
    BTN_TRANSITION,
    "focus-visible:ring-2 focus-visible:ring-[var(--bf-orange)]/60 focus-visible:ring-offset-0",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
  ),
  {
    variants: {
      variant: {
        default: cn(
          "bg-[var(--bf-orange)] text-[#0a0908] border-[var(--bf-orange)]",
          "hover:bg-[var(--bf-orange-hot)] hover:border-[var(--bf-orange-hot)]",
          "hover:shadow-[0_0_22px_rgba(255,107,26,0.35)]",
          "hover:-translate-x-px hover:-translate-y-px",
          "active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
        ),
        outline: cn(
          "bg-[var(--bg-1)] text-[var(--fg-1)] border-[var(--fg-1)]",
          "hover:bg-[var(--bg-2)]",
          "hover:-translate-x-px hover:-translate-y-px",
          "active:translate-x-[4px] active:translate-y-[4px]"
        ),
        secondary: cn(
          "bg-[var(--bg-2)] text-[var(--fg-1)] border-[var(--border-2)]",
          "hover:bg-[var(--bg-3)] hover:border-[var(--border-3)]"
        ),
        ghost: cn(
          "bg-transparent text-[var(--fg-2)] border-transparent",
          "hover:bg-[var(--bg-2)] hover:text-[var(--fg-1)]"
        ),
        destructive: cn(
          "bg-[var(--bg-1)] text-[var(--term-red)] border-[var(--term-red)]",
          "hover:bg-[#1a0f0e]",
          "hover:-translate-x-px hover:-translate-y-px",
          "active:translate-x-[4px] active:translate-y-[4px]"
        ),
        link: cn(
          "bg-transparent border-transparent text-[var(--bf-orange)] underline-offset-4",
          "hover:underline"
        ),
      },
      size: {
        default: "h-10 px-5 text-sm has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        sm: "h-8 px-3 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 px-6 text-[15px] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-sm": "size-8 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-12",
      },
    },
    compoundVariants: [
      {
        variant: "default",
        size: "lg",
        className: cn(
          "hover:shadow-[0_0_28px_rgba(255,107,26,0.4)]",
          "active:translate-x-[6px] active:translate-y-[6px]"
        ),
      },
      {
        variant: "default",
        size: "sm",
        className: cn(
          "hover:shadow-[0_0_14px_rgba(255,107,26,0.3)]",
          "active:translate-x-[3px] active:translate-y-[3px]"
        ),
      },
      {
        variant: "outline",
        size: "lg",
        className: "active:translate-x-[6px] active:translate-y-[6px]",
      },
      {
        variant: "outline",
        size: "sm",
        className: "active:translate-x-[3px] active:translate-y-[3px]",
      },
    ],
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
