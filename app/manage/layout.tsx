import { AdmAuthBootstrap } from "@/components/adm-auth-bootstrap"

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdmAuthBootstrap requireAuth skipAuthPathPrefix="/manage/aplicar">
      {children}
    </AdmAuthBootstrap>
  )
}
