// 任務負責人 API
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 取得任務負責人
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('taskId')

  if (!taskId) {
    return NextResponse.json({ error: 'taskId is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('task_assignees')
    .select('*')
    .eq('task_id', taskId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// 新增任務負責人
export async function POST(request: Request) {
  const body = await request.json()
  const { task_id, assignee_id, role } = body

  if (!task_id || !assignee_id) {
    return NextResponse.json({ error: 'task_id and assignee_id are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('task_assignees')
    .insert({ task_id, assignee_id, role: role || 'assignee' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
