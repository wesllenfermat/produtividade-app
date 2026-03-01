import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { useNotifications } from '@/hooks/useNotifications'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Bell,
  BellOff,
  Settings,
  History,
  Timer,
  Clock,
} from 'lucide-react'

type Tab = 'timer' | 'config' | 'history'

export default function Pomodoro() {
  const {
    pomodoroSessions,
    addPomodoroSession,
    pomodoroHistory,
    addPomodoroHistory,
    pomodoroSettings,
    updatePomodoroSettings,
  } = useAppStore()
  const { permission, supported, requestPermission, notify } = useNotifications()

  const [activeTab, setActiveTab] = useState<Tab>('timer')
  const [minutes, setMinutes] = useState(pomodoroSettings.focusMinutes)
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [task, setTask] = useState('')

  // Configurações locais (formulário)
  const [focusInput, setFocusInput] = useState(String(pomodoroSettings.focusMinutes))
  const [breakInput, setBreakInput] = useState(String(pomodoroSettings.breakMinutes))
  const [savedMsg, setSavedMsg] = useState(false)

  // Refs para evitar stale closures dentro do setInterval
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isBreakRef = useRef(isBreak)
  const taskRef = useRef(task)
  const startedAtRef = useRef<string | null>(null)
  const focusMinutesRef = useRef(pomodoroSettings.focusMinutes)
  const breakMinutesRef = useRef(pomodoroSettings.breakMinutes)

  useEffect(() => { isBreakRef.current = isBreak }, [isBreak])
  useEffect(() => { taskRef.current = task }, [task])
  useEffect(() => { focusMinutesRef.current = pomodoroSettings.focusMinutes }, [pomodoroSettings.focusMinutes])
  useEffect(() => { breakMinutesRef.current = pomodoroSettings.breakMinutes }, [pomodoroSettings.breakMinutes])

  // Sincroniza o timer quando as configurações mudam (apenas se parado)
  useEffect(() => {
    if (!isRunning) {
      setMinutes(isBreak ? pomodoroSettings.breakMinutes : pomodoroSettings.focusMinutes)
      setSeconds(0)
    }
  }, [pomodoroSettings, isRunning, isBreak])

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

        setMinutes((prevMin) => {
          if (prevMin > 0) return prevMin - 1

          // Timer zerou
          clearInterval(intervalRef.current!)
          setIsRunning(false)

          const endedAt = new Date().toISOString()

          if (!isBreakRef.current) {
            // Sessão de foco concluída → salva
            addPomodoroSession({
              id: crypto.randomUUID(),
              date: new Date().toISOString().slice(0, 10),
              duration: focusMinutesRef.current,
              completed: true,
              task: taskRef.current || undefined,
            })

            if (startedAtRef.current) {
              addPomodoroHistory({
                id: crypto.randomUUID(),
                task: taskRef.current || 'Sessão sem título',
                startedAt: startedAtRef.current,
                endedAt,
                focusMinutes: focusMinutesRef.current,
              })
              startedAtRef.current = null
            }

            notify('🍅 Pomodoro concluído!', {
              body: taskRef.current
                ? `Ótimo foco em "${taskRef.current}"! Hora de uma pausa de ${breakMinutesRef.current} min.`
                : `Ótimo foco! Hora de uma pausa de ${breakMinutesRef.current} min.`,
            })
            setIsBreak(true)
            setMinutes(breakMinutesRef.current)
            setSeconds(0)
          } else {
            notify('⏰ Pausa encerrada!', {
              body: 'Hora de voltar ao foco! Inicie um novo Pomodoro.',
            })
            setIsBreak(false)
            setMinutes(focusMinutesRef.current)
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
  }, [isRunning, addPomodoroSession, addPomodoroHistory, notify])

  const handleToggleRunning = () => {
    if (!isRunning && !isBreak && startedAtRef.current === null) {
      // Início de nova sessão de foco
      startedAtRef.current = new Date().toISOString()
    }
    setIsRunning((r) => !r)
  }

  const reset = () => {
    setIsRunning(false)
    setIsBreak(false)
    setMinutes(pomodoroSettings.focusMinutes)
    setSeconds(0)
    startedAtRef.current = null
  }

  const saveSettings = () => {
    const focus = Math.max(1, Math.min(90, parseInt(focusInput) || 25))
    const brk = Math.max(1, Math.min(30, parseInt(breakInput) || 5))
    updatePomodoroSettings({ focusMinutes: focus, breakMinutes: brk })
    setFocusInput(String(focus))
    setBreakInput(String(brk))
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2500)
  }

  const pad = (n: number) => n.toString().padStart(2, '0')

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const formatDateLabel = (isoDate: string) => {
    const [y, m, d] = isoDate.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Hoje'
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem'
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  }

  // Agrupa histórico por data (já vem em ordem decrescente por inserção)
  const historyByDate = pomodoroHistory.reduce<Record<string, typeof pomodoroHistory>>(
    (acc, entry) => {
      const date = entry.startedAt.slice(0, 10)
      if (!acc[date]) acc[date] = []
      acc[date].push(entry)
      return acc
    },
    {}
  )

  const totalMinutes = pomodoroHistory.reduce((s, e) => s + e.focusMinutes, 0)
  const totalHours = Math.floor(totalMinutes / 60)
  const totalMins = totalMinutes % 60

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'timer', label: 'Timer', icon: <Timer className="h-4 w-4" /> },
    { id: 'config', label: 'Configurar', icon: <Settings className="h-4 w-4" /> },
    { id: 'history', label: 'Histórico', icon: <History className="h-4 w-4" /> },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Pomodoro Timer</h1>
          <p className="text-muted-foreground mt-1">
            Foco · {pomodoroSettings.focusMinutes} min / Pausa · {pomodoroSettings.breakMinutes} min
          </p>
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

      {/* Abas */}
      <div className="flex gap-0 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── ABA: TIMER ── */}
      {activeTab === 'timer' && (
        <>
          <Card className="shadow-card">
            <CardContent className="py-10 flex flex-col items-center gap-6">
              <div
                className={`text-7xl font-display font-bold tabular-nums ${
                  isBreak ? 'text-success' : 'text-primary'
                }`}
              >
                {pad(minutes)}:{pad(seconds)}
              </div>

              <p className="text-muted-foreground font-medium">
                {isBreak ? (
                  <span className="flex items-center gap-2">
                    <Coffee className="h-4 w-4" /> Pausa de {pomodoroSettings.breakMinutes} min
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Sessão de Foco · {pomodoroSettings.focusMinutes} min
                  </span>
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
                  onClick={handleToggleRunning}
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
              <p className="text-xs text-muted-foreground mt-1">
                {todayCount * pomodoroSettings.focusMinutes} minutos de foco
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── ABA: CONFIGURAR ── */}
      {activeTab === 'config' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configurações do Timer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Duração do foco (minutos)</label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={90}
                  value={focusInput}
                  onChange={(e) => setFocusInput(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">Padrão: 25 min · máx. 90</span>
              </div>
              {/* Atalhos rápidos */}
              <div className="flex gap-2 mt-1">
                {[15, 25, 30, 45, 60].map((v) => (
                  <button
                    key={v}
                    onClick={() => setFocusInput(String(v))}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      focusInput === String(v)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:border-primary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {v} min
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Duração da pausa (minutos)</label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={breakInput}
                  onChange={(e) => setBreakInput(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">Padrão: 5 min · máx. 30</span>
              </div>
              <div className="flex gap-2 mt-1">
                {[5, 10, 15, 20].map((v) => (
                  <button
                    key={v}
                    onClick={() => setBreakInput(String(v))}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      breakInput === String(v)
                        ? 'bg-success text-white border-success'
                        : 'border-border hover:border-success text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {v} min
                  </button>
                ))}
              </div>
            </div>

            {isRunning && (
              <p className="text-xs text-warning flex items-center gap-1.5">
                ⚠️ Timer em andamento — as alterações serão aplicadas no próximo ciclo.
              </p>
            )}

            <Button onClick={saveSettings} className="w-full">
              {savedMsg ? '✓ Configurações salvas!' : 'Salvar configurações'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── ABA: HISTÓRICO ── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Resumo total */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-xs text-muted-foreground">Total de sessões</p>
                <p className="text-3xl font-display font-bold text-primary mt-1">
                  {pomodoroHistory.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-xs text-muted-foreground">Tempo total focado</p>
                <p className="text-3xl font-display font-bold text-primary mt-1">
                  {totalHours > 0 ? `${totalHours}h ` : ''}
                  {totalMins}min
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lista agrupada por data */}
          {pomodoroHistory.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Nenhuma sessão registrada ainda.</p>
              <p className="text-sm mt-1">
                Complete um Pomodoro para ver o histórico aqui.
              </p>
            </div>
          ) : (
            Object.entries(historyByDate)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, entries]) => {
                const dayTotal = entries.reduce((s, e) => s + e.focusMinutes, 0)
                const dayHours = Math.floor(dayTotal / 60)
                const dayMins = dayTotal % 60
                return (
                  <div key={date} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold capitalize">
                        {formatDateLabel(date)}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {dayHours > 0 ? `${dayHours}h ` : ''}{dayMins}min · {entries.length} sessão{entries.length !== 1 ? 'ões' : ''}
                      </span>
                    </div>

                    {entries.map((entry) => (
                      <Card key={entry.id} className="border-primary/10 hover:border-primary/30 transition-colors">
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Timer className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{entry.task}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatTime(entry.startedAt)} → {formatTime(entry.endedAt)}
                              </p>
                            </div>
                            <span className="shrink-0 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                              {entry.focusMinutes} min
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              })
          )}
        </div>
      )}
    </div>
  )
}
