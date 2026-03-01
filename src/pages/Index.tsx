import { useAppStore } from '@/stores/useAppStore';
import { Target, Timer, Grid3X3, ListOrdered } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const Index = () => {
  const { smartGoals, pomodoroSessions, eisenhowerTasks, ivyLeeDays } = useAppStore();

  const today = new Date().toISOString().slice(0, 10);
  const todayIvyLee = ivyLeeDays.find((d) => d.date === today);
  const todayPomodoros = pomodoroSessions.filter((s) => s.date === today && s.completed).length;
  const completedGoals = smartGoals.filter((g) => g.completed).length;
  const activeEisenhower = eisenhowerTasks.filter((t) => !t.completed).length;
  const ivyLeeCompleted = todayIvyLee?.tasks.filter((t) => t.completed).length ?? 0;
  const ivyLeeTotal = todayIvyLee?.tasks.length ?? 0;

  const stats = [
    {
      label: 'Metas Ativas',
      value: smartGoals.length,
      sub: `${completedGoals} concluídas`,
      icon: Target,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Pomodoros Hoje',
      value: todayPomodoros,
      sub: `${todayPomodoros * 25} min de foco`,
      icon: Timer,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
    {
      label: 'Tarefas Pendentes',
      value: activeEisenhower,
      sub: 'Matriz Eisenhower',
      icon: Grid3X3,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      label: 'Ivy Lee Hoje',
      value: `${ivyLeeCompleted}/${ivyLeeTotal}`,
      sub: ivyLeeTotal > 0 ? `${Math.round((ivyLeeCompleted / ivyLeeTotal) * 100)}% concluído` : 'Sem tarefas',
      icon: ListOrdered,
      color: 'text-success',
      bg: 'bg-success/10',
    },
  ];

  const tools = [
    {
      title: 'Metas SMART',
      description: 'Defina metas específicas, mensuráveis, atingíveis, relevantes e com prazo.',
      icon: Target,
      url: '/smart-goals',
      gradient: 'gradient-brand',
    },
    {
      title: 'Pomodoro Timer',
      description: 'Ciclos de foco de 25min com pausas para maximizar produtividade.',
      icon: Timer,
      url: '/pomodoro',
      gradient: 'bg-destructive',
    },
    {
      title: 'Matriz de Eisenhower',
      description: 'Priorize tarefas por urgência e importância em 4 quadrantes.',
      icon: Grid3X3,
      url: '/eisenhower',
      gradient: 'bg-warning',
    },
    {
      title: 'Método Ivy Lee',
      description: 'Escolha as 6 tarefas mais importantes para amanhã, em ordem de prioridade.',
      icon: ListOrdered,
      url: '/ivy-lee',
      gradient: 'bg-success',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral da sua produtividade</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-card border-border/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-display font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                </div>
                <div className={`${stat.bg} p-2 rounded-lg`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-display font-semibold mb-4">Ferramentas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <Link key={tool.title} to={tool.url}>
              <Card className="shadow-card border-border/50 hover:shadow-lg transition-all duration-200 cursor-pointer group">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-4">
                    <div className={`${tool.gradient} p-3 rounded-xl`}>
                      <tool.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold group-hover:text-primary transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-display font-semibold mb-4">Em Breve</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {['GTD', 'Eat the Frog', 'Time Blocking', 'Reflexão Diária', 'Duas Listas', 'Mapa Mental'].map(
            (name) => (
              <Card key={name} className="border-dashed border-border/60 opacity-60">
                <CardContent className="py-4 text-center">
                  <p className="text-xs font-medium text-muted-foreground">{name}</p>
                </CardContent>
              </Card>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
