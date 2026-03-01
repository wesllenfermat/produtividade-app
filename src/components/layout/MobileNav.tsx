import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Target, Timer, Grid3X3, ListOrdered, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Home', icon: LayoutDashboard, url: '/' },
  { label: 'SMART', icon: Target, url: '/smart-goals' },
  { label: 'Pomodoro', icon: Timer, url: '/pomodoro' },
  { label: 'Eisenhower', icon: Grid3X3, url: '/eisenhower' },
  { label: 'Ivy Lee', icon: ListOrdered, url: '/ivy-lee' },
  { label: 'Chat', icon: Bot, url: '/chat' },
]

export function MobileNav() {
  const location = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const active = location.pathname === item.url
          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                'flex flex-col items-center gap-1 px-2 py-1 text-xs transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
