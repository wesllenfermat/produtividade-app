import { useState } from 'react'
import { useAppStore, type SmartGoal } from '@/stores/useAppStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Target, Plus, CheckCircle2, Circle, Trash2 } from 'lucide-react'

export default function SmartGoals() {
  const { smartGoals, addSmartGoal, toggleSmartGoal, removeSmartGoal } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    timeBound: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    const goal: SmartGoal = {
      id: crypto.randomUUID(),
      ...form,
      completed: false,
      createdAt: new Date().toISOString(),
    }
    addSmartGoal(goal)
    setForm({ title: '', specific: '', measurable: '', achievable: '', relevant: '', timeBound: '' })
    setShowForm(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Metas SMART</h1>
          <p className="text-muted-foreground mt-1">Defina metas claras e alcançáveis</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" /> Nova Meta
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nova Meta SMART</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título da Meta</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Aprender React" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Específica (S)</label>
                  <Input value={form.specific} onChange={(e) => setForm({ ...form, specific: e.target.value })} placeholder="O que exatamente?" />
                </div>
                <div>
                  <label className="text-sm font-medium">Mensurável (M)</label>
                  <Input value={form.measurable} onChange={(e) => setForm({ ...form, measurable: e.target.value })} placeholder="Como medir o progresso?" />
                </div>
                <div>
                  <label className="text-sm font-medium">Atingível (A)</label>
                  <Input value={form.achievable} onChange={(e) => setForm({ ...form, achievable: e.target.value })} placeholder="É realista?" />
                </div>
                <div>
                  <label className="text-sm font-medium">Relevante (R)</label>
                  <Input value={form.relevant} onChange={(e) => setForm({ ...form, relevant: e.target.value })} placeholder="Por que importa?" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Prazo (T)</label>
                <Input type="date" value={form.timeBound} onChange={(e) => setForm({ ...form, timeBound: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Salvar Meta</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {smartGoals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Nenhuma meta criada ainda</p>
              <p className="text-sm text-muted-foreground">Clique em "Nova Meta" para começar</p>
            </CardContent>
          </Card>
        ) : (
          smartGoals.map((goal) => (
            <Card key={goal.id} className={goal.completed ? 'opacity-60' : ''}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleSmartGoal(goal.id)} className="mt-1">
                    {goal.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${goal.completed ? 'line-through' : ''}`}>{goal.title}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs text-muted-foreground">
                      {goal.specific && <span><strong>S:</strong> {goal.specific}</span>}
                      {goal.measurable && <span><strong>M:</strong> {goal.measurable}</span>}
                      {goal.achievable && <span><strong>A:</strong> {goal.achievable}</span>}
                      {goal.relevant && <span><strong>R:</strong> {goal.relevant}</span>}
                    </div>
                    {goal.timeBound && (
                      <p className="text-xs text-muted-foreground mt-1">Prazo: {goal.timeBound}</p>
                    )}
                  </div>
                  <button onClick={() => removeSmartGoal(goal.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
