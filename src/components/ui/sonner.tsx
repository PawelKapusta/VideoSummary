import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <div className="[&_[data-sonner-toast]]:w-[600px] [&_[data-sonner-toast]]:max-w-none [&_[data-sonner-toast]]:py-5 [&_[data-sonner-toast]]:px-8 [&_[data-content]]:!ml-4">
      <Sonner
        theme="light"
        className="toaster group"
        icons={{
          success: <CircleCheckIcon className="size-6 flex-shrink-0 text-green-600" />,
          info: <InfoIcon className="size-6 flex-shrink-0 text-blue-600" />,
          warning: <TriangleAlertIcon className="size-6 flex-shrink-0 text-yellow-600" />,
          error: <OctagonXIcon className="size-6 flex-shrink-0 text-red-600" />,
          loading: <Loader2Icon className="size-6 flex-shrink-0 animate-spin" />,
        }}
        style={
          {
            "--normal-bg": "var(--popover)",
            "--normal-text": "var(--popover-foreground)",
            "--normal-border": "var(--border)",
            "--border-radius": "var(--radius)",
            "--width": "600px",
          } as React.CSSProperties
        }
        toastOptions={{
          style: {
            fontSize: '16px',
            fontWeight: '600',
          },
        }}
        {...props}
      />
    </div>
  )
}

export { Toaster }
