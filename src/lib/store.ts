'use client'

import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'doing' | 'done'
  priority: 'low' | 'medium' | 'high'
  created_at: string
  order?: number
}

export interface Subtask {
  id: string
  task_id: string
  title: string
  status: 'pending' | 'completed'
}

interface KanbanStore {
  tasks: Task[]
  loading: boolean
  selectedTask: Task | null
  subtasks: Subtask[]
  isEditing: boolean
  editTask: Task | null
  
  // Actions
  fetchTasks: () => Promise<void>
  addTask: (title: string, priority?: Task['priority']) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  updateTaskStatus: (id: string, status: Task['status']) => Promise<void>
  reorderTasks: (tasks: Task[]) => void
  
  // Subtasks
  fetchSubtasks: (taskId: string) => Promise<void>
  addSubtask: (taskId: string, title: string) => Promise<void>
  toggleSubtask: (id: string, status: Subtask['status']) => Promise<void>
  
  // UI State
  setSelectedTask: (task: Task | null) => void
  setIsEditing: (editing: boolean) => void
  setEditTask: (task: Task | null) => void
}

export const useKanbanStore = create<KanbanStore>((set, get) => ({
  tasks: [],
  loading: true,
  selectedTask: null,
  subtasks: [],
  isEditing: false,
  editTask: null,

  fetchTasks: async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      // 確保每個任務都有 order 欄位
      const tasksWithOrder = (data as Task[]).map((task, index) => ({
        ...task,
        order: typeof task.order === 'number' ? task.order : index
      }))
      set({ tasks: tasksWithOrder })
    }
    set({ loading: false })
  },

  addTask: async (title: string, priority: Task['priority'] = 'medium') => {
    const { tasks } = get()
    const todoTasks = tasks.filter(t => t.status === 'todo')
    const maxOrder = todoTasks.length > 0 ? Math.max(...todoTasks.map(t => t.order ?? 0)) : 0
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({ 
        title, 
        status: 'todo', 
        priority,
        order: maxOrder + 1
      })
      .select()
      .single()

    if (!error && data) {
      set({ tasks: [{ ...data as Task, order: maxOrder + 1 }, ...tasks] })
    }
  },

  updateTask: async (id: string, updates: Partial<Task>) => {
    const { tasks } = get()
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)

    if (!error) {
      set({ 
        tasks: tasks.map(t => t.id === id ? { ...t, ...updates } : t),
        isEditing: false,
        editTask: null
      })
    }
  },

  deleteTask: async (id: string) => {
    const { tasks } = get()
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (!error) {
      set({ tasks: tasks.filter(t => t.id !== id) })
    }
  },

  updateTaskStatus: async (id: string, status: Task['status']) => {
    const { tasks } = get()
    const { error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', id)

    if (!error) {
      set({ tasks: tasks.map(t => t.id === id ? { ...t, status } : t) })
    }
  },

  reorderTasks: (tasks: Task[]) => {
    set({ tasks })
  },

  fetchSubtasks: async (taskId: string) => {
    const { data } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (data) set({ subtasks: data as Subtask[] })
  },

  addSubtask: async (taskId: string, title: string) => {
    const { subtasks } = get()
    const { data, error } = await supabase
      .from('subtasks')
      .insert({ task_id: taskId, title })
      .select()
      .single()

    if (!error && data) {
      set({ subtasks: [...subtasks, data as Subtask] })
    }
  },

  toggleSubtask: async (id: string, status: Subtask['status']) => {
    const newStatus = status === 'pending' ? 'completed' : 'pending'
    const { subtasks } = get()
    
    await supabase
      .from('subtasks')
      .update({ status: newStatus })
      .eq('id', id)

    set({ subtasks: subtasks.map(s => s.id === id ? { ...s, status: newStatus } : s) })
  },

  setSelectedTask: (task) => set({ selectedTask: task }),
  setIsEditing: (editing) => set({ isEditing: editing }),
  setEditTask: (task) => set({ editTask: task }),
}))
