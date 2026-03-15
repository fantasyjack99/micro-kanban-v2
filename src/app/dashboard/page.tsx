'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">載入中...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">📊 任務看板儀表板</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 任務統計 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">📋 任務概覽</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>總任務數</span>
              <span className="font-bold">{stats?.tasks.total || 0}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>待處理</span>
              <span className="font-semibold text-orange-500">{stats?.tasks.todo || 0}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>執行中</span>
              <span className="font-semibold text-blue-500">{stats?.tasks.doing || 0}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>已完成</span>
              <span className="font-semibold text-green-500">{stats?.tasks.done || 0}</span>
            </div>
          </div>
        </div>

        {/* 子任務統計 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">✅ 子任務進度</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>總子任務數</span>
              <span className="font-bold">{stats?.subtasks.total || 0}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>待完成</span>
              <span className="font-semibold text-orange-500">{stats?.subtasks.pending || 0}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>已完成</span>
              <span className="font-semibold text-green-500">{stats?.subtasks.completed || 0}</span>
            </div>
            {/* 進度條 */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{
                    width: stats?.subtasks.total
                      ? `${(stats.subtasks.completed / stats.subtasks.total) * 100}%`
                      : '0%'
                  }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                完成率：{stats?.subtasks.total
                  ? Math.round((stats.subtasks.completed / stats.subtasks.total) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* 團隊統計 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">👥 團隊負擔</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>負責人總數</span>
              <span className="font-bold">{stats?.assignees.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>平均每人任務</span>
              <span className="font-semibold">
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
          className="block p-4 bg-blue-500 text-white rounded-lg text-center hover:bg-blue-600 transition"
        >
          ← 回到看板
        </a>
        <button
          onClick={fetchStats}
          className="block p-4 bg-gray-500 text-white rounded-lg text-center hover:bg-gray-600 transition"
        >
          🔄 重新整理
        </button>
      </div>
    </div>
  )
}
