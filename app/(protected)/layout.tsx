import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { TopAppBar } from '@/components/TopAppBar'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <>
      <Sidebar />
      <div className="md:ml-64 flex flex-col min-h-screen bg-surface-container-low">
        <TopAppBar />
        {children}
      </div>
    </>
  )
}
