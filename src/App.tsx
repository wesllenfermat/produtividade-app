import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Layout } from '@/components/layout/Layout'
import Login from '@/pages/Login'
import Index from '@/pages/Index'
import SmartGoals from '@/pages/SmartGoals'
import Pomodoro from '@/pages/Pomodoro'
import Eisenhower from '@/pages/Eisenhower'
import IvyLee from '@/pages/IvyLee'
import Chat from '@/pages/Chat'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <AuthGuard>
                <Layout />
              </AuthGuard>
            }
          >
            <Route path="/" element={<Index />} />
            <Route path="/smart-goals" element={<SmartGoals />} />
            <Route path="/pomodoro" element={<Pomodoro />} />
            <Route path="/eisenhower" element={<Eisenhower />} />
            <Route path="/ivy-lee" element={<IvyLee />} />
            <Route path="/chat" element={<Chat />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
