import { useState } from 'react'
import { useAppStore, type EisenhowerTask } from '@/stores/useAppStore'
import { useNotifications } from '@/hooks/useNotifications'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Circle, Trash2, Plus, Bell } from 'lucide-react'

const quadrants = [
  { key: 'do' as const, title: 'Fazer', subtitle: 'Urgente + Importante', color: 'border-destructive/30 bg-destructive/5' },
  { key: 'schedule' as const, title: 'Agendar', subtitle: 'Não Urgente + Importante', color: 'border-primary/30 bg-primary/5' },
  { key: 'delegate' as const, title: 'Delegar', subtitle: 'Urgente + Não Importante', color: 'border-warning/30 bg-warning/5' },
  { key: 'delete' as const, title: 'Eliminar', subtitle: 'Não Urgente + Não Importante', color: 'border-muted-foreground/30 bg-muted/50' },
]

export default function Eisenhower() {
  const { eisenhowerTasks, addEisenhowerTask, toggleEisenhowerTask, removeEisenhowerTask } = useAppStore()
  const { permission, requestPermission, notify } = useNotifications()
  const [newTask, setNewTask] = useState('')
  const [activeQuadrant, setActiveQuadrant] = useState<EisenhowerTask['quadrant'] | null>(null)

  const handleAdd = (quadrant: EisenhowerTask['quadrant']) => {
    if (!newTask.trim()) return
    addEisenhowerTask({
      id: crypto.randomUUID(),
      title: newTask,
      quadrant,
      completed: false,
      createdAt: new Date().toISOString(),
    })
    setNewTask('')
    setActiveQuadrant(null)
  }

  const remindUrgent = async () => {
    if (permission !== 'granted') {
      const granted = await requestPermission()
      if (!granted) return
    }
    const urgent = eisenhowerTasks.filter((t) => t.quadrant === 'do' && !t.completed)
    if (urgent.length === 0) {
      notify('✅ Nenhuma tarefa urgente!', { body: 'Você está em dia com suas tarefas prioritárias.' })
    } else {
      notify(`🔴 ${urgent.length} tarefa(s) urgente(s)!`, {
        body: urgent.slice(0, 3).map((t) => `• ${t.title}`).join('\n') +
          (urgent.length > 3 ? `\n+${urgent.length - 3} mais...` : ''),
      })
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Matriz de Eisenhower</h1>
          <p className="text-muted-foreground mt-1">Priorize por urgência e importância</p>
        </div>
        <Button variant="outline" size="sm" onClick={remindUrgent}>
          <Bell className="h-4 w-4" /> Lembrar urgentes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quadrants.map((q) => {
          const tasks = eisenhowerTasks.filter((t) => t.quadrant === q.key)
          return (
            <Card key={q.key} className={`${q.color} min-h-[200px]`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{q.title}</CardTitle>
                <p className="text-xs text-muted-foreground">{q.subtitle}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 bg-card/80 rounded-lg px-3 py-2">
                    <button onClick={() => toggleEisenhowerTask(task.id)}>
                      {task.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </span>
                    <button onClick={() => removeEisenhowerTask(task.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {activeQuadrant === q.key ? (
                  <div className="flex gap-2">
                    <Input
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      placeholder="Nova tarefa..."
                      className="text-sm h-9"
                      onKeyDown={(e) => e.key === 'Enter' && handleAdd(q.key)}
                      autoFocus
                    />
                    <Button size="sm" onClick={() => handleAdd(q.key)}>Add</Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveQuadrant(q.key)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar
                  </button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
