import { Suspense } from "react"
import { AcceptInviteForm } from "@/components/accept-invite-form"

export default function AceitarConvitePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-read-darkest p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <Suspense fallback={<p className="text-center text-read-gray">Carregando...</p>}>
          <AcceptInviteForm />
        </Suspense>
      </div>
    </div>
  )
}
