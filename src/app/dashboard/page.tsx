'use client'

import { useEffect, useState } from 'react'

interface DashboardStats {
  tasks: {
    total: number
    todo: number
    doing: number
    done: number
  }
  subtasks: {
    total: number
    pending: number
    completed: number
  }
  assignees: {
    total: number
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f5f0' }}>
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto" style={{ background: '#f7f5f0', minHeight: '100vh' }}>
      <h1 className="text-2xl font-normal mb-8" style={{ color: '#5c5c5c', letterSpacing: '0.05em' }}>
        任務看板儀表板
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 任務統計 */}
        <div className="bg-white rounded-lg" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: '1.5rem' }}>
          <h2 className="text-base font-normal mb-4" style={{ color: '#5c5c5c' }}>任務概覽</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span style={{ color: '#9a9a9a' }}>總任務數</span>
              <span className="font-normal" style={{ color: '#5c5c5c' }}>{stats?.tasks.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#9a9a9a' }}>待處理</span>
              <span className="font-normal" style={{ color: '#a08080' }}>{stats?.tasks.todo || 0}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#9a9a9a' }}>執行中</span>
              <span className="font-normal" style={{ color: '#8090a0' }}>{stats?.tasks.doing || 0}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#9a9a9a' }}>已完成</span>
              <span className="font-normal" style={{ color: '#a8c5a8' }}>{stats?.tasks.done || 0}</span>
            </div>
          </div>
        </div>

        {/* 子任務統計 */}
        <div className="bg-white rounded-lg" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: '1.5rem' }}>
          <h2 className="text-base font-normal mb-4" style={{ color: '#5c5c5c' }}>子任務進度</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span style={{ color: '#9a9a9a' }}>總子任務數</span>
              <span className="font-normal" style={{ color: '#5c5c5c' }}>{stats?.subtasks.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#9a9a9a' }}>待完成</span>
              <span className="font-normal" style={{ color: '#a08080' }}>{stats?.subtasks.pending || 0}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#9a9a9a' }}>已完成</span>
              <span className="font-normal" style={{ color: '#a8c5a8' }}>{stats?.subtasks.completed || 0}</span>
            </div>
            {/* 進度條 */}
            <div className="mt-4">
              <div className="w-full rounded-full h-2" style={{ background: '#e5e3de' }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: stats?.subtasks.total
                      ? `${(stats.subtasks.completed / stats.subtasks.total) * 100}%`
                      : '0%',
                    background: '#a8c5a8'
                  }}
                />
              </div>
              <p className="text-sm mt-1" style={{ color: '#9a9a9a' }}>
                完成率：{stats?.subtasks.total
                  ? Math.round((stats.subtasks.completed / stats.subtasks.total) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* 團隊統計 */}
        <div className="bg-white rounded-lg" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: '1.5rem' }}>
          <h2 className="text-base font-normal mb-4" style={{ color: '#5c5c5c' }}>團隊負擔</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span style={{ color: '#9a9a9a' }}>負責人總數</span>
              <span className="font-normal" style={{ color: '#5c5c5c' }}>{stats?.assignees.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#9a9a9a' }}>平均每人任務</span>
              <span className="font-normal" style={{ color: '#5c5c5c' }}>
                {stats?.assignees.total
                  ? Math.round(stats.tasks.total / stats.assignees.total)
                  : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href="/"
          className="block p-4 text-white rounded-lg text-center transition"
          style={{ background: '#5c5c5c' }}
        >
          回到看板
        </a>
        <button
          onClick={fetchStats}
          className="block p-4 text-white rounded-lg text-center transition"
          style={{ background: '#8b8b8b' }}
        >
          重新整理
        </button>
      </div>
    </div>
  )
}
