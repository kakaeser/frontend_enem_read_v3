import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

type AuthFlowShellProps = {
  children: React.ReactNode
  className?: string
}

export function AuthFlowShell({ children, className }: AuthFlowShellProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-read-dark bg-read-dark/40 p-0 backdrop-blur",
        className
      )}
    >
      <CardContent className="grid p-0 md:grid-cols-2">
        <div className="bg-read-logo-dark p-6 md:p-8">{children}</div>
        <div className="relative hidden bg-read-blue md:block">
          <img
            src="/logo.png"
            alt="ENEM da READ"
            className="absolute inset-0 h-full w-full object-contain p-8"
          />
        </div>
      </CardContent>
    </Card>
  )
}

export function AuthFlowHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <h1 className="text-2xl font-bold text-read-white">{title}</h1>
      <p className="text-balance text-sm text-read-gray">{description}</p>
    </div>
  )
}
