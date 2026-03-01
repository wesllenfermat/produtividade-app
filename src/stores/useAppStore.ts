import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UseBoundStore, StoreApi } from 'zustand'

export interface SmartGoal {
  id: string
  title: string
  specific: string
  measurable: string
  achievable: string
  relevant: string
  timeBound: string
  completed: boolean
  createdAt: string
}

export interface PomodoroSession {
  id: string
  date: string
  duration: number
  completed: boolean
  task?: string
}

/** Entrada de histórico: uma sessão de foco completa */
export interface PomodoroWorkEntry {
  id: string
  task: string
  startedAt: string  // ISO string
  endedAt: string    // ISO string
  focusMinutes: number
}

export interface PomodoroSettings {
  focusMinutes: number
  breakMinutes: number
}

export interface EisenhowerTask {
  id: string
  title: string
  quadrant: 'do' | 'schedule' | 'delegate' | 'delete'
  completed: boolean
  createdAt: string
}

export interface IvyLeeTask {
  id: string
  title: string
  priority: number
  completed: boolean
}

export interface IvyLeeDay {
  date: string
  tasks: IvyLeeTask[]
}

export interface AppState {
  smartGoals: SmartGoal[]
  pomodoroSessions: PomodoroSession[]
  pomodoroHistory: PomodoroWorkEntry[]
  pomodoroSettings: PomodoroSettings
  eisenhowerTasks: EisenhowerTask[]
  ivyLeeDays: IvyLeeDay[]

  addSmartGoal: (goal: SmartGoal) => void
  toggleSmartGoal: (id: string) => void
  removeSmartGoal: (id: string) => void

  addPomodoroSession: (session: PomodoroSession) => void
  addPomodoroHistory: (entry: PomodoroWorkEntry) => void
  updatePomodoroSettings: (settings: PomodoroSettings) => void

  addEisenhowerTask: (task: EisenhowerTask) => void
  toggleEisenhowerTask: (id: string) => void
  removeEisenhowerTask: (id: string) => void

  setIvyLeeDay: (day: IvyLeeDay) => void
  toggleIvyLeeTask: (date: string, taskId: string) => void
}

let storeInstance: UseBoundStore<StoreApi<AppState>> | null = null
let currentUserId: string | null = null

export function initializeStore(userId: string) {
  if (currentUserId === userId && storeInstance) return storeInstance
  currentUserId = userId
  storeInstance = create<AppState>()(
    persist(
      (set) => ({
        smartGoals: [],
        pomodoroSessions: [],
        pomodoroHistory: [],
        pomodoroSettings: { focusMinutes: 25, breakMinutes: 5 },
        eisenhowerTasks: [],
        ivyLeeDays: [],

        addSmartGoal: (goal) =>
          set((state) => ({ smartGoals: [...state.smartGoals, goal] })),
        toggleSmartGoal: (id) =>
          set((state) => ({
            smartGoals: state.smartGoals.map((g) =>
              g.id === id ? { ...g, completed: !g.completed } : g
            ),
          })),
        removeSmartGoal: (id) =>
          set((state) => ({
            smartGoals: state.smartGoals.filter((g) => g.id !== id),
          })),

        addPomodoroSession: (session) =>
          set((state) => ({
            pomodoroSessions: [...state.pomodoroSessions, session],
          })),
        addPomodoroHistory: (entry) =>
          set((state) => ({
            // Insere no início para mostrar os mais recentes primeiro
            pomodoroHistory: [entry, ...state.pomodoroHistory],
          })),
        updatePomodoroSettings: (settings) =>
          set(() => ({ pomodoroSettings: settings })),

        addEisenhowerTask: (task) =>
          set((state) => ({
            eisenhowerTasks: [...state.eisenhowerTasks, task],
          })),
        toggleEisenhowerTask: (id) =>
          set((state) => ({
            eisenhowerTasks: state.eisenhowerTasks.map((t) =>
              t.id === id ? { ...t, completed: !t.completed } : t
            ),
          })),
        removeEisenhowerTask: (id) =>
          set((state) => ({
            eisenhowerTasks: state.eisenhowerTasks.filter((t) => t.id !== id),
          })),

        setIvyLeeDay: (day) =>
          set((state) => {
            const existing = state.ivyLeeDays.findIndex((d) => d.date === day.date)
            if (existing >= 0) {
              const updated = [...state.ivyLeeDays]
              updated[existing] = day
              return { ivyLeeDays: updated }
            }
            return { ivyLeeDays: [...state.ivyLeeDays, day] }
          }),
        toggleIvyLeeTask: (date, taskId) =>
          set((state) => ({
            ivyLeeDays: state.ivyLeeDays.map((d) =>
              d.date === date
                ? {
                    ...d,
                    tasks: d.tasks.map((t) =>
                      t.id === taskId ? { ...t, completed: !t.completed } : t
                    ),
                  }
                : d
            ),
          })),
      }),
      { name: `produtividade-app-${userId}` }
    )
  )
  return storeInstance
}

export function useAppStore(): AppState
export function useAppStore<T>(selector: (state: AppState) => T): T
export function useAppStore<T>(selector?: (state: AppState) => T) {
  if (!storeInstance) {
    throw new Error('Store não inicializado. Faça login primeiro.')
  }
  if (selector) {
    return storeInstance(selector)
  }
  return storeInstance()
}
