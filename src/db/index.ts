import { openDB, type IDBPDatabase } from 'idb'
import type { Task } from '@/types'

const DB_NAME = 'yplan-db'
const DB_VERSION = 1
const TASKS_STORE = 'tasks'

let dbInstance: IDBPDatabase | null = null

// 初始化数据库
export async function initDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 创建 tasks 存储
      if (!db.objectStoreNames.contains(TASKS_STORE)) {
        const store = db.createObjectStore(TASKS_STORE, { keyPath: 'id' })
        // 创建索引，用于按日期范围查询
        store.createIndex('startDate', 'startDate')
        store.createIndex('endDate', 'endDate')
        store.createIndex('createdAt', 'createdAt')
      }
    },
  })

  return dbInstance
}

// 获取所有任务
export async function getAllTasks(): Promise<Task[]> {
  const db = await initDB()
  return db.getAll(TASKS_STORE)
}

// 根据 ID 获取任务
export async function getTaskById(id: string): Promise<Task | undefined> {
  const db = await initDB()
  return db.get(TASKS_STORE, id)
}

// 根据日期范围获取任务
export async function getTasksByDateRange(startDate: string, endDate: string): Promise<Task[]> {
  const db = await initDB()
  const allTasks = await db.getAll(TASKS_STORE)
  
  return allTasks.filter(task => {
    // 过滤掉没有日期的任务（未计划任务）
    if (!task.startDate || !task.endDate) return false
    return task.startDate <= endDate && task.endDate >= startDate
  })
}

// 创建任务
export async function createTask(task: Task): Promise<string> {
  const db = await initDB()
  await db.add(TASKS_STORE, task)
  return task.id
}

// 更新任务
export async function updateTask(task: Task): Promise<void> {
  const db = await initDB()
  await db.put(TASKS_STORE, task)
}

// 删除任务
export async function deleteTask(id: string): Promise<void> {
  const db = await initDB()
  await db.delete(TASKS_STORE, id)
}

// 清空所有任务（用于测试）
export async function clearAllTasks(): Promise<void> {
  const db = await initDB()
  await db.clear(TASKS_STORE)
}

// 生成唯一 ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
