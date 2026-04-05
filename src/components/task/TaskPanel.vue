<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTaskStore } from '@/stores/task'
import type { TaskColor } from '@/types'
import ColorPicker from '@/components/common/ColorPicker.vue'
import TimeInput from '@/components/common/TimeInput.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { X, Trash2, Calendar } from 'lucide-vue-next'
import dayjs from 'dayjs'

const taskStore = useTaskStore()

// 表单数据
const title = ref('')
const color = ref<TaskColor>('blue')
const startTime = ref('')
const endTime = ref('')
const note = ref('')
const scheduleDate = ref('')

// 确认对话框
const showDeleteConfirm = ref(false)
// 删除类型：'task' | 'schedule'
const deleteType = ref<'task' | 'schedule'>('task')

// 是否编辑模式
const isEditing = computed(() => !!taskStore.editingTask)

// 是否正在编辑日程（有 schedule 说明从日历点击进入）
const isEditingSchedule = computed(() => !!taskStore.editingSchedule)

// 面板标题
const panelTitle = computed(() => {
  if (!isEditing.value) return '新建任务'
  if (isEditingSchedule.value) return '编辑日程'
  return '编辑任务'
})

// 监听编辑任务和日程变化
watch(
  [() => taskStore.editingTask, () => taskStore.editingSchedule],
  ([task, schedule]) => {
    if (task) {
      title.value = task.title
      color.value = task.color
      note.value = task.note || ''
      
      if (schedule) {
        // 有日程：显示日程的时间和日期
        startTime.value = schedule.startTime
        endTime.value = schedule.endTime
        scheduleDate.value = schedule.date
      } else {
        // 无日程：清空时间
        startTime.value = '09:00'
        endTime.value = '10:00'
        scheduleDate.value = dayjs(taskStore.selectedDate).format('YYYY-MM-DD')
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

// 重置表单
function resetForm() {
  title.value = ''
  color.value = 'blue'
  startTime.value = '09:00'
  endTime.value = '10:00'
  note.value = ''
  scheduleDate.value = dayjs(taskStore.selectedDate).format('YYYY-MM-DD')
}

// 关闭面板
function closePanel() {
  taskStore.closePanel()
}

// 保存任务
function handleSave() {
  if (!title.value.trim()) return
  
  if (isEditing.value && taskStore.editingTask) {
    // 编辑模式：更新任务属性
    taskStore.updateTask({
      id: taskStore.editingTask.id,
      title: title.value,
      color: color.value,
      note: note.value,
    })
    
    // 如果有日程，也更新日程时间
    if (taskStore.editingSchedule && startTime.value && endTime.value) {
      taskStore.updateSchedule({
        id: taskStore.editingSchedule.id,
        startTime: startTime.value,
        endTime: endTime.value,
      })
    }
  } else {
    // 创建模式：创建任务
    taskStore.createTask({
      title: title.value,
      color: color.value,
      note: note.value,
    })
  }
}

// 删除日程实例
function handleDeleteSchedule() {
  deleteType.value = 'schedule'
  showDeleteConfirm.value = true
}

// 删除任务
function handleDeleteTask() {
  deleteType.value = 'task'
  showDeleteConfirm.value = true
}

// 确认删除
function confirmDelete() {
  if (deleteType.value === 'schedule' && taskStore.editingSchedule) {
    // 删除日程实例（任务保留）
    taskStore.removeSchedule(taskStore.editingSchedule.id)
  } else if (deleteType.value === 'task' && taskStore.editingTask) {
    // 删除任务（级联删除所有日程）
    taskStore.deleteTask(taskStore.editingTask.id)
  }
  showDeleteConfirm.value = false
}

// 获取任务的日程数量
const scheduleCount = computed(() => {
  if (!taskStore.editingTask) return 0
  return taskStore.getTaskSchedules(taskStore.editingTask.id).length
})
</script>

<template>
  <!-- 遮罩层（移动端） -->
  <div
    class="fixed inset-0 bg-black/50 z-[60] md:hidden panel-mask-enter"
    @click="closePanel"
  />

  <!-- 面板 - 磨砂玻璃效果 -->
  <div class="fixed right-0 top-0 bottom-0 w-[min(384px,calc(100vw-32px))] md:w-96 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl md:border-l md:border-gray-200/50 dark:md:border-gray-700/50 z-[70] flex flex-col panel-enter shadow-2xl">
    <!-- 头部 -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ panelTitle }}</h2>
      <button
        @click="closePanel"
        class="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors btn-apple"
      >
        <X class="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </button>
    </div>

    <!-- 表单内容 -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- 标题 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">任务标题</label>
        <input
          v-model="title"
          type="text"
          placeholder="输入任务标题"
          class="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
        />
      </div>

      <!-- 时间（仅编辑日程时显示） -->
      <div v-if="isEditingSchedule">
        <div class="flex items-center gap-2 mb-2">
          <Calendar class="w-4 h-4 text-gray-500" />
          <span class="text-sm text-gray-500">{{ scheduleDate }}</span>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <TimeInput v-model="startTime" label="开始时间" />
          <TimeInput v-model="endTime" label="结束时间" />
        </div>
        <p class="text-xs text-gray-400 mt-2">
          修改时间仅影响该日程实例，其他日期的日程不受影响
        </p>
      </div>

      <!-- 日程数量提示（仅编辑任务时显示） -->
      <div v-if="isEditing && !isEditingSchedule && scheduleCount > 0" class="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p class="text-xs text-blue-700 dark:text-blue-300">
          该任务已在 {{ scheduleCount }} 天安排日程
        </p>
      </div>

      <!-- 提示（新建任务） -->
      <div v-if="!isEditing" class="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p class="text-xs text-blue-700 dark:text-blue-300">
          新建的任务默认为"未计划"状态，可稍后从任务列表拖入日历安排时间
        </p>
      </div>

      <!-- 颜色 -->
      <ColorPicker v-model="color" />

      <!-- 备注 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">备注</label>
        <textarea
          v-model="note"
          placeholder="添加备注..."
          rows="3"
          class="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all duration-200"
        />
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="p-4 border-t border-gray-200/50 dark:border-gray-700/50 flex gap-3">
      <!-- 编辑日程时：显示两个删除按钮 -->
      <template v-if="isEditingSchedule">
        <button
          @click="handleDeleteSchedule"
          class="flex items-center gap-2 px-3 py-2.5 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-colors btn-apple text-sm"
        >
          <Trash2 class="w-4 h-4" />
          移除此日程
        </button>
        <div class="flex-1" />
        <button
          @click="handleDeleteTask"
          class="flex items-center gap-2 px-3 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors btn-apple text-sm"
        >
          <Trash2 class="w-4 h-4" />
          删除任务
        </button>
      </template>
      
      <!-- 编辑任务时：只显示删除任务按钮 -->
      <template v-else-if="isEditing">
        <button
          @click="handleDeleteTask"
          class="flex items-center gap-2 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors btn-apple"
        >
          <Trash2 class="w-4 h-4" />
          删除
        </button>
        <div class="flex-1" />
      </template>
      
      <!-- 新建时：无删除按钮 -->
      <template v-else>
        <div class="flex-1" />
      </template>
      
      <button
        @click="closePanel"
        class="px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors btn-apple-secondary"
      >
        取消
      </button>
      <button
        @click="handleSave"
        :disabled="!title.trim()"
        class="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-light hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 btn-apple disabled:opacity-50 disabled:cursor-not-allowed"
      >
        保存
      </button>
    </div>
  </div>

  <!-- 删除确认对话框 -->
  <ConfirmDialog
    v-model="showDeleteConfirm"
    :title="deleteType === 'schedule' ? '移除日程' : '删除任务'"
    :message="deleteType === 'schedule' 
      ? '确定要移除该日程吗？任务本身不会被删除。' 
      : '确定要删除这个任务吗？所有关联的日程也会被删除，此操作无法撤销。'"
    confirm-text="确认"
    cancel-text="取消"
    :danger="deleteType === 'task'"
    @confirm="confirmDelete"
  />
</template>
