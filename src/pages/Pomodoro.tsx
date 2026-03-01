import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { useNotifications } from '@/hooks/useNotifications'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Play, Pause, RotateCcw, Coffee, Bell, BellOff } from 'lucide-react'

export default function Pomodoro() {
  const { pomodoroSessions, addPomodoroSession } = useAppStore()
  const { permission, supported, requestPermission, notify } = useNotifications()
  const [minutes, setMinutes] = useState(25)
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [task, setTask] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isBreakRef = useRef(isBreak)
  const taskRef = useRef(task)

  useEffect(() => { isBreakRef.current = isBreak }, [isBreak])
  useEffect(() => { taskRef.current = task }, [task])

  const today = new Date().toISOString().slice(0, 10)
  const todayCount = pomodoroSessions.filter((s) => s.date === today && s.completed).length

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setSeconds((prevSec) => {
        if (prevSec > 0) return prevSec - 1

        // Seconds hit 0 — decrement minutes
        setMinutes((prevMin) => {
          if (prevMin > 0) return prevMin - 1

          // Timer complete
          clearInterval(intervalRef.current!)
          setIsRunning(false)

          if (!isBreakRef.current) {
            addPomodoroSession({
              id: crypto.randomUUID(),
              date: new Date().toISOString().slice(0, 10),
              duration: 25,
              completed: true,
              task: taskRef.current || undefined,
            })
            notify('🍅 Pomodoro concluído!', {
              body: taskRef.current
                ? `Ótimo foco em "${taskRef.current}"! Hora de uma pausa de 5 min.`
                : 'Ótimo foco! Hora de uma pausa de 5 min.',
            })
            setIsBreak(true)
            setMinutes(5)
            setSeconds(0)
          } else {
            notify('⏰ Pausa encerrada!', {
              body: 'Hora de voltar ao foco! Inicie um novo Pomodoro.',
            })
            setIsBreak(false)
            setMinutes(25)
            setSeconds(0)
          }

          return 0
        })

        return 59
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, addPomodoroSession, notify])

  const reset = () => {
    setIsRunning(false)
    setIsBreak(false)
    setMinutes(25)
    setSeconds(0)
  }

  const pad = (n: number) => n.toString().padStart(2, '0')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Pomodoro Timer</h1>
          <p className="text-muted-foreground mt-1">Foco em ciclos de 25 minutos</p>
        </div>
        {supported && (
          <Button
            variant="outline"
            size="sm"
            onClick={requestPermission}
            className={permission === 'granted' ? 'text-success border-success/30' : ''}
          >
            {permission === 'granted' ? (
              <><Bell className="h-4 w-4" /> Notificações ativas</>
            ) : (
              <><BellOff className="h-4 w-4" /> Ativar notificações</>
            )}
          </Button>
        )}
      </div>

      <Card className="shadow-card">
        <CardContent className="py-10 flex flex-col items-center gap-6">
          <div className={`text-7xl font-display font-bold tabular-nums ${isBreak ? 'text-success' : 'text-primary'}`}>
            {pad(minutes)}:{pad(seconds)}
          </div>
          <p className="text-muted-foreground font-medium">
            {isBreak ? (
              <span className="flex items-center gap-2"><Coffee className="h-4 w-4" /> Pausa de 5 min</span>
            ) : (
              'Sessão de Foco'
            )}
          </p>

          <Input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="No que você está trabalhando?"
            className="max-w-sm text-center"
            disabled={isRunning}
          />

          <div className="flex gap-3">
            <Button
              size="lg"
              onClick={() => setIsRunning(!isRunning)}
              className={isBreak ? 'bg-success hover:bg-success/90' : ''}
            >
              {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {isRunning ? 'Pausar' : 'Iniciar'}
            </Button>
            <Button size="lg" variant="outline" onClick={reset}>
              <RotateCcw className="h-5 w-5" /> Resetar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">Pomodoros concluídos hoje</p>
          <p className="text-4xl font-display font-bold text-primary mt-2">{todayCount}</p>
          <p className="text-xs text-muted-foreground mt-1">{todayCount * 25} minutos de foco</p>
        </CardContent>
      </Card>
    </div>
  )
}
