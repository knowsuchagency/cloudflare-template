"use client"

import type * as React from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheck, CircleX, Info, Loader, TriangleAlert } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      icons={{
        success: <CircleCheck className="size-4 text-[var(--success)]" />,
        info: <Info className="size-4 text-[var(--interactive)]" />,
        warning: <TriangleAlert className="size-4 text-[var(--warning)]" />,
        error: <CircleX className="size-4 text-[var(--accent)]" />,
        loading: (
          <Loader className="size-4 animate-spin text-[var(--fg-2)]" />
        ),
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
