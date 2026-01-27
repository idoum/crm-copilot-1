import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getWorkspaceContext } from '@/lib/workspace'
import { Sidebar, Header } from '@/components/layout'
import { I18nProvider } from '@/lib/i18n'
import { Toaster } from '@/components/ui/sonner'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const workspaceCtx = await getWorkspaceContext()

  if (!workspaceCtx) {
    // User has no workspace - redirect to create one
    redirect('/onboarding')
  }

  return (
    <I18nProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-64">
          <Header
            user={{
              name: session.user.name,
              email: session.user.email,
              image: session.user.image,
            }}
            workspaceName={workspaceCtx.workspaceName}
          />
          <main className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
        <Toaster position="bottom-right" richColors />
      </div>
    </I18nProvider>
  )
}
