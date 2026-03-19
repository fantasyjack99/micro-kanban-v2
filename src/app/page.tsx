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
  DragOverlay,
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

      newTasks.forEach((task, index) => {
        task.order = index
      })

      reorderTasks(newTasks)

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
    return tasks
      .filter(t => t.status === status)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
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
      {/* 頂部裝飾光暈 */}
      <div className="banli-top-graphic" aria-hidden="true" />

      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1>任務看板</h1>
          <a href="/dashboard" className="header-btn">
            儀表板
          </a>
        </div>
      </header>

      <main className="kanban-container">
        {/* 新增任務區 */}
        <div className="task-input-area">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            placeholder="新增任務..."
            className="input-field"
            aria-label="新增任務"
          />
          <select
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value as Task['priority'])}
            className="priority-select"
            aria-label="選擇優先權"
          >
            <option value="low">低優先權</option>
            <option value="medium">一般</option>
            <option value="high">緊急</option>
          </select>
          <button onClick={handleAddTask} className="btn-primary" type="button">
            新增任務
          </button>
        </div>

        {/* 看板區域 */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="kanban-board" role="region" aria-label="任務看板">
            {columns.map(col => (
              <section
                key={col.status}
                className={`kanban-column column-${col.status}`}
                aria-label={`${col.label}欄`}
              >
                <div className="kanban-column-header" role="heading" aria-level={2}>
                  <span>{col.label}</span>
                  <span className="task-count" aria-label={`共${getTasksByStatus(col.status).length}項`}>
                    {getTasksByStatus(col.status).length}
                  </span>
                </div>

                <SortableContext
                  items={getTasksByStatus(col.status).map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="task-list" role="list">
                    {getTasksByStatus(col.status).length > 0 ? (
                      getTasksByStatus(col.status).map(task => (
                        <div role="listitem" key={task.id}>
                          <TaskCard
                            task={task}
                            onClick={() => {
                              setSelectedTask(task)
                              fetchSubtasks(task.id)
                            }}
                            onStatusChange={(status) => updateTaskStatus(task.id, status)}
                            onDelete={() => deleteTask(task.id)}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="empty-state" role="status">
                        <div className="empty-illustration" aria-hidden="true">
                          {/* 板栗風格空狀態插圖 - 葉子線條 */}
                          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* 主葉片 */}
                            <path d="M28 10C28 10 18 20 18 30C18 38 22 44 28 48C34 44 38 38 38 30C38 20 28 10 28 10Z" stroke="#c4a882" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
                            {/* 葉脈 */}
                            <path d="M28 16V44" stroke="#c4a882" strokeWidth="1" strokeLinecap="round" opacity="0.35"/>
                            <path d="M28 24L22 28" stroke="#c4a882" strokeWidth="0.8" strokeLinecap="round" opacity="0.3"/>
                            <path d="M28 32L34 28" stroke="#c4a882" strokeWidth="0.8" strokeLinecap="round" opacity="0.3"/>
                            {/* 裝飾圓點 */}
                            <circle cx="28" cy="12" r="2" fill="#c4a882" opacity="0.4"/>
                            <circle cx="16" cy="34" r="1.5" fill="#d4cfc6" opacity="0.4"/>
                            <circle cx="40" cy="32" r="1.5" fill="#d4cfc6" opacity="0.3"/>
                            {/* 小果實 */}
                            <circle cx="20" cy="22" r="3" fill="#d4c59a" opacity="0.25"/>
                            <circle cx="36" cy="24" r="2.5" fill="#d4c59a" opacity="0.2"/>
                          </svg>
                        </div>
                        <p>尚無任務</p>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </section>
            ))}
          </div>
        </DndContext>

        {/* 詳情/編輯面板 */}
        {(selectedTask || isEditing) && (
          <div
            className="modal-overlay"
            onClick={() => { setSelectedTask(null); setIsEditing(false); setEditTask(null) }}
            role="dialog"
            aria-modal="true"
            aria-label="任務詳情"
          >
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              {/* 編輯模式 */}
              {isEditing && editTask && (
                <>
                  <div className="modal-header">
                    <h2>編輯任務</h2>
                    <button onClick={() => setIsEditing(false)} className="close-btn" aria-label="關閉">✕</button>
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
                      <button onClick={() => setIsEditing(false)} className="btn-cancel" type="button">
                        取消
                      </button>
                      <button onClick={handleSaveEdit} className="btn-primary" type="button">
                        儲存變更
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* 檢視子任務模式 */}
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
                    <button onClick={() => setSelectedTask(null)} className="close-btn" aria-label="關閉">✕</button>
                  </div>

                  {selectedTask.description && (
                    <div className="task-description">
                      {selectedTask.description}
                    </div>
                  )}

                  <div className="subtask-list" role="list" aria-label="子任務">
                    {subtasks.map(subtask => (
                      <div
                        key={subtask.id}
                        className={`subtask-item${subtask.status === 'completed' ? ' completed' : ''}`}
                        role="listitem"
                      >
                        <input
                          type="checkbox"
                          checked={subtask.status === 'completed'}
                          onChange={() => toggleSubtask(subtask.id, subtask.status)}
                          aria-label={`子任務：${subtask.title}`}
                        />
                        <span>{subtask.title}</span>
                      </div>
                    ))}
                    {subtasks.length === 0 && (
                      <p className="empty-state" role="status">尚無子任務</p>
                    )}
                  </div>

                  <div className="subtask-input-area">
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                      placeholder="新增子任務..."
                      className="input-field"
                      aria-label="新增子任務"
                    />
                    <button onClick={handleAddSubtask} className="btn-secondary" type="button">
                      新增
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
