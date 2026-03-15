// 儀表板統計 API
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 取得儀表板統計
export async function GET() {
  try {
    // 取得任務統計
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status')

    const stats = {
      total: tasks?.length || 0,
      todo: tasks?.filter(t => t.status === 'todo').length || 0,
      doing: tasks?.filter(t => t.status === 'doing').length || 0,
      done: tasks?.filter(t => t.status === 'done').length || 0,
    }

    // 取得子任務統計
    const { data: subtasks } = await supabase
      .from('subtasks')
      .select('status')

    const subtaskStats = {
      total: subtasks?.length || 0,
      pending: subtasks?.filter(s => s.status === 'pending').length || 0,
      completed: subtasks?.filter(s => s.status === 'completed').length || 0,
    }

    // 取得負責人情況
    const { data: assignees } = await supabase
      .from('task_assignees')
      .select('*')

    const assigneeStats = {
      total: assignees?.length || 0,
    }

    return NextResponse.json({
      tasks: stats,
      subtasks: subtaskStats,
      assignees: assigneeStats,
      updated_at: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
