import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import type { AppState } from '@/stores/useAppStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, Send, User } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'bot'
  text: string
}

function processQuery(query: string, store: AppState): string {
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const today = new Date().toISOString().slice(0, 10)

  if (q.includes('meta') || q.includes('smart') || q.includes('objetivo')) {
    const { smartGoals } = store
    if (smartGoals.length === 0) return 'Voce nao tem metas SMART cadastradas. Que tal criar uma na pagina de Metas SMART?'
    const active = smartGoals.filter((g) => !g.completed)
    const completed = smartGoals.filter((g) => g.completed)
    let resp = `Voce tem ${smartGoals.length} meta(s) SMART:\n\n`
    if (active.length > 0) {
      resp += `**Ativas (${active.length}):**\n`
      active.forEach((g, i) => { resp += `${i + 1}. ${g.title}${g.timeBound ? ` (prazo: ${g.timeBound})` : ''}\n` })
    }
    if (completed.length > 0) {
      resp += `\n**Concluidas (${completed.length}):**\n`
      completed.forEach((g, i) => { resp += `${i + 1}. ~~${g.title}~~\n` })
    }
    return resp
  }

  if (q.includes('pomodoro') || q.includes('foco') || q.includes('timer')) {
    const { pomodoroSessions } = store
    const todaySessions = pomodoroSessions.filter((s) => s.date === today && s.completed)
    const totalSessions = pomodoroSessions.filter((s) => s.completed)
    let resp = `**Pomodoro de hoje:** ${todaySessions.length} sessoes (${todaySessions.length * 25} min de foco)\n`
    resp += `**Total geral:** ${totalSessions.length} sessoes (${totalSessions.length * 25} min)\n`
    if (todaySessions.length === 0) resp += '\nNenhum pomodoro feito hoje. Que tal comecar um agora?'
    else if (todaySessions.length >= 4) resp += '\nExcelente! Voce ja fez bastante foco hoje!'
    return resp
  }

  if (q.includes('eisenhower') || q.includes('urgente') || q.includes('importante') || q.includes('prioridade')) {
    const { eisenhowerTasks } = store
    if (eisenhowerTasks.length === 0) return 'Sua Matriz de Eisenhower esta vazia. Adicione tarefas para organizar suas prioridades!'
    const groups = {
      do: eisenhowerTasks.filter((t) => t.quadrant === 'do' && !t.completed),
      schedule: eisenhowerTasks.filter((t) => t.quadrant === 'schedule' && !t.completed),
      delegate: eisenhowerTasks.filter((t) => t.quadrant === 'delegate' && !t.completed),
      delete: eisenhowerTasks.filter((t) => t.quadrant === 'delete' && !t.completed),
    }
    let resp = '**Suas tarefas pendentes na Matriz de Eisenhower:**\n\n'
    if (groups.do.length > 0) {
      resp += `🔴 **Fazer (${groups.do.length}):** ${groups.do.map((t) => t.title).join(', ')}\n`
    }
    if (groups.schedule.length > 0) {
      resp += `🔵 **Agendar (${groups.schedule.length}):** ${groups.schedule.map((t) => t.title).join(', ')}\n`
    }
    if (groups.delegate.length > 0) {
      resp += `🟡 **Delegar (${groups.delegate.length}):** ${groups.delegate.map((t) => t.title).join(', ')}\n`
    }
    if (groups.delete.length > 0) {
      resp += `⚪ **Eliminar (${groups.delete.length}):** ${groups.delete.map((t) => t.title).join(', ')}\n`
    }
    return resp
  }

  if (q.includes('ivy') || q.includes('lee') || q.includes('hoje') || q.includes('dia')) {
    const { ivyLeeDays } = store
    const todayData = ivyLeeDays.find((d) => d.date === today)
    if (!todayData || todayData.tasks.length === 0) return 'Voce nao tem tarefas Ivy Lee para hoje. Defina ate 6 tarefas prioritarias!'
    const completed = todayData.tasks.filter((t) => t.completed).length
    const pct = Math.round((completed / todayData.tasks.length) * 100)
    let resp = `**Ivy Lee de hoje (${pct}% concluido):**\n\n`
    todayData.tasks.forEach((t, i) => {
      resp += `${i + 1}. ${t.completed ? '~~' + t.title + '~~' : t.title}\n`
    })
    if (pct === 100) resp += '\nParabens! Todas as tarefas do dia concluidas!'
    else if (pct >= 50) resp += '\nBom progresso! Continue assim!'
    return resp
  }

  if (q.includes('resumo') || q.includes('geral') || q.includes('tudo') || q.includes('status')) {
    const { smartGoals, pomodoroSessions, eisenhowerTasks, ivyLeeDays } = store
    const todaySessions = pomodoroSessions.filter((s) => s.date === today && s.completed).length
    const activeTasks = eisenhowerTasks.filter((t) => !t.completed).length
    const todayIvyLee = ivyLeeDays.find((d) => d.date === today)
    const ivyDone = todayIvyLee?.tasks.filter((t) => t.completed).length ?? 0
    const ivyTotal = todayIvyLee?.tasks.length ?? 0

    let resp = '**Resumo geral:**\n\n'
    resp += `- **Metas SMART:** ${smartGoals.length} (${smartGoals.filter((g) => g.completed).length} concluidas)\n`
    resp += `- **Pomodoros hoje:** ${todaySessions} sessoes (${todaySessions * 25} min)\n`
    resp += `- **Eisenhower:** ${activeTasks} tarefas pendentes\n`
    resp += `- **Ivy Lee hoje:** ${ivyDone}/${ivyTotal} concluidas\n`
    return resp
  }

  if (q.includes('ajuda') || q.includes('help') || q.includes('comando') || q.includes('o que')) {
    return 'Posso te ajudar com informacoes sobre:\n\n- **"metas"** - Status das suas Metas SMART\n- **"pomodoro"** - Sessoes de foco do dia\n- **"eisenhower"** - Tarefas na Matriz de Eisenhower\n- **"ivy lee"** ou **"hoje"** - Tarefas do dia\n- **"resumo"** - Visao geral de tudo\n\nExperimente perguntar algo como: "Quais sao minhas metas?" ou "Como estou hoje?"'
  }

  return 'Nao entendi sua pergunta. Tente perguntar sobre:\n- Metas SMART\n- Pomodoro\n- Matriz de Eisenhower\n- Ivy Lee / tarefas do dia\n- Resumo geral\n\nOu digite **"ajuda"** para ver os comandos disponiveis.'
}

export default function Chat() {
  const store = useAppStore()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      text: 'Ola! Sou seu assistente de produtividade. Posso te ajudar com informacoes sobre suas metas, tarefas e sessoes de foco. Pergunte-me qualquer coisa ou digite **"ajuda"** para ver os comandos.',
    },
  ])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    if (!input.trim()) return
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text: input }
    const response = processQuery(input, store)
    const botMsg: Message = { id: crypto.randomUUID(), role: 'bot', text: response }
    setMessages((prev) => [...prev, userMsg, botMsg])
    setInput('')
  }

  const renderText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/\n/g, '<br />')
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="mb-4">
        <h1 className="text-3xl font-display font-bold">Assistente</h1>
        <p className="text-muted-foreground mt-1">Pergunte sobre suas tarefas e metas</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'bot' && (
                  <div className="gradient-brand p-2 rounded-lg h-8 w-8 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-secondary text-foreground rounded-bl-md'
                  }`}
                  dangerouslySetInnerHTML={{ __html: renderText(msg.text) }}
                />
                {msg.role === 'user' && (
                  <div className="bg-secondary p-2 rounded-lg h-8 w-8 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-foreground" />
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
        <CardContent className="border-t border-border p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre suas tarefas..."
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
            <Button onClick={send} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
