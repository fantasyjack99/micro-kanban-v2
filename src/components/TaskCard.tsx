'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task } from '@/lib/store'

interface TaskCardProps {
  task: Task
  onClick: () => void
  onStatusChange: (status: Task['status']) => void
  onDelete: () => void
}

export function TaskCard({ task, onClick, onStatusChange, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // MUJI 風格優先權 - 柔和低調
  const priorityConfig = {
    high: { 
      label: '緊急', 
      bg: '#f5f0f0',
      border: '#d4c4c4',
      text: '#a08080'
    },
    medium: { 
      label: '一般', 
      bg: '#f5f3ec',
      border: '#d4cbb8',
      text: '#a09070'
    },
    low: { 
      label: '低', 
      bg: '#f0f2f5',
      border: '#c4cdd4',
      text: '#808fa0'
    }
  }

  const priority = priorityConfig[task.priority]

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`task-card priority-${task.priority}`}
      onClick={onClick}
    >
      {/* 拖拽手柄視覺提示 */}
      <div className="drag-handle">
        <span>::</span>
      </div>
      
      <div className="task-title">{task.title}</div>
      
      <div className="task-meta">
        <span 
          className="priority-badge"
          style={{ 
            background: priority.bg,
            borderColor: priority.border,
            color: priority.text
          }}
        >
          {priority.label}
        </span>
      </div>
      
      <div className="task-actions">
        <select
          value={task.status}
          onChange={(e) => {
            e.stopPropagation()
            onStatusChange(e.target.value as Task['status'])
          }}
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
            onDelete()
          }}
          className="delete-btn"
          title="刪除任務"
        >
          ×
        </button>
      </div>
    </div>
  )
}
