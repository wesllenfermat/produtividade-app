import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Target, Timer, Grid3X3, ListOrdered, Bot, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, url: '/' },
  { label: 'Metas SMART', icon: Target, url: '/smart-goals' },
  { label: 'Pomodoro', icon: Timer, url: '/pomodoro' },
  { label: 'Eisenhower', icon: Grid3X3, url: '/eisenhower' },
  { label: 'Ivy Lee', icon: ListOrdered, url: '/ivy-lee' },
  { label: 'Assistente', icon: Bot, url: '/chat' },
]

export function Sidebar() {
  const location = useLocation()
  const { user, signOut } = useAuth()

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card border-r border-border">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <div className="gradient-brand p-2 rounded-lg">
          <Target className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-display font-bold text-lg">Produtividade</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.url
          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-border">
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </aside>
  )
}
