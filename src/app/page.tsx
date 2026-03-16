'use client'

import { useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useKanbanStore, Task } from '@/lib/store'
import { TaskCard } from '@/components/TaskCard'

export default function Kanban() {
  const {
    tasks,
    loading,
    selectedTask,
    subtasks,
    isEditing,
    editTask,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    reorderTasks,
    fetchSubtasks,
    addSubtask,
    toggleSubtask,
    setSelectedTask,
    setIsEditing,
    setEditTask,
  } = useKanbanStore()

  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex(t => t.id === active.id)
      const newIndex = tasks.findIndex(t => t.id === over.id)
      const newTasks = arrayMove(tasks, oldIndex, newIndex)
      
      // 更新 order
      newTasks.forEach((task, index) => {
        task.order = index
      })
      
      reorderTasks(newTasks)
      
      // 持久化到數據庫
      newTasks.forEach(async (task) => {
        await useKanbanStore.getState().updateTask(task.id, { order: task.order })
      })
    }
  }

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return
    await addTask(newTaskTitle, newTaskPriority)
    setNewTaskTitle('')
    setNewTaskPriority('medium')
  }

  const handleAddSubtask = async () => {
    if (!selectedTask || !newSubtaskTitle.trim()) return
    await addSubtask(selectedTask.id, newSubtaskTitle)
    setNewSubtaskTitle('')
  }

  const handleStartEdit = (task: Task) => {
    setEditTask({ ...task })
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!editTask) return
    await updateTask(editTask.id, {
      title: editTask.title,
      description: editTask.description,
      priority: editTask.priority,
    })
  }

  const columns: { status: Task['status']; label: string }[] = [
    { status: 'todo', label: '待處理' },
    { status: 'doing', label: '執行中' },
    { status: 'done', label: '已完成' },
  ]

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(t => t.status === status).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="kanban-wrapper">
      {/* Header */}
      <div className="app-header">
        <div className="header-content">
          <h1>任務看板</h1>
          <a href="/dashboard" className="header-btn">
            儀表板
          </a>
        </div>
      </div>

      <div className="kanban-container">
        {/* 新增任務 */}
        <div className="task-input-area">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            placeholder="新增任務..."
            className="input-field"
          />
          <select
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value as Task['priority'])}
            className="priority-select"
          >
            <option value="low">低優先權</option>
            <option value="medium">一般</option>
            <option value="high">緊急</option>
          </select>
          <button onClick={handleAddTask} className="btn-primary">
            新增
          </button>
        </div>

        {/* 看板 columns */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="kanban-board">
            {columns.map(col => (
              <div key={col.status} className={`kanban-column column-${col.status}`}>
                <div className="kanban-column-header">
                  <span>{col.label}</span>
                  <span className="task-count">{getTasksByStatus(col.status).length}</span>
                </div>
                <SortableContext
                  items={getTasksByStatus(col.status).map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="task-list">
                    {getTasksByStatus(col.status).map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => {
                          setSelectedTask(task)
                          fetchSubtasks(task.id)
                        }}
                        onStatusChange={(status) => updateTaskStatus(task.id, status)}
                        onDelete={() => deleteTask(task.id)}
                      />
                    ))}
                    {getTasksByStatus(col.status).length === 0 && (
                      <div className="empty-state">
                        <span className="empty-icon">−</span>
                        <p>尚無任務</p>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            ))}
          </div>
        </DndContext>

        {/* 子任務/編輯面板 */}
        {(selectedTask || isEditing) && (
          <div className="modal-overlay" onClick={() => { setSelectedTask(null); setIsEditing(false); setEditTask(null) }}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              {/* 編輯模式 */}
              {isEditing && editTask && (
                <>
                  <div className="modal-header">
                    <h2>編輯任務</h2>
                    <button onClick={() => setIsEditing(false)} className="close-btn">✕</button>
                  </div>
                  <div className="edit-form">
                    <label className="form-label">
                      任務標題
                      <input
                        type="text"
                        value={editTask.title}
                        onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                        className="input-field"
                      />
                    </label>
                    <label className="form-label">
                      描述
                      <textarea
                        value={editTask.description || ''}
                        onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                        className="input-field textarea"
                        rows={3}
                        placeholder="新增描述..."
                      />
                    </label>
                    <label className="form-label">
                      優先權
                      <select
                        value={editTask.priority}
                        onChange={(e) => setEditTask({ ...editTask, priority: e.target.value as Task['priority'] })}
                        className="input-field"
                      >
                        <option value="low">低優先權</option>
                        <option value="medium">一般</option>
                        <option value="high">緊急</option>
                      </select>
                    </label>
                    <div className="edit-actions">
                      <button onClick={() => setIsEditing(false)} className="btn-cancel">
                        取消
                      </button>
                      <button onClick={handleSaveEdit} className="btn-primary">
                        儲存
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* 查看子任務模式 */}
              {!isEditing && selectedTask && (
                <>
                  <div className="modal-header">
                    <div className="modal-title-row">
                      <h2>{selectedTask.title}</h2>
                      <button 
                        onClick={() => handleStartEdit(selectedTask)} 
                        className="edit-btn"
                        title="編輯任務"
                      >
                        編輯
                      </button>
                    </div>
                    <button onClick={() => setSelectedTask(null)} className="close-btn">✕</button>
                  </div>

                  {selectedTask.description && (
                    <div className="task-description">
                      {selectedTask.description}
                    </div>
                  )}

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
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                      placeholder="新增子任務..."
                      className="input-field"
                    />
                    <button onClick={handleAddSubtask} className="btn-secondary">
                      新增
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
