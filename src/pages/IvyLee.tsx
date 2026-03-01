import { useState } from 'react'
import { useAppStore, type IvyLeeTask } from '@/stores/useAppStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Circle, GripVertical } from 'lucide-react'

export default function IvyLee() {
  const { ivyLeeDays, setIvyLeeDay, toggleIvyLeeTask } = useAppStore()
  const today = new Date().toISOString().slice(0, 10)
  const todayData = ivyLeeDays.find((d) => d.date === today)
  const [newTask, setNewTask] = useState('')

  const addTask = () => {
    if (!newTask.trim()) return
    const currentTasks = todayData?.tasks ?? []
    if (currentTasks.length >= 6) return
    const task: IvyLeeTask = {
      id: crypto.randomUUID(),
      title: newTask,
      priority: currentTasks.length + 1,
      completed: false,
    }
    setIvyLeeDay({ date: today, tasks: [...currentTasks, task] })
    setNewTask('')
  }

  const tasks = todayData?.tasks ?? []
  const completed = tasks.filter((t) => t.completed).length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Método Ivy Lee</h1>
        <p className="text-muted-foreground mt-1">6 tarefas mais importantes do dia, em ordem</p>
      </div>

      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium">Hoje &mdash; {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <span className="text-xs text-muted-foreground">{completed}/{tasks.length} concluídas</span>
          </div>

          {tasks.length > 0 && (
            <div className="w-full bg-secondary rounded-full h-2 mb-6">
              <div
                className="bg-success h-2 rounded-full transition-all"
                style={{ width: tasks.length > 0 ? `${(completed / tasks.length) * 100}%` : '0%' }}
              />
            </div>
          )}

          <div className="space-y-2">
            {tasks.map((task, i) => (
              <div key={task.id} className="flex items-center gap-3 bg-secondary/50 rounded-lg px-4 py-3">
                <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                <button onClick={() => toggleIvyLeeTask(today, task.id)}>
                  {task.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                <span className={`flex-1 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </span>
              </div>
            ))}
          </div>

          {tasks.length < 6 && (
            <div className="flex gap-2 mt-4">
              <Input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder={`Tarefa #${tasks.length + 1} (máx. 6)`}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
              />
              <Button onClick={addTask}>Adicionar</Button>
            </div>
          )}

          {tasks.length >= 6 && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              Limite de 6 tarefas atingido. Foque nessas!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
