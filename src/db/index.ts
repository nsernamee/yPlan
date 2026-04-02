import { openDB, type IDBPDatabase } from 'idb'
import type { Task, TaskSchedule } from '@/types'

const DB_NAME = 'yplan-db'
const DB_VERSION = 2
const TASKS_STORE = 'tasks'
const SCHEDULES_STORE = 'task-schedules'

let dbInstance: IDBPDatabase | null = null

// 初始化数据库
export async function initDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // v1: 创建 tasks 存储
      if (!db.objectStoreNames.contains(TASKS_STORE)) {
        const taskStore = db.createObjectStore(TASKS_STORE, { keyPath: 'id' })
        taskStore.createIndex('createdAt', 'createdAt')
      }

      // v2: 创建 task-schedules 存储 + 迁移旧数据
      if (oldVersion < 2) {
        // 创建 schedules 存储
        if (!db.objectStoreNames.contains(SCHEDULES_STORE)) {
          const scheduleStore = db.createObjectStore(SCHEDULES_STORE, { keyPath: 'id' })
          scheduleStore.createIndex('taskId', 'taskId')
          scheduleStore.createIndex('date', 'date')
          scheduleStore.createIndex('taskId-date', ['taskId', 'date'])
        }

        // 迁移旧数据：将任务中的日期时间提取为 schedule 记录
        migrateOldData(db)
      }
    },
  })

  return dbInstance
}

// 迁移旧数据（v1 -> v2）
async function migrateOldData(db: IDBPDatabase) {
  const tx = db.transaction([TASKS_STORE, SCHEDULES_STORE], 'readwrite')
  const taskStore = tx.objectStore(TASKS_STORE)
  const scheduleStore = tx.objectStore(SCHEDULES_STORE)

  // 遍历所有旧任务
  let cursor = await taskStore.openCursor()
  while (cursor) {
    const oldTask = cursor.value

    // 如果旧任务有日期和时间，创建 schedule 记录
    if (oldTask.startDate && oldTask.startTime && oldTask.endTime) {
      const schedule: TaskSchedule = {
        id: `${oldTask.id}-migrated`,
        taskId: oldTask.id,
        date: oldTask.startDate,
        startTime: oldTask.startTime,
        endTime: oldTask.endTime,
      }

      // 如果 endDate 不同于 startDate，也为 endDate 创建一条
      if (oldTask.endDate && oldTask.endDate !== oldTask.startDate) {
        await scheduleStore.put({
          ...schedule,
          date: oldTask.endDate,
        })
      }

      await scheduleStore.put(schedule)

      // 清除旧任务的日期时间字段
      const { startDate, endDate, startTime, endTime, ...taskWithoutDates } = oldTask
      await taskStore.put(taskWithoutDates)
    }

    cursor = await cursor.continue()
  }

  await tx.done
}

// ========== Task CRUD ==========

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

// ========== TaskSchedule CRUD ==========

// 获取所有日程
export async function getAllSchedules(): Promise<TaskSchedule[]> {
  const db = await initDB()
  return db.getAll(SCHEDULES_STORE)
}

// 根据任务 ID 获取日程列表
export async function getSchedulesByTaskId(taskId: string): Promise<TaskSchedule[]> {
  const db = await initDB()
  return db.getAllFromIndex(SCHEDULES_STORE, 'taskId', taskId)
}

// 根据日期获取日程列表
export async function getSchedulesByDate(date: string): Promise<TaskSchedule[]> {
  const db = await initDB()
  return db.getAllFromIndex(SCHEDULES_STORE, 'date', date)
}

// 创建日程
export async function createSchedule(schedule: TaskSchedule): Promise<string> {
  const db = await initDB()
  await db.add(SCHEDULES_STORE, schedule)
  return schedule.id
}

// 更新日程
export async function updateSchedule(schedule: TaskSchedule): Promise<void> {
  const db = await initDB()
  await db.put(SCHEDULES_STORE, schedule)
}

// 删除日程
export async function deleteSchedule(id: string): Promise<void> {
  const db = await initDB()
  await db.delete(SCHEDULES_STORE, id)
}

// 删除任务的所有日程
export async function deleteSchedulesByTaskId(taskId: string): Promise<void> {
  const db = await initDB()
  const tx = db.transaction(SCHEDULES_STORE, 'readwrite')
  const store = tx.objectStore(SCHEDULES_STORE)
  const index = store.index('taskId')

  let cursor = await index.openCursor(taskId)
  while (cursor) {
    await cursor.delete()
    cursor = await cursor.continue()
  }

  await tx.done
}

// 清空所有任务（用于测试）
export async function clearAllTasks(): Promise<void> {
  const db = await initDB()
  const tx = db.transaction([TASKS_STORE, SCHEDULES_STORE], 'readwrite')
  await tx.objectStore(TASKS_STORE).clear()
  await tx.objectStore(SCHEDULES_STORE).clear()
  await tx.done
}

// 生成唯一 ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
