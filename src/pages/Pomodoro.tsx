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
  Target,
  Zap,
} from 'lucide-react'

type Tab = 'timer' | 'config' | 'history'
type Mode = 'focus' | 'break' | 'longBreak'

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
  const [mode, setMode] = useState<Mode>('focus')
  const [minutes, setMinutes] = useState(pomodoroSettings.focusMinutes)
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [task, setTask] = useState('')
  // Conta pomodoros desde a última pausa longa
  const [pomodoroCount, setPomodoroCount] = useState(0)

  // Configurações locais (formulário)
  const [cfg, setCfg] = useState({ ...pomodoroSettings })
  const [savedMsg, setSavedMsg] = useState(false)

  // Refs para evitar stale closures dentro do setInterval
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const modeRef = useRef<Mode>(mode)
  const taskRef = useRef(task)
  const startedAtRef = useRef<string | null>(null)
  const settingsRef = useRef(pomodoroSettings)
  const pomodoroCountRef = useRef(pomodoroCount)

  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { taskRef.current = task }, [task])
  useEffect(() => { settingsRef.current = pomodoroSettings }, [pomodoroSettings])
  useEffect(() => { pomodoroCountRef.current = pomodoroCount }, [pomodoroCount])

  // Sincroniza o timer quando as configurações mudam e o timer está parado
  useEffect(() => {
    if (!isRunning) {
      const s = pomodoroSettings
      if (mode === 'focus') setMinutes(s.focusMinutes)
      else if (mode === 'break') setMinutes(s.breakMinutes)
      else setMinutes(s.longBreakMinutes)
      setSeconds(0)
    }
  }, [pomodoroSettings, isRunning, mode])

  // Progresso do anel (0 a 1)
  const totalSecs = (() => {
    if (mode === 'focus') return pomodoroSettings.focusMinutes * 60
    if (mode === 'break') return pomodoroSettings.breakMinutes * 60
    return pomodoroSettings.longBreakMinutes * 60
  })()
  const remainingSecs = minutes * 60 + seconds
  const progress = totalSecs > 0 ? 1 - remainingSecs / totalSecs : 0
  const r = 88
  const circumference = 2 * Math.PI * r
  const strokeDashoffset = circumference * (1 - progress)

  // Contagem diária
  const today = new Date().toISOString().slice(0, 10)
  const todayCount = pomodoroSessions.filter((s) => s.date === today && s.completed).length
  const goalPercent = Math.min(100, (todayCount / pomodoroSettings.dailyGoal) * 100)

  const switchMode = (nextMode: Mode, autoStart = false) => {
    const s = settingsRef.current
    setMode(nextMode)
    setIsRunning(false)
    setSeconds(0)
    startedAtRef.current = null
    if (nextMode === 'focus') setMinutes(s.focusMinutes)
    else if (nextMode === 'break') setMinutes(s.breakMinutes)
    else setMinutes(s.longBreakMinutes)

    if (autoStart) {
      // Pequeno delay para deixar o state atualizar antes de iniciar
      setTimeout(() => setIsRunning(true), 300)
      if (nextMode === 'focus') startedAtRef.current = new Date().toISOString()
    }
  }

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

          const s = settingsRef.current
          const endedAt = new Date().toISOString()
          const currentMode = modeRef.current

          if (currentMode === 'focus') {
            // Salva sessão e histórico
            addPomodoroSession({
              id: crypto.randomUUID(),
              date: new Date().toISOString().slice(0, 10),
              duration: s.focusMinutes,
              completed: true,
              task: taskRef.current || undefined,
            })
            if (startedAtRef.current) {
              addPomodoroHistory({
                id: crypto.randomUUID(),
                task: taskRef.current || 'Sessão sem título',
                startedAt: startedAtRef.current,
                endedAt,
                focusMinutes: s.focusMinutes,
              })
              startedAtRef.current = null
            }

            // Verifica se é hora da pausa longa
            const newCount = pomodoroCountRef.current + 1
            setPomodoroCount(newCount)
            const isLongBreak = newCount >= s.longBreakAfter

            if (isLongBreak) {
              setPomodoroCount(0)
              notify('🍅 Ciclo completo! Pausa longa merecida!', {
                body: `Você completou ${s.longBreakAfter} pomodoros! Descanse ${s.longBreakMinutes} minutos.`,
              })
              switchMode('longBreak', s.autoStart)
            } else {
              notify('🍅 Pomodoro concluído!', {
                body: taskRef.current
                  ? `Ótimo foco em "${taskRef.current}"! Hora de uma pausa de ${s.breakMinutes} min.`
                  : `Ótimo foco! Hora de uma pausa de ${s.breakMinutes} min. (${newCount}/${s.longBreakAfter})`,
              })
              switchMode('break', s.autoStart)
            }
          } else {
            // Pausa (curta ou longa) encerrada
            notify('⏰ Pausa encerrada!', {
              body: 'Hora de voltar ao foco! Inicie um novo Pomodoro.',
            })
            switchMode('focus', s.autoStart)
            if (s.autoStart) startedAtRef.current = new Date().toISOString()
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
    if (!isRunning && mode === 'focus' && startedAtRef.current === null) {
      startedAtRef.current = new Date().toISOString()
    }
    setIsRunning((r) => !r)
  }

  const reset = () => {
    setIsRunning(false)
    setMode('focus')
    setMinutes(pomodoroSettings.focusMinutes)
    setSeconds(0)
    setPomodoroCount(0)
    startedAtRef.current = null
  }

  const saveSettings = () => {
    const s: typeof pomodoroSettings = {
      focusMinutes: Math.max(1, Math.min(90, parseInt(String(cfg.focusMinutes)) || 25)),
      breakMinutes: Math.max(1, Math.min(30, parseInt(String(cfg.breakMinutes)) || 5)),
      longBreakMinutes: Math.max(5, Math.min(60, parseInt(String(cfg.longBreakMinutes)) || 15)),
      longBreakAfter: Math.max(2, Math.min(10, parseInt(String(cfg.longBreakAfter)) || 4)),
      autoStart: cfg.autoStart,
      dailyGoal: Math.max(1, Math.min(20, parseInt(String(cfg.dailyGoal)) || 8)),
    }
    updatePomodoroSettings(s)
    setCfg(s)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2500)
  }

  const pad = (n: number) => n.toString().padStart(2, '0')

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const formatDateLabel = (isoDate: string) => {
    const [y, m, d] = isoDate.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    const todayD = new Date()
    const yesterday = new Date(todayD)
    yesterday.setDate(todayD.getDate() - 1)
    if (date.toDateString() === todayD.toDateString()) return 'Hoje'
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem'
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  }

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

  const modeColor = mode === 'focus' ? 'text-primary' : 'text-success'
  const modeLabel =
    mode === 'focus'
      ? `Sessão de Foco · ${pomodoroSettings.focusMinutes} min`
      : mode === 'break'
        ? `Pausa curta · ${pomodoroSettings.breakMinutes} min`
        : `☕ Pausa longa · ${pomodoroSettings.longBreakMinutes} min`

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'timer', label: 'Timer', icon: <Timer className="h-4 w-4" /> },
    { id: 'config', label: 'Configurar', icon: <Settings className="h-4 w-4" /> },
    { id: 'history', label: 'Histórico', icon: <History className="h-4 w-4" /> },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold">Pomodoro Timer</h1>
          <p className="text-muted-foreground mt-1">
            {pomodoroSettings.focusMinutes} min foco · {pomodoroSettings.breakMinutes} min pausa · pausa longa a cada {pomodoroSettings.longBreakAfter}
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
              {/* Anel de progresso + timer */}
              <div className="relative flex items-center justify-center w-56 h-56">
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 200 200"
                  style={{ transform: 'rotate(-90deg)' }}
                >
                  {/* Trilha de fundo */}
                  <circle
                    cx="100" cy="100" r={r}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    style={{ color: 'var(--color-muted-foreground)', opacity: 0.12 }}
                  />
                  {/* Progresso */}
                  <circle
                    cx="100" cy="100" r={r}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{
                      color: mode === 'focus' ? 'var(--color-primary)' : 'var(--color-success)',
                      transition: 'stroke-dashoffset 0.8s ease, color 0.3s ease',
                    }}
                  />
                </svg>

                {/* Conteúdo central */}
                <div className="flex flex-col items-center gap-1 z-10">
                  <div className={`text-5xl font-display font-bold tabular-nums ${modeColor}`}>
                    {pad(minutes)}:{pad(seconds)}
                  </div>
                  {/* Indicadores de ciclo */}
                  <div className="flex gap-1.5 mt-1">
                    {Array.from({ length: pomodoroSettings.longBreakAfter }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i < pomodoroCount ? 'bg-primary' : 'bg-muted-foreground/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Modo atual */}
              <p className={`text-sm font-medium flex items-center gap-2 ${modeColor}`}>
                {mode === 'focus' ? <Zap className="h-4 w-4" /> : <Coffee className="h-4 w-4" />}
                {modeLabel}
              </p>

              {/* Campo de tarefa */}
              <Input
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="No que você está trabalhando?"
                className="max-w-sm text-center"
                disabled={isRunning}
              />

              {/* Controles */}
              <div className="flex gap-3">
                <Button
                  size="lg"
                  onClick={handleToggleRunning}
                  className={mode !== 'focus' ? 'bg-success hover:bg-success/90' : ''}
                >
                  {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  {isRunning ? 'Pausar' : 'Iniciar'}
                </Button>
                <Button size="lg" variant="outline" onClick={reset}>
                  <RotateCcw className="h-5 w-5" /> Resetar
                </Button>
              </div>

              {/* Atalhos de modo manual */}
              {!isRunning && (
                <div className="flex gap-2">
                  {(['focus', 'break', 'longBreak'] as Mode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => switchMode(m)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        mode === m
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {m === 'focus' ? 'Foco' : m === 'break' ? 'Pausa' : 'Pausa longa'}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meta diária */}
          <Card>
            <CardContent className="py-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Meta do dia</span>
                </div>
                <span className="text-sm font-semibold text-primary">
                  {todayCount} / {pomodoroSettings.dailyGoal} pomodoros
                </span>
              </div>
              {/* Barra de progresso */}
              <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${goalPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {todayCount * pomodoroSettings.focusMinutes} min focados hoje
                {todayCount >= pomodoroSettings.dailyGoal && ' 🎉 Meta atingida!'}
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
            {/* Foco */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Duração do foco (minutos)</label>
              <div className="flex items-center gap-3">
                <Input
                  type="number" min={1} max={90}
                  value={cfg.focusMinutes}
                  onChange={(e) => setCfg((c) => ({ ...c, focusMinutes: Number(e.target.value) }))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">1 – 90 min</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[15, 25, 30, 45, 50, 60].map((v) => (
                  <button key={v}
                    onClick={() => setCfg((c) => ({ ...c, focusMinutes: v }))}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      cfg.focusMinutes === v
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >{v} min</button>
                ))}
              </div>
            </div>

            {/* Pausa curta */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Pausa curta (minutos)</label>
              <div className="flex items-center gap-3">
                <Input
                  type="number" min={1} max={30}
                  value={cfg.breakMinutes}
                  onChange={(e) => setCfg((c) => ({ ...c, breakMinutes: Number(e.target.value) }))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">1 – 30 min</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[5, 10, 15, 20].map((v) => (
                  <button key={v}
                    onClick={() => setCfg((c) => ({ ...c, breakMinutes: v }))}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      cfg.breakMinutes === v
                        ? 'bg-success text-white border-success'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >{v} min</button>
                ))}
              </div>
            </div>

            {/* Pausa longa */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Pausa longa (minutos)</label>
              <div className="flex items-center gap-3">
                <Input
                  type="number" min={5} max={60}
                  value={cfg.longBreakMinutes}
                  onChange={(e) => setCfg((c) => ({ ...c, longBreakMinutes: Number(e.target.value) }))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">5 – 60 min</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[10, 15, 20, 30].map((v) => (
                  <button key={v}
                    onClick={() => setCfg((c) => ({ ...c, longBreakMinutes: v }))}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      cfg.longBreakMinutes === v
                        ? 'bg-success text-white border-success'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >{v} min</button>
                ))}
              </div>
            </div>

            {/* Pausa longa após N pomodoros */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Pausa longa após</label>
              <div className="flex items-center gap-3">
                <Input
                  type="number" min={2} max={10}
                  value={cfg.longBreakAfter}
                  onChange={(e) => setCfg((c) => ({ ...c, longBreakAfter: Number(e.target.value) }))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">pomodoros (2–10)</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[2, 3, 4, 6].map((v) => (
                  <button key={v}
                    onClick={() => setCfg((c) => ({ ...c, longBreakAfter: v }))}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      cfg.longBreakAfter === v
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >{v}x</button>
                ))}
              </div>
            </div>

            {/* Meta diária */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Meta diária de pomodoros</label>
              <div className="flex items-center gap-3">
                <Input
                  type="number" min={1} max={20}
                  value={cfg.dailyGoal}
                  onChange={(e) => setCfg((c) => ({ ...c, dailyGoal: Number(e.target.value) }))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">sessões/dia (1–20)</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[4, 6, 8, 10, 12].map((v) => (
                  <button key={v}
                    onClick={() => setCfg((c) => ({ ...c, dailyGoal: v }))}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      cfg.dailyGoal === v
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >{v}</button>
                ))}
              </div>
            </div>

            {/* Auto-início */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Iniciar próximo ciclo automaticamente</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Foco → Pausa → Foco sem precisar clicar
                </p>
              </div>
              <button
                onClick={() => setCfg((c) => ({ ...c, autoStart: !c.autoStart }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  cfg.autoStart ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    cfg.autoStart ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
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
                  {totalHours > 0 ? `${totalHours}h ` : ''}{totalMins}min
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lista */}
          {pomodoroHistory.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Nenhuma sessão registrada ainda.</p>
              <p className="text-sm mt-1">Complete um Pomodoro para ver o histórico aqui.</p>
            </div>
          ) : (
            Object.entries(historyByDate)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, entries]) => {
                const dayTotal = entries.reduce((s, e) => s + e.focusMinutes, 0)
                const dh = Math.floor(dayTotal / 60)
                const dm = dayTotal % 60
                return (
                  <div key={date} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold capitalize">{formatDateLabel(date)}</h3>
                      <span className="text-xs text-muted-foreground">
                        {dh > 0 ? `${dh}h ` : ''}{dm}min · {entries.length} sessão{entries.length !== 1 ? 'ões' : ''}
                      </span>
                    </div>
                    {entries.map((entry) => (
                      <Card key={entry.id} className="border-primary/10 hover:border-primary/30 transition-colors">
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
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
