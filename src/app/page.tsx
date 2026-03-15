'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'doing' | 'done'
  priority: 'low' | 'medium' | 'high'
  created_at: string
}

interface Subtask {
  id: string
  task_id: string
  title: string
  status: 'pending' | 'completed'
}

export default function Kanban() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setTasks(data)
    }
    setLoading(false)
  }

  const addTask = async () => {
    if (!newTaskTitle.trim()) return

    const { data, error } = await supabase
      .from('tasks')
      .insert({ title: newTaskTitle, status: 'todo', priority: 'medium' })
      .select()
      .single()

    if (!error && data) {
      setTasks([data, ...tasks])
      setNewTaskTitle('')
    }
  }

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', taskId)

    if (!error) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t))
    }
  }

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (!error) {
      setTasks(tasks.filter(t => t.id !== taskId))
    }
  }

  const fetchSubtasks = async (taskId: string) => {
    const { data } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (data) setSubtasks(data)
  }

  const addSubtask = async () => {
    if (!selectedTask || !newSubtaskTitle.trim()) return

    const { data, error } = await supabase
      .from('subtasks')
      .insert({ task_id: selectedTask.id, title: newSubtaskTitle })
      .select()
      .single()

    if (!error && data) {
      setSubtasks([...subtasks, data])
      setNewSubtaskTitle('')
    }
  }

  const toggleSubtask = async (subtaskId: string, status: Subtask['status']) => {
    const newStatus = status === 'pending' ? 'completed' : 'pending'
    await supabase
      .from('subtasks')
      .update({ status: newStatus })
      .eq('id', subtaskId)

    setSubtasks(subtasks.map(s => s.id === subtaskId ? { ...s, status: newStatus } : s))
  }

  const columns: { status: Task['status']; label: string; color: string }[] = [
    { status: 'todo', label: '📋 待處理', color: 'bg-orange-100' },
    { status: 'doing', label: '🔄 執行中', color: 'bg-blue-100' },
    { status: 'done', label: '✅ 完成', color: 'bg-green-100' },
  ]

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">載入中...</div>
  }

  return (
    <div className="kanban-wrapper">
      {/* Header */}
      <div className="app-header">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1>✨ 微創任務看板</h1>
          <a href="/dashboard" className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition">
            📊 儀表板
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* 新增任務 */}
        <div className="task-input-area mb-6">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="➕ 新增任務..."
            className="input-field"
          />
          <button onClick={addTask} className="btn-primary">
            新增任務
          </button>
        </div>

        {/* 看板 columns */}
        <div className="kanban-board">
          {columns.map(col => (
            <div key={col.status} className={`kanban-column column-${col.status}`}>
              <div className="kanban-column-header">
                <span>{col.label}</span>
                <span className="task-count">{tasks.filter(t => t.status === col.status).length}</span>
              </div>
              <div className="task-list">
                {tasks.filter(t => t.status === col.status).map(task => (
                  <div
                    key={task.id}
                    className="task-card"
                    onClick={() => {
                      setSelectedTask(task)
                      fetchSubtasks(task.id)
                    }}
                  >
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      <span className={`priority-badge priority-${task.priority}`}>
                        {task.priority === 'high' ? '🔴 緊急' : task.priority === 'medium' ? '🟡 一般' : '🟢 低'}
                      </span>
                    </div>
                    <div className="task-actions">
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value as Task['status'])}
                        onClick={(e) => e.stopPropagation()}
                        className="status-select"
                      >
                        <option value="todo">待處理</option>
                        <option value="doing">執行中</option>
                        <option value="done">完成</option>
                      </select>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteTask(task.id)
                        }}
                        className="delete-btn"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.status === col.status).length === 0 && (
                  <div className="empty-state">尚無任務</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 子任務面板 */}
        {selectedTask && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>✨ 子任務 - {selectedTask.title}</h2>
                <button onClick={() => setSelectedTask(null)} className="close-btn">
                  ✕
                </button>
              </div>

              {/* 子任務列表 */}
              <div className="subtask-list">
                {subtasks.map(subtask => (
                  <div key={subtask.id} className={`subtask-item ${subtask.status === 'completed' ? 'completed' : ''}`}>
                    <input
                      type="checkbox"
                      checked={subtask.status === 'completed'}
                      onChange={() => toggleSubtask(subtask.id, subtask.status)}
                    />
                    <span>{subtask.title}</span>
                  </div>
                ))}
                {subtasks.length === 0 && <p className="empty-state">尚無子任務</p>}
              </div>

              {/* 新增子任務 */}
              <div className="subtask-input-area">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                  placeholder="新增子任務..."
                  className="input-field"
                />
                <button onClick={addSubtask} className="btn-secondary">
                  新增
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
