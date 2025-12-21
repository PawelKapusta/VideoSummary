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
    <div className="[&_[data-sonner-toast]]:w-[700px] [&_[data-sonner-toast]]:max-w-none [&_[data-sonner-toast]]:text-xl [&_[data-sonner-toast]]:py-5 [&_[data-sonner-toast]]:px-8">
      <Sonner
        theme="light"
        className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 md:size-6" />,
        info: <InfoIcon className="size-4 md:size-6" />,
        warning: <TriangleAlertIcon className="size-4 md:size-6" />,
        error: <OctagonXIcon className="size-4 md:size-6" />,
        loading: <Loader2Icon className="size-4 md:size-6 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--width": "700px",
        } as React.CSSProperties
      }
      toastOptions={{
        className: '[&_[data-content]]:gap-3',
        style: {
          maxWidth: '700px',
          width: '700px',
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
