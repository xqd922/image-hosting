"use client"

import { useMediaQuery } from "@/hooks/use-media-query"
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts } = useToast()
  const isMobile = useMediaQuery("(max-width: 640px)")

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props} className={isMobile ? "w-[calc(100vw-2rem)] max-w-full" : ""}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport className={isMobile ? "bottom-0 left-0 right-0 top-auto" : ""} />
    </ToastProvider>
  )
}
