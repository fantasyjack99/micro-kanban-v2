# 看板優化 Vercel 部署指南

## 程式碼位置
- **GitHub：** https://github.com/fantasyjack99/micro-kanban-v2
- **本地：** ~/.openclaw/workspace/micro-kanban-v2/

## 部署步驟

### 方法一：手動部署（推薦）
1. 打開 https://vercel.com/new
2. 選擇 "Import Project"
3. 輸入：`https://github.com/fantasyjack99/micro-kanban-v2`
4. 點擊 Deploy

### 方法二：提供 Vercel Token 給 Kelly
如果可以提供有效的 Vercel token，Kelly 可以幫您部署。

## 環境變數（部署時需要設定）
```
NEXT_PUBLIC_SUPABASE_URL=https://mhmfqquydthwejvzdjou.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1obWZxcXV5ZHRod2Vqdnpkam91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjM3MTgsImV4cCI6MjA4NjQ5OTcxOH0.RceDEdzV3fCf08oyIkyLzUjTYRYNPceFvo3vTeNXUUU
```

## 新增資料表（部署前需在 Supabase 完成）
```sql
-- 子任務表
CREATE TABLE subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 任務負責人表
CREATE TABLE task_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  assignee_id UUID NOT NULL,
  role TEXT DEFAULT 'assignee' CHECK (role IN ('owner', 'assignee', 'reviewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, assignee_id)
);
```
