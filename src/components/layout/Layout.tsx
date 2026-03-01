import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { useAuth } from '@/contexts/AuthContext'
import { LogOut } from 'lucide-react'

export function Layout() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <span className="text-sm font-display font-bold text-foreground">Produtividade</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground truncate max-w-[150px]">
            {user?.email}
          </span>
          <button
            onClick={() => signOut()}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
      <main className="md:ml-64 px-4 py-6 pb-20 md:pb-6">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  )
}
