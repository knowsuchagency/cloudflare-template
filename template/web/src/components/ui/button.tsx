import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const BTN_TRANSITION =
  "transition-[background-color,color,border-color,opacity] duration-[150ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"

const buttonVariants = cva(
  cn(
    "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-none border font-mono uppercase tracking-[0.08em] whitespace-nowrap select-none outline-none",
    BTN_TRANSITION,
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-0)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
  ),
  {
    variants: {
      variant: {
        // Solid monochrome fill — the primary control. Ink on light, white on dark.
        default: cn(
          "bg-[var(--fg-0)] text-[var(--bg-1)] border-[var(--fg-0)]",
          "hover:bg-[var(--fg-1)] hover:border-[var(--fg-1)]"
        ),
        // The red interrupt — one per screen, the single most urgent action.
        accent: cn(
          "bg-[var(--accent)] text-white border-[var(--accent)]",
          "hover:opacity-90"
        ),
        // Wireframe button — Nothing hover brightens border + text, no fill.
        outline: cn(
          "bg-transparent text-[var(--fg-1)] border-[var(--border-1)]",
          "hover:border-[var(--fg-0)] hover:text-[var(--fg-0)]"
        ),
        secondary: cn(
          "bg-[var(--bg-2)] text-[var(--fg-1)] border-[var(--bg-2)]",
          "hover:border-[var(--border-1)]"
        ),
        ghost: cn(
          "bg-transparent text-[var(--fg-2)] border-transparent",
          "hover:bg-[var(--bg-2)] hover:text-[var(--fg-1)]"
        ),
        destructive: cn(
          "bg-transparent text-[var(--accent)] border-[var(--accent)]",
          "hover:bg-[var(--accent)] hover:text-white"
        ),
        link: cn(
          "bg-transparent border-transparent text-[var(--interactive)] underline-offset-4 normal-case tracking-normal font-sans",
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

// cva variants ship alongside the component by shadcn convention
export { Button, buttonVariants }
