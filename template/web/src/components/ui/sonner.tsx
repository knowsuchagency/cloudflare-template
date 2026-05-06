"use client"

import type * as React from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CircleCheck,
  CircleX,
  Info,
  Loader,
  TriangleAlert,
} from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <CircleCheck className="size-4 text-[var(--term-green)]" />,
        info: <Info className="size-4 text-[var(--term-blue)]" />,
        warning: <TriangleAlert className="size-4 text-[var(--term-amber)]" />,
        error: <CircleX className="size-4 text-[var(--term-red)]" />,
        loading: <Loader className="size-4 animate-spin text-[var(--bf-orange)]" />,
      }}
      style={
        {
          "--normal-bg": "var(--bg-1)",
          "--normal-text": "var(--fg-1)",
          "--normal-border": "var(--border-1)",
          "--border-radius": "0px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
