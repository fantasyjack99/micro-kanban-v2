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
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ? `${transition} cubic-bezier(0.34, 1.56, 0.64, 1)` : undefined,
  }

  // 板栗看板優先權配置
  const priorityConfig = {
    high: {
      label: '緊急',
      bg: 'var(--priority-high-bg)',
      border: 'var(--priority-high-border)',
      text: 'var(--priority-high-text)',
    },
    medium: {
      label: '一般',
      bg: 'var(--priority-medium-bg)',
      border: 'var(--priority-medium-border)',
      text: 'var(--priority-medium-text)',
    },
    low: {
      label: '低',
      bg: 'var(--priority-low-bg)',
      border: 'var(--priority-low-border)',
      text: 'var(--priority-low-text)',
    },
  }

  const priority = priorityConfig[task.priority]

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`task-card priority-${task.priority}${isDragging ? ' dragging' : ''}`}
      onClick={onClick}
      aria-label={`任務：${task.title}`}
    >
      <div className="task-card-inner">
        <div className="task-title">{task.title}</div>

        <div className="task-meta">
          <span
            className="priority-badge"
            style={{
              background: priority.bg,
              borderColor: priority.border,
              color: priority.text,
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
            aria-label="刪除任務"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
